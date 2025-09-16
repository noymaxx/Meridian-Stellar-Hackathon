import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Filter, 
  SortAsc, 
  SortDesc, 
  Grid3X3, 
  List,
  TrendingUp,
  DollarSign,
  Users,
  Activity,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { PoolCard } from './PoolCard';
import { SupplyModal } from './SupplyModal';
import { BorrowModal } from './BorrowModal';
import { EnhancedPoolData } from '@/types/markets';
import { BlendPool } from '@/types/blend';
import { cn } from '@/lib/utils';

interface MarketsDashboardProps {
  pools: EnhancedPoolData[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onViewPoolDetails: (poolAddress: string) => void;
  onSupply?: (poolAddress: string) => void; // Made optional since we'll handle modals internally
  onBorrow?: (poolAddress: string) => void; // Made optional since we'll handle modals internally
}

type SortField = 'tvl' | 'supplyAPY' | 'borrowAPY' | 'utilizationRate' | 'volume24h' | 'activeUsers';
type SortOrder = 'asc' | 'desc';
type ViewMode = 'grid' | 'list';

export const MarketsDashboard: React.FC<MarketsDashboardProps> = ({
  pools,
  loading,
  error,
  onRefresh,
  onViewPoolDetails,
  onSupply,
  onBorrow
}) => {
  // ===== STATE =====
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPoolType, setSelectedPoolType] = useState<string>('all');
  const [minAPY, setMinAPY] = useState<string>('');
  const [maxTVL, setMaxTVL] = useState<string>('');
  const [sortField, setSortField] = useState<SortField>('tvl');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showOnlyActive, setShowOnlyActive] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Modal states
  const [supplyModal, setSupplyModal] = useState<{ isOpen: boolean; pool: BlendPool | null }>({
    isOpen: false,
    pool: null
  });
  const [borrowModal, setBorrowModal] = useState<{ isOpen: boolean; pool: BlendPool | null }>({
    isOpen: false,
    pool: null
  });

  // ===== COMPUTED VALUES =====
  
  const marketStats = useMemo(() => {
    if (!pools.length) return null;
    
    const activePools = pools.filter(p => p.status === 'Active');
    const communityPools = pools.filter(p => p.poolType === 'community');
    const unverifiedCommunityPools = communityPools.filter(p => !p.verified);
    
    return {
      totalTVL: pools.reduce((sum, p) => sum + p.tvl, 0),
      averageSupplyAPY: pools.reduce((sum, p) => sum + p.supplyAPY, 0) / pools.length,
      averageBorrowAPY: pools.reduce((sum, p) => sum + p.borrowAPY, 0) / pools.length,
      totalVolume24h: pools.reduce((sum, p) => sum + p.volume24h, 0),
      totalUsers: pools.reduce((sum, p) => sum + p.activeUsers, 0),
      activePools: activePools.length,
      totalPools: pools.length,
      averageUtilization: pools.reduce((sum, p) => sum + p.utilizationRate, 0) / pools.length,
      communityPools: communityPools.length,
      unverifiedCommunityPools: unverifiedCommunityPools.length
    };
  }, [pools]);

  const filteredAndSortedPools = useMemo(() => {
    let filtered = pools;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(pool => 
        pool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pool.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pool.class.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Class filter
    if (selectedClass !== 'all') {
      filtered = filtered.filter(pool => pool.class === selectedClass);
    }

    // Status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(pool => pool.status === selectedStatus);
    }

    // Pool type filter
    if (selectedPoolType !== 'all') {
      if (selectedPoolType === 'official') {
        filtered = filtered.filter(pool => !pool.poolType || pool.poolType === 'official');
      } else if (selectedPoolType === 'community') {
        filtered = filtered.filter(pool => pool.poolType === 'community');
      } else if (selectedPoolType === 'verified') {
        filtered = filtered.filter(pool => pool.poolType === 'community' && pool.verified === true);
      } else if (selectedPoolType === 'unverified') {
        filtered = filtered.filter(pool => pool.poolType === 'community' && pool.verified === false);
      }
    }

    // Active pools only
    if (showOnlyActive) {
      filtered = filtered.filter(pool => pool.status === 'Active');
    }

    // APY filter
    if (minAPY) {
      const minAPYValue = parseFloat(minAPY);
      filtered = filtered.filter(pool => pool.supplyAPY >= minAPYValue);
    }

    // TVL filter
    if (maxTVL) {
      const maxTVLValue = parseFloat(maxTVL) * 1e6; // Convert to millions
      filtered = filtered.filter(pool => pool.tvl <= maxTVLValue);
    }

    // Sort
    filtered.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      return sortOrder === 'asc' 
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue));
    });

    return filtered;
  }, [pools, searchQuery, selectedClass, selectedStatus, selectedPoolType, showOnlyActive, minAPY, maxTVL, sortField, sortOrder]);

  // ===== UTILITY FUNCTIONS =====
  
  const formatCurrency = (amount: number): string => {
    if (amount >= 1e9) return `$${(amount / 1e9).toFixed(1)}B`;
    if (amount >= 1e6) return `$${(amount / 1e6).toFixed(1)}M`;
    if (amount >= 1e3) return `$${(amount / 1e3).toFixed(1)}K`;
    return `$${amount.toFixed(2)}`;
  };

  const formatPercent = (value: number): string => {
    return `${value.toFixed(2)}%`;
  };

  // Check if we should show community pool warnings
  const shouldShowCommunityWarning = useMemo(() => {
    if (selectedPoolType === 'community' || selectedPoolType === 'unverified') {
      return true;
    }
    if (selectedPoolType === 'all') {
      return filteredAndSortedPools.some(p => p.poolType === 'community');
    }
    return false;
  }, [selectedPoolType, filteredAndSortedPools]);
  
  const communityPoolsInView = useMemo(() => {
    return filteredAndSortedPools.filter(p => p.poolType === 'community');
  }, [filteredAndSortedPools]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedClass('all');
    setSelectedStatus('all');
    setSelectedPoolType('all');
    setMinAPY('');
    setMaxTVL('');
    setShowOnlyActive(false);
  };

  // ===== MODAL HANDLERS =====
  
  const handleSupplyClick = (poolAddress: string) => {
    const pool = pools.find(p => p.address === poolAddress);
    if (pool) {
      // Convert EnhancedPoolData to BlendPool format
      const blendPool: BlendPool = {
        address: pool.address,
        name: pool.name,
        class: pool.class,
        reserves: [], // Will be populated from the enhanced pool data
        backstopRate: 0.1, // Mock value
        status: pool.status,
        totalSupply: BigInt(Math.floor(pool.tvl * 1e6)),
        totalBorrowed: BigInt(Math.floor(pool.tvl * pool.utilizationRate * 1e6)),
        totalLiquidity: BigInt(Math.floor(pool.availableLiquidity * 1e6)),
        averageSupplyAPY: pool.supplyAPY,
        averageBorrowAPY: pool.borrowAPY,
        utilizationRate: pool.utilizationRate,
        createdAt: Date.now() - 86400000 * 30,
        lastUpdated: Date.now(),
        poolType: pool.poolType,
        creator: pool.creator,
        description: pool.description,
        category: pool.category,
        tags: pool.tags,
        verified: pool.verified,
        riskLevel: pool.riskLevel,
        website: pool.website,
        twitter: pool.twitter,
        github: pool.github
      };

      // Create mock reserves for the pool
      blendPool.reserves = [
        {
          asset: {
            code: 'USDC',
            contractAddress: 'CUSDCMOCKCONTRACTADDRESS',
            decimals: 6,
            symbol: 'USDC',
            name: 'USD Coin'
          },
          totalSupply: BigInt(Math.floor(pool.tvl * 0.6 * 1e6)),
          totalBorrowed: BigInt(Math.floor(pool.tvl * 0.6 * pool.utilizationRate * 1e6)),
          availableLiquidity: BigInt(Math.floor(pool.availableLiquidity * 0.6 * 1e6)),
          supplyAPY: pool.supplyAPY,
          borrowAPY: pool.borrowAPY,
          utilizationRate: pool.utilizationRate,
          collateralFactor: 0.8,
          liquidationFactor: 0.85,
          lastUpdated: Date.now(),
          enabled: true,
          borrowable: true
        },
        {
          asset: {
            code: 'XLM',
            contractAddress: 'CXLMMOCKCONTRACTADDRESS',
            decimals: 7,
            symbol: 'XLM',
            name: 'Stellar Lumens'
          },
          totalSupply: BigInt(Math.floor(pool.tvl * 0.4 * 1e7 / 0.12)),
          totalBorrowed: BigInt(Math.floor(pool.tvl * 0.4 * pool.utilizationRate * 1e7 / 0.12)),
          availableLiquidity: BigInt(Math.floor(pool.availableLiquidity * 0.4 * 1e7 / 0.12)),
          supplyAPY: pool.supplyAPY * 1.1,
          borrowAPY: pool.borrowAPY * 1.1,
          utilizationRate: pool.utilizationRate,
          collateralFactor: 0.7,
          liquidationFactor: 0.75,
          lastUpdated: Date.now(),
          enabled: true,
          borrowable: true
        }
      ];

      setSupplyModal({ isOpen: true, pool: blendPool });
    }
    
    // Also call the original handler if provided
    onSupply?.(poolAddress);
  };

  const handleBorrowClick = (poolAddress: string) => {
    const pool = pools.find(p => p.address === poolAddress);
    if (pool) {
      // Same conversion logic as supply
      const blendPool: BlendPool = {
        address: pool.address,
        name: pool.name,
        class: pool.class,
        reserves: [],
        backstopRate: 0.1,
        status: pool.status,
        totalSupply: BigInt(Math.floor(pool.tvl * 1e6)),
        totalBorrowed: BigInt(Math.floor(pool.tvl * pool.utilizationRate * 1e6)),
        totalLiquidity: BigInt(Math.floor(pool.availableLiquidity * 1e6)),
        averageSupplyAPY: pool.supplyAPY,
        averageBorrowAPY: pool.borrowAPY,
        utilizationRate: pool.utilizationRate,
        createdAt: Date.now() - 86400000 * 30,
        lastUpdated: Date.now(),
        poolType: pool.poolType,
        creator: pool.creator,
        description: pool.description,
        category: pool.category,
        tags: pool.tags,
        verified: pool.verified,
        riskLevel: pool.riskLevel,
        website: pool.website,
        twitter: pool.twitter,
        github: pool.github
      };

      // Create mock reserves
      blendPool.reserves = [
        {
          asset: {
            code: 'USDC',
            contractAddress: 'CUSDCMOCKCONTRACTADDRESS',
            decimals: 6,
            symbol: 'USDC',
            name: 'USD Coin'
          },
          totalSupply: BigInt(Math.floor(pool.tvl * 0.6 * 1e6)),
          totalBorrowed: BigInt(Math.floor(pool.tvl * 0.6 * pool.utilizationRate * 1e6)),
          availableLiquidity: BigInt(Math.floor(pool.availableLiquidity * 0.6 * 1e6)),
          supplyAPY: pool.supplyAPY,
          borrowAPY: pool.borrowAPY,
          utilizationRate: pool.utilizationRate,
          collateralFactor: 0.8,
          liquidationFactor: 0.85,
          lastUpdated: Date.now(),
          enabled: true,
          borrowable: true
        },
        {
          asset: {
            code: 'XLM',
            contractAddress: 'CXLMMOCKCONTRACTADDRESS',
            decimals: 7,
            symbol: 'XLM',
            name: 'Stellar Lumens'
          },
          totalSupply: BigInt(Math.floor(pool.tvl * 0.4 * 1e7 / 0.12)),
          totalBorrowed: BigInt(Math.floor(pool.tvl * 0.4 * pool.utilizationRate * 1e7 / 0.12)),
          availableLiquidity: BigInt(Math.floor(pool.availableLiquidity * 0.4 * 1e7 / 0.12)),
          supplyAPY: pool.supplyAPY * 1.1,
          borrowAPY: pool.borrowAPY * 1.1,
          utilizationRate: pool.utilizationRate,
          collateralFactor: 0.7,
          liquidationFactor: 0.75,
          lastUpdated: Date.now(),
          enabled: true,
          borrowable: true
        }
      ];

      setBorrowModal({ isOpen: true, pool: blendPool });
    }
    
    // Also call the original handler if provided
    onBorrow?.(poolAddress);
  };

  const closeSupplyModal = () => {
    setSupplyModal({ isOpen: false, pool: null });
  };

  const closeBorrowModal = () => {
    setBorrowModal({ isOpen: false, pool: null });
  };

  // ===== RENDER =====

  if (error) {
    return (
      <Card className="w-full bg-card border-stroke-line">
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center space-y-4">
            <AlertTriangle className="h-12 w-12 text-red-400 mx-auto" />
            <div>
              <h3 className="text-h3 font-semibold text-fg-primary">Failed to load markets</h3>
              <p className="text-body-2 text-fg-secondary mt-1">{error}</p>
            </div>
            <Button onClick={onRefresh} variant="outline" className="border-brand-400/20 hover:border-brand-400 hover:bg-brand-400/10 text-brand-400">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Community Pool Warning Banner */}
      {shouldShowCommunityWarning && communityPoolsInView.length > 0 && (
        <Card className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border-orange-500/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <h3 className="text-body-1 font-semibold text-orange-400">
                  Community Pools Notice
                </h3>
                <div className="text-body-2 text-fg-secondary space-y-1">
                  <p>
                    You are viewing community-developed pools ({communityPoolsInView.length} shown). 
                    These pools are created by community members and may carry additional risks.
                  </p>
                  <div className="flex flex-wrap gap-4 text-micro">
                    <span className="text-orange-400">
                      • Unverified: {communityPoolsInView.filter(p => !p.verified).length} pools
                    </span>
                    <span className="text-red-400">
                      • High/Experimental Risk: {communityPoolsInView.filter(p => p.riskLevel === 'High' || p.riskLevel === 'Experimental').length} pools
                    </span>
                    <span className="text-yellow-400">
                      • Degraded Status: {communityPoolsInView.filter(p => p.status === 'Degraded').length} pools
                    </span>
                  </div>
                  <p className="text-micro text-orange-400 font-medium">
                    ⚠️ Always DYOR (Do Your Own Research) before interacting with community pools.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Market Overview */}
      {marketStats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card className="bg-card border-stroke-line hover:border-brand-400/30 transition-all duration-300 hover:shadow-lg hover:shadow-brand-400/10 hover:scale-105 group">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 rounded-lg bg-brand-500/10 group-hover:bg-brand-500/20 transition-colors duration-300">
                  <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-brand-400 group-hover:scale-110 transition-transform duration-300" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-micro text-fg-muted uppercase tracking-wide">Total TVL</p>
                  <p className="text-lg sm:text-xl lg:text-h3 font-bold text-fg-primary tabular-nums truncate">{formatCurrency(marketStats.totalTVL)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-stroke-line hover:border-brand-400/30 transition-all duration-300 hover:shadow-lg hover:shadow-brand-400/10 hover:scale-105 group">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 rounded-lg bg-brand-500/10 group-hover:bg-brand-500/20 transition-colors duration-300">
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-brand-400 group-hover:scale-110 transition-transform duration-300" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-micro text-fg-muted uppercase tracking-wide">Avg Supply APY</p>
                  <p className="text-lg sm:text-xl lg:text-h3 font-bold text-brand-400 tabular-nums truncate">
                    {formatPercent(marketStats.averageSupplyAPY)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-stroke-line hover:border-brand-400/30 transition-all duration-300 hover:shadow-lg hover:shadow-brand-400/10 hover:scale-105 group">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 rounded-lg bg-brand-500/10 group-hover:bg-brand-500/20 transition-colors duration-300">
                  <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-brand-400 group-hover:scale-110 transition-transform duration-300" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-micro text-fg-muted uppercase tracking-wide">24h Volume</p>
                  <p className="text-lg sm:text-xl lg:text-h3 font-bold text-fg-primary tabular-nums truncate">{formatCurrency(marketStats.totalVolume24h)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-stroke-line hover:border-brand-400/30 transition-all duration-300 hover:shadow-lg hover:shadow-brand-400/10 hover:scale-105 group">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 rounded-lg bg-brand-500/10 group-hover:bg-brand-500/20 transition-colors duration-300">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 text-brand-400 group-hover:scale-110 transition-transform duration-300" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-micro text-fg-muted uppercase tracking-wide">Active Pools</p>
                  <p className="text-lg sm:text-xl lg:text-h3 font-bold text-fg-primary tabular-nums truncate">
                    {marketStats.activePools}/{marketStats.totalPools}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Controls */}
      <Card className="bg-card border-stroke-line">
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2 text-fg-primary text-lg sm:text-xl">
              <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-brand-400" />
              Lending Pools
              <Badge variant="outline" className="bg-brand-500/10 text-brand-400 border-brand-500/20 text-xs sm:text-sm">{filteredAndSortedPools.length}</Badge>
            </CardTitle>
            
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={loading}
                className="border-stroke-line hover:border-brand-400/50 hover:bg-brand-400/5 text-fg-secondary hover:text-brand-400 transition-all duration-300 hover:scale-105 disabled:hover:scale-100"
              >
                <RefreshCw className={cn("h-4 w-4 transition-transform duration-300", loading && "animate-spin")} />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="border-stroke-line hover:border-brand-400/50 hover:bg-brand-400/5 text-fg-secondary hover:text-brand-400 transition-all duration-300 hover:scale-105"
              >
                <Filter className="h-4 w-4 transition-transform duration-300 hover:rotate-12" />
                Filters
              </Button>
              
              <div className="flex items-center border border-stroke-line rounded-md bg-bg-elev-1">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    viewMode === 'grid' 
                      ? "bg-brand-400 text-white hover:bg-brand-500" 
                      : "text-fg-secondary hover:text-brand-400 hover:bg-brand-400/5"
                  )}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className={cn(
                    viewMode === 'list' 
                      ? "bg-brand-400 text-white hover:bg-brand-500" 
                      : "text-fg-secondary hover:text-brand-400 hover:bg-brand-400/5"
                  )}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 p-4 sm:p-6">
          {/* Search and Sort */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-fg-muted" />
              <Input
                placeholder="Search pools..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-bg-elev-1 border-stroke-line text-fg-primary placeholder:text-fg-muted focus:border-brand-400 focus:ring-brand-400/20 text-sm sm:text-base"
              />
            </div>
            
            <div className="flex gap-2 sm:gap-4">
              <Select value={sortField} onValueChange={(value) => setSortField(value as SortField)}>
                <SelectTrigger className="w-full sm:w-48 bg-bg-elev-1 border-stroke-line text-fg-primary hover:border-brand-400/50 text-sm sm:text-base">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tvl">Total Value Locked</SelectItem>
                  <SelectItem value="supplyAPY">Supply APY</SelectItem>
                  <SelectItem value="borrowAPY">Borrow APY</SelectItem>
                  <SelectItem value="utilizationRate">Utilization</SelectItem>
                  <SelectItem value="volume24h">24h Volume</SelectItem>
                  <SelectItem value="activeUsers">Active Users</SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                variant="outline"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="border-stroke-line hover:border-brand-400/50 hover:bg-brand-400/5 text-fg-secondary hover:text-brand-400 px-3 sm:px-4"
              >
                {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <Card className="bg-bg-elev-1 border-stroke-line">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-fg-primary">Filters</h4>
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="text-fg-muted hover:text-brand-400 hover:bg-brand-400/5">
                    Clear All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label className="text-fg-secondary">Pool Class</Label>
                    <Select value={selectedClass} onValueChange={setSelectedClass}>
                      <SelectTrigger className="bg-bg-elev-2 border-stroke-line text-fg-primary hover:border-brand-400/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Classes</SelectItem>
                        <SelectItem value="TBill">T-Bills</SelectItem>
                        <SelectItem value="Receivables">Receivables</SelectItem>
                        <SelectItem value="CRE">Commercial Real Estate</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-fg-secondary">Status</Label>
                    <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                      <SelectTrigger className="bg-bg-elev-2 border-stroke-line text-fg-primary hover:border-brand-400/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Paused">Paused</SelectItem>
                        <SelectItem value="Degraded">Degraded</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-fg-secondary">Pool Type</Label>
                    <Select value={selectedPoolType} onValueChange={setSelectedPoolType}>
                      <SelectTrigger className="bg-bg-elev-2 border-stroke-line text-fg-primary hover:border-brand-400/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="official">Official Pools</SelectItem>
                        <SelectItem value="community">Community Pools</SelectItem>
                        <SelectItem value="verified">Verified Community</SelectItem>
                        <SelectItem value="unverified">Unverified Community</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-fg-secondary">Min Supply APY (%)</Label>
                    <Input
                      type="number"
                      placeholder="e.g., 5.0"
                      value={minAPY}
                      onChange={(e) => setMinAPY(e.target.value)}
                      className="bg-bg-elev-2 border-stroke-line text-fg-primary placeholder:text-fg-muted focus:border-brand-400 focus:ring-brand-400/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-fg-secondary">Max TVL (Millions)</Label>
                    <Input
                      type="number"
                      placeholder="e.g., 100"
                      value={maxTVL}
                      onChange={(e) => setMaxTVL(e.target.value)}
                      className="bg-bg-elev-2 border-stroke-line text-fg-primary placeholder:text-fg-muted focus:border-brand-400 focus:ring-brand-400/20"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="active-only"
                      checked={showOnlyActive}
                      onCheckedChange={setShowOnlyActive}
                    />
                    <Label htmlFor="active-only" className="text-fg-secondary">Active pools only</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Separator className="bg-stroke-line" />

          {/* Pools Grid/List */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="h-80 animate-pulse bg-card border-stroke-line">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="h-4 bg-bg-elev-2 rounded w-3/4" />
                      <div className="h-3 bg-bg-elev-2 rounded w-1/2" />
                      <div className="h-8 bg-bg-elev-2 rounded" />
                      <div className="space-y-2">
                        <div className="h-3 bg-bg-elev-2 rounded" />
                        <div className="h-3 bg-bg-elev-2 rounded w-2/3" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredAndSortedPools.length > 0 ? (
            <div className={cn(
              viewMode === 'grid' 
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                : "space-y-4"
            )}>
              {filteredAndSortedPools.map((pool) => (
                <PoolCard
                  key={pool.address}
                  pool={pool}
                  onViewDetails={onViewPoolDetails}
                  onSupply={handleSupplyClick}
                  onBorrow={handleBorrowClick}
                  compact={viewMode === 'list'}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Activity className="h-12 w-12 text-fg-muted mx-auto mb-4" />
              <h3 className="text-h3 font-medium text-fg-primary mb-2">No pools found</h3>
              <p className="text-body-2 text-fg-secondary mb-4">
                Try adjusting your filters or search terms.
              </p>
              <Button variant="outline" onClick={clearFilters} className="border-brand-400/20 hover:border-brand-400 hover:bg-brand-400/10 text-brand-400">
                Clear Filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Supply Modal */}
      {supplyModal.pool && (
        <SupplyModal
          isOpen={supplyModal.isOpen}
          onClose={closeSupplyModal}
          pool={supplyModal.pool}
        />
      )}

      {/* Borrow Modal */}
      {borrowModal.pool && (
        <BorrowModal
          isOpen={borrowModal.isOpen}
          onClose={closeBorrowModal}
          pool={borrowModal.pool}
        />
      )}
    </div>
  );
};