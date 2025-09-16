import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Coins, Building2, TrendingUp, Clock } from 'lucide-react';

interface TokenStats {
  totalTokens: number;
  totalPools: number;
  recentActivity: number;
  lastCreated: string | null;
}

export function TokenStats() {
  const [stats, setStats] = useState<TokenStats>({
    totalTokens: 0,
    totalPools: 0,
    recentActivity: 0,
    lastCreated: null
  });

  useEffect(() => {
    // Load stats from localStorage
    const recentTokens = JSON.parse(localStorage.getItem('recent_tokens') || '[]');
    
    const totalTokens = recentTokens.filter((t: any) => t.type === 'token').length;
    const totalPools = recentTokens.filter((t: any) => t.type === 'pool').length;
    
    // Count activity in last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentActivity = recentTokens.filter((t: any) => 
      new Date(t.createdAt) > oneDayAgo
    ).length;
    
    const lastCreated = recentTokens.length > 0 ? recentTokens[0].createdAt : null;

    setStats({
      totalTokens,
      totalPools,
      recentActivity,
      lastCreated
    });
  }, []);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="card-institutional">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-500/10 flex items-center justify-center">
              <Coins className="h-5 w-5 text-brand-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-fg-primary">{stats.totalTokens}</p>
              <p className="text-sm text-fg-muted">SRWA Tokens</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="card-institutional">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-fg-primary">{stats.totalPools}</p>
              <p className="text-sm text-fg-muted">Lending Pools</p>
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
              <p className="text-2xl font-bold text-fg-primary">{stats.recentActivity}</p>
              <p className="text-sm text-fg-muted">Last 24h</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="card-institutional">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-fg-primary">
                {stats.lastCreated ? formatTimeAgo(stats.lastCreated) : 'Never'}
              </p>
              <p className="text-sm text-fg-muted">Last Created</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
