import { Keypair, Transaction, FeeBumpTransaction } from '@stellar/stellar-sdk';

export interface MobileWalletData {
  publicKey: string;
  secret: string;
  createdAt: number;
  deviceInfo: {
    userAgent: string;
    screenSize: string;
    timestamp: number;
  };
}

export interface MobileWalletInfo {
  publicKey: string;
  address: string;
  createdAt: Date;
  isActive: boolean;
}

export class MobileWallet {
  private static readonly STORAGE_KEY = 'stellar_mobile_wallet_v1';
  private static readonly BACKUP_KEY = 'stellar_mobile_backup_v1';
  private static readonly FRIENDBOT_URL = 'https://friendbot.stellar.org';
  
  /**
   * Fund account using Stellar Testnet Friendbot
   */
  private static async fundAccountWithFriendbot(publicKey: string): Promise<boolean> {
    try {
      console.log('💰 [MobileWallet] Funding new account via Friendbot:', publicKey.slice(0, 8) + '...');
      
      const response = await fetch(`${this.FRIENDBOT_URL}?addr=${publicKey}`, {
        method: 'GET',
      });
      
      if (response.ok) {
        console.log('✅ [MobileWallet] Account funded successfully via Friendbot');
        return true;
      } else {
        console.warn('⚠️ [MobileWallet] Friendbot funding failed:', response.status, response.statusText);
        return false;
      }
    } catch (error) {
      console.error('❌ [MobileWallet] Error funding account via Friendbot:', error);
      return false;
    }
  }

  /**
   * Wait for account to be activated on the network
   */
  private static async waitForAccountActivation(publicKey: string, maxWaitTime = 10000): Promise<boolean> {
    const startTime = Date.now();
    const checkInterval = 1000; // Check every 1 second
    
    console.log('⏳ [MobileWallet] Waiting for account activation...', publicKey.slice(0, 8) + '...');
    
    while (Date.now() - startTime < maxWaitTime) {
      try {
        // Try to fetch account from Stellar network
        const response = await fetch(`https://horizon-testnet.stellar.org/accounts/${publicKey}`);
        
        if (response.ok) {
          console.log('✅ [MobileWallet] Account activated successfully!');
          return true;
        }
        
        // Wait before next check
        await new Promise(resolve => setTimeout(resolve, checkInterval));
        
      } catch (error) {
        // Continue waiting if there's an error
        await new Promise(resolve => setTimeout(resolve, checkInterval));
      }
    }
    
    console.warn('⚠️ [MobileWallet] Account activation timeout');
    return false;
  }

  /**
   * Generate a new random keypair or retrieve existing one
   */
  static async generateOrGetKeypair(): Promise<Keypair> {
    try {
      // Try to get existing wallet
      const existing = this.getStoredWallet();
      if (existing) {
        console.log('🔑 [MobileWallet] Using existing wallet:', existing.publicKey.slice(0, 8) + '...');
        return Keypair.fromSecret(existing.secret);
      }
      
      // Generate new keypair
      const keypair = Keypair.random();
      
      console.log('🔑 [MobileWallet] New wallet generated:', keypair.publicKey().slice(0, 8) + '...');
      
      // Auto-fund the new account via Friendbot
      const fundingSuccess = await this.fundAccountWithFriendbot(keypair.publicKey());
      
      if (fundingSuccess) {
        // Wait for account to be activated
        const activationSuccess = await this.waitForAccountActivation(keypair.publicKey());
        
        if (activationSuccess) {
          console.log('🚀 [MobileWallet] Account ready for use!');
        } else {
          console.warn('⚠️ [MobileWallet] Account funding succeeded but activation timeout - wallet will still work');
        }
      } else {
        console.warn('⚠️ [MobileWallet] Auto-funding failed - user may need to fund manually');
      }
      
      const walletData: MobileWalletData = {
        publicKey: keypair.publicKey(),
        secret: keypair.secret(),
        createdAt: Date.now(),
        deviceInfo: {
          userAgent: navigator.userAgent,
          screenSize: `${window.innerWidth}x${window.innerHeight}`,
          timestamp: Date.now()
        }
      };
      
      // Store securely
      this.storeWallet(walletData);
      
      console.log('🔑 [MobileWallet] New wallet created and stored:', {
        publicKey: keypair.publicKey(),
        address: keypair.publicKey().slice(0, 8) + '...',
        createdAt: new Date(walletData.createdAt).toISOString(),
        funded: fundingSuccess
      });
      
      return keypair;
      
    } catch (error) {
      console.error('🔑 [MobileWallet] Error generating keypair:', error);
      throw new Error('Failed to generate mobile wallet');
    }
  }
  
  /**
   * Get wallet address (public key)
   */
  static async getAddress(): Promise<string | null> {
    try {
      const keypair = await this.generateOrGetKeypair();
      return keypair.publicKey();
    } catch (error) {
      console.error('🔑 [MobileWallet] Error getting address:', error);
      return null;
    }
  }
  
  /**
   * Get wallet info for display
   */
  static getWalletInfo(): MobileWalletInfo | null {
    try {
      const stored = this.getStoredWallet();
      if (!stored) return null;
      
      return {
        publicKey: stored.publicKey,
        address: stored.publicKey,
        createdAt: new Date(stored.createdAt),
        isActive: true
      };
    } catch (error) {
      console.error('🔑 [MobileWallet] Error getting wallet info:', error);
      return null;
    }
  }
  
  /**
   * Sign a Stellar transaction
   */
  static async signTransaction(transaction: Transaction | FeeBumpTransaction): Promise<Transaction | FeeBumpTransaction> {
    try {
      const keypair = await this.generateOrGetKeypair();
      
      console.log('🔑 [MobileWallet] Signing transaction:', {
        signer: keypair.publicKey().slice(0, 8) + '...',
        operations: transaction instanceof Transaction ? transaction.operations.length : 'fee-bump'
      });
      
      // Clone and sign transaction
      const signedTx = transaction instanceof Transaction 
        ? new Transaction(transaction.toEnvelope(), transaction.networkPassphrase)
        : transaction;
        
      signedTx.sign(keypair);
      
      console.log('✅ [MobileWallet] Transaction signed successfully');
      return signedTx;
      
    } catch (error) {
      console.error('🔑 [MobileWallet] Error signing transaction:', error);
      throw new Error('Failed to sign transaction with mobile wallet');
    }
  }
  
  /**
   * Export wallet for backup (returns secret key)
   */
  static exportWallet(): string | null {
    try {
      const stored = this.getStoredWallet();
      if (!stored) return null;
      
      console.log('🔑 [MobileWallet] Wallet exported for backup');
      return stored.secret;
      
    } catch (error) {
      console.error('🔑 [MobileWallet] Error exporting wallet:', error);
      return null;
    }
  }
  
  /**
   * Import wallet from secret key
   */
  static importWallet(secretKey: string): boolean {
    try {
      // Validate secret key
      const keypair = Keypair.fromSecret(secretKey);
      
      const walletData: MobileWalletData = {
        publicKey: keypair.publicKey(),
        secret: secretKey,
        createdAt: Date.now(),
        deviceInfo: {
          userAgent: navigator.userAgent,
          screenSize: `${window.innerWidth}x${window.innerHeight}`,
          timestamp: Date.now()
        }
      };
      
      // Clear existing wallet
      this.clearWallet();
      
      // Store new wallet
      this.storeWallet(walletData);
      
      console.log('🔑 [MobileWallet] Wallet imported successfully:', keypair.publicKey().slice(0, 8) + '...');
      return true;
      
    } catch (error) {
      console.error('🔑 [MobileWallet] Error importing wallet:', error);
      return false;
    }
  }
  
  /**
   * Clear wallet (logout)
   */
  static clearWallet(): void {
    try {
      // Create backup before clearing
      const existing = this.getStoredWallet();
      if (existing) {
        localStorage.setItem(this.BACKUP_KEY, JSON.stringify({
          ...existing,
          clearedAt: Date.now()
        }));
      }
      
      localStorage.removeItem(this.STORAGE_KEY);
      console.log('🔑 [MobileWallet] Wallet cleared (backed up)');
      
    } catch (error) {
      console.error('🔑 [MobileWallet] Error clearing wallet:', error);
    }
  }
  
  /**
   * Check if wallet exists
   */
  static hasWallet(): boolean {
    return this.getStoredWallet() !== null;
  }
  
  /**
   * Get stored wallet data
   */
  private static getStoredWallet(): MobileWalletData | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return null;
      
      const data = JSON.parse(stored) as MobileWalletData;
      
      // Validate data structure
      if (!data.publicKey || !data.secret || !data.createdAt) {
        console.warn('🔑 [MobileWallet] Invalid wallet data found, clearing...');
        localStorage.removeItem(this.STORAGE_KEY);
        return null;
      }
      
      return data;
      
    } catch (error) {
      console.error('🔑 [MobileWallet] Error reading stored wallet:', error);
      localStorage.removeItem(this.STORAGE_KEY); // Clear corrupted data
      return null;
    }
  }
  
  /**
   * Store wallet data securely
   */
  private static storeWallet(data: MobileWalletData): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
      console.log('🔑 [MobileWallet] Wallet stored securely');
      
    } catch (error) {
      console.error('🔑 [MobileWallet] Error storing wallet:', error);
      throw new Error('Failed to store mobile wallet');
    }
  }
  
  /**
   * Generate QR code data for wallet backup
   */
  static generateBackupQR(): string | null {
    try {
      const secret = this.exportWallet();
      if (!secret) return null;
      
      // Create backup data
      const backupData = {
        type: 'stellar-mobile-wallet',
        secret,
        created: Date.now(),
        version: '1.0'
      };
      
      return JSON.stringify(backupData);
      
    } catch (error) {
      console.error('🔑 [MobileWallet] Error generating backup QR:', error);
      return null;
    }
  }
}
