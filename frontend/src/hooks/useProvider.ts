import type { StellarWallet } from "./useWallet";
import { Keypair, Transaction, TransactionBuilder, rpc, Contract, xdr, Address, scValToNative, nativeToScVal } from "@stellar/stellar-sdk";
import { toast } from "sonner";

// Contract IDs for SRWA contracts (UPDATED with CLI working IDs)
const CONTRACT_IDS = {
  tokenFactory: "CAHRDR3I4NT5TVHEOS22UMS7SSHCU3CDTMXGBW4R7FNDEHCO5AZLOCOA", // ✅ CLI Working
  complianceCore: "CDMM3DRN7IRDTBQUHCS5CARLFBLECC4XPPYOTMHERHCVJBSHTTUO75FA", // ✅ CLI Working
  identityRegistry: "CBJSAOFZWWDNWJI5QEFBHYLEIBHXOHN4B5DDI6DJBSYRQ6ROU3YXJ36E", // ✅ CLI Working
  claimTopicsRegistry: "CADQZX6IIPAVVOJ6SVZFGXK374UE5KXDFKBB6VRVVCSFPS2OLTRHS3NT",
  trustedIssuersRegistry: "CDTBD2II6JGXHPDGMFWAQE2SRYXOCENGIE2Z5WHWNM6UG34BX5SQTDRN",
  complianceModules: "CC3PYCRZ5ULYSFYI4L5FFZQL2K6VKVUDKUYXWZEPNFLEWGQ35UDN6QY3",
  integrations: "CC3PXDZGOPJ6PJTRBEWRPFXRHFKJOFTK2CEAACR4KQQT7A6IB6YGUJUY", // ✅ CLI Working
  srwaToken: "CCJGETMTUTETF3QV7EKVE6EIKD45TL2JWYF4VUCCXO3EVPPRRAMPAJ4O", // ✅ CLI Working
  newSrwaToken: "CAWBBZKM4EDKGOECO5TM5XW4QQ72MSXTM6FM74MB5PEI2TWRNZQNN7A4", // ✅ FRESH SRWA TOKEN (NOVO)
};

export interface UseProviderReturn {
  contract: (contractId: string, publicKey?: string) => any;
  sorobanServer: rpc.Server;
  signAndSend: (tx: Transaction, wallet: StellarWallet) => Promise<any>;
  getContractId: (contractName: keyof typeof CONTRACT_IDS) => string;
}

export const useProvider = (): UseProviderReturn => {
  const SOROBAN_RPC_ENDPOINT = "https://soroban-testnet.stellar.org";
  const NETWORK_PASSPHRASE = "Test SDF Network ; September 2015";
  const sorobanServer = new rpc.Server(SOROBAN_RPC_ENDPOINT);

  const contract = (contractId: string, publicKey?: string) => {
    console.log("🔗 [Provider] Creating REAL contract client:", {
      contractId,
      publicKey,
      rpcUrl: SOROBAN_RPC_ENDPOINT
    });

    // Create real Stellar contract instance
    const contractInstance = new Contract(contractId);

    // Helper function to get account info
    const getAccount = async () => {
      if (!publicKey) {
        throw new Error("Public key is required for transaction building");
      }
      return await sorobanServer.getAccount(publicKey);
    };

    return {
      contractId,
      publicKey,
      rpcUrl: SOROBAN_RPC_ENDPOINT,
      networkPassphrase: NETWORK_PASSPHRASE,
      
      // Real contract methods using Stellar SDK
      createToken: async (params: any) => {
        console.log("🔗 [Contract] REAL createToken called with:", params);
        
        try {
          // Convert params to ScVal
          // Check if admin is a secret key and convert to public key
          let adminAddress = params.admin;
          if (params.admin.startsWith('S')) {
            const keypair = Keypair.fromSecret(params.admin);
            adminAddress = keypair.publicKey();
            console.log("🔗 [Contract] Converted secret key to public key:", adminAddress);
          }

          const scValParams = {
            admin: Address.fromString(adminAddress).toScVal(),
            name: nativeToScVal(params.name, { type: "string" }),
            symbol: nativeToScVal(params.symbol, { type: "string" }),
            decimals: nativeToScVal(params.decimals, { type: "u32" }),
            compliance_contract: Address.fromString(params.complianceContract).toScVal(),
          };

          console.log("🔗 [Contract] ScVal Parameters:", scValParams);

          // Create transaction
          const account = await getAccount();
          const tx = new TransactionBuilder(account, {
            fee: "10000000",
            networkPassphrase: NETWORK_PASSPHRASE,
          })
            .addOperation(contractInstance.call("create_token", scValParams.admin, scValParams.name, scValParams.symbol, scValParams.decimals, scValParams.compliance_contract))
            .setTimeout(30)
            .build();

          console.log("🔗 [Contract] Transaction prepared for createToken");
          return tx;
        } catch (error) {
          console.error("🔗 [Contract] Error in createToken:", error);
          throw error;
        }
      },

      initialize: async (params: any) => {
        console.log("🔗 [Contract] REAL initialize called with:", params);
        
        try {
          // Check if admin is a secret key and convert to public key
          let adminAddress = params.admin;
          if (params.admin.startsWith('S')) {
            const keypair = Keypair.fromSecret(params.admin);
            adminAddress = keypair.publicKey();
            console.log("🔗 [Contract] Converted admin secret key to public key:", adminAddress);
          }

          // Check if compliance_contract is a secret key and convert to public key
          let complianceAddress = params.compliance_contract;
          if (params.compliance_contract.startsWith('S')) {
            const keypair = Keypair.fromSecret(params.compliance_contract);
            complianceAddress = keypair.publicKey();
            console.log("🔗 [Contract] Converted compliance_contract secret key to public key:", complianceAddress);
          }

          const scValParams = {
            admin: Address.fromString(adminAddress).toScVal(),
            name: nativeToScVal(params.name, { type: "string" }),
            symbol: nativeToScVal(params.symbol, { type: "string" }),
            decimals: nativeToScVal(params.decimals, { type: "u32" }),
            compliance_contract: Address.fromString(complianceAddress).toScVal(),
          };

          // Get account info for the source account
          const account = await getAccount();
          
          const tx = new TransactionBuilder(account, {
            fee: "10000000",
            networkPassphrase: NETWORK_PASSPHRASE,
          })
            .addOperation(contractInstance.call("initialize", scValParams.admin, scValParams.name, scValParams.symbol, scValParams.decimals, scValParams.compliance_contract))
            .setTimeout(30)
            .build();

          console.log("🔗 [Contract] Transaction prepared for initialize");
          return tx;
        } catch (error) {
          console.error("🔗 [Contract] Error in initialize:", error);
          throw error;
        }
      },

      mint: async (params: any) => {
        console.log("🔗 [Contract] REAL mint called with:", params);
        
        try {
          // Check if to is a secret key and convert to public key
          let toAddress = params.to;
          if (params.to.startsWith('S')) {
            const keypair = Keypair.fromSecret(params.to);
            toAddress = keypair.publicKey();
            console.log("🔗 [Contract] Converted secret key to public key:", toAddress);
          }

          const scValParams = {
            to: Address.fromString(toAddress).toScVal(),
            amount: nativeToScVal(params.amount, { type: "u128" }),
          };

          // Get account info for the source account
          const account = await getAccount();
          
          const tx = new TransactionBuilder(account, {
            fee: "10000000",
            networkPassphrase: NETWORK_PASSPHRASE,
          })
            .addOperation(contractInstance.call("mint", scValParams.to, scValParams.amount))
            .setTimeout(30)
            .build();

          console.log("🔗 [Contract] Transaction prepared for mint");
          return tx;
        } catch (error) {
          console.error("🔗 [Contract] Error in mint:", error);
          throw error;
        }
      },

      set_authorized: async (params: any) => {
        console.log("🔗 [Contract] REAL set_authorized called with:", params);
        
        try {
          // Check if id is a secret key and convert to public key
          let idAddress = params.id;
          if (typeof params.id === 'string' && params.id.startsWith('S')) {
            const keypair = Keypair.fromSecret(params.id);
            idAddress = keypair.publicKey();
            console.log("🔗 [Contract] Converted secret key to public key:", idAddress);
          }

          const scValParams = {
            id: Address.fromString(idAddress).toScVal(),
            authorized: nativeToScVal(!!params.authorized, { type: "bool" }),
          };

          const account = await getAccount();
          const tx = new TransactionBuilder(account, {
            fee: "10000000",
            networkPassphrase: NETWORK_PASSPHRASE,
          })
            .addOperation(contractInstance.call("set_authorized", scValParams.id, scValParams.authorized))
            .setTimeout(30)
            .build();

          console.log("🔗 [Contract] Transaction prepared for set_authorized");
          return tx;
        } catch (error) {
          console.error("🔗 [Contract] Error in set_authorized:", error);
          throw error;
        }
      },

      transfer: async (params: any) => {
        console.log("🔗 [Contract] REAL transfer called with:", params);
        
        try {
          // Check if addresses are secret keys and convert to public keys
          let fromAddress = params.from;
          if (params.from.startsWith('S')) {
            const keypair = Keypair.fromSecret(params.from);
            fromAddress = keypair.publicKey();
            console.log("🔗 [Contract] Converted from secret key to public key:", fromAddress);
          }

          let toAddress = params.to;
          if (params.to.startsWith('S')) {
            const keypair = Keypair.fromSecret(params.to);
            toAddress = keypair.publicKey();
            console.log("🔗 [Contract] Converted to secret key to public key:", toAddress);
          }

          const scValParams = {
            from: Address.fromString(fromAddress).toScVal(),
            to: Address.fromString(toAddress).toScVal(),
            amount: nativeToScVal(params.amount, { type: "u128" }),
          };

          const account = await getAccount();
          const tx = new TransactionBuilder(account, {
            fee: "10000000",
            networkPassphrase: NETWORK_PASSPHRASE,
          })
            .addOperation(contractInstance.call("transfer", scValParams.from, scValParams.to, scValParams.amount))
            .setTimeout(30)
            .build();

          console.log("🔗 [Contract] Transaction prepared for transfer");
          return tx;
        } catch (error) {
          console.error("🔗 [Contract] Error in transfer:", error);
          throw error;
        }
      },

      balance: async (params: any) => {
        console.log("🔗 [Contract] REAL balance called with:", params);
        
        try {
          // Check if id is a secret key and convert to public key
          let idAddress = params.id;
          if (params.id.startsWith('S')) {
            const keypair = Keypair.fromSecret(params.id);
            idAddress = keypair.publicKey();
            console.log("🔗 [Contract] Converted id secret key to public key:", idAddress);
          }

          const scValParams = {
            id: Address.fromString(idAddress).toScVal(),
          };

          const account = await getAccount();
          const result = await sorobanServer.simulateTransaction(
            new TransactionBuilder(account, {
              fee: "10000000",
              networkPassphrase: NETWORK_PASSPHRASE,
            })
              .addOperation(contractInstance.call("balance", scValParams.id))
              .setTimeout(30)
              .build()
          );

          console.log("🔗 [Contract] balance simulation result:", result);
          return result;
        } catch (error) {
          console.error("🔗 [Contract] Error in balance:", error);
          throw error;
        }
      },

      addClaim: async (params: any) => {
        console.log("🔗 [Contract] REAL addClaim called with:", params);
        
        try {
          // Check if addresses are secret keys and convert to public keys
          let subjectAddress = params.subject;
          if (params.subject.startsWith('S')) {
            const keypair = Keypair.fromSecret(params.subject);
            subjectAddress = keypair.publicKey();
            console.log("🔗 [Contract] Converted subject secret key to public key:", subjectAddress);
          }

          let issuerAddress = params.issuer;
          if (params.issuer.startsWith('S')) {
            const keypair = Keypair.fromSecret(params.issuer);
            issuerAddress = keypair.publicKey();
            console.log("🔗 [Contract] Converted issuer secret key to public key:", issuerAddress);
          }

          const scValParams = {
            subject: Address.fromString(subjectAddress).toScVal(),
            issuer: Address.fromString(issuerAddress).toScVal(),
            topicId: nativeToScVal(params.topicId, { type: "u32" }),
            data: nativeToScVal(params.data, { type: "string" }),
            validUntil: nativeToScVal(params.validUntil, { type: "u64" }),
          };

          const account = await getAccount();
          const tx = new TransactionBuilder(account, {
            fee: "10000000",
            networkPassphrase: NETWORK_PASSPHRASE,
          })
            .addOperation(contractInstance.call("add_claim", scValParams.subject, scValParams.issuer, scValParams.topicId, scValParams.data, scValParams.validUntil))
            .setTimeout(30)
            .build();

          console.log("🔗 [Contract] Transaction prepared for addClaim");
          return tx;
        } catch (error) {
          console.error("🔗 [Contract] Error in addClaim:", error);
          throw error;
        }
      },

      addClaimTopic: async (params: any) => {
        console.log("🔗 [Contract] REAL addClaimTopic called with:", params);
        
        try {
          const scValParams = {
            topicId: nativeToScVal(params.topicId, { type: "u32" }),
            topicName: nativeToScVal(params.topicName, { type: "string" }),
          };

          const account = await getAccount();
          const tx = new TransactionBuilder(account, {
            fee: "10000000",
            networkPassphrase: NETWORK_PASSPHRASE,
          })
            .addOperation(contractInstance.call("add_claim_topic", scValParams.topicId, scValParams.topicName))
            .setTimeout(30)
            .build();

          console.log("🔗 [Contract] Transaction prepared for addClaimTopic");
          return tx;
        } catch (error) {
          console.error("🔗 [Contract] Error in addClaimTopic:", error);
          throw error;
        }
      },

      addTrustedIssuer: async (params: any) => {
        console.log("🔗 [Contract] REAL addTrustedIssuer called with:", params);
        
        try {
          // Check if issuer is a secret key and convert to public key
          let issuerAddress = params.issuer;
          if (params.issuer.startsWith('S')) {
            const keypair = Keypair.fromSecret(params.issuer);
            issuerAddress = keypair.publicKey();
            console.log("🔗 [Contract] Converted issuer secret key to public key:", issuerAddress);
          }

          const scValParams = {
            issuer: Address.fromString(issuerAddress).toScVal(),
            topicId: nativeToScVal(params.topicId, { type: "u32" }),
          };

          const account = await getAccount();
          const tx = new TransactionBuilder(account, {
            fee: "10000000",
            networkPassphrase: NETWORK_PASSPHRASE,
          })
            .addOperation(contractInstance.call("add_trusted_issuer", scValParams.issuer, scValParams.topicId))
            .setTimeout(30)
            .build();

          console.log("🔗 [Contract] Transaction prepared for addTrustedIssuer");
          return tx;
        } catch (error) {
          console.error("🔗 [Contract] Error in addTrustedIssuer:", error);
          throw error;
        }
      },

      bindToken: async (params: any) => {
        console.log("🔗 [Contract] REAL bindToken called with:", params);
        
        try {
          const scValParams = {
            token: Address.fromString(params.token).toScVal(),
          };

          const account = await getAccount();
          const tx = new TransactionBuilder(account, {
            fee: "10000000",
            networkPassphrase: NETWORK_PASSPHRASE,
          })
            .addOperation(contractInstance.call("bind_token", scValParams.token))
            .setTimeout(30)
            .build();

          console.log("🔗 [Contract] Transaction prepared for bindToken");
          return tx;
        } catch (error) {
          console.error("🔗 [Contract] Error in bindToken:", error);
          throw error;
        }
      },

      // Blend Integration Methods
      canSupplyCollateral: async (params: any) => {
        console.log("🔗 [Contract] REAL canSupplyCollateral called with:", params);
        
        try {
          const scValParams = {
            user: Address.fromString(params.user).toScVal(),
            srwa_token: Address.fromString(params.srwa_token).toScVal(),
            amount: nativeToScVal(params.amount, { type: "u128" }),
          };

          const account = await getAccount();
          const tx = new TransactionBuilder(account, {
            fee: "10000000",
            networkPassphrase: NETWORK_PASSPHRASE,
          })
            .addOperation(contractInstance.call("can_supply_collateral", scValParams.user, scValParams.srwa_token, scValParams.amount))
            .setTimeout(30)
            .build();

          console.log("🔗 [Contract] Transaction prepared for canSupplyCollateral");
          return tx;
        } catch (error) {
          console.error("🔗 [Contract] Error in canSupplyCollateral:", error);
          throw error;
        }
      },

      canBorrowAgainstSrwa: async (params: any) => {
        console.log("🔗 [Contract] REAL canBorrowAgainstSrwa called with:", params);
        
        try {
          const scValParams = {
            user: Address.fromString(params.user).toScVal(),
            srwa_token: Address.fromString(params.srwa_token).toScVal(),
            collateral_amount: nativeToScVal(params.collateral_amount, { type: "u128" }),
            borrow_amount: nativeToScVal(params.borrow_amount, { type: "u128" }),
          };

          const account = await getAccount();
          const tx = new TransactionBuilder(account, {
            fee: "10000000",
            networkPassphrase: NETWORK_PASSPHRASE,
          })
            .addOperation(contractInstance.call("can_borrow_against_srwa", scValParams.user, scValParams.srwa_token, scValParams.collateral_amount, scValParams.borrow_amount))
            .setTimeout(30)
            .build();

          console.log("🔗 [Contract] Transaction prepared for canBorrowAgainstSrwa");
          return tx;
        } catch (error) {
          console.error("🔗 [Contract] Error in canBorrowAgainstSrwa:", error);
          throw error;
        }
      }
    };
  };

  const signAndSend = async (tx: Transaction, wallet: StellarWallet) => {
    console.log("🔗 [Provider] Signing and sending REAL transaction:", {
      publicKey: wallet.publicKey,
      operationCount: tx.operations.length
    });

    const keypair = Keypair.fromSecret(wallet.secretKey);
    
    console.log("🔗 [Provider] Signing transaction");
    tx.sign(keypair);

    const result = await sorobanServer.sendTransaction(tx);
    console.log("🔗 [Provider] Send transaction result:", result);

    let status = result.status as string;
    while (status === "PENDING") {
      const txResult = await sorobanServer.getTransaction(result.hash);
      status = txResult.status as string;
      console.log("🔗 [Provider] Transaction status:", status);
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log("🔗 [Provider] Transaction completed:", result.hash);
    return result.hash;
  };

  const getContractId = (contractName: keyof typeof CONTRACT_IDS) => {
    return CONTRACT_IDS[contractName];
  };

  return { contract, sorobanServer, signAndSend, getContractId };
};
