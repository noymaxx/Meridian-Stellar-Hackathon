import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Globe, 
  X,
  Info,
  Plus
} from 'lucide-react';

interface SimpleJurisdictionControlsProps {
  allowedJurisdictions: string[];
  deniedJurisdictions: string[];
  onAllowedChange: (jurisdictions: string[]) => void;
  onDeniedChange: (jurisdictions: string[]) => void;
}

export default function SimpleJurisdictionControls({
  allowedJurisdictions,
  deniedJurisdictions,
  onAllowedChange,
  onDeniedChange
}: SimpleJurisdictionControlsProps) {

  const addJurisdiction = (code: string, type: 'allowed' | 'denied') => {
    const trimmedCode = code.trim().toUpperCase();
    if (!trimmedCode || trimmedCode.length !== 2) return;
    
    if (type === 'allowed') {
      if (!allowedJurisdictions.includes(trimmedCode)) {
        onAllowedChange([...allowedJurisdictions, trimmedCode]);
      }
    } else {
      if (!deniedJurisdictions.includes(trimmedCode)) {
        onDeniedChange([...deniedJurisdictions, trimmedCode]);
      }
    }
  };

  const removeJurisdiction = (code: string, type: 'allowed' | 'denied') => {
    if (type === 'allowed') {
      onAllowedChange(allowedJurisdictions.filter(j => j !== code));
    } else {
      onDeniedChange(deniedJurisdictions.filter(j => j !== code));
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent, code: string, type: 'allowed' | 'denied') => {
    if (e.key === 'Enter') {
      addJurisdiction(code, type);
      (e.target as HTMLInputElement).value = '';
    }
  };

  return (
    <Card style={{
      backgroundColor: 'hsl(227, 20%, 7%)',
      border: '1px solid hsl(222, 23%, 14%)',
      borderRadius: '12px',
      padding: '0',
      marginBottom: '24px',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
      position: 'relative',
      zIndex: 1
    }}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Globe className="h-5 w-5" />
          <span>Jurisdiction Controls</span>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Configure which countries/regions can hold your tokens using ISO country codes
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Allowed Jurisdictions */}
        <div className="space-y-4">
          <Label className="text-base font-medium text-green-400">
            Allowed Jurisdictions
          </Label>
          <p className="text-sm text-muted-foreground">
            If none specified, all jurisdictions are allowed (except denied ones)
          </p>
          
          <div className="flex space-x-2">
            <Input
              placeholder="Enter country code (e.g., US, BR, DE)"
              maxLength={2}
              onKeyPress={(e) => {
                const value = (e.target as HTMLInputElement).value;
                handleKeyPress(e, value, 'allowed');
              }}
              className="flex-1"
              style={{ textTransform: 'uppercase' }}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const input = document.querySelector('input[placeholder*="country code"]') as HTMLInputElement;
                if (input?.value) {
                  addJurisdiction(input.value, 'allowed');
                  input.value = '';
                }
              }}
              className="border-green-500/30 hover:bg-green-500/10"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {allowedJurisdictions.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {allowedJurisdictions.map((code) => (
                <Badge key={code} variant="outline" className="text-xs">
                  {code}
                  <button
                    onClick={() => removeJurisdiction(code, 'allowed')}
                    className="ml-1 hover:text-red-400"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Denied Jurisdictions */}
        <div className="space-y-4">
          <Label className="text-base font-medium text-red-400">
            Denied Jurisdictions
          </Label>
          <p className="text-sm text-muted-foreground">
            These jurisdictions will be explicitly blocked from holding tokens
          </p>

          <div className="flex space-x-2">
            <Input
              placeholder="Enter country code (e.g., IR, KP)"
              maxLength={2}
              onKeyPress={(e) => {
                const value = (e.target as HTMLInputElement).value;
                handleKeyPress(e, value, 'denied');
              }}
              className="flex-1"
              style={{ textTransform: 'uppercase' }}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const inputs = document.querySelectorAll('input[placeholder*="country code"]');
                const input = inputs[1] as HTMLInputElement; // Second input for denied
                if (input?.value) {
                  addJurisdiction(input.value, 'denied');
                  input.value = '';
                }
              }}
              className="border-red-500/30 hover:bg-red-500/10"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {deniedJurisdictions.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {deniedJurisdictions.map((code) => (
                <Badge key={code} variant="destructive" className="text-xs">
                  {code}
                  <button
                    onClick={() => removeJurisdiction(code, 'denied')}
                    className="ml-1 hover:text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Information */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Use ISO 3166-1 alpha-2 country codes (e.g., US, BR, DE, JP, CN). 
            You can add multiple codes by typing each one and pressing Enter or clicking the + button.
          </AlertDescription>
        </Alert>

      </CardContent>
    </Card>
  );
}