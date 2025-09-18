import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { AdaptiveConnectButton } from "@/components/wallet/AdaptiveConnectButton";
import Logo from "@/assets/logoProject.png";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // Mobile menu state only
  // Wallet connection is now handled by AdaptiveConnectButton

  return (
    <header className="sticky top-0 z-40 w-full border-b border-stroke-line bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 sm:h-16 max-w-7xl items-center justify-between px-4 sm:px-6">

        {/* Logo */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <img src={Logo} alt="Logo" className="h-auto w-8 sm:w-10" />
        </div>

        {/* Spacer for centering */}
        <div className="flex-1"></div>

        {/* Desktop Navigation + Wallet Connection */}
        <div className="hidden md:flex items-center space-x-4 lg:space-x-6">
          {/* Navigation Links */}
          <nav className="flex items-center space-x-4 lg:space-x-6">
            <a href="/" className="text-sm lg:text-body-2 text-fg-secondary hover:text-brand-400 transition-colors relative group">
              Home
              <span className="absolute bottom-0 left-0 w-0 h-px bg-brand-400 group-hover:w-full transition-all duration-300" />
            </a>
            <a href="/dashboard" className="text-sm lg:text-body-2 text-fg-secondary hover:text-brand-400 transition-colors relative group font-medium">
              Dashboard
              <span className="absolute bottom-0 left-0 w-0 h-px bg-brand-400 group-hover:w-full transition-all duration-300" />
            </a>
            <a href="/docs" className="text-sm lg:text-body-2 text-fg-secondary hover:text-brand-400 transition-colors relative group">
              Documentation
              <span className="absolute bottom-0 left-0 w-0 h-px bg-brand-400 group-hover:w-full transition-all duration-300" />
            </a>
          </nav>

          {/* Adaptive Wallet Connection */}
          <div className="flex items-center space-x-2 sm:space-x-4 ml-4 lg:ml-6">
            <AdaptiveConnectButton 
              variant="outline"
              className="text-xs sm:text-sm"
            />
          </div>
        </div>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="sm"
          className="md:hidden p-2 ml-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
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
            <a href="/docs" className="block py-2 text-sm sm:text-body-2 text-fg-secondary hover:text-brand-400 transition-colors">
              Documentation
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
