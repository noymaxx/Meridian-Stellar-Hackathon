import { useState, useCallback, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { 
  WalletType, 
  ConnectionStatus,
  WalletState as CoreWalletState,
  WalletActions as CoreWalletActions,
  WalletAdapter
} from "@/lib/wallet";
import { 
  useWalletConnection,
  useWalletNetwork, 
  useWalletBalance
} from "@/lib/wallet/hooks";
import { createWalletAdapter } from "@/lib/wallet/adapters";
import { createLogger } from "@/lib/wallet/utils";

const logger = createLogger('useStellarWallet');

export interface WalletState {
  isConnected: boolean;
  address: string;
  isConnecting: boolean;
  isInstalled: boolean;
  network: string;
  balance?: string;
  showInstallModal: boolean;
}

export interface WalletActions {
  connect: () => Promise<void>;
  disconnect: () => void;
  checkInstallation: () => boolean;
  getBalance: () => Promise<string | undefined>;
  refreshBalance: () => Promise<void>;
  signTransaction: (xdr: string) => Promise<string>;
  closeInstallModal: () => void;
  retryInstallation: () => void;
}

export function useStellarWallet(): WalletState & WalletActions {
  // Core wallet connection management
  const {
    status,
    isConnected: coreIsConnected,
    isConnecting: coreIsConnecting,
    account,
    selectedWallet,
    availableWallets,
    error: connectionError,
    connect: coreConnect,
    disconnect: coreDisconnect,
    retryConnection,
    checkConnection
  } = useWalletConnection();

  // Get current adapter
  const adapter = selectedWallet ? createWalletAdapter(selectedWallet.type) : null;

  // Network management
  const {
    network: networkInfo,
    networkType,
    refreshNetwork,
    validateNetwork,
    getExplorerUrl
  } = useWalletNetwork(adapter);

  // Balance management (manual refresh only)
  const {
    balance: rawBalance,
    formattedBalance,
    isLoading: isLoadingBalance,
    refreshBalance,
    startMonitoring,
    stopMonitoring
  } = useWalletBalance(adapter, account?.address || null, networkInfo, false);

  // Legacy state management for backward compatibility
  const [showInstallModal, setShowInstallModal] = useState(false);

  // Legacy compatibility methods
  const checkInstallation = useCallback((): boolean => {
    const freighterWallet = availableWallets.find(w => w.type === WalletType.FREIGHTER);
    return freighterWallet?.isInstalled || false;
  }, [availableWallets]);
  const getBalance = useCallback(async (): Promise<string | undefined> => {
    if (!coreIsConnected || !account) {
      return undefined;
    }
    
    try {
      await refreshBalance();
      return rawBalance || undefined;
    } catch (error) {
      logger.error('Failed to get balance:', error);
      return undefined;
    }
  }, [coreIsConnected, account, refreshBalance, rawBalance]);

  const connect = useCallback(async () => {
    try {
      const freighterWallet = availableWallets.find(w => w.type === WalletType.FREIGHTER);
      
      if (!freighterWallet?.isInstalled) {
        logger.debug('Freighter not installed, showing install modal');
        setShowInstallModal(true);
        return;
      }

      await coreConnect(WalletType.FREIGHTER);
      
      // Show success message based on network
      if (networkInfo && account) {
        toast({
          title: "Wallet Connected",
          description: `Connected to ${networkInfo.name} successfully!`,
        });
      }
      
    } catch (error: unknown) {
      logger.error('Connection failed:', error);
      
      let errorMessage = "Failed to connect wallet. Please try again.";
      
      if ((error as any)?.message?.includes("User declined") || (error as any)?.message?.includes("rejected")) {
        errorMessage = "Connection cancelled by user.";
      } else if ((error as any)?.message?.includes("not installed")) {
        errorMessage = "Freighter wallet not found. Please install it first.";
        setShowInstallModal(true);
      }

      toast({
        title: "Connection Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [availableWallets, coreConnect, networkInfo, account]);

  const disconnect = useCallback(async () => {
    try {
      await coreDisconnect();
      
      toast({
        title: "Wallet Disconnected",
        description: "Wallet has been disconnected successfully",
      });
    } catch (error) {
      logger.error('Disconnect failed:', error);
    }
  }, [coreDisconnect]);

  const signTransaction = useCallback(async (xdr: string): Promise<string> => {
    if (!coreIsConnected || !adapter || !account || !networkInfo) {
      throw new Error("Wallet not connected");
    }

    try {
      console.log('🔗 [useStellarWallet] Signing transaction with options:', {
        networkType: networkInfo.type,
        networkPassphrase: networkInfo.networkPassphrase,
        accountToSign: account.address,
        xdrLength: xdr.length
      });

      // Use explicit testnet/mainnet for Freighter compatibility
      const freighterNetwork = networkInfo.type === 'testnet' ? 'testnet' : 'mainnet';
      console.log('🔗 [useStellarWallet] Using Freighter network:', freighterNetwork);

      const result = await adapter.signTransaction(xdr, {
        network: freighterNetwork, // Pass the simplified network string
        networkPassphrase: networkInfo.networkPassphrase, // Pass the full passphrase
        accountToSign: account.address,
      });

      console.log('🔗 [useStellarWallet] Freighter sign result:', {
        success: result.success,
        hasSignedTransaction: !!result.signedTransaction,
        error: result.error
      });

      if (!result.success || !result.signedTransaction) {
        throw result.error || new Error('Failed to sign transaction');
      }

      return result.signedTransaction;
    } catch (error: unknown) {
      logger.error('Transaction signing error:', error);
      
      if ((error as any)?.message?.includes("User declined") || (error as any)?.message?.includes("rejected")) {
        throw new Error("Transaction cancelled by user");
      }
      
      throw new Error("Failed to sign transaction");
    }
  }, [coreIsConnected, adapter, account, networkInfo]);

  // Handle connection errors
  useEffect(() => {
    if (connectionError) {
      logger.error('Connection error:', connectionError);
      
      if (connectionError.code === 'WALLET_NOT_INSTALLED') {
        setShowInstallModal(true);
      }
    }
  }, [connectionError]);

  const closeInstallModal = useCallback(() => {
    setShowInstallModal(false);
  }, []);

  const retryInstallation = useCallback(async () => {
    setShowInstallModal(false);
    
    // Check if wallet is now available
    const freighterWallet = availableWallets.find(w => w.type === WalletType.FREIGHTER);
    
    if (freighterWallet?.isInstalled) {
      logger.debug('Freighter now available, attempting connection');
      await connect();
    } else {
      logger.debug('Freighter still not available');
      setShowInstallModal(true);
    }
  }, [availableWallets, connect]);
  // Legacy compatibility values
  const isConnected = coreIsConnected;
  const address = account?.address || "";
  const isConnecting = coreIsConnecting;
  const isInstalled = checkInstallation();
  const network = networkInfo?.networkPassphrase || "";
  const balance = formattedBalance || undefined;

  return {
    isConnected,
    address,
    isConnecting,
    isInstalled,
    network,
    balance,
    showInstallModal,
    connect,
    disconnect,
    checkInstallation,
    getBalance,
    refreshBalance,
    signTransaction,
    closeInstallModal,
    retryInstallation,
  };
}