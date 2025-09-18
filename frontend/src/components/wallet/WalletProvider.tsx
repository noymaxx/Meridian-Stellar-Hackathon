import React, { createContext, useContext, ReactNode } from "react";
import { useAdaptiveWallet, type AdaptiveWalletState, type AdaptiveWalletActions } from "@/hooks/useAdaptiveWallet";
import { FreighterInstallation } from "./FreighterInstallation";

type WalletContextType = AdaptiveWalletState & AdaptiveWalletActions;

const WalletContext = createContext<WalletContextType | undefined>(undefined);

interface WalletProviderProps {
  children: ReactNode;
}

export function WalletProvider({ children }: WalletProviderProps) {
  const wallet = useAdaptiveWallet();

  return (
    <WalletContext.Provider value={wallet}>
      {children}
      
      {/* Freighter Installation Modal - only show for desktop mode */}
      {wallet.walletMode === 'desktop' && (
        <FreighterInstallation
          isOpen={wallet.showInstallModal}
          onClose={wallet.closeInstallModal}
          onRetry={wallet.retryInstallation}
        />
      )}
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