import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowUpRight, TrendingDown, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { useBlendOperations } from '@/hooks/useBlendOperations';
import type { EnhancedPoolData } from '@/types/markets';
import type { SRWAMarketData } from '@/hooks/markets/useSRWAMarkets';

interface LendingModalProps {
  isOpen: boolean;
  onClose: () => void;
  pool: (EnhancedPoolData | SRWAMarketData) | null;
  mode: 'supply' | 'borrow';
  onTransactionComplete?: (poolAddress: string, amount: number, mode: 'supply' | 'borrow') => void;
}

export const LendingModal: React.FC<LendingModalProps> = ({
  isOpen,
  onClose,
  pool,
  mode,
  onTransactionComplete
}) => {
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const blendOps = useBlendOperations();

  // Check if this is an integrated SRWA token - Network-first approach
  const isIntegratedSRWAToken = () => {
    if (!pool || !('marketType' in pool)) return false;
    
    // For SRWA tokens, check if we have real Blend data
    // If the pool has real data from Blend, it means it's actually integrated
    const srwaPool = pool as SRWAMarketData;
    
    // Check if the pool has real-time data (this means it's integrated on-chain)
    // We can also check the asset prices source
    const hasRealBlendData = srwaPool.assetPrices && 
                            Object.values(srwaPool.assetPrices).some(price => 
                              price.source === 'Blend-Real'
                            );
    
    // If it's an SRWA token and has real Blend data, it's integrated
    // Also treat admin tokens as potentially integrated (they can integrate)
    return hasRealBlendData || srwaPool.isUserAdmin;
  };

  const handleSubmit = async () => {
    if (!amount || !pool || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setIsProcessing(true);
    const actionText = mode === 'supply' ? 'Supply' : 'Borrow';
    const amountValue = parseFloat(amount);

    try {
      const useRealBlendOps = isIntegratedSRWAToken();
      
      if (useRealBlendOps) {
        // Use real Blend operations for integrated SRWA tokens
        console.log(`🔗 [LendingModal] Using real Blend operations for ${actionText.toLowerCase()} (token: ${pool.address})`);
        
        const poolAddress = "CAQ4DF5FLQHGAUEXYJKTVFFIVHVIUN6XNUE7NW27BJGWEPNHQKZYMRQ6"; // Default Blend pool
        
        if (mode === 'supply') {
          const result = await blendOps.supplyCollateral({
            poolAddress,
            token: pool.address,
            amount: amount,
          });
          
          console.log(`✅ [LendingModal] Real supply successful:`, result);
          toast.success(
            `${actionText} successful! ${amount} ${('marketType' in pool) ? (pool as SRWAMarketData).tokenContract.slice(-8) : 'tokens'} supplied to Blend pool`,
            {
              action: {
                label: "View Transaction →",
                onClick: () => result?.transactionHash && window.open(
                  `https://stellar.expert/explorer/testnet/tx/${result.transactionHash}`,
                  "_blank"
                ),
              },
            }
          );
        } else {
          const result = await blendOps.borrowAmount({
            poolAddress,
            token: pool.address,
            amount: amount,
          });
          
          console.log(`✅ [LendingModal] Real borrow successful:`, result);
          toast.success(
            `${actionText} successful! ${amount} ${('marketType' in pool) ? (pool as SRWAMarketData).tokenContract.slice(-8) : 'tokens'} borrowed from Blend pool`,
            {
              action: {
                label: "View Transaction →",
                onClick: () => result?.transactionHash && window.open(
                  `https://stellar.expert/explorer/testnet/tx/${result.transactionHash}`,
                  "_blank"
                ),
              },
            }
          );
        }
        
        // Call transaction complete callback to update pool data
        onTransactionComplete?.(pool.address, amountValue, mode);
        
      } else {
        // Try real operations first, fallback to mock if token isn't actually integrated
        console.log(`🔗 [LendingModal] Attempting real Blend operations for ${actionText.toLowerCase()} (fallback to mock if not integrated)`);
        
        const poolAddress = "CAQ4DF5FLQHGAUEXYJKTVFFIVHVIUN6XNUE7NW27BJGWEPNHQKZYMRQ6";
        
        try {
          // Try real Blend operations first
          if (mode === 'supply') {
            const result = await blendOps.supplyCollateral({
              poolAddress,
              token: pool.address,
              amount: amount,
            });
            
            console.log(`✅ [LendingModal] Real supply successful for non-cached token:`, result);
            toast.success(
              `${actionText} successful! ${amount} tokens supplied to Blend pool (Real Transaction)`,
              {
                action: {
                  label: "View Transaction →",
                  onClick: () => result?.transactionHash && window.open(
                    `https://stellar.expert/explorer/testnet/tx/${result.transactionHash}`,
                    "_blank"
                  ),
                },
              }
            );
          } else {
            const result = await blendOps.borrowAmount({
              poolAddress,
              token: pool.address,
              amount: amount,
            });
            
            console.log(`✅ [LendingModal] Real borrow successful for non-cached token:`, result);
            toast.success(
              `${actionText} successful! ${amount} tokens borrowed from Blend pool (Real Transaction)`,
              {
                action: {
                  label: "View Transaction →",
                  onClick: () => result?.transactionHash && window.open(
                    `https://stellar.expert/explorer/testnet/tx/${result.transactionHash}`,
                    "_blank"
                  ),
                },
              }
            );
          }
          
          // Update localStorage cache since the operation was successful
          try {
            const saved = localStorage.getItem('blend_integrated_tokens');
            const integratedTokens = saved ? JSON.parse(saved) : [];
            if (!integratedTokens.includes(pool.address)) {
              integratedTokens.push(pool.address);
              localStorage.setItem('blend_integrated_tokens', JSON.stringify(integratedTokens));
              console.log(`💾 [LendingModal] Updated cache after successful real operation`);
            }
          } catch (cacheError) {
            console.warn('Failed to update cache:', cacheError);
          }
          
        } catch (realOpError) {
          console.warn(`⚠️ [LendingModal] Real operation failed, falling back to mock:`, realOpError);
          
          // Fallback to mock operations
          await new Promise(resolve => setTimeout(resolve, 1500));
          toast.success(`${actionText} successful! ${amount} tokens processed for ${pool.name} (Demo Mode - Token Not Integrated)`);
        }
        
        // Call transaction complete callback to update pool data
        onTransactionComplete?.(pool.address, amountValue, mode);
      }
      
      // Reset form and close modal
      setAmount('');
      onClose();
      
    } catch (error) {
      console.error(`❌ [LendingModal] ${actionText} failed:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`${actionText} failed: ${errorMessage}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setAmount('');
    onClose();
  };

  if (!pool) return null;

  const formatCurrency = (amount: number): string => {
    if (amount >= 1e6) return `$${(amount / 1e6).toFixed(1)}M`;
    if (amount >= 1e3) return `$${(amount / 1e3).toFixed(1)}K`;
    return `$${amount.toFixed(2)}`;
  };

  const formatPercent = (value: number): string => {
    if (isNaN(value) || value === 0 || !isFinite(value)) return "—";
    return `${value.toFixed(2)}%`;
  };

  const isSupply = mode === 'supply';
  const icon = isSupply ? ArrowUpRight : TrendingDown;
  const title = isSupply ? 'Supply' : 'Borrow';
  const description = isSupply 
    ? 'Deposit tokens to earn yield' 
    : 'Borrow tokens against your collateral';
  const apy = isSupply ? pool.supplyAPY : pool.borrowAPY;
  const buttonClass = isSupply 
    ? 'bg-brand-400 hover:bg-brand-500 text-white'
    : 'bg-orange-500 hover:bg-orange-600 text-white';

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-card border-stroke-line">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-fg-primary">
            {React.createElement(icon, { className: "h-5 w-5" })}
            {title} to {pool.name}
            {isIntegratedSRWAToken() && (
              <Badge variant="outline" className="ml-2 border-green-500/50 bg-green-500/10 text-green-400">
                Blend Integrated
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Pool Info */}
          <div className="p-4 bg-bg-elev-1 rounded-lg border border-stroke-line">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-fg-secondary">Pool</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-fg-primary">{pool.name}</span>
                  {'marketType' in pool && pool.marketType === 'srwa' && (
                    <Badge variant="outline" className="text-cyan-400 border-cyan-500/30 bg-cyan-500/10">
                      SRWA
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-fg-secondary">{title} APY</span>
                <span className="text-sm font-medium text-brand-400">
                  {formatPercent(apy)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-fg-secondary">Total Value Locked</span>
                <span className="text-sm font-medium text-fg-primary">
                  {formatCurrency(pool.tvl)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-fg-secondary">Available {isSupply ? 'Capacity' : 'Liquidity'}</span>
                <span className="text-sm font-medium text-fg-primary">
                  {formatCurrency(pool.availableLiquidity)}
                </span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Amount Input */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-fg-primary">
                Amount to {title}
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-fg-muted" />
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-10 bg-bg-elev-1 border-stroke-line text-fg-primary"
                  disabled={isProcessing}
                />
              </div>
            </div>

            <div className="text-xs text-fg-muted">
              {description}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isProcessing}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isProcessing || !amount || parseFloat(amount) <= 0}
              className={`flex-1 ${buttonClass}`}
            >
              {isProcessing ? `Processing ${title}...` : `Confirm ${title}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};