import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, TrendingUp, Shield, DollarSign, Activity } from 'lucide-react';

interface PoolDetailsProps {
  pool: {
    pool_address: string;
    name: string;
    oracle: string;
    backstop_take_rate: number;
    max_positions: number;
    total_supply: string;
    total_borrowed: string;
    supply_apy: string;
    borrow_apy: string;
    utilization_rate: string;
    lltv: string;
    risk_premium: string;
    min_investment: string;
    collateral_factor: string;
    liquidation_threshold: string;
    reserve_factor: string;
    interest_rate_model: string;
    is_active: boolean;
    created_at: string;
    last_updated: string;
    deployment_hash?: string;
  };
}

export function PoolDetails({ pool }: PoolDetailsProps) {
  const openInStellarScan = () => {
    window.open(`https://stellarscan.io/account/${pool.pool_address}`, '_blank');
  };

  const openTransaction = () => {
    if (pool.deployment_hash) {
      window.open(`https://stellarscan.io/transaction/${pool.deployment_hash}`, '_blank');
    }
  };

  return (
    <div className="space-y-6">
      {/* Pool Header */}
      <Card className="card-institutional">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {pool.name}
                <Badge variant={pool.is_active ? "default" : "secondary"}>
                  {pool.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </CardTitle>
              <CardDescription className="font-mono text-sm">
                {pool.pool_address}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={openInStellarScan}>
                <ExternalLink className="h-4 w-4 mr-2" />
                View on Stellar Scan
              </Button>
              {pool.deployment_hash && (
                <Button variant="outline" size="sm" onClick={openTransaction}>
                  <Activity className="h-4 w-4 mr-2" />
                  View Transaction
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="card-institutional">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand-500/10 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-brand-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-fg-primary">${parseFloat(pool.total_supply).toLocaleString()}</p>
                <p className="text-sm text-fg-muted">Total Supply</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-institutional">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-fg-primary">{pool.supply_apy}%</p>
                <p className="text-sm text-fg-muted">Supply APY</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-institutional">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-fg-primary">{pool.borrow_apy}%</p>
                <p className="text-sm text-fg-muted">Borrow APY</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-institutional">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Activity className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-fg-primary">{pool.utilization_rate}%</p>
                <p className="text-sm text-fg-muted">Utilization</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Risk Parameters */}
      <Card className="card-institutional">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Risk Parameters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <p className="text-sm text-fg-muted">Collateral Factor</p>
              <p className="text-lg font-semibold text-fg-primary">{pool.collateral_factor}%</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-fg-muted">Liquidation Threshold</p>
              <p className="text-lg font-semibold text-fg-primary">{pool.liquidation_threshold}%</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-fg-muted">Reserve Factor</p>
              <p className="text-lg font-semibold text-fg-primary">{pool.reserve_factor}%</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-fg-muted">Interest Rate Model</p>
              <p className="text-lg font-semibold text-fg-primary">{pool.interest_rate_model}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pool Configuration */}
      <Card className="card-institutional">
        <CardHeader>
          <CardTitle>Pool Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm text-fg-muted">Oracle Address</p>
              <p className="text-sm font-mono text-fg-primary">{pool.oracle}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-fg-muted">Backstop Take Rate</p>
              <p className="text-sm font-semibold text-fg-primary">{pool.backstop_take_rate} bps</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-fg-muted">Max Positions</p>
              <p className="text-sm font-semibold text-fg-primary">{pool.max_positions}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-fg-muted">Min Investment</p>
              <p className="text-sm font-semibold text-fg-primary">${pool.min_investment}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
