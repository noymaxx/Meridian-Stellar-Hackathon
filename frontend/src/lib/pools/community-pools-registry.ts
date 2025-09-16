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

// Community pools registry - now used only for pool discovery, not mock data
// Real community pools will be discovered via factory contract
const COMMUNITY_POOLS_TESTNET: CommunityPoolMetadata[] = [
  // This array is now empty - community pools are discovered via blockchain
  // instead of using mock/fake data
];

const COMMUNITY_POOLS_MAINNET: CommunityPoolMetadata[] = [
  // This array is now empty - community pools are discovered via blockchain
  // instead of using mock/fake data
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