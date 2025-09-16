import { Networks } from "@stellar/stellar-sdk";
import type { OracleContractConfig } from "@/types/markets";

export type StellarNetwork = "testnet" | "mainnet";

export interface StellarConfig {
  network: StellarNetwork;
  horizonUrl: string;
  sorobanRpcUrl: string;
  networkPassphrase: string;
  isTestnet: boolean;
  oracleContracts: OracleContractConfig;
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
    return import.meta.env.VITE_STELLAR_SOROBAN_RPC_URL_MAINNET || "https://soroban-rpc.mainnet.stellar.org";
  }
  return import.meta.env.VITE_STELLAR_SOROBAN_RPC_URL_TESTNET || "https://soroban-rpc.testnet.stellar.org";
};

const getNetworkPassphrase = (network: StellarNetwork): string => {
  if (network === "mainnet") {
    return import.meta.env.VITE_STELLAR_NETWORK_PASSPHRASE_MAINNET || Networks.PUBLIC;
  }
  return import.meta.env.VITE_STELLAR_NETWORK_PASSPHRASE_TESTNET || Networks.TESTNET;
};

const getOracleContracts = (network: StellarNetwork): OracleContractConfig => {
  if (network === "mainnet") {
    return {
      stellarDex: import.meta.env.VITE_ORACLE_STELLAR_DEX_MAINNET || 'CALI2BYU2JE6WVRUFYTS6MSBNEHGJ35P4AVCZYF3B6QOE3QKOB2PLE6M',
      externalDexs: import.meta.env.VITE_ORACLE_EXTERNAL_DEXS_MAINNET || 'CAFJZQWSED6YAWZU3GWRTOCNPPCGBN32L7QV43XX5LZLFTK6JLN34DLN',
      fiatRates: import.meta.env.VITE_ORACLE_FIAT_RATES_MAINNET || 'CBKGPWGKSKZF52CFHMTRR23TBWTPMRDIYZ4O2P5VS65BMHYH4DXMCJZC'
    };
  }
  return {
    stellarDex: import.meta.env.VITE_ORACLE_STELLAR_DEX_TESTNET || 'CALI2BYU2JE6WVRUFYTS6MSBNEHGJ35P4AVCZYF3B6QOE3QKOB2PLE6M',
    externalDexs: import.meta.env.VITE_ORACLE_EXTERNAL_DEXS_TESTNET || 'CAFJZQWSED6YAWZU3GWRTOCNPPCGBN32L7QV43XX5LZLFTK6JLN34DLN',
    fiatRates: import.meta.env.VITE_ORACLE_FIAT_RATES_TESTNET || 'CBKGPWGKSKZF52CFHMTRR23TBWTPMRDIYZ4O2P5VS65BMHYH4DXMCJZC'
  };
};

// ===== ORACLE-SPECIFIC CONFIGURATION (ALWAYS MAINNET FOR REAL DATA) =====

const getOracleNetworkConfig = (): StellarNetwork => {
  // Use same network as the app for oracle contracts
  // Testnet has its own oracle contracts with real data
  const forceOracleMainnet = import.meta.env.VITE_ORACLE_FORCE_MAINNET === 'true';
  
  if (forceOracleMainnet) {
    console.log('🔮 Oracle configured to use MAINNET for real price data');
    return 'mainnet';
  }
  
  const currentNetwork = getCurrentNetwork();
  console.log(`🔮 Oracle configured to use ${currentNetwork.toUpperCase()} network (same as app)`);
  return currentNetwork;
};

// Oracle-specific RPC URLs with fallbacks for better reliability
const getOracleRpcUrls = (network: StellarNetwork): string[] => {
  if (network === 'mainnet') {
    return [
      import.meta.env.VITE_STELLAR_SOROBAN_RPC_URL_MAINNET || "https://soroban-rpc.mainnet.stellar.org",
      "https://soroban-rpc.mainnet.stellar.org",
      "https://mainnet.sorobanrpc.com",
      "https://rpc-mainnet.stellar.org"
    ];
  }
  return [
    import.meta.env.VITE_STELLAR_SOROBAN_RPC_URL_TESTNET || "https://soroban-rpc.testnet.stellar.org",
    "https://soroban-rpc.testnet.stellar.org",
    "https://rpc-testnet.stellar.org"
  ];
};

export const getOracleConfig = () => {
  const oracleNetwork = getOracleNetworkConfig();
  const rpcUrls = getOracleRpcUrls(oracleNetwork);
  
  return {
    network: oracleNetwork,
    sorobanRpcUrl: rpcUrls[0], // Primary RPC URL
    fallbackRpcUrls: rpcUrls.slice(1), // Fallback RPC URLs
    networkPassphrase: oracleNetwork === 'mainnet' 
      ? import.meta.env.VITE_STELLAR_NETWORK_PASSPHRASE_MAINNET || Networks.PUBLIC
      : import.meta.env.VITE_STELLAR_NETWORK_PASSPHRASE_TESTNET || Networks.TESTNET,
    oracleContracts: getOracleContracts(oracleNetwork)
  };
};

// Current network configuration
export const CURRENT_NETWORK = getCurrentNetwork();

export const STELLAR_CONFIG: StellarConfig = {
  network: CURRENT_NETWORK,
  horizonUrl: getHorizonUrl(CURRENT_NETWORK),
  sorobanRpcUrl: getSorobanRpcUrl(CURRENT_NETWORK),
  networkPassphrase: getNetworkPassphrase(CURRENT_NETWORK),
  isTestnet: CURRENT_NETWORK === "testnet",
  oracleContracts: getOracleContracts(CURRENT_NETWORK),
};

// Network-specific configurations
export const NETWORK_CONFIGS: Record<StellarNetwork, StellarConfig> = {
  testnet: {
    network: "testnet",
    horizonUrl: getHorizonUrl("testnet"),
    sorobanRpcUrl: getSorobanRpcUrl("testnet"),
    networkPassphrase: getNetworkPassphrase("testnet"),
    isTestnet: true,
    oracleContracts: getOracleContracts("testnet"),
  },
  mainnet: {
    network: "mainnet",
    horizonUrl: getHorizonUrl("mainnet"),
    sorobanRpcUrl: getSorobanRpcUrl("mainnet"),
    networkPassphrase: getNetworkPassphrase("mainnet"),
    isTestnet: false,
    oracleContracts: getOracleContracts("mainnet"),
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