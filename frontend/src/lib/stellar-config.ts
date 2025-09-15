import { Networks } from "@stellar/stellar-sdk";

export type StellarNetwork = "testnet" | "mainnet";

export interface StellarConfig {
  network: StellarNetwork;
  horizonUrl: string;
  sorobanRpcUrl: string;
  networkPassphrase: string;
  isTestnet: boolean;
}

// Get environment variables with fallbacks
const getCurrentNetwork = (): StellarNetwork => {
  const network = import.meta.env.VITE_STELLAR_NETWORK as StellarNetwork;
  return network === "mainnet" ? "mainnet" : "testnet";
};

const getHorizonUrl = (network: StellarNetwork): string => {
  if (network === "mainnet") {
    return import.meta.env.VITE_STELLAR_HORIZON_URL_MAINNET || "https://horizon.stellar.org";
  }
  return import.meta.env.VITE_STELLAR_HORIZON_URL_TESTNET || "https://horizon-testnet.stellar.org";
};

const getSorobanRpcUrl = (network: StellarNetwork): string => {
  if (network === "mainnet") {
    return import.meta.env.VITE_STELLAR_SOROBAN_RPC_URL_MAINNET || "https://soroban-mainnet.stellar.org";
  }
  return import.meta.env.VITE_STELLAR_SOROBAN_RPC_URL_TESTNET || "https://soroban-testnet.stellar.org";
};

const getNetworkPassphrase = (network: StellarNetwork): string => {
  if (network === "mainnet") {
    return import.meta.env.VITE_STELLAR_NETWORK_PASSPHRASE_MAINNET || Networks.PUBLIC;
  }
  return import.meta.env.VITE_STELLAR_NETWORK_PASSPHRASE_TESTNET || Networks.TESTNET;
};

// Current network configuration
export const CURRENT_NETWORK = getCurrentNetwork();

export const STELLAR_CONFIG: StellarConfig = {
  network: CURRENT_NETWORK,
  horizonUrl: getHorizonUrl(CURRENT_NETWORK),
  sorobanRpcUrl: getSorobanRpcUrl(CURRENT_NETWORK),
  networkPassphrase: getNetworkPassphrase(CURRENT_NETWORK),
  isTestnet: CURRENT_NETWORK === "testnet",
};

// Network-specific configurations
export const NETWORK_CONFIGS: Record<StellarNetwork, StellarConfig> = {
  testnet: {
    network: "testnet",
    horizonUrl: getHorizonUrl("testnet"),
    sorobanRpcUrl: getSorobanRpcUrl("testnet"),
    networkPassphrase: getNetworkPassphrase("testnet"),
    isTestnet: true,
  },
  mainnet: {
    network: "mainnet",
    horizonUrl: getHorizonUrl("mainnet"),
    sorobanRpcUrl: getSorobanRpcUrl("mainnet"),
    networkPassphrase: getNetworkPassphrase("mainnet"),
    isTestnet: false,
  },
};

// Helper functions
export const formatStellarAddress = (address: string): string => {
  if (address.length <= 8) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
};

export const validateStellarAddress = (address: string): boolean => {
  // Basic Stellar address validation
  return /^G[A-Z2-7]{55}$/.test(address);
};

export const getExplorerUrl = (address: string, network: StellarNetwork = CURRENT_NETWORK): string => {
  const baseUrl = network === "mainnet" 
    ? "https://stellar.expert/explorer/public" 
    : "https://stellar.expert/explorer/testnet";
  return `${baseUrl}/account/${address}`;
};

// App configuration
export const APP_CONFIG = {
  name: import.meta.env.VITE_APP_NAME || "RWA Lending Protocol",
  version: import.meta.env.VITE_APP_VERSION || "1.0.0",
};

// Freighter wallet configuration
export const FREIGHTER_CONFIG = {
  id: "freighter",
  name: "Freighter",
  downloadUrl: "https://freighter.app/",
  chromeWebStoreUrl: "https://chromewebstore.google.com/detail/freighter/bcacfldlkkdogcmkkibnjlakofdplcbk",
};