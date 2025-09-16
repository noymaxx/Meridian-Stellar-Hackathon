import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { KPICard } from "@/components/ui/kpi-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePools } from "@/hooks/usePools";
import { useWallet } from "@/hooks/useWallet";
import { useProvider } from "@/hooks/useProvider";
import { TokenCreationModal } from "@/components/TokenCreationModal";
import { RecentTokens } from "@/components/RecentTokens";
import { TokenStats } from "@/components/TokenStats";
import { LendingOperations } from "@/components/LendingOperations";
import { ContractInfo } from "@/components/ContractInfo";
import { UserPositions } from "@/components/UserPositions";
import { Search, TrendingUp, Users, BarChart3, DollarSign, Filter, RefreshCw, AlertCircle, Wallet, Building2, Activity } from "lucide-react";
import { toast } from "sonner";
import { disconnect } from "process";

export default function Markets() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  
  const { pools, stats, isLoading, error, refreshPools } = usePools();
  const { wallet, connect: connectWallet, disconnect: disconnectWallet, isConnected: walletConnected } = useWallet();
  const { contract, connect: connectProvider, isConnected: providerConnected } = useProvider();
  
  const filteredMarkets = pools.filter(pool => {
    const matchesSearch = pool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pool.pool_address.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getCategoryBadgeColor = (name: string) => {
    if (name.includes('USDC') || name.includes('USDT')) {
      return "bg-brand-500/10 text-brand-400 border-brand-500/20";
    } else if (name.includes('TBILL') || name.includes('BOND')) {
      return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    } else {
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    }
  };

  const handleConnect = async () => {
    try {
      await connectWallet();
      await connectProvider();
    } catch (error) {
      console.error('Connection failed:', error);
    }
  };

  const handleTokenCreated = (tokenAddress: string) => {
    console.log('Token created:', tokenAddress);
    // Refresh pools to show the new token
    refreshPools();
  };

  const handlePoolCreated = (poolAddress: string) => {
    console.log('Pool created:', poolAddress);
    // Refresh pools to show the new pool
    refreshPools();
    toast.success("Pool created successfully! Refreshing pool list...");
  };

  const handleDisconnect = () => {
    console.log('Disconnect button clicked');
    disconnectWallet();
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

        {/* Connection Status */}
        {(!walletConnected || !providerConnected) && (
          <Card className="card-institutional">
            <div className="text-center py-8">
              <Wallet className="h-12 w-12 text-fg-muted mx-auto mb-4" />
              <h3 className="text-h3 text-fg-primary mb-2">Connect to Stellar Network</h3>
              <p className="text-body-2 text-fg-muted mb-4">
                Connect your wallet to view and interact with pools from the smart contract.
              </p>
              <Button onClick={handleConnect} className="btn-primary">
                <Wallet className="h-4 w-4 mr-2" />
                Connect Wallet
              </Button>
            </div>
          </Card>
        )}

        {/* Wallet Connected Status */}
        {walletConnected && providerConnected && (
          <Card className="card-institutional">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <h3 className="text-h4 text-fg-primary">Wallet Connected</h3>
                  <p className="text-body-2 text-fg-muted">
                    {wallet?.publicKey ? `${wallet.publicKey.slice(0, 8)}...${wallet.publicKey.slice(-8)}` : 'Connected'}
                  </p>
                </div>
              </div>
              <Button 
                variant="outline" 
                onClick={handleDisconnect}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                Disconnect
              </Button>
            </div>
          </Card>
        )}

        {/* KPI Overview */}
        {walletConnected && providerConnected && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-slide-up">
            <KPICard
              title="Total Value Locked"
              value={stats.totalValueLocked}
              icon={DollarSign}
              trend="up"
              trendValue="Live Data"
            />
            <KPICard
              title="Active Markets"
              value={stats.totalMarkets.toString()}
              icon={BarChart3}
              subtitle="Smart Contract Pools"
            />
            <KPICard
              title="Average Utilization"
              value={stats.avgUtilization}
              icon={TrendingUp}
              trend="neutral"
              trendValue="Live Data"
            />
            <KPICard
              title="Total Users"
              value={stats.totalUsers.toString()}
              icon={Users}
              trend="up"
              trendValue="Estimated"
            />
          </div>
        )}

        {/* Token Stats */}
        {walletConnected && providerConnected && (
          <TokenStats />
        )}

        {/* Recent Tokens */}
        {walletConnected && providerConnected && (
          <RecentTokens />
        )}

        {/* Filters */}
        {walletConnected && providerConnected && (
          <Card className="card-institutional">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-fg-muted" />
                <Input
                  placeholder="Search pools or assets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 input-institutional"
                />
              </div>
              <div className="flex gap-3">
                <TokenCreationModal 
                  wallet={wallet}
                  onTokenCreated={handleTokenCreated}
                  onPoolCreated={handlePoolCreated}
                />
                <Button
                  variant="outline"
                  onClick={refreshPools}
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-48">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="stablecoin">Stablecoins</SelectItem>
                    <SelectItem value="treasury">Treasury Bills</SelectItem>
                    <SelectItem value="other">Other Assets</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>
        )}

        {/* Error State */}
        {error && (
          <Card className="card-institutional">
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <h3 className="text-h3 text-fg-primary mb-2">Error Loading Pools</h3>
              <p className="text-body-2 text-fg-muted mb-4">{error}</p>
              <Button onClick={refreshPools} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Try Again
              </Button>
            </div>
          </Card>
        )}

        {/* Loading State */}
        {isLoading && !error && walletConnected && providerConnected && (
          <Card className="card-institutional">
            <div className="text-center py-12">
              <RefreshCw className="h-12 w-12 text-fg-muted mx-auto mb-4 animate-spin" />
              <h3 className="text-h3 text-fg-primary mb-2">Loading Pools...</h3>
              <p className="text-body-2 text-fg-muted">
                Fetching data from smart contract...
              </p>
            </div>
          </Card>
        )}

        {/* Pools Grid */}
        {!isLoading && !error && walletConnected && providerConnected && (
          <div className="space-y-4">
            {/* Pools Summary */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-semibold text-fg-primary">
                  Available Pools ({filteredMarkets.length})
                </h2>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {filteredMarkets.length} Smart Contract Pools
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredMarkets.map((pool, index) => (
              <Card key={pool.pool_address} className="card-institutional hover-lift animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="text-h3 font-semibold text-fg-primary">{pool.name}</h3>
                        <Badge variant="secondary" className="text-micro">
                          {pool.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="outline" 
                          className={getCategoryBadgeColor(pool.name)}
                        >
                          {pool.name}
                        </Badge>
                        <span className="text-body-2 text-fg-muted">•</span>
                        <span className="text-body-2 text-fg-secondary">Min: ${pool.min_investment}</span>
                      </div>
                      <div className="text-xs text-fg-muted font-mono">
                        {pool.pool_address.slice(0, 8)}...{pool.pool_address.slice(-8)}
                      </div>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-micro text-fg-muted uppercase tracking-wide">Supply APY</p>
                      <p className="text-body-1 font-semibold text-brand-400 tabular-nums">{pool.supply_apy}%</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-micro text-fg-muted uppercase tracking-wide">Borrow APY</p>
                      <p className="text-body-1 font-semibold text-fg-primary tabular-nums">{pool.borrow_apy}%</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-micro text-fg-muted uppercase tracking-wide">Total Supply</p>
                      <p className="text-body-2 text-fg-secondary tabular-nums">${parseFloat(pool.total_supply || '0').toLocaleString()}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-micro text-fg-muted uppercase tracking-wide">Utilization</p>
                      <p className="text-body-2 text-fg-secondary tabular-nums">{pool.utilization_rate}%</p>
                    </div>
                  </div>

                  {/* Additional Metrics */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-micro text-fg-muted uppercase tracking-wide">Collateral Factor</p>
                      <p className="text-body-2 text-fg-secondary tabular-nums">{pool.collateral_factor}%</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-micro text-fg-muted uppercase tracking-wide">Liquidation Threshold</p>
                      <p className="text-body-2 text-fg-secondary tabular-nums">{pool.liquidation_threshold}%</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-micro text-fg-muted uppercase tracking-wide">Reserve Factor</p>
                      <p className="text-body-2 text-fg-secondary tabular-nums">{pool.reserve_factor}%</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-micro text-fg-muted uppercase tracking-wide">Interest Model</p>
                      <p className="text-body-2 text-fg-secondary tabular-nums">{pool.interest_rate_model}</p>
                    </div>
                  </div>

                  {/* Risk Metrics */}
                  <div className="border-t border-stroke-line pt-4">
                    <div className="grid grid-cols-2 gap-4 text-micro">
                      <div className="flex justify-between">
                        <span className="text-fg-muted">LLTV:</span>
                        <span className="text-fg-secondary font-medium tabular-nums">{pool.lltv}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-fg-muted">Risk Premium:</span>
                        <span className="text-fg-secondary font-medium tabular-nums">{pool.risk_premium}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-body-2 text-fg-muted leading-relaxed">
                    {pool.name} lending pool with {pool.utilization_rate}% utilization rate. 
                    Total supply of ${parseFloat(pool.total_supply || '0').toLocaleString()} with {pool.supply_apy}% supply APY.
                  </p>

                  {/* Actions */}
                  <div className="flex gap-3 pt-2">
                    <Button 
                      className="btn-primary flex-1"
                      onClick={() => disconnectWallet()}
                    >
                      View Pool
                    </Button>
                    <Button variant="outline" className="flex-1">
                      Supply
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
            </div>
          </div>
        )}

        {/* Contract Information */}
        {walletConnected && providerConnected && (
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Building2 className="h-6 w-6 text-brand-400" />
              <h2 className="text-2xl font-bold text-fg-primary">Contract Information</h2>
            </div>
            <ContractInfo />
          </div>
        )}

        {/* Lending Operations & User Positions */}
        {walletConnected && providerConnected && pools.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Activity className="h-6 w-6 text-brand-400" />
              <h2 className="text-2xl font-bold text-fg-primary">Lending Operations</h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <LendingOperations 
                poolAddress={pools[0]?.pool_address || ''} 
                availableTokens={[
                  { address: 'USDC_TOKEN_ADDRESS', symbol: 'USDC', name: 'USD Coin' },
                  { address: 'XLM_TOKEN_ADDRESS', symbol: 'XLM', name: 'Stellar Lumens' },
                  { address: 'BLND_TOKEN_ADDRESS', symbol: 'BLND', name: 'Blend Token' }
                ]}
              />
              <UserPositions poolAddress={pools[0]?.pool_address || ''} />
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && walletConnected && providerConnected && filteredMarkets.length === 0 && (
          <Card className="card-institutional">
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-fg-muted mx-auto mb-4" />
              <h3 className="text-h3 text-fg-primary mb-2">No pools found</h3>
              <p className="text-body-2 text-fg-muted mb-4">
                {searchTerm ? 'Try adjusting your search terms or filters.' : 'No active pools found in the smart contract.'}
              </p>
              {!searchTerm && (
                <Button onClick={refreshPools} disabled={isLoading}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh Pools
                </Button>
              )}
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}