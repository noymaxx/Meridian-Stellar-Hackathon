import { useState, useEffect, useCallback } from 'react';
import { poolService, PoolData, PoolStats } from '@/lib/stellar/poolService';
import { toast } from 'sonner';

export interface UsePoolsReturn {
  pools: PoolData[];
  stats: PoolStats;
  isLoading: boolean;
  error: string | null;
  refreshPools: () => Promise<void>;
  getPoolInfo: (poolAddress: string) => Promise<PoolData | null>;
}

export function usePools(): UsePoolsReturn {
  const [pools, setPools] = useState<PoolData[]>([]);
  const [stats, setStats] = useState<PoolStats>({
    totalValueLocked: '$0',
    totalMarkets: 0,
    avgUtilization: '0.00%',
    totalUsers: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshPools = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [poolsData, statsData] = await Promise.all([
        poolService.getAllPools(),
        poolService.getPoolStats()
      ]);

      // Buscar pools criados localmente (do localStorage)
      const recentTokens = JSON.parse(localStorage.getItem('recent_tokens') || '[]');
      const localPools = recentTokens
        .filter((token: any) => token.type === 'pool')
        .map((token: any) => ({
          pool_address: token.address,
          name: token.name,
          oracle: 'Local Oracle',
          backstop_take_rate: 500,
          max_positions: 100,
          total_supply: '1000000',
          total_borrowed: '0',
          supply_apy: '5.25',
          borrow_apy: '7.50',
          utilization_rate: '0.00',
          lltv: '80.00',
          risk_premium: '2.25',
          min_investment: '1000',
          collateral_factor: '75.00',
          liquidation_threshold: '80.00',
          reserve_factor: '10.00',
          interest_rate_model: 'Linear',
          is_active: true,
          created_at: token.createdAt,
          last_updated: token.createdAt,
          deployment_hash: token.deploymentHash
        }));

      // Combinar pools do smart contract com pools locais
      // Remover duplicatas baseado no pool_address
      const allPools = [...poolsData];
      localPools.forEach((localPool: any) => {
        if (!allPools.find(pool => pool.pool_address === localPool.pool_address)) {
          allPools.push(localPool);
        }
      });

      setPools(allPools);
      setStats(statsData);

      if (allPools.length === 0) {
        toast.info("No pools found. Create your first pool!");
      } else {
        const contractPools = poolsData.length;
        const localPoolsCount = localPools.length;
        toast.success(`Loaded ${contractPools} contract pools + ${localPoolsCount} local pools.`);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch pools';
      setError(errorMessage);
      
      toast.error(`Error loading pools: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getPoolInfo = useCallback(async (poolAddress: string): Promise<PoolData | null> => {
    try {
      const poolInfo = await poolService.getPoolInfo(poolAddress);
      return poolInfo;
    } catch (err: any) {
      console.error('Error fetching pool info:', err);
      toast.error(`Failed to fetch pool info: ${err.message}`);
      return null;
    }
  }, []);

  // Load pools on mount
  useEffect(() => {
    refreshPools();
  }, [refreshPools]);

  return {
    pools,
    stats,
    isLoading,
    error,
    refreshPools,
    getPoolInfo
  };
}
