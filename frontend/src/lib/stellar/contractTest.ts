import { Client, networks } from '@/lib/stellar/contract';
import { scValToNative } from '@stellar/stellar-sdk';

export async function testContractMethods() {
  console.log('🧪 Testing Stellar Smart Contract Methods...');
  
  const client = new Client({
    contractId: networks.testnet.contractId,
    networkPassphrase: networks.testnet.networkPassphrase,
    rpcUrl: "https://soroban-testnet.stellar.org",
  });

  const methods = [
    { name: 'get_pool_factory', method: () => client.get_pool_factory() },
    { name: 'get_backstop', method: () => client.get_backstop() },
    { name: 'get_oracle', method: () => client.get_oracle() },
    { name: 'get_usdc_token', method: () => client.get_usdc_token() },
    { name: 'get_xlm_token', method: () => client.get_xlm_token() },
    { name: 'get_blnd_token', method: () => client.get_blnd_token() },
    { name: 'get_admin', method: () => client.get_admin() },
    { name: 'get_all_pools', method: () => client.get_all_pools() },
    { name: 'pool_exists', method: () => client.pool_exists({ pool_address: 'CCT2DRUBLZV3I3H3JFEW64E4NMOSBCWMJCARM7SNC3WOBCNDWZ6FRQ7L' }) }
  ];

  const results: Record<string, any> = {};

  for (const { name, method } of methods) {
    try {
      console.log(`🔍 Testing ${name}...`);
      const result = await method();
      
      console.log(`${name} response:`, result);
      
      if (result.simulation && 'retval' in result.simulation) {
        const decoded = scValToNative(result.simulation.retval as any);
        results[name] = {
          success: true,
          data: decoded,
          raw: result.simulation.retval
        };
        console.log(`✅ ${name} decoded:`, decoded);
      } else {
        results[name] = {
          success: false,
          error: 'No retval in simulation',
          raw: result
        };
        console.log(`❌ ${name} failed: No retval in simulation`);
      }
    } catch (error) {
      console.error(`❌ ${name} error:`, error);
      results[name] = {
        success: false,
        error: error.message,
        raw: null
      };
    }
  }

  console.log('📊 Test Results Summary:', results);
  return results;
}

// Função para testar um método específico
export async function testSpecificMethod(methodName: string, ...args: any[]) {
  console.log(`🧪 Testing specific method: ${methodName}`);
  
  const client = new Client({
    contractId: networks.testnet.contractId,
    networkPassphrase: networks.testnet.networkPassphrase,
    rpcUrl: "https://soroban-testnet.stellar.org",
  });

  try {
    // @ts-ignore
    const method = client[methodName];
    if (typeof method !== 'function') {
      throw new Error(`Method ${methodName} not found`);
    }

    const result = await method(...args);
    console.log(`${methodName} result:`, result);
    
    if (result.simulation && 'retval' in result.simulation) {
      const decoded = scValToNative(result.simulation.retval as any);
      console.log(`${methodName} decoded:`, decoded);
      return { success: true, data: decoded, raw: result };
    } else {
      console.log(`${methodName} no retval:`, result);
      return { success: false, error: 'No retval', raw: result };
    }
  } catch (error) {
    console.error(`${methodName} error:`, error);
    return { success: false, error: error.message, raw: null };
  }
}
