import { Keypair } from "@stellar/stellar-sdk";
import { useState } from "react";
import { toast } from "sonner";

export interface StellarWallet {
  publicKey: string;
  secretKey: string;
}

export interface UseWalletReturn {
  isLoading: boolean;
  disconnect: () => void;
  connect: () => Promise<void>;
  isConnected: boolean;
  wallet: StellarWallet | null;
}

export const useWallet = (): UseWalletReturn => {
  const WALLET_STORAGE_KEY = "stellar_wallet";
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [wallet, setWallet] = useState<StellarWallet | null>(null);

  const saveWalletToStorage = (wallet: StellarWallet) => {
    try {
      localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(wallet));
    } catch (error) {
      console.error("Error saving wallet to storage:", error);
      throw new Error("Failed to save wallet to storage");
    }
  };

  const getWalletFromStorage = () => {
    try {
      const walletData = localStorage.getItem(WALLET_STORAGE_KEY);
      if (!walletData) {
        return null;
      }
      return JSON.parse(walletData) as StellarWallet;
    } catch (error) {
      console.error("Error getting wallet from storage:", error);
      return null;
    }
  };

  const clearWalletFromStorage = () => {
    try {
      localStorage.removeItem(WALLET_STORAGE_KEY);
    } catch (error) {
      console.error("Error clearing wallet from storage:", error);
    }
  };

  const createKeypair = () => {
    if (getWalletFromStorage()) {
      return getWalletFromStorage();
    } else {
      const keypair = Keypair.random();
      const wallet = {
        publicKey: keypair.publicKey(),
        secretKey: keypair.secret(),
      };
      saveWalletToStorage(wallet);
      return wallet;
    }
  };

  const getFaucet = async (publicKey: string) => {
    const result = await fetch(
      `https://horizon-testnet.stellar.org/friendbot?addr=${publicKey}`
    );

    console.log("🔗 [Wallet] Faucet result:", result);
  };

  const createWallet = async () => {
    const wallet = createKeypair();
    await getFaucet(wallet!!.publicKey);
    return wallet;
  };

  const connect = async () => {
    setIsLoading(true);
    const id = toast.loading("Connecting...");
    try {
      console.log("🔗 [Wallet] Connecting to Stellar wallet...");
      const wallet = await createWallet();
      setWallet(wallet);
      setIsConnected(true);
      console.log("🔗 [Wallet] Connected successfully:", wallet.publicKey);
      toast.success("Connected successfully!", { id });
    } catch (err) {
      console.error("🔗 [Wallet] Connection failed:", err);
      setIsConnected(false);
      toast.error("Failed to connect", { id });
    } finally {
      setIsLoading(false);
    }
  };

  const disconnect = () => {
    console.log("🔗 [Wallet] Disconnecting...");
    clearWalletFromStorage();
    setIsConnected(false);
    setWallet(null);
    toast.info("Disconnected!");
  };

  return {
    wallet,
    isLoading,
    disconnect,
    connect,
    isConnected,
  };
};
