export interface BrowserInfo {
  name: string;
  isBrave: boolean;
  isChrome: boolean;
  isFirefox: boolean;
  isSafari: boolean;
  version?: string;
  userAgent: string;
}

export interface WalletConflictInfo {
  hasBraveWallet: boolean;
  hasMetaMask: boolean;
  hasFreighter: boolean;
  conflictDetected: boolean;
  primaryConflict?: string;
  recommendations: string[];
}

// Detect browser type and version
export function detectBrowser(): BrowserInfo {
  const userAgent = navigator.userAgent;
  
  // Brave browser detection
  const isBrave = !!(navigator as any).brave && typeof (navigator as any).brave.isBrave === 'function';
  
  // Alternative Brave detection method
  const isBraveAlt = userAgent.includes('Brave') || 
                    (userAgent.includes('Chrome') && !(window as any).chrome?.runtime?.onInstalled);
  
  const isChrome = userAgent.includes('Chrome') && !userAgent.includes('Edg') && !isBrave;
  const isFirefox = userAgent.includes('Firefox');
  const isSafari = userAgent.includes('Safari') && !userAgent.includes('Chrome');
  
  // Extract version
  let version: string | undefined;
  if (isBrave || isBraveAlt) {
    const chromeVersion = userAgent.match(/Chrome\/(\d+\.\d+\.\d+\.\d+)/);
    version = chromeVersion ? chromeVersion[1] : undefined;
  } else if (isChrome) {
    const chromeVersion = userAgent.match(/Chrome\/(\d+\.\d+\.\d+\.\d+)/);
    version = chromeVersion ? chromeVersion[1] : undefined;
  } else if (isFirefox) {
    const firefoxVersion = userAgent.match(/Firefox\/(\d+\.\d+)/);
    version = firefoxVersion ? firefoxVersion[1] : undefined;
  }
  
  return {
    name: isBrave || isBraveAlt ? 'Brave' : 
          isChrome ? 'Chrome' : 
          isFirefox ? 'Firefox' : 
          isSafari ? 'Safari' : 'Unknown',
    isBrave: isBrave || isBraveAlt,
    isChrome,
    isFirefox,
    isSafari,
    version,
    userAgent
  };
}

// Check for wallet conflicts
export function detectWalletConflicts(): WalletConflictInfo {
  const windowObj = window as any;
  
  // Check for various wallet injections
  const hasBraveWallet = !!(windowObj.ethereum?.isBraveWallet || windowObj.solana?.isBraveWallet);
  const hasMetaMask = !!(windowObj.ethereum?.isMetaMask);
  const hasFreighter = !!(windowObj.freighter);
  
  const browserInfo = detectBrowser();
  const recommendations: string[] = [];
  let conflictDetected = false;
  let primaryConflict: string | undefined;
  
  // Brave-specific conflict detection
  if (browserInfo.isBrave) {
    if (hasBraveWallet && !hasFreighter) {
      conflictDetected = true;
      primaryConflict = 'Brave Wallet is interfering with Freighter extension';
      recommendations.push('Go to brave://settings/web3');
      recommendations.push('Set "Default wallet" to "Extensions (no fallback)"');
      recommendations.push('Restart your browser');
      recommendations.push('Ensure Freighter extension is enabled');
    }
    
    if (!hasFreighter) {
      recommendations.push('Make sure Freighter extension is installed and enabled');
      recommendations.push('Check brave://extensions/ to verify Freighter is active');
    }
  }
  
  // General conflict detection
  if (hasMetaMask && hasFreighter) {
    recommendations.push('Multiple wallet extensions detected - this may cause conflicts');
  }
  
  if (!hasFreighter && browserInfo.isBrave) {
    recommendations.push('Freighter wallet not detected in Brave browser');
    recommendations.push('This is likely due to Brave Wallet interference');
  }
  
  return {
    hasBraveWallet,
    hasMetaMask,
    hasFreighter,
    conflictDetected,
    primaryConflict,
    recommendations
  };
}

// Get detailed debug information
export function getWalletDebugInfo() {
  const browserInfo = detectBrowser();
  const conflicts = checkWalletConflicts();
  const windowObj = window as any;
  
  return {
    timestamp: new Date().toISOString(),
    windowExists: typeof window !== "undefined",
    hasFreighterProperty: 'freighter' in window,
    freighterValue: windowObj.freighter,
    freighterType: typeof windowObj.freighter,
    windowKeys: Object.keys(window).filter(key => key.toLowerCase().includes('freighter')),
    allFreighterRelated: Object.keys(window).filter(key => 
      key.toLowerCase().includes('freighter') || 
      key.toLowerCase().includes('stellar')
    ),
    browserInfo: browserInfo,
    walletConflicts: conflicts,
    window: {
      hasFreighter: 'freighter' in window,
      freighterType: typeof windowObj.freighter,
      freighterValue: windowObj.freighter,
      hasEthereum: 'ethereum' in window,
      ethereumProviders: windowObj.ethereum ? {
        isMetaMask: windowObj.ethereum.isMetaMask,
        isBraveWallet: windowObj.ethereum.isBraveWallet,
        providers: windowObj.ethereum.providers?.length || 0
      } : null,
      allWalletKeys: Object.keys(window).filter(key => 
        key.toLowerCase().includes('freighter') ||
        key.toLowerCase().includes('ethereum') ||
        key.toLowerCase().includes('solana') ||
        key.toLowerCase().includes('wallet')
      )
    }
  };
}

// Check for wallet conflicts - returns array of detected wallets
export function checkWalletConflicts(): string[] {
  if (typeof window === 'undefined') return [];
  
  const conflicts: string[] = [];
  const windowObj = window as any;
  
  // Check for Brave wallet
  if (windowObj.ethereum?.isBraveWallet) {
    conflicts.push('brave');
  }
  
  // Check for MetaMask
  if (windowObj.ethereum?.isMetaMask) {
    conflicts.push('metamask');
  }
  
  // Check for other wallets
  if ('solana' in window) {
    conflicts.push('phantom');
  }
  
  if ('ethereum' in window && !windowObj.ethereum?.isBraveWallet && !windowObj.ethereum?.isMetaMask) {
    conflicts.push('other-ethereum');
  }
  
  return conflicts;
}