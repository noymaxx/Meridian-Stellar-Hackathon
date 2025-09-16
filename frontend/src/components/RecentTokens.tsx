import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Coins, ExternalLink, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface RecentToken {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  createdAt: string;
  type: 'token' | 'pool';
  deploymentHash?: string;
}

export function RecentTokens() {
  const [recentTokens, setRecentTokens] = useState<RecentToken[]>([]);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  // No longer using localStorage - this component will be hidden or show empty state
  // since we're only using smart contract data now

  const copyToClipboard = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(address);
      toast.success('Address copied to clipboard');
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Failed to copy address');
    }
  };

  const openInExplorer = (address: string) => {
    window.open(`https://stellarscan.io/account/${address}`, '_blank');
  };

  const openTransaction = (hash: string) => {
    window.open(`https://stellarscan.io/transaction/${hash}`, '_blank');
  };

  if (recentTokens.length === 0) {
    return (
      <Card className="card-institutional">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Recently Created
          </CardTitle>
          <CardDescription>
            Your recently created tokens and pools will appear here
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Coins className="h-12 w-12 text-fg-muted mx-auto mb-4" />
            <p className="text-body-2 text-fg-muted">
              No recent tokens or pools. Create your first asset to get started!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-institutional">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="h-5 w-5" />
          Recently Created
        </CardTitle>
        <CardDescription>
          Your recently created tokens and pools
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recentTokens.slice(0, 3).map((token) => (
            <div
              key={token.address}
              className="flex items-center justify-between p-3 rounded-lg border border-stroke-line bg-card/50"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-500/10 flex items-center justify-center">
                  <Coins className="h-5 w-5 text-brand-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-fg-primary">{token.name}</h4>
                    <Badge variant="outline" className="text-xs">
                      {token.symbol}
                    </Badge>
                    <Badge 
                      variant="secondary" 
                      className="text-xs"
                    >
                      {token.type === 'token' ? 'SRWA Token' : 'Lending Pool'}
                    </Badge>
                  </div>
                  <p className="text-sm text-fg-muted font-mono">
                    {token.address.slice(0, 8)}...{token.address.slice(-8)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(token.address)}
                  className="h-8 w-8 p-0"
                >
                  {copiedAddress === token.address ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openInExplorer(token.address)}
                  className="h-8 w-8 p-0"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
                {token.deploymentHash && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openTransaction(token.deploymentHash!)}
                    className="h-8 w-8 p-0"
                    title="View deployment transaction"
                  >
                    <Coins className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
