import { NetworkType, NetworkInfo, WalletError, WalletErrorCode } from "./types";
import { STELLAR_ADDRESS_PATTERN, ERROR_MESSAGES, NETWORKS } from "./config";

// ===========================
// ADDRESS VALIDATION & FORMATTING
// ===========================

export const validateStellarAddress = (address: string): boolean => {
  return STELLAR_ADDRESS_PATTERN.test(address);
};

export const formatStellarAddress = (address: string, length: number = 8): string => {
  if (!address || address.length <= length) return address;
  const half = Math.floor(length / 2);
  return `${address.slice(0, half)}...${address.slice(-half)}`;
};

export const formatBalance = (balance: string | number, decimals: number = 2): string => {
  const num = typeof balance === 'string' ? parseFloat(balance) : balance;
  return num.toFixed(decimals);
};

// ===========================
// NETWORK UTILITIES
// ===========================

export const detectNetworkFromPassphrase = (networkPassphrase: string): NetworkType | null => {
  for (const [type, config] of Object.entries(NETWORKS)) {
    if (config.networkPassphrase === networkPassphrase) {
      return type as NetworkType;
    }
  }
  return null;
};

export const getNetworkDisplayName = (networkInfo: NetworkInfo | string): string => {
  if (typeof networkInfo === 'string') {
    // Try to detect from string
    if (networkInfo.toLowerCase().includes('test')) return 'Testnet';
    if (networkInfo.toLowerCase().includes('public') || networkInfo.toLowerCase().includes('main')) return 'Mainnet';
    return 'Custom Network';
  }
  
  return networkInfo.name;
};

export const isNetworkSupported = (networkPassphrase: string): boolean => {
  return detectNetworkFromPassphrase(networkPassphrase) !== null;
};

// ===========================
// ERROR HANDLING UTILITIES
// ===========================

export const createWalletError = (
  code: WalletErrorCode, 
  customMessage?: string, 
  originalError?: Error
): WalletError => {
  const message = customMessage || ERROR_MESSAGES[code] || ERROR_MESSAGES.UNKNOWN_ERROR;
  return new WalletError(code, message, originalError);
};

export const handleWalletError = (error: unknown): WalletError => {
  if (error instanceof WalletError) {
    return error;
  }
  
  if (error instanceof Error) {
    // Map common error messages to wallet error codes
    if (error.message.includes('User declined') || error.message.includes('rejected')) {
      return createWalletError(WalletErrorCode.CONNECTION_REJECTED, error.message, error);
    }
    
    if (error.message.includes('not installed') || error.message.includes('not found')) {
      return createWalletError(WalletErrorCode.WALLET_NOT_INSTALLED, error.message, error);
    }
    
    if (error.message.includes('network') || error.message.includes('Network')) {
      return createWalletError(WalletErrorCode.NETWORK_MISMATCH, error.message, error);
    }
    
    return createWalletError(WalletErrorCode.UNKNOWN_ERROR, error.message, error);
  }
  
  return createWalletError(WalletErrorCode.UNKNOWN_ERROR, 'An unknown error occurred');
};

// ===========================
// LOGGING UTILITIES
// ===========================

export const createLogger = (component: string) => {
  const isDebug = import.meta.env.DEV;
  const logCounts: Map<string, number> = new Map();
  
  const shouldThrottle = (message: string, maxCount: number = 5): boolean => {
    const count = logCounts.get(message) || 0;
    logCounts.set(message, count + 1);
    return count >= maxCount;
  };
  
  return {
    debug: (...args: unknown[]) => {
      if (isDebug) {
        const message = args.join(' ');
        if (!shouldThrottle(message, 3)) {
          console.log(`[${component}]`, ...args);
        }
      }
    },
    info: (...args: unknown[]) => {
      console.info(`[${component}]`, ...args);
    },
    warn: (...args: unknown[]) => {
      console.warn(`[${component}]`, ...args);
    },
    error: (...args: unknown[]) => {
      console.error(`[${component}]`, ...args);
    }
  };
};

// ===========================
// ASYNC UTILITIES
// ===========================

export const withTimeout = <T>(
  promise: Promise<T>, 
  timeoutMs: number = 10000
): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error('Operation timed out')), timeoutMs)
    )
  ]);
};

export const retry = async <T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      if (attempt === maxAttempts) {
        throw lastError;
      }
      
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
  
  throw lastError!;
};

// ===========================
// TYPE GUARDS
// ===========================

export const isValidNetworkType = (value: string): value is NetworkType => {
  return Object.values(NetworkType).includes(value as NetworkType);
};

export const isValidAddress = (address: unknown): address is string => {
  return typeof address === 'string' && validateStellarAddress(address);
};