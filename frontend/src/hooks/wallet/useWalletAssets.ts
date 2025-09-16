import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { horizonService, WalletAsset, WalletBalance } from '@/lib/stellar/horizon-api';
import { useWallet } from '@/components/wallet/WalletProvider';

export interface UseWalletAssetsReturn {
  // Assets data
  assets: WalletAsset[];
  balance: WalletBalance | null;
  
  // RWA specific data
  rwaAssets: WalletAsset[];
  userCreatedTokens: WalletAsset[];
  hasRWAAssets: boolean;
  
  // State
  loading: boolean;
  error: string | null;
  
  // Actions
  refetch: () => Promise<void>;
  refreshAssets: () => void;
}

export function useWalletAssets(): UseWalletAssetsReturn {
  const { isConnected, address } = useWallet();
  const queryClient = useQueryClient();
  
  // Query for wallet assets
  const {
    data: assets = [],
    isLoading: assetsLoading,
    error: assetsError,
    refetch: refetchAssets
  } = useQuery({
    queryKey: ['walletAssets', address],
    queryFn: () => horizonService.getWalletAssets(address!),
    enabled: isConnected && !!address,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refresh every minute
    retry: 3,
  });

  // Query for wallet balance (categorized)
  const {
    data: balance = null,
    isLoading: balanceLoading,
    error: balanceError,
    refetch: refetchBalance
  } = useQuery({
    queryKey: ['walletBalance', address],
    queryFn: () => horizonService.getWalletBalance(address!),
    enabled: isConnected && !!address,
    staleTime: 30000,
    refetchInterval: 60000,
    retry: 3,
  });

  // Query for user created tokens
  const {
    data: userCreatedTokens = [],
    isLoading: tokensLoading,
    error: tokensError,
    refetch: refetchTokens
  } = useQuery({
    queryKey: ['userCreatedTokens', address],
    queryFn: () => horizonService.getUserCreatedTokens(address!),
    enabled: isConnected && !!address,
    staleTime: 60000, // 1 minute (less frequent updates)
    retry: 3,
  });

  // Derived data
  const rwaAssets = assets.filter(asset => asset.isRWA);
  const hasRWAAssets = rwaAssets.length > 0;
  const loading = assetsLoading || balanceLoading || tokensLoading;
  const error = assetsError?.message || balanceError?.message || tokensError?.message || null;

  // Refresh all data
  const refreshAssets = useCallback(() => {
    if (!isConnected || !address) return;
    
    queryClient.invalidateQueries({ queryKey: ['walletAssets', address] });
    queryClient.invalidateQueries({ queryKey: ['walletBalance', address] });
    queryClient.invalidateQueries({ queryKey: ['userCreatedTokens', address] });
  }, [isConnected, address, queryClient]);

  // Refetch function for manual refresh
  const refetch = useCallback(async () => {
    await Promise.all([
      refetchAssets(),
      refetchBalance(),
      refetchTokens()
    ]);
  }, [refetchAssets, refetchBalance, refetchTokens]);

  // Clear data when wallet disconnects
  useEffect(() => {
    if (!isConnected) {
      queryClient.removeQueries({ queryKey: ['walletAssets'] });
      queryClient.removeQueries({ queryKey: ['walletBalance'] });
      queryClient.removeQueries({ queryKey: ['userCreatedTokens'] });
    }
  }, [isConnected, queryClient]);

  return {
    assets,
    balance,
    rwaAssets,
    userCreatedTokens,
    hasRWAAssets,
    loading,
    error,
    refetch,
    refreshAssets,
  };
}

// Helper hook for just RWA assets
export function useRWAAssets() {
  const walletAssets = useWalletAssets();
  
  return {
    rwaAssets: walletAssets.rwaAssets,
    hasRWAAssets: walletAssets.hasRWAAssets,
    userCreatedTokens: walletAssets.userCreatedTokens,
    loading: walletAssets.loading,
    error: walletAssets.error,
    refreshAssets: walletAssets.refreshAssets,
  };
}

// Helper hook to check if user has specific types of RWA
export function useRWAPortfolioStats() {
  const { rwaAssets, balance, loading } = useWalletAssets();
  
  const stats = {
    totalRWAAssets: rwaAssets.length,
    totalRWAValue: 0, // Will be calculated with real USD values
    assetTypes: {
      treasury: rwaAssets.filter(a => a.rwaType === 'treasury').length,
      corporateBond: rwaAssets.filter(a => a.rwaType === 'corporate-bond').length,
      realEstate: rwaAssets.filter(a => a.rwaType === 'real-estate').length,
      commodity: rwaAssets.filter(a => a.rwaType === 'commodity').length,
      other: rwaAssets.filter(a => a.rwaType === 'other').length,
    },
    hasStablecoins: balance?.stablecoins.length > 0,
    stablecoinValue: balance?.stablecoins.reduce((sum, asset) => 
      sum + parseFloat(asset.balance), 0
    ) || 0,
  };

  return {
    ...stats,
    loading,
    isEmpty: stats.totalRWAAssets === 0,
  };
}