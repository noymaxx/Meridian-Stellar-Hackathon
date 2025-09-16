import { useState } from "react";
import { useWallet } from "./useWallet";
import { useProvider } from "./useProvider";
import { toast } from "sonner";
import { scValToNative } from "@stellar/stellar-sdk";

export interface TokenFactoryParams {
  name: string;
  symbol: string;
  decimals: number;
  admin: string;
  complianceContract: string;
}

export interface ComplianceParams {
  tokenAddress: string;
  from: string;
  to: string;
  amount: string;
}

export interface IdentityParams {
  address: string;
  identity: string;
  kycData: any;
}

export interface UseSRWAOperationsReturn {
  // Token Factory operations
  createToken: (params: TokenFactoryParams) => Promise<any>;
  getTokenFactoryConfig: () => Promise<any>;
  getCreatedTokens: () => Promise<any>;
  
  // Compliance operations
  checkCompliance: (params: ComplianceParams) => Promise<any>;
  setComplianceRules: (tokenAddress: string, rules: any) => Promise<any>;
  getComplianceRules: (tokenAddress: string) => Promise<any>;
  
  // Identity operations
  registerIdentity: (params: IdentityParams) => Promise<any>;
  getIdentity: (address: string) => Promise<any>;
  updateIdentity: (params: IdentityParams) => Promise<any>;
  verifyIdentity: (address: string) => Promise<any>;
  
  // System status
  getSystemStatus: () => Promise<any>;
  
  // State
  isLoading: boolean;
  error: string | null;
}

export const useSRWAOperations = (): UseSRWAOperationsReturn => {
  const { wallet, isConnected } = useWallet();
  const { contract, signAndSend, getContractId } = useProvider();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper function to handle operations
  const handleOperation = async <T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> => {
    setIsLoading(true);
    setError(null);

    try {
      console.log(`🔗 [SRWA Operations] Starting ${operationName}`, {
        publicKey: wallet?.publicKey,
        isConnected,
        timestamp: new Date().toISOString()
      });
      
      const result = await operation();
      
      console.log(`🔗 [SRWA Operations] Successfully completed ${operationName}`, {
        result,
        timestamp: new Date().toISOString()
      });
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      console.error(`🔗 [SRWA Operations] Failed ${operationName}:`, err);
      
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Token Factory Operations
  const createToken = async (params: TokenFactoryParams) => {
    return handleOperation(async () => {
      // Wallet is already verified by the calling component

      const id = toast.loading("Creating SRWA token...") as string;
      
      try {
        console.log("🔗 [SRWA Operations] Creating token with params:", params);
        
        // Use SRWA Token directly (like CLI) instead of Token Factory
        const srwaTokenContract = contract(getContractId("srwaToken"), wallet.publicKey);
        
        // Step 1: Initialize the token (like CLI)
        const initTx = await srwaTokenContract.initialize({
          admin: params.admin,
          name: params.name,
          symbol: params.symbol,
          decimals: params.decimals,
          compliance_contract: params.complianceContract,
        });

        console.log("🔗 [SRWA Operations] Initialize transaction prepared:", initTx);

        const initHash = await signAndSend(initTx, wallet);
        
        console.log("🔗 [SRWA Operations] Token initialization sent:", initHash);

        // Step 2: Mint initial supply (like CLI)
        const mintTx = await srwaTokenContract.mint({
          to: params.admin,
          amount: "1000000000000", // 1,000,000 RWA tokens (like CLI)
        });

        console.log("🔗 [SRWA Operations] Mint transaction prepared:", mintTx);

        const mintHash = await signAndSend(mintTx, wallet);
        
        console.log("🔗 [SRWA Operations] Token minting sent:", mintHash);

        toast.success("Token created and minted successfully!", {
          id,
          duration: 5000,
          action: {
            label: "View on Explorer →",
            onClick: () =>
              window.open(
                `https://stellar.expert/explorer/testnet/tx/${mintHash}`,
                "_blank"
              ),
          },
        });

        return { 
          success: true, 
          transactionHash: mintHash, 
          initHash,
          result: params 
        };
      } catch (err) {
        console.error("🔗 [SRWA Operations] Error creating token:", err);
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        toast.error(`Failed to create token: ${errorMessage}`, { id });
        throw err;
      }
    }, "Create Token");
  };

  const getTokenFactoryConfig = async () => {
    return handleOperation(async () => {
      // Wallet is already verified by the calling component

      const id = toast.loading("Getting token factory config...") as string;
      
      try {
        console.log("🔗 [SRWA Operations] Getting token factory config");
        
        const tokenFactoryContract = contract(getContractId("tokenFactory"), wallet.publicKey);
        
        const sim = await tokenFactoryContract.getTokenFactoryConfig();

        console.log("🔗 [SRWA Operations] Token factory config simulation:", sim);

        if (!sim.simulation?.result.retval) {
          toast.error("No token factory config found", { id });
          return { success: false, result: null };
        }

        const scval = sim.simulation?.result.retval;
        const decodedConfig = scValToNative(scval) as any;

        console.log("🔗 [SRWA Operations] Token factory config decoded:", decodedConfig);

        toast.success("Token factory config retrieved!", { id });

        return { success: true, result: decodedConfig };
      } catch (err) {
        console.error("🔗 [SRWA Operations] Error getting token factory config:", err);
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        toast.error(`Failed to get token factory config: ${errorMessage}`, { id });
        throw err;
      }
    }, "Get Token Factory Config");
  };

  const getCreatedTokens = async () => {
    return handleOperation(async () => {
      // Wallet is already verified by the calling component

      const id = toast.loading("Getting created tokens...") as string;
      
      try {
        console.log("🔗 [SRWA Operations] Getting created tokens");
        
        const tokenFactoryContract = contract(getContractId("tokenFactory"), wallet.publicKey);
        
        const sim = await tokenFactoryContract.getCreatedTokens();

        console.log("🔗 [SRWA Operations] Created tokens simulation:", sim);

        if (!sim.simulation?.result.retval) {
          toast.error("No created tokens found", { id });
          return { success: false, result: [] };
        }

        const scval = sim.simulation?.result.retval;
        const decodedTokens = scValToNative(scval) as any;

        console.log("🔗 [SRWA Operations] Created tokens decoded:", decodedTokens);

        toast.success("Created tokens retrieved!", { id });

        return { success: true, result: decodedTokens };
      } catch (err) {
        console.error("🔗 [SRWA Operations] Error getting created tokens:", err);
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        toast.error(`Failed to get created tokens: ${errorMessage}`, { id });
        throw err;
      }
    }, "Get Created Tokens");
  };

  // Compliance Operations
  const checkCompliance = async (params: ComplianceParams) => {
    return handleOperation(async () => {
      // Wallet is already verified by the calling component

      const id = toast.loading("Checking compliance...") as string;
      
      try {
        console.log("🔗 [SRWA Operations] Checking compliance with params:", params);
        
        const complianceContract = contract(getContractId("complianceCore"), wallet.publicKey);
        
        const sim = await complianceContract.checkCompliance({
          tokenAddress: params.tokenAddress,
          from: params.from,
          to: params.to,
          amount: params.amount,
        });

        console.log("🔗 [SRWA Operations] Compliance check simulation:", sim);

        if (!sim.simulation?.result.retval) {
          toast.error("Compliance check failed", { id });
          return { success: false, result: null };
        }

        const scval = sim.simulation?.result.retval;
        const decodedResult = scValToNative(scval) as any;

        console.log("🔗 [SRWA Operations] Compliance check result:", decodedResult);

        toast.success("Compliance check completed!", { id });

        return { success: true, result: decodedResult };
      } catch (err) {
        console.error("🔗 [SRWA Operations] Error checking compliance:", err);
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        toast.error(`Failed to check compliance: ${errorMessage}`, { id });
        throw err;
      }
    }, "Check Compliance");
  };

  const setComplianceRules = async (tokenAddress: string, rules: any) => {
    return handleOperation(async () => {
      // Wallet is already verified by the calling component

      const id = toast.loading("Setting compliance rules...") as string;
      
      try {
        console.log("🔗 [SRWA Operations] Setting compliance rules:", { tokenAddress, rules });
        
        const complianceContract = contract(getContractId("complianceCore"), wallet.publicKey);
        
        const tx = await complianceContract.setComplianceRules({
          tokenAddress,
          rules,
        });

        console.log("🔗 [SRWA Operations] Compliance rules transaction prepared:", tx);

        const hash = await signAndSend(tx, wallet);
        
        console.log("🔗 [SRWA Operations] Compliance rules transaction sent:", hash);

        toast.success("Compliance rules set successfully!", {
          id,
          duration: 5000,
          action: {
            label: "View on Explorer →",
            onClick: () =>
              window.open(
                `https://stellar.expert/explorer/testnet/tx/${hash}`,
                "_blank"
              ),
          },
        });

        return { success: true, transactionHash: hash, result: rules };
      } catch (err) {
        console.error("🔗 [SRWA Operations] Error setting compliance rules:", err);
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        toast.error(`Failed to set compliance rules: ${errorMessage}`, { id });
        throw err;
      }
    }, "Set Compliance Rules");
  };

  const getComplianceRules = async (tokenAddress: string) => {
    return handleOperation(async () => {
      // Wallet is already verified by the calling component

      const id = toast.loading("Getting compliance rules...") as string;
      
      try {
        console.log("🔗 [SRWA Operations] Getting compliance rules for:", tokenAddress);
        
        const complianceContract = contract(getContractId("complianceCore"), wallet.publicKey);
        
        const sim = await complianceContract.getComplianceRules({
          tokenAddress,
        });

        console.log("🔗 [SRWA Operations] Compliance rules simulation:", sim);

        if (!sim.simulation?.result.retval) {
          toast.error("No compliance rules found", { id });
          return { success: false, result: null };
        }

        const scval = sim.simulation?.result.retval;
        const decodedRules = scValToNative(scval) as any;

        console.log("🔗 [SRWA Operations] Compliance rules decoded:", decodedRules);

        toast.success("Compliance rules retrieved!", { id });

        return { success: true, result: decodedRules };
      } catch (err) {
        console.error("🔗 [SRWA Operations] Error getting compliance rules:", err);
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        toast.error(`Failed to get compliance rules: ${errorMessage}`, { id });
        throw err;
      }
    }, "Get Compliance Rules");
  };

  // Identity Operations
  const registerIdentity = async (params: IdentityParams) => {
    return handleOperation(async () => {
      // Wallet is already verified by the calling component

      const id = toast.loading("Registering identity...") as string;
      
      try {
        console.log("🔗 [SRWA Operations] Registering identity with params:", params);
        
        const identityContract = contract(getContractId("identityRegistry"), wallet.publicKey);
        
        const tx = await identityContract.registerIdentity({
          address: params.address,
          identity: params.identity,
          kycData: params.kycData,
        });

        console.log("🔗 [SRWA Operations] Identity registration transaction prepared:", tx);

        const hash = await signAndSend(tx, wallet);
        
        console.log("🔗 [SRWA Operations] Identity registration transaction sent:", hash);

        toast.success("Identity registered successfully!", {
          id,
          duration: 5000,
          action: {
            label: "View on Explorer →",
            onClick: () =>
              window.open(
                `https://stellar.expert/explorer/testnet/tx/${hash}`,
                "_blank"
              ),
          },
        });

        return { success: true, transactionHash: hash, result: params };
      } catch (err) {
        console.error("🔗 [SRWA Operations] Error registering identity:", err);
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        toast.error(`Failed to register identity: ${errorMessage}`, { id });
        throw err;
      }
    }, "Register Identity");
  };

  const getIdentity = async (address: string) => {
    return handleOperation(async () => {
      // Wallet is already verified by the calling component

      const id = toast.loading("Getting identity...") as string;
      
      try {
        console.log("🔗 [SRWA Operations] Getting identity for:", address);
        
        const identityContract = contract(getContractId("identityRegistry"), wallet.publicKey);
        
        const sim = await identityContract.getIdentity({
          address,
        });

        console.log("🔗 [SRWA Operations] Identity simulation:", sim);

        if (!sim.simulation?.result.retval) {
          toast.error("No identity found", { id });
          return { success: false, result: null };
        }

        const scval = sim.simulation?.result.retval;
        const decodedIdentity = scValToNative(scval) as any;

        console.log("🔗 [SRWA Operations] Identity decoded:", decodedIdentity);

        toast.success("Identity retrieved!", { id });

        return { success: true, result: decodedIdentity };
      } catch (err) {
        console.error("🔗 [SRWA Operations] Error getting identity:", err);
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        toast.error(`Failed to get identity: ${errorMessage}`, { id });
        throw err;
      }
    }, "Get Identity");
  };

  const updateIdentity = async (params: IdentityParams) => {
    return handleOperation(async () => {
      // Wallet is already verified by the calling component

      const id = toast.loading("Updating identity...") as string;
      
      try {
        console.log("🔗 [SRWA Operations] Updating identity with params:", params);
        
        const identityContract = contract(getContractId("identityRegistry"), wallet.publicKey);
        
        const tx = await identityContract.updateIdentity({
          address: params.address,
          identity: params.identity,
          kycData: params.kycData,
        });

        console.log("🔗 [SRWA Operations] Identity update transaction prepared:", tx);

        const hash = await signAndSend(tx, wallet);
        
        console.log("🔗 [SRWA Operations] Identity update transaction sent:", hash);

        toast.success("Identity updated successfully!", {
          id,
          duration: 5000,
          action: {
            label: "View on Explorer →",
            onClick: () =>
              window.open(
                `https://stellar.expert/explorer/testnet/tx/${hash}`,
                "_blank"
              ),
          },
        });

        return { success: true, transactionHash: hash, result: params };
      } catch (err) {
        console.error("🔗 [SRWA Operations] Error updating identity:", err);
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        toast.error(`Failed to update identity: ${errorMessage}`, { id });
        throw err;
      }
    }, "Update Identity");
  };

  const verifyIdentity = async (address: string) => {
    return handleOperation(async () => {
      // Wallet is already verified by the calling component

      const id = toast.loading("Verifying identity...") as string;
      
      try {
        console.log("🔗 [SRWA Operations] Verifying identity for:", address);
        
        const identityContract = contract(getContractId("identityRegistry"), wallet.publicKey);
        
        const sim = await identityContract.verifyIdentity({
          address,
        });

        console.log("🔗 [SRWA Operations] Identity verification simulation:", sim);

        if (!sim.simulation?.result.retval) {
          toast.error("Identity verification failed", { id });
          return { success: false, result: null };
        }

        const scval = sim.simulation?.result.retval;
        const decodedResult = scValToNative(scval) as any;

        console.log("🔗 [SRWA Operations] Identity verification result:", decodedResult);

        toast.success("Identity verification completed!", { id });

        return { success: true, result: decodedResult };
      } catch (err) {
        console.error("🔗 [SRWA Operations] Error verifying identity:", err);
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        toast.error(`Failed to verify identity: ${errorMessage}`, { id });
        throw err;
      }
    }, "Verify Identity");
  };

  // System Status
  const getSystemStatus = async () => {
    return handleOperation(async () => {
      // Wallet is already verified by the calling component

      const id = toast.loading("Getting system status...") as string;
      
      try {
        console.log("🔗 [SRWA Operations] Getting system status");
        
        const status = {
          tokenFactory: { contractId: getContractId("tokenFactory"), status: "active" },
          complianceCore: { contractId: getContractId("complianceCore"), status: "active" },
          identityRegistry: { contractId: getContractId("identityRegistry"), status: "active" },
          claimTopicsRegistry: { contractId: getContractId("claimTopicsRegistry"), status: "active" },
          trustedIssuersRegistry: { contractId: getContractId("trustedIssuersRegistry"), status: "active" },
          complianceModules: { contractId: getContractId("complianceModules"), status: "active" },
          integrations: { contractId: getContractId("integrations"), status: "active" },
        };

        console.log("🔗 [SRWA Operations] System status:", status);

        toast.success("System status retrieved!", { id });

        return { success: true, result: status };
      } catch (err) {
        console.error("🔗 [SRWA Operations] Error getting system status:", err);
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        toast.error(`Failed to get system status: ${errorMessage}`, { id });
        throw err;
      }
    }, "Get System Status");
  };

  return {
    // Token Factory
    createToken,
    getTokenFactoryConfig,
    getCreatedTokens,
    
    // Compliance
    checkCompliance,
    setComplianceRules,
    getComplianceRules,
    
    // Identity
    registerIdentity,
    getIdentity,
    updateIdentity,
    verifyIdentity,
    
    // System
    getSystemStatus,
    
    // State
    isLoading,
    error
  };
};
