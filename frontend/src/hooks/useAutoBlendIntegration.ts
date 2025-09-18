import { useState, useEffect } from "react";
import { useBlendOperations } from "./useBlendOperations";
import { useUserRWATokens, type RWAToken } from "./useUserRWATokens";
import { useWallet } from "@/components/wallet/WalletProvider";
import { STELLAR_CONFIG } from "@/lib/stellar-config";
import { Keypair } from "@stellar/stellar-sdk";
import { toast } from "sonner";

export interface BlendIntegrationStatus {
  isRegistered: boolean;
  isConfigured: boolean;
  hasReserve: boolean;
  canLend: boolean;
  poolAddress?: string;
  error?: string;
}

export interface TokenBlendStatus {
  [tokenAddress: string]: BlendIntegrationStatus;
}

export interface UseAutoBlendIntegrationReturn {
  tokenStatuses: TokenBlendStatus;
  loading: boolean;
  error: string | null;
  autoIntegrateToken: (token: RWAToken) => Promise<boolean>;
  checkTokenIntegration: (tokenAddress: string) => Promise<BlendIntegrationStatus>;
  refreshStatuses: () => Promise<void>;
}

// Storage key for tracking integrated tokens
const INTEGRATED_TOKENS_KEY = "blend_integrated_tokens";

// Get integrated tokens from localStorage
const getIntegratedTokens = (): string[] => {
  try {
    const stored = localStorage.getItem(INTEGRATED_TOKENS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// Save integrated tokens to localStorage
const saveIntegratedTokens = (tokens: string[]) => {
  try {
    localStorage.setItem(INTEGRATED_TOKENS_KEY, JSON.stringify(tokens));
  } catch (error) {
    console.error("Failed to save integrated tokens:", error);
  }
};

export const useAutoBlendIntegration = (): UseAutoBlendIntegrationReturn => {
  const [tokenStatuses, setTokenStatuses] = useState<TokenBlendStatus>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { tokens: rwaTokens, loading: tokensLoading } = useUserRWATokens();
  const { address, isConnected } = useWallet();
  const blendOps = useBlendOperations();

  // Default pool address and config
  const DEFAULT_POOL_ADDRESS = "CAQ4DF5FLQHGAUEXYJKTVFFIVHVIUN6XNUE7NW27BJGWEPNHQKZYMRQ6";
  const DEFAULT_LTV_RATIO = 8000; // 80%
  const DEFAULT_LIQ_THRESHOLD = 8500; // 85%

  // Check if a token is integrated with Blend
  const checkTokenIntegration = async (tokenAddress: string): Promise<BlendIntegrationStatus> => {
    try {
      console.log(`🔗 [Auto Blend Integration] Checking integration for token:`, tokenAddress);

      // Check if token is configured in Blend
      const tokenConfig = await blendOps.getTokenConfig(tokenAddress);
      const poolExists = await blendOps.poolExists(DEFAULT_POOL_ADDRESS);

      const status: BlendIntegrationStatus = {
        isRegistered: poolExists,
        isConfigured: tokenConfig && tokenConfig.is_authorized,
        hasReserve: poolExists && tokenConfig?.is_authorized,
        canLend: poolExists && tokenConfig?.is_authorized,
        poolAddress: DEFAULT_POOL_ADDRESS,
      };

      console.log(`🔗 [Auto Blend Integration] Integration status for ${tokenAddress}:`, status);
      return status;

    } catch (error) {
      console.error(`🔗 [Auto Blend Integration] Error checking integration for ${tokenAddress}:`, error);
      return {
        isRegistered: false,
        isConfigured: false,
        hasReserve: false,
        canLend: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  };

  // Auto-integrate a token with Blend
  const autoIntegrateToken = async (token: RWAToken): Promise<boolean> => {
    if (!address || !isConnected) {
      toast.error("Please connect your wallet first");
      return false;
    }

    // Using Freighter wallet - address is already available

    const integrationId = toast.loading(`🔗 Integrating ${token.symbol} with Blend...`);

    try {
      console.log(`🔗 [Auto Blend Integration] Starting auto-integration for:`, token);

      // Step 0: Check if contract is initialized with current user as admin
      console.log(`🔗 [Auto Blend Integration] Step 0: Checking contract initialization`);
      try {
        const admin = await blendOps.getAdmin();
        console.log(`🔗 [Auto Blend Integration] Contract initialized with admin:`, admin);
        console.log(`🔗 [Auto Blend Integration] Freighter wallet address:`, address);
        
        if (admin !== address) {
          console.log(`🔗 [Auto Blend Integration] ⚠️  Admin mismatch detected!`);
          console.log(`🔗 [Auto Blend Integration] Contract admin: ${admin}`);
          console.log(`🔗 [Auto Blend Integration] Current user: ${address}`);
          
          toast.error(
            `Contract was initialized by a different admin. You need to use the wallet that initialized the contract (${admin.slice(0, 8)}...) or deploy a new contract instance.`,
            { duration: 8000 }
          );
          
          throw new Error(`Admin authorization failed. Contract admin: ${admin}, Current user: ${address}`);
        } else {
          console.log(`🔗 [Auto Blend Integration] ✅ Current user is the contract admin - proceeding`);
        }
      } catch (err) {
        if (err.message && err.message.includes('Admin authorization failed')) {
          throw err; // Re-throw admin mismatch errors
        }
        
        console.log(`🔗 [Auto Blend Integration] Contract not initialized, initializing now...`);
        try {
          await blendOps.initialize();
          console.log(`🔗 [Auto Blend Integration] Contract initialized successfully`);
        } catch (initErr) {
          console.log(`🔗 [Auto Blend Integration] Initialization failed:`, initErr);
          throw new Error(`Failed to initialize contract: ${initErr.message}`);
        }
      }

      // Step 1: Register pool if it doesn't exist
      console.log(`🔗 [Auto Blend Integration] Step 1: Checking if pool exists`);
      const poolExists = await blendOps.poolExists(DEFAULT_POOL_ADDRESS);
      
      if (!poolExists) {
        console.log(`🔗 [Auto Blend Integration] Pool doesn't exist, registering...`);
        await blendOps.registerPool({
          poolAddress: DEFAULT_POOL_ADDRESS,
          name: "SRWA Lending Pool",
          oracle: "CALI2BYU2JE6WVRUFYTS6MSBNEHGJ35P4AVCZYF3B6QOE3QKOB2PLE6M", // Using testnet stellarDex oracle
          maxPositions: 10,
        });
        console.log(`🔗 [Auto Blend Integration] Pool registered successfully`);
      }

      // Step 2: Add token to pool
      console.log(`🔗 [Auto Blend Integration] Step 2: Adding token to pool`);
      await blendOps.addTokenToPool({
        poolAddress: DEFAULT_POOL_ADDRESS,
        token: token.contractAddress,
        ltvRatio: DEFAULT_LTV_RATIO,
        liqThreshold: DEFAULT_LIQ_THRESHOLD,
      });
      console.log(`🔗 [Auto Blend Integration] Token added to pool successfully`);

      // Step 3: Setup pool reserve
      console.log(`🔗 [Auto Blend Integration] Step 3: Setting up pool reserve`);
      await blendOps.setupPoolReserve({
        poolAddress: DEFAULT_POOL_ADDRESS,
        asset: token.contractAddress,
      });
      console.log(`🔗 [Auto Blend Integration] Pool reserve set up successfully`);

      // Mark token as integrated
      const integratedTokens = getIntegratedTokens();
      if (!integratedTokens.includes(token.contractAddress)) {
        integratedTokens.push(token.contractAddress);
        saveIntegratedTokens(integratedTokens);
      }

      // Update status
      const newStatus: BlendIntegrationStatus = {
        isRegistered: true,
        isConfigured: true,
        hasReserve: true,
        canLend: true,
        poolAddress: DEFAULT_POOL_ADDRESS,
      };

      setTokenStatuses(prev => ({
        ...prev,
        [token.contractAddress]: newStatus
      }));

      toast.success(`🎉 ${token.symbol} integrated with Blend successfully!`, {
        id: integrationId,
        duration: 5000,
        action: {
          label: "View Pool →",
          onClick: () => window.open(`/blend?pool=${DEFAULT_POOL_ADDRESS}`, "_blank"),
        },
      });

      console.log(`🔗 [Auto Blend Integration] Integration completed for:`, token.symbol);
      return true;

    } catch (error) {
      console.error(`🔗 [Auto Blend Integration] Integration failed for ${token.symbol}:`, error);
      
      toast.error(`Failed to integrate ${token.symbol} with Blend`, {
        id: integrationId,
        description: error instanceof Error ? error.message : "Unknown error occurred",
      });
      
      return false;
    }
  };

  // Refresh integration statuses for all tokens
  const refreshStatuses = async () => {
    if (!isConnected || rwaTokens.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      console.log(`🔗 [Auto Blend Integration] Refreshing statuses for ${rwaTokens.length} tokens`);
      
      const statusPromises = rwaTokens.map(async (token) => {
        const status = await checkTokenIntegration(token.contractAddress);
        return { tokenAddress: token.contractAddress, status };
      });

      const results = await Promise.allSettled(statusPromises);
      const newStatuses: TokenBlendStatus = {};

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          const { tokenAddress, status } = result.value;
          newStatuses[tokenAddress] = status;
        } else {
          const tokenAddress = rwaTokens[index].contractAddress;
          newStatuses[tokenAddress] = {
            isRegistered: false,
            isConfigured: false,
            hasReserve: false,
            canLend: false,
            error: "Failed to check status",
          };
        }
      });

      setTokenStatuses(newStatuses);
      console.log(`🔗 [Auto Blend Integration] Status refresh completed:`, newStatuses);

    } catch (error) {
      console.error(`🔗 [Auto Blend Integration] Error refreshing statuses:`, error);
      setError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  // Auto-detect and integrate new tokens
  useEffect(() => {
    if (!isConnected || tokensLoading || rwaTokens.length === 0) return;

    const checkForNewTokens = async () => {
      const integratedTokens = getIntegratedTokens();
      const newTokens = rwaTokens.filter(token => 
        token.isUserAdmin && !integratedTokens.includes(token.contractAddress)
      );

      if (newTokens.length > 0) {
        console.log(`🔗 [Auto Blend Integration] Found ${newTokens.length} new tokens to integrate:`, newTokens);
        // Popup removed - users can manually integrate via the dashboard
      }
    };

    // Check for new tokens after a short delay
    const timeoutId = setTimeout(checkForNewTokens, 2000);
    return () => clearTimeout(timeoutId);
  }, [rwaTokens, tokensLoading, isConnected]);

  // Refresh statuses when tokens change
  useEffect(() => {
    if (isConnected && !tokensLoading && rwaTokens.length > 0) {
      refreshStatuses();
    }
  }, [rwaTokens, tokensLoading, isConnected]);

  return {
    tokenStatuses,
    loading: loading || tokensLoading,
    error,
    autoIntegrateToken,
    checkTokenIntegration,
    refreshStatuses,
  };
};
