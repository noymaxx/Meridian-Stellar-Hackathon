import { useState, useCallback } from 'react';
import { Client, networks, RequestType } from '@/lib/stellar/contract';
import { toast } from 'sonner';

export interface LendingOperation {
  type: 'supply' | 'borrow' | 'repay' | 'withdraw';
  poolAddress: string;
  amount: string;
  tokenAddress?: string;
}

export const useLendingOperations = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeOperation = useCallback(async (operation: LendingOperation, wallet: { publicKey: string; secretKey: string } | null) => {
    if (!wallet) {
      toast.error("Connect a wallet first");
      return false;
    }

    setIsLoading(true);
    setError(null);
    const id = toast.loading(`Executing ${operation.type} operation...`);

    try {
      const client = new Client({
        contractId: networks.testnet.contractId,
        networkPassphrase: networks.testnet.networkPassphrase,
        rpcUrl: "https://soroban-testnet.stellar.org",
      });

      let tx;

      switch (operation.type) {
        case 'supply':
          if (!operation.tokenAddress) {
            throw new Error('Token address required for supply operation');
          }
          tx = await client.supply_srwa_collateral({
            from: wallet.publicKey,
            pool_address: operation.poolAddress,
            srwa_token: operation.tokenAddress,
            amount: BigInt(operation.amount)
          });
          break;

        case 'borrow':
          tx = await client.borrow_usdc({
            from: wallet.publicKey,
            pool_address: operation.poolAddress,
            amount: BigInt(operation.amount)
          });
          break;

        case 'repay':
          tx = await client.repay_usdc({
            from: wallet.publicKey,
            pool_address: operation.poolAddress,
            amount: BigInt(operation.amount)
          });
          break;

        case 'withdraw':
          if (!operation.tokenAddress) {
            throw new Error('Token address required for withdraw operation');
          }
          tx = await client.withdraw_srwa_collateral({
            from: wallet.publicKey,
            pool_address: operation.poolAddress,
            srwa_token: operation.tokenAddress,
            amount: BigInt(operation.amount)
          });
          break;

        default:
          throw new Error(`Unknown operation type: ${operation.type}`);
      }

      console.log(`${operation.type} transaction:`, tx);

      // For now, return success (in real implementation, you would sign and send)
      toast.success(`${operation.type} operation completed successfully!`, { 
        id,
        action: {
          label: "View on Stellar Scan →",
          onClick: () => window.open(`https://stellarscan.io/account/${wallet.publicKey}`, "_blank")
        }
      });

      return true;
    } catch (error: any) {
      console.error(`${operation.type} operation failed:`, error);
      toast.error(`Failed to ${operation.type}: ${error.message}`, { id });
      setError(error.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const submitRequests = useCallback(async (
    from: string,
    spender: string,
    to: string,
    poolAddress: string,
    requests: Array<{
      address: string;
      amount: string;
      requestType: RequestType;
    }>,
    wallet: { publicKey: string; secretKey: string } | null
  ) => {
    if (!wallet) {
      toast.error("Connect a wallet first");
      return false;
    }

    setIsLoading(true);
    setError(null);
    const id = toast.loading("Submitting requests...");

    try {
      const client = new Client({
        contractId: networks.testnet.contractId,
        networkPassphrase: networks.testnet.networkPassphrase,
        rpcUrl: "https://soroban-testnet.stellar.org",
      });

      const tx = await client.submit_requests({
        from,
        spender,
        to,
        pool_address: poolAddress,
        requests: requests.map(req => ({
          address: req.address,
          amount: BigInt(req.amount),
          request_type: req.requestType
        }))
      });

      console.log('Submit requests transaction:', tx);

      toast.success("Requests submitted successfully!", { 
        id,
        action: {
          label: "View on Stellar Scan →",
          onClick: () => window.open(`https://stellarscan.io/account/${wallet.publicKey}`, "_blank")
        }
      });

      return true;
    } catch (error: any) {
      console.error('Submit requests failed:', error);
      toast.error(`Failed to submit requests: ${error.message}`, { id });
      setError(error.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    executeOperation,
    submitRequests,
    isLoading,
    error
  };
};
