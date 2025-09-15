import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ExternalLink, Download, RefreshCw, AlertCircle } from "lucide-react";
import { WALLET_INFO, WalletType } from "@/lib/wallet";

interface FreighterInstallationProps {
  isOpen: boolean;
  onClose: () => void;
  onRetry: () => Promise<void>;
}

export function FreighterInstallation({ isOpen, onClose, onRetry }: FreighterInstallationProps) {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    setIsRetrying(true);
    console.log("User clicked retry button, triggering wallet detection...");
    
    try {
      await onRetry();
    } catch (error) {
      console.error("Error during retry:", error);
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            Freighter Wallet Required
          </DialogTitle>
          <DialogDescription>
            To connect your Stellar wallet, you need to install the Freighter browser extension.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Freighter is a secure, non-custodial wallet for the Stellar network that allows you to manage your assets and interact with Stellar applications.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Installation Steps</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                  1
                </div>
                <div>
                  <p className="font-medium">Download Freighter</p>
                  <p className="text-sm text-muted-foreground">
                    Install the official Freighter extension from Chrome Web Store
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                  2
                </div>
                <div>
                  <p className="font-medium">Set up your wallet</p>
                  <p className="text-sm text-muted-foreground">
                    Create a new wallet or import an existing one
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                  3
                </div>
                <div>
                  <p className="font-medium">Connect to this app</p>
                  <p className="text-sm text-muted-foreground">
                    Return here and click "Try Again" to connect your wallet
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-2">
            <Button 
              asChild 
              className="w-full"
            >
              <a
                href={WALLET_INFO[WalletType.FREIGHTER].downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Install Freighter Extension
                <ExternalLink className="h-3 w-3" />
              </a>
            </Button>

            <Button 
              variant="outline" 
              onClick={handleRetry} 
              disabled={isRetrying}
              className="w-full flex items-center gap-2"
            >
              {isRetrying ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {isRetrying ? "Checking for Freighter..." : "I've Installed It"}
            </Button>
          </div>

          <div className="text-center">
            <Button variant="ghost" onClick={onClose} className="text-sm">
              Skip for now
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}