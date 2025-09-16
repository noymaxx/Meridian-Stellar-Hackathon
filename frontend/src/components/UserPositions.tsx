import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { poolService } from '@/lib/stellar/poolService';
import { useWallet } from '@/hooks/useWallet';
import { TrendingUp, TrendingDown, DollarSign, RefreshCw, Wallet } from 'lucide-react';

interface UserPositionsProps {
  poolAddress: string;
  className?: string;
}

export function UserPositions({ poolAddress, className }: UserPositionsProps) {
  const [positions, setPositions] = useState<{
    borrowed: Map<string, bigint>;
    supplied: Map<string, bigint>;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { wallet } = useWallet();

  useEffect(() => {
    if (wallet && poolAddress) {
      loadUserPositions();
    }
  }, [wallet, poolAddress]);

  const loadUserPositions = async () => {
    if (!wallet) return;
    
    setIsLoading(true);
    try {
      const userPositions = await poolService.getUserPositions(poolAddress, wallet.publicKey);
      setPositions(userPositions);
    } catch (error) {
      console.error('Failed to load user positions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatAmount = (amount: bigint, decimals: number = 6) => {
    const divisor = BigInt(10 ** decimals);
    const whole = amount / divisor;
    const remainder = amount % divisor;
    const remainderStr = remainder.toString().padStart(decimals, '0');
    return `${whole}.${remainderStr.slice(0, 2)}`;
  };

  if (!wallet) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Your Positions
          </CardTitle>
          <CardDescription>Connect your wallet to view positions</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Please connect your wallet to view your lending positions
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Your Positions
            </CardTitle>
            <CardDescription>Your lending and borrowing positions in this pool</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadUserPositions}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-muted rounded-full animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded animate-pulse" />
                <div className="h-3 bg-muted rounded w-1/2 animate-pulse" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-muted rounded-full animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded animate-pulse" />
                <div className="h-3 bg-muted rounded w-1/2 animate-pulse" />
              </div>
            </div>
          </div>
        ) : positions ? (
          <div className="space-y-4">
            {/* Supplied Assets */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Supplied Assets
              </h4>
              {positions.supplied.size > 0 ? (
                <div className="space-y-2">
                  {Array.from(positions.supplied.entries()).map(([token, amount]) => (
                    <div key={token} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-500/10 rounded-full flex items-center justify-center">
                          <DollarSign className="h-4 w-4 text-green-500" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{token}</p>
                          <p className="text-xs text-muted-foreground">Supplied</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatAmount(amount)}</p>
                        <Badge variant="secondary" className="text-xs">
                          Collateral
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No supplied assets
                </p>
              )}
            </div>

            {/* Borrowed Assets */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                <TrendingDown className="h-4 w-4" />
                Borrowed Assets
              </h4>
              {positions.borrowed.size > 0 ? (
                <div className="space-y-2">
                  {Array.from(positions.borrowed.entries()).map(([token, amount]) => (
                    <div key={token} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-red-500/10 rounded-full flex items-center justify-center">
                          <TrendingDown className="h-4 w-4 text-red-500" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{token}</p>
                          <p className="text-xs text-muted-foreground">Borrowed</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatAmount(amount)}</p>
                        <Badge variant="destructive" className="text-xs">
                          Debt
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No borrowed assets
                </p>
              )}
            </div>

            {/* Summary */}
            {positions.supplied.size === 0 && positions.borrowed.size === 0 && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Wallet className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  You don't have any positions in this pool yet
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Start by supplying collateral or borrowing assets
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <RefreshCw className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              Failed to load positions
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={loadUserPositions}
              className="mt-2"
            >
              Try Again
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
