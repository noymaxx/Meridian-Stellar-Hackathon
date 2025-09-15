import { useState, useCallback, useEffect, useMemo } from 'react';
import { NetworkType, NetworkInfo, WalletAdapter } from '../types';
import { NetworkService } from '../services';
import { createLogger } from '../utils';

const logger = createLogger('useWalletNetwork');

interface UseWalletNetworkReturn {
  // State
  network: NetworkInfo | null;
  networkType: NetworkType | null;
  isLoading: boolean;
  error: Error | null;
  
  // Actions
  refreshNetwork: () => Promise<void>;
  validateNetwork: (required?: NetworkType) => Promise<boolean>;
  getExplorerUrl: (address: string) => string | null;
}

export function useWalletNetwork(adapter: WalletAdapter | null): UseWalletNetworkReturn {
  const [network, setNetwork] = useState<NetworkInfo | null>(null);
  const [networkType, setNetworkType] = useState<NetworkType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const networkService = useMemo(() => 
    adapter ? new NetworkService(adapter) : null, 
    [adapter]
  );

  const refreshNetwork = useCallback(async () => {
    if (!networkService) {
      setNetwork(null);
      setNetworkType(null);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      logger.debug('Refreshing network information');
      
      const currentNetwork = await networkService.getCurrentNetwork();
      const detectedType = await networkService.detectNetwork();
      
      setNetwork(currentNetwork);
      setNetworkType(detectedType);
      
      logger.debug('Network refreshed:', { 
        network: currentNetwork.name, 
        type: detectedType 
      });
    } catch (error: unknown) {
      logger.error('Failed to refresh network:', error);
      setError(error);
      setNetwork(null);
      setNetworkType(null);
    } finally {
      setIsLoading(false);
    }
  }, [networkService]);

  const validateNetwork = useCallback(async (requiredNetwork?: NetworkType): Promise<boolean> => {
    if (!networkService || !networkType) {
      return false;
    }

    try {
      if (requiredNetwork) {
        const isCompatible = await networkService.validateNetworkCompatibility(requiredNetwork);
        logger.debug('Network validation:', { 
          required: requiredNetwork, 
          current: networkType, 
          compatible: isCompatible 
        });
        return isCompatible;
      }
      
      return true;
    } catch (error) {
      logger.error('Network validation failed:', error);
      return false;
    }
  }, [networkService, networkType]);

  const getExplorerUrl = useCallback((address: string): string | null => {
    if (!networkService || !network) {
      return null;
    }

    try {
      return networkService.getExplorerUrl(address, network);
    } catch (error) {
      logger.error('Failed to get explorer URL:', error);
      return null;
    }
  }, [networkService, network]);

  // Refresh network when adapter changes
  useEffect(() => {
    if (adapter) {
      refreshNetwork();
    } else {
      setNetwork(null);
      setNetworkType(null);
      setError(null);
    }
  }, [adapter, refreshNetwork]);

  return {
    // State
    network,
    networkType,
    isLoading,
    error,
    
    // Actions
    refreshNetwork,
    validateNetwork,
    getExplorerUrl
  };
}