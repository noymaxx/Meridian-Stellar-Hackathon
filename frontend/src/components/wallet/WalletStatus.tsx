import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { 
  Copy, 
  ExternalLink, 
  RefreshCw, 
  Wallet, 
  Globe, 
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { useWallet } from "./WalletProvider";
import { formatStellarAddress, getExplorerUrl, STELLAR_CONFIG } from "@/lib/stellar-config";

interface WalletStatusProps {
  showBalance?: boolean;
  showNetwork?: boolean;
  showActions?: boolean;
  compact?: boolean;
}

export function WalletStatus({ 
  showBalance = true, 
  showNetwork = true, 
  showActions = true,
  compact = false 
}: WalletStatusProps) {
  const { 
    isConnected, 
    address, 
    network, 
    balance, 
    isConnecting,
    refreshBalance,
    disconnect 
  } = useWallet();
  
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleCopyAddress = async () => {
    if (!address) return;
    
    try {
      await navigator.clipboard.writeText(address);
      toast({
        title: "Address Copied",
        description: "Wallet address copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy Failed", 
        description: "Failed to copy address to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleRefreshBalance = async () => {
    setIsRefreshing(true);
    try {
      await refreshBalance();
      toast({
        title: "Balance Updated",
        description: "Wallet balance has been refreshed",
      });
    } catch (error) {
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh balance",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleViewOnExplorer = () => {
    if (!address) return;
    const explorerUrl = getExplorerUrl(address);
    window.open(explorerUrl, "_blank", "noopener,noreferrer");
  };

  if (!isConnected) {
    return (
      <Card className={compact ? "w-full" : "w-full max-w-md"}>
        <CardContent className="flex items-center justify-center p-6">
          <div className="text-center space-y-2">
            <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">Wallet not connected</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium">{formatStellarAddress(address)}</p>
                {showBalance && (
                  <p className="text-xs text-muted-foreground">
                    {balance ? `${balance} XLM` : "Loading..."}
                  </p>
                )}
              </div>
            </div>
            {showActions && (
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyAddress}
                  className="h-8 w-8 p-0"
                >
                  <Copy className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleViewOnExplorer}
                  className="h-8 w-8 p-0"
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Wallet className="h-5 w-5" />
          <span>Wallet Status</span>
        </CardTitle>
        <CardDescription>
          Your Stellar wallet connection details
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Status</span>
          <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
            <CheckCircle className="h-3 w-3 mr-1" />
            Connected
          </Badge>
        </div>

        <Separator />

        {/* Wallet Address */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Address</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyAddress}
              className="h-auto p-1 text-xs"
            >
              <Copy className="h-3 w-3 mr-1" />
              Copy
            </Button>
          </div>
          <p className="text-sm bg-muted p-2 rounded font-mono break-all">
            {address}
          </p>
        </div>

        {/* Network Information */}
        {showNetwork && (
          <>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Network</span>
              <Badge variant="outline" className="flex items-center space-x-1">
                <Globe className="h-3 w-3" />
                <span>{STELLAR_CONFIG.network}</span>
              </Badge>
            </div>
          </>
        )}

        {/* Balance Information */}
        {showBalance && (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Balance</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefreshBalance}
                  disabled={isRefreshing}
                  className="h-auto p-1 text-xs"
                >
                  <RefreshCw className={`h-3 w-3 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold">
                  {balance ? `${balance} XLM` : (
                    <span className="text-muted-foreground">Loading...</span>
                  )}
                </span>
              </div>
            </div>
          </>
        )}

        {/* Actions */}
        {showActions && (
          <>
            <Separator />
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleViewOnExplorer}
                className="w-full flex items-center space-x-2"
              >
                <ExternalLink className="h-4 w-4" />
                <span>View on Stellar Explorer</span>
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={disconnect}
                className="w-full text-destructive hover:text-destructive"
              >
                Disconnect Wallet
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}