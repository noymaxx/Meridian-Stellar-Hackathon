import { 
  isConnected, 
  isAllowed, 
  requestAccess, 
  getAddress, 
  getNetwork,
  signTransaction as freighterSignTransaction 
} from "@stellar/freighter-api";
import { 
  WalletAdapter, 
  WalletType, 
  ConnectionResult, 
  WalletAccount, 
  NetworkInfo, 
  TransactionResult,
  SignTransactionOptions,
  WalletErrorCode
} from "../types";
import { createWalletError, handleWalletError, detectNetworkFromPassphrase, createLogger } from "../utils";
import { NETWORKS } from "../config";

const logger = createLogger('FreighterAdapter');

export class FreighterAdapter implements WalletAdapter {
  readonly type = WalletType.FREIGHTER;
  readonly name = "Freighter";

  async isInstalled(): Promise<boolean> {
    try {
      return await isConnected();
    } catch (error) {
      logger.debug('Freighter not detected:', error);
      return false;
    }
  }

  async connect(): Promise<ConnectionResult> {
    try {
      logger.debug('Attempting to connect to Freighter...');
      
      const installed = await this.isInstalled();
      if (!installed) {
        const error = createWalletError(WalletErrorCode.WALLET_NOT_INSTALLED);
        return { success: false, error };
      }

      const allowed = await this.isAllowed();
      if (!allowed) {
        return await this.requestAccess();
      }

      const account = await this.getAccount();
      if (!account) {
        const error = createWalletError(WalletErrorCode.UNKNOWN_ERROR, 'Failed to get account information');
        return { success: false, error };
      }

      logger.debug('Successfully connected to Freighter');
      return { success: true, account };
    } catch (error) {
      logger.error('Failed to connect to Freighter:', error);
      const walletError = handleWalletError(error);
      return { success: false, error: walletError };
    }
  }

  async disconnect(): Promise<void> {
    // Freighter doesn't have a programmatic disconnect method
    // The user needs to disconnect manually from the extension
    logger.debug('Disconnect called - user must disconnect manually from Freighter extension');
  }

  async isConnected(): Promise<boolean> {
    try {
      const connected = await isConnected();
      const allowed = await this.isAllowed();
      return connected && allowed;
    } catch (error) {
      logger.debug('Error checking connection status:', error);
      return false;
    }
  }

  async getAccount(): Promise<WalletAccount | null> {
    try {
      const addressResult = await getAddress();
      const networkResult = await getNetwork();
      
      // Extract address from result object
      const address = typeof addressResult === 'string' 
        ? addressResult 
        : addressResult?.address;

      if (!address) {
        logger.error('Failed to get address from Freighter');
        return null;
      }

      // Extract network passphrase from result object
      const networkPassphrase = typeof networkResult === 'string'
        ? networkResult
        : networkResult?.networkPassphrase;

      if (!networkPassphrase) {
        logger.error('Failed to get network from Freighter');
        return null;
      }

      const network = await this.getNetwork();
      
      const account: WalletAccount = {
        address,
        network
      };

      logger.debug('Retrieved account:', { address: address.slice(0, 8) + '...', network: network.name });
      return account;
    } catch (error) {
      logger.error('Failed to get account:', error);
      return null;
    }
  }

  async getNetwork(): Promise<NetworkInfo> {
    try {
      const networkResult = await getNetwork();
      
      // Extract network passphrase from result object
      const networkPassphrase = typeof networkResult === 'string'
        ? networkResult
        : networkResult?.networkPassphrase;

      if (!networkPassphrase) {
        throw new Error('Failed to get network passphrase from Freighter');
      }

      const networkType = detectNetworkFromPassphrase(networkPassphrase);
      if (!networkType) {
        throw new Error(`Unsupported network: ${networkPassphrase}`);
      }

      return NETWORKS[networkType];
    } catch (error) {
      logger.error('Failed to get network:', error);
      throw handleWalletError(error);
    }
  }

  async isAllowed(): Promise<boolean> {
    try {
      return await isAllowed();
    } catch (error) {
      logger.debug('Error checking if allowed:', error);
      return false;
    }
  }

  async requestAccess(): Promise<ConnectionResult> {
    try {
      logger.debug('Requesting access to Freighter...');
      
      const result = await requestAccess();
      
      if (result.error) {
        const error = createWalletError(WalletErrorCode.CONNECTION_REJECTED, result.error);
        return { success: false, error };
      }

      const account = await this.getAccount();
      if (!account) {
        const error = createWalletError(WalletErrorCode.UNKNOWN_ERROR, 'Failed to get account after access granted');
        return { success: false, error };
      }

      logger.debug('Access granted and account retrieved');
      return { success: true, account };
    } catch (error) {
      logger.error('Failed to request access:', error);
      const walletError = handleWalletError(error);
      return { success: false, error: walletError };
    }
  }

  async signTransaction(xdr: string, options?: SignTransactionOptions): Promise<TransactionResult> {
    try {
      logger.debug('Signing transaction...');
      
      const signOptions = {
        network: options?.network,
        accountToSign: options?.accountToSign
      };

      const result = await freighterSignTransaction(xdr, signOptions);
      
      if (result.error) {
        const error = createWalletError(WalletErrorCode.TRANSACTION_REJECTED, result.error);
        return { success: false, error };
      }

      logger.debug('Transaction signed successfully');
      return { 
        success: true, 
        signedTransaction: result.signedTransaction 
      };
    } catch (error) {
      logger.error('Failed to sign transaction:', error);
      const walletError = handleWalletError(error);
      return { success: false, error: walletError };
    }
  }

  async getBalance(address: string): Promise<string> {
    try {
      // This would typically require a Stellar SDK call to Horizon
      // For now, return a placeholder - this will be handled by BalanceService
      logger.debug('Balance fetching delegated to BalanceService');
      return '0';
    } catch (error) {
      logger.error('Failed to get balance:', error);
      throw handleWalletError(error);
    }
  }
}