import { useState, useEffect } from 'react';

export interface MobileDetectionResult {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  screenWidth: number;
}

export const useMobileDetection = (): MobileDetectionResult => {
  const [detection, setDetection] = useState<MobileDetectionResult>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    deviceType: 'desktop',
    screenWidth: 1920
  });

  useEffect(() => {
    const detectDevice = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const screenWidth = window.innerWidth;
      
      // User Agent detection
      const mobileKeywords = ['android', 'iphone', 'ipod', 'blackberry', 'windows phone'];
      const tabletKeywords = ['ipad', 'tablet', 'kindle', 'silk', 'playbook'];
      
      const isMobileUA = mobileKeywords.some(keyword => userAgent.includes(keyword));
      const isTabletUA = tabletKeywords.some(keyword => userAgent.includes(keyword));
      
      // Screen size detection
      const isMobileScreen = screenWidth <= 768;
      const isTabletScreen = screenWidth > 768 && screenWidth <= 1024;
      const isDesktopScreen = screenWidth > 1024;
      
      // Combined detection
      const isMobile = isMobileUA || (isMobileScreen && !isTabletUA);
      const isTablet = isTabletUA || (isTabletScreen && !isMobileUA);
      const isDesktop = !isMobile && !isTablet;
      
      let deviceType: 'mobile' | 'tablet' | 'desktop' = 'desktop';
      if (isMobile) deviceType = 'mobile';
      else if (isTablet) deviceType = 'tablet';
      
      const newDetection: MobileDetectionResult = {
        isMobile,
        isTablet,
        isDesktop,
        deviceType,
        screenWidth
      };
      
      setDetection(newDetection);
      
      console.log('📱 Device Detection:', {
        userAgent: userAgent.slice(0, 50) + '...',
        screenWidth,
        deviceType,
        isMobile,
        isTablet,
        isDesktop
      });
    };

    // Initial detection
    detectDevice();
    
    // Listen for screen size changes
    window.addEventListener('resize', detectDevice);
    
    // Listen for orientation changes on mobile
    window.addEventListener('orientationchange', () => {
      setTimeout(detectDevice, 100); // Small delay for orientation change
    });
    
    return () => {
      window.removeEventListener('resize', detectDevice);
      window.removeEventListener('orientationchange', detectDevice);
    };
  }, []);

  return detection;
};

// Utility functions for specific checks
export const isMobileDevice = (): boolean => {
  const userAgent = navigator.userAgent.toLowerCase();
  const mobileKeywords = ['android', 'iphone', 'ipod', 'blackberry', 'windows phone'];
  return mobileKeywords.some(keyword => userAgent.includes(keyword)) || 
         window.innerWidth <= 768;
};

export const isTabletDevice = (): boolean => {
  const userAgent = navigator.userAgent.toLowerCase();
  const tabletKeywords = ['ipad', 'tablet', 'kindle', 'silk', 'playbook'];
  return tabletKeywords.some(keyword => userAgent.includes(keyword)) || 
         (window.innerWidth > 768 && window.innerWidth <= 1024);
};

export const isDesktopDevice = (): boolean => {
  return !isMobileDevice() && !isTabletDevice();
};
