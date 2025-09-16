import { useState, useCallback } from "react";
import { useWallet } from "@/components/wallet/WalletProvider";
import { useProvider } from "./useProvider";
import { useSRWAOperations } from "./useSRWAOperations";
import { RWAToken } from "./useUserRWATokens";
import { TransactionBuilder, Address, nativeToScVal } from "@stellar/stellar-sdk";
import { toast } from "sonner";

export interface RWALendingOperation {
  tokenAddress: string;
  poolAddress: string;
  amount: string;
  type: 'supply' | 'withdraw' | 'borrow' | 'repay';
}

export interface RWALendingPreview {
  operation: RWALendingOperation;
  estimatedAPY: number;
  healthFactorAfter: number;
  fees: string;
  requiredCollateral?: string;
  warnings: string[];
}

export interface UseRWALendingReturn {
  supplyRWAToken: (token: RWAToken, poolAddress: string, amount: string) => Promise<string>;
  withdrawRWAToken: (token: RWAToken, poolAddress: string, amount: string) => Promise<string>;
  borrowAgainstRWA: (token: RWAToken, poolAddress: string, amount: string, borrowAsset: string) => Promise<string>;
  repayWithRWA: (token: RWAToken, poolAddress: string, amount: string) => Promise<string>;
  previewOperation: (operation: RWALendingOperation) => Promise<RWALendingPreview>;
  approveRWAForLending: (token: RWAToken, poolAddress: string, amount: string) => Promise<string>;
  checkRWAAllowance: (token: RWAToken, poolAddress: string) => Promise<string>;
  loading: boolean;
  error: string | null;
}

export const useRWALending = (): UseRWALendingReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { address, isConnected, signTransaction } = useWallet();
  const { contract, sorobanServer, getContractId } = useProvider();
  const { signAndSendWithFreighter } = useSRWAOperations();

  const checkRWAAllowance = useCallback(async (
    token: RWAToken, 
    poolAddress: string
  ): Promise<string> => {
    if (!address) throw new Error("Wallet not connected");

    try {
      console.log("🔗 [RWA Lending] Checking allowance:", { token: token.contractAddress, pool: poolAddress });

      const tokenContract = contract(token.contractAddress, address);
      const account = await sorobanServer.getAccount(address);

      const tx = new TransactionBuilder(account, {
        fee: "10000000",
        networkPassphrase: "Test SDF Network ; September 2015",
      })
        .addOperation(tokenContract.call("allowance", 
          Address.fromString(address).toScVal(),
          Address.fromString(poolAddress).toScVal()
        ))
        .setTimeout(30)
        .build();

      const result = await sorobanServer.simulateTransaction(tx);
      
      if (result.result && result.result.retval) {
        const allowance = result.result.retval;
        console.log("🔗 [RWA Lending] Current allowance:", allowance);
        return allowance.toString();
      }

      return "0";
    } catch (err) {
      console.error("🔗 [RWA Lending] Error checking allowance:", err);
      return "0";
    }
  }, [address, contract, sorobanServer]);

  const approveRWAForLending = useCallback(async (
    token: RWAToken, 
    poolAddress: string, 
    amount: string
  ): Promise<string> => {
    if (!address) throw new Error("Wallet not connected");

    try {
      setLoading(true);
      setError(null);

      console.log("🔗 [RWA Lending] Approving RWA for lending:", { 
        token: token.contractAddress, 
        pool: poolAddress, 
        amount 
      });

      const tokenContract = contract(token.contractAddress, address);
      const account = await sorobanServer.getAccount(address);

      // Convert amount to proper scale
      const amountScaled = BigInt(amount) * BigInt(Math.pow(10, token.decimals));

      const tx = new TransactionBuilder(account, {
        fee: "10000000",
        networkPassphrase: "Test SDF Network ; September 2015",
      })
        .addOperation(tokenContract.call("approve", 
          Address.fromString(address).toScVal(),
          Address.fromString(poolAddress).toScVal(),
          nativeToScVal(amountScaled, { type: "i128" }),
          nativeToScVal(4294967295, { type: "u32" }) // Max expiration
        ))
        .setTimeout(30)
        .build();

      const txHash = await signAndSendWithFreighter(tx);
      
      toast.success(`RWA token ${token.symbol} approved for lending!`);
      return txHash;

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to approve RWA token";
      setError(errorMsg);
      toast.error(`Approval failed: ${errorMsg}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [address, contract, sorobanServer, signAndSendWithFreighter]);

  const supplyRWAToken = useCallback(async (
    token: RWAToken, 
    poolAddress: string, 
    amount: string
  ): Promise<string> => {
    if (!address) throw new Error("Wallet not connected");

    try {
      setLoading(true);
      setError(null);

      console.log("🔗 [RWA Lending] Supplying RWA token:", { 
        token: token.contractAddress, 
        pool: poolAddress, 
        amount 
      });

      // Check and approve if needed
      const currentAllowance = await checkRWAAllowance(token, poolAddress);
      const amountScaled = BigInt(amount) * BigInt(Math.pow(10, token.decimals));

      if (BigInt(currentAllowance) < amountScaled) {
        console.log("🔗 [RWA Lending] Insufficient allowance, approving first...");
        await approveRWAForLending(token, poolAddress, amount);
      }

      // Now supply to the pool
      // Note: This would integrate with actual Blend Protocol contracts
      // For now, we'll simulate the supply operation
      
      const blendPoolContract = contract(poolAddress, address);
      const account = await sorobanServer.getAccount(address);

      const tx = new TransactionBuilder(account, {
        fee: "10000000",
        networkPassphrase: "Test SDF Network ; September 2015",
      })
        .addOperation(blendPoolContract.call("supply", 
          Address.fromString(address).toScVal(),
          Address.fromString(token.contractAddress).toScVal(),
          nativeToScVal(amountScaled, { type: "i128" })
        ))
        .setTimeout(30)
        .build();

      const txHash = await signAndSendWithFreighter(tx);
      
      toast.success(`Successfully supplied ${amount} ${token.symbol} to lending pool!`);
      return txHash;

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to supply RWA token";
      setError(errorMsg);
      toast.error(`Supply failed: ${errorMsg}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [address, contract, sorobanServer, signAndSendWithFreighter, checkRWAAllowance, approveRWAForLending]);

  const withdrawRWAToken = useCallback(async (
    token: RWAToken, 
    poolAddress: string, 
    amount: string
  ): Promise<string> => {
    if (!address) throw new Error("Wallet not connected");

    try {
      setLoading(true);
      setError(null);

      console.log("🔗 [RWA Lending] Withdrawing RWA token:", { 
        token: token.contractAddress, 
        pool: poolAddress, 
        amount 
      });

      const blendPoolContract = contract(poolAddress, address);
      const account = await sorobanServer.getAccount(address);
      const amountScaled = BigInt(amount) * BigInt(Math.pow(10, token.decimals));

      const tx = new TransactionBuilder(account, {
        fee: "10000000",
        networkPassphrase: "Test SDF Network ; September 2015",
      })
        .addOperation(blendPoolContract.call("withdraw", 
          Address.fromString(address).toScVal(),
          Address.fromString(token.contractAddress).toScVal(),
          nativeToScVal(amountScaled, { type: "i128" })
        ))
        .setTimeout(30)
        .build();

      const txHash = await signAndSendWithFreighter(tx);
      
      toast.success(`Successfully withdrew ${amount} ${token.symbol} from lending pool!`);
      return txHash;

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to withdraw RWA token";
      setError(errorMsg);
      toast.error(`Withdrawal failed: ${errorMsg}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [address, contract, sorobanServer, signAndSendWithFreighter]);

  const borrowAgainstRWA = useCallback(async (
    token: RWAToken, 
    poolAddress: string, 
    amount: string,
    borrowAsset: string
  ): Promise<string> => {
    if (!address) throw new Error("Wallet not connected");

    try {
      setLoading(true);
      setError(null);

      console.log("🔗 [RWA Lending] Borrowing against RWA collateral:", { 
        collateral: token.contractAddress, 
        pool: poolAddress, 
        amount, 
        borrowAsset 
      });

      const blendPoolContract = contract(poolAddress, address);
      const account = await sorobanServer.getAccount(address);
      
      // Note: Amount here is for the asset being borrowed, not the RWA collateral
      const amountScaled = BigInt(amount) * BigInt(Math.pow(10, 7)); // Assuming 7 decimals for borrowed asset

      const tx = new TransactionBuilder(account, {
        fee: "10000000",
        networkPassphrase: "Test SDF Network ; September 2015",
      })
        .addOperation(blendPoolContract.call("borrow", 
          Address.fromString(address).toScVal(),
          Address.fromString(borrowAsset).toScVal(),
          nativeToScVal(amountScaled, { type: "i128" })
        ))
        .setTimeout(30)
        .build();

      const txHash = await signAndSendWithFreighter(tx);
      
      toast.success(`Successfully borrowed ${amount} against ${token.symbol} collateral!`);
      return txHash;

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to borrow against RWA";
      setError(errorMsg);
      toast.error(`Borrow failed: ${errorMsg}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [address, contract, sorobanServer, signAndSendWithFreighter]);

  const repayWithRWA = useCallback(async (
    token: RWAToken, 
    poolAddress: string, 
    amount: string
  ): Promise<string> => {
    if (!address) throw new Error("Wallet not connected");

    try {
      setLoading(true);
      setError(null);

      console.log("🔗 [RWA Lending] Repaying with RWA token:", { 
        token: token.contractAddress, 
        pool: poolAddress, 
        amount 
      });

      // Check and approve if needed
      const currentAllowance = await checkRWAAllowance(token, poolAddress);
      const amountScaled = BigInt(amount) * BigInt(Math.pow(10, token.decimals));

      if (BigInt(currentAllowance) < amountScaled) {
        console.log("🔗 [RWA Lending] Insufficient allowance for repayment, approving first...");
        await approveRWAForLending(token, poolAddress, amount);
      }

      const blendPoolContract = contract(poolAddress, address);
      const account = await sorobanServer.getAccount(address);

      const tx = new TransactionBuilder(account, {
        fee: "10000000",
        networkPassphrase: "Test SDF Network ; September 2015",
      })
        .addOperation(blendPoolContract.call("repay", 
          Address.fromString(address).toScVal(),
          Address.fromString(token.contractAddress).toScVal(),
          nativeToScVal(amountScaled, { type: "i128" })
        ))
        .setTimeout(30)
        .build();

      const txHash = await signAndSendWithFreighter(tx);
      
      toast.success(`Successfully repaid ${amount} ${token.symbol}!`);
      return txHash;

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to repay with RWA token";
      setError(errorMsg);
      toast.error(`Repayment failed: ${errorMsg}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [address, contract, sorobanServer, signAndSendWithFreighter, checkRWAAllowance, approveRWAForLending]);

  const previewOperation = useCallback(async (
    operation: RWALendingOperation
  ): Promise<RWALendingPreview> => {
    // Mock preview calculation
    // In a real implementation, this would call the Blend Protocol contracts
    // to get accurate previews of interest rates, health factors, etc.
    
    const baseAPY = operation.type === 'supply' ? 5.2 : 8.7;
    const healthFactor = operation.type === 'borrow' ? 1.8 : 2.5;
    
    return {
      operation,
      estimatedAPY: baseAPY + (Math.random() - 0.5) * 2, // ±1% variance
      healthFactorAfter: healthFactor + (Math.random() - 0.5) * 0.5,
      fees: "0.1%",
      requiredCollateral: operation.type === 'borrow' ? `${parseFloat(operation.amount) * 1.5}` : undefined,
      warnings: operation.type === 'borrow' && parseFloat(operation.amount) > 1000 
        ? ["Large borrowing amount may require additional collateral"] 
        : []
    };
  }, []);

  return {
    supplyRWAToken,
    withdrawRWAToken,
    borrowAgainstRWA,
    repayWithRWA,
    previewOperation,
    approveRWAForLending,
    checkRWAAllowance,
    loading,
    error
  };
};
