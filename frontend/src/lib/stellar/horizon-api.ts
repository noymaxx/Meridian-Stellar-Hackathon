import { Horizon, Asset, AccountResponse, TransactionRecord, OperationRecord } from '@stellar/stellar-sdk';
import { STELLAR_CONFIG } from '@/lib/stellar-config';

// Types for our wallet data
export interface WalletAsset {
  asset_type: string;
  asset_code?: string;
  asset_issuer?: string;
  balance: string;
  limit?: string;
  buying_liabilities: string;
  selling_liabilities: string;
  is_authorized?: boolean;
  is_authorized_to_maintain_liabilities?: boolean;
  sponsor?: string;
  // Custom fields for RWA context
  isRWA?: boolean;
  rwaType?: 'treasury' | 'corporate-bond' | 'real-estate' | 'commodity' | 'other';
  displayName?: string;
  usdValue?: number;
}

export interface WalletTransaction {
  id: string;
  hash: string;
  ledger: number;
  created_at: string;
  source_account: string;
  fee_account: string;
  fee_charged: string;
  operation_count: number;
  successful: boolean;
  memo?: string;
  memo_type?: string;
  // Operations summary for RWA context
  operationType?: string;
  operationSummary?: string;
  involvedAssets?: string[];
  amountMoved?: string;
}

export interface WalletBalance {
  totalUSD: number;
  xlmBalance: number;
  rwaAssets: WalletAsset[];
  stablecoins: WalletAsset[];
  otherAssets: WalletAsset[];
}

class HorizonService {
  private server: Horizon.Server;

  constructor() {
    this.server = new Horizon.Server(STELLAR_CONFIG.horizonUrl);
  }

  /**
   * Get account details including all balances
   */
  async getAccountData(address: string): Promise<AccountResponse> {
    try {
      const account = await this.server.loadAccount(address);
      return account;
    } catch (error) {
      throw new Error(`Failed to load account ${address}: ${error}`);
    }
  }

  /**
   * Get all assets for a wallet with RWA categorization
   */
  async getWalletAssets(address: string): Promise<WalletAsset[]> {
    try {
      const account = await this.getAccountData(address);
      
      const assets: WalletAsset[] = account.balances.map((balance: any) => {
        const asset: WalletAsset = {
          asset_type: balance.asset_type,
          asset_code: balance.asset_code,
          asset_issuer: balance.asset_issuer,
          balance: balance.balance,
          limit: balance.limit,
          buying_liabilities: balance.buying_liabilities,
          selling_liabilities: balance.selling_liabilities,
          is_authorized: balance.is_authorized,
          is_authorized_to_maintain_liabilities: balance.is_authorized_to_maintain_liabilities,
          sponsor: balance.sponsor,
        };

        // Categorize RWA assets based on asset codes and known issuers
        this.categorizeRWAAsset(asset);

        return asset;
      });

      return assets;
    } catch (error) {
      throw new Error(`Failed to get wallet assets: ${error}`);
    }
  }

  /**
   * Get wallet balance categorized by asset type
   */
  async getWalletBalance(address: string): Promise<WalletBalance> {
    try {
      const assets = await this.getWalletAssets(address);
      
      const xlmAsset = assets.find(a => a.asset_type === 'native');
      const xlmBalance = xlmAsset ? parseFloat(xlmAsset.balance) : 0;

      const rwaAssets = assets.filter(a => a.isRWA);
      const stablecoins = assets.filter(a => this.isStablecoin(a));
      const otherAssets = assets.filter(a => !a.isRWA && !this.isStablecoin(a) && a.asset_type !== 'native');

      // TODO: Calculate USD values using price oracles
      const totalUSD = 0; // Will be calculated with real prices

      return {
        totalUSD,
        xlmBalance,
        rwaAssets,
        stablecoins,
        otherAssets,
      };
    } catch (error) {
      throw new Error(`Failed to get wallet balance: ${error}`);
    }
  }

  /**
   * Get recent transactions for an account
   */
  async getWalletTransactions(address: string, limit: number = 20): Promise<WalletTransaction[]> {
    try {
      const transactions = await this.server
        .transactions()
        .forAccount(address)
        .order('desc')
        .limit(limit)
        .call();

      const processedTransactions: WalletTransaction[] = [];

      for (const tx of transactions.records) {
        // Get operations for this transaction to understand what happened
        const operations = await this.server
          .operations()
          .forTransaction(tx.id)
          .call();

        const transaction: WalletTransaction = {
          id: tx.id,
          hash: tx.hash,
          ledger: tx.ledger_attr,
          created_at: tx.created_at,
          source_account: tx.source_account,
          fee_account: tx.fee_account,
          fee_charged: tx.fee_charged,
          operation_count: tx.operation_count,
          successful: tx.successful,
          memo: tx.memo,
          memo_type: tx.memo_type,
        };

        // Process operations to get summary
        this.processTransactionOperations(transaction, operations.records);
        processedTransactions.push(transaction);
      }

      return processedTransactions;
    } catch (error) {
      throw new Error(`Failed to get wallet transactions: ${error}`);
    }
  }

  /**
   * Check if user has any SRWA tokens created by them
   */
  async getUserCreatedTokens(address: string): Promise<WalletAsset[]> {
    try {
      // This would check for tokens where the user is the issuer
      // For now, we'll return assets that look like SRWA tokens
      const assets = await this.getWalletAssets(address);
      return assets.filter(asset => 
        asset.isRWA || 
        (asset.asset_code && (
          asset.asset_code.includes('SRWA') ||
          asset.asset_code.includes('TBILL') ||
          asset.asset_code.includes('BOND') ||
          asset.asset_code.includes('REIT')
        ))
      );
    } catch (error) {
      throw new Error(`Failed to get user created tokens: ${error}`);
    }
  }

  /**
   * Categorize an asset as RWA based on various indicators
   */
  private categorizeRWAAsset(asset: WalletAsset): void {
    if (!asset.asset_code) return;

    const code = asset.asset_code.toLowerCase();
    
    // Known RWA patterns
    if (code.includes('tbill') || code.includes('treasury')) {
      asset.isRWA = true;
      asset.rwaType = 'treasury';
      asset.displayName = this.formatAssetDisplayName(asset.asset_code);
    } else if (code.includes('bond') || code.includes('corp')) {
      asset.isRWA = true;
      asset.rwaType = 'corporate-bond';
      asset.displayName = this.formatAssetDisplayName(asset.asset_code);
    } else if (code.includes('reit') || code.includes('real') || code.includes('property')) {
      asset.isRWA = true;
      asset.rwaType = 'real-estate';
      asset.displayName = this.formatAssetDisplayName(asset.asset_code);
    } else if (code.includes('gold') || code.includes('silver') || code.includes('commodity')) {
      asset.isRWA = true;
      asset.rwaType = 'commodity';
      asset.displayName = this.formatAssetDisplayName(asset.asset_code);
    } else if (code.includes('srwa') || code.includes('rwa')) {
      asset.isRWA = true;
      asset.rwaType = 'other';
      asset.displayName = this.formatAssetDisplayName(asset.asset_code);
    }
  }

  /**
   * Check if an asset is a stablecoin
   */
  private isStablecoin(asset: WalletAsset): boolean {
    if (!asset.asset_code) return false;
    
    const stablecoins = ['USDC', 'USDT', 'BUSD', 'DAI', 'TUSD', 'USDP'];
    return stablecoins.includes(asset.asset_code.toUpperCase());
  }

  /**
   * Format asset code for display
   */
  private formatAssetDisplayName(assetCode: string): string {
    // Convert asset codes to readable names
    const nameMap: { [key: string]: string } = {
      'SRWATBILL': 'US Treasury Bills',
      'SRWACORP': 'Corporate Bonds',
      'SRWAREIT': 'Real Estate Investment Trust',
      'TBILL3M': '3-Month Treasury Bills',
      'CORPBOND': 'Corporate Bonds',
      'GOLDTOKEN': 'Gold-Backed Token',
    };

    return nameMap[assetCode.toUpperCase()] || assetCode;
  }

  /**
   * Process transaction operations to create human-readable summaries
   */
  private processTransactionOperations(
    transaction: WalletTransaction, 
    operations: OperationRecord[]
  ): void {
    if (operations.length === 0) return;

    const firstOp = operations[0];
    transaction.operationType = firstOp.type;

    // Extract relevant information based on operation type
    switch (firstOp.type) {
      case 'payment':
        const paymentOp = firstOp as any;
        transaction.operationSummary = `Payment of ${paymentOp.amount} ${paymentOp.asset_code || 'XLM'}`;
        transaction.involvedAssets = [paymentOp.asset_code || 'XLM'];
        transaction.amountMoved = paymentOp.amount;
        break;
      
      case 'path_payment_strict_receive':
      case 'path_payment_strict_send':
        const pathOp = firstOp as any;
        transaction.operationSummary = `Swap ${pathOp.source_amount} ${pathOp.source_asset_code || 'XLM'} → ${pathOp.amount} ${pathOp.asset_code || 'XLM'}`;
        transaction.involvedAssets = [pathOp.source_asset_code || 'XLM', pathOp.asset_code || 'XLM'];
        break;
      
      case 'change_trust':
        const trustOp = firstOp as any;
        transaction.operationSummary = `Added trustline for ${trustOp.asset_code}`;
        transaction.involvedAssets = [trustOp.asset_code];
        break;
      
      case 'manage_offer':
        const offerOp = firstOp as any;
        transaction.operationSummary = `DEX order: ${offerOp.amount} ${offerOp.selling_asset_code || 'XLM'}`;
        transaction.involvedAssets = [offerOp.selling_asset_code || 'XLM', offerOp.buying_asset_code || 'XLM'];
        break;
      
      default:
        transaction.operationSummary = `${firstOp.type} operation`;
    }
  }
}

// Export singleton instance
export const horizonService = new HorizonService();

// Helper functions
export const formatBalance = (balance: string, decimals: number = 7): string => {
  const num = parseFloat(balance);
  if (num === 0) return '0';
  if (num < 0.0001) return '< 0.0001';
  return num.toFixed(decimals).replace(/\.?0+$/, '');
};

export const formatUSDValue = (value: number): string => {
  if (value === 0) return '$0.00';
  if (value < 0.01) return '< $0.01';
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const getRWATypeIcon = (type: string): string => {
  const icons = {
    'treasury': '🏛️',
    'corporate-bond': '🏢',
    'real-estate': '🏘️',
    'commodity': '🥇',
    'other': '💼'
  };
  return icons[type as keyof typeof icons] || '💼';
};

export const getRWATypeColor = (type: string): string => {
  const colors = {
    'treasury': 'text-blue-400',
    'corporate-bond': 'text-purple-400',
    'real-estate': 'text-green-400',
    'commodity': 'text-yellow-400',
    'other': 'text-gray-400'
  };
  return colors[type as keyof typeof colors] || 'text-gray-400';
};