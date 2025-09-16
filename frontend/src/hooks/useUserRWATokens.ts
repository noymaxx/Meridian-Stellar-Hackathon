import { useState, useEffect } from "react";
import { useWallet } from "@/components/wallet/WalletProvider";
import { useProvider } from "./useProvider";
import { scValToNative } from "@stellar/stellar-sdk";

export interface RWAToken {
  contractAddress: string;
  name: string;
  symbol: string;
  decimals: number;
  balance: string;
  admin: string;
  isUserAdmin: boolean;
  complianceContract: string;
  totalSupply: string;
  lastUpdated: Date;
}

export interface UseUserRWATokensReturn {
  tokens: RWAToken[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useUserRWATokens = (): UseUserRWATokensReturn => {
  const [tokens, setTokens] = useState<RWAToken[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { address, isConnected } = useWallet();
  const { contract, sorobanServer, getContractId } = useProvider();

  const fetchTokenData = async (contractAddress: string): Promise<RWAToken | null> => {
    try {
      console.log(`🔗 [useUserRWATokens] Fetching data for token:`, contractAddress);
      
      // All tokens must be real contract addresses
      if (!contractAddress || contractAddress.length !== 56 || !contractAddress.startsWith('C')) {
        console.log(`🔗 [useUserRWATokens] Invalid contract address format:`, contractAddress);
        return null;
      }
      
      const tokenContract = contract(contractAddress, address);
      
      // Get token metadata
      const [nameResult, symbolResult, decimalsResult, adminResult, totalSupplyResult] = await Promise.allSettled([
        sorobanServer.simulateTransaction(
          new (await import("@stellar/stellar-sdk")).TransactionBuilder(await sorobanServer.getAccount(address!), {
            fee: "10000000",
            networkPassphrase: "Test SDF Network ; September 2015",
          })
            .addOperation(new (await import("@stellar/stellar-sdk")).Contract(contractAddress).call("name"))
            .setTimeout(30)
            .build()
        ),
        sorobanServer.simulateTransaction(
          new (await import("@stellar/stellar-sdk")).TransactionBuilder(await sorobanServer.getAccount(address!), {
            fee: "10000000",
            networkPassphrase: "Test SDF Network ; September 2015",
          })
            .addOperation(new (await import("@stellar/stellar-sdk")).Contract(contractAddress).call("symbol"))
            .setTimeout(30)
            .build()
        ),
        sorobanServer.simulateTransaction(
          new (await import("@stellar/stellar-sdk")).TransactionBuilder(await sorobanServer.getAccount(address!), {
            fee: "10000000",
            networkPassphrase: "Test SDF Network ; September 2015",
          })
            .addOperation(new (await import("@stellar/stellar-sdk")).Contract(contractAddress).call("decimals"))
            .setTimeout(30)
            .build()
        ),
        sorobanServer.simulateTransaction(
          new (await import("@stellar/stellar-sdk")).TransactionBuilder(await sorobanServer.getAccount(address!), {
            fee: "10000000",
            networkPassphrase: "Test SDF Network ; September 2015",
          })
            .addOperation(new (await import("@stellar/stellar-sdk")).Contract(contractAddress).call("admin"))
            .setTimeout(30)
            .build()
        ),
        sorobanServer.simulateTransaction(
          new (await import("@stellar/stellar-sdk")).TransactionBuilder(await sorobanServer.getAccount(address!), {
            fee: "10000000",
            networkPassphrase: "Test SDF Network ; September 2015",
          })
            .addOperation(new (await import("@stellar/stellar-sdk")).Contract(contractAddress).call("total_supply"))
            .setTimeout(30)
            .build()
        ),
      ]);

      // Get user balance
      const balanceResult = await sorobanServer.simulateTransaction(
        new (await import("@stellar/stellar-sdk")).TransactionBuilder(await sorobanServer.getAccount(address!), {
          fee: "10000000",
          networkPassphrase: "Test SDF Network ; September 2015",
        })
          .addOperation(new (await import("@stellar/stellar-sdk")).Contract(contractAddress).call("balance", 
            (await import("@stellar/stellar-sdk")).Address.fromString(address!).toScVal()))
          .setTimeout(30)
          .build()
      );

      // Extract values safely
      const name = nameResult.status === 'fulfilled' && nameResult.value.result && 
        nameResult.value.result.retval ? scValToNative(nameResult.value.result.retval) : "Unknown Token";
      
      const symbol = symbolResult.status === 'fulfilled' && symbolResult.value.result && 
        symbolResult.value.result.retval ? scValToNative(symbolResult.value.result.retval) : "UNK";
      
      const decimals = decimalsResult.status === 'fulfilled' && decimalsResult.value.result && 
        decimalsResult.value.result.retval ? scValToNative(decimalsResult.value.result.retval) : 7;
      
      const admin = adminResult.status === 'fulfilled' && adminResult.value.result && 
        adminResult.value.result.retval ? scValToNative(adminResult.value.result.retval) : "";
      
      const totalSupply = totalSupplyResult.status === 'fulfilled' && totalSupplyResult.value.result && 
        totalSupplyResult.value.result.retval ? scValToNative(totalSupplyResult.value.result.retval) : "0";
      
      const balance = balanceResult.result && balanceResult.result.retval ? 
        scValToNative(balanceResult.result.retval) : "0";

      const token: RWAToken = {
        contractAddress,
        name: String(name),
        symbol: String(symbol),
        decimals: Number(decimals),
        balance: String(balance),
        admin: String(admin),
        isUserAdmin: String(admin) === address,
        complianceContract: getContractId("complianceCore"),
        totalSupply: String(totalSupply),
        lastUpdated: new Date(),
      };

      console.log(`🔗 [useUserRWATokens] Token data retrieved:`, token);
      return token;

    } catch (error) {
      console.error(`🔗 [useUserRWATokens] Error fetching token data for ${contractAddress}:`, error);
      return null;
    }
  };

  const fetchUserTokens = async () => {
    if (!address || !isConnected) {
      setTokens([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log("🔗 [useUserRWATokens] Fetching user RWA tokens for:", address);

      // Get all known SRWA token addresses
      const knownTokenAddresses = [
        getContractId("srwaToken"),       // Original token
        getContractId("newSrwaToken"),    // New token where user is admin
      ];

      // Also check localStorage for user-created tokens
      const userCreatedTokens = JSON.parse(localStorage.getItem(`userTokens_${address}`) || '[]');
      console.log("🔗 [useUserRWATokens] User-created tokens from localStorage:", userCreatedTokens);
      
      // Combine known tokens with user-created tokens
      const allTokenAddresses = [...knownTokenAddresses, ...userCreatedTokens];

      // Fetch data for all tokens (known + user-created)
      const tokenDataPromises = allTokenAddresses.map(addr => fetchTokenData(addr));
      const tokenResults = await Promise.all(tokenDataPromises);

      // Filter out null results and tokens with zero balance (unless user is admin)
      const validTokens = tokenResults.filter((token): token is RWAToken => 
        token !== null && (
          parseFloat(token.balance) > 0 || 
          token.isUserAdmin ||
          token.admin === address
        )
      );

      console.log("🔗 [useUserRWATokens] Valid tokens found:", validTokens.length);
      setTokens(validTokens);

    } catch (err) {
      console.error("🔗 [useUserRWATokens] Error fetching user tokens:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch RWA tokens");
    } finally {
      setLoading(false);
    }
  };

  const refetch = async () => {
    await fetchUserTokens();
  };

  useEffect(() => {
    fetchUserTokens();
  }, [address, isConnected]);

  return { tokens, loading, error, refetch };
};
