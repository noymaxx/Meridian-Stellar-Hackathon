// ===== FALLBACK PRICING SERVICE =====
// This service provides robust pricing with multiple fallback layers
// when Oracle testnet is empty and CoinGecko is blocked by CORS

import { createReflectorOracleClientFromOracleConfig } from '@/lib/stellar/reflector-oracle';
import { STELLAR_CONFIG } from '@/lib/stellar-config';

export interface AssetPrice {
  asset: string;
  price: number;
  timestamp: number;
  source: 'oracle' | 'backup-oracle' | 'static-testnet' | 'coingecko' | 'defindex' | 'cached';
  confidence: 'high' | 'medium' | 'low';
  degraded?: boolean;
}

export interface PriceProvider {
  name: string;
  priority: number;
  enabled: boolean;
  getPrice(asset: string): Promise<AssetPrice>;
}

// Static testnet prices for development/testing when oracles are empty
const STATIC_TESTNET_PRICES: { [key: string]: number } = {
  'XLM': 0.12,
  'USDC': 1.00,
  'USDT': 0.998,
  'BLND': 0.05,
  'BTC': 43250.00,
  'ETH': 2650.00,
  'EUR': 1.09
};

// Backup oracle configuration (mainnet oracles for real price data)
const BACKUP_ORACLE_CONFIG = {
  network: 'mainnet',
  sorobanRpcUrl: 'https://soroban-rpc.mainnet.stellar.org',
  fallbackRpcUrls: ['https://mainnet.sorobanrpc.com'],
  networkPassphrase: 'Public Global Stellar Network ; September 2015',
  oracleContracts: {
    stellarDex: 'CALI2BYU2JE6WVRUFYTS6MSBNEHGJ35P4AVCZYF3B6QOE3QKOB2PLE6M',
    externalDexs: 'CAFJZQWSED6YAWZU3GWRTOCNPPCGBN32L7QV43XX5LZLFTK6JLN34DLN',
    fiatRates: 'CBKGPWGKSKZF52CFHMTRR23TBWTPMRDIYZ4O2P5VS65BMHYH4DXMCJZC'
  }
};

class OraclePriceProvider implements PriceProvider {
  name = 'primary-oracle';
  priority = 1;
  enabled = true;
  private oracleClient: any;

  constructor() {
    this.oracleClient = createReflectorOracleClientFromOracleConfig(STELLAR_CONFIG);
  }

  async getPrice(asset: string): Promise<AssetPrice> {
    try {
      console.log(`📡 Fetching price for ${asset} from primary oracle...`);
      const oraclePrice = await this.oracleClient.getAssetPrice(asset);
      
      return {
        asset: asset.toUpperCase(),
        price: oraclePrice.price,
        timestamp: oraclePrice.timestamp,
        source: 'oracle',
        confidence: 'high',
        degraded: oraclePrice.degraded
      };
    } catch (error) {
      console.warn(`Primary oracle failed for ${asset}:`, error);
      throw error;
    }
  }
}

class BackupOraclePriceProvider implements PriceProvider {
  name = 'backup-oracle';
  priority = 2;
  enabled = true;
  private backupOracleClient: any;

  constructor() {
    this.backupOracleClient = createReflectorOracleClientFromOracleConfig(BACKUP_ORACLE_CONFIG);
  }

  async getPrice(asset: string): Promise<AssetPrice> {
    try {
      console.log(`🔄 Fetching price for ${asset} from backup oracle (mainnet)...`);
      const oraclePrice = await this.backupOracleClient.getAssetPrice(asset);
      
      return {
        asset: asset.toUpperCase(),
        price: oraclePrice.price,
        timestamp: oraclePrice.timestamp,
        source: 'backup-oracle',
        confidence: 'high',
        degraded: oraclePrice.degraded
      };
    } catch (error) {
      console.warn(`Backup oracle failed for ${asset}:`, error);
      throw error;
    }
  }
}

class StaticTestnetPriceProvider implements PriceProvider {
  name = 'static-testnet';
  priority = 3;
  enabled = true;

  async getPrice(asset: string): Promise<AssetPrice> {
    const assetUpper = asset.toUpperCase();
    const staticPrice = STATIC_TESTNET_PRICES[assetUpper];
    
    if (!staticPrice) {
      throw new Error(`No static price available for ${asset}`);
    }

    console.log(`📊 Using static testnet price for ${asset}: $${staticPrice}`);
    
    return {
      asset: assetUpper,
      price: staticPrice,
      timestamp: Date.now(),
      source: 'static-testnet',
      confidence: 'medium'
    };
  }
}

class CoinGeckoPriceProvider implements PriceProvider {
  name = 'coingecko';
  priority = 4;
  enabled = false; // Disabled by default due to CORS issues - can be enabled via proxy

  private coinGeckoIds: { [key: string]: string } = {
    'XLM': 'stellar',
    'USDC': 'usd-coin',
    'USDT': 'tether',
    'BTC': 'bitcoin',
    'ETH': 'ethereum'
  };

  async getPrice(asset: string): Promise<AssetPrice> {
    const assetUpper = asset.toUpperCase();
    const coinId = this.coinGeckoIds[assetUpper];
    
    if (!coinId) {
      throw new Error(`No CoinGecko ID mapping for ${asset}`);
    }

    try {
      console.log(`🦎 Fetching price for ${asset} from CoinGecko...`);
      
      // This will likely fail due to CORS
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`,
        {
          headers: {
            'Accept': 'application/json',
          }
        }
      );

      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status}`);
      }

      const data = await response.json();
      const price = data[coinId]?.usd;
      
      if (!price) {
        throw new Error(`No price data returned for ${asset}`);
      }

      return {
        asset: assetUpper,
        price,
        timestamp: Date.now(),
        source: 'coingecko',
        confidence: 'high'
      };
    } catch (error) {
      console.warn(`CoinGecko failed for ${asset}:`, error);
      throw error;
    }
  }
}

export class FallbackPricingService {
  private providers: PriceProvider[];
  private priceCache: Map<string, { price: AssetPrice; expires: number }> = new Map();
  private readonly CACHE_DURATION = 60 * 1000; // 1 minute cache

  constructor() {
    this.providers = [
      new OraclePriceProvider(),
      new BackupOraclePriceProvider(), 
      new StaticTestnetPriceProvider(),
      new CoinGeckoPriceProvider()
    ].sort((a, b) => a.priority - b.priority);
    
    // Log pricing strategy
    const isTestnet = STELLAR_CONFIG.network === 'testnet';
    if (isTestnet) {
      console.log('🧪 TESTNET MODE: Will primarily use static pricing and backup oracle (mainnet) for real data');
    } else {
      console.log('🌐 MAINNET MODE: Using primary oracle with backup layers');
    }

    console.log(`💰 Fallback Pricing Service initialized with ${this.providers.length} providers`);
    console.log(`📊 Enabled providers: ${this.providers.filter(p => p.enabled).map(p => p.name).join(', ')}`);
  }

  async getPrice(asset: string): Promise<AssetPrice> {
    const cacheKey = asset.toUpperCase();
    
    // Check cache first
    const cached = this.priceCache.get(cacheKey);
    if (cached && cached.expires > Date.now()) {
      console.log(`💾 Using cached price for ${asset}: $${cached.price.price} (${cached.price.source})`);
      return { ...cached.price, source: 'cached' as const };
    }

    // HACKATHON OPTIMIZATION: For testnet, use static prices for secondary tokens
    const isTestnet = STELLAR_CONFIG.network === 'testnet';
    const isSecondaryToken = !['XLM', 'USDC', 'USDT'].includes(asset.toUpperCase());
    
    if (isTestnet && isSecondaryToken) {
      console.log(`🧪 HACKATHON: Using static price for secondary token ${asset} in testnet`);
      try {
        const staticProvider = this.providers.find(p => p.name === 'static-testnet');
        if (staticProvider) {
          const price = await staticProvider.getPrice(asset);
          this.priceCache.set(cacheKey, {
            price,
            expires: Date.now() + this.CACHE_DURATION
          });
          return price;
        }
      } catch (error) {
        console.warn(`Static provider failed for ${asset}:`, error);
      }
    }

    // Try each provider in priority order
    const enabledProviders = this.providers.filter(p => p.enabled);
    let lastError: Error | null = null;

    for (const provider of enabledProviders) {
      try {
        console.log(`🔄 Trying provider "${provider.name}" for ${asset}...`);
        const price = await provider.getPrice(asset);
        
        // Cache successful result
        this.priceCache.set(cacheKey, {
          price,
          expires: Date.now() + this.CACHE_DURATION
        });
        
        console.log(`✅ Successfully got price for ${asset}: $${price.price} from ${provider.name}`);
        return price;
      } catch (error) {
        console.warn(`❌ Provider "${provider.name}" failed for ${asset}:`, error);
        lastError = error as Error;
        continue;
      }
    }

    // If all providers failed, try to use expired cache
    const expiredCache = this.priceCache.get(cacheKey);
    if (expiredCache) {
      const ageMinutes = Math.round((Date.now() - expiredCache.expires) / (60 * 1000));
      console.warn(`⚠️ All providers failed for ${asset}, using stale cache (${ageMinutes}m old)`);
      return { 
        ...expiredCache.price, 
        source: 'cached' as const,
        confidence: 'low' as const,
        timestamp: Date.now()
      };
    }

    // Final fallback: return a minimal price structure
    const assetUpper = asset.toUpperCase();
    const fallbackPrice = STATIC_TESTNET_PRICES[assetUpper] || 1.0;
    
    console.error(`💥 All pricing failed for ${asset}, using fallback price: $${fallbackPrice}`);
    
    return {
      asset: assetUpper,
      price: fallbackPrice,
      timestamp: Date.now(),
      source: 'static-testnet',
      confidence: 'low'
    };
  }

  async getMultiplePrices(assets: string[]): Promise<{ [asset: string]: AssetPrice }> {
    console.log(`💰 Fetching prices for ${assets.length} assets: ${assets.join(', ')}`);
    
    const results: { [asset: string]: AssetPrice } = {};
    
    // Process in parallel with individual error handling
    const pricePromises = assets.map(async (asset) => {
      try {
        const price = await this.getPrice(asset);
        results[asset.toUpperCase()] = price;
      } catch (error) {
        console.error(`Failed to get price for ${asset}:`, error);
        // Include failed assets with fallback
        const fallbackPrice = STATIC_TESTNET_PRICES[asset.toUpperCase()] || 1.0;
        results[asset.toUpperCase()] = {
          asset: asset.toUpperCase(),
          price: fallbackPrice,
          timestamp: Date.now(),
          source: 'static-testnet',
          confidence: 'low'
        };
      }
    });

    await Promise.allSettled(pricePromises);
    
    console.log(`✅ Price fetching complete: ${Object.keys(results).length}/${assets.length} assets`);
    return results;
  }

  // Cache management
  clearCache(): void {
    this.priceCache.clear();
    console.log('🗑️ Price cache cleared');
  }

  getCacheStatus(): { size: number; entries: string[] } {
    return {
      size: this.priceCache.size,
      entries: Array.from(this.priceCache.keys())
    };
  }

  // Provider management
  enableProvider(providerName: string): void {
    const provider = this.providers.find(p => p.name === providerName);
    if (provider) {
      provider.enabled = true;
      console.log(`✅ Enabled price provider: ${providerName}`);
    }
  }

  disableProvider(providerName: string): void {
    const provider = this.providers.find(p => p.name === providerName);
    if (provider) {
      provider.enabled = false;
      console.log(`❌ Disabled price provider: ${providerName}`);
    }
  }

  getProviderStatus(): { name: string; enabled: boolean; priority: number }[] {
    return this.providers.map(p => ({
      name: p.name,
      enabled: p.enabled,
      priority: p.priority
    }));
  }
}

// Singleton instance
export const fallbackPricingService = new FallbackPricingService();

// Convenience functions
export async function getAssetPrice(asset: string): Promise<AssetPrice> {
  return fallbackPricingService.getPrice(asset);
}

export async function getMultipleAssetPrices(assets: string[]): Promise<{ [asset: string]: AssetPrice }> {
  return fallbackPricingService.getMultiplePrices(assets);
}