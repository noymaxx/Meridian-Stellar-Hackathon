import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BlendPool, BlendReserve, BlendAsset, UseBlendPoolsReturn, BlendError } from '@/types/blend';
import { Network, PoolV2, PoolOracle, PoolFactoryContractV2 } from '@blend-capital/blend-sdk';
import { StellarSdk } from '@stellar/stellar-sdk';
import { STELLAR_CONFIG } from '@/lib/stellar-config';
import { fallbackPricingService, getMultipleAssetPrices } from '@/lib/pricing/fallback-pricing';

// ===== BLEND SDK INTEGRATION =====

// Blend SDK Network Configuration for real pool data
const MAINNET_NETWORK: Network = {
  rpc: 'https://soroban-rpc.mainnet.stellar.org',
  passphrase: 'Public Global Stellar Network ; September 2015'
};

// Blend SDK Testnet Network Configuration (using same RPC as Oracle)
const TESTNET_NETWORK: Network = {
  rpc: 'https://soroban-testnet.stellar.org',
  passphrase: 'Test SDF Network ; September 2015'
};

// Known Blend Factory contracts - real addresses from blend-utils
const BLEND_FACTORY_ADDRESSES = {
  MAINNET_V2: 'CALI2BYU2JE6WVRUFYTS6MSBNEHGJ35P4AVCZYF3B6QOE3QKOB2PLE6M', // Real mainnet factory
  TESTNET_V2: 'CDSMKKCWEAYQW4DAUSH3XGRMIVIJB44TZ3UA5YCRHT6MP4LWEWR4GYV6'  // Real testnet factory
};

class BlendSDKClient {
  private network: Network;
  private factoryAddress: string;
  private fallbackRpcUrls: string[];
  private currentRpcIndex: number = 0;

  constructor() {
    // Use the configured network from environment (can be testnet or mainnet)
    const useMainnet = STELLAR_CONFIG.network === 'mainnet';
    this.network = useMainnet ? MAINNET_NETWORK : TESTNET_NETWORK;
    this.factoryAddress = useMainnet ? BLEND_FACTORY_ADDRESSES.MAINNET_V2 : BLEND_FACTORY_ADDRESSES.TESTNET_V2;
    
    // Setup fallback RPCs like Oracle
    this.fallbackRpcUrls = useMainnet 
      ? ['https://soroban-rpc.mainnet.stellar.org', 'https://mainnet.sorobanrpc.com']
      : ['https://soroban-rpc.testnet.stellar.org', 'https://rpc-testnet.stellar.org'];
    
    console.log(`🚀🚀🚀 BLEND SDK CLIENT STARTING 🚀🚀🚀`);
    console.log(`🏦 BlendSDKClient configured for ${STELLAR_CONFIG.network.toUpperCase()} pools (from env)`);
    console.log(`📡 Pool RPC: ${this.network.rpc}`);
    console.log(`🔄 Fallback RPCs: ${this.fallbackRpcUrls.length} available`);
    console.log(`🏭 Factory: ${this.factoryAddress}`);
    console.log(`🔧 STELLAR_CONFIG:`, STELLAR_CONFIG);
  }

  private async tryWithRpcFallback<T>(operation: (network: Network) => Promise<T>): Promise<T> {
    const allRpcUrls = [this.network.rpc, ...this.fallbackRpcUrls];
    
    for (let i = 0; i < allRpcUrls.length; i++) {
      const rpcUrl = allRpcUrls[(this.currentRpcIndex + i) % allRpcUrls.length];
      const networkWithRpc = { ...this.network, rpc: rpcUrl };
      
      try {
        console.log(`🔗 Trying Blend RPC: ${rpcUrl}`);
        const result = await operation(networkWithRpc);
        
        // Success - update current RPC if we switched
        if (i > 0) {
          this.currentRpcIndex = (this.currentRpcIndex + i) % allRpcUrls.length;
          this.network = networkWithRpc;
          console.log(`✅ Switched to Blend RPC: ${rpcUrl}`);
        }
        
        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.warn(`❌ Blend RPC ${rpcUrl} failed:`, errorMessage);
        
        // If this is the last RPC to try, throw the error
        if (i === allRpcUrls.length - 1) {
          throw error;
        }
        
        continue; // Try next RPC
      }
    }
    
    throw new Error('All Blend RPC endpoints failed');
  }

  async getPoolAddresses(): Promise<string[]> {
    try {
      console.log('🔍 Discovering pool addresses with robust error handling...');
      const isMainnet = this.network.passphrase.includes('Public Global');
      
      // First try to discover pools via Factory Contract with timeout
      try {
        console.log(`🏭 Attempting pool discovery via Factory: ${this.factoryAddress}`);
        
        const discoveryPromise = this.discoverPoolsViaFactory();
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Factory discovery timeout')), 30000)
        );
        
        const discoveredPools = await Promise.race([discoveryPromise, timeoutPromise]);
        
        if (discoveredPools && discoveredPools.length > 0) {
          console.log(`✅ Found ${discoveredPools.length} pools via factory discovery`);
          return discoveredPools;
        } else {
          console.warn('⚠️ Factory discovery returned no pools, falling back to hardcoded');
        }
      } catch (factoryError) {
        console.warn('⚠️ Factory pool discovery failed, using hardcoded addresses:', factoryError);
      }
      
      // Robust fallback to hardcoded addresses with network detection
      console.log(`📋 Using hardcoded pool addresses for ${isMainnet ? 'MAINNET' : 'TESTNET'}`);
      
      if (isMainnet) {
        const KNOWN_MAINNET_POOLS = [
          // Blend V2 Known pools - verified addresses
          'CAFI54LHZPQKT7XKZPO34BKNXQY6EOAYQP2LEKB6CPFMSGYWEQZ33DUJ', // Main lending pool
          'CA3YKL4HKRWLMQZXLZM2Y3UU6IXZJQXVNP4RSZGRNLGN5SVDCJGCPQHS'  // Secondary pool
        ];
        
        console.log(`📊 Mainnet pools configured: ${KNOWN_MAINNET_POOLS.length} addresses`);
        return KNOWN_MAINNET_POOLS;
      } else {
        const KNOWN_TESTNET_POOLS = [
          // Real testnet pools from blend-utils testnet.contracts.json
          'CDDG7DLOWSHRYQ2HWGZEZ4UTR7LPTKFFHN3QUCSZEXOWOPARMONX6T65', // TestnetV2 Pool (working)
          'CBHWKF4RHIKOKSURAKXSJRIIA7RJAMJH4VHRVPYGUF4AJ5L544LYZ35X', // Backstop V2
          'CCQ74HNBMLYICEFUGNLM23QQJU7BKZS7CXC7OAOX4IHRT3LDINZ4V3AF'  // Comet
        ];
        
        console.log(`🧪 Testnet pools configured: ${KNOWN_TESTNET_POOLS.length} addresses`);
        console.log('📝 Note: Testnet pools may have zero liquidity - this is normal for testing');
        return KNOWN_TESTNET_POOLS;
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('💥 Critical error in pool address discovery:', error);
      
      // Final emergency fallback - return minimal pool set
      const emergencyPools = this.network.passphrase.includes('Public Global')
        ? ['CAFI54LHZPQKT7XKZPO34BKNXQY6EOAYQP2LEKB6CPFMSGYWEQZ33DUJ'] // Mainnet
        : ['CDDG7DLOWSHRYQ2HWGZEZ4UTR7LPTKFFHN3QUCSZEXOWOPARMONX6T65']; // Testnet
      
      console.warn(`🚨 Using emergency fallback pools: ${emergencyPools.length} addresses`);
      return emergencyPools;
    }
  }

  async getPoolData(poolAddress: string): Promise<BlendPool> {
    try {
      // Try to fetch real pool data from Blend protocol contracts
      console.log(`Fetching real pool data for ${poolAddress}...`);
      
      // Note: This would use PoolV2.load(mainnetNetwork, poolAddress) in production
      // For now, we'll try to construct real data or fallback to realistic mock data
      
      // Always try to fetch real pool data first
      return await this.getRealPoolData(poolAddress);
    } catch (error) {
      console.error(`Error fetching pool data for ${poolAddress}:`, error);
      throw new Error(`Failed to fetch pool data for ${poolAddress}: ${error.message}`);
    }
  }
  
  private async getRealPoolData(poolAddress: string): Promise<BlendPool> {
    try {
      console.log(`🏦 Loading real pool data from Blend SDK for ${poolAddress}...`);
      
      // Try current network first (testnet or mainnet based on config)
      let blendPool;
      try {
        blendPool = await this.tryWithRpcFallback(async (network) => {
          return await PoolV2.load(network, poolAddress);
        });
        console.log(`✅ Successfully loaded pool data from ${STELLAR_CONFIG.network.toUpperCase()} contracts`);
      } catch (testnetError) {
        console.warn(`⚠️ Failed to load from ${STELLAR_CONFIG.network.toUpperCase()}, trying MAINNET fallback...`, testnetError);
        
        // If testnet fails or pools are empty, try mainnet for demo data
        console.log(`🔄 Trying mainnet pool addresses for liquidity...`);
        const mainnetPoolAddresses = [
          'CAFI54LHZPQKT7XKZPO34BKNXQY6EOAYQP2LEKB6CPFMSGYWEQZ33DUJ', // Blend V2 Primary Pool
          'CA3YKL4HKRWLMQZXLZM2Y3UU6IXZJQXVNP4RSZGRNLGN5SVDCJGCPQHS'  // Alternative pool
        ];
        
        let mainnetSuccess = false;
        for (const mainnetPool of mainnetPoolAddresses) {
          try {
            blendPool = await this.tryMainnetPool(mainnetPool);
            console.log(`✅ Successfully loaded mainnet pool ${mainnetPool} for demo data`);
            mainnetSuccess = true;
            break;
          } catch (mainnetError) {
            console.warn(`⚠️ Mainnet pool ${mainnetPool} failed:`, mainnetError);
          }
        }
        
        if (!mainnetSuccess) {
          throw new Error(`Failed to load pool from both testnet and mainnet`);
        }
        console.log(`✅ Successfully loaded pool data from MAINNET contracts (fallback)`);
      }
      
      // Load oracle data for price information
      let poolOracle = null;
      try {
        poolOracle = await blendPool.loadOracle();
        console.log(`✅ Successfully loaded pool oracle data`);
      } catch (oracleError) {
        console.warn(`⚠️ Failed to load pool oracle, continuing without oracle data:`, oracleError);
      }
      
      // Convert Blend SDK pool to our BlendPool interface and add pricing data
      return await this.convertBlendSDKToBlendPool(blendPool, poolOracle);
    } catch (error) {
      console.error(`❌ Failed to load real pool data for ${poolAddress}:`, error);
      throw new Error(`Failed to load pool data from Blend Protocol: ${error.message}`);
    }
  }
  
  // ===== BLEND SDK CONVERSION =====
  
  private async convertBlendSDKToBlendPool(blendPool: any, poolOracle: any): Promise<BlendPool> {
    try {
      console.log('🔄 Converting Blend SDK pool data to BlendPool format...');
      
      // === DEBUG: FULL POOL STRUCTURE ===
      console.log('🧪 DEBUG: Full blendPool object structure:', {
        keys: Object.keys(blendPool),
        id: blendPool.id,
        reservesType: typeof blendPool.reserves,
        reservesIsArray: Array.isArray(blendPool.reserves),
        reservesIsMap: blendPool.reserves instanceof Map,
        reservesLength: blendPool.reserves?.length || blendPool.reserves?.size,
        sampleReserves: blendPool.reserves
      });
      
      // Extract basic pool information
      const poolAddress = blendPool.id || 'unknown';
      const poolName = `Blend Pool ${poolAddress.slice(-4)}`;
      
      // Convert reserves data - handle both Array and Map structures
      const reserves: BlendReserve[] = [];
      
      if (blendPool.reserves) {
        console.log('🔍 Processing reserves...');
        
        if (blendPool.reserves instanceof Map) {
          // Handle Map<string, Reserve> structure (correct SDK type)
          console.log(`📋 Processing ${blendPool.reserves.size} reserves from Map`);
          let reserveIndex = 0;
          for (const [assetAddress, reserveData] of blendPool.reserves.entries()) {
            try {
              console.log(`🔍 Processing reserve ${reserveIndex} for asset ${assetAddress}:`, reserveData);
              const reserve = this.convertBlendReserveToBlendReserve(reserveData, reserveIndex, assetAddress);
              if (reserve) {
                reserves.push(reserve);
                console.log(`✅ Successfully converted reserve ${reserveIndex} for ${assetAddress}`);
              }
            } catch (err) {
              console.warn(`⚠️ Failed to convert reserve ${reserveIndex} for ${assetAddress}:`, err);
            }
            reserveIndex++;
          }
        } else if (Array.isArray(blendPool.reserves)) {
          // Handle Array structure (fallback)
          console.log(`📋 Processing ${blendPool.reserves.length} reserves from Array`);
          for (const [reserveIndex, reserveData] of blendPool.reserves.entries()) {
            try {
              console.log(`🔍 Processing reserve ${reserveIndex}:`, reserveData);
              const reserve = this.convertBlendReserveToBlendReserve(reserveData, reserveIndex);
              if (reserve) {
                reserves.push(reserve);
                console.log(`✅ Successfully converted reserve ${reserveIndex}`);
              }
            } catch (err) {
              console.warn(`⚠️ Failed to convert reserve ${reserveIndex}:`, err);
            }
          }
        } else {
          console.warn('⚠️ Unknown reserves structure:', typeof blendPool.reserves, blendPool.reserves);
        }
      } else {
        console.warn('⚠️ No reserves found in pool data');
      }
      
      console.log(`✅ Converted ${reserves.length} reserves from Blend SDK`);
      
      // Fetch pricing data for all assets in the pool
      console.log('💰 Fetching pricing data for pool assets...');
      const assetCodes = reserves.map(r => r.asset.code).filter(code => code !== 'UNKNOWN');
      let assetPrices: { [asset: string]: any } = {};
      
      if (assetCodes.length > 0) {
        try {
          assetPrices = await getMultipleAssetPrices(assetCodes);
          console.log(`✅ Fetched prices for ${Object.keys(assetPrices).length}/${assetCodes.length} assets`);
        } catch (pricingError) {
          console.warn('⚠️ Failed to fetch pricing data, continuing without prices:', pricingError);
        }
      }
      
      // Update reserves with pricing data
      for (const reserve of reserves) {
        const assetPrice = assetPrices[reserve.asset.code];
        if (assetPrice) {
          // Add price information to the asset
          (reserve.asset as any).price = assetPrice.price;
          (reserve.asset as any).priceSource = assetPrice.source;
          (reserve.asset as any).priceConfidence = assetPrice.confidence;
          (reserve.asset as any).priceTimestamp = assetPrice.timestamp;
          
          console.log(`💰 ${reserve.asset.code}: $${assetPrice.price} (${assetPrice.source})`);
        }
      }
      
      // Calculate pool-level metrics
      const totalSupply = reserves.reduce((sum, r) => sum + Number(r.totalSupply), 0);
      const totalBorrowed = reserves.reduce((sum, r) => sum + Number(r.totalBorrowed), 0);
      const totalLiquidity = reserves.reduce((sum, r) => sum + Number(r.availableLiquidity), 0);
      
      const avgSupplyAPY = reserves.length > 0 
        ? reserves.reduce((sum, r) => sum + r.supplyAPY, 0) / reserves.length 
        : 0;
      const avgBorrowAPY = reserves.length > 0 
        ? reserves.reduce((sum, r) => sum + r.borrowAPY, 0) / reserves.length 
        : 0;
      
      const utilizationRate = totalSupply > 0 ? totalBorrowed / totalSupply : 0;
      
      const convertedPool: BlendPool = {
        address: poolAddress,
        name: poolName,
        class: this.determinePoolClass(poolName),
        reserves,
        backstopRate: blendPool.backstop_rate || 0.1,
        status: this.determinePoolStatus(blendPool),
        totalSupply: BigInt(totalSupply),
        totalBorrowed: BigInt(totalBorrowed),
        totalLiquidity: BigInt(totalLiquidity),
        averageSupplyAPY: avgSupplyAPY,
        averageBorrowAPY: avgBorrowAPY,
        utilizationRate,
        createdAt: Date.now() - 86400000 * 30, // Default to 30 days ago
        lastUpdated: Date.now()
      };
      
      console.log(`✅ Successfully converted Blend SDK pool to BlendPool format`);
      return convertedPool;
      
    } catch (error) {
      console.error('❌ Error converting Blend SDK pool data:', error);
      throw new Error(`Failed to convert pool data: ${error.message}`);
    }
  }
  
  private convertBlendReserveToBlendReserve(reserveData: any, index: number, providedAssetAddress?: string): BlendReserve | null {
    try {
      // Extract asset information - use provided address from Map key if available
      const assetAddress = providedAssetAddress || reserveData.assetId || reserveData.asset_address || reserveData.asset || `asset_${index}`;
      const assetCode = this.getAssetCode(assetAddress);
      
      console.log(`🔍 Asset identification: address=${assetAddress}, code=${assetCode}`);
      
      // === DEBUG: RESERVE DATA STRUCTURE ===
      console.log(`🧪 DEBUG: Reserve ${index} data structure:`, {
        assetAddress,
        dataKeys: Object.keys(reserveData),
        dataStructure: reserveData,
        // Correct Blend SDK fields
        dSupply: reserveData.data?.dSupply,
        bSupply: reserveData.data?.bSupply,
        supplyApr: reserveData.supplyApr,
        borrowApr: reserveData.borrowApr,
        estSupplyApy: reserveData.estSupplyApy,
        estBorrowApy: reserveData.estBorrowApy
      });
      
      const asset: BlendAsset = {
        code: assetCode,
        contractAddress: assetAddress,
        decimals: this.getAssetDecimals(assetAddress),
        symbol: this.getAssetSymbol(assetAddress),
        name: this.getAssetName(assetAddress),
        logoURI: this.getAssetLogoURI(assetAddress)
      };
      
      // Extract reserve financial data using correct Blend SDK fields
      const totalSupply = BigInt(reserveData.data?.dSupply || '0');
      const totalBorrowed = BigInt(reserveData.data?.bSupply || '0');
      const availableLiquidity = totalSupply - totalBorrowed;
      
      // Use pre-calculated APY from Blend SDK (already in correct format)
      const supplyAPY = reserveData.estSupplyApy || 0;
      const borrowAPY = reserveData.estBorrowApy || 0;
      
      const utilizationRate = Number(totalSupply) > 0 
        ? Number(totalBorrowed) / Number(totalSupply) 
        : 0;
      
      const reserve: BlendReserve = {
        asset,
        totalSupply,
        totalBorrowed,
        availableLiquidity,
        supplyAPY,
        borrowAPY,
        utilizationRate,
        collateralFactor: (reserveData.c_factor || 80) / 100, // Convert from percentage
        liquidationFactor: (reserveData.l_factor || 85) / 100,
        lastUpdated: Date.now(),
        enabled: reserveData.enabled !== false,
        borrowable: reserveData.borrowable !== false,
        collateralCap: BigInt(reserveData.c_cap || '0'),
        borrowCap: BigInt(reserveData.b_cap || '0')
      };
      
      return reserve;
    } catch (error) {
      console.warn(`⚠️ Failed to convert reserve ${index}:`, error);
      return null;
    }
  }

  // ===== HELPER METHODS =====
  
  private getAssetCode(contractAddress: string): string {
    // Map known contract addresses to asset codes
    const assetMap: { [key: string]: string } = {
      // Real testnet asset addresses from pool reserves
      'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC': 'USDC',
      'CAZAQB3D7KSLSNOSQKYD2V4JP5V2Y3B4RDJZRLBFCCIXDCTE3WHSY3UE': 'XLM',  
      'CAP5AMC2OHNVREO66DFIN6DHJMPOBAJ2KCDDIMFBR7WWJH5RZBFM3UEI': 'USDT',
      'CAQCFVLOBK5GIULPNZRGATJJMIZL5BSP7X5YJVMGCPTUEPFM4AVSRCJU': 'BLND',
      
      // Common mainnet addresses (for future use)
      'CA7QYNF7SOWQ3GLR2BGMZEHXAVIRZA4KVWLTJJFC7MGXUA74P7UJUWDA': 'USDC',
      'CBTKUB5UGXWVJ5CDLHYAHFQFH4SQQPGM2P6KBQZABN6ZED5RTYQRMLTM': 'USDT'
    };
    
    const mapped = assetMap[contractAddress];
    if (mapped) {
      console.log(`✅ Asset mapped: ${contractAddress.slice(-8)} → ${mapped}`);
    } else {
      console.warn(`⚠️ Unknown asset: ${contractAddress.slice(-8)} → UNKNOWN`);
    }
    
    return mapped || 'UNKNOWN';
  }
  
  private getAssetDecimals(contractAddress: string): number {
    const code = this.getAssetCode(contractAddress);
    return code === 'XLM' ? 7 : 6; // XLM has 7 decimals, most others have 6
  }
  
  private getAssetSymbol(contractAddress: string): string {
    return this.getAssetCode(contractAddress);
  }
  
  private getAssetName(contractAddress: string): string {
    const nameMap: { [key: string]: string } = {
      'XLM': 'Stellar Lumens',
      'USDC': 'USD Coin',
      'USDT': 'Tether USD',
      'BLND': 'Blend Token'
    };
    
    const code = this.getAssetCode(contractAddress);
    return nameMap[code] || `Asset ${code}`;
  }
  
  private getAssetLogoURI(contractAddress: string): string {
    const logoMap: { [key: string]: string } = {
      'XLM': 'https://assets.coingecko.com/coins/images/100/small/Stellar_symbol_black_RGB.png',
      'USDC': 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png',
      'USDT': 'https://assets.coingecko.com/coins/images/325/small/Tether-logo.png',
      'BLND': 'https://blend.capital/logo.svg'
    };
    
    const code = this.getAssetCode(contractAddress);
    return logoMap[code] || '';
  }
  
  private calculateAPY(rate: number): number {
    // Convert rate to APY percentage
    // This is a simplified calculation - real implementation would be more complex
    return rate * 100;
  }
  
  private determinePoolClass(name: string): 'TBill' | 'Receivables' | 'CRE' {
    const nameLower = name.toLowerCase();
    if (nameLower.includes('tbill') || nameLower.includes('treasury')) return 'TBill';
    if (nameLower.includes('receivables') || nameLower.includes('invoice')) return 'Receivables';
    if (nameLower.includes('cre') || nameLower.includes('real estate')) return 'CRE';
    return 'TBill'; // Default
  }
  
  private determinePoolStatus(pool: any): 'Active' | 'Paused' | 'Degraded' {
    // Check pool configuration status
    if (pool.metadata?.status === 0) return 'Paused';
    if (pool.metadata?.status === 1) return 'Active';
    if (pool.metadata?.status === 2) return 'Degraded';
    return 'Active'; // Default
  }
  
  // ===== MOCK DATA REMOVED =====
  // Mock data fallback has been completely removed to force real data usage

  async getAllPools(): Promise<BlendPool[]> {
    const poolAddresses = await this.getPoolAddresses();
    const pools = await Promise.allSettled(
      poolAddresses.map(address => this.getPoolData(address))
    );

    return pools
      .filter((result): result is PromiseFulfilledResult<BlendPool> => result.status === 'fulfilled')
      .map(result => result.value);
  }
  
  // Discover pools via Pool Factory contract (simplified)
  private async discoverPoolsViaFactory(): Promise<string[]> {
    try {
      console.log(`🏭 Discovering pools via simplified factory validation...`);
      
      // Get known pool candidates and validate them by trying to load
      const poolCandidates = this.getPoolCandidates();
      const validPools: string[] = [];
      
      console.log(`🔍 Testing ${poolCandidates.length} pool candidates for loadability...`);
      
      for (const poolAddress of poolCandidates) {
        try {
          const isValid = await this.validatePoolViaFactory(poolAddress);
          if (isValid) {
            console.log(`✅ Pool ${poolAddress.slice(-8)} validated successfully`);
            validPools.push(poolAddress);
          } else {
            console.log(`❌ Pool ${poolAddress.slice(-8)} validation failed`);
          }
        } catch (error) {
          console.warn(`⚠️ Failed to validate pool ${poolAddress.slice(-8)}:`, error);
        }
      }
      
      console.log(`🏭 Pool discovery complete: ${validPools.length}/${poolCandidates.length} pools validated`);
      return validPools;
      
    } catch (error) {
      console.warn('❌ Pool discovery failed:', error);
      return [];
    }
  }

  // Get candidate pool addresses from various sources
  private getPoolCandidates(): string[] {
    const isMainnet = this.network.passphrase.includes('Public Global');
    
    if (isMainnet) {
      return [
        // Known mainnet pool candidates - need real addresses
        'CAFI54LHZPQKT7XKZPO34BKNXQY6EOAYQP2LEKB6CPFMSGYWEQZ33DUJ',
        'CA3YKL4HKRWLMQZXLZM2Y3UU6IXZJQXVNP4RSZGRNLGN5SVDCJGCPQHS',
      ];
    } else {
      return [
        // Known testnet pool candidates
        'CDDG7DLOWSHRYQ2HWGZEZ4UTR7LPTKFFHN3QUCSZEXOWOPARMONX6T65', // Working pool
        'CBHWKF4RHIKOKSURAKXSJRIIA7RJAMJH4VHRVPYGUF4AJ5L544LYZ35X', // Need to validate
        'CCQ74HNBMLYICEFUGNLM23QQJU7BKZS7CXC7OAOX4IHRT3LDINZ4V3AF', // Need to validate
        // Add more testnet candidates if known
      ];
    }
  }

  // Validate a pool address via Pool Factory (simplified validation)
  private async validatePoolViaFactory(poolAddress: string): Promise<boolean> {
    try {
      console.log(`🏭 Validating pool ${poolAddress.slice(-8)} via simplified factory check...`);
      
      // Simplified validation - just check if we can load the pool
      // This avoids the StellarRpc import issue while still providing validation
      return await this.tryWithRpcFallback(async (network) => {
        try {
          const testPool = await PoolV2.load(network, poolAddress);
          return testPool && testPool.id === poolAddress;
        } catch (error) {
          console.warn(`Pool ${poolAddress.slice(-8)} failed validation:`, error);
          return false;
        }
      });
    } catch (error) {
      console.warn(`Factory validation failed for ${poolAddress.slice(-8)}:`, error);
      return false; // If validation fails, assume invalid
    }
  }

  // Helper method to try mainnet pools when testnet is empty
  private async tryMainnetPool(poolAddress: string): Promise<any> {
    const mainnetNetwork = MAINNET_NETWORK;
    const fallbackRpcs = ['https://soroban-rpc.mainnet.stellar.org', 'https://mainnet.sorobanrpc.com'];
    
    for (const rpcUrl of fallbackRpcs) {
      try {
        const network = { ...mainnetNetwork, rpc: rpcUrl };
        return await PoolV2.load(network, poolAddress);
      } catch (error) {
        console.warn(`Failed with mainnet RPC ${rpcUrl}:`, error);
        if (rpcUrl === fallbackRpcs[fallbackRpcs.length - 1]) {
          throw error; // Re-throw on last attempt
        }
      }
    }
  }
}

// ===== HOOK IMPLEMENTATION =====

const BLEND_POOLS_QUERY_KEY = 'blend-pools';
const CACHE_TIME = 10 * 60 * 1000; // 10 minutes
const STALE_TIME = 60 * 1000; // 1 minute
const BACKGROUND_REFETCH_INTERVAL = 2 * 60 * 1000; // 2 minutes

export const useBlendPools = (): UseBlendPoolsReturn => {
  const [blendClient] = useState(() => new BlendSDKClient()); // Use environment configuration
  const queryClient = useQueryClient();
  
  const {
    data: pools = [],
    isLoading: loading,
    error: queryError,
    refetch: queryRefetch,
    dataUpdatedAt: lastUpdated
  } = useQuery({
    queryKey: [BLEND_POOLS_QUERY_KEY],
    queryFn: () => blendClient.getAllPools(),
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchInterval: BACKGROUND_REFETCH_INTERVAL,
    refetchIntervalInBackground: false,
    retry: (failureCount, error) => {
      // Don't retry if it's a network error after 3 attempts
      if (failureCount >= 3) return false;
      // Don't retry if it's a user rejection or contract error
      if (error.message?.includes('User rejected') || error.message?.includes('Contract error')) {
        return false;
      }
      return true;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Transform query error to BlendError
  const error: BlendError | null = queryError ? {
    code: 'NETWORK_ERROR',
    message: queryError.message || 'Failed to fetch pool data',
    details: queryError,
    timestamp: Date.now()
  } : null;

  // Manual refetch function with error handling
  const refetch = useCallback(async (): Promise<void> => {
    try {
      await queryRefetch();
    } catch (err) {
      console.error('Failed to refetch pools:', err);
      throw err;
    }
  }, [queryRefetch]);

  // Invalidate cache when needed
  const invalidateCache = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: [BLEND_POOLS_QUERY_KEY] });
  }, [queryClient]);

  // Auto-refresh every 2 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading) {
        invalidateCache();
      }
    }, 120000); // 2 minutes

    return () => clearInterval(interval);
  }, [loading, invalidateCache]);

  return {
    pools,
    loading,
    error,
    refetch,
    lastUpdated
  };
};

// ===== RELATED HOOKS =====

// Hook for a single pool
export const useBlendPool = (poolAddress: string) => {
  const [blendClient] = useState(() => new BlendSDKClient()); // Use environment configuration
  
  return useQuery({
    queryKey: [BLEND_POOLS_QUERY_KEY, poolAddress],
    queryFn: () => blendClient.getPoolData(poolAddress),
    enabled: !!poolAddress,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
  });
};

// Hook for pool statistics
export const usePoolStatistics = () => {
  const { pools, loading, error } = useBlendPools();
  
  const statistics = {
    totalPools: pools.length,
    totalTVL: pools.reduce((sum, pool) => sum + Number(pool.totalLiquidity), 0),
    averageAPY: pools.length > 0 
      ? pools.reduce((sum, pool) => sum + pool.averageSupplyAPY, 0) / pools.length 
      : 0,
    totalSupplied: pools.reduce((sum, pool) => sum + Number(pool.totalSupply), 0),
    totalBorrowed: pools.reduce((sum, pool) => sum + Number(pool.totalBorrowed), 0),
    averageUtilization: pools.length > 0
      ? pools.reduce((sum, pool) => sum + pool.utilizationRate, 0) / pools.length
      : 0,
    activePools: pools.filter(pool => pool.status === 'Active').length,
    pausedPools: pools.filter(pool => pool.status === 'Paused').length,
    degradedPools: pools.filter(pool => pool.status === 'Degraded').length,
  };

  return {
    statistics,
    loading,
    error
  };
};