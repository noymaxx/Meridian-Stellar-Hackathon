import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { KPICard } from "@/components/ui/kpi-card";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { mockMarketStats, mockMarkets } from "@/lib/mock-data";
import { 
  Shield, 
  BarChart3, 
  Users, 
  TrendingUp, 
  Lock, 
  Globe, 
  Zap,
  DollarSign,
  ArrowRight,
  CheckCircle
} from "lucide-react";

const Index = () => {
  const topMarkets = mockMarkets.slice(0, 3);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-hero">
        <div className="container mx-auto max-w-7xl px-6 py-24">
          <div className="text-center space-y-8 animate-fade-in">
            <div className="space-y-4">
              <Badge variant="secondary" className="bg-brand-500/10 text-brand-400 border-brand-500/20">
                Stellar Blockchain • Soroban Smart Contracts
              </Badge>
              <h1 className="text-display-1 font-semibold text-fg-primary max-w-4xl mx-auto">
                Institutional RWA Lending
                <span className="block text-brand-400">Native on Stellar</span>
              </h1>
              <p className="text-body-1 text-fg-secondary max-w-2xl mx-auto leading-relaxed">
                Professional-grade lending protocol for Real-World Assets with permissioned markets, 
                hybrid oracles, and institutional compliance. Built on Stellar's Soroban platform.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button className="btn-primary px-8 py-4 text-body-1">
                Connect Wallet
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button variant="outline" className="px-8 py-4 text-body-1">
                View Markets
              </Button>
            </div>
          </div>
        </div>
        
        {/* Subtle glow effect */}
        <div className="absolute inset-0 bg-gradient-glow pointer-events-none" />
      </section>

      {/* Stats Section */}
      <section className="container mx-auto max-w-7xl px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-slide-up">
          <KPICard
            title="Total Value Locked"
            value={mockMarketStats.totalValueLocked}
            icon={DollarSign}
            trend="up"
            trendValue="+12.5%"
          />
          <KPICard
            title="Active Markets"
            value={mockMarketStats.totalMarkets.toString()}
            icon={BarChart3}
            subtitle="Permissioned protocols"
          />
          <KPICard
            title="Institutional Users"
            value={mockMarketStats.totalUsers.toString()}
            icon={Users}
            trend="up"
            trendValue="+8 this week"
          />
          <KPICard
            title="Average Utilization"
            value={mockMarketStats.avgUtilization}
            icon={TrendingUp}
            trend="neutral"
            trendValue="Stable"
          />
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto max-w-7xl px-6 py-16">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-h1 font-semibold text-fg-primary">
            Institutional-Grade Infrastructure
          </h2>
          <p className="text-body-1 text-fg-secondary max-w-2xl mx-auto">
            Purpose-built for professional asset managers, treasuries, and institutional investors.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              icon: Shield,
              title: "Permissioned Markets",
              description: "KYC/KYB compliance with role-based access controls and regulatory transparency."
            },
            {
              icon: Globe,
              title: "Hybrid Oracles",
              description: "Reflector on-chain prices combined with NAV attestations from custodians."
            },
            {
              icon: Zap,
              title: "Efficient Capital",
              description: "P2P matching with pool fallback inspired by Morpho for optimal utilization."
            },
            {
              icon: BarChart3,
              title: "Risk Premiums", 
              description: "Granular risk modeling with base rates plus asset-specific premiums."
            },
            {
              icon: Lock,
              title: "Stellar Native",
              description: "Built on Soroban smart contracts with native Stellar asset integration."
            },
            {
              icon: Users,
              title: "Institutional UX",
              description: "Professional dashboards, reporting, and treasury-grade position management."
            }
          ].map((feature, index) => (
            <Card key={index} className="card-institutional hover-lift animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
              <div className="space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500/10">
                  <feature.icon className="h-6 w-6 text-brand-400" />
                </div>
                <h3 className="text-h3 font-semibold text-fg-primary">
                  {feature.title}
                </h3>
                <p className="text-body-2 text-fg-secondary leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Markets Preview */}
      <section className="container mx-auto max-w-7xl px-6 py-16">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-h1 font-semibold text-fg-primary">
            Active Markets
          </h2>
          <p className="text-body-1 text-fg-secondary">
            Institutional-grade Real-World Asset markets with regulated access.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {topMarkets.map((market, index) => (
            <Card key={market.id} className="card-institutional hover-lift animate-fade-in" style={{ animationDelay: `${index * 150}ms` }}>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-micro">
                    {market.assetSymbol}
                  </Badge>
                  <Badge variant="secondary" className="text-micro">
                    Permissioned
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-h3 font-semibold text-fg-primary">
                    {market.name}
                  </h3>
                  <p className="text-body-2 text-fg-muted">
                    Min. Investment: {market.minInvestment}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-micro text-fg-muted uppercase tracking-wide">Supply APY</p>
                    <p className="text-h3 font-semibold text-brand-400 tabular-nums">
                      {market.supplyApy}
                    </p>
                  </div>
                  <div>
                    <p className="text-micro text-fg-muted uppercase tracking-wide">TVL</p>
                    <p className="text-h3 font-semibold text-fg-primary tabular-nums">
                      {market.totalSupply}
                    </p>
                  </div>
                </div>
                
                <Button variant="outline" className="w-full">
                  View Details
                </Button>
              </div>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Button className="btn-primary">
            View All Markets
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="container mx-auto max-w-7xl px-6 py-16">
        <Card className="card-institutional bg-gradient-hero">
          <div className="text-center space-y-8">
            <h2 className="text-h2 font-semibold text-fg-primary">
              Trusted by Institutional Investors
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: CheckCircle,
                  title: "Regulatory Compliant",
                  description: "Full KYC/KYB with jurisdiction controls"
                },
                {
                  icon: Shield,
                  title: "Audited & Secure",
                  description: "Smart contracts audited by leading firms"
                },
                {
                  icon: BarChart3,
                  title: "Real-Time Reporting",
                  description: "Institutional-grade analytics and reporting"
                }
              ].map((item, index) => (
                <div key={index} className="flex flex-col items-center space-y-3 animate-scale-in" style={{ animationDelay: `${index * 200}ms` }}>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500/10">
                    <item.icon className="h-6 w-6 text-brand-400" />
                  </div>
                  <h3 className="text-h3 font-semibold text-fg-primary">
                    {item.title}
                  </h3>
                  <p className="text-body-2 text-fg-secondary text-center">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-stroke-line bg-card">
        <div className="container mx-auto max-w-7xl px-6 py-12">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500">
                <div className="text-lg font-bold text-primary-foreground">R</div>
              </div>
              <span className="text-h3 font-semibold text-fg-primary">RWA Lending</span>
            </div>
            <p className="text-body-2 text-fg-muted">
              Institutional Real-World Asset lending on Stellar • Built with Soroban
            </p>
            <div className="flex justify-center space-x-6 text-body-2">
              <a href="/docs" className="text-fg-secondary hover:text-fg-primary transition-colors">
                Documentation
              </a>
              <a href="/kyc" className="text-fg-secondary hover:text-fg-primary transition-colors">
                KYC Portal
              </a>
              <a href="/admin" className="text-fg-secondary hover:text-fg-primary transition-colors">
                Admin
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
