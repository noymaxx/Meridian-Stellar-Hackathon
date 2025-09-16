import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { horizonService, WalletTransaction } from '@/lib/stellar/horizon-api';
import { useWallet } from '@/components/wallet/WalletProvider';

export interface UseWalletTransactionsReturn {
  // Transaction data
  transactions: WalletTransaction[];
  recentTransactions: WalletTransaction[];
  rwaTransactions: WalletTransaction[];
  
  // State
  loading: boolean;
  error: string | null;
  
  // Actions
  refetch: () => Promise<void>;
  refreshTransactions: () => void;
  loadMore: () => void;
  
  // Filters
  hasMoreTransactions: boolean;
  limit: number;
}

export function useWalletTransactions(initialLimit: number = 10): UseWalletTransactionsReturn {
  const { isConnected, address } = useWallet();
  const queryClient = useQueryClient();

  // Query for wallet transactions
  const {
    data: transactions = [],
    isLoading: loading,
    error,
    refetch
  } = useQuery({
    queryKey: ['walletTransactions', address, initialLimit],
    queryFn: () => horizonService.getWalletTransactions(address!, initialLimit),
    enabled: isConnected && !!address,
    staleTime: 30000, // 30 seconds
    refetchInterval: 120000, // Refresh every 2 minutes
    retry: 3,
  });

  // Derived data
  const recentTransactions = transactions.slice(0, 5);
  
  // Filter RWA-related transactions (payments, trust lines, swaps involving RWA tokens)
  const rwaTransactions = transactions.filter(tx => {
    if (!tx.involvedAssets) return false;
    
    return tx.involvedAssets.some(asset => 
      asset.toLowerCase().includes('srwa') ||
      asset.toLowerCase().includes('tbill') ||
      asset.toLowerCase().includes('bond') ||
      asset.toLowerCase().includes('reit') ||
      asset.toLowerCase().includes('rwa')
    );
  });

  // Check if there might be more transactions
  const hasMoreTransactions = transactions.length === initialLimit;

  // Refresh transactions
  const refreshTransactions = useCallback(() => {
    if (!isConnected || !address) return;
    
    queryClient.invalidateQueries({ queryKey: ['walletTransactions', address] });
  }, [isConnected, address, queryClient]);

  // Load more transactions (increase limit)
  const loadMore = useCallback(() => {
    if (!isConnected || !address) return;
    
    const newLimit = initialLimit + 10;
    queryClient.setQueryData(
      ['walletTransactions', address, newLimit],
      undefined
    );
    queryClient.prefetchQuery({
      queryKey: ['walletTransactions', address, newLimit],
      queryFn: () => horizonService.getWalletTransactions(address!, newLimit),
    });
  }, [isConnected, address, initialLimit, queryClient]);

  return {
    transactions,
    recentTransactions,
    rwaTransactions,
    loading,
    error: error?.message || null,
    refetch,
    refreshTransactions,
    loadMore,
    hasMoreTransactions,
    limit: initialLimit,
  };
}

// Helper hook for just recent transactions
export function useRecentTransactions(limit: number = 5) {
  const transactions = useWalletTransactions(limit);
  
  return {
    recentTransactions: transactions.transactions.slice(0, limit),
    loading: transactions.loading,
    error: transactions.error,
    refreshTransactions: transactions.refreshTransactions,
  };
}

// Helper hook for RWA-specific transactions
export function useRWATransactions() {
  const transactions = useWalletTransactions(20); // Get more to filter RWA
  
  return {
    rwaTransactions: transactions.rwaTransactions,
    totalRWATransactions: transactions.rwaTransactions.length,
    loading: transactions.loading,
    error: transactions.error,
    refreshTransactions: transactions.refreshTransactions,
    hasRWAActivity: transactions.rwaTransactions.length > 0,
  };
}

// Helper to format transaction for display
export function formatTransactionForDisplay(transaction: WalletTransaction) {
  const date = new Date(transaction.created_at);
  const timeAgo = getTimeAgo(date);
  
  return {
    ...transaction,
    displayDate: date.toLocaleDateString(),
    displayTime: date.toLocaleTimeString(),
    timeAgo,
    shortHash: transaction.hash.slice(0, 8) + '...',
    explorerUrl: `https://stellar.expert/explorer/${
      // Use appropriate network
      'testnet'
    }/tx/${transaction.hash}`,
  };
}

// Helper to get time ago string
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return date.toLocaleDateString();
}

// Helper to get transaction status color
export function getTransactionStatusColor(transaction: WalletTransaction): string {
  if (!transaction.successful) return 'text-red-400';
  
  switch (transaction.operationType) {
    case 'payment':
      return 'text-green-400';
    case 'path_payment_strict_receive':
    case 'path_payment_strict_send':
      return 'text-blue-400';
    case 'change_trust':
      return 'text-purple-400';
    case 'manage_offer':
      return 'text-yellow-400';
    default:
      return 'text-gray-400';
  }
}

// Helper to get transaction icon
export function getTransactionIcon(transaction: WalletTransaction): string {
  switch (transaction.operationType) {
    case 'payment':
      return '💸';
    case 'path_payment_strict_receive':
    case 'path_payment_strict_send':
      return '🔄';
    case 'change_trust':
      return '🤝';
    case 'manage_offer':
      return '📊';
    default:
      return '📋';
  }
}