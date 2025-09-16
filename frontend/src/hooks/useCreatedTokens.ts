import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export interface CreatedToken {
  id: string;
  uuid: string;
  name: string;
  symbol: string;
  decimals: number;
  admin: string;
  tokenAddress: string;
  stellarTxHash: string;
  complianceAddress: string;
  identityRegistryAddress: string;
  claimTopicsRegistryAddress: string;
  trustedIssuersReg: string;
  deployedAt: number;
  isFallback: boolean;
  template: string;
  config: {
    name: string;
    symbol: string;
    decimals: number;
    initial_supply: string;
    admin: string;
    compliance_modules: any[];
    claim_topics: number[];
    trusted_issuers: string[];
    max_holders?: number;
    allowed_jurisdictions: string[];
    denied_jurisdictions: string[];
  };
}

const STORAGE_KEY = 'panoramablock_created_tokens';

export const useCreatedTokens = () => {
  const [tokens, setTokens] = useState<CreatedToken[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Carregar tokens do localStorage na inicialização
  useEffect(() => {
    loadTokensFromStorage();
  }, []);

  const loadTokensFromStorage = () => {
    try {
      const storedTokens = localStorage.getItem(STORAGE_KEY);
      if (storedTokens) {
        const parsedTokens = JSON.parse(storedTokens) as CreatedToken[];
        setTokens(parsedTokens);
        console.log('🔗 [CreatedTokens] Loaded tokens from storage:', parsedTokens.length);
      }
    } catch (error) {
      console.error('🔗 [CreatedTokens] Error loading tokens from storage:', error);
    }
  };

  const saveTokensToStorage = (tokensToSave: CreatedToken[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tokensToSave));
      console.log('🔗 [CreatedTokens] Saved tokens to storage:', tokensToSave.length);
    } catch (error) {
      console.error('🔗 [CreatedTokens] Error saving tokens to storage:', error);
      throw new Error('Failed to save tokens to storage');
    }
  };

  const addToken = (token: Omit<CreatedToken, 'id'>) => {
    setIsLoading(true);
    try {
      const newToken: CreatedToken = {
        ...token,
        id: `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };

      const updatedTokens = [newToken, ...tokens];
      setTokens(updatedTokens);
      saveTokensToStorage(updatedTokens);

      toast.success(`Token ${token.name} (${token.symbol}) adicionado ao dashboard!`, {
        duration: 5000,
      });

      console.log('🔗 [CreatedTokens] Token added:', newToken);
      return newToken;
    } catch (error) {
      console.error('🔗 [CreatedTokens] Error adding token:', error);
      toast.error('Erro ao salvar token no dashboard');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const removeToken = (tokenId: string) => {
    try {
      const updatedTokens = tokens.filter(token => token.id !== tokenId);
      setTokens(updatedTokens);
      saveTokensToStorage(updatedTokens);

      toast.success('Token removido do dashboard');
      console.log('🔗 [CreatedTokens] Token removed:', tokenId);
    } catch (error) {
      console.error('🔗 [CreatedTokens] Error removing token:', error);
      toast.error('Erro ao remover token do dashboard');
    }
  };

  const updateToken = (tokenId: string, updates: Partial<CreatedToken>) => {
    try {
      const updatedTokens = tokens.map(token => 
        token.id === tokenId ? { ...token, ...updates } : token
      );
      setTokens(updatedTokens);
      saveTokensToStorage(updatedTokens);

      console.log('🔗 [CreatedTokens] Token updated:', tokenId);
    } catch (error) {
      console.error('🔗 [CreatedTokens] Error updating token:', error);
      toast.error('Erro ao atualizar token no dashboard');
    }
  };

  const clearAllTokens = () => {
    try {
      setTokens([]);
      localStorage.removeItem(STORAGE_KEY);
      toast.success('Todos os tokens foram removidos do dashboard');
      console.log('🔗 [CreatedTokens] All tokens cleared');
    } catch (error) {
      console.error('🔗 [CreatedTokens] Error clearing tokens:', error);
      toast.error('Erro ao limpar tokens do dashboard');
    }
  };

  const getTokenById = (tokenId: string) => {
    return tokens.find(token => token.id === tokenId);
  };

  const getTokensByTemplate = (template: string) => {
    return tokens.filter(token => token.template === template);
  };

  const getFallbackTokens = () => {
    return tokens.filter(token => token.isFallback);
  };

  const getRealTokens = () => {
    return tokens.filter(token => !token.isFallback);
  };

  // Estatísticas dos tokens
  const getTokenStats = () => {
    const totalTokens = tokens.length;
    const fallbackTokens = getFallbackTokens().length;
    const realTokens = getRealTokens().length;
    const templates = [...new Set(tokens.map(token => token.template))];
    
    return {
      totalTokens,
      fallbackTokens,
      realTokens,
      templates,
      lastCreated: tokens.length > 0 ? Math.max(...tokens.map(t => t.deployedAt)) : 0
    };
  };

  return {
    tokens,
    isLoading,
    addToken,
    removeToken,
    updateToken,
    clearAllTokens,
    getTokenById,
    getTokensByTemplate,
    getFallbackTokens,
    getRealTokens,
    getTokenStats,
    loadTokensFromStorage
  };
};
