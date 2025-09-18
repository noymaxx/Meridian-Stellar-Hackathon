import { useState, useCallback, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { useMobileDetection } from "./useMobileDetection";
import { MobileWallet, type MobileWalletInfo } from "@/lib/wallet/mobile-wallet";
import { useStellarWallet } from "./useStellarWallet";
import { TransactionBuilder } from '@stellar/stellar-sdk';

export type WalletMode = 'desktop' | 'mobile' | 'tablet';
export type WalletProvider = 'freighter' | 'mobile' | 'none';

export interface AdaptiveWalletState {
  // Connection state
  isConnected: boolean;
  address: string | null;
  isConnecting: boolean;
  
  // Device & wallet info
  walletMode: WalletMode;
  walletProvider: WalletProvider;
  deviceInfo: {
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
    deviceType: string;
  };
  
  // Mobile wallet specific
  mobileWalletInfo: MobileWalletInfo | null;
  hasMobileWallet: boolean;
  
  // Desktop wallet specific (Freighter)
  isFreighterInstalled: boolean;
  showInstallModal: boolean;
  
  // Shared properties
  network: string;
  balance?: string;
  error: string | null;
}

export interface AdaptiveWalletActions {
  // Connection management
  connect: () => Promise<void>;
  disconnect: () => void;
  
  // Transaction signing
  signTransaction: (xdr: string) => Promise<string>;
  
  // Balance management
  getBalance: () => Promise<string | undefined>;
  refreshBalance: () => Promise<void>;
  
  // Mobile wallet specific
  exportMobileWallet: () => string | null;
  importMobileWallet: (secretKey: string) => boolean;
  generateBackupQR: () => string | null;
  
  // Desktop wallet specific
  checkFreighterInstallation: () => boolean;
  closeInstallModal: () => void;
  retryInstallation: () => void;
  
  // Utility
  switchToDesktopMode: () => void;
  switchToMobileMode: () => void;
  
  // Debug functions
  forceMobileMode: () => void;
  getDebugInfo: () => any;
}

export function useAdaptiveWallet(): AdaptiveWalletState & AdaptiveWalletActions {
  const deviceDetection = useMobileDetection();
  const desktopWallet = useStellarWallet();
  
  // Local state
  const [walletMode, setWalletMode] = useState<WalletMode>('desktop');
  const [walletProvider, setWalletProvider] = useState<WalletProvider>('none');
  const [mobileWalletInfo, setMobileWalletInfo] = useState<MobileWalletInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  
  // Determine wallet mode based on device
  useEffect(() => {
    console.log('🔍 [AdaptiveWallet] Device detection result:', {
      isMobile: deviceDetection.isMobile,
      isTablet: deviceDetection.isTablet,
      isDesktop: deviceDetection.isDesktop,
      deviceType: deviceDetection.deviceType,
      screenWidth: deviceDetection.screenWidth,
      userAgent: navigator.userAgent.slice(0, 50) + '...'
    });
    
    if (deviceDetection.isMobile) {
      setWalletMode('mobile');
      console.log('📱 [AdaptiveWallet] Set to MOBILE mode');
    } else if (deviceDetection.isTablet) {
      setWalletMode('tablet'); // Tablets can use either mode
      console.log('📱 [AdaptiveWallet] Set to TABLET mode');
    } else {
      setWalletMode('desktop');
      console.log('💻 [AdaptiveWallet] Set to DESKTOP mode');
    }
  }, [deviceDetection]);
  
  // Check for existing mobile wallet
  useEffect(() => {
    if (walletMode === 'mobile' || walletMode === 'tablet') {
      const info = MobileWallet.getWalletInfo();
      setMobileWalletInfo(info);
      
      if (info) {
        setWalletProvider('mobile');
        console.log('📱 [AdaptiveWallet] Existing mobile wallet found:', info.address.slice(0, 8) + '...');
      }
    }
  }, [walletMode]);
  
  // Connect function - adaptive based on device
  const connect = useCallback(async () => {
    setIsConnecting(true);
    setError(null);
    
    console.log('🔍 [AdaptiveWallet] Connect called with:', {
      walletMode,
      walletProvider,
      deviceType: deviceDetection.deviceType,
      isMobile: deviceDetection.isMobile,
      isTablet: deviceDetection.isTablet,
      isDesktop: deviceDetection.isDesktop
    });
    
    try {
      if (walletMode === 'mobile' || (walletMode === 'tablet' && walletProvider === 'mobile')) {
        // Mobile wallet connection
        console.log('📱 [AdaptiveWallet] Connecting mobile wallet...');
        
        const address = await MobileWallet.getAddress();
        console.log('📱 [AdaptiveWallet] Mobile wallet address result:', address ? 'SUCCESS' : 'FAILED');
        
        if (!address) {
          throw new Error('Failed to generate mobile wallet');
        }
        
        const info = MobileWallet.getWalletInfo();
        setMobileWalletInfo(info);
        setWalletProvider('mobile');
        
        toast({
          title: "📱 Mobile Wallet Connected",
          description: `Address: ${address.slice(0, 8)}...${address.slice(-8)}`,
        });
        
        console.log('✅ [AdaptiveWallet] Mobile wallet connected:', address.slice(0, 8) + '...');
        
      } else {
        // Desktop wallet connection (Freighter)
        console.log('💻 [AdaptiveWallet] Connecting Freighter wallet...');
        
        await desktopWallet.connect();
        setWalletProvider('freighter');
        
        console.log('✅ [AdaptiveWallet] Freighter wallet connected');
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection failed';
      setError(errorMessage);
      
      console.error('❌ [AdaptiveWallet] Connection failed:', error);
      
      toast({
        title: "Connection Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  }, [walletMode, walletProvider, desktopWallet]);
  
  // Disconnect function
  const disconnect = useCallback(() => {
    try {
      if (walletProvider === 'mobile') {
        MobileWallet.clearWallet();
        setMobileWalletInfo(null);
        
        toast({
          title: "📱 Mobile Wallet Disconnected",
          description: "Wallet has been cleared from this device",
        });
        
      } else if (walletProvider === 'freighter') {
        desktopWallet.disconnect();
      }
      
      setWalletProvider('none');
      setError(null);
      
      console.log('👋 [AdaptiveWallet] Wallet disconnected');
      
    } catch (error) {
      console.error('❌ [AdaptiveWallet] Disconnect error:', error);
    }
  }, [walletProvider, desktopWallet]);
  
  // Sign transaction - adaptive
  const signTransaction = useCallback(async (xdr: string): Promise<string> => {
    try {
      if (walletProvider === 'mobile') {
        console.log('📱 [AdaptiveWallet] Signing with mobile wallet...');
        
        // Parse XDR and sign with mobile wallet
        const transaction = TransactionBuilder.fromXDR(xdr, 'Test SDF Network ; September 2015');
        
        const signedTx = await MobileWallet.signTransaction(transaction);
        return signedTx.toXDR();
        
      } else if (walletProvider === 'freighter') {
        console.log('💻 [AdaptiveWallet] Signing with Freighter...');
        return await desktopWallet.signTransaction(xdr);
        
      } else {
        throw new Error('No wallet connected');
      }
      
    } catch (error) {
      console.error('❌ [AdaptiveWallet] Transaction signing failed:', error);
      throw error;
    }
  }, [walletProvider, desktopWallet]);
  
  // Mobile wallet specific functions
  const exportMobileWallet = useCallback(() => {
    return MobileWallet.exportWallet();
  }, []);
  
  const importMobileWallet = useCallback((secretKey: string) => {
    const success = MobileWallet.importWallet(secretKey);
    if (success) {
      const info = MobileWallet.getWalletInfo();
      setMobileWalletInfo(info);
      setWalletProvider('mobile');
    }
    return success;
  }, []);
  
  const generateBackupQR = useCallback(() => {
    return MobileWallet.generateBackupQR();
  }, []);
  
  // Mode switching
  const switchToMobileMode = useCallback(() => {
    if (walletProvider === 'freighter') {
      desktopWallet.disconnect();
    }
    setWalletMode('mobile');
    setWalletProvider('none');
  }, [walletProvider, desktopWallet]);
  
  const switchToDesktopMode = useCallback(() => {
    if (walletProvider === 'mobile') {
      // Don't clear mobile wallet, just switch mode
      setWalletProvider('none');
    }
    setWalletMode('desktop');
  }, [walletProvider]);
  
  // Computed state
  const isConnected = walletProvider === 'mobile' ? !!mobileWalletInfo : desktopWallet.isConnected;
  const address = walletProvider === 'mobile' ? mobileWalletInfo?.address || null : desktopWallet.address;
  const hasMobileWallet = MobileWallet.hasWallet();
  
  return {
    // Connection state
    isConnected,
    address,
    isConnecting: isConnecting || desktopWallet.isConnecting,
    
    // Device & wallet info
    walletMode,
    walletProvider,
    deviceInfo: {
      isMobile: deviceDetection.isMobile,
      isTablet: deviceDetection.isTablet,
      isDesktop: deviceDetection.isDesktop,
      deviceType: deviceDetection.deviceType
    },
    
    // Mobile wallet specific
    mobileWalletInfo,
    hasMobileWallet,
    
    // Desktop wallet specific
    isFreighterInstalled: desktopWallet.isInstalled,
    showInstallModal: desktopWallet.showInstallModal,
    
    // Shared properties
    network: desktopWallet.network || 'testnet',
    balance: desktopWallet.balance,
    error: error || null,
    
    // Actions
    connect,
    disconnect,
    signTransaction,
    getBalance: desktopWallet.getBalance,
    refreshBalance: desktopWallet.refreshBalance,
    
    // Mobile specific actions
    exportMobileWallet,
    importMobileWallet,
    generateBackupQR,
    
    // Desktop specific actions
    checkFreighterInstallation: desktopWallet.checkInstallation,
    closeInstallModal: desktopWallet.closeInstallModal,
    retryInstallation: desktopWallet.retryInstallation,
    
    // Utility actions
    switchToDesktopMode,
    switchToMobileMode,
    
    // Debug functions
    forceMobileMode: () => {
      console.log('🔧 [AdaptiveWallet] FORCING MOBILE MODE');
      setWalletMode('mobile');
      setWalletProvider('mobile');
    },
    getDebugInfo: () => ({
      deviceDetection,
      walletMode,
      walletProvider,
      mobileWalletInfo,
      isConnecting,
      error,
      userAgent: navigator.userAgent,
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight
    })
  };
}
