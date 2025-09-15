import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wallet, Menu, X } from "lucide-react";
import { useStellarWallet } from "@/hooks/useStellarWallet";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isConnected, address, connect, disconnect } = useStellarWallet();

  const formatAddress = (addr: string) => 
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-stroke-line bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* Logo */}
        <div className="flex items-center space-x-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500">
            <div className="text-lg font-bold text-primary-foreground">R</div>
          </div>
          <div>
            <div className="text-h3 font-semibold text-fg-primary">RWA Lending</div>
            <div className="text-micro text-fg-muted">Institutional DeFi</div>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          <a href="/markets" className="text-body-2 text-fg-secondary hover:text-fg-primary transition-colors">
            Markets
          </a>
          <a href="/portfolio" className="text-body-2 text-fg-secondary hover:text-fg-primary transition-colors">
            Portfolio
          </a>
          <a href="/kyc" className="text-body-2 text-fg-secondary hover:text-fg-primary transition-colors">
            KYC
          </a>
          <a href="/docs" className="text-body-2 text-fg-secondary hover:text-fg-primary transition-colors">
            Documentation
          </a>
          <a href="/admin" className="text-body-2 text-fg-secondary hover:text-fg-primary transition-colors">
            Admin
          </a>
        </nav>

        {/* Wallet Connection */}
        <div className="flex items-center space-x-4">
          {isConnected ? (
            <div className="flex items-center space-x-3">
              <Badge variant="secondary" className="text-micro">
                {formatAddress(address)}
              </Badge>
              <Button variant="outline" size="sm" onClick={disconnect}>
                Disconnect
              </Button>
            </div>
          ) : (
            <Button onClick={connect} className="btn-primary">
              <Wallet className="mr-2 h-4 w-4" />
              Connect Wallet
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
            <a href="/markets" className="block py-2 text-body-2 text-fg-secondary hover:text-fg-primary transition-colors">
              Markets
            </a>
            <a href="/portfolio" className="block py-2 text-body-2 text-fg-secondary hover:text-fg-primary transition-colors">
              Portfolio
            </a>
            <a href="/kyc" className="block py-2 text-body-2 text-fg-secondary hover:text-fg-primary transition-colors">
              KYC
            </a>
            <a href="/docs" className="block py-2 text-body-2 text-fg-secondary hover:text-fg-primary transition-colors">
              Documentation
            </a>
            <a href="/admin" className="block py-2 text-body-2 text-fg-secondary hover:text-fg-primary transition-colors">
              Admin
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}