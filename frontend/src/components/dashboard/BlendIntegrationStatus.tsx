import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Zap, 
  ExternalLink,
  RefreshCw,
  TrendingUp,
  Shield,
  Coins
} from "lucide-react";
import { toast } from "sonner";
import { useAutoBlendIntegration, type BlendIntegrationStatus } from "@/hooks/useAutoBlendIntegration";
import { type RWAToken } from "@/hooks/useUserRWATokens";

interface BlendIntegrationCardProps {
  token: RWAToken;
  status: BlendIntegrationStatus;
  onIntegrate: (token: RWAToken) => Promise<boolean>;
  loading?: boolean;
}

const BlendIntegrationCard = ({ token, status, onIntegrate, loading }: BlendIntegrationCardProps) => {
  const [integrating, setIntegrating] = useState(false);

  const handleIntegrate = async () => {
    setIntegrating(true);
    try {
      await onIntegrate(token);
    } finally {
      setIntegrating(false);
    }
  };

  const handleViewBlendPool = () => {
    // Redirect to Markets page and scroll to the specific token card
    window.location.href = `/markets?highlight=${token.contractAddress}`;
  };

  const getStatusIcon = () => {
    if (status.canLend) return <CheckCircle className="w-4 h-4 text-green-400" />;
    if (status.error) return <XCircle className="w-4 h-4 text-red-400" />;
    return <AlertCircle className="w-4 h-4 text-amber-400" />;
  };

  const getStatusText = () => {
    if (status.canLend) return "Ready for Lending";
    if (status.error) return "Integration Failed";
    if (status.isConfigured) return "Partially Configured";
    return "Not Integrated";
  };

  const getStatusColor = () => {
    if (status.canLend) return "text-green-400";
    if (status.error) return "text-red-400";
    return "text-amber-400";
  };

  return (
    <Card className="p-4 space-y-3 border border-bg-elev-1 hover:border-brand-500/30 transition-colors">
      {/* Token Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Coins className="w-4 h-4 text-brand-400" />
          <span className="font-medium text-fg-primary">{token.symbol}</span>
          {token.isUserAdmin && (
            <Badge variant="outline" className="text-xs">Admin</Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          {getStatusIcon()}
          <span className={`text-xs ${getStatusColor()}`}>
            {getStatusText()}
          </span>
        </div>
      </div>

      {/* Integration Status Details */}
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1">
            {status.isRegistered ? (
              <CheckCircle className="w-3 h-3 text-green-400" />
            ) : (
              <XCircle className="w-3 h-3 text-red-400" />
            )}
            <span className="text-fg-muted">Pool Registered</span>
          </div>
          
          <div className="flex items-center gap-1">
            {status.isConfigured ? (
              <CheckCircle className="w-3 h-3 text-green-400" />
            ) : (
              <XCircle className="w-3 h-3 text-red-400" />
            )}
            <span className="text-fg-muted">Token Configured</span>
          </div>
          
          <div className="flex items-center gap-1">
            {status.hasReserve ? (
              <CheckCircle className="w-3 h-3 text-green-400" />
            ) : (
              <XCircle className="w-3 h-3 text-red-400" />
            )}
            <span className="text-fg-muted">Reserve Setup</span>
          </div>
          
          <div className="flex items-center gap-1">
            {status.canLend ? (
              <CheckCircle className="w-3 h-3 text-green-400" />
            ) : (
              <XCircle className="w-3 h-3 text-red-400" />
            )}
            <span className="text-fg-muted">Lending Ready</span>
          </div>
        </div>

        {/* Error Message */}
        {status.error && (
          <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded p-2">
            {status.error}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {!status.canLend && token.isUserAdmin && (
          <Button
            size="sm"
            onClick={handleIntegrate}
            disabled={integrating || loading}
            className="flex-1 text-xs"
          >
            {integrating ? (
              <>
                <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                Integrating...
              </>
            ) : (
              <>
                <Zap className="w-3 h-3 mr-1" />
                Integrate
              </>
            )}
          </Button>
        )}
        
        {status.canLend && status.poolAddress && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleViewBlendPool}
            className="flex-1 text-xs"
          >
            <ExternalLink className="w-3 h-3 mr-1" />
            View Pool
          </Button>
        )}
      </div>
    </Card>
  );
};

interface BlendIntegrationStatusProps {
  tokens: RWAToken[];
}

export const BlendIntegrationStatus = ({ tokens }: BlendIntegrationStatusProps) => {
  const { 
    tokenStatuses, 
    loading, 
    error, 
    autoIntegrateToken, 
    refreshStatuses 
  } = useAutoBlendIntegration();

  // Filter to only show admin tokens (tokens the user can integrate) and remove duplicates
  const adminTokens = tokens
    .filter(token => token.isUserAdmin)
    .filter((token, index, array) => 
      array.findIndex(t => t.contractAddress === token.contractAddress) === index
    );

  const handleRefresh = async () => {
    toast.promise(refreshStatuses(), {
      loading: "Checking Blend integration status...",
      success: "Status updated!",
      error: "Failed to refresh status"
    });
  };

  const handleIntegrateAll = async () => {
    const unintegratedTokens = adminTokens.filter(token => {
      const status = tokenStatuses[token.contractAddress];
      return !status?.canLend;
    });

    if (unintegratedTokens.length === 0) {
      toast.info("All tokens are already integrated with Blend");
      return;
    }

    const confirmMessage = `Integrate ${unintegratedTokens.length} token(s) with Blend for lending?\n\n` +
      `Tokens: ${unintegratedTokens.map(t => t.symbol).join(', ')}`;

    if (!window.confirm(confirmMessage)) return;

    let successful = 0;
    for (const token of unintegratedTokens) {
      const success = await autoIntegrateToken(token);
      if (success) successful++;
      // Small delay between integrations
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    toast.success(`Successfully integrated ${successful}/${unintegratedTokens.length} tokens with Blend`);
  };

  if (adminTokens.length === 0) {
    return null; // Don't show if user has no admin tokens
  }

  return (
    <Card className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-h4 font-semibold text-fg-primary flex items-center gap-2">
            <Shield className="w-5 h-5 text-brand-400" />
            Blend Integration
          </h3>
          <p className="text-body-2 text-fg-muted">
            Enable lending & borrowing for your SRWA tokens
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleIntegrateAll}
            disabled={loading}
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Integrate All
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded p-3">
          <strong>Integration Error:</strong> {error}
        </div>
      )}

      {/* Loading State */}
      {loading && Object.keys(tokenStatuses).length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {adminTokens.map((_, index) => (
            <Skeleton key={index} className="h-32 w-full" />
          ))}
        </div>
      ) : (
        /* Integration Status Cards */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {adminTokens.map((token, index) => {
            const status = tokenStatuses[token.contractAddress] || {
              isRegistered: false,
              isConfigured: false,
              hasReserve: false,
              canLend: false,
            };

            return (
              <BlendIntegrationCard
                key={`${token.contractAddress}-${index}`}
                token={token}
                status={status}
                onIntegrate={autoIntegrateToken}
                loading={loading}
              />
            );
          })}
        </div>
      )}

      {/* Quick Stats */}
      <div className="border-t border-bg-elev-1 pt-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-fg-muted">
            {adminTokens.filter(token => tokenStatuses[token.contractAddress]?.canLend).length} of {adminTokens.length} tokens integrated
          </span>
          <span className="text-brand-400">
            Ready for DeFi lending & borrowing
          </span>
        </div>
      </div>
    </Card>
  );
};

export default BlendIntegrationStatus;
