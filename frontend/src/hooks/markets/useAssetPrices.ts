import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { reflectorClient } from '@/integrations/reflector';
import { BlendPool } from '@/types/blend';

// ===== ASSET PRICE HOOKS =====

interface AssetPrice {
  asset: string;
  price: number;
  priceUsd: number;
  change24h: number;
  volume24h: number;
  timestamp: number;
  source: string;
}

interface UseAssetPricesReturn {
  prices: { [asset: string]: AssetPrice };
  loading: boolean;
  error: Error | null;
  refetch: () => void;
  lastUpdated: number;
}

// Hook to fetch prices for multiple assets
export const useAssetPrices = (assets: string[]): UseAssetPricesReturn => {
  const queryClient = useQueryClient();
  
  const {
    data: prices = {},
    isLoading: loading,
    error: queryError,
    refetch: queryRefetch,
    dataUpdatedAt: lastUpdated
  } = useQuery({
    queryKey: ['asset-prices', ...assets.sort()],
    queryFn: async () => {
      if (assets.length === 0) return {};
      
      try {
        const pricesData = await reflectorClient.getMultipleAssetPrices(assets);
        return pricesData;
      } catch (error) {
        console.error('Error fetching asset prices:', error);
        
        // Return cached prices if available
        const cachedPrices: { [asset: string]: AssetPrice } = {};
        for (const asset of assets) {
          const cached = queryClient.getQueryData(['asset-price', asset]);
          if (cached) {
            cachedPrices[asset] = cached as AssetPrice;
          }
        }
        
        if (Object.keys(cachedPrices).length > 0) {
          console.warn('Using cached prices due to API error');
          return cachedPrices;
        }
        
        throw error;
      }
    },
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchInterval: 60 * 1000, // Refetch every minute
    enabled: assets.length > 0,
    retry: (failureCount, error) => {
      if (failureCount >= 2) return false;
      return true;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });

  const refetch = useCallback(() => {
    queryRefetch();
  }, [queryRefetch]);

  return {
    prices,
    loading,
    error: queryError as Error | null,
    refetch,
    lastUpdated
  };
};

// Hook to fetch price for a single asset
export const useAssetPrice = (asset: string): {
  price: AssetPrice | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
} => {
  const { prices, loading, error, refetch } = useAssetPrices([asset]);
  
  return {
    price: prices[asset.toUpperCase()] || null,
    loading,
    error,
    refetch
  };
};

// Hook to extract unique assets from pools and fetch their prices
export const usePoolAssetPrices = (pools: BlendPool[]): UseAssetPricesReturn => {
  const assets = extractUniqueAssets(pools);
  return useAssetPrices(assets);
};

// Hook for price history of a specific asset
export const usePriceHistory = (asset: string, interval: '1h' | '1d' = '1h', periods: number = 24) => {
  return useQuery({
    queryKey: ['price-history', asset, interval, periods],
    queryFn: () => reflectorClient.getPriceHistory(asset, interval, periods),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!asset,
    retry: 1
  });
};

// ===== UTILITY FUNCTIONS =====

function extractUniqueAssets(pools: BlendPool[]): string[] {
  const assetSet = new Set<string>();
  
  pools.forEach(pool => {
    pool.reserves.forEach(reserve => {
      if (reserve.asset.code) {
        assetSet.add(reserve.asset.code.toUpperCase());
      }
    });
  });
  
  return Array.from(assetSet);
}

// Get asset metadata from Reflector client
export const getAssetMetadata = (asset: string) => {
  return reflectorClient.getAssetMetadata(asset);
};

// Get all supported assets
export const getAllSupportedAssets = () => {
  return reflectorClient.getAllSupportedAssets();
};

// Check if Reflector Oracle is healthy
export const useOracleHealth = () => {
  return useQuery({
    queryKey: ['oracle-health'],
    queryFn: () => reflectorClient.checkOracleHealth(),
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 2 * 60 * 1000, // Check every 2 minutes
    retry: false
  });
};

// ===== PRICE FORMATTING UTILITIES =====

export const formatPrice = (price: number, decimals: number = 6): string => {
  if (price === 0) return '$0.00';
  
  if (price < 0.01) {
    return `$${price.toFixed(decimals)}`;
  }
  
  if (price < 1) {
    return `$${price.toFixed(4)}`;
  }
  
  if (price < 1000) {
    return `$${price.toFixed(2)}`;
  }
  
  if (price < 1000000) {
    return `$${(price / 1000).toFixed(1)}K`;
  }
  
  return `$${(price / 1000000).toFixed(1)}M`;
};

export const formatPriceChange = (change: number): string => {
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(2)}%`;
};

export const getPriceChangeColor = (change: number): string => {
  if (change > 0) return 'text-brand-400';
  if (change < 0) return 'text-red-400';
  return 'text-fg-muted';
};