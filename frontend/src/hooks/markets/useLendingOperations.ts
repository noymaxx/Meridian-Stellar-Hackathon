import { useState, useCallback, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  TransactionPreview, 
  BlendError, 
  UseLendingOperationsReturn,
  BlendTransaction,
  BlendErrorCode 
} from '@/types/blend';
import { useWallet } from '@/components/wallet/WalletProvider';
import { StellarRpc } from '@stellar/stellar-sdk';
import { toast } from '@/hooks/use-toast';

// ===== LENDING OPERATIONS SDK =====

class LendingOperationsClient {
  private rpcUrl: string;

  constructor(rpcUrl: string = 'https://soroban-testnet.stellar.org') {
    this.rpcUrl = rpcUrl;
  }

  async previewTransaction(
    poolAddress: string,
    type: TransactionPreview['type'],
    asset: string,
    amount: bigint,
    userAddress: string
  ): Promise<TransactionPreview> {
    try {
      // TODO: Replace with actual Blend contract simulation calls
      // This is a mock implementation showing expected behavior
      
      const amountUSD = Number(amount) / 1e7 * 1.5; // Mock USD conversion
      
      // Mock health factor calculation
      const currentHealthFactor = 2.5;
      const newHealthFactor = type === 'supply' || type === 'repay' 
        ? currentHealthFactor + 0.2 
        : currentHealthFactor - 0.3;

      // Mock utilization rate calculation
      const currentUtilization = 0.65;
      const utilizationChange = type === 'supply' || type === 'repay' ? -0.05 : +0.05;
      const newUtilizationRate = Math.max(0, Math.min(1, currentUtilization + utilizationChange));

      // Risk warnings
      const warnings: string[] = [];
      if (newHealthFactor < 1.2) {
        warnings.push('This transaction will put your position at high risk of liquidation');
      }
      if (newUtilizationRate > 0.9) {
        warnings.push('Pool utilization will be very high, affecting APY rates');
      }
      if (type === 'withdraw' && amountUSD > 10000) {
        warnings.push('Large withdrawal may impact pool liquidity');
      }

      const preview: TransactionPreview = {
        type,
        asset: {
          code: asset,
          contractAddress: `C${asset}MOCKCONTRACT`,
          decimals: asset === 'USDC' ? 6 : 7,
          symbol: asset,
          name: asset === 'XLM' ? 'Stellar Lumens' : 'USD Coin'
        },
        amount,
        amountUSD,
        newHealthFactor: type === 'borrow' || type === 'withdraw' ? newHealthFactor : undefined,
        newUtilizationRate,
        estimatedGasFee: BigInt('100000'), // 0.01 XLM
        slippage: type === 'borrow' || type === 'supply' ? 0.001 : undefined,
        warnings,
        canProceed: newHealthFactor > 1.1 && warnings.length < 2
      };

      return preview;
    } catch (error) {
      console.error('Error previewing transaction:', error);
      throw new Error(`Failed to preview transaction: ${error.message}`);
    }
  }

  async executeTransaction(
    poolAddress: string,
    type: TransactionPreview['type'],
    asset: string,
    amount: bigint,
    userAddress: string,
    signTransaction: (xdr: string) => Promise<string>
  ): Promise<string> {
    try {
      // TODO: Replace with actual Blend contract calls
      // This is a mock implementation showing the transaction flow
      
      console.log(`Executing ${type} transaction:`, {
        poolAddress,
        asset,
        amount: amount.toString(),
        userAddress
      });

      // Mock transaction building
      const mockXdr = `MOCK_XDR_FOR_${type.toUpperCase()}_${asset}_${amount.toString()}`;
      
      // Sign the transaction
      const signedXdr = await signTransaction(mockXdr);
      
      // Submit to network (would need real RPC server instance)
      // const rpc = new StellarRpc.Server(this.rpcUrl);
      // const result = await rpc.sendTransaction(signedXdr);
      const mockTxHash = `MOCK_TX_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log(`Transaction ${type} successful:`, mockTxHash);
      return mockTxHash;
      
    } catch (error) {
      console.error(`Error executing ${type} transaction:`, error);
      
      // Handle different error types
      if (error.message?.includes('User declined') || error.message?.includes('rejected')) {
        throw new Error('Transaction was cancelled by user');
      }
      
      if (error.message?.includes('insufficient')) {
        throw new Error('Insufficient balance or collateral');
      }
      
      throw new Error(`Transaction failed: ${error.message}`);
    }
  }

  async getUserAllowance(userAddress: string, asset: string, poolAddress: string): Promise<bigint> {
    // TODO: Check if user has approved the pool to spend their tokens
    // For now, return a mock allowance
    return BigInt('1000000000000'); // High allowance
  }

  async approveSpending(
    userAddress: string, 
    asset: string, 
    poolAddress: string, 
    amount: bigint,
    signTransaction: (xdr: string) => Promise<string>
  ): Promise<string> {
    try {
      // TODO: Build actual approval transaction
      const mockApprovalXdr = `APPROVAL_XDR_${asset}_${amount.toString()}`;
      const signedXdr = await signTransaction(mockApprovalXdr);
      
      // Mock approval hash
      const approvalHash = `APPROVAL_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      return approvalHash;
    } catch (error) {
      throw new Error(`Approval failed: ${error.message}`);
    }
  }
}

// ===== HOOK IMPLEMENTATION =====

export const useLendingOperations = (poolAddress: string): UseLendingOperationsReturn => {
  const [client] = useState(() => new LendingOperationsClient());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<BlendError | null>(null);
  
  const { isConnected, address, signTransaction } = useWallet();
  const queryClient = useQueryClient();

  // Clear errors when pool or user changes
  useEffect(() => {
    setError(null);
  }, [poolAddress, address]);

  // ===== TRANSACTION PREVIEW =====
  
  const previewTransaction = useCallback(async (
    type: TransactionPreview['type'],
    asset: string,
    amount: bigint
  ): Promise<TransactionPreview> => {
    if (!isConnected || !address) {
      throw new Error('Wallet not connected');
    }

    if (!poolAddress) {
      throw new Error('Pool address not provided');
    }

    try {
      setError(null);
      const preview = await client.previewTransaction(poolAddress, type, asset, amount, address);
      return preview;
    } catch (err) {
      const blendError: BlendError = {
        code: 'TRANSACTION_FAILED',
        message: err.message || 'Failed to preview transaction',
        details: err,
        timestamp: Date.now()
      };
      setError(blendError);
      throw blendError;
    }
  }, [client, poolAddress, isConnected, address]);

  // ===== TRANSACTION EXECUTION =====

  const executeTransactionMutation = useMutation({
    mutationFn: async (params: {
      type: TransactionPreview['type'];
      asset: string;
      amount: bigint;
      needsApproval?: boolean;
    }) => {
      if (!isConnected || !address || !signTransaction) {
        throw new Error('Wallet not connected');
      }

      const { type, asset, amount, needsApproval } = params;
      
      // Step 1: Check and handle approval if needed
      if (needsApproval && (type === 'supply' || type === 'repay')) {
        const allowance = await client.getUserAllowance(address, asset, poolAddress);
        
        if (allowance < amount) {
          toast({
            title: 'Approval Required',
            description: `Approving ${asset} for spending...`,
          });
          
          await client.approveSpending(address, asset, poolAddress, amount, signTransaction);
          
          toast({
            title: 'Approval Successful',
            description: `${asset} approved for spending`,
          });
          
          // Wait a bit for approval to propagate
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // Step 2: Execute the main transaction
      const txHash = await client.executeTransaction(
        poolAddress,
        type,
        asset,
        amount,
        address,
        signTransaction
      );

      return { txHash, type, asset, amount };
    },
    onSuccess: (data) => {
      const { txHash, type, asset, amount } = data;
      
      toast({
        title: 'Transaction Successful',
        description: `${type} of ${Number(amount) / 1e7} ${asset} completed`,
        action: {
          label: 'View on Explorer',
          onClick: () => window.open(`https://stellar.expert/explorer/testnet/tx/${txHash}`, '_blank')
        }
      });

      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['blend-pools'] });
      queryClient.invalidateQueries({ queryKey: ['user-positions'] });
      queryClient.invalidateQueries({ queryKey: ['user-balance'] });
      
      setError(null);
    },
    onError: (err: Error) => {
      console.error('Transaction failed:', err);
      
      let errorCode: BlendErrorCode = 'TRANSACTION_FAILED';
      
      if (err.message.includes('User declined') || err.message.includes('cancelled')) {
        errorCode = 'USER_REJECTED';
      } else if (err.message.includes('insufficient')) {
        errorCode = 'INSUFFICIENT_COLLATERAL';
      } else if (err.message.includes('liquidity')) {
        errorCode = 'INSUFFICIENT_LIQUIDITY';
      }

      const blendError: BlendError = {
        code: errorCode,
        message: err.message,
        details: err,
        timestamp: Date.now()
      };

      setError(blendError);
      
      toast({
        title: 'Transaction Failed',
        description: err.message,
        variant: 'destructive'
      });
    }
  });

  // ===== OPERATION FUNCTIONS =====

  const supply = useCallback(async (asset: string, amount: bigint): Promise<string> => {
    setIsLoading(true);
    try {
      const result = await executeTransactionMutation.mutateAsync({
        type: 'supply',
        asset,
        amount,
        needsApproval: true
      });
      return result.txHash;
    } finally {
      setIsLoading(false);
    }
  }, [executeTransactionMutation]);

  const withdraw = useCallback(async (asset: string, amount: bigint): Promise<string> => {
    setIsLoading(true);
    try {
      const result = await executeTransactionMutation.mutateAsync({
        type: 'withdraw',
        asset,
        amount,
        needsApproval: false
      });
      return result.txHash;
    } finally {
      setIsLoading(false);
    }
  }, [executeTransactionMutation]);

  const borrow = useCallback(async (asset: string, amount: bigint): Promise<string> => {
    setIsLoading(true);
    try {
      const result = await executeTransactionMutation.mutateAsync({
        type: 'borrow',
        asset,
        amount,
        needsApproval: false
      });
      return result.txHash;
    } finally {
      setIsLoading(false);
    }
  }, [executeTransactionMutation]);

  const repay = useCallback(async (asset: string, amount: bigint): Promise<string> => {
    setIsLoading(true);
    try {
      const result = await executeTransactionMutation.mutateAsync({
        type: 'repay',
        asset,
        amount,
        needsApproval: true
      });
      return result.txHash;
    } finally {
      setIsLoading(false);
    }
  }, [executeTransactionMutation]);

  return {
    supply,
    withdraw,
    borrow,
    repay,
    previewTransaction,
    isLoading: isLoading || executeTransactionMutation.isPending,
    error
  };
};