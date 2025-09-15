import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { NetworkInfo, WalletAdapter } from '../types';
import { BalanceService } from '../services';
import { createLogger, formatBalance } from '../utils';

const logger = createLogger('useWalletBalance');

interface UseWalletBalanceReturn {
  // State
  balance: string | null;
  formattedBalance: string | null;
  isLoading: boolean;
  error: Error | null;
  
  // Actions
  refreshBalance: () => Promise<void>;
  startMonitoring: (intervalMs?: number) => void;
  stopMonitoring: () => void;
}

export function useWalletBalance(
  adapter: WalletAdapter | null,
  address: string | null,
  network: NetworkInfo | null,
  autoRefresh: boolean = false
): UseWalletBalanceReturn {
  const [balance, setBalance] = useState<string | null>(null);
  const [formattedBalance, setFormattedBalance] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const balanceService = useMemo(() => 
    adapter ? new BalanceService() : null, 
    [adapter]
  );
  const monitoringRef = useRef<(() => void) | null>(null);

  const refreshBalance = useCallback(async () => {
    if (!balanceService || !address || !network) {
      setBalance(null);
      setFormattedBalance(null);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      logger.debug(`Fetching balance for ${address.slice(0, 8)}...`);
      
      const rawBalance = await balanceService.getBalance(address, network);
      const formatted = formatBalance(rawBalance, 2);
      
      setBalance(rawBalance);
      setFormattedBalance(formatted);
      
      logger.debug('Balance updated:', { raw: rawBalance, formatted });
    } catch (error: unknown) {
      logger.error('Failed to refresh balance:', error);
      setError(error);
      
      // Don't override existing balance on network errors, keep previous value
      if (!balance) {
        setBalance('0');
        setFormattedBalance('0.00');
      }
    } finally {
      setIsLoading(false);
    }
  }, [balanceService, address, network, balance]);

  const startMonitoring = useCallback((intervalMs: number = 30000) => {
    if (!balanceService || !address || !network) {
      return;
    }

    // Stop existing monitoring
    if (monitoringRef.current) {
      monitoringRef.current();
    }

    logger.debug('Starting balance monitoring with interval:', intervalMs);

    const cleanup = balanceService.monitorBalance(
      address,
      network,
      (newBalance) => {
        const formatted = formatBalance(newBalance, 2);
        setBalance(newBalance);
        setFormattedBalance(formatted);
        logger.debug('Balance updated via monitoring:', { raw: newBalance, formatted });
      },
      intervalMs
    );

    cleanup.then((stopFn) => {
      monitoringRef.current = stopFn;
    });
  }, [balanceService, address, network]);

  const stopMonitoring = useCallback(() => {
    if (monitoringRef.current) {
      logger.debug('Stopping balance monitoring');
      monitoringRef.current();
      monitoringRef.current = null;
    }
  }, []);

  // Auto-fetch balance when wallet connects (but only once)
  useEffect(() => {
    if (adapter && address && network && !balance) {
      // Busca o saldo automaticamente quando conecta, mas só se ainda não tiver saldo
      refreshBalance();
    }
  }, [adapter, address, network, balance, refreshBalance]);

  // Cleanup monitoring on unmount
  useEffect(() => {
    return () => {
      stopMonitoring();
    };
  }, [stopMonitoring]);

  return {
    // State
    balance,
    formattedBalance,
    isLoading,
    error,
    
    // Actions
    refreshBalance,
    startMonitoring,
    stopMonitoring
  };
}