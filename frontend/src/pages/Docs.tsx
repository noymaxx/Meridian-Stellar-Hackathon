import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Search, BookOpen, Shield, AlertTriangle, Info, ExternalLink } from "lucide-react";

export default function Docs() {
  const [searchTerm, setSearchTerm] = useState("");

  const sections = [
    {
      id: "getting-started",
      title: "Getting Started",
      icon: BookOpen,
      articles: [
        { title: "What is RWA Lending?", content: "Real-World Asset (RWA) lending allows institutional investors to lend and borrow against tokenized real-world assets like Treasury bills, corporate credit, and real estate." },
        { title: "How to Connect Your Wallet", content: "Connect your Stellar wallet using Freighter or Stellar Wallets Kit to access institutional RWA markets." },
        { title: "KYC/KYB Verification", content: "Complete institutional-grade Know Your Customer (KYC) and Know Your Business (KYB) verification to access permissioned markets." },
        { title: "Market Overview", content: "Explore different RWA markets including Treasury bills, corporate credit funds, and commercial real estate investments." }
      ]
    },
    {
      id: "risk-management",
      title: "Risk Management",
      icon: Shield,
      articles: [
        { title: "Loan-to-Value (LLTV) Ratios", content: "LLTV ratios vary by asset class: Treasury Bills (95%), Corporate Credit (80%), Real Estate (75%). Higher ratios indicate lower risk." },
        { title: "Risk Premiums", content: "Risk premiums are added to base rates based on collateral type, market conditions, and user profile to reflect actual risk." },
        { title: "Liquidation Process", content: "Liquidations occur when Health Factor drops below 1.0. Partial liquidations are preferred to minimize market impact." },
        { title: "Oracle and Pricing", content: "Hybrid oracle system combines on-chain prices (Reflector) with custodian-attested NAV for accurate RWA valuations." }
      ]
    },
    {
      id: "compliance",
      title: "Compliance & Legal",
      icon: AlertTriangle,
      articles: [
        { title: "Regulatory Framework", content: "Our platform operates under institutional regulatory frameworks with permissioned access and compliance monitoring." },
        { title: "Eligible Investor Requirements", content: "Access requires completion of institutional KYC/KYB verification and compliance with jurisdiction-specific requirements." },
        { title: "Anti-Money Laundering (AML)", content: "Comprehensive AML procedures including transaction monitoring, sanctions screening, and suspicious activity reporting." },
        { title: "Data Privacy & Security", content: "Personal and business data is protected under institutional-grade security measures and privacy regulations." }
      ]
    },
    {
      id: "technical",
      title: "Technical Documentation",
      icon: Info,
      articles: [
        { title: "Stellar Integration", content: "Built on Stellar using Soroban smart contracts for institutional-grade DeFi with predictable fees and fast settlement." },
        { title: "Token Standards", content: "SRWA tokens implement SEP-41 (Token Interface) with compliance layers for permissioned transfers and KYC enforcement." },
        { title: "Smart Contract Architecture", content: "Hub-and-Spoke architecture with central liquidity management and specialized market contracts for different asset classes." },
        { title: "API Reference", content: "RESTful APIs for market data, portfolio management, and institutional reporting with comprehensive documentation." }
      ]
    }
  ];

  const filteredSections = sections.map(section => ({
    ...section,
    articles: section.articles.filter(article =>
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.content.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(section => section.articles.length > 0);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto max-w-6xl px-6 py-8 space-y-8">
        {/* Header */}
        <div className="space-y-2 animate-fade-in">
          <h1 className="text-h1 font-semibold text-fg-primary">Documentation</h1>
          <p className="text-body-1 text-fg-secondary">
            Learn how to use our institutional RWA lending platform, understand risk management, and stay compliant.
          </p>
        </div>

        {/* Search */}
        <Card className="card-institutional animate-slide-up">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-fg-muted" />
            <Input
              placeholder="Search documentation..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 input-institutional"
            />
          </div>
        </Card>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in">
          <Card className="card-institutional hover-lift cursor-pointer">
            <div className="flex items-center gap-3">
              <BookOpen className="h-6 w-6 text-brand-400" />
              <div>
                <h3 className="text-body-1 font-medium text-fg-primary">Quick Start</h3>
                <p className="text-body-2 text-fg-muted">Get up and running in 5 minutes</p>
              </div>
            </div>
          </Card>
          
          <Card className="card-institutional hover-lift cursor-pointer">
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-brand-400" />
              <div>
                <h3 className="text-body-1 font-medium text-fg-primary">Risk Guide</h3>
                <p className="text-body-2 text-fg-muted">Understand our risk framework</p>
              </div>
            </div>
          </Card>
          
          <Card className="card-institutional hover-lift cursor-pointer">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-brand-400" />
              <div>
                <h3 className="text-body-1 font-medium text-fg-primary">Compliance</h3>
                <p className="text-body-2 text-fg-muted">Regulatory requirements</p>
              </div>
            </div>
          </Card>
          
          <Card className="card-institutional hover-lift cursor-pointer">
            <div className="flex items-center gap-3">
              <Info className="h-6 w-6 text-brand-400" />
              <div>
                <h3 className="text-body-1 font-medium text-fg-primary">API Docs</h3>
                <p className="text-body-2 text-fg-muted">Technical integration</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Documentation Sections */}
        <div className="space-y-8">
          {filteredSections.map((section, index) => (
            <Card key={section.id} className="card-institutional animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <section.icon className="h-6 w-6 text-brand-400" />
                  <h2 className="text-h2 font-semibold text-fg-primary">{section.title}</h2>
                  <Badge variant="secondary" className="text-micro">
                    {section.articles.length} articles
                  </Badge>
                </div>
                
                <Accordion type="single" collapsible className="w-full">
                  {section.articles.map((article, articleIndex) => (
                    <AccordionItem key={articleIndex} value={`${section.id}-${articleIndex}`}>
                      <AccordionTrigger className="text-left hover:text-brand-400 transition-colors">
                        <div className="flex items-center gap-2">
                          <span className="text-body-1 font-medium">{article.title}</span>
                          <ExternalLink className="h-4 w-4 opacity-50" />
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="pt-2 pb-4">
                          <p className="text-body-2 text-fg-secondary leading-relaxed">
                            {article.content}
                          </p>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredSections.length === 0 && searchTerm && (
          <Card className="card-institutional">
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-fg-muted mx-auto mb-4" />
              <h3 className="text-h3 text-fg-primary mb-2">No results found</h3>
              <p className="text-body-2 text-fg-muted">
                Try adjusting your search terms or browse our documentation sections above.
              </p>
            </div>
          </Card>
        )}

        {/* External Resources */}
        <Card className="card-institutional animate-fade-in">
          <div className="space-y-4">
            <h2 className="text-h2 font-semibold text-fg-primary">External Resources</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <a 
                href="https://developers.stellar.org" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 bg-bg-elev-2 border border-stroke-line rounded-xl hover:bg-bg-elev-2/80 transition-colors"
              >
                <ExternalLink className="h-5 w-5 text-brand-400" />
                <div>
                  <h3 className="text-body-1 font-medium text-fg-primary">Stellar Developer Docs</h3>
                  <p className="text-body-2 text-fg-muted">Official Stellar and Soroban documentation</p>
                </div>
              </a>
              
              <a 
                href="https://soroswap.finance" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 bg-bg-elev-2 border border-stroke-line rounded-xl hover:bg-bg-elev-2/80 transition-colors"
              >
                <ExternalLink className="h-5 w-5 text-brand-400" />
                <div>
                  <h3 className="text-body-1 font-medium text-fg-primary">Soroswap DEX</h3>
                  <p className="text-body-2 text-fg-muted">Liquidity and trading on Stellar</p>
                </div>
              </a>
              
              <a 
                href="https://reflector.network" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 bg-bg-elev-2 border border-stroke-line rounded-xl hover:bg-bg-elev-2/80 transition-colors"
              >
                <ExternalLink className="h-5 w-5 text-brand-400" />
                <div>
                  <h3 className="text-body-1 font-medium text-fg-primary">Reflector Oracle</h3>
                  <p className="text-body-2 text-fg-muted">On-chain price feeds for Stellar</p>
                </div>
              </a>
              
              <a 
                href="https://freighter.app" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 bg-bg-elev-2 border border-stroke-line rounded-xl hover:bg-bg-elev-2/80 transition-colors"
              >
                <ExternalLink className="h-5 w-5 text-brand-400" />
                <div>
                  <h3 className="text-body-1 font-medium text-fg-primary">Freighter Wallet</h3>
                  <p className="text-body-2 text-fg-muted">Stellar wallet browser extension</p>
                </div>
              </a>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}