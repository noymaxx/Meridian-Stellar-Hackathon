import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Wallet, Menu, X, ChevronDown, Loader2 } from "lucide-react";
import { useWallet } from "@/components/wallet/WalletProvider";
import { WalletStatus } from "@/components/wallet/WalletStatus";
import { formatStellarAddress } from "@/lib/stellar-config";
import Logo from "@/assets/logoProject.png";
import { SettingsButton } from "@/components/settings/SettingsDialog";

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
      <div className="container mx-auto flex h-14 sm:h-16 max-w-7xl items-center justify-between px-4 sm:px-6">

        {/* Logo */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <img src={Logo} alt="Logo" className="h-auto w-8 sm:w-10" />
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6 lg:space-x-8">
          <a href="/" className="text-sm lg:text-body-2 text-fg-secondary hover:text-brand-400 transition-colors relative group">
            Home
            <span className="absolute bottom-0 left-0 w-0 h-px bg-brand-400 group-hover:w-full transition-all duration-300" />
          </a>
          <a href="/dashboard" className="text-sm lg:text-body-2 text-fg-secondary hover:text-brand-400 transition-colors relative group font-medium">
            Dashboard
            <span className="absolute bottom-0 left-0 w-0 h-px bg-brand-400 group-hover:w-full transition-all duration-300" />
          </a>
          <a href="/srwa-issuance" className="text-sm lg:text-body-2 text-fg-secondary hover:text-brand-400 transition-colors relative group">
            Create RWA
            <span className="absolute bottom-0 left-0 w-0 h-px bg-brand-400 group-hover:w-full transition-all duration-300" />
          </a>
          <a href="/srwa-demo" className="text-sm lg:text-body-2 text-fg-secondary hover:text-brand-400 transition-colors relative group">
            RWA Demo
            <span className="absolute bottom-0 left-0 w-0 h-px bg-brand-400 group-hover:w-full transition-all duration-300" />
          </a>
        </nav>

        {/* Wallet Connection */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          <SettingsButton />
          {isConnected ? (
            <Popover open={walletPopoverOpen} onOpenChange={setWalletPopoverOpen}>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  className="flex items-center space-x-1 sm:space-x-2 hover:bg-accent text-xs sm:text-sm"
                >
                  <div className="flex items-center space-x-1 sm:space-x-2">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full" />
                    <span className="hidden sm:inline">{formatStellarAddress(address)}</span>
                    <span className="sm:hidden">{formatStellarAddress(address).slice(0, 6)}...</span>
                    {balance && (
                      <Badge variant="secondary" className="text-xs hidden sm:inline-flex">
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
              className="btn-primary flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm px-2 sm:px-4"
            >
              {isConnecting ? (
                <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
              ) : (
                <Wallet className="h-3 w-3 sm:h-4 sm:w-4" />
              )}
              <span className="hidden sm:inline">{isConnecting ? "Connecting..." : "Connect Wallet"}</span>
              <span className="sm:hidden">{isConnecting ? "..." : "Connect"}</span>
            </Button>
          )}

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-stroke-line bg-card animate-slide-up">
          <nav className="container mx-auto px-4 sm:px-6 py-4 space-y-2">
            <a href="/" className="block py-2 text-sm sm:text-body-2 text-fg-secondary hover:text-brand-400 transition-colors">
              Home
            </a>
            <a href="/dashboard" className="block py-2 text-sm sm:text-body-2 text-fg-secondary hover:text-brand-400 transition-colors font-medium">
              Dashboard
            </a>
            <a href="/srwa-issuance" className="block py-2 text-sm sm:text-body-2 text-fg-secondary hover:text-brand-400 transition-colors">
              Create RWA
            </a>
            <a href="/srwa-demo" className="block py-2 text-sm sm:text-body-2 text-fg-secondary hover:text-brand-400 transition-colors">
              RWA Demo
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
