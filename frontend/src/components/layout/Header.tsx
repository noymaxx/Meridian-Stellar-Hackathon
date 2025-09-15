import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Wallet, Menu, X, ChevronDown, Loader2 } from "lucide-react";
import { useWallet } from "@/components/wallet/WalletProvider";
import { WalletStatus } from "@/components/wallet/WalletStatus";
import { formatStellarAddress } from "@/lib/stellar-config";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [walletPopoverOpen, setWalletPopoverOpen] = useState(false);
  const { 
    isConnected, 
    address, 
    balance, 
    isConnecting,
    connect, 
    disconnect 
  } = useWallet();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-stroke-line bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* Logo - Clickable */}
        <a href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity group">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 group-hover:bg-brand-400 transition-colors">
            <div className="text-lg font-bold text-primary-foreground">R</div>
          </div>
          <div>
            <div className="text-h3 font-semibold text-fg-primary group-hover:text-brand-400 transition-colors">RWA Lending</div>
            <div className="text-micro text-fg-muted">Institutional DeFi</div>
          </div>
        </a>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          <a href="/" className="text-body-2 text-fg-secondary hover:text-fg-primary hover:text-brand-400 transition-colors relative group">
            Home
            <span className="absolute bottom-0 left-0 w-0 h-px bg-brand-400 group-hover:w-full transition-all duration-300" />
          </a>
          <a href="/markets" className="text-body-2 text-fg-secondary hover:text-fg-primary hover:text-brand-400 transition-colors relative group">
            Markets
            <span className="absolute bottom-0 left-0 w-0 h-px bg-brand-400 group-hover:w-full transition-all duration-300" />
          </a>
          <a href="/portfolio" className="text-body-2 text-fg-secondary hover:text-fg-primary hover:text-brand-400 transition-colors relative group">
            Portfolio
            <span className="absolute bottom-0 left-0 w-0 h-px bg-brand-400 group-hover:w-full transition-all duration-300" />
          </a>
          <a href="/kyc" className="text-body-2 text-fg-secondary hover:text-fg-primary hover:text-brand-400 transition-colors relative group">
            KYC
            <span className="absolute bottom-0 left-0 w-0 h-px bg-brand-400 group-hover:w-full transition-all duration-300" />
          </a>
          <a href="/docs" className="text-body-2 text-fg-secondary hover:text-fg-primary hover:text-brand-400 transition-colors relative group">
            Documentation
            <span className="absolute bottom-0 left-0 w-0 h-px bg-brand-400 group-hover:w-full transition-all duration-300" />
          </a>
          <a href="/admin" className="text-body-2 text-fg-secondary hover:text-fg-primary hover:text-brand-400 transition-colors relative group">
            Admin
            <span className="absolute bottom-0 left-0 w-0 h-px bg-brand-400 group-hover:w-full transition-all duration-300" />
          </a>
        </nav>

        {/* Wallet Connection */}
        <div className="flex items-center space-x-4">
          {isConnected ? (
            <Popover open={walletPopoverOpen} onOpenChange={setWalletPopoverOpen}>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  className="flex items-center space-x-2 hover:bg-accent"
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-sm">{formatStellarAddress(address)}</span>
                    {balance && (
                      <Badge variant="secondary" className="text-xs">
                        {balance} XLM
                      </Badge>
                    )}
                  </div>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                <WalletStatus compact={false} />
              </PopoverContent>
            </Popover>
          ) : (
            <Button 
              onClick={connect} 
              disabled={isConnecting}
              className="btn-primary flex items-center space-x-2"
            >
              {isConnecting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Wallet className="h-4 w-4" />
              )}
              <span>{isConnecting ? "Connecting..." : "Connect Wallet"}</span>
            </Button>
          )}

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-stroke-line bg-card animate-slide-up">
          <nav className="container mx-auto px-6 py-4 space-y-2">
            <a href="/" className="block py-2 text-body-2 text-fg-secondary hover:text-fg-primary hover:text-brand-400 transition-colors">
              Home
            </a>
            <a href="/markets" className="block py-2 text-body-2 text-fg-secondary hover:text-fg-primary hover:text-brand-400 transition-colors">
              Markets
            </a>
            <a href="/portfolio" className="block py-2 text-body-2 text-fg-secondary hover:text-fg-primary hover:text-brand-400 transition-colors">
              Portfolio
            </a>
            <a href="/kyc" className="block py-2 text-body-2 text-fg-secondary hover:text-fg-primary hover:text-brand-400 transition-colors">
              KYC
            </a>
            <a href="/docs" className="block py-2 text-body-2 text-fg-secondary hover:text-fg-primary hover:text-brand-400 transition-colors">
              Documentation
            </a>
            <a href="/admin" className="block py-2 text-body-2 text-fg-secondary hover:text-fg-primary hover:text-brand-400 transition-colors">
              Admin
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}