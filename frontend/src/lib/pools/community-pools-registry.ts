// ===== COMMUNITY POOLS REGISTRY =====
// Registry para pools desenvolvidas por usuários da comunidade

export interface CommunityPoolMetadata {
  address: string;
  name: string;
  creator: string;
  description: string;
  category: 'DeFi' | 'RWA' | 'Experimental' | 'Gaming' | 'Other';
  tags: string[];
  website?: string;
  twitter?: string;
  github?: string;
  verified: boolean;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Experimental';
  addedAt: number;
  lastValidated?: number;
}

export interface PoolRegistryConfig {
  enableCommunityPools: boolean;
  enableAutoValidation: boolean;
  maxPoolsPerNetwork: number;
  validationIntervalHours: number;
  requireMinLiquidity: number;
}

// Registry de pools da comunidade para hackathon
const COMMUNITY_POOLS_TESTNET: CommunityPoolMetadata[] = [
  {
    address: 'CCOMMUNITY1EXAMPLEPOOL1ADDRESSFORTESTNETCOMMUNITY1',
    name: 'DeFi Innovators Pool',
    creator: 'team@defi-innovators.stellar',
    description: 'Experimental lending pool focused on high-yield DeFi strategies with dynamic interest rates',
    category: 'DeFi',
    tags: ['experimental', 'high-yield', 'dynamic-rates'],
    website: 'https://defi-innovators.stellar',
    twitter: '@DefiInnovators',
    verified: false,
    riskLevel: 'High',
    addedAt: Date.now() - 86400000 * 7, // 7 days ago
  },
  {
    address: 'CCOMMUNITY2RWAPOOLEXAMPLEFORTESTNETCOMMUNITY2RWA',
    name: 'Real Estate Tokens Pool',
    creator: 'real-estate@stellar-rwa.com',
    description: 'Community-managed pool for tokenized real estate assets with stable returns',
    category: 'RWA',
    tags: ['real-estate', 'stable', 'community-managed'],
    website: 'https://stellar-rwa.com',
    verified: true,
    riskLevel: 'Medium',
    addedAt: Date.now() - 86400000 * 14, // 14 days ago
    lastValidated: Date.now() - 86400000 * 1, // Validated 1 day ago
  },
  {
    address: 'CCOMMUNITY3GAMEFIPOOL4TESTNETGAMINGANDNFTLENDING',
    name: 'GameFi Lending Hub',
    creator: 'gamefi@stellar-gaming.io',
    description: 'Specialized pool for gaming assets and NFT-backed lending with gaming rewards',
    category: 'Gaming',
    tags: ['gaming', 'nft', 'rewards', 'gamefi'],
    website: 'https://stellar-gaming.io',
    twitter: '@StellarGameFi',
    github: 'stellar-gamefi/lending-pool',
    verified: false,
    riskLevel: 'Experimental',
    addedAt: Date.now() - 86400000 * 3, // 3 days ago
  },
  {
    address: 'CCOMMUNITY4STABLECOINPOOLFORTESTNETCOMMUNITYUSE4',
    name: 'Multi-Stablecoin Vault',
    creator: 'stable@stellar-defi.org',
    description: 'Conservative pool focusing on multiple stablecoins with automated rebalancing',
    category: 'DeFi',
    tags: ['stable', 'conservative', 'automated', 'multi-asset'],
    website: 'https://stellar-defi.org',
    verified: true,
    riskLevel: 'Low',
    addedAt: Date.now() - 86400000 * 21, // 21 days ago
    lastValidated: Date.now() - 86400000 * 2, // Validated 2 days ago
  },
  {
    address: 'CCOMMUNITY5EXPPOOL5FORTESTNETEXPERIMENTALFEATURES',
    name: 'Research Labs Pool',
    creator: 'research@stellar-labs.dev',
    description: 'Experimental pool testing new DeFi primitives and yield optimization strategies',
    category: 'Experimental',
    tags: ['research', 'experimental', 'yield-optimization', 'bleeding-edge'],
    github: 'stellar-labs/experimental-pool',
    twitter: '@StellarLabs',
    verified: false,
    riskLevel: 'Experimental',
    addedAt: Date.now() - 86400000 * 1, // 1 day ago
  }
];

const COMMUNITY_POOLS_MAINNET: CommunityPoolMetadata[] = [
  // Mainnet community pools (para quando sair do testnet)
  {
    address: 'CMAINNET1COMMUNITYPOOLEXAMPLEFORMAINNETCOMMUNITY1',
    name: 'Stellar Yield Farmers',
    creator: 'yield@stellar-farmers.co',
    description: 'Community-driven yield farming pool with optimized strategies',
    category: 'DeFi',
    tags: ['yield-farming', 'optimized', 'community'],
    website: 'https://stellar-farmers.co',
    verified: true,
    riskLevel: 'Medium',
    addedAt: Date.now() - 86400000 * 30,
    lastValidated: Date.now() - 86400000 * 1,
  }
];

// Configuração padrão do registry
const DEFAULT_REGISTRY_CONFIG: PoolRegistryConfig = {
  enableCommunityPools: true,
  enableAutoValidation: false, // Desabilitado para hackathon
  maxPoolsPerNetwork: 50,
  validationIntervalHours: 24,
  requireMinLiquidity: 1000 // $1,000 USD minimum
};

export class CommunityPoolsRegistry {
  private config: PoolRegistryConfig;
  private testnetPools: CommunityPoolMetadata[];
  private mainnetPools: CommunityPoolMetadata[];

  constructor(config: Partial<PoolRegistryConfig> = {}) {
    this.config = { ...DEFAULT_REGISTRY_CONFIG, ...config };
    this.testnetPools = [...COMMUNITY_POOLS_TESTNET];
    this.mainnetPools = [...COMMUNITY_POOLS_MAINNET];
    
    console.log('🏘️ Community Pools Registry initialized');
    console.log(`📊 Testnet pools: ${this.testnetPools.length}`);
    console.log(`📊 Mainnet pools: ${this.mainnetPools.length}`);
    console.log(`⚙️ Config:`, this.config);
  }

  // Get all community pools for a network
  getCommunityPools(network: 'testnet' | 'mainnet'): CommunityPoolMetadata[] {
    if (!this.config.enableCommunityPools) {
      return [];
    }

    const pools = network === 'testnet' ? this.testnetPools : this.mainnetPools;
    return pools.slice(0, this.config.maxPoolsPerNetwork);
  }

  // Get pool by address
  getPoolByAddress(address: string): CommunityPoolMetadata | null {
    const allPools = [...this.testnetPools, ...this.mainnetPools];
    return allPools.find(pool => pool.address === address) || null;
  }

  // Filter pools by criteria
  filterPools(
    network: 'testnet' | 'mainnet',
    criteria: {
      category?: CommunityPoolMetadata['category'];
      verified?: boolean;
      riskLevel?: CommunityPoolMetadata['riskLevel'];
      tags?: string[];
      search?: string;
    }
  ): CommunityPoolMetadata[] {
    let pools = this.getCommunityPools(network);

    if (criteria.category) {
      pools = pools.filter(pool => pool.category === criteria.category);
    }

    if (criteria.verified !== undefined) {
      pools = pools.filter(pool => pool.verified === criteria.verified);
    }

    if (criteria.riskLevel) {
      pools = pools.filter(pool => pool.riskLevel === criteria.riskLevel);
    }

    if (criteria.tags && criteria.tags.length > 0) {
      pools = pools.filter(pool => 
        criteria.tags!.some(tag => pool.tags.includes(tag))
      );
    }

    if (criteria.search) {
      const searchLower = criteria.search.toLowerCase();
      pools = pools.filter(pool => 
        pool.name.toLowerCase().includes(searchLower) ||
        pool.description.toLowerCase().includes(searchLower) ||
        pool.creator.toLowerCase().includes(searchLower) ||
        pool.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    return pools;
  }

  // Add new community pool (for future use)
  addCommunityPool(network: 'testnet' | 'mainnet', pool: Omit<CommunityPoolMetadata, 'addedAt'>): boolean {
    try {
      const poolWithTimestamp: CommunityPoolMetadata = {
        ...pool,
        addedAt: Date.now()
      };

      if (network === 'testnet') {
        this.testnetPools.push(poolWithTimestamp);
      } else {
        this.mainnetPools.push(poolWithTimestamp);
      }

      console.log(`✅ Added community pool: ${pool.name} (${network})`);
      return true;
    } catch (error) {
      console.error('❌ Failed to add community pool:', error);
      return false;
    }
  }

  // Validate pool address format
  isValidPoolAddress(address: string): boolean {
    // Stellar address validation (basic)
    return /^C[A-Z0-9]{55}$/.test(address);
  }

  // Get risk level color for UI
  getRiskLevelColor(riskLevel: CommunityPoolMetadata['riskLevel']): string {
    switch (riskLevel) {
      case 'Low': return 'text-green-400';
      case 'Medium': return 'text-yellow-400';
      case 'High': return 'text-orange-400';
      case 'Experimental': return 'text-red-400';
      default: return 'text-gray-400';
    }
  }

  // Get category icon for UI
  getCategoryIcon(category: CommunityPoolMetadata['category']): string {
    switch (category) {
      case 'DeFi': return '⚡';
      case 'RWA': return '🏢';
      case 'Gaming': return '🎮';
      case 'Experimental': return '🧪';
      case 'Other': return '📦';
      default: return '❓';
    }
  }

  // Get pool statistics
  getRegistryStats(network?: 'testnet' | 'mainnet') {
    const pools = network ? this.getCommunityPools(network) : [...this.testnetPools, ...this.mainnetPools];
    
    const verifiedCount = pools.filter(p => p.verified).length;
    const categoryStats = pools.reduce((acc, pool) => {
      acc[pool.category] = (acc[pool.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const riskStats = pools.reduce((acc, pool) => {
      acc[pool.riskLevel] = (acc[pool.riskLevel] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalPools: pools.length,
      verifiedPools: verifiedCount,
      unverifiedPools: pools.length - verifiedCount,
      categoryBreakdown: categoryStats,
      riskBreakdown: riskStats,
      newestPool: pools.sort((a, b) => b.addedAt - a.addedAt)[0]?.name || 'None',
      oldestPool: pools.sort((a, b) => a.addedAt - b.addedAt)[0]?.name || 'None'
    };
  }

  // Update configuration
  updateConfig(newConfig: Partial<PoolRegistryConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('⚙️ Registry config updated:', this.config);
  }

  // Get all available tags
  getAllTags(network?: 'testnet' | 'mainnet'): string[] {
    const pools = network ? this.getCommunityPools(network) : [...this.testnetPools, ...this.mainnetPools];
    const tagSet = new Set<string>();
    
    pools.forEach(pool => {
      pool.tags.forEach(tag => tagSet.add(tag));
    });
    
    return Array.from(tagSet).sort();
  }
}

// Singleton instance
export const communityPoolsRegistry = new CommunityPoolsRegistry();

// Convenience functions
export const getCommunityPools = (network: 'testnet' | 'mainnet') => 
  communityPoolsRegistry.getCommunityPools(network);

export const getCommunityPoolByAddress = (address: string) => 
  communityPoolsRegistry.getPoolByAddress(address);

export const getRegistryStats = (network?: 'testnet' | 'mainnet') => 
  communityPoolsRegistry.getRegistryStats(network);