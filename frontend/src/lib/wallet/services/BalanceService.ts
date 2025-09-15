import { Horizon } from "@stellar/stellar-sdk";
import { NetworkInfo } from "../types";
import { createLogger, formatBalance } from "../utils";

const logger = createLogger('BalanceService');

export class BalanceService {
  private servers: Map<string, Horizon.Server> = new Map();

  private getServer(network: NetworkInfo): Horizon.Server {
    const key = network.horizonUrl;
    
    if (!this.servers.has(key)) {
      // Configurar servidor com opções apropriadas para desenvolvimento
      const serverOptions: any = {};
      
      // Em desenvolvimento, permitir URLs HTTP inseguras (proxy local)
      if (import.meta.env.DEV && network.horizonUrl.startsWith('http://localhost')) {
        serverOptions.allowHttp = true;
      }
      
      const server = new Horizon.Server(network.horizonUrl, serverOptions);
      this.servers.set(key, server);
      logger.debug(`Created new server instance for ${network.name} with URL: ${network.horizonUrl}`);
    }

    return this.servers.get(key)!;
  }

  async getBalance(address: string, network: NetworkInfo): Promise<string> {
    try {
      logger.debug(`Fetching balance for ${address.slice(0, 8)}... on ${network.name}`);
      
      const server = this.getServer(network);
      const account = await server.loadAccount(address);
      
      // Get native XLM balance
      const nativeBalance = account.balances.find(
        balance => balance.asset_type === 'native'
      );

      if (!nativeBalance) {
        logger.warn('No native balance found for account');
        return '0';
      }

      const balance = nativeBalance.balance;
      logger.debug(`Balance retrieved: ${balance} XLM`);
      
      return balance;
    } catch (error: unknown) {
      if (error?.response?.status === 404) {
        logger.debug('Account not found, returning 0 balance');
        return '0';
      }
      
      logger.error('Failed to fetch balance:', error);
      throw error;
    }
  }

  async getFormattedBalance(address: string, network: NetworkInfo, decimals: number = 2): Promise<string> {
    try {
      const balance = await this.getBalance(address, network);
      return formatBalance(balance, decimals);
    } catch (error) {
      logger.error('Failed to get formatted balance:', error);
      return '0.00';
    }
  }

  async getAllBalances(address: string, network: NetworkInfo) {
    try {
      logger.debug(`Fetching all balances for ${address.slice(0, 8)}... on ${network.name}`);
      
      const server = this.getServer(network);
      const account = await server.loadAccount(address);
      
      return account.balances.map(balance => ({
        asset_type: balance.asset_type,
        asset_code: balance.asset_code || 'XLM',
        asset_issuer: balance.asset_issuer,
        balance: balance.balance,
        limit: balance.limit,
        buying_liabilities: balance.buying_liabilities,
        selling_liabilities: balance.selling_liabilities
      }));
    } catch (error: unknown) {
      if (error?.response?.status === 404) {
        logger.debug('Account not found, returning empty balances');
        return [];
      }
      
      logger.error('Failed to fetch all balances:', error);
      throw error;
    }
  }

  async refreshBalance(address: string, network: NetworkInfo): Promise<string> {
    try {
      // Force a fresh request by not using cache
      return await this.getBalance(address, network);
    } catch (error) {
      logger.error('Failed to refresh balance:', error);
      throw error;
    }
  }

  async monitorBalance(
    address: string, 
    network: NetworkInfo, 
    callback: (balance: string) => void,
    intervalMs: number = 30000
  ): Promise<() => void> {
    // Simplified monitoring - just return a no-op cleanup function
    // Monitoring is disabled by default, only manual refresh is used
    logger.debug('Balance monitoring requested but disabled for manual control');
    
    return () => {
      logger.debug('Balance monitoring cleanup (no-op)');
    };
  }
}