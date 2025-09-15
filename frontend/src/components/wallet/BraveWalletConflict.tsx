import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ExternalLink, 
  Settings, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  Info,
  Chrome,
  ArrowRight
} from "lucide-react";

interface BraveWalletConflictProps {
  isOpen: boolean;
  onClose: () => void;
  onRetry: () => Promise<void>;
  conflictInfo?: {
    hasBraveWallet: boolean;
    primaryConflict?: string;
    recommendations: string[];
  };
}

export function BraveWalletConflict({ 
  isOpen, 
  onClose, 
  onRetry, 
  conflictInfo 
}: BraveWalletConflictProps) {
  const [isRetrying, setIsRetrying] = useState(false);
  const [step, setStep] = useState(1);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await onRetry();
    } catch (error) {
      console.error("Error during retry:", error);
    } finally {
      setIsRetrying(false);
    }
  };

  const openBraveSettings = () => {
    window.open('brave://settings/web3', '_blank');
  };

  const openBraveExtensions = () => {
    window.open('brave://extensions/', '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Chrome className="h-5 w-5 text-orange-500" />
            Brave Browser Configuration Required
          </DialogTitle>
          <DialogDescription>
            Brave's built-in wallet is interfering with Freighter. Follow these steps to fix it.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {conflictInfo?.primaryConflict && (
            <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800 dark:text-orange-200">
                {conflictInfo.primaryConflict}
              </AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Step-by-Step Fix
              </CardTitle>
              <CardDescription>
                Follow these steps in order to resolve the wallet conflict
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {/* Step 1 */}
              <div className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${step >= 1 ? 'bg-blue-50 dark:bg-blue-950' : 'bg-muted/50'}`}>
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  1
                </div>
                <div className="flex-1">
                  <p className="font-medium">Open Brave Wallet Settings</p>
                  <p className="text-sm text-muted-foreground mb-2">
                    Access Brave's Web3 configuration page
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={openBraveSettings}
                    className="flex items-center gap-2"
                  >
                    <Settings className="h-4 w-4" />
                    Open brave://settings/web3
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <ArrowRight className="h-4 w-4 mx-auto text-muted-foreground" />

              {/* Step 2 */}
              <div className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${step >= 2 ? 'bg-blue-50 dark:bg-blue-950' : 'bg-muted/50'}`}>
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  2
                </div>
                <div className="flex-1">
                  <p className="font-medium">Change Default Wallet Setting</p>
                  <p className="text-sm text-muted-foreground mb-2">
                    Find "Default wallet" and change it to:
                  </p>
                  <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                    "Extensions (no fallback)"
                  </Badge>
                </div>
              </div>

              <ArrowRight className="h-4 w-4 mx-auto text-muted-foreground" />

              {/* Step 3 */}
              <div className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${step >= 3 ? 'bg-blue-50 dark:bg-blue-950' : 'bg-muted/50'}`}>
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  3
                </div>
                <div className="flex-1">
                  <p className="font-medium">Verify Freighter Extension</p>
                  <p className="text-sm text-muted-foreground mb-2">
                    Make sure Freighter is installed and enabled
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={openBraveExtensions}
                    className="flex items-center gap-2"
                  >
                    <Chrome className="h-4 w-4" />
                    Check Extensions
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <ArrowRight className="h-4 w-4 mx-auto text-muted-foreground" />

              {/* Step 4 */}
              <div className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${step >= 4 ? 'bg-blue-50 dark:bg-blue-950' : 'bg-muted/50'}`}>
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  4
                </div>
                <div className="flex-1">
                  <p className="font-medium">Restart Browser</p>
                  <p className="text-sm text-muted-foreground">
                    Close and reopen Brave for changes to take effect
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Separator />

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Why this happens:</strong> Brave's built-in wallet competes with browser extensions 
              for control of Web3 functionality. Setting it to "Extensions (no fallback)" allows 
              Freighter to work properly.
            </AlertDescription>
          </Alert>

          <div className="flex flex-col gap-2">
            <Button 
              onClick={handleRetry} 
              disabled={isRetrying}
              className="w-full flex items-center gap-2"
            >
              {isRetrying ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Checking for Freighter...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  I've completed the steps - Try Again
                </>
              )}
            </Button>

            <Button variant="outline" onClick={onClose} className="w-full">
              Skip for now
            </Button>
          </div>

          <div className="text-xs text-muted-foreground text-center">
            Need help? Visit{" "}
            <a 
              href="https://support.brave.app/hc/en-us/articles/15241705110157-Adjusting-the-Default-Wallet"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Brave's official guide
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}