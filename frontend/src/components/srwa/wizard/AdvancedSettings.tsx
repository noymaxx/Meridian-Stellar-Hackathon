import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Globe, 
  Users, 
  DollarSign, 
  Plus, 
  Trash2, 
  Info, 
  AlertCircle,
  Target,
  Wallet
} from 'lucide-react';

import { TokenCreationForm } from '@/types/srwa-contracts';
import { RWATemplate } from '@/types/templates';
import { getCountryByCode } from '@/data/countries';
import JurisdictionSelector from './JurisdictionSelector';
import { useWallet } from '@/components/wallet/WalletProvider';

interface AdvancedSettingsProps {
  formData: TokenCreationForm;
  template: RWATemplate;
  onChange: (updates: Partial<TokenCreationForm>) => void;
}


export default function AdvancedSettings({ formData, template, onChange }: AdvancedSettingsProps) {
  const [newDistributionAddress, setNewDistributionAddress] = useState('');
  const [newDistributionAmount, setNewDistributionAmount] = useState('');
  const { address, isConnected, connect } = useWallet();

  const useMyWallet = () => {
    if (address) {
      setNewDistributionAddress(address);
    }
  };

  const addDistribution = () => {
    if (!newDistributionAddress || !newDistributionAmount) return;
    
    const newDistribution = {
      to: newDistributionAddress,
      amount: newDistributionAmount,
    };
    
    onChange({
      initial_distribution: [...formData.initial_distribution, newDistribution]
    });
    
    setNewDistributionAddress('');
    setNewDistributionAmount('');
  };

  const removeDistribution = (index: number) => {
    const updated = formData.initial_distribution.filter((_, i) => i !== index);
    onChange({ initial_distribution: updated });
  };

  const getTotalDistribution = (): string => {
    return formData.initial_distribution
      .reduce((sum, dist) => sum + parseFloat(dist.amount || '0'), 0)
      .toString();
  };

  const isOverDistributed = (): boolean => {
    const total = parseFloat(getTotalDistribution());
    const supply = parseFloat(formData.initial_supply || '0');
    return total > supply;
  };

  const formatAmount = (amount: string, decimals: number): string => {
    const num = parseFloat(amount);
    if (isNaN(num)) return '0';
    return (num / Math.pow(10, decimals)).toLocaleString();
  };

  return (
    <div 
      className="space-y-6"
    >
      {/* Jurisdiction Controls */}
      <JurisdictionSelector
        allowedJurisdictions={formData.allowed_jurisdictions}
        deniedJurisdictions={formData.denied_jurisdictions}
        onAllowedChange={(jurisdictions) => onChange({ allowed_jurisdictions: jurisdictions })}
        onDeniedChange={(jurisdictions) => onChange({ denied_jurisdictions: jurisdictions })}
      />

      {/* Holder Limits */}
      <Card style={{
        backgroundColor: 'hsl(227, 20%, 7%)', // bg-elev-1
        border: '1px solid hsl(222, 23%, 14%)', // stroke-line
        borderRadius: '12px',
        padding: '0',
        marginBottom: '24px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        position: 'relative',
        zIndex: 1
      }}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Holder Limits</span>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Control the maximum number of token holders for regulatory compliance
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Enable Holder Limit</Label>
              <p className="text-sm text-muted-foreground">
                Restrict the maximum number of addresses that can hold tokens
              </p>
            </div>
            <Switch
              checked={formData.max_holders !== undefined}
              onCheckedChange={(checked) => 
                onChange({ 
                  max_holders: checked ? (template.default_config.max_holders || 1000) : undefined 
                })
              }
              className="data-[state=unchecked]:bg-slate-700 data-[state=unchecked]:border data-[state=unchecked]:border-slate-500"
              style={{ position: 'relative', zIndex: 20, pointerEvents: 'auto' }}
            />
          </div>

          {formData.max_holders !== undefined && (
            <div className="space-y-3 p-4 border rounded-lg bg-bg-elev-1 border-stroke-line">
              <div className="space-y-2">
                <Label>Maximum Number of Holders</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.max_holders}
                  onChange={(e) => onChange({ max_holders: parseInt(e.target.value) || 0 })}
                  className="w-32"
                />
                <p className="text-xs text-muted-foreground">
                  Recommended for {template.name}: {template.default_config.max_holders || 'No limit'}
                </p>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Many securities regulations require limiting the number of holders. 
                  For example, US Rule 506(b) typically limits to 35 non-accredited investors.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Initial Token Supply & Distribution */}
      <Card style={{
        backgroundColor: 'hsl(227, 20%, 7%)', // bg-elev-1
        border: '1px solid hsl(222, 23%, 14%)', // stroke-line
        borderRadius: '12px',
        padding: '0',
        marginBottom: '24px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        position: 'relative',
        zIndex: 1
      }}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5" />
            <span>Initial Token Supply</span>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Set the initial token supply and distribution plan
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Initial Supply */}
          <div className="space-y-2">
            <Label>Initial Supply</Label>
            <div className="flex items-center space-x-2">
              <Input
                type="number"
                min="0"
                step="1"
                value={formData.initial_supply}
                onChange={(e) => onChange({ initial_supply: e.target.value })}
                placeholder="1000000"
              />
              <span className="text-sm text-muted-foreground">
                {formData.symbol || 'tokens'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Raw amount in smallest unit. With {formData.decimals} decimals, this equals{' '}
              {formatAmount(formData.initial_supply || '0', formData.decimals)} tokens.
            </p>
          </div>

          {/* Initial Distribution */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Initial Distribution</Label>
            
            {/* Add Distribution */}
            <div className="space-y-4 p-4 border rounded-lg bg-bg-elev-1 border-stroke-line">
              <h4 className="font-medium">Add Distribution</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <Label>Recipient Address</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                      value={newDistributionAddress}
                      onChange={(e) => setNewDistributionAddress(e.target.value)}
                      className="flex-1"
                    />
                    {isConnected ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={useMyWallet}
                        className="px-3"
                        title="Use my wallet address"
                      >
                        <Wallet className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={connect}
                        className="px-3"
                        title="Connect wallet to use address"
                      >
                        <Wallet className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <div>
                  <Label>Amount</Label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="100000"
                    value={newDistributionAmount}
                    onChange={(e) => setNewDistributionAmount(e.target.value)}
                  />
                </div>
              </div>

              <Button
                onClick={addDistribution}
                disabled={!newDistributionAddress || !newDistributionAmount}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Distribution
              </Button>
            </div>

            {/* Current Distributions */}
            {formData.initial_distribution.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium">Distribution Plan</h4>
                {formData.initial_distribution.map((dist, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-mono truncate">
                        {dist.to}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatAmount(dist.amount, formData.decimals)} tokens
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDistribution(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                {/* Distribution Summary */}
                <div className={`p-3 border rounded-lg ${
                  isOverDistributed() ? 'bg-red-400/10 border-red-400/30' : 'bg-green-400/10 border-green-400/30'
                }`}>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total Distributed:</span>
                    <span className={isOverDistributed() ? 'text-red-400' : 'text-green-400'}>
                      {formatAmount(getTotalDistribution(), formData.decimals)} tokens
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span>Remaining:</span>
                    <span>
                      {formatAmount(
                        (parseFloat(formData.initial_supply || '0') - parseFloat(getTotalDistribution())).toString(),
                        formData.decimals
                      )} tokens
                    </span>
                  </div>
                </div>

                {isOverDistributed() && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Total distribution exceeds initial supply. Please adjust the amounts.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Template-Specific Settings */}
      {template.features.length > 0 && (
        <Card style={{
        backgroundColor: 'hsl(227, 20%, 7%)', // bg-elev-1
        border: '1px solid hsl(222, 23%, 14%)', // stroke-line
        borderRadius: '12px',
        padding: '0',
        marginBottom: '24px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        position: 'relative',
        zIndex: 1
      }}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5" />
              <span>{template.name} Features</span>
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Additional features specific to this token type
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {template.features.map((feature) => (
              <div
                key={feature.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div>
                  <div className="font-medium">{feature.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {feature.description}
                  </div>
                </div>
                <Switch
                  checked={feature.enabled_by_default}
                  disabled // For now, just show the defaults
                />
              </div>
            ))}
            
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                These features will be configured after token deployment. 
                Current settings show the recommended defaults for {template.name}.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Settings Summary */}
      {(formData.max_holders || 
        formData.allowed_jurisdictions.length > 0 || 
        formData.denied_jurisdictions.length > 0 ||
        formData.initial_distribution.length > 0) && (
        <Card style={{
          backgroundColor: 'hsl(224, 23%, 10%)', // bg-elev-2
          border: '1px solid hsl(192, 100%, 66%)', // brand-500
          borderRadius: '12px',
          padding: '0',
          marginBottom: '24px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          position: 'relative',
          zIndex: 1
        }}>
          <CardHeader>
            <CardTitle className="text-brand-400">Advanced Settings Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {formData.max_holders && (
              <div>
                <span className="text-sm text-muted-foreground">Max Holders:</span>
                <span className="ml-2 font-medium">{formData.max_holders.toLocaleString()}</span>
              </div>
            )}
            
            {formData.allowed_jurisdictions.length > 0 && (
              <div>
                <span className="text-sm text-muted-foreground">Allowed Jurisdictions:</span>
                <div className="mt-1 flex gap-1 flex-wrap">
                  {formData.allowed_jurisdictions.map(code => (
                    <Badge key={code} variant="outline" className="text-xs">
                      {getCountryByCode(code)?.name || code}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {formData.denied_jurisdictions.length > 0 && (
              <div>
                <span className="text-sm text-muted-foreground">Denied Jurisdictions:</span>
                <div className="mt-1 flex gap-1 flex-wrap">
                  {formData.denied_jurisdictions.map(code => (
                    <Badge key={code} variant="destructive" className="text-xs">
                      {getCountryByCode(code)?.name || code}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {formData.initial_distribution.length > 0 && (
              <div>
                <span className="text-sm text-muted-foreground">Initial Distribution:</span>
                <span className="ml-2 font-medium">
                  {formData.initial_distribution.length} recipients, {' '}
                  {formatAmount(getTotalDistribution(), formData.decimals)} tokens total
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}