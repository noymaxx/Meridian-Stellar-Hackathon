import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { FallbackPricingService } from '@/lib/pricing/fallback-pricing';

// Icons
import { 
  ArrowLeft,
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign, 
  Activity,
  AlertTriangle,
  CheckCircle,
  Zap,
  Shield,
  BarChart3,
  ExternalLink,
  RefreshCw,
  Info,
  Settings,
  History,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Copy,
  Eye,
  EyeOff
} from 'lucide-react';

// Hooks
import { useBlendPools } from '@/hooks/markets/useBlendPools';
import { useEnhancedPoolData } from '@/hooks/markets/useDefIndexData';
import { useSRWAMarkets } from '@/hooks/markets/useSRWAMarkets';
import { useWallet } from '@/components/wallet/WalletProvider';
import { LendingModal } from '@/components/markets/LendingModal';

// Types
import type { SRWAMarketData } from '@/hooks/markets/useSRWAMarkets';
import { cn } from '@/lib/utils';
import type { AssetPrice } from '@/lib/pricing/fallback-pricing';

export default function PoolDetail() {
  const { id: poolId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isConnected } = useWallet();
  
  // State
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');
  const [showAddresses, setShowAddresses] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [realTimePrices, setRealTimePrices] = useState<Record<string, AssetPrice>>({});
  const [pricingService] = useState(() => new FallbackPricingService());
  
  // Lending modal state
  const [lendingModal, setLendingModal] = useState<{
    isOpen: boolean;
    mode: 'supply' | 'borrow';
  }>({
    isOpen: false,
    mode: 'supply'
  });

  // Data fetching
  const { pools: blendPools, loading: poolsLoading, refetch: refetchPools } = useBlendPools();
  const { enhancedPools, loading: analyticsLoading } = useEnhancedPoolData(blendPools);
  const { srwaMarkets, loading: srwaLoading, refetch: refetchSRWA } = useSRWAMarkets();

  // Find the specific pool
  const pool = useMemo(() => {
    // First check enhanced Blend pools
    const blendPool = enhancedPools.find(p => p.address === poolId);
    if (blendPool) return { ...blendPool, marketType: 'blend' as const };
    
    // Then check SRWA markets
    const srwaPool = srwaMarkets.find(p => p.address === poolId);
    if (srwaPool) return srwaPool;
    
    return null;
  }, [enhancedPools, srwaMarkets, poolId]);

  const loading = poolsLoading || analyticsLoading || srwaLoading;

  // Fetch real-time prices for the pool assets
  useEffect(() => {
    if (!pool) return;
    
    const fetchPrices = async () => {
      try {
        // For SRWA tokens, get the underlying asset price
        const assetSymbol = pool.marketType === 'srwa' 
          ? 'USDC' // Most SRWA tokens are pegged to USD
          : 'XLM';  // Blend pools typically use XLM
        
        const price = await pricingService.getPrice(assetSymbol);
        setRealTimePrices(prev => ({ ...prev, [assetSymbol]: price }));
        
        console.log(`💰 [PoolDetail] Fetched real-time price for ${assetSymbol}: $${price.price}`);
      } catch (error) {
        console.warn('Failed to fetch real-time prices:', error);
      }
    };
    
    fetchPrices();
    
    // Update prices every 30 seconds
    const interval = setInterval(fetchPrices, 30000);
    return () => clearInterval(interval);
  }, [pool, pricingService]);

  // Utility functions
  const formatCurrency = (amount: number): string => {
    if (isNaN(amount) || !isFinite(amount)) return "$0.00";
    if (amount >= 1e9) return `$${(amount / 1e9).toFixed(2)}B`;
    if (amount >= 1e6) return `$${(amount / 1e6).toFixed(2)}M`;
    if (amount >= 1e3) return `$${(amount / 1e3).toFixed(2)}K`;
    return `$${amount.toFixed(2)}`;
  };

  const formatPercent = (value: number): string => {
    if (isNaN(value) || value === 0 || !isFinite(value)) return "—";
    return `${value.toFixed(2)}%`;
  };

  const formatNumber = (value: number): string => {
    if (isNaN(value) || !isFinite(value)) return "0";
    return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Address copied to clipboard');
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchPools(), refetchSRWA()]);
      toast.success('Pool data refreshed');
    } catch (error) {
      toast.error('Failed to refresh data');
    } finally {
      setRefreshing(false);
    }
  };

  const openLendingModal = (mode: 'supply' | 'borrow') => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }
    setLendingModal({ isOpen: true, mode });
  };

  const closeLendingModal = () => {
    setLendingModal({ isOpen: false, mode: 'supply' });
  };

  // Get status indicator
  const getStatusIndicator = (status: string) => {
    const config = {
      'Active': { color: 'bg-green-500', text: 'text-green-400', label: 'Active' },
      'Paused': { color: 'bg-yellow-500', text: 'text-yellow-400', label: 'Paused' },
      'Degraded': { color: 'bg-red-500', text: 'text-red-400', label: 'Degraded' }
    };
    
    const statusConfig = config[status as keyof typeof config] || config.Active;
    
    return (
      <div className="flex items-center gap-2">
        <div className={cn("w-2 h-2 rounded-full animate-pulse", statusConfig.color)} />
        <span className={cn("text-sm font-medium", statusConfig.text)}>
          {statusConfig.label}
        </span>
      </div>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-bg-black">
        <Header />
        <main className="container mx-auto max-w-7xl px-6 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-bg-elev-2 rounded w-1/3"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-64 bg-bg-elev-1 rounded border border-stroke-line"></div>
                <div className="h-96 bg-bg-elev-1 rounded border border-stroke-line"></div>
              </div>
              <div className="space-y-6">
                <div className="h-48 bg-bg-elev-1 rounded border border-stroke-line"></div>
                <div className="h-64 bg-bg-elev-1 rounded border border-stroke-line"></div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Pool not found
  if (!pool) {
    return (
      <div className="min-h-screen bg-bg-black">
        <Header />
        <main className="container mx-auto max-w-7xl px-6 py-8">
          <Card className="bg-card border-stroke-line">
            <CardContent className="flex items-center justify-center p-12">
              <div className="text-center space-y-4">
                <AlertTriangle className="h-12 w-12 text-orange-400 mx-auto" />
                <div>
                  <h2 className="text-h2 font-semibold text-fg-primary mb-2">Pool Not Found</h2>
                  <p className="text-body-2 text-fg-secondary mb-4">
                    The pool with ID "{poolId}" could not be found.
                  </p>
                  <Button 
                    onClick={() => navigate('/markets')} 
                    variant="outline"
                    className="border-stroke-line hover:border-brand-400/50 hover:bg-brand-400/5 text-fg-secondary hover:text-brand-400"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Markets
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-black">
      <Header />
      
      <main className="container mx-auto max-w-7xl px-6 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/markets')}
              className="hover:bg-bg-elev-1 text-fg-secondary hover:text-brand-400"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Markets
            </Button>
            
            <div>
              <h1 className="text-h1 font-semibold text-fg-primary flex items-center gap-3">
                {pool.name}
                {getStatusIndicator(pool.status)}
              </h1>
              <div className="flex items-center gap-3 mt-2">
                <Badge variant="outline" className="bg-brand-500/10 text-brand-400 border-brand-500/20">
                  {pool.class}
                </Badge>
                {pool.marketType === 'srwa' && (
                  <Badge variant="outline" className="bg-brand-500/10 text-brand-400 border-brand-500/20">
                    <Zap className="h-3 w-3 mr-1" />
                    SRWA Token
                  </Badge>
                )}
                {pool.poolType === 'community' && (
                  <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/20">
                    <Users className="h-3 w-3 mr-1" />
                    Community
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="border-stroke-line hover:border-brand-400/50 hover:bg-brand-400/5 text-fg-secondary hover:text-brand-400"
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
              Refresh
            </Button>
            
            <Button 
              onClick={() => openLendingModal('supply')}
              className="bg-brand-500 hover:bg-brand-600 text-white"
              disabled={pool.status !== 'Active'}
            >
              <ArrowUpRight className="h-4 w-4 mr-2" />
              Supply
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => openLendingModal('borrow')}
              disabled={pool.status !== 'Active'}
              className="border-orange-500/20 hover:border-orange-500 hover:bg-orange-500/10 text-orange-400"
            >
              <ArrowDownLeft className="h-4 w-4 mr-2" />
              Borrow
            </Button>
          </div>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-card border-stroke-line hover:border-brand-400/30 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-brand-500/10 rounded-lg">
                  <DollarSign className="h-5 w-5 text-brand-400" />
                </div>
                <div>
                  <p className="text-micro text-fg-muted uppercase tracking-wide">Total Value Locked</p>
                  <p className="text-h3 font-bold text-fg-primary tabular-nums">{formatCurrency(pool.tvl)}</p>
                  {realTimePrices.USDC && (
                    <p className="text-micro text-fg-muted">
                      Live price: ${realTimePrices.USDC.price.toFixed(3)} ({realTimePrices.USDC.source})
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-stroke-line hover:border-brand-400/30 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-brand-500/10 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-brand-400" />
                </div>
                <div>
                  <p className="text-micro text-fg-muted uppercase tracking-wide">Supply APY</p>
                  <p className="text-h3 font-bold text-brand-400 tabular-nums">{formatPercent(pool.supplyAPY)}</p>
                  <p className="text-micro text-fg-muted">Earn yield by supplying</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-stroke-line hover:border-brand-400/30 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/10 rounded-lg">
                  <TrendingDown className="h-5 w-5 text-orange-400" />
                </div>
                <div>
                  <p className="text-micro text-fg-muted uppercase tracking-wide">Borrow APY</p>
                  <p className="text-h3 font-bold text-orange-400 tabular-nums">{formatPercent(pool.borrowAPY)}</p>
                  <p className="text-micro text-fg-muted">Cost to borrow</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-stroke-line hover:border-brand-400/30 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-micro text-fg-muted uppercase tracking-wide">Utilization</p>
                  <p className="text-h3 font-bold text-purple-400 tabular-nums">{formatPercent(pool.utilizationRate)}</p>
                  <p className="text-micro text-fg-muted">Pool efficiency</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Details */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-6 bg-bg-elev-1 border-stroke-line">
                <TabsTrigger value="overview" className="data-[state=active]:bg-brand-500/10 data-[state=active]:text-brand-400">Overview</TabsTrigger>
                <TabsTrigger value="analytics" className="data-[state=active]:bg-brand-500/10 data-[state=active]:text-brand-400">Analytics</TabsTrigger>
                <TabsTrigger value="positions" className="data-[state=active]:bg-brand-500/10 data-[state=active]:text-brand-400">Positions</TabsTrigger>
                <TabsTrigger value="transactions" className="data-[state=active]:bg-brand-500/10 data-[state=active]:text-brand-400">History</TabsTrigger>
                <TabsTrigger value="risk" className="data-[state=active]:bg-brand-500/10 data-[state=active]:text-brand-400">Risk</TabsTrigger>
                <TabsTrigger value="admin" className="data-[state=active]:bg-brand-500/10 data-[state=active]:text-brand-400">Admin</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                <Card className="bg-card border-stroke-line">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-fg-primary">
                      <BarChart3 className="h-5 w-5 text-brand-400" />
                      Pool Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Utilization Bar */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-body-2 font-medium text-fg-secondary">Pool Utilization</span>
                        <span className="text-body-2 text-fg-muted tabular-nums">{formatPercent(pool.utilizationRate)}</span>
                      </div>
                      <div className="relative h-3 bg-bg-elev-2 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-brand-400 transition-all duration-700 rounded-full"
                          style={{ width: `${Math.min(100, pool.utilizationRate)}%` }}
                        />
                      </div>
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <p className="text-micro text-fg-muted uppercase tracking-wide mb-1">Total Supplied</p>
                        <p className="text-body-1 font-semibold text-fg-primary tabular-nums">{formatCurrency(pool.suppliedAmount || 0)}</p>
                      </div>
                      <div>
                        <p className="text-micro text-fg-muted uppercase tracking-wide mb-1">Total Borrowed</p>
                        <p className="text-body-1 font-semibold text-fg-primary tabular-nums">{formatCurrency(pool.borrowedAmount || 0)}</p>
                      </div>
                      <div>
                        <p className="text-micro text-fg-muted uppercase tracking-wide mb-1">Available Liquidity</p>
                        <p className="text-body-1 font-semibold text-brand-400 tabular-nums">{formatCurrency(pool.availableLiquidity)}</p>
                      </div>
                      <div>
                        <p className="text-micro text-fg-muted uppercase tracking-wide mb-1">Active Users</p>
                        <p className="text-body-1 font-semibold text-fg-primary tabular-nums">{formatNumber(pool.activeUsers)}</p>
                      </div>
                    </div>

                    <Separator className="bg-stroke-line" />

                    {/* Performance Metrics - Real Data Focus */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-fg-primary">Performance & Real-Time Data</h4>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-micro text-fg-muted uppercase tracking-wide mb-1">24h Volume</p>
                          <p className="text-body-1 font-semibold text-fg-primary tabular-nums">{formatCurrency(pool.volume24h)}</p>
                          <p className="text-micro text-fg-muted">Network activity</p>
                        </div>
                        <div>
                          <p className="text-micro text-fg-muted uppercase tracking-wide mb-1">Net APY</p>
                          <p className="text-body-1 font-semibold text-brand-400 tabular-nums">{formatPercent(pool.netAPY || pool.supplyAPY)}</p>
                          <p className="text-micro text-fg-muted">Effective yield</p>
                        </div>
                        <div>
                          <p className="text-micro text-fg-muted uppercase tracking-wide mb-1">Health Factor</p>
                          <p className="text-body-1 font-semibold text-fg-primary tabular-nums">{(pool.averageHealthFactor || 2.5).toFixed(2)}</p>
                          <p className="text-micro text-fg-muted">Pool safety</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Pool Information */}
                <Card className="bg-card border-stroke-line">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-fg-primary">
                      <Info className="h-5 w-5 text-brand-400" />
                      Pool Information & Live Data
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-micro text-fg-muted uppercase tracking-wide mb-1">Pool Address</p>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="text-micro bg-bg-elev-2 px-2 py-1 rounded font-mono text-fg-primary">
                            {showAddresses ? pool.address : `${pool.address.slice(0, 8)}...${pool.address.slice(-8)}`}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowAddresses(!showAddresses)}
                            className="hover:bg-bg-elev-1 text-fg-muted hover:text-brand-400"
                          >
                            {showAddresses ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(pool.address)}
                            className="hover:bg-bg-elev-1 text-fg-muted hover:text-brand-400"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {pool.marketType === 'srwa' && (
                        <div>
                          <p className="text-micro text-fg-muted uppercase tracking-wide mb-1">Token Contract</p>
                          <div className="flex items-center gap-2 mt-1">
                            <code className="text-micro bg-bg-elev-2 px-2 py-1 rounded font-mono text-fg-primary">
                              {showAddresses ? (pool as SRWAMarketData).tokenContract : `${(pool as SRWAMarketData).tokenContract.slice(0, 8)}...${(pool as SRWAMarketData).tokenContract.slice(-8)}`}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard((pool as SRWAMarketData).tokenContract)}
                              className="hover:bg-bg-elev-1 text-fg-muted hover:text-brand-400"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Oracle Price Data */}
                    {Object.keys(realTimePrices).length > 0 && (
                      <div className="p-4 bg-bg-elev-1 rounded-lg border border-stroke-line">
                        <h5 className="text-body-2 font-semibold text-fg-primary mb-3">Live Oracle Data</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {Object.entries(realTimePrices).map(([asset, price]) => (
                            <div key={asset} className="flex justify-between items-center">
                              <span className="text-micro text-fg-muted uppercase tracking-wide">{asset}</span>
                              <div className="text-right">
                                <span className="text-body-2 font-semibold text-brand-400 tabular-nums">
                                  ${price.price.toFixed(4)}
                                </span>
                                <p className="text-micro text-fg-muted">
                                  {price.source} • {new Date(price.timestamp).toLocaleTimeString()}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-4">
                      <Badge variant={pool.status === 'Active' ? 'default' : 'destructive'} className="bg-brand-500/10 text-brand-400 border-brand-500/20">
                        {pool.status}
                      </Badge>
                      <Badge variant="outline" className="border-stroke-line text-fg-muted">
                        Data: {pool.dataFreshness || 'Fresh'}
                      </Badge>
                      {pool.marketType === 'srwa' && (pool as SRWAMarketData).isUserAdmin && (
                        <Badge variant="outline" className="bg-brand-500/10 text-brand-400 border-brand-500/20">
                          Admin Access
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Analytics Tab */}
              <TabsContent value="analytics" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Pool Analytics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12">
                      <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Analytics Coming Soon</h3>
                      <p className="text-gray-600">
                        Detailed charts and analytics for this pool will be available soon.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Positions Tab */}
              <TabsContent value="positions" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Your Positions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isConnected ? (
                      <div className="text-center py-12">
                        <Wallet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Positions Found</h3>
                        <p className="text-gray-600 mb-4">
                          You don't have any active positions in this pool yet.
                        </p>
                        <div className="flex gap-3 justify-center">
                          <Button onClick={() => openLendingModal('supply')}>
                            Start Supplying
                          </Button>
                          <Button variant="outline" onClick={() => openLendingModal('borrow')}>
                            Borrow Assets
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Wallet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Connect Wallet</h3>
                        <p className="text-gray-600">
                          Connect your wallet to view your positions in this pool.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Transactions Tab */}
              <TabsContent value="transactions" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Transaction History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12">
                      <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Transaction History</h3>
                      <p className="text-gray-600">
                        Transaction history for this pool will be displayed here.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Risk Tab */}
              <TabsContent value="risk" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Risk Assessment
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Risk Score</p>
                        <p className="text-lg font-semibold">{pool.riskScore || 0}/100</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Risk Level</p>
                        <Badge variant={pool.riskLevel === 'Low' ? 'default' : pool.riskLevel === 'Medium' ? 'secondary' : 'destructive'}>
                          {pool.riskLevel || 'Medium'}
                        </Badge>
                      </div>
                    </div>

                    {pool.poolType === 'community' && (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          This is a community pool. Please do your own research before interacting with it.
                          Community pools may have different risk profiles and are not audited by the core team.
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Admin Tab */}
              <TabsContent value="admin" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Admin Functions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {pool.marketType === 'srwa' && (pool as SRWAMarketData).isUserAdmin ? (
                      <div className="space-y-4">
                        <Alert>
                          <CheckCircle className="h-4 w-4" />
                          <AlertDescription>
                            You have admin access to this SRWA token. You can manage pool settings and integrations.
                          </AlertDescription>
                        </Alert>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <Button variant="outline" className="w-full">
                            <Settings className="h-4 w-4 mr-2" />
                            Pool Settings
                          </Button>
                          <Button variant="outline" className="w-full">
                            <Shield className="h-4 w-4 mr-2" />
                            Risk Parameters
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Admin Access</h3>
                        <p className="text-gray-600">
                          You don't have admin permissions for this pool.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Quick Actions & Info */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="bg-card border-stroke-line">
              <CardHeader>
                <CardTitle className="text-fg-primary">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  className="w-full bg-brand-500 hover:bg-brand-600 text-white"
                  onClick={() => openLendingModal('supply')}
                  disabled={pool.status !== 'Active'}
                >
                  <ArrowUpRight className="h-4 w-4 mr-2" />
                  Supply Assets
                </Button>
                
                <Button 
                  variant="outline"
                  className="w-full border-orange-500/20 hover:border-orange-500 hover:bg-orange-500/10 text-orange-400"
                  onClick={() => openLendingModal('borrow')}
                  disabled={pool.status !== 'Active'}
                >
                  <ArrowDownLeft className="h-4 w-4 mr-2" />
                  Borrow Assets
                </Button>

                <Separator className="bg-stroke-line" />

                <Button 
                  variant="outline"
                  className="w-full border-stroke-line hover:border-brand-400/50 hover:bg-brand-400/5 text-fg-secondary hover:text-brand-400"
                  onClick={() => window.open(`https://stellar.expert/explorer/testnet/contract/${pool.address}`, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View on Explorer
                </Button>

                {pool.marketType === 'srwa' && (
                  <Button 
                    variant="outline"
                    className="w-full border-stroke-line hover:border-brand-400/50 hover:bg-brand-400/5 text-fg-secondary hover:text-brand-400"
                    onClick={() => window.open(`https://stellar.expert/explorer/testnet/contract/${(pool as SRWAMarketData).tokenContract}`, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Token Contract
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Pool Stats */}
            <Card className="bg-card border-stroke-line">
              <CardHeader>
                <CardTitle className="text-fg-primary">Pool Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-body-2 text-fg-muted">Net APY</span>
                    <span className="text-body-2 font-medium text-brand-400 tabular-nums">{formatPercent(pool.netAPY || pool.supplyAPY)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-body-2 text-fg-muted">24h Performance</span>
                    <span className={cn(
                      "text-body-2 font-medium tabular-nums",
                      (pool.performance24h || 0) >= 0 ? 'text-brand-400' : 'text-orange-400'
                    )}>
                      {(pool.performance24h || 0) >= 0 ? '+' : ''}{formatPercent((pool.performance24h || 0) * 100)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-body-2 text-fg-muted">Liquidation Rate</span>
                    <span className="text-body-2 font-medium text-fg-primary tabular-nums">{formatPercent(pool.liquidationRate || 2.5)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-body-2 text-fg-muted">Health Factor</span>
                    <span className="text-body-2 font-medium text-fg-primary tabular-nums">{(pool.averageHealthFactor || 2.8).toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Risk Warning for Community Pools */}
            {pool.poolType === 'community' && (
              <Alert className="bg-orange-500/10 border-orange-500/20">
                <AlertTriangle className="h-4 w-4 text-orange-400" />
                <AlertDescription className="text-fg-secondary">
                  <strong className="text-orange-400">Community Pool Notice:</strong> This pool is created and managed by community members. 
                  Always verify the pool parameters and do your own research before participating.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      </main>

      {/* Lending Modal */}
      <LendingModal
        isOpen={lendingModal.isOpen}
        onClose={closeLendingModal}
        pool={pool}
        mode={lendingModal.mode}
        onTransactionComplete={() => {
          handleRefresh();
          closeLendingModal();
        }}
      />
    </div>
  );
}
