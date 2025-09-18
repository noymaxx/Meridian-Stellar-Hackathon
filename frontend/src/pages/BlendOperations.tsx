import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, AlertCircle, Loader2, Wallet, Copy, ExternalLink, TrendingUp, TrendingDown, Activity, Shield, DollarSign } from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import { useBlendOperations, BLEND_CONTRACTS, RequestType } from '@/hooks/useBlendOperations';
import { toast } from 'sonner';

interface FormData {
  // Pool Management
  poolName: string;
  poolAddress: string;
  oracle: string;
  maxPositions: string;
  
  // Token Config
  tokenAddress: string;
  ltvRatio: string;
  liqThreshold: string;
  
  // Lending Operations
  collateralAmount: string;
  borrowAmount: string;
  repayAmount: string;
  withdrawAmount: string;
  
  // Asset
  selectedAsset: string;
}

export default function BlendOperations() {
  const { wallet, connect, isConnected } = useWallet();
  const blendOps = useBlendOperations();
  
  const [formData, setFormData] = useState<FormData>({
    // Pool Management
    poolName: 'SRWA Lending Pool',
    poolAddress: BLEND_CONTRACTS.blendPool,
    oracle: BLEND_CONTRACTS.oracle,
    maxPositions: '12',
    
    // Token Config
    tokenAddress: BLEND_CONTRACTS.srwaToken,
    ltvRatio: '8000', // 80%
    liqThreshold: '8500', // 85%
    
    // Lending Operations
    collateralAmount: '1000000', // 1 SRWA (7 decimals)
    borrowAmount: '500000',      // 0.5 SRWA
    repayAmount: '500000',
    withdrawAmount: '500000',
    
    // Asset
    selectedAsset: BLEND_CONTRACTS.srwaToken,
  });

  const [result, setResult] = useState<any>(null);
  const [position, setPosition] = useState<any>(null);
  const [poolInfo, setPoolInfo] = useState<any>(null);
  const [complianceResult, setComplianceResult] = useState<any>(null);

  // Auto-populate wallet address in form
  useEffect(() => {
    if (wallet?.publicKey) {
      console.log("🔗 [Blend UI] Wallet connected:", wallet.publicKey);
    }
  }, [wallet]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  // Load user position and pool info
  const loadData = async () => {
    if (!wallet?.publicKey) return;

    try {
      // Load user position
      const userPosition = await blendOps.getPosition({
        user: wallet.publicKey,
        poolAddress: formData.poolAddress,
      });
      setPosition(userPosition);

      // Load pool info
      const poolData = await blendOps.getPoolInfo(formData.poolAddress);
      setPoolInfo(poolData);

      console.log("🔗 [Blend UI] Data loaded:", { userPosition, poolData });
    } catch (error) {
      console.log("🔗 [Blend UI] No existing data or error loading:", error);
    }
  };

  useEffect(() => {
    if (isConnected) {
      loadData();
    }
  }, [isConnected, formData.poolAddress]);

  const handleOperation = async (operation: () => Promise<any>, operationName: string) => {
    if (!isConnected || !wallet) {
      toast.error("Please connect your wallet first");
      return;
    }

    try {
      console.log(`🔗 [Blend UI] Starting ${operationName}`, {
        formData,
        walletAddress: wallet.publicKey,
      });

      const result = await operation();
      setResult(result);
      
      toast.success(`${operationName} completed successfully!`);
      
      // Reload data after successful operation
      setTimeout(loadData, 2000);
    } catch (err) {
      console.error(`🔗 [Blend UI] ${operationName} failed:`, err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      toast.error(`${operationName} failed: ${errorMessage}`);
    }
  };

  // Operation handlers
  const registerPool = () => handleOperation(() => 
    blendOps.registerPool({
      poolAddress: formData.poolAddress,
      name: formData.poolName,
      oracle: formData.oracle,
      maxPositions: parseInt(formData.maxPositions),
    }), "Register Pool"
  );

  const addTokenToPool = () => handleOperation(() => 
    blendOps.addTokenToPool({
      poolAddress: formData.poolAddress,
      token: formData.tokenAddress,
      ltvRatio: parseInt(formData.ltvRatio),
      liqThreshold: parseInt(formData.liqThreshold),
    }), "Add Token to Pool"
  );

  const setupReserve = () => handleOperation(() => 
    blendOps.setupPoolReserve({
      poolAddress: formData.poolAddress,
      asset: formData.selectedAsset,
    }), "Setup Pool Reserve"
  );

  const supplyCollateral = () => handleOperation(() => 
    blendOps.supplyCollateral({
      poolAddress: formData.poolAddress,
      token: formData.selectedAsset,
      amount: formData.collateralAmount,
    }), "Supply Collateral"
  );

  const borrow = () => handleOperation(() => 
    blendOps.borrowAmount({
      poolAddress: formData.poolAddress,
      token: formData.selectedAsset,
      amount: formData.borrowAmount,
    }), "Borrow"
  );

  const repay = () => handleOperation(() => 
    blendOps.repayAmount({
      poolAddress: formData.poolAddress,
      token: formData.selectedAsset,
      amount: formData.repayAmount,
    }), "Repay"
  );

  const withdraw = () => handleOperation(() => 
    blendOps.withdrawCollateral({
      poolAddress: formData.poolAddress,
      token: formData.selectedAsset,
      amount: formData.withdrawAmount,
    }), "Withdraw Collateral"
  );

  const checkCompliance = async () => {
    try {
      const compliance = await blendOps.checkCompliance({
        poolAddress: formData.poolAddress,
        token: formData.selectedAsset,
        amount: formData.collateralAmount,
        requestType: RequestType.SupplyCollateral,
      });
      setComplianceResult(compliance);
      
      if (compliance.is_compliant) {
        toast.success("Compliance check passed!");
      } else {
        toast.warning(`Compliance issue: ${compliance.reason}`);
      }
    } catch (error) {
      toast.error("Compliance check failed");
    }
  };

  if (!isConnected) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <Card className="card-institutional bg-gradient-to-br from-bg-elev-1 to-bg-elev-2 border-brand-500/20">
          <CardHeader className="text-center">
            <CardTitle className="text-h2 text-fg-primary mb-2">Blend Protocol Integration</CardTitle>
            <p className="text-body-1 text-fg-secondary">
              Connect your wallet to access SRWA-powered lending operations
            </p>
          </CardHeader>
          <CardContent className="text-center">
            <Button
              onClick={connect}
              disabled={blendOps.isLoading}
              className="btn-primary px-8 py-3 min-w-40"
            >
              {blendOps.isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  Connect Wallet
                  <Wallet className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8 text-center">
        <h1 className="text-display-1 font-semibold text-fg-primary mb-4">
          Blend Protocol Integration
          <span className="block text-brand-400 text-h1 mt-2">
            🚀 SRWA-Powered Lending
          </span>
        </h1>
        <p className="text-body-1 text-fg-secondary max-w-2xl mx-auto mb-4">
          Real integration with Blend Protocol using SRWA tokens as collateral
        </p>
        <div className="flex items-center justify-center gap-4">
          <Badge variant="outline" className="text-green-400 border-green-500/30 bg-green-500/10">
            <div className="w-2 h-2 bg-green-400 rounded-full mr-2" />
            Wallet: {wallet?.publicKey.slice(0, 8)}...
          </Badge>
          <Badge variant="outline" className="text-blue-400 border-blue-500/30 bg-blue-500/10">
            <Activity className="w-3 h-3 mr-1" />
            Blend Pool: {formData.poolAddress.slice(0, 8)}...
          </Badge>
        </div>
      </div>

      {/* User Position Status */}
      {position && (
        <Card className="mb-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
          <CardHeader>
            <CardTitle className="text-h3 text-fg-primary flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Your Position
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-fg-muted text-sm">Collateral</p>
                <p className="text-h3 text-green-400">{(Number(position.collateral) / 10000000).toFixed(2)} SRWA</p>
              </div>
              <div className="text-center">
                <p className="text-fg-muted text-sm">Borrowed</p>
                <p className="text-h3 text-orange-400">{(Number(position.borrowed) / 10000000).toFixed(2)} SRWA</p>
              </div>
              <div className="text-center">
                <p className="text-fg-muted text-sm">Health Factor</p>
                <p className="text-h3 text-fg-primary">{(position.health_factor / 100).toFixed(1)}%</p>
              </div>
              <div className="text-center">
                <p className="text-fg-muted text-sm">Can Borrow</p>
                <p className={`text-h3 ${position.can_borrow ? 'text-green-400' : 'text-red-400'}`}>
                  {position.can_borrow ? 'Yes' : 'No'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="lending" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="lending">💰 Lending Operations</TabsTrigger>
          <TabsTrigger value="pool">🏊 Pool Management</TabsTrigger>
          <TabsTrigger value="compliance">🛡️ Compliance</TabsTrigger>
          <TabsTrigger value="results">📊 Results</TabsTrigger>
        </TabsList>

        {/* Lending Operations Tab */}
        <TabsContent value="lending" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Supply Collateral */}
            <Card className="card-institutional">
              <CardHeader>
                <CardTitle className="text-h3 text-fg-primary flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-400" />
                  Supply Collateral
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Amount (stroops)</Label>
                  <Input
                    value={formData.collateralAmount}
                    onChange={(e) => handleInputChange('collateralAmount', e.target.value)}
                    placeholder="1000000 (1 SRWA)"
                  />
                  <p className="text-xs text-fg-muted mt-1">
                    Amount: {(Number(formData.collateralAmount) / 10000000).toFixed(2)} SRWA
                  </p>
                </div>
                <Button
                  onClick={supplyCollateral}
                  disabled={blendOps.isLoading}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {blendOps.isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Supply Collateral
                </Button>
              </CardContent>
            </Card>

            {/* Borrow */}
            <Card className="card-institutional">
              <CardHeader>
                <CardTitle className="text-h3 text-fg-primary flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-blue-400" />
                  Borrow
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Amount (stroops)</Label>
                  <Input
                    value={formData.borrowAmount}
                    onChange={(e) => handleInputChange('borrowAmount', e.target.value)}
                    placeholder="500000 (0.5 SRWA)"
                  />
                  <p className="text-xs text-fg-muted mt-1">
                    Amount: {(Number(formData.borrowAmount) / 10000000).toFixed(2)} SRWA
                  </p>
                </div>
                <Button
                  onClick={borrow}
                  disabled={blendOps.isLoading || !position?.can_borrow}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {blendOps.isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Borrow
                </Button>
              </CardContent>
            </Card>

            {/* Repay */}
            <Card className="card-institutional">
              <CardHeader>
                <CardTitle className="text-h3 text-fg-primary flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-orange-400" />
                  Repay
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Amount (stroops)</Label>
                  <Input
                    value={formData.repayAmount}
                    onChange={(e) => handleInputChange('repayAmount', e.target.value)}
                    placeholder="500000 (0.5 SRWA)"
                  />
                  <p className="text-xs text-fg-muted mt-1">
                    Amount: {(Number(formData.repayAmount) / 10000000).toFixed(2)} SRWA
                  </p>
                </div>
                <Button
                  onClick={repay}
                  disabled={blendOps.isLoading}
                  className="w-full bg-orange-600 hover:bg-orange-700"
                >
                  {blendOps.isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Repay
                </Button>
              </CardContent>
            </Card>

            {/* Withdraw */}
            <Card className="card-institutional">
              <CardHeader>
                <CardTitle className="text-h3 text-fg-primary flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-red-400" />
                  Withdraw Collateral
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Amount (stroops)</Label>
                  <Input
                    value={formData.withdrawAmount}
                    onChange={(e) => handleInputChange('withdrawAmount', e.target.value)}
                    placeholder="500000 (0.5 SRWA)"
                  />
                  <p className="text-xs text-fg-muted mt-1">
                    Amount: {(Number(formData.withdrawAmount) / 10000000).toFixed(2)} SRWA
                  </p>
                </div>
                <Button
                  onClick={withdraw}
                  disabled={blendOps.isLoading}
                  className="w-full bg-red-600 hover:bg-red-700"
                >
                  {blendOps.isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Withdraw
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Pool Management Tab */}
        <TabsContent value="pool" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Register Pool */}
            <Card className="card-institutional">
              <CardHeader>
                <CardTitle className="text-h3 text-fg-primary">Register Existing Pool</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Pool Name</Label>
                  <Input
                    value={formData.poolName}
                    onChange={(e) => handleInputChange('poolName', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Pool Address</Label>
                  <Input
                    value={formData.poolAddress}
                    onChange={(e) => handleInputChange('poolAddress', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Oracle</Label>
                  <Input
                    value={formData.oracle}
                    onChange={(e) => handleInputChange('oracle', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Max Positions</Label>
                  <Input
                    type="number"
                    value={formData.maxPositions}
                    onChange={(e) => handleInputChange('maxPositions', e.target.value)}
                  />
                </div>
                <Button
                  onClick={registerPool}
                  disabled={blendOps.isLoading}
                  className="w-full"
                >
                  {blendOps.isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Register Pool
                </Button>
              </CardContent>
            </Card>

            {/* Token Configuration */}
            <Card className="card-institutional">
              <CardHeader>
                <CardTitle className="text-h3 text-fg-primary">Configure SRWA Token</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>SRWA Token Address</Label>
                  <Input
                    value={formData.tokenAddress}
                    onChange={(e) => handleInputChange('tokenAddress', e.target.value)}
                  />
                </div>
                <div>
                  <Label>LTV Ratio (basis points)</Label>
                  <Input
                    type="number"
                    value={formData.ltvRatio}
                    onChange={(e) => handleInputChange('ltvRatio', e.target.value)}
                    placeholder="8000 (80%)"
                  />
                </div>
                <div>
                  <Label>Liquidation Threshold (basis points)</Label>
                  <Input
                    type="number"
                    value={formData.liqThreshold}
                    onChange={(e) => handleInputChange('liqThreshold', e.target.value)}
                    placeholder="8500 (85%)"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={addTokenToPool}
                    disabled={blendOps.isLoading}
                    variant="outline"
                  >
                    Add Token
                  </Button>
                  <Button
                    onClick={setupReserve}
                    disabled={blendOps.isLoading}
                    variant="outline"
                  >
                    Setup Reserve
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Compliance Tab */}
        <TabsContent value="compliance" className="space-y-6">
          <Card className="card-institutional">
            <CardHeader>
              <CardTitle className="text-h3 text-fg-primary flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Compliance Check
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={checkCompliance}
                disabled={blendOps.isLoading}
                className="w-full"
              >
                {blendOps.isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Check Compliance
              </Button>

              {complianceResult && (
                <Alert variant={complianceResult.is_compliant ? "default" : "destructive"}>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Status:</strong> {complianceResult.is_compliant ? 'Compliant' : 'Non-Compliant'}
                    <br />
                    <strong>Reason:</strong> {complianceResult.reason}
                    {complianceResult.required_actions.length > 0 && (
                      <>
                        <br />
                        <strong>Required Actions:</strong> {complianceResult.required_actions.join(', ')}
                      </>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Results Tab */}
        <TabsContent value="results" className="space-y-6">
          <Card className="card-institutional">
            <CardHeader>
              <CardTitle className="text-h3 text-fg-primary">Operation Results</CardTitle>
            </CardHeader>
            <CardContent>
              {blendOps.error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{blendOps.error}</AlertDescription>
                </Alert>
              )}

              {result && (
                <div className="space-y-4">
                  <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-5 w-5 text-green-400" />
                      <span className="font-semibold text-green-400">
                        {result.operation || 'Operation'} completed successfully!
                      </span>
                    </div>
                    {result.transactionHash && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-fg-muted">Transaction Hash:</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(result.transactionHash)}
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            Copy
                          </Button>
                        </div>
                        <code className="text-xs bg-bg-elev-3 p-2 rounded block break-all">
                          {result.transactionHash}
                        </code>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(
                            `https://stellar.expert/explorer/testnet/tx/${result.transactionHash}`,
                            '_blank'
                          )}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          View on Explorer
                        </Button>
                      </div>
                    )}
                    {result.amount && (
                      <div className="mt-2">
                        <span className="text-sm text-fg-muted">Amount: </span>
                        <span className="font-mono text-sm">{(Number(result.amount) / 10000000).toFixed(2)} SRWA</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {!result && !blendOps.error && (
                <div className="text-center text-fg-muted py-8">
                  <p>No operations performed yet.</p>
                  <p className="text-sm">Use the tabs above to perform Blend operations.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contract References */}
          <Card className="card-institutional">
            <CardHeader>
              <CardTitle className="text-h3 text-fg-primary">Contract References</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {Object.entries(BLEND_CONTRACTS).map(([name, id]) => (
                <div key={name} className="flex items-center justify-between p-2 bg-bg-elev-3 rounded">
                  <span className="text-sm font-medium capitalize">{name.replace(/([A-Z])/g, ' $1').toLowerCase()}:</span>
                  <div className="flex items-center gap-2">
                    <code className="text-xs">{id.slice(0, 8)}...{id.slice(-4)}</code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(id)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
