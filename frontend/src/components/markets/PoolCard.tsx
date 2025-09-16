import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Users, 
  DollarSign, 
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowUpRight,
  Zap,
  Shield
} from 'lucide-react';
import { EnhancedPoolData } from '@/types/markets';
import { cn } from '@/lib/utils';

interface PoolCardProps {
  pool: EnhancedPoolData;
  onViewDetails: (poolAddress: string) => void;
  onSupply: (poolAddress: string) => void;
  onBorrow: (poolAddress: string) => void;
  compact?: boolean;
  showActions?: boolean;
}

export const PoolCard: React.FC<PoolCardProps> = ({ 
  pool, 
  onViewDetails, 
  onSupply, 
  onBorrow,
  compact = false,
  showActions = true 
}) => {
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

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-brand-400" />;
      case 'down':
        return <TrendingDown className="h-3 w-3 text-red-400" />;
      default:
        return <Minus className="h-3 w-3 text-fg-muted" />;
    }
  };

  const getStatusIndicator = (status: EnhancedPoolData['status']) => {
    const config = {
      'Active': { color: 'bg-brand-400', pulse: true },
      'Paused': { color: 'bg-yellow-400', pulse: false },
      'Degraded': { color: 'bg-red-400', pulse: false }
    };
    
    const statusConfig = config[status];
    
    return (
      <div className="flex items-center gap-2">
        <div className={cn(
          "w-2 h-2 rounded-full",
          statusConfig.color,
          statusConfig.pulse && "animate-pulse"
        )} />
        <span className="text-micro text-fg-secondary uppercase tracking-wide">
          {status}
        </span>
      </div>
    );
  };

  const getClassBadge = (poolClass: EnhancedPoolData['class']) => {
    const configs = {
      'TBill': { color: 'bg-brand-500/10 text-brand-400 border-brand-500/20', icon: Shield },
      'Receivables': { color: 'bg-purple-500/10 text-purple-400 border-purple-500/20', icon: Activity },
      'CRE': { color: 'bg-orange-500/10 text-orange-400 border-orange-500/20', icon: DollarSign }
    };
    
    const config = configs[poolClass];
    const Icon = config.icon;
    
    return (
      <Badge variant="outline" className={cn("flex items-center gap-1", config.color)}>
        <Icon className="h-3 w-3" />
        {poolClass}
      </Badge>
    );
  };

  const getRiskIndicator = (riskScore: number) => {
    if (riskScore < 0.3) return { color: 'text-brand-400', label: 'Low Risk' };
    if (riskScore < 0.6) return { color: 'text-yellow-400', label: 'Medium Risk' };
    return { color: 'text-red-400', label: 'High Risk' };
  };

  const getUtilizationColor = (rate: number) => {
    if (rate < 0.5) return 'bg-brand-400';
    if (rate < 0.8) return 'bg-yellow-400';
    return 'bg-red-400';
  };

  const risk = getRiskIndicator(pool.riskScore);

  // ===== RENDER =====

  return (
    <Card className={cn(
      "group relative overflow-hidden transition-all duration-500 hover:border-brand-400/50 bg-card border-stroke-line hover:shadow-xl hover:shadow-brand-400/20 hover:scale-[1.02] hover:-translate-y-1",
      compact ? "h-64" : "h-auto min-h-[320px]"
    )}>
      {/* Top gradient indicator */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-400 to-transparent opacity-60 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Subtle background glow on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-400/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <CardContent className="p-6 space-y-6">
        {/* Header Section */}
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            <div>
              <h3 className="text-h3 font-semibold text-fg-primary mb-1">
                {pool.name}
              </h3>
              <div className="flex items-center gap-3">
                {getClassBadge(pool.class)}
                {getStatusIndicator(pool.status)}
              </div>
            </div>
          </div>
          
          <div className="text-right space-y-1">
            <div className="text-micro text-fg-muted uppercase tracking-wide">Total Value Locked</div>
            <div className="text-h3 font-bold text-fg-primary tabular-nums">
              {formatCurrency(pool.tvl)}
            </div>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-brand-400" />
              <span className="text-micro text-fg-muted uppercase tracking-wide">Supply APY</span>
              {getTrendIcon(pool.apyTrend)}
            </div>
            <div className="text-body-1 font-semibold text-brand-400 tabular-nums">
              {formatPercent(pool.supplyAPY)}
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-fg-muted" />
              <span className="text-micro text-fg-muted uppercase tracking-wide">Borrow APY</span>
              {getTrendIcon(pool.apyTrend)}
            </div>
            <div className="text-body-1 font-semibold text-fg-primary tabular-nums">
              {formatPercent(pool.borrowAPY)}
            </div>
          </div>
        </div>

        {/* Utilization Bar */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-micro text-fg-muted uppercase tracking-wide">Pool Utilization</span>
            <span className="text-body-2 font-medium text-fg-secondary tabular-nums">
              {formatPercent(pool.utilizationRate * 100)}
            </span>
          </div>
          <div className="relative h-2 bg-bg-elev-2 rounded-full overflow-hidden group-hover:h-2.5 transition-all duration-300">
            <div 
              className={cn(
                "h-full transition-all duration-700 rounded-full relative overflow-hidden",
                getUtilizationColor(pool.utilizationRate)
              )}
              style={{ width: `${pool.utilizationRate * 100}%` }}
            >
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </div>
          </div>
        </div>

        {!compact && (
          <>
            {/* Secondary Metrics */}
            <div className="grid grid-cols-2 gap-4 py-4 border-t border-stroke-line">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Users className="h-3 w-3 text-fg-muted" />
                  <span className="text-micro text-fg-muted">Active Users</span>
                </div>
                <span className="text-body-2 font-medium text-fg-secondary tabular-nums">
                  {pool.activeUsers}
                </span>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Activity className="h-3 w-3 text-fg-muted" />
                  <span className="text-micro text-fg-muted">24h Volume</span>
                </div>
                <span className="text-body-2 font-medium text-fg-secondary tabular-nums">
                  {formatCurrency(pool.volume24h)}
                </span>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-3 w-3 text-fg-muted" />
                  <span className="text-micro text-fg-muted">Available</span>
                </div>
                <span className="text-body-2 font-medium text-fg-secondary tabular-nums">
                  {formatCurrency(pool.availableLiquidity)}
                </span>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Shield className="h-3 w-3 text-fg-muted" />
                  <span className="text-micro text-fg-muted">Risk Level</span>
                </div>
                <span className={cn("text-body-2 font-medium tabular-nums", risk.color)}>
                  {risk.label.split(' ')[0]}
                </span>
              </div>
            </div>

            {/* Performance & Data Freshness */}
            <div className="flex items-center justify-between text-micro">
              <div className="flex items-center gap-2">
                <span className="text-fg-muted">24h Performance:</span>
                <span className={cn(
                  "font-medium tabular-nums",
                  pool.performance24h >= 0 ? 'text-brand-400' : 'text-red-400'
                )}>
                  {pool.performance24h >= 0 ? '+' : ''}{formatPercent(pool.performance24h * 100)}
                </span>
              </div>
              
              <div className={cn(
                "font-medium",
                pool.dataFreshness === 'Fresh' ? 'text-brand-400' :
                pool.dataFreshness === 'Stale' ? 'text-yellow-400' : 'text-red-400'
              )}>
                {pool.dataFreshness}
              </div>
            </div>
          </>
        )}

        {/* Action Buttons */}
        {showActions && (
          <div className="flex gap-3 pt-4 border-t border-stroke-line">
            <Button 
              variant="outline"
              className="flex-1 border-brand-400/20 hover:border-brand-400 hover:bg-brand-400/10 text-brand-400 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-brand-400/20 disabled:hover:scale-100 disabled:hover:shadow-none"
              onClick={() => onSupply(pool.address)}
              disabled={pool.status !== 'Active'}
            >
              Supply
            </Button>
            
            <Button 
              variant="outline"
              className="flex-1 border-stroke-line hover:border-fg-muted hover:bg-bg-elev-2 transition-all duration-300 hover:scale-105 disabled:hover:scale-100"
              onClick={() => onBorrow(pool.address)}
              disabled={pool.status !== 'Active'}
            >
              Borrow
            </Button>
            
            <Button 
              variant="ghost"
              size="sm"
              className="px-3 hover:bg-bg-elev-2 group-hover:text-brand-400 transition-all duration-300 hover:scale-110"
              onClick={() => onViewDetails(pool.address)}
            >
              <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};