import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { RefreshCw, Chrome, AlertTriangle, Info } from "lucide-react";
import { getWalletDebugInfo } from "@/lib/browser-detection";

export function FreighterDebug() {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkFreighterStatus = () => {
    setIsChecking(true);
    
    const info = getWalletDebugInfo();
    console.log("Enhanced Freighter Debug Info:", info);
    setDebugInfo(info);
    setIsChecking(false);
  };

  useEffect(() => {
    checkFreighterStatus();
  }, []);

  // Disabled for hackathon - too complex
  return null;

  return (
    <Card className="fixed bottom-4 right-4 w-96 max-h-96 overflow-auto z-50 bg-background/95 backdrop-blur">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          Freighter Debug
          <Button
            variant="ghost"
            size="sm"
            onClick={checkFreighterStatus}
            disabled={isChecking}
            className="h-6 w-6 p-0"
          >
            <RefreshCw className={`h-3 w-3 ${isChecking ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="text-xs space-y-2">
        {debugInfo && (
          <>
            {/* Browser Detection Alert */}
            {debugInfo.browserInfo?.isBrave && !debugInfo.hasFreighterProperty && (
              <Alert className="mb-3">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  <strong>Brave Browser Detected!</strong> Brave's built-in wallet may be blocking Freighter.
                  <br />Go to <code>brave://settings/web3</code> and set "Default wallet" to "Extensions (no fallback)"
                </AlertDescription>
              </Alert>
            )}
            
            {/* Browser Info */}
            <div className="flex items-center justify-between">
              <span>Browser:</span>
              <Badge variant="outline" className="flex items-center gap-1">
                <Chrome className="h-3 w-3" />
                {debugInfo.browserInfo?.name || 'Unknown'}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span>Window Available:</span>
              <Badge variant={debugInfo.windowExists ? "default" : "destructive"}>
                {debugInfo.windowExists ? "Yes" : "No"}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span>Freighter Property:</span>
              <Badge variant={debugInfo.hasFreighterProperty ? "default" : "destructive"}>
                {debugInfo.hasFreighterProperty ? "Yes" : "No"}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span>Freighter Type:</span>
              <Badge variant="outline">
                {debugInfo.freighterType}
              </Badge>
            </div>
            
            {/* Wallet Conflict Detection */}
            {debugInfo.walletConflicts && debugInfo.walletConflicts.length > 0 && (
              <div>
                <span className="font-medium text-yellow-600">Detected Wallets:</span>
                <div className="mt-1">
                  {debugInfo.walletConflicts.map((wallet: string) => (
                    <Badge key={wallet} variant="secondary" className="mr-1 mb-1 text-xs">
                      {wallet}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {debugInfo.windowKeys && debugInfo.windowKeys.length > 0 && (
              <div>
                <span className="font-medium">Freighter Keys:</span>
                <div className="mt-1">
                  {debugInfo.windowKeys.map((key: string) => (
                    <Badge key={key} variant="outline" className="mr-1 mb-1 text-xs">
                      {key}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {debugInfo.allFreighterRelated && debugInfo.allFreighterRelated.length > 0 && (
              <div>
                <span className="font-medium">Related Keys:</span>
                <div className="mt-1">
                  {debugInfo.allFreighterRelated.map((key: string) => (
                    <Badge key={key} variant="secondary" className="mr-1 mb-1 text-xs">
                      {key}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            <Separator className="my-2" />
            
            {/* Troubleshooting Section */}
            {debugInfo.browserInfo?.isBrave && (
              <div className="bg-blue-50 dark:bg-blue-950 p-2 rounded text-xs">
                <div className="flex items-center gap-1 font-medium text-blue-700 dark:text-blue-300 mb-1">
                  <Info className="h-3 w-3" />
                  Brave Configuration
                </div>
                <div className="text-blue-600 dark:text-blue-400">
                  1. Open brave://settings/web3<br/>
                  2. Set "Default wallet" to "Extensions (no fallback)"<br/>
                  3. Restart Brave browser<br/>
                  4. Refresh this page
                </div>
              </div>
            )}
            
            <div className="text-xs text-muted-foreground">
              Last checked: {new Date(debugInfo.timestamp).toLocaleTimeString()}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}