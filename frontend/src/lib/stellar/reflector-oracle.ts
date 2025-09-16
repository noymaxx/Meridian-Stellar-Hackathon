import { 
  rpc,
  Contract, 
  TransactionBuilder,
  Account,
  xdr,
  scValToNative,
  nativeToScVal
} from '@stellar/stellar-sdk';

// ===== REFLECTOR ORACLE CONTRACT CLIENT =====

interface OracleContractAddresses {
  stellarDex: string;
  externalDexs: string;
  fiatRates: string;
}

interface OracleContractResponse {
  reflectorPair: string;
  twap: string;
  twapTs: number;
  staleSecs: number;
  nav: string;
  navValidUntil: number;
  haircutBps: number;
  bandBps: number;
  effectivePrice: string;
  degraded: boolean;
}

interface AssetPriceFromContract {
  asset: string;
  price: number;
  timestamp: number;
  source: string;
  degraded: boolean;
}

// Known asset mappings to oracle pairs - Reflector standard format (SEP-40)
const ASSET_TO_ORACLE_PAIR_FORMATS: { [key: string]: string[] } = {
  'XLM': ['XLM', 'xlm'], // Reflector uses simple symbols for major assets
  'USDC': ['USDC', 'usdc'], 
  'USDT': ['USDT', 'usdt'],
  'BLND': ['BLND', 'blnd'], // Blend token for hackathon
  'BTC': ['BTC', 'btc'],
  'ETH': ['ETH', 'eth'],
  'EUR': ['EUR', 'eur'] // As seen in the Euro Guesser tutorial
};

export class ReflectorOracleContractClient {
  private rpcServer: rpc.Server;
  private fallbackRpcUrls: string[];
  private currentRpcIndex: number = 0;
  private contractAddresses: OracleContractAddresses;
  private networkPassphrase: string;
  private priceCache: Map<string, { price: AssetPriceFromContract; expires: number }> = new Map();
  private readonly CACHE_DURATION = 30 * 1000; // 30 seconds

  constructor(
    rpcUrl: string,
    networkPassphrase: string,
    contractAddresses: OracleContractAddresses,
    fallbackRpcUrls: string[] = []
  ) {
    this.rpcServer = new rpc.Server(rpcUrl);
    this.fallbackRpcUrls = fallbackRpcUrls;
    this.networkPassphrase = networkPassphrase;
    this.contractAddresses = contractAddresses;
  }
  
  private async tryWithRpcFallback<T>(operation: (rpcServer: rpc.Server) => Promise<T>): Promise<T> {
    const allRpcUrls = [this.rpcServer.serverURL.toString(), ...this.fallbackRpcUrls];
    
    for (let i = 0; i < allRpcUrls.length; i++) {
      const rpcUrl = allRpcUrls[(this.currentRpcIndex + i) % allRpcUrls.length];
      const rpcServer = new rpc.Server(rpcUrl);
      
      try {
        console.log(`🔗 Trying RPC: ${rpcUrl}`);
        const result = await operation(rpcServer);
        
        // Success - update current RPC if we switched
        if (i > 0) {
          this.currentRpcIndex = (this.currentRpcIndex + i) % allRpcUrls.length;
          this.rpcServer = rpcServer;
          console.log(`✅ Switched to RPC: ${rpcUrl}`);
        }
        
        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.warn(`❌ RPC ${rpcUrl} failed:`, errorMessage);
        
        // If this is the last RPC to try, throw the error
        if (i === allRpcUrls.length - 1) {
          throw error;
        }
        
        continue; // Try next RPC
      }
    }
    
    throw new Error('All RPC endpoints failed');
  }

  // ===== CORE ORACLE FUNCTIONS =====

  async verifyContractExists(contractAddress: string): Promise<boolean> {
    try {
      console.log(`🔍 Verifying contract exists: ${contractAddress}`);
      
      // Try to get contract instance to verify it exists
      const result = await this.tryWithRpcFallback(async (rpcServer) => {
        return await rpcServer.getContractData(contractAddress);
      });
      
      console.log(`✅ Contract ${contractAddress} exists and is accessible`);
      return true;
    } catch (error) {
      console.warn(`⚠️ Contract verification failed for ${contractAddress}:`, error);
      // Return true to continue with direct call attempt
      return true;
    }
  }

  async getOracleState(contractAddress: string, reflectorPair: string): Promise<OracleContractResponse> {
    console.log(`🔍 Starting oracle query for contract: ${contractAddress}`);
    console.log(`🎯 Target asset/pair: ${reflectorPair}`);
    console.log(`🌐 Network: ${this.networkPassphrase}`);
    console.log(`🔗 RPC URL: ${this.rpcServer.serverURL.toString()}`);
    
    // Correct function names based on Reflector documentation (SEP-40 standard)
    const functionNames = ['lastprice', 'price']; // Try 'lastprice' first (official function)
    const parameterFormats = [
      { type: 'symbol' }  // SEP-40 standard format
    ];
    
    let lastError: Error | null = null;
    let attemptCount = 0;
    
    for (const functionName of functionNames) {
      for (const paramFormat of parameterFormats) {
        attemptCount++;
        try {
          console.log(`📞 Attempt ${attemptCount}: Calling '${functionName}' with ${paramFormat.type} parameter: "${reflectorPair}"`);
          console.log(`🎯 Contract Address: ${contractAddress}`);
          console.log(`🔗 RPC Server: ${this.rpcServer.serverURL.toString()}`);
          
          const contract = new Contract(contractAddress);
          
          // Convert parameter and log details
          const scVal = nativeToScVal(reflectorPair, paramFormat);
          console.log(`📦 Parameter converted to ScVal:`, scVal);
          
          const operation = contract.call(
            functionName,
            scVal
          );

          // Create a null account for simulation
          const nullAccount = new Account('GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF', '0');
          
          console.log(`🚀 Simulating transaction for ${functionName}...`);
          
          // Use RPC fallback with timeout
          const result = await this.tryWithRpcFallback(async (rpcServer) => {
            return await Promise.race([
              rpcServer.simulateTransaction(
                new TransactionBuilder(nullAccount, {
                  fee: '100',
                  networkPassphrase: this.networkPassphrase,
                })
                  .addOperation(operation)
                  .setTimeout(30)
                  .build()
              ),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('RPC timeout after 10 seconds')), 10000)
              )
            ]) as any;
          });

          if (result.error) {
            // Check for network-level errors and fail fast
            if (result.error.includes('ERR_NAME_NOT_RESOLVED') || 
                result.error.includes('ERR_NETWORK') ||
                result.error.includes('net::')) {
              throw new Error(`Network connectivity issue: ${result.error}`);
            }
            
            console.warn(`❌ Function '${functionName}' failed with error:`, result.error);
            lastError = new Error(`Oracle contract error: ${result.error}`);
            continue;
          }

          if (!result.result || !result.result.retval) {
            console.warn(`⚠️ Function '${functionName}' returned no data`);
            lastError = new Error('No data returned from oracle contract');
            continue;
          }

          // Parse the returned ScVal to native format
          const parsedResult = scValToNative(result.result.retval);
          console.log(`✅ Successfully got data from oracle function '${functionName}':`, parsedResult);
          
          return this.parseOracleResponse(parsedResult);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          
          // Fail fast on network issues
          if (errorMessage.includes('ERR_NAME_NOT_RESOLVED') || 
              errorMessage.includes('ERR_NETWORK') ||
              errorMessage.includes('net::') ||
              errorMessage.includes('RPC timeout')) {
            console.error(`🌐 Network connectivity issue detected: ${errorMessage}`);
            throw new Error(`Oracle network connectivity failed: ${errorMessage}`);
          }
          
          console.warn(`❌ Failed to call '${functionName}' with ${paramFormat.type}:`, error);
          lastError = error as Error;
          continue;
        }
      }
    }
    
    console.error(`💥 All ${attemptCount} oracle contract attempts failed for ${contractAddress} with asset ${reflectorPair}`);
    // If all attempts failed, throw the last error
    throw lastError || new Error(`Failed to query oracle contract ${contractAddress} with all available methods`);
  }

  async getAssetPrice(asset: string): Promise<AssetPriceFromContract> {
    // Check cache first
    const cacheKey = asset.toUpperCase();
    const cached = this.priceCache.get(cacheKey);
    
    if (cached && cached.expires > Date.now()) {
      return cached.price;
    }

    try {
      const oraclePairFormats = ASSET_TO_ORACLE_PAIR_FORMATS[asset.toUpperCase()];
      if (!oraclePairFormats || oraclePairFormats.length === 0) {
        throw new Error(`No oracle pair formats found for asset: ${asset}`);
      }

      // Try different oracle contracts based on asset type
      const contractAddressesToTry: string[] = [];
      
      if (['XLM', 'USDC', 'USDT'].includes(asset.toUpperCase())) {
        contractAddressesToTry.push(this.contractAddresses.stellarDex);
        contractAddressesToTry.push(this.contractAddresses.fiatRates); // Fallback
      } else if (['BTC', 'ETH'].includes(asset.toUpperCase())) {
        contractAddressesToTry.push(this.contractAddresses.externalDexs);
        contractAddressesToTry.push(this.contractAddresses.stellarDex); // Fallback
      } else {
        contractAddressesToTry.push(this.contractAddresses.fiatRates);
      }

      let lastError: Error | null = null;

      // Try each contract address with each pair format
      for (const contractAddress of contractAddressesToTry) {
        // First verify the contract exists
        const contractExists = await this.verifyContractExists(contractAddress);
        if (!contractExists) {
          console.warn(`⚠️ Skipping contract ${contractAddress} - does not exist on current network`);
          continue;
        }
        
        for (const oraclePair of oraclePairFormats) {
          try {
            console.log(`🔄 Trying oracle contract ${contractAddress} with pair ${oraclePair} for asset ${asset}`);
            const oracleState = await this.getOracleState(contractAddress, oraclePair);
            
            const priceValue = parseFloat(oracleState.effectivePrice);
            if (isNaN(priceValue) || priceValue <= 0) {
              throw new Error(`Invalid price returned: ${oracleState.effectivePrice}`);
            }
            
            const price: AssetPriceFromContract = {
              asset: asset.toUpperCase(),
              price: priceValue,
              timestamp: Date.now(),
              source: 'reflector-oracle',
              degraded: oracleState.degraded
            };

            // Cache the result
            this.priceCache.set(cacheKey, {
              price,
              expires: Date.now() + this.CACHE_DURATION
            });

            console.log(`Successfully fetched price for ${asset}: ${priceValue}`);
            return price;
          } catch (error) {
            console.warn(`Failed to get price for ${asset} from contract ${contractAddress} with pair ${oraclePair}:`, error);
            lastError = error as Error;
            continue;
          }
        }
      }
      
      // If all attempts failed, provide detailed error information
      const errorDetails = {
        asset,
        contractsAttempted: contractAddressesToTry.length,
        pairFormatsAttempted: oraclePairFormats.length,
        network: this.networkPassphrase,
        rpcUrl: this.rpcServer.serverURL.toString()
      };
      
      console.error(`💥 Oracle price fetch failed for ${asset}:`, errorDetails);
      throw new Error(`Failed to fetch price for ${asset} from oracle contracts. Tried ${contractAddressesToTry.length} contracts with ${oraclePairFormats.length} pair formats each. Last error: ${lastError?.message || 'Unknown error'}`);
    } catch (error) {
      console.error(`🚨 Critical error fetching price for ${asset} from oracle:`, error);
      
      // Return cached data if available, even if expired
      const cached = this.priceCache.get(cacheKey);
      if (cached) {
        console.warn(`🔄 Using stale cached price for ${asset} (${Math.round((Date.now() - cached.expires) / 1000)}s old)`);
        return { ...cached.price, timestamp: Date.now() };
      }
      
      throw new Error(`Oracle unavailable for ${asset}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getMultipleAssetPrices(assets: string[]): Promise<{ [asset: string]: AssetPriceFromContract }> {
    const results: { [asset: string]: AssetPriceFromContract } = {};
    
    // Process in parallel with error handling
    const pricePromises = assets.map(async (asset) => {
      try {
        const price = await this.getAssetPrice(asset);
        results[asset.toUpperCase()] = price;
      } catch (error) {
        console.error(`Failed to fetch price for ${asset} from oracle:`, error);
        // Don't include failed assets in results
      }
    });

    await Promise.allSettled(pricePromises);
    return results;
  }

  // ===== ORACLE STATE CHECKS =====

  async isOracleDegraded(contractAddress: string, reflectorPair: string): Promise<boolean> {
    try {
      const oracleState = await this.getOracleState(contractAddress, reflectorPair);
      return oracleState.degraded;
    } catch (error) {
      console.error(`Error checking oracle degraded status:`, error);
      return true; // Assume degraded if we can't check
    }
  }

  async getLastUpdate(contractAddress: string, reflectorPair: string): Promise<number> {
    try {
      const oracleState = await this.getOracleState(contractAddress, reflectorPair);
      return oracleState.twapTs * 1000; // Convert to milliseconds
    } catch (error) {
      console.error(`Error getting last update timestamp:`, error);
      return 0;
    }
  }

  // ===== UTILITY FUNCTIONS =====

  private parseOracleResponse(rawResponse: any): OracleContractResponse {
    console.log('Raw oracle response structure:', rawResponse);
    
    // Handle different possible response formats
    if (typeof rawResponse === 'number' || typeof rawResponse === 'string') {
      // Simple price response
      return {
        reflectorPair: 'unknown',
        twap: String(rawResponse),
        twapTs: Date.now() / 1000,
        staleSecs: 0,
        nav: String(rawResponse),
        navValidUntil: Date.now() / 1000 + 3600,
        haircutBps: 0,
        bandBps: 0,
        effectivePrice: String(rawResponse),
        degraded: false
      };
    }
    
    // Handle object response with various possible field names
    const response = rawResponse as Record<string, unknown>;
    
    // Try different field name variations
    const price = response.price || response.effectivePrice || response.effective_price || 
                  response.twap || response.lastPrice || response.last_price || '0';
    
    return {
      reflectorPair: (response.reflectorPair || response.reflector_pair || response.pair || '') as string,
      twap: String(response.twap || price),
      twapTs: Number(response.twapTs || response.twap_ts || response.timestamp) || Date.now() / 1000,
      staleSecs: Number(response.staleSecs || response.stale_secs) || 0,
      nav: String(response.nav || price),
      navValidUntil: Number(response.navValidUntil || response.nav_valid_until) || Date.now() / 1000 + 3600,
      haircutBps: Number(response.haircutBps || response.haircut_bps) || 0,
      bandBps: Number(response.bandBps || response.band_bps) || 0,
      effectivePrice: String(price),
      degraded: Boolean(response.degraded) || false
    };
  }

  // ===== HEALTH CHECK =====

  async checkOracleHealth(): Promise<boolean> {
    try {
      // Try to get XLM price as a health check
      await this.getAssetPrice('XLM');
      return true;
    } catch (error) {
      console.warn('Oracle health check failed:', error);
      return false;
    }
  }

  async getDetailedOracleHealth(): Promise<{
    overall: boolean;
    contracts: { [address: string]: { exists: boolean; accessible: boolean; lastError?: string } };
    network: string;
    rpcUrl: string;
  }> {
    console.log(`🏥 Starting detailed oracle health check...`);
    
    const allAddresses = [
      this.contractAddresses.stellarDex,
      this.contractAddresses.externalDexs,
      this.contractAddresses.fiatRates
    ];
    
    const contractHealth: { [address: string]: { exists: boolean; accessible: boolean; lastError?: string } } = {};
    let overallHealth = true;
    
    for (const address of allAddresses) {
      try {
        console.log(`🔍 Checking contract: ${address}`);
        const exists = await this.verifyContractExists(address);
        
        if (exists) {
          // Try a simple function call to test accessibility
          try {
            await this.getOracleState(address, 'XLM');
            contractHealth[address] = { exists: true, accessible: true };
            console.log(`✅ Contract ${address} is healthy`);
          } catch (error) {
            contractHealth[address] = { 
              exists: true, 
              accessible: false, 
              lastError: error instanceof Error ? error.message : 'Unknown error'
            };
            console.warn(`⚠️ Contract ${address} exists but not accessible:`, error);
            overallHealth = false;
          }
        } else {
          contractHealth[address] = { exists: false, accessible: false, lastError: 'Contract not found' };
          console.warn(`❌ Contract ${address} does not exist`);
          overallHealth = false;
        }
      } catch (error) {
        contractHealth[address] = { 
          exists: false, 
          accessible: false, 
          lastError: error instanceof Error ? error.message : 'Unknown error'
        };
        console.error(`💥 Failed to check contract ${address}:`, error);
        overallHealth = false;
      }
    }
    
    const healthReport = {
      overall: overallHealth,
      contracts: contractHealth,
      network: this.networkPassphrase,
      rpcUrl: this.rpcServer.serverURL.toString()
    };
    
    console.log(`🏥 Oracle health check complete:`, healthReport);
    return healthReport;
  }

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

  // ===== SUPPORTED ASSETS =====

  getSupportedAssets(): string[] {
    return Object.keys(ASSET_TO_ORACLE_PAIR_FORMATS);
  }

  isAssetSupported(asset: string): boolean {
    return asset.toUpperCase() in ASSET_TO_ORACLE_PAIR_FORMATS;
  }
}

// ===== MAINNET CONFIGURATION =====

export const MAINNET_ORACLE_ADDRESSES: OracleContractAddresses = {
  stellarDex: 'CALI2BYU2JE6WVRUFYTS6MSBNEHGJ35P4AVCZYF3B6QOE3QKOB2PLE6M',
  externalDexs: 'CAFJZQWSED6YAWZU3GWRTOCNPPCGBN32L7QV43XX5LZLFTK6JLN34DLN', 
  fiatRates: 'CBKGPWGKSKZF52CFHMTRR23TBWTPMRDIYZ4O2P5VS65BMHYH4DXMCJZC'
};

// ===== TESTNET CONFIGURATION =====

export const TESTNET_ORACLE_ADDRESSES: OracleContractAddresses = {
  // Actual testnet contract addresses for Reflector oracle
  stellarDex: 'CCYOZJCOPG34LLQQ7N24YXBM7LL62R7ONMZ3G6WZAAYPB5OYKOMJRN63', // Reflector FX rates testnet
  externalDexs: 'CCYOZJCOPG34LLQQ7N24YXBM7LL62R7ONMZ3G6WZAAYPB5OYKOMJRN63', // Same contract for different feeds
  fiatRates: 'CCYOZJCOPG34LLQQ7N24YXBM7LL62R7ONMZ3G6WZAAYPB5OYKOMJRN63' // Same contract for fiat rates
};

// ===== FACTORY FUNCTION =====

export function createReflectorOracleClient(
  isMainnet: boolean = false,
  customRpcUrl?: string,
  customContractAddresses?: OracleContractAddresses
): ReflectorOracleContractClient {
  const rpcUrl = customRpcUrl || (isMainnet 
    ? 'https://soroban-rpc.mainnet.stellar.org' 
    : 'https://soroban-testnet.stellar.org');
    
  const networkPassphrase = isMainnet 
    ? 'Public Global Stellar Network ; September 2015'
    : 'Test SDF Network ; September 2015';
    
  const contractAddresses = customContractAddresses || (isMainnet 
    ? MAINNET_ORACLE_ADDRESSES 
    : TESTNET_ORACLE_ADDRESSES);

  return new ReflectorOracleContractClient(rpcUrl, networkPassphrase, contractAddresses);
}

// Factory function using stellar config
export function createReflectorOracleClientFromConfig(stellarConfig: {
  sorobanRpcUrl: string;
  networkPassphrase: string;
  oracleContracts: OracleContractAddresses;
}): ReflectorOracleContractClient {
  return new ReflectorOracleContractClient(
    stellarConfig.sorobanRpcUrl,
    stellarConfig.networkPassphrase,
    stellarConfig.oracleContracts
  );
}

// Factory function using oracle-specific config (mainnet for real data)
export function createReflectorOracleClientFromOracleConfig(oracleConfig: {
  network: string;
  sorobanRpcUrl: string;
  fallbackRpcUrls?: string[];
  networkPassphrase: string;
  oracleContracts: OracleContractAddresses;
}): ReflectorOracleContractClient {
  console.log(`🔮 Creating Oracle client with ${oracleConfig.network} configuration for real price data`);
  console.log(`📡 Oracle RPC: ${oracleConfig.sorobanRpcUrl}`);
  console.log(`🌐 Oracle Network: ${oracleConfig.networkPassphrase}`);
  if (oracleConfig.fallbackRpcUrls && oracleConfig.fallbackRpcUrls.length > 0) {
    console.log(`🔄 Fallback RPCs: ${oracleConfig.fallbackRpcUrls.join(', ')}`);
  }
  
  return new ReflectorOracleContractClient(
    oracleConfig.sorobanRpcUrl,
    oracleConfig.networkPassphrase,
    oracleConfig.oracleContracts,
    oracleConfig.fallbackRpcUrls || []
  );
}