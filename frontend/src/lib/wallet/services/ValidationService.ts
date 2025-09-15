import { WalletAdapter, NetworkType } from "../types";
import { validateStellarAddress, isNetworkSupported, createLogger } from "../utils";
import { NetworkService } from "./NetworkService";

const logger = createLogger('ValidationService');

export class ValidationService {
  private adapter: WalletAdapter;
  private networkService: NetworkService;

  constructor(adapter: WalletAdapter) {
    this.adapter = adapter;
    this.networkService = new NetworkService(adapter);
  }

  validateAddress(address: string): { isValid: boolean; error?: string } {
    if (!address) {
      return { isValid: false, error: 'Address is required' };
    }

    if (typeof address !== 'string') {
      return { isValid: false, error: 'Address must be a string' };
    }

    if (!validateStellarAddress(address)) {
      return { isValid: false, error: 'Invalid Stellar address format' };
    }

    return { isValid: true };
  }

  async validateWalletInstallation(): Promise<{ isValid: boolean; error?: string }> {
    try {
      const isInstalled = await this.adapter.isInstalled();
      
      if (!isInstalled) {
        return { 
          isValid: false, 
          error: `${this.adapter.name} wallet is not installed` 
        };
      }

      return { isValid: true };
    } catch (error) {
      logger.error('Error validating wallet installation:', error);
      return { 
        isValid: false, 
        error: 'Unable to check wallet installation status' 
      };
    }
  }

  async validateConnection(): Promise<{ isValid: boolean; error?: string }> {
    try {
      // Check if wallet is installed
      const installationCheck = await this.validateWalletInstallation();
      if (!installationCheck.isValid) {
        return installationCheck;
      }

      // Check if wallet is connected
      const isConnected = await this.adapter.isConnected();
      if (!isConnected) {
        return { 
          isValid: false, 
          error: 'Wallet is not connected' 
        };
      }

      // Check if access is allowed
      const isAllowed = await this.adapter.isAllowed();
      if (!isAllowed) {
        return { 
          isValid: false, 
          error: 'Wallet access is not allowed' 
        };
      }

      return { isValid: true };
    } catch (error) {
      logger.error('Error validating connection:', error);
      return { 
        isValid: false, 
        error: 'Unable to validate wallet connection' 
      };
    }
  }

  async validateNetwork(requiredNetwork?: NetworkType): Promise<{ isValid: boolean; error?: string; networkType?: NetworkType }> {
    try {
      const currentNetwork = await this.networkService.getCurrentNetwork();
      
      if (!isNetworkSupported(currentNetwork.networkPassphrase)) {
        return { 
          isValid: false, 
          error: 'Current network is not supported' 
        };
      }

      const networkType = await this.networkService.detectNetwork();
      if (!networkType) {
        return { 
          isValid: false, 
          error: 'Unable to detect network type' 
        };
      }

      if (requiredNetwork && networkType !== requiredNetwork) {
        return { 
          isValid: false, 
          error: `Network mismatch. Required: ${requiredNetwork}, Current: ${networkType}`,
          networkType 
        };
      }

      return { isValid: true, networkType };
    } catch (error) {
      logger.error('Error validating network:', error);
      return { 
        isValid: false, 
        error: 'Unable to validate network' 
      };
    }
  }

  async validateTransaction(xdr: string): Promise<{ isValid: boolean; error?: string }> {
    if (!xdr) {
      return { isValid: false, error: 'Transaction XDR is required' };
    }

    if (typeof xdr !== 'string') {
      return { isValid: false, error: 'Transaction XDR must be a string' };
    }

    try {
      // Basic XDR validation - check if it's base64
      const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
      if (!base64Regex.test(xdr)) {
        return { isValid: false, error: 'Invalid XDR format' };
      }

      return { isValid: true };
    } catch (error) {
      logger.error('Error validating transaction:', error);
      return { 
        isValid: false, 
        error: 'Invalid transaction format' 
      };
    }
  }

  async validateFullWalletState(): Promise<{ 
    isValid: boolean; 
    errors: string[];
    warnings: string[];
    networkType?: NetworkType;
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];
    let networkType: NetworkType | undefined;

    try {
      // Validate installation
      const installationResult = await this.validateWalletInstallation();
      if (!installationResult.isValid) {
        errors.push(installationResult.error!);
        return { isValid: false, errors, warnings };
      }

      // Validate connection
      const connectionResult = await this.validateConnection();
      if (!connectionResult.isValid) {
        errors.push(connectionResult.error!);
        return { isValid: false, errors, warnings };
      }

      // Validate network
      const networkResult = await this.validateNetwork();
      if (!networkResult.isValid) {
        if (networkResult.error?.includes('mismatch')) {
          warnings.push(networkResult.error);
        } else {
          errors.push(networkResult.error!);
        }
      } else {
        networkType = networkResult.networkType;
      }

      // Validate account access
      try {
        const account = await this.adapter.getAccount();
        if (!account) {
          errors.push('Unable to retrieve account information');
        } else {
          const addressValidation = this.validateAddress(account.address);
          if (!addressValidation.isValid) {
            errors.push(`Invalid account address: ${addressValidation.error}`);
          }
        }
      } catch (error) {
        errors.push('Failed to access account information');
      }

      const isValid = errors.length === 0;
      
      logger.debug('Full wallet validation completed', { 
        isValid, 
        errorsCount: errors.length, 
        warningsCount: warnings.length 
      });

      return { isValid, errors, warnings, networkType };
    } catch (error) {
      logger.error('Error in full wallet validation:', error);
      errors.push('Unexpected error during wallet validation');
      return { isValid: false, errors, warnings };
    }
  }
}