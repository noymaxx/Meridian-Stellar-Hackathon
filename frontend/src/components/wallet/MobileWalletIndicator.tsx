import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useWallet } from "./WalletProvider";
import { Smartphone, Key, Shield, Check } from "lucide-react";

interface MobileWalletIndicatorProps {
  variant?: "minimal" | "card" | "banner";
  className?: string;
}

export function MobileWalletIndicator({ 
  variant = "minimal", 
  className = "" 
}: MobileWalletIndicatorProps) {
  const wallet = useWallet();

  // Only show for mobile wallet authentication
  if (!wallet.isConnected || wallet.walletProvider !== 'mobile') {
    return null;
  }

  if (variant === "minimal") {
    return (
      <Badge 
        variant="secondary" 
        className={`flex items-center gap-1 text-xs bg-emerald-100 text-emerald-800 border-emerald-200 ${className}`}
      >
        <Smartphone className="h-3 w-3" />
        <Key className="h-3 w-3" />
        Mobile Wallet
      </Badge>
    );
  }

  if (variant === "banner") {
    return (
      <div className={`bg-emerald-50 border border-emerald-200 rounded-lg p-3 ${className}`}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
              <Smartphone className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
              <Check className="h-3 w-3 text-white" />
            </div>
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-emerald-800">
                📱 Autenticado com Mobile Wallet
              </span>
              <Badge variant="outline" className="text-xs border-emerald-300 text-emerald-700">
                Seguro
              </Badge>
            </div>
            <div className="text-xs text-emerald-600 mt-1">
              Carteira: {wallet.address?.slice(0, 8)}...{wallet.address?.slice(-4)}
            </div>
          </div>
          
          <Shield className="h-4 w-4 text-emerald-600" />
        </div>
      </div>
    );
  }

  // Card variant
  return (
    <Card className={`border-emerald-200 bg-emerald-50 ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
            <div className="relative">
              <Smartphone className="h-5 w-5 text-emerald-600" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full flex items-center justify-center">
                <Check className="h-2 w-2 text-white" />
              </div>
            </div>
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-semibold text-emerald-800">
                Mobile Wallet Conectada
              </span>
              <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-700">
                <Key className="h-2 w-2 mr-1" />
                Ativa
              </Badge>
            </div>
            
            <div className="space-y-1">
              <div className="text-xs text-emerald-600">
                <span className="font-medium">Endereço:</span> {wallet.address?.slice(0, 12)}...{wallet.address?.slice(-8)}
              </div>
              
              {wallet.mobileWalletInfo && (
                <div className="text-xs text-emerald-600">
                  <span className="font-medium">Criada:</span> {wallet.mobileWalletInfo.createdAt.toLocaleDateString('pt-BR')}
                </div>
              )}
              
              <div className="text-xs text-emerald-600">
                <span className="font-medium">Dispositivo:</span> {wallet.deviceInfo.deviceType}
              </div>
            </div>
          </div>
          
          <Shield className="h-5 w-5 text-emerald-600" />
        </div>
      </CardContent>
    </Card>
  );
}

// Status bar version for top of screen
export function MobileWalletStatusBar() {
  const wallet = useWallet();

  if (!wallet.isConnected || wallet.walletProvider !== 'mobile') {
    return null;
  }

  return (
    <div className="bg-emerald-600 text-white px-4 py-2 text-center">
      <div className="flex items-center justify-center gap-2 text-sm">
        <Smartphone className="h-4 w-4" />
        <span className="font-medium">Mobile Wallet Ativa</span>
        <span className="text-emerald-200">•</span>
        <span className="text-emerald-100">
          {wallet.address?.slice(0, 6)}...{wallet.address?.slice(-4)}
        </span>
        <div className="w-2 h-2 bg-emerald-300 rounded-full animate-pulse" />
      </div>
    </div>
  );
}

// Floating indicator for bottom corner
export function MobileWalletFloatingIndicator() {
  const wallet = useWallet();

  if (!wallet.isConnected || wallet.walletProvider !== 'mobile') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 md:hidden">
      <div className="bg-emerald-500 text-white rounded-full px-3 py-2 shadow-lg flex items-center gap-2">
        <Smartphone className="h-4 w-4" />
        <span className="text-sm font-medium">Mobile</span>
        <div className="w-2 h-2 bg-emerald-200 rounded-full animate-pulse" />
      </div>
    </div>
  );
}
