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

      // Get all known SRWA token addresses including the ultra mega pool
      const basicTokenAddresses = [
        getContractId("srwaToken"),       // Original token
        getContractId("newSrwaToken"),    // New token where user is admin
        getContractId("freshSrwaToken"),  // Fresh token pool
      ];
      
      // Get all mega token addresses for complete token discovery
      const megaTokenAddresses = [
        
        // 🌟 NOVA MEGA POOL - 20 CONTRATOS ULTRA FRESCOS (RECÉM CRIADOS)
        "CBQEAJ6YTZTX4EBY5TBKCETA3TOGQCMUFSOZ6NVRMOBTNKRYYAGJKGRH", // Mega Fresh #1
        "CA6HELVSPPTCWKXSPKZCDMBKCBAYPUBVFTZWVIC2IKLRSQP6OANLYQIS", // Mega Fresh #2
        "CBKMALAF23EDOX2YSDUR6GON6EE2WSUA4V237Z6BVXQIME2X24TIJ62C", // Mega Fresh #3
        "CAJWCLXCF2Y3A5H2R2PNLLVHYQDWKJ6DQPKGR5TGDIVTOVZEZ5DUMP55", // Mega Fresh #4
        "CANCQ47MAJRLX6L76QIEK3KXQ7XFJRUVZ75ACEXTPMJQNR76ZVE4QTYQ", // Mega Fresh #5
        "CBEZFX7ZKNBLCTJSYHRJ6FVE3WTSRIXUHPRDUZKQH37QZJPNZUDLVFSG", // Mega Fresh #6
        "CBDPZ6MW37WIQKP2BSUMSWTDERIPE477B3RIKQ4BS76GXONSFB5O3D6P", // Mega Fresh #7
        "CB7QC7CMYXTCKZYSTZVNPEFEZPCXOE73E2NVWOGVRUA34XCX4OS7YOGP", // Mega Fresh #8
        "CCTVTRMCYGEXYZIG4FSUMFBIBOQZTGWEM5D44KYANHQXKTOJZY7BDLAF", // Mega Fresh #9
        "CAH5I6LB4P2IPPMESGL67MEBZQCDMCHBNXX3DDXSYSQUJXFAYDWUQAGI", // Mega Fresh #10
        "CBBFZ54XFA4RYYCBXHGKPNO42ZTF5RY2LMR534TULNLLQ2TEDWDXCU3Z", // Mega Fresh #11
        "CCCV76SNPI7MDWFLLWNMU444MLE54TYF7AUACPMGSB54P6IKRDUUGLK6", // Mega Fresh #12
        "CDDNOVH74H5QZSAIJ2ECWXPYMEET4VNUHGJBHZGXL2MEUVXQH63FEBKV", // Mega Fresh #13
        "CCWE3DYNE5OJPLV5OKIEVXTDPAF7AJLYH75DMKNER6GDJGYIZZDOBXMT", // Mega Fresh #14
        "CALC77XGYL3VNXJ2R2O4BNKML772RF7V2QFZBGU475Z6LFUFPZ4IZ3EB", // Mega Fresh #15
        "CAH4OSIHWO2ZW76VOSWQFR7Y3YOO2UT24SOS2Q2KCUX25I47WTTRVVMZ", // Mega Fresh #16
        "CCZCSFJRYEEVPNKS37ZD5LN4O6SL3OU4ABZZHW4ZELN7U3NZ54R3EOAI", // Mega Fresh #17
        "CBAXPVFADKRXWW2IU7PMKTTXALVBYTRZOZIOQFMCHQNC7PJHVKIMB7AO", // Mega Fresh #18
        "CCLHJECTBWGIG3RA3G2SRKXSORAHNVAPJEFL5W3EI5O457AKLRSDPN4X", // Mega Fresh #19
        "CCYFQTM52CITNHJUMHFVEMHGLR7K4MZJIUET7RWD4KNFMHFDLEOBCFSW", // Mega Fresh #20
        
        // 🚀 ULTRA FRESH POOL - 10 CONTRATOS
        "CBK753TZL5HZ3UXLEKPHM6T4V3FRQPHXYM27UATV37HCATAYFJTK7EN6", // Ultra Fresh #1
        "CDG3INTAIUBWS5DND4YJ5RJTSGYUODLIEFLCSRKDHQTYCHBF2SCI3Y2J", // Ultra Fresh #2
        "CCAAFZZ36DFL7Q5D72KEVPGW55HQZOS7IVE7O6BR3H7VBD3ZTPRKMPB6", // Ultra Fresh #3
        "CBNLQ55QPHJK2A5FIW5DEROFZYTCGWU7GLVQCTDZQSPWVXCBZRHAIU25", // Ultra Fresh #4
        "CDDOYBUABFNJ3TAGPGOPD4Q6A6PVGKGIEWS7I3NQO2NDPJQSGK3L2WUM", // Ultra Fresh #5
        "CBLZLWKNMNKVQ6VGJJCANYJEDWBGNRRRTQHYX2DDNGYDXBFSPPUP752I", // Ultra Fresh #6
        "CBOTB2MOOWLHVZSFNPZK5KLDYTASARVM6EHU4L27TVDUK4COOEGJOWDT", // Ultra Fresh #7
        "CCJOJSI274G4CK4YBLHAF5QAG265VQUSHUURJNEKSHC6SF43A4N3CRVI", // Ultra Fresh #8
        "CC6IMLBNHXBAQPOHB5TMX4LWH73TMLG5JIUDPROW27L4K7LDIGUCCIDV", // Ultra Fresh #9
        "CBNEPABRJ3HGCIQ4GUX257DPCXMWJOZZMTPUWBKX7CEOK5NB3ODXRH4V", // Ultra Fresh #10
        
        // 🆕 BATCH ANTERIOR
        "CDAAQ2B2LPFBP6TQEIZ7F3HXWBQE5ZUGIJXW627ZAOO7CZ723UEL5CVB", // Fresh Batch 1
        "CBFZHDNWYWUM4UU5BMU4ZU2LZSUOM5A7BJ3PCLZQ65VRNFKAAC57RCHH", // Fresh Batch 2
        "CDNDKCVL66XCE2546Z3YL3M5ATQMY4XEMCUZBKDI7ZVGDXNJXQEGFTRR", // Fresh Batch 3
        "CBISQVJZE7G4OPH566X7XTI2AEKEMKALU3VPQKR47WXAXI2YLOHFYWIY", // MEU TOKEN NOVO
      ];
      
      // Combine all known token addresses (basic + mega pools)
      const knownTokenAddresses = [...basicTokenAddresses, ...megaTokenAddresses].filter(Boolean);
      
      console.log("🔍 [useUserRWATokens] Complete token search enabled:", {
        basic: basicTokenAddresses.length,
        mega: megaTokenAddresses.length,
        total: knownTokenAddresses.length
      });

      // Use only network-discovered tokens (no localStorage dependency)
      const allTokenAddresses = knownTokenAddresses;
      console.log("🔍 [useUserRWATokens] Searching tokens directly from network:", allTokenAddresses.length);

      // Fetch data for all tokens (known + user-created)
      const tokenDataPromises = allTokenAddresses.map(addr => fetchTokenData(addr));
      const tokenResults = await Promise.all(tokenDataPromises);

      // Filter out null results and organize tokens
      const allValidTokens = tokenResults.filter((token): token is RWAToken => token !== null);
      
      // Separate user-created tokens (where user is admin) from tokens where user has balance
      const userCreatedTokensOnly = allValidTokens.filter(token => token.isUserAdmin || token.admin === address);
      const userBalanceTokens = allValidTokens.filter(token => 
        parseFloat(token.balance) > 0 && !userCreatedTokensOnly.some(ct => ct.contractAddress === token.contractAddress)
      );
      
      // Combine user-created tokens first, then balance tokens
      const validTokens = [...userCreatedTokensOnly, ...userBalanceTokens];
      
      console.log("🔗 [useUserRWATokens] Token breakdown:", {
        userCreated: userCreatedTokensOnly.length,
        withBalance: userBalanceTokens.length,
        total: validTokens.length
      });

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
