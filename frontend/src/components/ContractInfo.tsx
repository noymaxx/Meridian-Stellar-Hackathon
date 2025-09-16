import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { poolService } from '@/lib/stellar/poolService';
import { ExternalLink, Copy, Check, Building2, Shield, Eye, Coins, Star, Settings, TestTube } from 'lucide-react';
import { toast } from 'sonner';
import { testContractMethods } from '@/lib/stellar/contractTest';

interface ContractInfoProps {
  className?: string;
}

export function ContractInfo({ className }: ContractInfoProps) {
  const [contractInfo, setContractInfo] = useState<{
    poolFactory: string;
    backstop: string;
    oracle: string;
    usdcToken: string;
    xlmToken: string;
    blndToken: string;
    admin: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  useEffect(() => {
    loadContractInfo();
  }, []);

  const loadContractInfo = async () => {
    setIsLoading(true);
    try {
      const info = await poolService.getContractInfo();
      setContractInfo(info);
    } catch (error) {
      console.error('Failed to load contract info:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(address);
      toast.success('Address copied to clipboard');
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Failed to copy address');
    }
  };

  const openInStellarScan = (address: string) => {
    window.open(`https://stellarscan.io/account/${address}`, '_blank');
  };

  const runContractTest = async () => {
    setIsTesting(true);
    try {
      console.log('🧪 Running contract method tests...');
      const results = await testContractMethods();
      console.log('Test results:', results);
      
      // Show results in toast
      const successCount = Object.values(results).filter((r: any) => r.success).length;
      const totalCount = Object.keys(results).length;
      
      toast.success(`Contract test completed: ${successCount}/${totalCount} methods working`, {
        action: {
          label: "View Console →",
          onClick: () => console.log('Full test results:', results)
        }
      });
    } catch (error) {
      console.error('Contract test failed:', error);
      toast.error('Contract test failed. Check console for details.');
    } finally {
      setIsTesting(false);
    }
  };

  const contractItems = [
    {
      key: 'poolFactory',
      label: 'Pool Factory',
      description: 'Official Blend pool factory contract',
      icon: <Building2 className="h-4 w-4" />,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10'
    },
    {
      key: 'backstop',
      label: 'Backstop',
      description: 'Backstop mechanism for pool protection',
      icon: <Shield className="h-4 w-4" />,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10'
    },
    {
      key: 'oracle',
      label: 'Oracle',
      description: 'Price oracle for asset valuations',
      icon: <Eye className="h-4 w-4" />,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10'
    },
    {
      key: 'usdcToken',
      label: 'USDC Token',
      description: 'USD Coin token contract',
      icon: <Coins className="h-4 w-4" />,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10'
    },
    {
      key: 'xlmToken',
      label: 'XLM Token',
      description: 'Stellar Lumens token contract',
      icon: <Star className="h-4 w-4" />,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10'
    },
    {
      key: 'blndToken',
      label: 'BLND Token',
      description: 'Blend protocol token contract',
      icon: <Coins className="h-4 w-4" />,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10'
    },
    {
      key: 'admin',
      label: 'Admin',
      description: 'Protocol administrator address',
      icon: <Settings className="h-4 w-4" />,
      color: 'text-gray-500',
      bgColor: 'bg-gray-500/10'
    }
  ];

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Contract Information</CardTitle>
          <CardDescription>Loading contract addresses...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-muted rounded-full animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded animate-pulse" />
                  <div className="h-3 bg-muted rounded w-3/4 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!contractInfo) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Contract Information</CardTitle>
          <CardDescription>Failed to load contract addresses</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={loadContractInfo} variant="outline">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
         <div className="flex items-center justify-between">
          <div>
            <CardTitle>Contract Information</CardTitle>
            <CardDescription>Official Stellar DeFi contract addresses</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={runContractTest}
            disabled={isTesting}
            className="flex items-center gap-2"
          >
            <TestTube className={`h-4 w-4 ${isTesting ? 'animate-spin' : ''}`} />
            {isTesting ? 'Testing...' : 'Test Methods'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {contractItems.map((item) => {
            const address = contractInfo[item.key as keyof typeof contractInfo];
            const isCopied = copiedAddress === address;
            
            return (
              <div key={item.key} className="flex items-center gap-3 p-3 rounded-lg border">
                <div className={`w-8 h-8 rounded-full ${item.bgColor} flex items-center justify-center`}>
                  <span className={item.color}>{item.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{item.label}</p>
                    {address && (
                      <Badge variant="secondary" className="text-xs">
                        Active
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">{item.description}</p>
                  {address ? (
                    <p className="text-xs font-mono text-muted-foreground truncate">
                      {address}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">Not available</p>
                  )}
                </div>
                {address && (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(address)}
                      className="h-8 w-8 p-0"
                    >
                      {isCopied ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openInStellarScan(address)}
                      className="h-8 w-8 p-0"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
