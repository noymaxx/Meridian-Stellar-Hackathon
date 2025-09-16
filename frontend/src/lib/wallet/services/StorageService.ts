import { WalletType } from '../types';
import { createLogger } from '../utils';

const logger = createLogger('StorageService');

export interface WalletConnectionData {
  walletType: WalletType;
  address: string;
  connectedAt: number;
  network: string;
}

export class StorageService {
  private static readonly STORAGE_KEY = 'stellar_wallet_connection';

  /**
   * Save wallet connection data to localStorage
   */
  static saveWalletConnection(data: WalletConnectionData): void {
    try {
      logger.debug('Saving wallet connection to localStorage', {
        walletType: data.walletType,
        address: data.address.slice(0, 8) + '...',
        network: data.network
      });
      
      const serializedData = JSON.stringify(data);
      localStorage.setItem(this.STORAGE_KEY, serializedData);
      
      logger.debug('Wallet connection saved successfully');
    } catch (error) {
      logger.error('Failed to save wallet connection:', error);
      throw new Error('Failed to save wallet connection to storage');
    }
  }

  /**
   * Get wallet connection data from localStorage
   */
  static getWalletConnection(): WalletConnectionData | null {
    try {
      const serializedData = localStorage.getItem(this.STORAGE_KEY);
      
      if (!serializedData) {
        logger.debug('No wallet connection found in localStorage');
        return null;
      }

      const data = JSON.parse(serializedData) as WalletConnectionData;
      
      // Validate the data structure
      if (!this.isValidConnectionData(data)) {
        logger.warn('Invalid wallet connection data found, clearing storage');
        this.clearWalletConnection();
        return null;
      }

      // Check if data is not too old (7 days)
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      if (data.connectedAt < sevenDaysAgo) {
        logger.debug('Wallet connection data expired, clearing storage');
        this.clearWalletConnection();
        return null;
      }

      logger.debug('Wallet connection retrieved from localStorage', {
        walletType: data.walletType,
        address: data.address.slice(0, 8) + '...',
        network: data.network,
        age: Math.round((Date.now() - data.connectedAt) / (1000 * 60)) + ' minutes'
      });

      return data;
    } catch (error) {
      logger.error('Failed to get wallet connection:', error);
      // Clear corrupted data
      this.clearWalletConnection();
      return null;
    }
  }

  /**
   * Clear wallet connection data from localStorage
   */
  static clearWalletConnection(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      logger.debug('Wallet connection cleared from localStorage');
    } catch (error) {
      logger.error('Failed to clear wallet connection:', error);
    }
  }

  /**
   * Check if localStorage is available
   */
  static isStorageAvailable(): boolean {
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch (error) {
      logger.warn('localStorage is not available:', error);
      return false;
    }
  }

  /**
   * Validate wallet connection data structure
   */
  private static isValidConnectionData(data: any): data is WalletConnectionData {
    return (
      data &&
      typeof data === 'object' &&
      typeof data.walletType === 'string' &&
      Object.values(WalletType).includes(data.walletType) &&
      typeof data.address === 'string' &&
      data.address.length > 0 &&
      typeof data.connectedAt === 'number' &&
      data.connectedAt > 0 &&
      typeof data.network === 'string' &&
      data.network.length > 0
    );
  }

  /**
   * Update specific fields in stored connection data
   */
  static updateWalletConnection(updates: Partial<WalletConnectionData>): boolean {
    const currentData = this.getWalletConnection();
    
    if (!currentData) {
      logger.debug('No existing connection data to update');
      return false;
    }

    const updatedData = { ...currentData, ...updates };
    
    try {
      this.saveWalletConnection(updatedData);
      logger.debug('Wallet connection updated successfully', updates);
      return true;
    } catch (error) {
      logger.error('Failed to update wallet connection:', error);
      return false;
    }
  }
}