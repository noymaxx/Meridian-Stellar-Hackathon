import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle, 
  AlertCircle, 
  ExternalLink, 
  Copy, 
  Trash2, 
  Eye,
  Calendar,
  Hash,
  Shield,
  Globe,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { useCreatedTokens, type CreatedToken } from '@/hooks/useCreatedTokens';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function CreatedTokensList() {
  const { 
    tokens, 
    removeToken, 
    getTokenStats, 
    getFallbackTokens, 
    getRealTokens,
    clearAllTokens 
  } = useCreatedTokens();
  
  const [selectedToken, setSelectedToken] = useState<CreatedToken | null>(null);
  const [activeTab, setActiveTab] = useState('all');

  const stats = getTokenStats();
  const fallbackTokens = getFallbackTokens();
  const realTokens = getRealTokens();

  const getFilteredTokens = () => {
    switch (activeTab) {
      case 'recent':
        return tokens.filter(t => Date.now() - t.deployedAt < 24 * 60 * 60 * 1000);
      default:
        return tokens;
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTemplateIcon = (template: string) => {
    const icons: Record<string, string> = {
      'rwa_equity': '🏢',
      'rwa_debt': '💼',
      'rwa_commodity': '🥇',
      'rwa_real_estate': '🏠',
      'rwa_art': '🎨',
      'rwa_private_equity': '💎'
    };
    return icons[template] || '🔹';
  };

  const getTemplateName = (template: string) => {
    const names: Record<string, string> = {
      'rwa_equity': 'RWA Equity',
      'rwa_debt': 'RWA Debt',
      'rwa_commodity': 'RWA Commodity',
      'rwa_real_estate': 'RWA Real Estate',
      'rwa_art': 'RWA Art',
      'rwa_private_equity': 'RWA Private Equity'
    };
    return names[template] || template;
  };

  if (tokens.length === 0) {
    return (
      <Card className="card-institutional">
        <CardContent className="text-center py-12">
          <Sparkles className="h-12 w-12 text-fg-muted mx-auto mb-4" />
          <h3 className="text-h3 text-fg-primary mb-2">Nenhum Token Criado</h3>
          <p className="text-body-2 text-fg-muted mb-6">
            Crie seu primeiro token RWA para vê-lo aparecer aqui no dashboard.
          </p>
          <Button 
            onClick={() => window.location.href = '/srwa-issuance'}
            className="btn-primary"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Criar Primeiro Token
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="card-institutional">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-micro text-fg-muted uppercase">Total de Tokens</p>
                <p className="text-h3 font-semibold text-fg-primary">{stats.totalTokens}</p>
              </div>
              <Hash className="h-8 w-8 text-brand-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-institutional">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-micro text-fg-muted uppercase">Deployed</p>
                <p className="text-h3 font-semibold text-green-400">{stats.totalTokens}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-institutional">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-micro text-fg-muted uppercase">Templates</p>
                <p className="text-h3 font-semibold text-brand-400">{stats.templates.length}</p>
              </div>
              <Shield className="h-8 w-8 text-brand-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-institutional">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-micro text-fg-muted uppercase">Templates</p>
                <p className="text-h3 font-semibold text-brand-400">{stats.templates.length}</p>
              </div>
              <Shield className="h-8 w-8 text-brand-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de Filtro */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-between items-center">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="all">All Tokens ({tokens.length})</TabsTrigger>
            <TabsTrigger value="recent">Recent ({tokens.filter(t => Date.now() - t.deployedAt < 24 * 60 * 60 * 1000).length})</TabsTrigger>
          </TabsList>
          
          {tokens.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (confirm('Tem certeza que deseja remover todos os tokens?')) {
                  clearAllTokens();
                }
              }}
              className="text-red-400 border-red-500/30 hover:bg-red-500/10"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Limpar Todos
            </Button>
          )}
        </div>

        <TabsContent value={activeTab} className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {getFilteredTokens().map((token, index) => (
              <motion.div
                key={token.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                whileHover={{ y: -4, scale: 1.02 }}
              >
                <Card className="card-institutional hover-lift">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{getTemplateIcon(token.template)}</span>
                          <div>
                            <CardTitle className="text-h3 text-fg-primary">
                              {token.name}
                            </CardTitle>
                            <p className="text-body-2 text-fg-secondary">
                              {token.symbol} • {getTemplateName(token.template)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="outline"
                            className="bg-green-500/20 text-green-400 border-green-500/30"
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Live
                          </Badge>
                          
                          <Badge variant="outline" className="text-fg-muted">
                            <Calendar className="w-3 h-3 mr-1" />
                            {formatDate(token.deployedAt)}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedToken(token)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeToken(token.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Informações Básicas */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-micro text-fg-muted">Token Address:</span>
                        <div className="flex items-center gap-1">
                          <code className="text-xs text-brand-400 truncate max-w-24">
                            {token.tokenAddress.slice(0, 8)}...
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(token.tokenAddress, 'Endereço do Token')}
                            className="p-1 h-6 w-6"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-micro text-fg-muted">Admin:</span>
                        <div className="flex items-center gap-1">
                          <code className="text-xs text-fg-secondary truncate max-w-24">
                            {token.admin.slice(0, 8)}...
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(token.admin, 'Endereço do Admin')}
                            className="p-1 h-6 w-6"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => window.open(
                          `https://stellar.expert/explorer/testnet/tx/${token.stellarTxHash}`,
                          "_blank"
                        )}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Ver no Scanner
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedToken(token)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal de Detalhes do Token */}
      {selectedToken && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="card-institutional max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{getTemplateIcon(selectedToken.template)}</span>
                  <div>
                    <CardTitle className="text-h2 text-fg-primary">
                      {selectedToken.name}
                    </CardTitle>
                    <p className="text-body-1 text-fg-secondary">
                      {selectedToken.symbol} • {getTemplateName(selectedToken.template)}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => setSelectedToken(null)}
                >
                  ×
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Status */}
              <div className="flex items-center gap-4">
                <Badge 
                  variant="outline"
                  className="bg-green-500/20 text-green-400 border-green-500/30"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Live
                </Badge>
                
                <Badge variant="outline" className="text-fg-muted">
                  <Calendar className="w-4 h-4 mr-2" />
                  Criado em {formatDate(selectedToken.deployedAt)}
                </Badge>
              </div>

              {/* Endereços dos Contratos */}
              <div className="space-y-4">
                <h4 className="text-h3 font-semibold text-fg-primary">Endereços dos Contratos</h4>
                
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-bg-elev-3 border border-stroke-line">
                    <span className="text-fg-muted block mb-1">Token Contract:</span>
                    <div className="flex items-center gap-2">
                      <code className="text-xs text-brand-400 break-all flex-1">
                        {selectedToken.tokenAddress}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(selectedToken.tokenAddress, 'Token Address')}
                        className="p-1 h-6 w-6"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="p-3 rounded-lg bg-bg-elev-3 border border-stroke-line">
                    <span className="text-fg-muted block mb-1">Compliance Contract:</span>
                    <div className="flex items-center gap-2">
                      <code className="text-xs text-brand-400 break-all flex-1">
                        {selectedToken.complianceAddress}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(selectedToken.complianceAddress, 'Compliance Address')}
                        className="p-1 h-6 w-6"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="p-3 rounded-lg bg-bg-elev-3 border border-stroke-line">
                    <span className="text-fg-muted block mb-1">Identity Registry:</span>
                    <div className="flex items-center gap-2">
                      <code className="text-xs text-brand-400 break-all flex-1">
                        {selectedToken.identityRegistryAddress}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(selectedToken.identityRegistryAddress, 'Identity Registry')}
                        className="p-1 h-6 w-6"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Configurações */}
              <div className="space-y-4">
                <h4 className="text-h3 font-semibold text-fg-primary">Configurações</h4>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-fg-muted">Decimais:</span>
                    <span className="ml-2 text-fg-primary">{selectedToken.decimals}</span>
                  </div>
                  <div>
                    <span className="text-fg-muted">Supply Inicial:</span>
                    <span className="ml-2 text-fg-primary">{selectedToken.config.initial_supply}</span>
                  </div>
                  <div>
                    <span className="text-fg-muted">Max Holders:</span>
                    <span className="ml-2 text-fg-primary">{selectedToken.config.max_holders || 'Ilimitado'}</span>
                  </div>
                  <div>
                    <span className="text-fg-muted">Claim Topics:</span>
                    <span className="ml-2 text-fg-primary">{selectedToken.config.claim_topics.join(', ')}</span>
                  </div>
                </div>
              </div>

              {/* Ações */}
              <div className="flex gap-3">
                <Button
                  onClick={() => window.open(
                    `https://stellar.expert/explorer/testnet/tx/${selectedToken.stellarTxHash}`,
                    "_blank"
                  )}
                  className="flex-1"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Ver no Scanner da Stellar
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => removeToken(selectedToken.id)}
                  className="text-red-400 border-red-500/30 hover:bg-red-500/10"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remover
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
