import { useState } from "react";
import { useWallet } from "@/components/wallet/WalletProvider";
import { toast } from "sonner";
import { Client as BlendClient, RequestType, Position, PoolInfo, BlendPosition, ComplianceResult, networks } from "@/lib/contracts/blend-adapter/src/index";
import { rpc, Keypair, Transaction } from "@stellar/stellar-sdk";

// Contract IDs para integração Blend
const BLEND_CONTRACTS = {
  blendAdapter: "CCUI5PWD4JRER3COUXUKKKKQ3VFNCM5DRAZVPTB2LV2AS4LHZ2PCI463", // ✅ Novo Blend Adapter (FIXED)
  blendPool: "CAQ4DF5FLQHGAUEXYJKTVFFIVHVIUN6XNUE7NW27BJGWEPNHQKZYMRQ6", // ✅ Pool Blend Real
  srwaToken: "CB7NRHA2IAUT6HDBPWMKN3LBHBPVW7VOW5YTGTUIZV3J64BNOXXHLU6L", // ✅ SRWA Token 
  oracle: "CALI2BYU2JE6WVRUFYTS6MSBNEHGJ35P4AVCZYF3B6QOE3QKOB2PLE6M", // ✅ Oracle (Testnet StellarDex)
};

export interface BlendOperationParams {
  poolAddress: string;
  token: string;
  amount: string;
}

export interface PoolCreationParams {
  name: string;
  oracle: string;
  maxPositions: number;
}

export interface TokenConfigParams {
  poolAddress: string;
  token: string;
  ltvRatio: number;
  liqThreshold: number;
}

export interface UseBlendOperationsReturn {
  // Pool Operations
  initialize: () => Promise<any>;
  getAdmin: () => Promise<string>;
  getPoolData: (poolAddress: string) => Promise<any>;
  registerPool: (params: PoolCreationParams & { poolAddress: string }) => Promise<any>;
  createPool: (params: PoolCreationParams) => Promise<any>;
  addTokenToPool: (params: TokenConfigParams) => Promise<any>;
  setupPoolReserve: (params: { poolAddress: string; asset: string }) => Promise<any>;
  
  // Lending Operations
  supplyCollateral: (params: BlendOperationParams) => Promise<any>;
  borrowAmount: (params: BlendOperationParams) => Promise<any>;
  repayAmount: (params: BlendOperationParams) => Promise<any>;
  withdrawCollateral: (params: BlendOperationParams) => Promise<any>;
  
  // Query Operations
  getPosition: (params: { user: string; poolAddress: string }) => Promise<Position>;
  getBlendPosition: (params: { user: string; poolAddress: string }) => Promise<BlendPosition>;
  getPoolInfo: (poolAddress: string) => Promise<PoolInfo>;
  getAllPools: () => Promise<string[]>;
  checkCompliance: (params: BlendOperationParams & { requestType: RequestType }) => Promise<ComplianceResult>;
  getTokenConfig: (token: string) => Promise<any>;
  poolExists: (poolAddress: string) => Promise<boolean>;
  
  // State
  isLoading: boolean;
  error: string | null;
}

export const useBlendOperations = (): UseBlendOperationsReturn => {
  const { address, isConnected, signTransaction } = useWallet();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // RPC and Client setup
  const rpcUrl = "https://soroban-testnet.stellar.org";
  const server = new rpc.Server(rpcUrl);
  const networkPassphrase = networks.testnet.networkPassphrase;

  // Helper function to create Blend client with signing capability
  const createBlendClient = () => {
    if (!address || !isConnected) {
      throw new Error("Wallet not connected");
    }

    console.log("🔗 [Blend Operations] Using Freighter wallet address:", address);

    return new BlendClient({
      contractId: BLEND_CONTRACTS.blendAdapter,
      networkPassphrase,
      rpcUrl,
      publicKey: address,
      // Add signing function for the client
      signTransaction: async (txXdr: string) => {
        console.log("🔗 [Blend Client] Signing transaction with Freighter wallet");
        try {
          // Use Freighter's signTransaction
          const signedTxXdr = await signTransaction(txXdr);
          return {
            signedTxXdr,
            signerAddress: address,
          };
        } catch (error) {
          console.error("🔗 [Blend Client] Error signing transaction:", error);
          throw error;
        }
      },
    });
  };

  // Initialize the Blend adapter contract
  const initialize = async () => {
    return handleOperation(async () => {
      if (!address) throw new Error("Wallet not connected");

      const id = toast.loading("Initializing Blend Adapter...") as string;
      
      try {
        const client = createBlendClient();
        
        console.log("🔗 [Blend Operations] Initializing contract with admin:", address);
        
        const tx = await client.initialize({
          admin: address,
        }, {
          simulate: false, // Don't simulate first
        });

        // Force the transaction to be signed and sent even if it appears to be a read call
        const hash = await signAndSendTransaction(tx, true); // Pass force=true
        
        toast.success("Blend Adapter initialized successfully!", {
          id,
          duration: 5000,
          action: {
            label: "View on Explorer →",
            onClick: () => window.open(
              `https://stellar.expert/explorer/testnet/tx/${hash}`,
              "_blank"
            ),
          },
        });

        return { 
          success: true, 
          transactionHash: hash 
        };
      } catch (err) {
        console.error("🔗 [Blend Operations] Error initializing contract:", err);
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        toast.error(`Failed to initialize contract: ${errorMessage}`, { id });
        throw err;
      }
    }, "Initialize Contract");
  };

  // Get admin to check if contract is initialized
  const getAdmin = async (): Promise<string> => {
    return handleOperation(async () => {
      const client = createBlendClient();
      
      console.log("🔗 [Blend Operations] Getting contract admin");
      
      const result = await client.get_admin();

      if (result.result === undefined) {
        throw new Error("Failed to get admin");
      }

      return result.result;
    }, "Get Admin");
  };

  // Get pool data
  const getPoolData = async (poolAddress: string) => {
    return handleOperation(async () => {
      const client = createBlendClient();
      
      console.log("🔗 [Blend Operations] Getting pool data for:", poolAddress);
      
      const result = await client.get_pool_info({
        pool_address: poolAddress,
      });

      if (!result.result) {
        throw new Error("Failed to get pool data");
      }

      return result.result;
    }, "Get Pool Data");
  };

  // Helper function to handle operations with detailed logging
  const handleOperation = async <T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> => {
    setIsLoading(true);
    setError(null);

    try {
      console.log(`🔗 [Blend Operations] Starting ${operationName}`, {
        address,
        isConnected,
        timestamp: new Date().toISOString(),
        blendAdapter: BLEND_CONTRACTS.blendAdapter,
        blendPool: BLEND_CONTRACTS.blendPool,
      });
      
      const result = await operation();
      
      console.log(`🔗 [Blend Operations] Successfully completed ${operationName}`, {
        result,
        timestamp: new Date().toISOString()
      });
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      console.error(`🔗 [Blend Operations] Failed ${operationName}:`, {
        error: err,
        errorMessage,
        timestamp: new Date().toISOString()
      });
      
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Helper for sign and send with Freighter wallet
  const signAndSendTransaction = async (assembledTx: any, force: boolean = false): Promise<string> => {
    console.log("🔗 [Blend Operations] Preparing transaction for signing...");

    if (!address || !isConnected) {
      throw new Error("Wallet not connected");
    }

    try {
      console.log("🔗 [Blend Operations] Signing with Freighter wallet");
      
      // Get the transaction XDR to sign
      const txXdr = assembledTx.built.toXDR();
      console.log("🔗 [Blend Operations] Transaction XDR prepared, requesting signature...");
      
      // Sign with Freighter
      const signedXdr = await signTransaction(txXdr);
      console.log("🔗 [Blend Operations] Transaction signed successfully");
      
      // Submit the signed transaction directly to the RPC
      const transaction = new Transaction(signedXdr, networkPassphrase);
      const response = await server.sendTransaction(transaction);
      
      console.log("🔗 [Blend Operations] Transaction submitted successfully:", response);
      
      // Extract the transaction hash from the response
      const transactionHash = response.hash || "unknown";
      
      console.log("🔗 [Blend Operations] Extracted transaction hash:", transactionHash);
      return transactionHash;
    } catch (error) {
      console.error("🔗 [Blend Operations] Error in signAndSendTransaction:", error);
      throw error;
    }
  };

  // Pool Operations
  const registerPool = async (params: PoolCreationParams & { poolAddress: string }) => {
    return handleOperation(async () => {
      if (!address) throw new Error("Wallet not connected");

      const id = toast.loading(`Registering Blend Pool: ${params.name}...`) as string;
      
      try {
        const client = createBlendClient();
        
        console.log("🔗 [Blend Operations] Registering pool with params:", params);
        
        const tx = await client.register_pool({
          admin: address,
          pool_address: params.poolAddress,
          name: params.name,
          oracle: params.oracle,
          max_positions: params.maxPositions,
        });

        const hash = await signAndSendTransaction(tx);
        
        toast.success(`Pool registered successfully!`, {
          id,
          duration: 5000,
          action: {
            label: "View on Explorer →",
            onClick: () => window.open(
              `https://stellar.expert/explorer/testnet/tx/${hash}`,
              "_blank"
            ),
          },
        });

        return { 
          success: true, 
          transactionHash: hash,
          poolAddress: params.poolAddress,
          poolName: params.name
        };
      } catch (err) {
        console.error("🔗 [Blend Operations] Error registering pool:", err);
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        toast.error(`Failed to register pool: ${errorMessage}`, { id });
        throw err;
      }
    }, "Register Pool");
  };

  const createPool = async (params: PoolCreationParams) => {
    return handleOperation(async () => {
      if (!address) throw new Error("Wallet not connected");

      const id = toast.loading(`Creating new Blend Pool: ${params.name}...`) as string;
      
      try {
        const client = createBlendClient();
        
        console.log("🔗 [Blend Operations] Creating pool with params:", params);
        
        const tx = await client.create_pool({
          admin: address,
          name: params.name,
          oracle: params.oracle,
          max_positions: params.maxPositions,
        });

        const hash = await signAndSendTransaction(tx);
        
        toast.success(`Pool created successfully!`, {
          id,
          duration: 5000,
          action: {
            label: "View on Explorer →",
            onClick: () => window.open(
              `https://stellar.expert/explorer/testnet/tx/${hash}`,
              "_blank"
            ),
          },
        });

        return { 
          success: true, 
          transactionHash: hash,
          poolName: params.name
        };
      } catch (err) {
        console.error("🔗 [Blend Operations] Error creating pool:", err);
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        toast.error(`Failed to create pool: ${errorMessage}`, { id });
        throw err;
      }
    }, "Create Pool");
  };

  const addTokenToPool = async (params: TokenConfigParams) => {
    return handleOperation(async () => {
      if (!address) throw new Error("Wallet not connected");

      const id = toast.loading(`Adding SRWA token to pool...`) as string;
      
      try {
        const client = createBlendClient();
        
        console.log("🔗 [Blend Operations] Adding token to pool with params:", params);
        
        const tx = await client.add_token_to_pool({
          admin: address,
          pool_address: params.poolAddress,
          token: params.token,
          ltv_ratio: params.ltvRatio,
          liq_threshold: params.liqThreshold,
        });

        const hash = await signAndSendTransaction(tx);
        
        toast.success(`SRWA token added to pool successfully!`, {
          id,
          duration: 5000,
          action: {
            label: "View on Explorer →",
            onClick: () => window.open(
              `https://stellar.expert/explorer/testnet/tx/${hash}`,
              "_blank"
            ),
          },
        });

        return { 
          success: true, 
          transactionHash: hash,
          tokenAddress: params.token,
          poolAddress: params.poolAddress
        };
      } catch (err) {
        console.error("🔗 [Blend Operations] Error adding token to pool:", err);
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        toast.error(`Failed to add token to pool: ${errorMessage}`, { id });
        throw err;
      }
    }, "Add Token to Pool");
  };

  const setupPoolReserve = async (params: { poolAddress: string; asset: string }) => {
    return handleOperation(async () => {
      if (!address) throw new Error("Wallet not connected");

      const id = toast.loading(`Setting up pool reserve for asset...`) as string;
      
      try {
        const client = createBlendClient();
        
        console.log("🔗 [Blend Operations] Setting up pool reserve with params:", params);
        
        const tx = await client.setup_pool_reserve({
          admin: address,
          pool_address: params.poolAddress,
          asset: params.asset,
        });

        const hash = await signAndSendTransaction(tx);
        
        toast.success(`Pool reserve set up successfully!`, {
          id,
          duration: 5000,
          action: {
            label: "View on Explorer →",
            onClick: () => window.open(
              `https://stellar.expert/explorer/testnet/tx/${hash}`,
              "_blank"
            ),
          },
        });

        return { 
          success: true, 
          transactionHash: hash,
          poolAddress: params.poolAddress,
          asset: params.asset
        };
      } catch (err) {
        console.error("🔗 [Blend Operations] Error setting up pool reserve:", err);
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        toast.error(`Failed to set up pool reserve: ${errorMessage}`, { id });
        throw err;
      }
    }, "Setup Pool Reserve");
  };

  // Lending Operations
  const supplyCollateral = async (params: BlendOperationParams) => {
    return handleOperation(async () => {
      if (!address) throw new Error("Wallet not connected");

      const id = toast.loading(`Supplying ${params.amount} SRWA as collateral...`) as string;
      
      try {
        const client = createBlendClient();
        
        console.log("🔗 [Blend Operations] Supplying collateral with params:", params);
        
        const tx = await client.supply_collateral({
          from: address,
          pool_address: params.poolAddress,
          token: params.token,
          amount: BigInt(params.amount),
        });

        const hash = await signAndSendTransaction(tx);
        
        toast.success(`Collateral supplied successfully!`, {
          id,
          duration: 5000,
          action: {
            label: "View on Explorer →",
            onClick: () => window.open(
              `https://stellar.expert/explorer/testnet/tx/${hash}`,
              "_blank"
            ),
          },
        });

        return { 
          success: true, 
          transactionHash: hash,
          operation: 'supply_collateral',
          amount: params.amount
        };
      } catch (err) {
        console.error("🔗 [Blend Operations] Error supplying collateral:", err);
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        toast.error(`Failed to supply collateral: ${errorMessage}`, { id });
        throw err;
      }
    }, "Supply Collateral");
  };

  const borrowAmount = async (params: BlendOperationParams) => {
    return handleOperation(async () => {
      if (!address) throw new Error("Wallet not connected");

      const id = toast.loading(`Borrowing ${params.amount} against SRWA collateral...`) as string;
      
      try {
        const client = createBlendClient();
        
        console.log("🔗 [Blend Operations] Borrowing with params:", params);
        
        const tx = await client.borrow_amount({
          from: address,
          pool_address: params.poolAddress,
          token: params.token,
          amount: BigInt(params.amount),
        });

        const hash = await signAndSendTransaction(tx);
        
        toast.success(`Borrowed successfully!`, {
          id,
          duration: 5000,
          action: {
            label: "View on Explorer →",
            onClick: () => window.open(
              `https://stellar.expert/explorer/testnet/tx/${hash}`,
              "_blank"
            ),
          },
        });

        return { 
          success: true, 
          transactionHash: hash,
          operation: 'borrow',
          amount: params.amount
        };
      } catch (err) {
        console.error("🔗 [Blend Operations] Error borrowing:", err);
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        toast.error(`Failed to borrow: ${errorMessage}`, { id });
        throw err;
      }
    }, "Borrow Amount");
  };

  const repayAmount = async (params: BlendOperationParams) => {
    return handleOperation(async () => {
      if (!address) throw new Error("Wallet not connected");

      const id = toast.loading(`Repaying ${params.amount}...`) as string;
      
      try {
        const client = createBlendClient();
        
        console.log("🔗 [Blend Operations] Repaying with params:", params);
        
        const tx = await client.repay_amount({
          from: address,
          pool_address: params.poolAddress,
          token: params.token,
          amount: BigInt(params.amount),
        });

        const hash = await signAndSendTransaction(tx);
        
        toast.success(`Repayment successful!`, {
          id,
          duration: 5000,
          action: {
            label: "View on Explorer →",
            onClick: () => window.open(
              `https://stellar.expert/explorer/testnet/tx/${hash}`,
              "_blank"
            ),
          },
        });

        return { 
          success: true, 
          transactionHash: hash,
          operation: 'repay',
          amount: params.amount
        };
      } catch (err) {
        console.error("🔗 [Blend Operations] Error repaying:", err);
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        toast.error(`Failed to repay: ${errorMessage}`, { id });
        throw err;
      }
    }, "Repay Amount");
  };

  const withdrawCollateral = async (params: BlendOperationParams) => {
    return handleOperation(async () => {
      if (!address) throw new Error("Wallet not connected");

      const id = toast.loading(`Withdrawing ${params.amount} collateral...`) as string;
      
      try {
        const client = createBlendClient();
        
        console.log("🔗 [Blend Operations] Withdrawing collateral with params:", params);
        
        const tx = await client.withdraw_collateral({
          from: address,
          pool_address: params.poolAddress,
          token: params.token,
          amount: BigInt(params.amount),
        });

        const hash = await signAndSendTransaction(tx);
        
        toast.success(`Collateral withdrawn successfully!`, {
          id,
          duration: 5000,
          action: {
            label: "View on Explorer →",
            onClick: () => window.open(
              `https://stellar.expert/explorer/testnet/tx/${hash}`,
              "_blank"
            ),
          },
        });

        return { 
          success: true, 
          transactionHash: hash,
          operation: 'withdraw_collateral',
          amount: params.amount
        };
      } catch (err) {
        console.error("🔗 [Blend Operations] Error withdrawing collateral:", err);
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        toast.error(`Failed to withdraw collateral: ${errorMessage}`, { id });
        throw err;
      }
    }, "Withdraw Collateral");
  };

  // Query Operations
  const getPosition = async (params: { user: string; poolAddress: string }): Promise<Position> => {
    return handleOperation(async () => {
      const client = createBlendClient();
      
      console.log("🔗 [Blend Operations] Getting position for:", params);
      
      const result = await client.get_position({
        user: params.user,
        pool_address: params.poolAddress,
      });

      if (!result.result) {
        throw new Error("Failed to get position");
      }

      return result.result;
    }, "Get Position");
  };

  const getBlendPosition = async (params: { user: string; poolAddress: string }): Promise<BlendPosition> => {
    return handleOperation(async () => {
      const client = createBlendClient();
      
      console.log("🔗 [Blend Operations] Getting Blend position for:", params);
      
      const result = await client.get_blend_position({
        user: params.user,
        pool_address: params.poolAddress,
      });

      if (!result.result) {
        throw new Error("Failed to get Blend position");
      }

      return result.result;
    }, "Get Blend Position");
  };

  const getPoolInfo = async (poolAddress: string): Promise<PoolInfo> => {
    return handleOperation(async () => {
      const client = createBlendClient();
      
      console.log("🔗 [Blend Operations] Getting pool info for:", poolAddress);
      
      const result = await client.get_pool_info({
        pool_address: poolAddress,
      });

      if (!result.result) {
        throw new Error("Failed to get pool info");
      }

      return result.result;
    }, "Get Pool Info");
  };

  const getAllPools = async (): Promise<string[]> => {
    return handleOperation(async () => {
      const client = createBlendClient();
      
      console.log("🔗 [Blend Operations] Getting all pools");
      
      const result = await client.get_all_pools();

      if (!result.result) {
        throw new Error("Failed to get pools");
      }

      return result.result;
    }, "Get All Pools");
  };

  const checkCompliance = async (params: BlendOperationParams & { requestType: RequestType }): Promise<ComplianceResult> => {
    return handleOperation(async () => {
      if (!address) throw new Error("Wallet not connected");

      const client = createBlendClient();
      
      console.log("🔗 [Blend Operations] Checking compliance for:", params);
      
      const result = await client.check_operation_compliance({
        user: address,
        pool_address: params.poolAddress,
        token: params.token,
        amount: BigInt(params.amount),
        request_type: params.requestType,
      });

      if (!result.result) {
        throw new Error("Failed to check compliance");
      }

      return result.result;
    }, "Check Compliance");
  };

  const getTokenConfig = async (token: string) => {
    return handleOperation(async () => {
      const client = createBlendClient();
      
      console.log("🔗 [Blend Operations] Getting token config for:", token);
      
      const result = await client.get_token_config({
        token,
      });

      if (!result.result) {
        throw new Error("Failed to get token config");
      }

      return result.result;
    }, "Get Token Config");
  };

  const poolExists = async (poolAddress: string): Promise<boolean> => {
    return handleOperation(async () => {
      const client = createBlendClient();
      
      console.log("🔗 [Blend Operations] Checking if pool exists:", poolAddress);
      
      const result = await client.pool_exists({
        pool_address: poolAddress,
      });

      if (result.result === undefined) {
        throw new Error("Failed to check pool existence");
      }

      return result.result;
    }, "Pool Exists");
  };

  return {
    // Pool Operations
    initialize,
    getAdmin,
    getPoolData,
    registerPool,
    createPool,
    addTokenToPool,
    setupPoolReserve,
    
    // Lending Operations
    supplyCollateral,
    borrowAmount,
    repayAmount,
    withdrawCollateral,
    
    // Query Operations
    getPosition,
    getBlendPosition,
    getPoolInfo,
    getAllPools,
    checkCompliance,
    getTokenConfig,
    poolExists,
    
    // State
    isLoading,
    error,
  };
};

// Export default contract IDs for easy access
// Export default contract IDs for easy access
export { BLEND_CONTRACTS, RequestType };
