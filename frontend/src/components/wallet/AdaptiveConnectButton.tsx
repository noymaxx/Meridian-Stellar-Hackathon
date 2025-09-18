import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useWallet } from "./WalletProvider";
import { Copy, Download, Upload, Smartphone, Monitor, Tablet, Wallet, Key, QrCode, ExternalLink } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface AdaptiveConnectButtonProps {
  className?: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
}

export function AdaptiveConnectButton({ 
  className, 
  variant = "default", 
  size = "default" 
}: AdaptiveConnectButtonProps) {
  const wallet = useWallet();
  const [showWalletDetails, setShowWalletDetails] = useState(false);
  const [showBackupDialog, setShowBackupDialog] = useState(false);

  // Get device icon
  const getDeviceIcon = () => {
    if (wallet.deviceInfo.isMobile) return <Smartphone className="h-4 w-4" />;
    if (wallet.deviceInfo.isTablet) return <Tablet className="h-4 w-4" />;
    return <Monitor className="h-4 w-4" />;
  };

  // Get wallet provider icon
  const getWalletIcon = () => {
    if (wallet.walletProvider === 'mobile') return <Key className="h-4 w-4" />;
    if (wallet.walletProvider === 'freighter') return <Wallet className="h-4 w-4" />;
    return <Wallet className="h-4 w-4" />;
  };

  // Copy to clipboard helper
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  // Export mobile wallet
  const handleExportWallet = () => {
    const secret = wallet.exportMobileWallet();
    if (secret) {
      copyToClipboard(secret, "Secret key");
      toast({
        title: "⚠️ Security Warning",
        description: "Never share your secret key with anyone!",
        variant: "destructive",
      });
    }
  };

  // Generate backup QR
  const handleBackupQR = () => {
    const qrData = wallet.generateBackupQR();
    if (qrData) {
      console.log('QR Backup Data:', qrData);
      toast({
        title: "QR Backup Generated",
        description: "Check console for QR data",
      });
    }
  };

  // Connected state
  if (wallet.isConnected) {
    return (
      <>
        <Button
          variant={variant}
          size={size}
          className={className}
          onClick={() => setShowWalletDetails(true)}
        >
          <div className="flex items-center gap-2">
            {getDeviceIcon()}
            {getWalletIcon()}
            <span className="hidden sm:inline">
              {wallet.address?.slice(0, 6)}...{wallet.address?.slice(-4)}
            </span>
            <span className="sm:hidden">
              Connected
            </span>
          </div>
        </Button>

        {/* Wallet Details Dialog */}
        <Dialog open={showWalletDetails} onOpenChange={setShowWalletDetails}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {getDeviceIcon()}
                {getWalletIcon()}
                Wallet Details
              </DialogTitle>
              <DialogDescription>
                {wallet.walletProvider === 'mobile' ? 'Mobile' : 'Freighter'} wallet on {wallet.deviceInfo.deviceType}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Wallet Info */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Wallet Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-xs text-muted-foreground">Provider</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={wallet.walletProvider === 'mobile' ? 'secondary' : 'default'}>
                        {wallet.walletProvider === 'mobile' ? '📱 Mobile Wallet' : '💻 Freighter'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-xs text-muted-foreground">Address</label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-xs bg-muted px-2 py-1 rounded flex-1 truncate">
                        {wallet.address}
                      </code>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => wallet.address && copyToClipboard(wallet.address, "Address")}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {wallet.walletProvider === 'mobile' && wallet.mobileWalletInfo && (
                    <div>
                      <label className="text-xs text-muted-foreground">Created</label>
                      <div className="text-xs mt-1">
                        {wallet.mobileWalletInfo.createdAt.toLocaleString()}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Mobile Wallet Actions */}
              {wallet.walletProvider === 'mobile' && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Mobile Wallet Actions</CardTitle>
                    <CardDescription className="text-xs">
                      Backup and manage your mobile wallet
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full justify-start"
                      onClick={handleExportWallet}
                    >
                      <Download className="h-3 w-3 mr-2" />
                      Export Secret Key
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full justify-start"
                      onClick={handleBackupQR}
                    >
                      <QrCode className="h-3 w-3 mr-2" />
                      Generate QR Backup
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => setShowBackupDialog(true)}
                    >
                      <Upload className="h-3 w-3 mr-2" />
                      Import Wallet
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Device Info */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Device Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Type:</span>
                    <span className="capitalize">{wallet.deviceInfo.deviceType}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Mode:</span>
                    <span className="capitalize">{wallet.walletMode}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Network:</span>
                    <span>{wallet.network}</span>
                  </div>
                </CardContent>
              </Card>

              <Separator />

              {/* Actions */}
              <div className="flex gap-2">
                {wallet.walletMode === 'tablet' && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={wallet.switchToMobileMode}
                      className="flex-1"
                    >
                      <Smartphone className="h-3 w-3 mr-2" />
                      Mobile Mode
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={wallet.switchToDesktopMode}
                      className="flex-1"
                    >
                      <Monitor className="h-3 w-3 mr-2" />
                      Desktop Mode
                    </Button>
                  </>
                )}
                
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={wallet.disconnect}
                  className={wallet.walletMode === 'tablet' ? 'w-full mt-2' : 'flex-1'}
                >
                  Disconnect
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Import Wallet Dialog */}
        <ImportWalletDialog 
          open={showBackupDialog}
          onOpenChange={setShowBackupDialog}
          onImport={wallet.importMobileWallet}
        />
      </>
    );
  }

  // Connecting state
  if (wallet.isConnecting) {
    const connectingText = wallet.walletMode === 'mobile' 
      ? 'Creating & Funding Wallet...' 
      : 'Connecting...';
      
    return (
      <Button
        variant={variant}
        size={size}
        className={className}
        disabled
      >
        <div className="flex items-center gap-2">
          {getDeviceIcon()}
          <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
          <span className="hidden sm:inline">{connectingText}</span>
          <span className="sm:hidden">Connecting...</span>
        </div>
      </Button>
    );
  }

  // Not connected state
  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={wallet.connect}
    >
      <div className="flex items-center gap-2">
        {getDeviceIcon()}
        {wallet.walletMode === 'mobile' ? (
          <>
            <Key className="h-4 w-4" />
            <span>Create Mobile Wallet</span>
          </>
        ) : wallet.walletMode === 'tablet' ? (
          <>
            <Wallet className="h-4 w-4" />
            <span>Connect Wallet</span>
          </>
        ) : (
          <>
            <Wallet className="h-4 w-4" />
            <span>Connect Freighter</span>
          </>
        )}
      </div>
    </Button>
  );
}

// Import Wallet Dialog Component
interface ImportWalletDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (secretKey: string) => boolean;
}

function ImportWalletDialog({ open, onOpenChange, onImport }: ImportWalletDialogProps) {
  const [secretKey, setSecretKey] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  const handleImport = async () => {
    if (!secretKey.trim()) {
      toast({
        title: "Error",
        description: "Please enter a secret key",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    
    try {
      const success = onImport(secretKey.trim());
      
      if (success) {
        toast({
          title: "Success!",
          description: "Wallet imported successfully",
        });
        setSecretKey('');
        onOpenChange(false);
      } else {
        toast({
          title: "Import Failed",
          description: "Invalid secret key",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Import Failed",
        description: "An error occurred while importing",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import Mobile Wallet</DialogTitle>
          <DialogDescription>
            Enter your secret key to import an existing wallet
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Secret Key</label>
            <textarea
              className="w-full mt-1 p-2 border rounded-md text-sm font-mono"
              rows={3}
              placeholder="SXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={isImporting || !secretKey.trim()}
              className="flex-1"
            >
              {isImporting ? 'Importing...' : 'Import'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
