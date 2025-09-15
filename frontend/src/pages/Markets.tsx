import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { KPICard } from "@/components/ui/kpi-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { mockMarkets, mockMarketStats, type RWAMarket } from "@/lib/mock-data";
import { Search, TrendingUp, Users, BarChart3, DollarSign, Filter } from "lucide-react";

export default function Markets() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  
  const filteredMarkets = mockMarkets.filter(market => {
    const matchesSearch = market.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         market.assetSymbol.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || market.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getCategoryBadgeColor = (category: RWAMarket["category"]) => {
    switch (category) {
      case "treasury": return "bg-brand-500/10 text-brand-400 border-brand-500/20";
      case "credit": return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "real-estate": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      default: return "bg-fg-muted/10 text-fg-muted border-fg-muted/20";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto max-w-7xl px-6 py-8 space-y-8">
        {/* Header Section */}
        <div className="space-y-2 animate-fade-in">
          <h1 className="text-h1 font-semibold text-fg-primary">Markets</h1>
          <p className="text-body-1 text-fg-secondary">
            Institutional-grade RWA lending markets with permissioned access and hybrid oracles.
          </p>
        </div>

        {/* KPI Overview */}
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
            title="Average Utilization"
            value={mockMarketStats.avgUtilization}
            icon={TrendingUp}
            trend="neutral"
            trendValue="Stable"
          />
          <KPICard
            title="Institutional Users"
            value={mockMarketStats.totalUsers.toString()}
            icon={Users}
            trend="up"
            trendValue="+8"
          />
        </div>

        {/* Filters */}
        <Card className="card-institutional">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-fg-muted" />
              <Input
                placeholder="Search markets or assets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 input-institutional"
              />
            </div>
            <div className="flex gap-3">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="treasury">Treasury</SelectItem>
                  <SelectItem value="credit">Corporate Credit</SelectItem>
                  <SelectItem value="real-estate">Real Estate</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Markets Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredMarkets.map((market, index) => (
            <Card key={market.id} className="card-institutional hover-lift animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-h3 font-semibold text-fg-primary">{market.name}</h3>
                      {market.isPermissioned && (
                        <Badge variant="secondary" className="text-micro">
                          Permissioned
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="outline" 
                        className={getCategoryBadgeColor(market.category)}
                      >
                        {market.assetSymbol}
                      </Badge>
                      <span className="text-body-2 text-fg-muted">•</span>
                      <span className="text-body-2 text-fg-secondary">Min: {market.minInvestment}</span>
                    </div>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-micro text-fg-muted uppercase tracking-wide">Supply APY</p>
                    <p className="text-body-1 font-semibold text-brand-400 tabular-nums">{market.supplyApy}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-micro text-fg-muted uppercase tracking-wide">Borrow APY</p>
                    <p className="text-body-1 font-semibold text-fg-primary tabular-nums">{market.borrowApy}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-micro text-fg-muted uppercase tracking-wide">Total Supply</p>
                    <p className="text-body-2 text-fg-secondary tabular-nums">{market.totalSupply}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-micro text-fg-muted uppercase tracking-wide">Utilization</p>
                    <p className="text-body-2 text-fg-secondary tabular-nums">{market.utilization}</p>
                  </div>
                </div>

                {/* Risk Metrics */}
                <div className="border-t border-stroke-line pt-4">
                  <div className="grid grid-cols-2 gap-4 text-micro">
                    <div className="flex justify-between">
                      <span className="text-fg-muted">LLTV:</span>
                      <span className="text-fg-secondary font-medium tabular-nums">{market.lltv}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-fg-muted">Risk Premium:</span>
                      <span className="text-fg-secondary font-medium tabular-nums">{market.riskPremium}</span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p className="text-body-2 text-fg-muted leading-relaxed">
                  {market.description}
                </p>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <Button 
                    className="btn-primary flex-1"
                    onClick={() => window.location.href = `/market/${market.id}`}
                  >
                    View Market
                  </Button>
                  <Button variant="outline" className="flex-1">
                    Supply
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredMarkets.length === 0 && (
          <Card className="card-institutional">
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-fg-muted mx-auto mb-4" />
              <h3 className="text-h3 text-fg-primary mb-2">No markets found</h3>
              <p className="text-body-2 text-fg-muted">
                Try adjusting your search terms or filters.
              </p>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}