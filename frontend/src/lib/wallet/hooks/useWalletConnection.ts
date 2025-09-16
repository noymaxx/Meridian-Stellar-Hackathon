import { useState, useCallback, useEffect } from 'react';
import { 
  ConnectionStatus, 
  WalletType, 
  WalletAccount, 
  WalletInfo, 
  WalletError,
  WalletAdapter 
} from '../types';
import { createWalletAdapter } from '../adapters';
import { ValidationService, StorageService } from '../services';
import { WALLET_INFO } from '../config';
import { createLogger } from '../utils';

const logger = createLogger('useWalletConnection');

interface UseWalletConnectionReturn {
  // State
  status: ConnectionStatus;
  isConnected: boolean;
  isConnecting: boolean;
  account: WalletAccount | null;
  selectedWallet: WalletInfo | null;
  availableWallets: WalletInfo[];
  error: WalletError | null;
  
  // Actions
  connect: (walletType?: WalletType) => Promise<void>;
  disconnect: () => Promise<void>;
  retryConnection: () => Promise<void>;
  checkConnection: () => Promise<boolean>;
}

export function useWalletConnection(): UseWalletConnectionReturn {
  const [status, setStatus] = useState<ConnectionStatus>(ConnectionStatus.DISCONNECTED);
  const [account, setAccount] = useState<WalletAccount | null>(null);
  const [selectedWallet, setSelectedWallet] = useState<WalletInfo | null>(null);
  const [availableWallets, setAvailableWallets] = useState<WalletInfo[]>([]);
  const [error, setError] = useState<WalletError | null>(null);
  const [adapter, setAdapter] = useState<WalletAdapter | null>(null);

  const isConnected = status === ConnectionStatus.CONNECTED;
  const isConnecting = status === ConnectionStatus.CONNECTING;

  const checkWalletAvailability = useCallback(async () => {
    const wallets: WalletInfo[] = [];
    
    for (const [type, info] of Object.entries(WALLET_INFO)) {
      try {
        const walletAdapter = createWalletAdapter(type as WalletType);
        const isInstalled = await walletAdapter.isInstalled();
        
        wallets.push({
          ...info,
          isInstalled
        });
      } catch (error) {
        logger.error(`Error checking wallet ${type}:`, error);
        wallets.push({
          ...info,
          isInstalled: false
        });
      }
    }
    
    setAvailableWallets(wallets);
    return wallets;
  }, []);

  const connect = useCallback(async (walletType: WalletType = WalletType.FREIGHTER) => {
    try {
      setStatus(ConnectionStatus.CONNECTING);
      setError(null);
      
      logger.debug(`Attempting to connect to ${walletType}`);
      
      const walletAdapter = createWalletAdapter(walletType);
      const validationService = new ValidationService(walletAdapter);
      
      // Validate wallet installation
      const installationCheck = await validationService.validateWalletInstallation();
      if (!installationCheck.isValid) {
        throw new Error(installationCheck.error);
      }
      
      // Attempt connection
      const result = await walletAdapter.connect();
      
      if (!result.success || !result.account) {
        throw result.error || new Error('Failed to connect to wallet');
      }
      
      setAdapter(walletAdapter);
      setAccount(result.account);
      setSelectedWallet({
        ...WALLET_INFO[walletType],
        isInstalled: true
      });
      setStatus(ConnectionStatus.CONNECTED);
      
      // Save connection data to localStorage
      if (StorageService.isStorageAvailable() && result.account) {
        try {
          StorageService.saveWalletConnection({
            walletType,
            address: result.account.address,
            connectedAt: Date.now(),
            network: result.account.network || 'testnet'
          });
          
          logger.debug('Wallet connection saved to localStorage');
        } catch (error) {
          logger.warn('Failed to save wallet connection:', error);
          // Don't fail the connection if storage fails
        }
      }
      
      logger.debug('Wallet connected successfully');
    } catch (error: unknown) {
      logger.error('Connection failed:', error);
      setError(error);
      setStatus(ConnectionStatus.ERROR);
      setAccount(null);
      setAdapter(null);
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      logger.debug('Disconnecting wallet');
      
      if (adapter) {
        await adapter.disconnect();
      }
      
      setStatus(ConnectionStatus.DISCONNECTED);
      setAccount(null);
      setSelectedWallet(null);
      setAdapter(null);
      setError(null);
      
      // Clear connection data from localStorage
      if (StorageService.isStorageAvailable()) {
        try {
          StorageService.clearWalletConnection();
          logger.debug('Wallet connection cleared from localStorage');
        } catch (error) {
          logger.warn('Failed to clear wallet connection from localStorage:', error);
          // Don't fail the disconnection if storage fails
        }
      }
      
      logger.debug('Wallet disconnected successfully');
    } catch (error: unknown) {
      logger.error('Disconnect failed:', error);
      setError(error);
    }
  }, [adapter]);

  const retryConnection = useCallback(async () => {
    if (selectedWallet) {
      await connect(selectedWallet.type);
    }
  }, [connect, selectedWallet]);

  const checkConnection = useCallback(async (): Promise<boolean> => {
    if (!adapter) {
      return false;
    }
    
    try {
      const isConnected = await adapter.isConnected();
      
      if (!isConnected && status === ConnectionStatus.CONNECTED) {
        // Connection was lost
        setStatus(ConnectionStatus.DISCONNECTED);
        setAccount(null);
        setSelectedWallet(null);
        setAdapter(null);
        logger.debug('Connection lost');
      }
      
      return isConnected;
    } catch (error) {
      logger.error('Error checking connection:', error);
      return false;
    }
  }, [adapter, status]);

  // Initialize available wallets on mount
  useEffect(() => {
    checkWalletAvailability();
  }, [checkWalletAvailability]);

  // Restore saved wallet connection on mount
  useEffect(() => {
    const restoreConnection = async () => {
      // Only try to restore if not already connected and storage is available
      if (status !== ConnectionStatus.DISCONNECTED || !StorageService.isStorageAvailable()) {
        return;
      }

      const savedConnection = StorageService.getWalletConnection();
      
      if (!savedConnection) {
        logger.debug('No saved wallet connection found');
        return;
      }

      logger.debug('Attempting to restore wallet connection', {
        walletType: savedConnection.walletType,
        address: savedConnection.address.slice(0, 8) + '...'
      });

      try {
        // Wait for available wallets to be loaded
        await checkWalletAvailability();
        
        // Try to connect with the saved wallet type
        await connect(savedConnection.walletType);
        
        logger.debug('Wallet connection restored successfully');
      } catch (error) {
        logger.warn('Failed to restore wallet connection:', error);
        
        // Clear invalid saved connection
        StorageService.clearWalletConnection();
      }
    };

    // Add small delay to ensure component is fully mounted
    const timeoutId = setTimeout(restoreConnection, 100);
    
    return () => clearTimeout(timeoutId);
  }, [connect, status, checkWalletAvailability]);

  // Periodic connection check
  useEffect(() => {
    if (isConnected) {
      const interval = setInterval(checkConnection, 5000);
      return () => clearInterval(interval);
    }
  }, [isConnected, checkConnection]);

  return {
    // State
    status,
    isConnected,
    isConnecting,
    account,
    selectedWallet,
    availableWallets,
    error,
    
    // Actions
    connect,
    disconnect,
    retryConnection,
    checkConnection
  };
}