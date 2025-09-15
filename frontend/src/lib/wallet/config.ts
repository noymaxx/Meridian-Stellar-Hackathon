import { Networks } from "@stellar/stellar-sdk";
import { NetworkType, NetworkInfo, WalletType, WalletConfig, WalletInfo } from "./types";

// ===========================
// NETWORK CONFIGURATIONS
// ===========================

export const NETWORKS: Record<NetworkType, NetworkInfo> = {
  [NetworkType.TESTNET]: {
    type: NetworkType.TESTNET,
    name: "Testnet",
    networkPassphrase: Networks.TESTNET,
    horizonUrl: "https://horizon-testnet.stellar.org",
    sorobanRpcUrl: "https://soroban-testnet.stellar.org"
  },
  [NetworkType.MAINNET]: {
    type: NetworkType.MAINNET,
    name: "Mainnet", 
    networkPassphrase: Networks.PUBLIC,
    horizonUrl: "https://horizon.stellar.org",
    sorobanRpcUrl: "https://soroban-mainnet.stellar.org"
  }
};

// ===========================
// WALLET CONFIGURATIONS
// ===========================

export const WALLET_INFO: Record<WalletType, Omit<WalletInfo, 'isInstalled'>> = {
  [WalletType.FREIGHTER]: {
    id: 'freighter',
    name: 'Freighter',
    type: WalletType.FREIGHTER,
    downloadUrl: 'https://freighter.app/',
    icon: '🚀'
  }
};

// ===========================
// DEFAULT CONFIGURATION
// ===========================

export const DEFAULT_WALLET_CONFIG: WalletConfig = {
  defaultNetwork: NetworkType.TESTNET,
  autoConnect: true,
  balanceRefreshInterval: 30000, // 30 seconds
  supportedWallets: [WalletType.FREIGHTER]
};

// ===========================
// VALIDATION PATTERNS
// ===========================

export const STELLAR_ADDRESS_PATTERN = /^G[A-Z2-7]{55}$/;

// ===========================
// ERROR MESSAGES
// ===========================

export const ERROR_MESSAGES = {
  WALLET_NOT_INSTALLED: 'Wallet is not installed. Please install it first.',
  CONNECTION_REJECTED: 'Connection was rejected by the user.',
  NETWORK_MISMATCH: 'Wallet is connected to a different network.',
  TRANSACTION_REJECTED: 'Transaction was rejected by the user.',
  INSUFFICIENT_BALANCE: 'Insufficient balance for this transaction.',
  INVALID_ADDRESS: 'Invalid Stellar address format.',
  NETWORK_ERROR: 'Network error occurred. Please try again.',
  UNKNOWN_ERROR: 'An unknown error occurred.'
};

// ===========================
// ENVIRONMENT HELPERS
// ===========================

export const getDefaultNetwork = (): NetworkType => {
  const envNetwork = import.meta.env.VITE_STELLAR_NETWORK as NetworkType;
  return envNetwork === NetworkType.MAINNET ? NetworkType.MAINNET : NetworkType.TESTNET;
};

export const getNetworkConfig = (type: NetworkType): NetworkInfo => {
  return NETWORKS[type];
};

export const getCurrentNetworkConfig = (): NetworkInfo => {
  return getNetworkConfig(getDefaultNetwork());
};