import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Coins, Building2 } from 'lucide-react';
import { useTokenCreation, TokenCreationForm, PoolCreationForm } from '@/hooks/useTokenCreation';

interface TokenCreationModalProps {
  wallet: { publicKey: string; secretKey: string } | null;
  onTokenCreated?: (tokenAddress: string) => void;
  onPoolCreated?: (poolAddress: string) => void;
}

export function TokenCreationModal({ wallet, onTokenCreated, onPoolCreated }: TokenCreationModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('token');
  
  const { isCreating, createToken, deployPool } = useTokenCreation();

  const [tokenForm, setTokenForm] = useState<TokenCreationForm>({
    name: '',
    symbol: '',
    decimals: 7,
    initialSupply: '1000000',
    description: ''
  });

  const [poolForm, setPoolForm] = useState<PoolCreationForm>({
    name: '',
    oracle: 'GDUKMGUGDZQK6YHYA5Z6AY2G4XDSZPSZ3SW5UN3ARVMO6QSRDWP5YLEX',
    backstopTakeRate: 500,
    maxPositions: 100
  });

  const handleTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet) return;

    const tokenAddress = await createToken(tokenForm, wallet);
    if (tokenAddress) {
      onTokenCreated?.(tokenAddress);
      setIsOpen(false);
      setTokenForm({
        name: '',
        symbol: '',
        decimals: 7,
        initialSupply: '1000000',
        description: ''
      });
    }
  };

  const handlePoolSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet) return;

    const poolAddress = await deployPool(poolForm, wallet);
    if (poolAddress) {
      onPoolCreated?.(poolAddress);
      setIsOpen(false);
      setPoolForm({
        name: '',
        oracle: 'GDUKMGUGDZQK6YHYA5Z6AY2G4XDSZPSZ3SW5UN3ARVMO6QSRDWP5YLEX',
        backstopTakeRate: 500,
        maxPositions: 100
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          Create New
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Asset</DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="token" className="flex items-center gap-2">
              <Coins className="h-4 w-4" />
              SRWA Token
            </TabsTrigger>
            <TabsTrigger value="pool" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Lending Pool
            </TabsTrigger>
          </TabsList>

          <TabsContent value="token" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Create SRWA Token</CardTitle>
                <CardDescription>
                  Deploy a new Stellar Real World Asset (SRWA) token with custom parameters.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleTokenSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="token-name">Token Name</Label>
                      <Input
                        id="token-name"
                        placeholder="e.g., US Treasury Bill"
                        value={tokenForm.name}
                        onChange={(e) => setTokenForm(prev => ({ ...prev, name: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="token-symbol">Symbol</Label>
                      <Input
                        id="token-symbol"
                        placeholder="e.g., USDTBILL"
                        value={tokenForm.symbol}
                        onChange={(e) => setTokenForm(prev => ({ ...prev, symbol: e.target.value.toUpperCase() }))}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="token-decimals">Decimals</Label>
                      <Select
                        value={tokenForm.decimals.toString()}
                        onValueChange={(value) => setTokenForm(prev => ({ ...prev, decimals: parseInt(value) }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="6">6 (Standard)</SelectItem>
                          <SelectItem value="7">7 (Stellar Native)</SelectItem>
                          <SelectItem value="8">8 (High Precision)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="initial-supply">Initial Supply</Label>
                      <Input
                        id="initial-supply"
                        placeholder="1000000"
                        value={tokenForm.initialSupply}
                        onChange={(e) => setTokenForm(prev => ({ ...prev, initialSupply: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="token-description">Description</Label>
                    <Textarea
                      id="token-description"
                      placeholder="Describe the real-world asset backing this token..."
                      value={tokenForm.description}
                      onChange={(e) => setTokenForm(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                    />
                  </div>

                  <Button type="submit" disabled={isCreating} className="w-full">
                    {isCreating ? 'Creating Token...' : 'Create SRWA Token'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pool" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Deploy Lending Pool</CardTitle>
                <CardDescription>
                  Create a new Blend lending pool for your SRWA tokens.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePoolSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="pool-name">Pool Name</Label>
                    <Input
                      id="pool-name"
                      placeholder="e.g., USDC-SRWA Pool"
                      value={poolForm.name}
                      onChange={(e) => setPoolForm(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="oracle">Oracle Address</Label>
                    <Input
                      id="oracle"
                      placeholder="Oracle contract address"
                      value={poolForm.oracle}
                      onChange={(e) => setPoolForm(prev => ({ ...prev, oracle: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="backstop-rate">Backstop Take Rate (bps)</Label>
                      <Input
                        id="backstop-rate"
                        type="number"
                        placeholder="500"
                        value={poolForm.backstopTakeRate}
                        onChange={(e) => setPoolForm(prev => ({ ...prev, backstopTakeRate: parseInt(e.target.value) }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="max-positions">Max Positions</Label>
                      <Input
                        id="max-positions"
                        type="number"
                        placeholder="100"
                        value={poolForm.maxPositions}
                        onChange={(e) => setPoolForm(prev => ({ ...prev, maxPositions: parseInt(e.target.value) }))}
                        required
                      />
                    </div>
                  </div>

                  <Button type="submit" disabled={isCreating} className="w-full">
                    {isCreating ? 'Deploying Pool...' : 'Deploy Lending Pool'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
