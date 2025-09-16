# Configuração dos Contratos Oracle

## Status Atual

A integração com contratos oracle Reflector foi implementada mas está **temporariamente desabilitada** devido a problemas de compatibilidade com a interface dos contratos. Por enquanto, a aplicação usa:

1. **API Reflector** como método primário
2. **Dados Mock** como fallback quando a API falha

## Problemas Identificados

### 1. Erro de Storage Missing Value
```
Error(Storage, MissingValue) - trying to get non-existing value for contract instance
```

**Possíveis Causas:**
- Os contratos oracle não têm dados para os pares solicitados (XLM:USD, USDC:USD)
- Interface/função incorreta sendo chamada
- Formato de parâmetros incorreto

### 2. Função do Contrato
Atualmente tentamos chamar:
```typescript
contract.call('price', nativeToScVal(reflectorPair, { type: 'symbol' }))
```

**Possíveis Soluções a Investigar:**
- Verificar documentação oficial dos contratos
- Testar diferentes nomes de função: `get_price`, `price`, `get_twap`
- Verificar formato dos parâmetros (string vs symbol vs outros)
- Validar se os contratos estão ativos na testnet

## Como Habilitar os Contratos Oracle

### 1. Investigar Interface Correta

Primeiro, determine a interface correta dos contratos:

```bash
# Usar ferramentas Stellar para inspecionar contratos
stellar contract invoke --id CALI2BYU2JE6WVRUFYTS6MSBNEHGJ35P4AVCZYF3B6QOE3QKOB2PLE6M --source-account [ACCOUNT] --help
```

### 2. Atualizar Implementação

No arquivo `reflector-oracle.ts`, ajustar:

```typescript
// Linha 74-77
const operation = contract.call(
  'FUNCTION_NAME_CORRETA', // ex: 'get_price', 'last_price', etc.
  nativeToScVal(reflectorPair, { type: 'TIPO_CORRETO' }) // ex: 'string', 'symbol'
);
```

### 3. Habilitar na Aplicação

No arquivo `integrations/reflector/index.ts`, linha 507:

```typescript
export const reflectorClient = new ReflectorOracleClient(
  'https://api.reflector.network',
  true, // ← Mudar para true para habilitar contratos
  STELLAR_CONFIG
);
```

### 4. Configurações Específicas de Rede

Os endereços dos contratos podem ser configurados via variáveis de ambiente:

```env
# .env.local
VITE_ORACLE_STELLAR_DEX_TESTNET=ENDERECO_TESTNET_CORRETO
VITE_ORACLE_EXTERNAL_DEXS_TESTNET=ENDERECO_TESTNET_CORRETO
VITE_ORACLE_FIAT_RATES_TESTNET=ENDERECO_TESTNET_CORRETO
```

## Testes Necessários

### 1. Verificar Contratos Ativos
- Confirmar que os contratos estão deployados e funcionais
- Verificar se há dados disponíveis nos contratos
- Testar em mainnet vs testnet

### 2. Testar Interface
```typescript
// Exemplo de teste manual
const client = new ReflectorOracleContractClient(
  'https://soroban-testnet.stellar.org',
  'Test SDF Network ; September 2015',
  { stellarDex: 'CALI2BYU2JE6WVRUFYTS6MSBNEHGJ35P4AVCZYF3B6QOE3QKOB2PLE6M' }
);

try {
  const price = await client.getAssetPrice('XLM');
  console.log('Oracle price:', price);
} catch (error) {
  console.error('Oracle error:', error);
}
```

### 3. Validar Fallbacks
- Verificar que fallback para API funciona
- Confirmar que dados mock são retornados quando tudo falha
- Testar cache funcionando corretamente

## Benefícios Quando Funcionando

1. **Descentralização**: Dados diretos da blockchain
2. **Confiabilidade**: Sem dependência de APIs externas
3. **Latência**: Potencialmente mais rápido
4. **Transparência**: Dados verificáveis on-chain

## Logs de Debug

Para debugar problemas:

```typescript
// Adicionar em reflector-oracle.ts
console.log('Contract address:', contractAddress);
console.log('Reflector pair:', reflectorPair);
console.log('Network passphrase:', this.networkPassphrase);
console.log('RPC URL:', this.rpcServer.serverURL);
```

## Recursos Úteis

- [Stellar RPC Documentation](https://developers.stellar.org/docs/data/rpc)
- [Soroban Contract Interface](https://developers.stellar.org/docs/smart-contracts)
- [Reflector Network Docs](https://reflector.network/docs)
- [Stellar Expert Explorer](https://stellar.expert/explorer/testnet) para verificar contratos