import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import { useWallet } from '@/components/wallet/WalletProvider';
import { useBlendOperations } from '@/hooks/useBlendOperations';
import { BLEND_TESTNET_IDS } from '@/integrations/blend/testnet';

export default function BlendOnboard() {
  const { address, isConnected, connect } = useWallet();
  const blendOps = useBlendOperations();

  const [poolAddress, setPoolAddress] = useState<string>(BLEND_TESTNET_IDS.ids.comet);
  const [poolName, setPoolName] = useState<string>('My SRWA Pool');
  const [oracle, setOracle] = useState<string>(BLEND_TESTNET_IDS.ids.oraclemock);
  const [maxPositions, setMaxPositions] = useState<string>('12');

  const [token, setToken] = useState<string>('');
  const [ltv, setLtv] = useState<string>('7000');
  const [liq, setLiq] = useState<string>('8000');

  const [reserveAsset, setReserveAsset] = useState<string>(BLEND_TESTNET_IDS.ids.USDC);

  const guard = () => {
    if (!isConnected) {
      toast.error('Connect wallet first');
      return false;
    }
    return true;
  };

  const doRegisterPool = async () => {
    if (!guard()) return;
    await handle(() => blendOps.registerPool({ poolAddress, name: poolName, oracle, maxPositions: parseInt(maxPositions) }));
  };

  const doAddToken = async () => {
    if (!guard()) return;
    if (!token) {
      toast.error('Enter your SRWA token contract address');
      return;
    }
    await handle(() => blendOps.addTokenToPool({ poolAddress, token, ltvRatio: parseInt(ltv), liqThreshold: parseInt(liq) }));
  };

  const doSetupReserve = async () => {
    if (!guard()) return;
    await handle(() => blendOps.setupPoolReserve({ poolAddress, asset: reserveAsset }));
  };

  const handle = async (fn: () => Promise<any>) => {
    try {
      const r = await fn();
      toast.success('Success');
      return r;
    } catch (e: any) {
      toast.error(e?.message || 'Failed');
    }
  };

  if (!isConnected) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Blend Onboarding</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p>Connect your wallet to onboard a pool and your SRWA token.</p>
            <Button onClick={connect} className="w-48">
              {blendOps.isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Connect Wallet
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <Badge variant="outline">Wallet {address?.slice(0,6)}...{address?.slice(-4)}</Badge>
        <Badge variant="outline">Network Testnet</Badge>
      </div>

      <Tabs defaultValue="pool" className="space-y-6">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="pool">Register Pool</TabsTrigger>
          <TabsTrigger value="token">Add Token</TabsTrigger>
          <TabsTrigger value="reserve">Setup Reserve</TabsTrigger>
        </TabsList>

        <TabsContent value="pool">
          <Card>
            <CardHeader>
              <CardTitle>Register Existing Pool</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Pool Address</Label>
                <Input value={poolAddress} onChange={e => setPoolAddress(e.target.value)} />
              </div>
              <div>
                <Label>Pool Name</Label>
                <Input value={poolName} onChange={e => setPoolName(e.target.value)} />
              </div>
              <div>
                <Label>Oracle</Label>
                <Input value={oracle} onChange={e => setOracle(e.target.value)} />
              </div>
              <div>
                <Label>Max Positions</Label>
                <Input type="number" value={maxPositions} onChange={e => setMaxPositions(e.target.value)} />
              </div>
              <div className="md:col-span-2">
                <Button onClick={doRegisterPool} disabled={blendOps.isLoading} className="w-full">
                  {blendOps.isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Register Pool
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="token">
          <Card>
            <CardHeader>
              <CardTitle>Add Your SRWA Token</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>SRWA Token Address</Label>
                <Input value={token} onChange={e => setToken(e.target.value)} placeholder="C..." />
              </div>
              <div>
                <Label>LTV Ratio (bps)</Label>
                <Input type="number" value={ltv} onChange={e => setLtv(e.target.value)} placeholder="7000 = 70%" />
              </div>
              <div>
                <Label>Liquidation Threshold (bps)</Label>
                <Input type="number" value={liq} onChange={e => setLiq(e.target.value)} placeholder="8000 = 80%" />
              </div>
              <div className="md:col-span-2">
                <Button onClick={doAddToken} disabled={blendOps.isLoading} className="w-full">
                  {blendOps.isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Add Token to Pool
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reserve">
          <Card>
            <CardHeader>
              <CardTitle>Setup Reserve Asset</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Reserve Asset</Label>
                <Input value={reserveAsset} onChange={e => setReserveAsset(e.target.value)} placeholder={BLEND_TESTNET_IDS.ids.USDC} />
              </div>
              <div className="md:col-span-2">
                <Button onClick={doSetupReserve} disabled={blendOps.isLoading} className="w-full">
                  {blendOps.isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Setup Reserve
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}


