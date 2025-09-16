import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Check, Star, AlertTriangle } from 'lucide-react';

import { TokenTemplate } from '@/types/srwa-contracts';
import { RWA_TEMPLATES } from '@/types/templates';

interface TemplateSelectorProps {
  selectedTemplate: TokenTemplate;
  onTemplateSelect: (template: TokenTemplate) => void;
}

export default function TemplateSelector({ selectedTemplate, onTemplateSelect }: TemplateSelectorProps) {
  const templates = Object.values(RWA_TEMPLATES);

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold mb-2">Choose Your RWA Token Type</h3>
        <p className="text-muted-foreground">
          Select a template that best matches your use case. Each template comes with pre-configured compliance and features.
        </p>
      </div>

      <RadioGroup 
        value={selectedTemplate} 
        onValueChange={(value) => onTemplateSelect(value as TokenTemplate)}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        {templates.map((template) => (
          <div key={template.id} className="relative">
            <RadioGroupItem
              value={template.id}
              id={template.id}
              className="peer sr-only"
            />
            <Label
              htmlFor={template.id}
              className="cursor-pointer"
            >
              <Card className={`hover:shadow-md transition-all duration-200 ${
                selectedTemplate === template.id 
                  ? 'ring-2 ring-primary border-primary' 
                  : 'hover:border-primary/50'
              }`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">{template.icon}</div>
                      <div>
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        {template.id === TokenTemplate.RwaEquity && (
                          <Badge variant="secondary" className="mt-1">
                            <Star className="w-3 h-3 mr-1" />
                            Popular
                          </Badge>
                        )}
                      </div>
                    </div>
                    {selectedTemplate === template.id && (
                      <div className="bg-primary text-white rounded-full p-1">
                        <Check className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {template.description}
                  </p>
                </CardHeader>
                
                <CardContent className="pt-0 space-y-4">
                  {/* Use Cases */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">Common Use Cases:</h4>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      {template.use_cases.slice(0, 3).map((useCase, index) => (
                        <li key={index} className="flex items-center">
                          <div className="w-1 h-1 bg-muted-foreground rounded-full mr-2"></div>
                          {useCase}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Key Features */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">Key Features:</h4>
                    <div className="flex flex-wrap gap-1">
                      {template.features
                        .filter(f => f.enabled_by_default)
                        .slice(0, 3)
                        .map((feature) => (
                          <Badge key={feature.id} variant="outline" className="text-xs">
                            {feature.name}
                          </Badge>
                        ))}
                    </div>
                  </div>

                  {/* Restrictions */}
                  {template.restrictions.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2 flex items-center">
                        <AlertTriangle className="w-3 h-3 mr-1 text-amber-500" />
                        Key Restrictions:
                      </h4>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        {template.restrictions.slice(0, 2).map((restriction, index) => (
                          <li key={index} className="flex items-start">
                            <div className="w-1 h-1 bg-amber-500 rounded-full mr-2 mt-1.5 flex-shrink-0"></div>
                            {restriction.description}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Supported Integrations */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">DeFi Integrations:</h4>
                    <div className="flex space-x-2">
                      {template.supported_integrations.map((integration) => (
                        <Badge
                          key={integration.id}
                          variant={integration.supported ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {integration.name}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Configuration Preview */}
                  <div className="pt-2 border-t">
                    <h4 className="text-sm font-medium mb-2">Default Configuration:</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Decimals:</span>
                        <span className="ml-1 font-mono">{template.default_config.decimals}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Max Holders:</span>
                        <span className="ml-1 font-mono">
                          {template.default_config.max_holders || 'Unlimited'}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Required Claims:</span>
                        <div className="mt-1 flex gap-1">
                          {(template.default_config.claim_topics || []).map((topicId) => {
                            const topicNames = { 1: 'KYC', 2: 'AML', 3: 'Accredited' };
                            return (
                              <Badge key={topicId} variant="outline" className="text-xs">
                                {topicNames[topicId as keyof typeof topicNames]}
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Label>
          </div>
        ))}
      </RadioGroup>

      {/* Selected template details */}
      {selectedTemplate && (
        <Card className="mt-6 bg-primary/5 border-primary/20">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="text-xl">{RWA_TEMPLATES[selectedTemplate].icon}</div>
              <div>
                <CardTitle className="text-base">
                  Selected: {RWA_TEMPLATES[selectedTemplate].name}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  You can customize all settings in the following steps
                </p>
              </div>
            </div>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}