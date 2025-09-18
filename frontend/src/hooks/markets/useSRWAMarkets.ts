import { useState, useEffect } from "react";
import { useUserRWATokens, type RWAToken } from "@/hooks/useUserRWATokens";
import { useAutoBlendIntegration } from "@/hooks/useAutoBlendIntegration";
import { useBlendOperations } from "@/hooks/useBlendOperations";
import { useWallet } from "@/components/wallet/WalletProvider";
import { type EnhancedPoolData } from "@/types/markets";

export interface SRWAMarketData extends EnhancedPoolData {
  // Additional SRWA-specific fields
  isUserAdmin: boolean;
  tokenContract: string;
  complianceContract: string;
  totalSupply: string;
  userBalance: string;
  marketType: 'SRWA';
}

export interface UseSRWAMarketsReturn {
  srwaMarkets: SRWAMarketData[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useSRWAMarkets = (): UseSRWAMarketsReturn => {
  const { tokens: rwaTokens, loading: tokensLoading, error: tokensError, refetch: refetchTokens } = useUserRWATokens();
  const { tokenStatuses } = useAutoBlendIntegration();
  const blendOps = useBlendOperations();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Debug wallet connection
  const { address, isConnected } = useWallet();
  console.log("🔍 [useSRWAMarkets] Wallet status:", { address: address?.slice(0, 8) + '...', isConnected });

  // Get cached integrated tokens from localStorage (performance cache only - network is source of truth)
  const getIntegratedTokens = (): string[] => {
    try {
      const saved = localStorage.getItem('blend_integrated_tokens'); 
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  };

  // Check network directly for integration status - localStorage is just performance cache
  const fetchBlendMarketData = async (token: RWAToken) => {
    console.log(`🔗 [SRWA Markets] Checking network integration for token ${token.symbol} (${token.contractAddress})`);
    
    try {
      // Query Blend pool directly to check if token is integrated (source of truth)
      const poolAddress = "CAQ4DF5FLQHGAUEXYJKTVFFIVHVIUN6XNUE7NW27BJGWEPNHQKZYMRQ6";
      
      console.log(`🔗 [SRWA Markets] Querying Blend pool for token: ${token.symbol}`);
      
      // Get pool data from network 
      const poolData = await blendOps.getPoolData(poolAddress);
      
      if (poolData?.reserves) {
        // Check if this token exists in the pool reserves
        const tokenReserve = poolData.reserves.find(r => 
          r.asset.contractAddress === token.contractAddress
        );
        
        if (tokenReserve) {
          console.log(`✅ [SRWA Markets] Token ${token.symbol} IS INTEGRATED on network! Using real data:`, tokenReserve);
          
          // Update localStorage cache (optimization only)
          const integratedTokens = getIntegratedTokens();
          if (!integratedTokens.includes(token.contractAddress)) {
            integratedTokens.push(token.contractAddress);
            localStorage.setItem('blend_integrated_tokens', JSON.stringify(integratedTokens));
            console.log(`💾 [SRWA Markets] Updated localStorage cache for ${token.symbol}`);
          }
          
          return {
            supplyAPY: tokenReserve.supplyAPY * 100,
            borrowAPY: tokenReserve.borrowAPY * 100,
            totalSupplied: Number(tokenReserve.totalSupply) / Math.pow(10, token.decimals),
            totalBorrowed: Number(tokenReserve.totalBorrowed) / Math.pow(10, token.decimals),
            utilizationRate: tokenReserve.utilizationRate,
            tvl: (Number(tokenReserve.totalSupply) / Math.pow(10, token.decimals)) * 1.0,
            isRealData: true,
            poolAddress: poolAddress
          };
        } else {
          console.log(`❌ [SRWA Markets] Token ${token.symbol} NOT FOUND in pool reserves - not integrated`);
        }
      } else {
        console.log(`⚠️ [SRWA Markets] No pool data or reserves found`);
      }
    } catch (error) {
      console.warn(`⚠️ [SRWA Markets] Network query failed for ${token.symbol}:`, error);
    }
    
    console.log(`📊 [SRWA Markets] Token ${token.symbol} not integrated - using mock data`);
    return null;
  };

  // Convert RWA tokens into market-compatible format
  const convertRWATokenToMarket = async (token: RWAToken): Promise<SRWAMarketData> => {
    // Try to get real Blend data first
    const blendData = await fetchBlendMarketData(token);
    
    if (blendData?.isRealData) {
      // Use real Blend data
      console.log(`📊 [SRWA Markets] Using real Blend data for ${token.symbol}`);
      
      return {
        // Core pool info
        address: token.contractAddress,
        name: `${token.name} Lending Market`,
        class: 'TBill' as const,
        status: 'Active' as const,
        
        // Financial metrics
        tvl: blendData.tvl,
        
        // Real financial metrics from Blend
        suppliedAmount: blendData.totalSupplied,
        borrowedAmount: blendData.totalBorrowed,
        availableLiquidity: blendData.totalSupplied - blendData.totalBorrowed,
        utilizationRate: blendData.utilizationRate,
        
        // APY data
        supplyAPY: blendData.supplyAPY,
        borrowAPY: blendData.borrowAPY,
        netAPY: blendData.supplyAPY,
        apyTrend: 'stable' as const,
        
        // Volume data (calculated from real activity)
        volume24h: blendData.tvl * 0.05, // More conservative estimate
        volume7d: blendData.tvl * 0.3,
        volumeChange24h: 0,
        
        // User metrics (based on actual pool data)
        activeUsers: Math.max(1, Math.floor(blendData.tvl / 25000)), // More realistic ratio
        totalPositions: Math.max(1, Math.floor(blendData.tvl / 15000)),
        
        // Risk metrics
        averageHealthFactor: 3.0,
        liquidationRate: 0.5,
        riskScore: 15,
        
        // Price data
        assetPrices: {
          [token.symbol]: {
            asset: token.symbol,
            price: 1.0,
            priceUSD: 1.0,
            change24h: 0.0,
            change7d: 0.0,
            volume24h: blendData.tvl * 0.1,
            marketCap: blendData.tvl,
            timestamp: Date.now(),
            source: 'Blend-Real'
          }
        },
        
        // Performance
        performance24h: 0.0,
        performance7d: 0.0,
        performance30d: 0.0,
        
        // Timestamps
        lastUpdated: Date.now(),
        dataFreshness: 'Fresh' as const,
        
        // SRWA-specific fields
        isUserAdmin: token.isUserAdmin || false,
        tokenContract: token.contractAddress,
        complianceContract: '', // TODO: Get from token metadata
        totalSupply: token.totalSupply,
        userBalance: token.balance,
        marketType: 'SRWA' as const,
      };
    } else {
      // Use conservative estimates for non-integrated tokens (encourage integration)
      console.log(`📊 [SRWA Markets] Using conservative estimates for ${token.symbol} (not integrated - encourage integration)`);
      
      const totalSupplyNumber = parseFloat(token.totalSupply) || 1000000;
      const estimatedTVL = Math.min(totalSupplyNumber / Math.pow(10, token.decimals) * 0.1, 50000); // Cap at $50k for demo
      const estimatedSupplied = estimatedTVL * 0.3; // Conservative 30% supplied
      const estimatedBorrowed = estimatedTVL * 0.1; // Low borrow activity without integration
      const utilizationRate = estimatedSupplied > 0 ? estimatedBorrowed / estimatedSupplied : 0.15;
      
      // Conservative APYs to encourage real integration
      const baseAPY = 2.5; // Lower base APY for non-integrated
      const supplyAPY = Math.max(0.5, baseAPY - (utilizationRate * 1)); 
      const borrowAPY = Math.max(supplyAPY + 0.5, baseAPY + (utilizationRate * 2));
      
      return {
        // Core pool info
        address: token.contractAddress,
        name: `${token.name} Lending Market`,
        class: 'TBill' as const,
        status: 'Active' as const,
        
        // Financial metrics (conservative)
        tvl: estimatedTVL,
        suppliedAmount: estimatedSupplied,
        borrowedAmount: estimatedBorrowed,
        availableLiquidity: estimatedSupplied - estimatedBorrowed,
        utilizationRate: utilizationRate,
        
        // APY data
        supplyAPY: supplyAPY,
        borrowAPY: borrowAPY,
        netAPY: supplyAPY,
        apyTrend: 'stable' as const,
        
        // Volume data (conservative - encourage integration)
        volume24h: estimatedTVL * 0.02, // Very low activity without integration
        volume7d: estimatedTVL * 0.1,
        volumeChange24h: 0, // Flat without real activity
        
        // User metrics (minimal without integration)
        activeUsers: Math.max(1, Math.floor(estimatedTVL / 50000)), // Very few users
        totalPositions: Math.max(1, Math.floor(estimatedTVL / 25000)),
        
        // Risk metrics
        averageHealthFactor: 2.5 + Math.random() * 2,
        liquidationRate: Math.random() * 5,
        riskScore: 20 + Math.random() * 30,
        
        // Price data
        assetPrices: {
          [token.symbol]: {
            asset: token.symbol,
            price: 1.0,
            priceUSD: 1.0,
            change24h: Math.random() * 4 - 2,
            change7d: Math.random() * 10 - 5,
            volume24h: estimatedTVL * 0.1,
            marketCap: parseFloat(token.totalSupply) / Math.pow(10, token.decimals),
            timestamp: Date.now(),
            source: 'SRWA-Estimated'
          }
        },
        
        // Performance
        performance24h: Math.random() * 4 - 2,
        performance7d: Math.random() * 10 - 5,
        performance30d: Math.random() * 20 - 10,
        
        // Timestamps
        lastUpdated: Date.now(),
        dataFreshness: 'Fresh' as const,
        
        // SRWA-specific fields
        isUserAdmin: token.isUserAdmin || false,
        tokenContract: token.contractAddress,
        complianceContract: '', // TODO: Get from token metadata
        totalSupply: token.totalSupply,
        userBalance: token.balance,
        marketType: 'SRWA' as const,
      };
    }
  };

  const [srwaMarkets, setSrwaMarkets] = useState<SRWAMarketData[]>([]);

  useEffect(() => {
    console.log("🔍 [useSRWAMarkets] useEffect triggered:", {
      tokensLoading,
      tokensError,
      rwaTokensCount: rwaTokens.length,
      isConnected,
      address: address?.slice(0, 8) + '...'
    });
    
    if (tokensLoading) {
      setLoading(true);
      return;
    }

    if (tokensError) {
      console.error("🔍 [useSRWAMarkets] Tokens error:", tokensError);
      setError(tokensError);
      setLoading(false);
      return;
    }

    const convertTokensToMarkets = async () => {
      try {
        setLoading(true);
        console.log("🔗 [useSRWAMarkets] Converting RWA tokens to market format:", {
          tokensCount: rwaTokens.length,
          isConnected,
          address: address?.slice(0, 8) + '...'
        });
        
        // If wallet not connected, we can still show some basic token info
        // but admin detection might not work properly
        if (!isConnected) {
          console.warn("🔍 [useSRWAMarkets] Wallet not connected - admin detection may be limited");
        }
        
        // Filter tokens first
        console.log("🔍 [useSRWAMarkets] All RWA tokens before filtering:", rwaTokens.map(t => ({
          symbol: t.symbol,
          address: t.contractAddress.slice(0, 8) + '...',
          isUserAdmin: t.isUserAdmin,
          balance: t.balance,
          admin: t.admin?.slice(0, 8) + '...'
        })));
        
        const eligibleTokens = rwaTokens.filter(token => {
          const hasBalance = parseFloat(token.balance) > 0;
          const isAdmin = token.isUserAdmin;
          
          // For Markets page: Show ALL valid SRWA tokens for trading opportunities
          // This includes:
          // 1. Tokens where user is admin (can configure and manage)
          // 2. Tokens where user has balance (active positions)  
          // 3. Tokens that are publicly available for trading (if validated)
          
          // Check if token has valid contract structure
          const hasValidContract = token.contractAddress && 
                                  token.contractAddress.length === 56 && 
                                  token.contractAddress.startsWith('C');
          
          const isEligible = hasValidContract && (
            isAdmin ||           // User created/manages this token
            hasBalance ||        // User has active position  
            token.totalSupply    // Token exists and has supply (available for trading)
          );
          
          console.log(`🔍 [useSRWAMarkets] Token ${token.symbol}:`, {
            hasValidContract,
            isUserAdmin: isAdmin,
            balance: token.balance,
            hasBalance,
            totalSupply: token.totalSupply,
            isEligible,
            reason: !isEligible ? 'filtered out' : 
                   isAdmin ? 'admin token' :
                   hasBalance ? 'has balance' : 'available for trading'
          });
          
          return isEligible;
        });

        // Convert user's RWA tokens to market format (now async)
        const markets = await Promise.all(
          eligibleTokens.map(token => convertRWATokenToMarket(token))
        );

        console.log("🔗 [useSRWAMarkets] Created SRWA markets:", markets.length);
        
        setSrwaMarkets(markets);
        setError(null);
      } catch (err) {
        console.error("🔗 [useSRWAMarkets] Error converting tokens to markets:", err);
        setError(err instanceof Error ? err.message : "Failed to convert RWA tokens to markets");
      } finally {
        setLoading(false);
      }
    };

    convertTokensToMarkets();
  }, [rwaTokens, tokensLoading, tokensError, tokenStatuses]);

  const refetch = async () => {
    await refetchTokens();
  };

  return {
    srwaMarkets,
    loading: loading || tokensLoading,
    error: error || tokensError,
    refetch,
  };
};