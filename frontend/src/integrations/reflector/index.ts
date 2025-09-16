import type { OracleState } from '@/types/domain';
import type { AssetPriceFromOracle, OracleContractConfig, EnhancedOracleFeed } from '@/types/markets';
import { createReflectorOracleClientFromOracleConfig, ReflectorOracleContractClient } from '@/lib/stellar/reflector-oracle';
import { STELLAR_CONFIG, getOracleConfig } from '@/lib/stellar-config';

// ===== REFLECTOR ORACLE CLIENT =====

interface ReflectorApiResponse<T> {
  data: T;
  success: boolean;
  timestamp: number;
  error?: string;
}

interface AssetPrice {
  asset: string;
  price: number;
  priceUsd: number;
  change24h: number;
  volume24h: number;
  marketCap?: number;
  decimals: number;
  timestamp: number;
  source: string;
}

interface PriceHistory {
  asset: string;
  timestamps: number[];
  prices: number[];
  interval: '1m' | '5m' | '1h' | '1d' | '7d';
}

interface AssetMetadata {
  symbol: string;
  name: string;
  code: string;
  issuer?: string;
  contractAddress: string;
  decimals: number;
  logoURI?: string;
  coingeckoId?: string;
}

// Known asset mappings for Stellar ecosystem
const ASSET_MAPPINGS: { [key: string]: AssetMetadata } = {
  'XLM': {
    symbol: 'XLM',
    name: 'Stellar Lumens',
    code: 'XLM',
    contractAddress: 'native',
    decimals: 7,
    logoURI: 'https://assets.coingecko.com/coins/images/100/small/Stellar_symbol_black_RGB.png',
    coingeckoId: 'stellar'
  },
  'USDC': {
    symbol: 'USDC',
    name: 'USD Coin',
    code: 'USDC',
    issuer: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
    contractAddress: 'CUSDC67VZ75HPJVIEUVNIXF47ZG2FB2RMQQAOBKYI',
    decimals: 6,
    logoURI: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png',
    coingeckoId: 'usd-coin'
  },
  'USDT': {
    symbol: 'USDT',
    name: 'Tether USD',
    code: 'USDT',
    issuer: 'GCQTGZQQ5G4PTM2GL7CDIFKUBIPEC52BROAQIAPW53XBRJVN6ZJVTG6V',
    contractAddress: 'CUSDT67VZ75HPJVIEUVNIXF47ZG2FB2RMQQAOBKYI',
    decimals: 6,
    logoURI: 'https://assets.coingecko.com/coins/images/325/small/Tether-logo.png',
    coingeckoId: 'tether'
  },
  'yXLM': {
    symbol: 'yXLM',
    name: 'yieldblox XLM',
    code: 'yXLM',
    contractAddress: 'CYXLM67VZ75HPJVIEUVNIXF47ZG2FB2RMQQAOBKYI',
    decimals: 7,
    logoURI: 'https://assets.yieldblox.com/yXLM.png'
  }
};

export class ReflectorOracleClient {
  private baseUrl: string;
  private oracleContractClient: ReflectorOracleContractClient;
  private useContract: boolean;
  private priceCache: Map<string, { price: AssetPrice; expires: number }> = new Map();
  private readonly CACHE_DURATION = 30 * 1000; // 30 seconds

  constructor(
    baseUrl: string = 'https://api.reflector.network',
    useContract: boolean = true,
    stellarConfig = STELLAR_CONFIG
  ) {
    this.baseUrl = baseUrl;
    this.useContract = useContract;
    
    // Use oracle-specific configuration (mainnet) for real price data
    const oracleConfig = getOracleConfig();
    this.oracleContractClient = createReflectorOracleClientFromOracleConfig(oracleConfig);
    
    console.log(`🔧 ReflectorOracleClient initialized:`);
    console.log(`   📱 App Network: ${stellarConfig.network}`);
    console.log(`   🔮 Oracle Network: ${oracleConfig.network}`);
    console.log(`   📡 Oracle RPC: ${oracleConfig.sorobanRpcUrl}`);
    console.log(`   🔄 Fallback RPCs: ${oracleConfig.fallbackRpcUrls?.length || 0} available`);
  }

  // ===== CORE ORACLE FUNCTIONS =====

  async fetchOracleState(oracleAddress: string): Promise<OracleState> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${this.baseUrl}/v1/oracle/${oracleAddress}/state`, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Oracle API returned ${response.status}: ${response.statusText}`);
      }

      const result: ReflectorApiResponse<OracleState> = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Oracle state request failed');
      }

      return result.data;
    } catch (error) {
      console.error(`Error fetching oracle state for ${oracleAddress}:`, error);
      throw error;
    }
  }

  // ===== PRICE FEED FUNCTIONS =====

  async getAssetPrice(asset: string): Promise<AssetPrice> {
    // Check cache first
    const cacheKey = asset.toUpperCase();
    const cached = this.priceCache.get(cacheKey);
    
    if (cached && cached.expires > Date.now()) {
      return cached.price;
    }

    // No mock data - always use real data sources

    let lastError: Error | null = null;
    
    try {
      if (this.useContract) {
        // Primary: Oracle contract with RPC fallbacks
        console.log(`💎 Trying oracle contract for ${asset}...`);
        try {
          const contractPrice = await this.getAssetPriceFromContract(asset);
          console.log(`✅ Oracle success for ${asset}: $${contractPrice.price.toFixed(6)}`);
          return contractPrice;
        } catch (oracleError) {
          console.warn(`🔄 Oracle failed for ${asset}, trying CoinGecko fallback...`);
          lastError = oracleError as Error;
          
          // Fallback 1: CoinGecko API
          try {
            const fallbackPrice = await this.getAssetPriceFromAPI(asset);
            console.log(`✅ CoinGecko fallback successful for ${asset}: $${fallbackPrice.price.toFixed(6)}`);
            return fallbackPrice;
          } catch (apiError) {
            console.warn(`❌ CoinGecko fallback also failed for ${asset}:`, apiError);
            lastError = apiError as Error;
          }
        }
      } else {
        // Primary: API method
        console.log(`🌐 Trying CoinGecko API for ${asset}...`);
        try {
          const apiPrice = await this.getAssetPriceFromAPI(asset);
          console.log(`✅ CoinGecko success for ${asset}: $${apiPrice.price.toFixed(6)}`);
          return apiPrice;
        } catch (apiError) {
          console.warn(`❌ CoinGecko API failed for ${asset}:`, apiError);
          lastError = apiError as Error;
        }
      }
      
      // Fallback 2: Cached data (even if expired)
      const cached = this.priceCache.get(cacheKey);
      if (cached) {
        const ageSeconds = Math.round((Date.now() - cached.expires) / 1000);
        console.warn(`🔄 Using stale cached price for ${asset} (${ageSeconds}s old): $${cached.price.price.toFixed(6)}`);
        return { ...cached.price, timestamp: Date.now() };
      }
      
      // No fallback available
      console.error(`💥 All fallback methods exhausted for ${asset}`);
      throw new Error(`No price data available for ${asset} from any source (Oracle, CoinGecko, or cache). Last error: ${lastError?.message || 'Unknown'}`);
    } catch (error) {
      // This catch is for any unexpected errors during the fallback process
      console.error(`🚨 Unexpected error in price fallback for ${asset}:`, error);
      throw error;
    }
  }

  private async getAssetPriceFromContract(asset: string): Promise<AssetPrice> {
    const cacheKey = asset.toUpperCase();
    
    try {
      const contractPrice = await this.oracleContractClient.getAssetPrice(asset);
      
      const price: AssetPrice = {
        asset: contractPrice.asset,
        price: contractPrice.price,
        priceUsd: contractPrice.price,
        change24h: 0, // Contract doesn't provide 24h change
        volume24h: 0, // Contract doesn't provide volume
        marketCap: 0, // Contract doesn't provide market cap
        decimals: 6, // Default decimals
        timestamp: contractPrice.timestamp,
        source: contractPrice.source
      };

      // Cache the result
      this.priceCache.set(cacheKey, {
        price,
        expires: Date.now() + this.CACHE_DURATION
      });

      return price;
    } catch (error) {
      console.error(`Error fetching price from contract for ${asset}:`, error);
      throw error;
    }
  }

  private async getAssetPriceFromAPI(asset: string): Promise<AssetPrice> {
    const cacheKey = asset.toUpperCase();
    const assetMeta = ASSET_MAPPINGS[asset.toUpperCase()];
    
    if (!assetMeta) {
      throw new Error(`Unknown asset: ${asset}`);
    }

    if (!assetMeta.coingeckoId) {
      throw new Error(`No CoinGecko ID available for asset: ${asset}`);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      // Use CoinGecko API directly (Reflector API doesn't exist)
      console.log(`🦎 Fetching ${asset} price from CoinGecko API (ID: ${assetMeta.coingeckoId})...`);
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${assetMeta.coingeckoId}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true`,
        {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Meridian-Stellar-App/1.0'
          },
          signal: controller.signal
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`CoinGecko API returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const coinData = data[assetMeta.coingeckoId];

      if (!coinData || !coinData.usd) {
        throw new Error(`No price data available for ${asset} from CoinGecko`);
      }

      const price: AssetPrice = {
        asset: asset.toUpperCase(),
        price: coinData.usd,
        priceUsd: coinData.usd,
        change24h: coinData.usd_24h_change || 0,
        volume24h: coinData.usd_24h_vol || 0,
        marketCap: coinData.usd_market_cap || 0,
        decimals: assetMeta.decimals,
        timestamp: Date.now(),
        source: 'coingecko'
      };

      // Cache the result
      this.priceCache.set(cacheKey, {
        price,
        expires: Date.now() + this.CACHE_DURATION
      });

      return price;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  async getMultipleAssetPrices(assets: string[]): Promise<{ [asset: string]: AssetPrice }> {
    const results: { [asset: string]: AssetPrice } = {};
    console.log(`📊 Fetching prices for ${assets.length} assets: ${assets.join(', ')}`);
    
    if (this.useContract) {
      try {
        // Use contract method for bulk fetching (if available)
        console.log(`💎 Trying bulk oracle fetch for ${assets.length} assets...`);
        const contractPrices = await this.oracleContractClient.getMultipleAssetPrices(assets);
        
        for (const [asset, contractPrice] of Object.entries(contractPrices)) {
          results[asset] = {
            asset: contractPrice.asset,
            price: contractPrice.price,
            priceUsd: contractPrice.price,
            change24h: 0,
            volume24h: 0,
            marketCap: 0,
            decimals: 6,
            timestamp: contractPrice.timestamp,
            source: contractPrice.source
          };
        }
        
        console.log(`✅ Bulk oracle fetch successful for ${Object.keys(results).length}/${assets.length} assets`);
        
        // If we got all assets, return early
        if (Object.keys(results).length === assets.length) {
          return results;
        }
      } catch (error) {
        console.warn('📊 Contract bulk fetch failed, falling back to individual requests:', error);
      }
    }
    
    // Fallback to individual requests with better error handling
    const failedAssets: string[] = [];
    const pricePromises = assets.map(async (asset) => {
      try {
        const price = await this.getAssetPrice(asset);
        results[asset.toUpperCase()] = price;
        console.log(`📈 ${asset}: $${price.price.toFixed(6)} (${price.source})`);
      } catch (error) {
        console.error(`💥 Failed to fetch price for ${asset}:`, error);
        failedAssets.push(asset);
      }
    });

    await Promise.allSettled(pricePromises);
    
    const successCount = Object.keys(results).length;
    const totalCount = assets.length;
    
    if (failedAssets.length > 0) {
      console.warn(`⚠️ Failed to fetch prices for ${failedAssets.length} assets: ${failedAssets.join(', ')}`);
    }
    
    console.log(`📊 Price fetch complete: ${successCount}/${totalCount} successful`);
    return results;
  }

  async getPriceHistory(asset: string, interval: PriceHistory['interval'] = '1h', periods: number = 24): Promise<PriceHistory> {
    try {
      const assetMeta = ASSET_MAPPINGS[asset.toUpperCase()];
      if (!assetMeta) {
        throw new Error(`Unknown asset: ${asset}`);
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(`${this.baseUrl}/v1/prices/${assetMeta.symbol}/history?interval=${interval}&periods=${periods}`, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Price history API returned ${response.status}: ${response.statusText}`);
      }

      const result: ReflectorApiResponse<PriceHistory> = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Price history request failed');
      }

      return result.data;
    } catch (error) {
      console.error(`Error fetching price history for ${asset}:`, error);
      
      // Try to get real historical data from CoinGecko
      return await this.generateFallbackHistory(asset, interval, periods);
    }
  }

  // ===== UTILITY FUNCTIONS =====


  private async generateFallbackHistory(asset: string, interval: PriceHistory['interval'], periods: number): Promise<PriceHistory> {
    // For history data, try to fetch from CoinGecko history API instead of generating fake data
    const assetMeta = ASSET_MAPPINGS[asset.toUpperCase()];
    if (!assetMeta?.coingeckoId) {
      throw new Error(`Cannot generate history for unknown asset: ${asset}`);
    }

    try {
      const days = Math.min(periods, 365); // CoinGecko free tier limit
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/${assetMeta.coingeckoId}/market_chart?vs_currency=usd&days=${days}`,
        {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Meridian-Stellar-App/1.0'
          }
        }
      );

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const prices = data.prices || [];
        
        return {
          asset: asset.toUpperCase(),
          timestamps: prices.map((p: [number, number]) => p[0]),
          prices: prices.map((p: [number, number]) => Number(p[1].toFixed(6))),
          interval
        };
      }
    } catch (error) {
      console.error(`Failed to fetch real history data for ${asset}:`, error);
    }

    // If we can't get real history data, throw error instead of generating fake data
    throw new Error(`No historical price data available for ${asset}`);
  }

  // ===== ASSET METADATA =====

  getAssetMetadata(asset: string): AssetMetadata | null {
    return ASSET_MAPPINGS[asset.toUpperCase()] || null;
  }

  getAllSupportedAssets(): AssetMetadata[] {
    return Object.values(ASSET_MAPPINGS);
  }

  // ===== HEALTH CHECK =====

  async checkOracleHealth(): Promise<boolean> {
    if (this.useContract) {
      try {
        return await this.oracleContractClient.checkOracleHealth();
      } catch (error) {
        console.warn('Oracle contract health check failed:', error);
        return false;
      }
    }
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${this.baseUrl}/v1/health`, {
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.warn('Reflector Oracle API health check failed:', error);
      return false;
    }
  }

  async getDetailedOracleHealth() {
    if (this.useContract) {
      try {
        return await this.oracleContractClient.getDetailedOracleHealth();
      } catch (error) {
        console.error('Failed to get detailed oracle health:', error);
        return {
          overall: false,
          contracts: {},
          network: 'unknown',
          rpcUrl: 'unknown',
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }
    
    return {
      overall: false,
      contracts: {},
      network: 'API mode',
      rpcUrl: this.baseUrl,
      error: 'Contract health check not available in API mode'
    };
  }

  // ===== NO MOCK DATA - REAL SOURCES ONLY =====

  // ===== CACHE MANAGEMENT =====

  clearPriceCache(): void {
    this.priceCache.clear();
  }

  getPriceCacheStatus(): { size: number; entries: string[] } {
    return {
      size: this.priceCache.size,
      entries: Array.from(this.priceCache.keys())
    };
  }
}

// ===== LEGACY COMPATIBILITY =====

export async function fetchOracleState(url: string): Promise<OracleState> {
  const client = new ReflectorOracleClient();
  return client.fetchOracleState(url);
}

// ===== DEFAULT CLIENT EXPORT =====

export const reflectorClient = new ReflectorOracleClient(
  'https://api.coingecko.com', // Use CoinGecko as API base
  true, // Enable contracts as primary source
  STELLAR_CONFIG // Use current stellar config (oracle config handled internally)
);

// ===== DEBUG UTILITIES =====

// Global debug function for browser console
if (typeof window !== 'undefined') {
  (window as any).debugOracles = async () => {
    console.log('🔧 Starting Oracle Debug Session...');
    
    const oracleConfig = getOracleConfig();
    console.log('📋 Hybrid Configuration:');
    console.log('   📱 App Network:', STELLAR_CONFIG.network);
    console.log('   📱 App RPC:', STELLAR_CONFIG.sorobanRpcUrl);
    console.log('   🔮 Oracle Network:', oracleConfig.network);
    console.log('   🔮 Oracle RPC:', oracleConfig.sorobanRpcUrl);
    console.log('   🔮 Oracle Contracts:', oracleConfig.oracleContracts);
    
    try {
      const health = await reflectorClient.getDetailedOracleHealth();
      console.log('🏥 Oracle Health Report:', health);
      
      if (health.overall) {
        console.log('✅ Oracle contracts are working! Trying to get XLM price...');
        try {
          const xlmPrice = await reflectorClient.getAssetPrice('XLM');
          console.log('✅ Oracle price fetch successful:', xlmPrice);
        } catch (error) {
          console.error('❌ Oracle price fetch failed:', error);
        }
      } else {
        console.log('🚨 Oracle contracts are not working. Trying CoinGecko fallback...');
        try {
          const xlmPrice = await reflectorClient.getAssetPrice('XLM');
          console.log('✅ CoinGecko fallback working:', xlmPrice);
        } catch (error) {
          console.error('❌ CoinGecko fallback also failed:', error);
        }
      }
    } catch (error) {
      console.error('💥 Debug session failed:', error);
    }
  };
  
  console.log('🔧 Oracle debug function loaded. Run debugOracles() in console to test.');
}