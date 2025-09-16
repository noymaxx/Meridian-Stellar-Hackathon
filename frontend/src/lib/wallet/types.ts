// ===========================
// WALLET TYPES & INTERFACES
// ===========================

export enum WalletType {
  FREIGHTER = 'freighter',
  // Future wallets can be added here
  // METAMASK = 'metamask',
  // WALLET_CONNECT = 'walletconnect'
}

export enum NetworkType {
  TESTNET = 'testnet',
  MAINNET = 'mainnet'
}

export enum ConnectionStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  ERROR = 'error'
}

// ===========================
// CORE WALLET INTERFACES
// ===========================

export interface WalletInfo {
  id: string;
  name: string;
  type: WalletType;
  icon?: string;
  downloadUrl?: string;
  isInstalled: boolean;
}

export interface NetworkInfo {
  type: NetworkType;
  name: string;
  networkPassphrase: string;
  horizonUrl: string;
  sorobanRpcUrl: string;
}

export interface WalletAccount {
  address: string;
  network: NetworkInfo;
  balance?: string;
}

export interface ConnectionResult {
  success: boolean;
  account?: WalletAccount;
  error?: WalletError;
}

export interface TransactionResult {
  success: boolean;
  signedTransaction?: string;
  error?: WalletError;
}

// ===========================
// WALLET ADAPTER INTERFACE
// ===========================

export interface WalletAdapter {
  readonly type: WalletType;
  readonly name: string;
  
  // Detection
  isInstalled(): Promise<boolean>;
  
  // Connection Management
  connect(): Promise<ConnectionResult>;
  disconnect(): Promise<void>;
  isConnected(): Promise<boolean>;
  
  // Account & Network
  getAccount(): Promise<WalletAccount | null>;
  getNetwork(): Promise<NetworkInfo>;
  
  // Permissions
  isAllowed(): Promise<boolean>;
  requestAccess(): Promise<ConnectionResult>;
  
  // Transactions
  signTransaction(xdr: string, options?: SignTransactionOptions): Promise<TransactionResult>;
  
  // Balance
  getBalance(address: string): Promise<string>;
}

// ===========================
// OPTIONS & CONFIGURATIONS
// ===========================

export interface SignTransactionOptions {
  network?: string;
  networkPassphrase?: string;
  accountToSign?: string;
}

export interface WalletConfig {
  defaultNetwork: NetworkType;
  autoConnect: boolean;
  balanceRefreshInterval: number;
  supportedWallets: WalletType[];
}

// ===========================
// HOOKS INTERFACES
// ===========================

export interface WalletState {
  // Connection
  status: ConnectionStatus;
  isConnected: boolean;
  isConnecting: boolean;
  
  // Account
  account: WalletAccount | null;
  address: string;
  
  // Network
  network: NetworkInfo | null;
  
  // Balance
  balance: string | null;
  isLoadingBalance: boolean;
  
  // Wallet Info
  selectedWallet: WalletInfo | null;
  availableWallets: WalletInfo[];
  
  // UI States
  showInstallModal: boolean;
  showNetworkModal: boolean;
}

export interface WalletActions {
  // Connection
  connect(walletType?: WalletType): Promise<void>;
  disconnect(): Promise<void>;
  
  // Network
  switchNetwork(network: NetworkType): Promise<void>;
  
  // Balance
  refreshBalance(): Promise<void>;
  
  // Transactions
  signTransaction(xdr: string): Promise<string>;
  
  // UI Actions
  closeInstallModal(): void;
  closeNetworkModal(): void;
  retryConnection(): Promise<void>;
}

// ===========================
// ERROR HANDLING
// ===========================

export enum WalletErrorCode {
  WALLET_NOT_INSTALLED = 'WALLET_NOT_INSTALLED',
  CONNECTION_REJECTED = 'CONNECTION_REJECTED',
  NETWORK_MISMATCH = 'NETWORK_MISMATCH',
  TRANSACTION_REJECTED = 'TRANSACTION_REJECTED',
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export class WalletError extends Error {
  constructor(
    public code: WalletErrorCode,
    message: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'WalletError';
  }
}

// ===========================
// UTILITY TYPES
// ===========================

export type WalletEventHandler<T = unknown> = (data: T) => void;

export interface WalletEvents {
  onConnect: WalletEventHandler<WalletAccount>;
  onDisconnect: WalletEventHandler<void>;
  onNetworkChange: WalletEventHandler<NetworkInfo>;
  onBalanceChange: WalletEventHandler<string>;
  onError: WalletEventHandler<WalletError>;
}