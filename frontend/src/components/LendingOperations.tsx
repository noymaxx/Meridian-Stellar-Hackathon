import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useLendingOperations, LendingOperation } from '@/hooks/useLendingOperations';
import { useWallet } from '@/hooks/useWallet';
import { DollarSign, TrendingUp, TrendingDown, ArrowUpDown, Wallet } from 'lucide-react';

interface LendingOperationsProps {
  poolAddress: string;
  availableTokens?: Array<{ address: string; symbol: string; name: string }>;
}

export function LendingOperations({ poolAddress, availableTokens = [] }: LendingOperationsProps) {
  const [operation, setOperation] = useState<LendingOperation['type']>('supply');
  const [amount, setAmount] = useState('');
  const [selectedToken, setSelectedToken] = useState('');
  const { wallet } = useWallet();
  const { executeOperation, isLoading } = useLendingOperations();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || parseFloat(amount) <= 0) {
      return;
    }

    if ((operation === 'supply' || operation === 'withdraw') && !selectedToken) {
      return;
    }

    const lendingOperation: LendingOperation = {
      type: operation,
      poolAddress,
      amount,
      tokenAddress: selectedToken || undefined
    };

    await executeOperation(lendingOperation, wallet);
  };

  const operationConfig = {
    supply: {
      title: 'Supply Collateral',
      description: 'Provide SRWA tokens as collateral',
      icon: <TrendingUp className="h-5 w-5" />,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10'
    },
    borrow: {
      title: 'Borrow USDC',
      description: 'Borrow USDC against your collateral',
      icon: <DollarSign className="h-5 w-5" />,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10'
    },
    repay: {
      title: 'Repay Loan',
      description: 'Repay your USDC loan',
      icon: <TrendingDown className="h-5 w-5" />,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10'
    },
    withdraw: {
      title: 'Withdraw Collateral',
      description: 'Withdraw your SRWA collateral',
      icon: <ArrowUpDown className="h-5 w-5" />,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10'
    }
  };

  const currentConfig = operationConfig[operation];

  return (
    <Card className="card-institutional">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className={`w-10 h-10 rounded-full ${currentConfig.bgColor} flex items-center justify-center`}>
            {currentConfig.icon}
          </div>
          {currentConfig.title}
        </CardTitle>
        <CardDescription>{currentConfig.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Operation Type Selector */}
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(operationConfig).map(([key, config]) => (
              <Button
                key={key}
                type="button"
                variant={operation === key ? "default" : "outline"}
                onClick={() => setOperation(key as LendingOperation['type'])}
                className="flex items-center gap-2"
              >
                {config.icon}
                {config.title}
              </Button>
            ))}
          </div>

          {/* Token Selection (for supply/withdraw) */}
          {(operation === 'supply' || operation === 'withdraw') && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Token</label>
              <Select value={selectedToken} onValueChange={setSelectedToken}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a token" />
                </SelectTrigger>
                <SelectContent>
                  {availableTokens.map((token) => (
                    <SelectItem key={token.address} value={token.address}>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{token.symbol}</Badge>
                        <span>{token.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Amount Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Amount</label>
            <Input
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0"
              step="0.000001"
            />
          </div>

          {/* Pool Address Display */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Pool Address</label>
            <div className="p-2 bg-muted rounded-md font-mono text-sm">
              {poolAddress.slice(0, 8)}...{poolAddress.slice(-8)}
            </div>
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading || !wallet}
          >
            {!wallet ? (
              <>
                <Wallet className="h-4 w-4 mr-2" />
                Connect Wallet First
              </>
            ) : (
              <>
                {isLoading ? 'Processing...' : `Execute ${currentConfig.title}`}
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
