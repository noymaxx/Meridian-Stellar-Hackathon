import { useState, useCallback } from 'react';
import { Client, networks } from '@/lib/stellar/contract';
import { toast } from 'sonner';

export interface UseProviderReturn {
  contract: ((publicKey: string) => Client) | null;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
}

export const useProvider = (): UseProviderReturn => {
  const [contract, setContract] = useState<((publicKey: string) => Client) | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const connect = useCallback(async () => {
    try {
      const id = toast.loading("Connecting to Stellar network...");
      
      // Create contract client
      const contractClient = new Client({
        contractId: networks.testnet.contractId,
        networkPassphrase: networks.testnet.networkPassphrase,
        rpcUrl: "https://soroban-testnet.stellar.org",
      });

      // Create contract function
      const contractFn = (publicKey: string) => contractClient;

      setContract(() => contractFn);
      setIsConnected(true);

      toast.success("Connected to Stellar network!", { id });
    } catch (error) {
      console.error('Provider connection failed:', error);
      toast.error("Failed to connect to Stellar network");
      throw error;
    }
  }, []);

  const disconnect = useCallback(() => {
    setContract(null);
    setIsConnected(false);
    toast.info("Disconnected from Stellar network");
  }, []);

  return {
    contract,
    isConnected,
    connect,
    disconnect,
  };
};