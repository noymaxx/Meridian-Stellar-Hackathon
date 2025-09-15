// Core types
export * from './types';

// Configuration
export * from './config';

// Utilities
export * from './utils';

// Adapters
export * from './adapters';

// Services
export * from './services';

// Hooks
export * from './hooks';

// Re-export commonly used items for convenience
export { 
  WalletType, 
  NetworkType, 
  ConnectionStatus,
  type WalletState,
  type WalletActions,
  type WalletAdapter,
  type WalletAccount,
  type NetworkInfo
} from './types';

export { 
  DEFAULT_WALLET_CONFIG,
  NETWORKS,
  WALLET_INFO
} from './config';

export {
  validateStellarAddress,
  formatStellarAddress,
  formatBalance,
  createWalletError,
  handleWalletError
} from './utils';