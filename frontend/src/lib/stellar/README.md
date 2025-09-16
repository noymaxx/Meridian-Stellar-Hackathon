# Reflector Oracle Integration

## Overview

This module provides integration with Reflector Oracle on the Stellar blockchain, allowing the application to fetch real-time price data directly from smart contracts instead of relying on external APIs.

## Key Features

- **Direct Contract Integration**: Query oracle data directly from Soroban smart contracts
- **Fallback Support**: Automatic fallback to API if contract calls fail
- **Network Configuration**: Support for both testnet and mainnet
- **Caching**: Built-in price caching to reduce redundant calls
- **Type Safety**: Full TypeScript support with comprehensive types

## Oracle Contract Addresses

### Mainnet
- **Stellar DEX**: `CALI2BYU2JE6WVRUFYTS6MSBNEHGJ35P4AVCZYF3B6QOE3QKOB2PLE6M`
- **External CEXs/DEXs**: `CAFJZQWSED6YAWZU3GWRTOCNPPCGBN32L7QV43XX5LZLFTK6JLN34DLN`  
- **Fiat Exchange Rates**: `CBKGPWGKSKZF52CFHMTRR23TBWTPMRDIYZ4O2P5VS65BMHYH4DXMCJZC`

### Testnet
- Uses the same contract addresses (would be different in a real testnet deployment)

## Usage

### Basic Usage

```typescript
import { reflectorClient } from '@/integrations/reflector';

// Get single asset price
const xlmPrice = await reflectorClient.getAssetPrice('XLM');
console.log(`XLM Price: $${xlmPrice.price}`);

// Get multiple asset prices
const prices = await reflectorClient.getMultipleAssetPrices(['XLM', 'USDC', 'USDT']);
console.log('Prices:', prices);
```

### Using the Hook

```typescript
import { useAssetPrices } from '@/hooks/markets/useAssetPrices';

function MyComponent() {
  const { prices, loading, error } = useAssetPrices(['XLM', 'USDC']);
  
  if (loading) return <div>Loading prices...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <div>
      <p>XLM: ${prices.XLM?.price}</p>
      <p>USDC: ${prices.USDC?.price}</p>
    </div>
  );
}
```

### Advanced Configuration

```typescript
import { createReflectorOracleClientFromConfig } from '@/lib/stellar/reflector-oracle';
import { STELLAR_CONFIG } from '@/lib/stellar-config';

// Create a custom client
const customClient = createReflectorOracleClientFromConfig(STELLAR_CONFIG);

// Get oracle health status
const isHealthy = await customClient.checkOracleHealth();
console.log('Oracle healthy:', isHealthy);

// Check if oracle is degraded
const isDegraded = await customClient.isOracleDegraded(
  'CALI2BYU2JE6WVRUFYTS6MSBNEHGJ35P4AVCZYF3B6QOE3QKOB2PLE6M',
  'XLM:USD'
);
```

## Configuration

### Environment Variables

You can customize oracle contract addresses using environment variables:

```env
# Mainnet Oracle Contracts
VITE_ORACLE_STELLAR_DEX_MAINNET=CALI2BYU2JE6WVRUFYTS6MSBNEHGJ35P4AVCZYF3B6QOE3QKOB2PLE6M
VITE_ORACLE_EXTERNAL_DEXS_MAINNET=CAFJZQWSED6YAWZU3GWRTOCNPPCGBN32L7QV43XX5LZLFTK6JLN34DLN
VITE_ORACLE_FIAT_RATES_MAINNET=CBKGPWGKSKZF52CFHMTRR23TBWTPMRDIYZ4O2P5VS65BMHYH4DXMCJZC

# Testnet Oracle Contracts  
VITE_ORACLE_STELLAR_DEX_TESTNET=...
VITE_ORACLE_EXTERNAL_DEXS_TESTNET=...
VITE_ORACLE_FIAT_RATES_TESTNET=...
```

### Fallback Mode

If you want to disable contract usage and fall back to API only:

```typescript
import { ReflectorOracleClient } from '@/integrations/reflector';

const apiOnlyClient = new ReflectorOracleClient(
  'https://api.reflector.network',
  false, // Disable contract usage
  STELLAR_CONFIG
);
```

## Supported Assets

The oracle currently supports the following assets:
- **XLM**: Stellar Lumens
- **USDC**: USD Coin  
- **USDT**: Tether USD
- **BTC**: Bitcoin
- **ETH**: Ethereum

## Error Handling

The client implements comprehensive error handling:

1. **Contract Fallback**: If contract calls fail, automatically falls back to API
2. **Cache Fallback**: If both contract and API fail, returns cached data if available
3. **Health Checks**: Regular health checks to monitor oracle status
4. **Graceful Degradation**: Application continues to work even if some oracles are down

## Type Definitions

### Core Types

```typescript
interface AssetPriceFromOracle {
  asset: string;
  price: number;
  timestamp: number;
  source: 'reflector-oracle' | 'reflector-api' | 'coingecko';
  degraded: boolean;
  oracleData?: OracleContractState;
}

interface OracleContractState {
  reflectorPair: string;
  twap: string;
  twapTs: number;
  staleSecs: number;
  nav: string;
  navValidUntil: number;
  haircutBps: number;
  bandBps: number;
  effectivePrice: string;
  degraded: boolean;
}
```

## Migration from API-only

If you were previously using the API-only version:

1. **No Code Changes Required**: The interface remains the same
2. **Automatic Contract Usage**: Contracts are used by default
3. **Fallback Maintained**: API fallback ensures compatibility
4. **Enhanced Data**: Contract responses include additional oracle metadata

## Performance Considerations

- **Caching**: Prices are cached for 30 seconds to reduce redundant calls
- **Parallel Requests**: Multiple asset prices are fetched in parallel
- **Timeout Handling**: Requests timeout after 8 seconds to prevent hanging
- **Network Efficiency**: Optimized for Stellar network characteristics

## Monitoring

The client provides several monitoring capabilities:

```typescript
// Check oracle health
const isHealthy = await reflectorClient.checkOracleHealth();

// Get cache status
const cacheStatus = client.getPriceCacheStatus();
console.log(`Cache size: ${cacheStatus.size}, Entries: ${cacheStatus.entries}`);

// Clear cache if needed
client.clearPriceCache();
```

## Troubleshooting

### Common Issues

1. **Network Connection**: Ensure proper connection to Stellar RPC
2. **Contract Addresses**: Verify oracle contract addresses are correct
3. **Asset Support**: Check if the requested asset is supported
4. **Rate Limiting**: Be mindful of RPC rate limits

### Debug Mode

Enable detailed logging by setting environment variable:

```env
VITE_DEBUG_ORACLE=true
```

This will provide additional console output for debugging oracle interactions.