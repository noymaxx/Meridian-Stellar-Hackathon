import React, { createContext, useContext, ReactNode } from "react";
import { useStellarWallet, WalletState, WalletActions } from "@/hooks/useStellarWallet";
import { FreighterInstallation } from "./FreighterInstallation";

type WalletContextType = WalletState & WalletActions;

const WalletContext = createContext<WalletContextType | undefined>(undefined);

interface WalletProviderProps {
  children: ReactNode;
}

export function WalletProvider({ children }: WalletProviderProps) {
  const wallet = useStellarWallet();

  return (
    <WalletContext.Provider value={wallet}>
      {children}
      
      {/* Freighter Installation Modal */}
      <FreighterInstallation
        isOpen={wallet.showInstallModal}
        onClose={wallet.closeInstallModal}
        onRetry={wallet.retryInstallation}
      />
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}