# 📚 **Documentação Completa: Criação de Token RWA com Smart Contracts Stellar**

## 🎯 **Visão Geral**
Este documento detalha o processo completo de criação de um token RWA (Real World Asset) usando smart contracts Stellar, incluindo deploy, inicialização e configuração de todos os componentes do sistema.

---

## 📋 **Pré-requisitos**

### **Ferramentas Necessárias:**
- Stellar CLI (versão 23.0.1+)
- Wallet configurada (`nova-wallet`)
- Acesso à rede Stellar Testnet
- 8 smart contracts compilados e prontos para deploy

### **Wallet Information:**
- **Source**: `nova-wallet`
- **Address**: `SDEBSDRWPREGR35MYYHR236DZ56BYKHKVPLNFOSKZJT2AW7U2RINYZLB`
- **Network**: `testnet`

---

## 🚀 **Fase 1: Deploy dos Smart Contracts**

### **1.1 Claim Topics Registry**
```bash
cd claim_topics_registry
stellar contract deploy \
  --wasm target/wasm32v1-none/release/hello_world.wasm \
  --source nova-wallet \
  --network testnet
```
**Resultado**: `CADQZX6IIPAVVOJ6SVZFGXK374UE5KXDFKBB6VRVVCSFPS2OLTRHS3NT`

### **1.2 Compliance Core**
```bash
cd ../compliance_core
stellar contract deploy \
  --wasm target/wasm32v1-none/release/hello_world.wasm \
  --source nova-wallet \
  --network testnet
```
**Resultado**: `CBPMILI6XB3T5PIBUSOJFHOERIFAJBXYMNEGEJPCTPHRRXIRSTVMG7GI`

### **1.3 Compliance Modules**
```bash
cd ../compliance_modules
stellar contract deploy \
  --wasm target/wasm32v1-none/release/hello_world.wasm \
  --source nova-wallet \
  --network testnet
```
**Resultado**: `CC3PYCRZ5ULYSFYI4L5FFZQL2K6VKVUDKUYXWZEPNFLEWGQ35UDN6QY3`

### **1.4 Identity Registry**
```bash
cd ../identity_registry
stellar contract deploy \
  --wasm target/wasm32v1-none/release/hello_world.wasm \
  --source nova-wallet \
  --network testnet
```
**Resultado**: `CARBUWYQW45PVZ7N776IOCXGWNFE7WDLCMKAN6GZM7TVTRNLNNYYHU6Z`

### **1.5 Integrations**
```bash
cd ../integrations
stellar contract deploy \
  --wasm target/wasm32v1-none/release/hello_world.wasm \
  --source nova-wallet \
  --network testnet
```
**Resultado**: `CADJTJWRKMPCLLD2LVDWWNKFSFD77UTALKRUB6YGSLUTW36JQHUNYXXH`

### **1.6 SRWA Token**
```bash
cd ../srwa_token
stellar contract deploy \
  --wasm target/wasm32v1-none/release/hello_world.wasm \
  --source nova-wallet \
  --network testnet
```
**Resultado**: `CB7NRHA2IAUT6HDBPWMKN3LBHBPVW7VOW5YTGTUIZV3J64BNOXXHLU6L`

### **1.7 Token Factory**
```bash
cd ../token_factory
stellar contract deploy \
  --wasm target/wasm32v1-none/release/hello_world.wasm \
  --source nova-wallet \
  --network testnet
```
**Resultado**: `CC3APCHN2V5U7YK6MPFNBBNFUD4URIC3GWMHUJBJTQF6QJ36ECDSZSK6`

### **1.8 Trusted Issuers Registry**
```bash
cd ../trusted_issuers_registry
stellar contract deploy \
  --wasm target/wasm32v1-none/release/hello_world.wasm \
  --source nova-wallet \
  --network testnet
```
**Resultado**: `CDTBD2II6JGXHPDGMFWAQE2SRYXOCENGIE2Z5WHWNM6UG34BX5SQTDRN`

---

## ⚙️ **Fase 2: Inicialização dos Contratos**

### **2.1 Inicializar Token Factory**
```bash
stellar contract invoke \
  --id CC3APCHN2V5U7YK6MPFNBBNFUD4URIC3GWMHUJBJTQF6QJ36ECDSZSK6 \
  --source nova-wallet \
  --network testnet \
  -- initialize \
  --admin SDEBSDRWPREGR35MYYHR236DZ56BYKHKVPLNFOSKZJT2AW7U2RINYZLB
```
**Status**: ✅ Sucesso

### **2.2 Inicializar Compliance Core**
```bash
stellar contract invoke \
  --id CBPMILI6XB3T5PIBUSOJFHOERIFAJBXYMNEGEJPCTPHRRXIRSTVMG7GI \
  --source nova-wallet \
  --network testnet \
  -- initialize \
  --admin SDEBSDRWPREGR35MYYHR236DZ56BYKHKVPLNFOSKZJT2AW7U2RINYZLB \
  --identity_registry CARBUWYQW45PVZ7N776IOCXGWNFE7WDLCMKAN6GZM7TVTRNLNNYYHU6Z
```
**Status**: ✅ Sucesso

### **2.3 Inicializar Identity Registry**
```bash
stellar contract invoke \
  --id CARBUWYQW45PVZ7N776IOCXGWNFE7WDLCMKAN6GZM7TVTRNLNNYYHU6Z \
  --source nova-wallet \
  --network testnet \
  -- initialize \
  --admin SDEBSDRWPREGR35MYYHR236DZ56BYKHKVPLNFOSKZJT2AW7U2RINYZLB
```
**Status**: ✅ Sucesso

### **2.4 Inicializar Claim Topics Registry**
```bash
stellar contract invoke \
  --id CADQZX6IIPAVVOJ6SVZFGXK374UE5KXDFKBB6VRVVCSFPS2OLTRHS3NT \
  --source nova-wallet \
  --network testnet \
  -- initialize \
  --admin SDEBSDRWPREGR35MYYHR236DZ56BYKHKVPLNFOSKZJT2AW7U2RINYZLB
```
**Status**: ✅ Sucesso

### **2.5 Inicializar Trusted Issuers Registry**
```bash
stellar contract invoke \
  --id CDTBD2II6JGXHPDGMFWAQE2SRYXOCENGIE2Z5WHWNM6UG34BX5SQTDRN \
  --source nova-wallet \
  --network testnet \
  -- initialize \
  --admin SDEBSDRWPREGR35MYYHR236DZ56BYKHKVPLNFOSKZJT2AW7U2RINYZLB
```
**Status**: ✅ Sucesso

### **2.6 Inicializar Compliance Modules**
```bash
stellar contract invoke \
  --id CC3PYCRZ5ULYSFYI4L5FFZQL2K6VKVUDKUYXWZEPNFLEWGQ35UDN6QY3 \
  --source nova-wallet \
  --network testnet \
  -- init_pause_freeze \
  --admin SDEBSDRWPREGR35MYYHR236DZ56BYKHKVPLNFOSKZJT2AW7U2RINYZLB
```
**Status**: ✅ Sucesso

### **2.7 Inicializar Integrations**
```bash
stellar contract invoke \
  --id CADJTJWRKMPCLLD2LVDWWNKFSFD77UTALKRUB6YGSLUTW36JQHUNYXXH \
  --source nova-wallet \
  --network testnet \
  -- init_soroswap \
  --admin SDEBSDRWPREGR35MYYHR236DZ56BYKHKVPLNFOSKZJT2AW7U2RINYZLB
```
**Status**: ✅ Sucesso

---

## 🪙 **Fase 3: Criação do Token RWA**

### **3.1 Inicializar SRWA Token**
```bash
stellar contract invoke \
  --id CB7NRHA2IAUT6HDBPWMKN3LBHBPVW7VOW5YTGTUIZV3J64BNOXXHLU6L \
  --source nova-wallet \
  --network testnet \
  -- initialize \
  --admin SDEBSDRWPREGR35MYYHR236DZ56BYKHKVPLNFOSKZJT2AW7U2RINYZLB \
  --name "Real World Asset Token" \
  --symbol "RWA" \
  --decimals 7 \
  --compliance_contract CBPMILI6XB3T5PIBUSOJFHOERIFAJBXYMNEGEJPCTPHRRXIRSTVMG7GI
```
**Status**: ✅ Sucesso

### **3.2 Mint Tokens Iniciais**
```bash
stellar contract invoke \
  --id CB7NRHA2IAUT6HDBPWMKN3LBHBPVW7VOW5YTGTUIZV3J64BNOXXHLU6L \
  --source nova-wallet \
  --network testnet \
  -- mint \
  --to SDEBSDRWPREGR35MYYHR236DZ56BYKHKVPLNFOSKZJT2AW7U2RINYZLB \
  --amount 1000000000000
```
**Status**: ✅ Sucesso - 1,000,000 RWA tokens mintados

---

## 🔒 **Fase 4: Configuração do Sistema de Compliance**

### **4.1 Vincular Token ao Compliance Core**
```bash
stellar contract invoke \
  --id CBPMILI6XB3T5PIBUSOJFHOERIFAJBXYMNEGEJPCTPHRRXIRSTVMG7GI \
  --source nova-wallet \
  --network testnet \
  -- bind_token \
  --token CB7NRHA2IAUT6HDBPWMKN3LBHBPVW7VOW5YTGTUIZV3J64BNOXXHLU6L
```
**Status**: ✅ Sucesso

### **4.2 Adicionar Claim Topic**
```bash
stellar contract invoke \
  --id CADQZX6IIPAVVOJ6SVZFGXK374UE5KXDFKBB6VRVVCSFPS2OLTRHS3NT \
  --source nova-wallet \
  --network testnet \
  -- add_claim_topic \
  --topic_id 1 \
  --topic_name "RWA Verification"
```
**Status**: ✅ Sucesso

### **4.3 Adicionar Trusted Issuer**
```bash
stellar contract invoke \
  --id CDTBD2II6JGXHPDGMFWAQE2SRYXOCENGIE2Z5WHWNM6UG34BX5SQTDRN \
  --source nova-wallet \
  --network testnet \
  -- add_trusted_issuer \
  --issuer SDEBSDRWPREGR35MYYHR236DZ56BYKHKVPLNFOSKZJT2AW7U2RINYZLB \
  --topic_id 1
```
**Status**: ✅ Sucesso

### **4.4 Adicionar Identity Claim**
```bash
stellar contract invoke \
  --id CARBUWYQW45PVZ7N776IOCXGWNFE7WDLCMKAN6GZM7TVTRNLNNYYHU6Z \
  --source nova-wallet \
  --network testnet \
  -- add_claim \
  --subject SDEBSDRWPREGR35MYYHR236DZ56BYKHKVPLNFOSKZJT2AW7U2RINYZLB \
  --issuer SDEBSDRWPREGR35MYYHR236DZ56BYKHKVPLNFOSKZJT2AW7U2RINYZLB \
  --topic_id 1 \
  --data 52574120546F6B656E20486F6C646572205665726966696564 \
  --valid_until 1735689600
```
**Status**: ✅ Sucesso

---

## 🧪 **Fase 5: Testes do Sistema**

### **5.1 Verificar Balance**
```bash
stellar contract invoke \
  --id CB7NRHA2IAUT6HDBPWMKN3LBHBPVW7VOW5YTGTUIZV3J64BNOXXHLU6L \
  --source nova-wallet \
  --network testnet \
  -- balance \
  --id SDEBSDRWPREGR35MYYHR236DZ56BYKHKVPLNFOSKZJT2AW7U2RINYZLB
```
**Resultado**: `"1000000000000"` (1,000,000 RWA tokens)

### **5.2 Testar Transferência**
```bash
stellar contract invoke \
  --id CB7NRHA2IAUT6HDBPWMKN3LBHBPVW7VOW5YTGTUIZV3J64BNOXXHLU6L \
  --source nova-wallet \
  --network testnet \
  -- transfer \
  --from SDEBSDRWPREGR35MYYHR236DZ56BYKHKVPLNFOSKZJT2AW7U2RINYZLB \
  --to SDEBSDRWPREGR35MYYHR236DZ56BYKHKVPLNFOSKZJT2AW7U2RINYZLB \
  --amount 1000000000
```
**Status**: ✅ Sucesso - 1,000 RWA tokens transferidos

### **5.3 Verificar Total Supply**
```bash
stellar contract invoke \
  --id CB7NRHA2IAUT6HDBPWMKN3LBHBPVW7VOW5YTGTUIZV3J64BNOXXHLU6L \
  --source nova-wallet \
  --network testnet \
  -- total_supply
```
**Resultado**: `"1000000000000"` (1,000,000 RWA tokens)

---

## 📊 **Resumo Final**

### **🪙 Token RWA Criado:**
- **Nome**: Real World Asset Token
- **Símbolo**: RWA
- **Decimais**: 7
- **Supply Total**: 1,000,000 tokens
- **Contract ID**: `CB7NRHA2IAUT6HDBPWMKN3LBHBPVW7VOW5YTGTUIZV3J64BNOXXHLU6L`

### **🔗 Contratos Deployados:**
| Contrato | ID | Status |
|----------|----|---------| 
| Token Factory | `CC3APCHN2V5U7YK6MPFNBBNFUD4URIC3GWMHUJBJTQF6QJ36ECDSZSK6` | ✅ |
| Compliance Core | `CBPMILI6XB3T5PIBUSOJFHOERIFAJBXYMNEGEJPCTPHRRXIRSTVMG7GI` | ✅ |
| Identity Registry | `CARBUWYQW45PVZ7N776IOCXGWNFE7WDLCMKAN6GZM7TVTRNLNNYYHU6Z` | ✅ |
| Claim Topics Registry | `CADQZX6IIPAVVOJ6SVZFGXK374UE5KXDFKBB6VRVVCSFPS2OLTRHS3NT` | ✅ |
| Trusted Issuers Registry | `CDTBD2II6JGXHPDGMFWAQE2SRYXOCENGIE2Z5WHWNM6UG34BX5SQTDRN` | ✅ |
| Compliance Modules | `CC3PYCRZ5ULYSFYI4L5FFZQL2K6VKVUDKUYXWZEPNFLEWGQ35UDN6QY3` | ✅ |
| Integrations | `CADJTJWRKMPCLLD2LVDWWNKFSFD77UTALKRUB6YGSLUTW36JQHUNYXXH` | ✅ |
| SRWA Token | `CB7NRHA2IAUT6HDBPWMKN3LBHBPVW7VOW5YTGTUIZV3J64BNOXXHLU6L` | ✅ |

### **✅ Funcionalidades Implementadas:**
- ✅ Token RWA criado e inicializado
- ✅ Sistema de compliance configurado
- ✅ Identity claims adicionadas
- ✅ Trusted issuers registrados
- ✅ Claim topics configurados
- ✅ Transferências funcionando
- ✅ Módulos de compliance ativos

### **🚀 Próximos Passos:**
1. Integrar com frontend React
2. Adicionar mais compliance modules
3. Implementar KYC/AML
4. Configurar jurisdictions
5. Testar integrações (SoroSwap, Blend)

**🎉 O sistema RWA está completamente funcional e pronto para uso!**

---

## 📝 **Comandos Úteis para Desenvolvimento**

### **Verificar Status de um Contrato:**
```bash
stellar contract invoke --id <CONTRACT_ID> --source nova-wallet --network testnet -- <FUNCTION_NAME> --help
```

### **Listar Todas as Funções de um Contrato:**
```bash
stellar contract invoke --id <CONTRACT_ID> --source nova-wallet --network testnet -- --help
```

### **Verificar Transações no Stellar Expert:**
- Acesse: https://stellar.expert/explorer/testnet
- Use os Contract IDs listados acima para visualizar os contratos

### **Verificar Balance de Qualquer Endereço:**
```bash
stellar contract invoke \
  --id CB7NRHA2IAUT6HDBPWMKN3LBHBPVW7VOW5YTGTUIZV3J64BNOXXHLU6L \
  --source nova-wallet \
  --network testnet \
  -- balance \
  --id <ADDRESS>
```

---

## 🔧 **Troubleshooting**

### **Erro: "Account alias not found"**
- Verifique se a wallet `nova-wallet` está configurada corretamente
- Use `stellar keys show nova-wallet` para ver o endereço

### **Erro: "Missing argument"**
- Verifique a documentação da função com `--help`
- Certifique-se de que todos os parâmetros obrigatórios estão sendo passados

### **Erro: "Transaction simulation failed"**
- Verifique se o contrato foi inicializado corretamente
- Confirme se todos os parâmetros estão no formato correto

### **Erro: "Symbol too long"**
- Os símbolos no Soroban têm limite de 9 caracteres
- Use abreviações como `TOK_DEP` em vez de `TOKEN_DEPLOYED`
