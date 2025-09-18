import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { 
  Search, 
  Globe, 
  CheckCircle, 
  X,
  AlertTriangle,
  Info,
  Users,
  Shield,
  ChevronDown,
  Plus
} from 'lucide-react';

import { 
  COUNTRIES_BY_REGION, 
  SANCTIONED_JURISDICTIONS, 
  searchCountries, 
  getCountryByCode 
} from '@/data/countries';

interface JurisdictionSelectorProps {
  allowedJurisdictions: string[];
  deniedJurisdictions: string[];
  onAllowedChange: (jurisdictions: string[]) => void;
  onDeniedChange: (jurisdictions: string[]) => void;
}

export default function JurisdictionSelector({
  allowedJurisdictions,
  deniedJurisdictions,
  onAllowedChange,
  onDeniedChange
}: JurisdictionSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeRegion, setActiveRegion] = useState<string>('all');
  const [allowedDropdownOpen, setAllowedDropdownOpen] = useState(false);
  const [deniedDropdownOpen, setDeniedDropdownOpen] = useState(false);

  // All countries for dropdown
  const allCountries = useMemo(() => 
    COUNTRIES_BY_REGION.flatMap(region => region.countries).sort((a, b) => a.name.localeCompare(b.name)), []
  );

  // Filter countries based on search query for the tabs/checkboxes view
  const filteredCountries = useMemo(() => {
    if (!searchQuery) {
      return activeRegion === 'all' 
        ? COUNTRIES_BY_REGION.flatMap(region => region.countries)
        : COUNTRIES_BY_REGION.find(region => region.name === activeRegion)?.countries || [];
    }
    return searchCountries(searchQuery);
  }, [searchQuery, activeRegion]);

  // Get available countries for dropdowns (excluding already selected ones)
  const availableForAllowed = useMemo(() => 
    allCountries.filter(country => !allowedJurisdictions.includes(country.code)), 
    [allCountries, allowedJurisdictions]
  );

  const availableForDenied = useMemo(() => 
    allCountries.filter(country => !deniedJurisdictions.includes(country.code)), 
    [allCountries, deniedJurisdictions]
  );

  const handleJurisdictionToggle = (
    countryCode: string,
    type: 'allowed' | 'denied',
    checked: boolean
  ) => {
    if (type === 'allowed') {
      const updated = checked
        ? [...allowedJurisdictions, countryCode]
        : allowedJurisdictions.filter(code => code !== countryCode);
      onAllowedChange(updated);
    } else {
      const updated = checked
        ? [...deniedJurisdictions, countryCode]
        : deniedJurisdictions.filter(code => code !== countryCode);
      onDeniedChange(updated);
    }
  };

  const addCountryFromDropdown = (countryCode: string, type: 'allowed' | 'denied') => {
    if (type === 'allowed') {
      onAllowedChange([...allowedJurisdictions, countryCode]);
      setAllowedDropdownOpen(false);
    } else {
      onDeniedChange([...deniedJurisdictions, countryCode]);
      setDeniedDropdownOpen(false);
    }
  };

  const selectAllInRegion = (region: string, type: 'allowed' | 'denied') => {
    const regionCountries = COUNTRIES_BY_REGION.find(r => r.name === region)?.countries || [];
    const countryCodes = regionCountries.map(country => country.code);
    
    if (type === 'allowed') {
      const newAllowed = [...new Set([...allowedJurisdictions, ...countryCodes])];
      onAllowedChange(newAllowed);
    } else {
      const newDenied = [...new Set([...deniedJurisdictions, ...countryCodes])];
      onDeniedChange(newDenied);
    }
  };

  const clearAllInRegion = (region: string, type: 'allowed' | 'denied') => {
    const regionCountries = COUNTRIES_BY_REGION.find(r => r.name === region)?.countries || [];
    const countryCodes = regionCountries.map(country => country.code);
    
    if (type === 'allowed') {
      const newAllowed = allowedJurisdictions.filter(code => !countryCodes.includes(code));
      onAllowedChange(newAllowed);
    } else {
      const newDenied = deniedJurisdictions.filter(code => !countryCodes.includes(code));
      onDeniedChange(newDenied);
    }
  };

  const applySanctionedList = () => {
    const sanctionedCodes = SANCTIONED_JURISDICTIONS.map(s => s.code);
    const newDenied = [...new Set([...deniedJurisdictions, ...sanctionedCodes])];
    onDeniedChange(newDenied);
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
          Configure which countries/regions can hold your tokens. All countries are included for fair representation.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search and Filter Controls */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search countries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Region Filter Tabs */}
          <Tabs value={activeRegion} onValueChange={setActiveRegion}>
            <TabsList className="grid grid-cols-7 w-full">
              <TabsTrigger value="all">All</TabsTrigger>
              {COUNTRIES_BY_REGION.map(region => (
                <TabsTrigger key={region.name} value={region.name} className="text-xs">
                  {region.name === 'North America' ? 'N. America' : 
                   region.name === 'South America' ? 'S. America' : region.name}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Jurisdiction Selection */}
            <div className="mt-6 space-y-6">
              {/* Allowed Jurisdictions */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span>Allowed Jurisdictions</span>
                  </Label>
                  {activeRegion !== 'all' && (
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => selectAllInRegion(activeRegion, 'allowed')}
                        className="text-xs"
                      >
                        Select All
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => clearAllInRegion(activeRegion, 'allowed')}
                        className="text-xs"
                      >
                        Clear All
                      </Button>
                    </div>
                  )}
                </div>

                <p className="text-sm text-muted-foreground">
                  If none selected, all jurisdictions are allowed (except denied ones)
                </p>

                {/* Dropdown selector for individual country selection */}
                <div className="flex items-center space-x-2">
                  <Popover open={allowedDropdownOpen} onOpenChange={setAllowedDropdownOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-60 justify-between border-green-500/30 hover:bg-green-500/10"
                        disabled={availableForAllowed.length === 0}
                      >
                        <span className="flex items-center">
                          <Plus className="h-4 w-4 mr-2" />
                          Add country individually
                        </span>
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-60 p-0">
                      <Command>
                        <CommandInput placeholder="Search countries..." />
                        <CommandEmpty>No countries found.</CommandEmpty>
                        <CommandGroup className="max-h-60 overflow-y-auto">
                          {availableForAllowed.map((country) => (
                            <CommandItem
                              key={country.code}
                              onSelect={() => addCountryFromDropdown(country.code, 'allowed')}
                              className="cursor-pointer"
                            >
                              <span className="flex items-center justify-between w-full">
                                <span>{country.name}</span>
                                <span className="text-xs text-muted-foreground">{country.region}</span>
                              </span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <span className="text-xs text-muted-foreground">
                    {availableForAllowed.length} countries available
                  </span>
                </div>

                <div className="max-h-40 overflow-y-auto border rounded-lg p-3 bg-bg-elev-1">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {filteredCountries.map((country) => (
                      <div key={country.code} className="flex items-center space-x-2">
                        <Checkbox
                          checked={allowedJurisdictions.includes(country.code)}
                          onCheckedChange={(checked) => 
                            handleJurisdictionToggle(country.code, 'allowed', checked as boolean)
                          }
                        />
                        <span className="text-sm truncate" title={country.name}>
                          {country.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {allowedJurisdictions.length > 0 && (
                  <div className="flex gap-1 flex-wrap max-h-20 overflow-y-auto">
                    {allowedJurisdictions.map((code) => {
                      const country = getCountryByCode(code);
                      return (
                        <Badge key={code} variant="outline" className="text-xs">
                          {country?.name || code}
                          <button
                            onClick={() => handleJurisdictionToggle(code, 'allowed', false)}
                            className="ml-1 hover:text-red-400"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Denied Jurisdictions */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-red-400" />
                    <span>Denied Jurisdictions</span>
                  </Label>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={applySanctionedList}
                      className="text-xs border-red-500/30 hover:bg-red-500/10"
                    >
                      Apply Sanctioned List
                    </Button>
                    {activeRegion !== 'all' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => selectAllInRegion(activeRegion, 'denied')}
                          className="text-xs"
                        >
                          Select All
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => clearAllInRegion(activeRegion, 'denied')}
                          className="text-xs"
                        >
                          Clear All
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                <p className="text-sm text-muted-foreground">
                  These jurisdictions will be explicitly blocked from holding tokens
                </p>

                {/* Dropdown selector for individual country selection */}
                <div className="flex items-center space-x-2">
                  <Popover open={deniedDropdownOpen} onOpenChange={setDeniedDropdownOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-60 justify-between border-red-500/30 hover:bg-red-500/10"
                        disabled={availableForDenied.length === 0}
                      >
                        <span className="flex items-center">
                          <Plus className="h-4 w-4 mr-2" />
                          Add country individually
                        </span>
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-60 p-0">
                      <Command>
                        <CommandInput placeholder="Search countries..." />
                        <CommandEmpty>No countries found.</CommandEmpty>
                        <CommandGroup className="max-h-60 overflow-y-auto">
                          {availableForDenied.map((country) => (
                            <CommandItem
                              key={country.code}
                              onSelect={() => addCountryFromDropdown(country.code, 'denied')}
                              className="cursor-pointer"
                            >
                              <span className="flex items-center justify-between w-full">
                                <span className={
                                  SANCTIONED_JURISDICTIONS.some(s => s.code === country.code) 
                                    ? 'text-red-400' 
                                    : ''
                                }>
                                  {country.name}
                                </span>
                                <span className="text-xs text-muted-foreground">{country.region}</span>
                              </span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <span className="text-xs text-muted-foreground">
                    {availableForDenied.length} countries available
                  </span>
                </div>

                <div className="max-h-40 overflow-y-auto border rounded-lg p-3 bg-bg-elev-1">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {filteredCountries.map((country) => (
                      <div key={country.code} className="flex items-center space-x-2">
                        <Checkbox
                          checked={deniedJurisdictions.includes(country.code)}
                          onCheckedChange={(checked) => 
                            handleJurisdictionToggle(country.code, 'denied', checked as boolean)
                          }
                        />
                        <span className={`text-sm truncate ${
                          SANCTIONED_JURISDICTIONS.some(s => s.code === country.code) 
                            ? 'text-red-400' 
                            : ''
                        }`} title={country.name}>
                          {country.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {deniedJurisdictions.length > 0 && (
                  <div className="flex gap-1 flex-wrap max-h-20 overflow-y-auto">
                    {deniedJurisdictions.map((code) => {
                      const country = getCountryByCode(code);
                      const isSanctioned = SANCTIONED_JURISDICTIONS.some(s => s.code === code);
                      return (
                        <Badge 
                          key={code} 
                          variant="destructive" 
                          className="text-xs"
                          title={isSanctioned ? 'Sanctioned jurisdiction' : undefined}
                        >
                          {country?.name || code}
                          <button
                            onClick={() => handleJurisdictionToggle(code, 'denied', false)}
                            className="ml-1 hover:text-white"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </Tabs>
        </div>

        {/* Information Alerts */}
        <div className="space-y-3">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              This jurisdiction selector includes all {COUNTRIES_BY_REGION.flatMap(r => r.countries).length} countries 
              and territories based on ISO 3166-1 alpha-2 standards for fair and comprehensive coverage.
            </AlertDescription>
          </Alert>

          {SANCTIONED_JURISDICTIONS.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                The "Apply Sanctioned List" includes {SANCTIONED_JURISDICTIONS.length} jurisdictions 
                currently under international sanctions (OFAC/UN/EU). Review your local compliance requirements.
              </AlertDescription>
            </Alert>
          )}

          {(allowedJurisdictions.length > 0 || deniedJurisdictions.length > 0) && (
            <Alert>
              <Users className="h-4 w-4" />
              <AlertDescription>
                <strong>Summary:</strong> {allowedJurisdictions.length > 0 
                  ? `${allowedJurisdictions.length} allowed, ` 
                  : 'All allowed (except denied), '
                }{deniedJurisdictions.length} denied jurisdictions configured.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
}