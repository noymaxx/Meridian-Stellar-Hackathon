# SRWA Token - Security RWA on Stellar Soroban

A comprehensive implementation of ERC-3643 compliant Security RWA tokens on Stellar's Soroban platform, with native SEP-41 interface and full compliance framework.

## 🌟 Features

### Core Compliance Framework
- **ERC-3643 Standard**: Full implementation adapted for Soroban
- **SEP-41 Token Interface**: Native Stellar token compatibility
- **Identity Management**: On-chain identity registry with verifiable claims
- **Modular Compliance**: Pluggable compliance modules for different regulations
- **Trusted Issuers**: Decentralized KYC/AML verification system

### Compliance Modules
- **Jurisdiction Module**: Country-based transfer restrictions
- **Pause/Freeze Module**: Emergency controls and selective freezing
- **Max Holders Module**: Cap on number of token holders
- **Lockup Module**: Token vesting and lockup schedules
- **Transfer Windows**: Time-based transfer restrictions

### DeFi Integrations
- **SoroSwap Adapter**: Compliant DEX trading with pre-swap verification
- **Blend Adapter**: Lending protocol integration with SRWA collateral
- **Oracle Support**: Price feeds for collateral valuation

### Administrative Tools
- **Token Factory**: Deterministic deployment with templates
- **Upgrade System**: Contract upgrade capabilities
- **Multi-signature Support**: Role-based access control

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   SRWA Token    │────│ Compliance Core  │────│ Identity Registry│
│   (SEP-41)      │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌────────┴────────┐              │
         │              │  Compliance     │              │
         │              │    Modules      │              │
         │              └─────────────────┘              │
         │                                               │
┌─────────────────┐                              ┌──────┴─────┐
│  SoroSwap       │                              │ Trusted    │
│  Integration    │                              │ Issuers    │
└─────────────────┘                              └────────────┘
┌─────────────────┐                              ┌────────────┐
│  Blend          │                              │ Claim      │
│  Integration    │                              │ Topics     │
└─────────────────┘                              └────────────┘
```

## 📋 Contract Overview

### Core Contracts

| Contract | Purpose | Key Functions |
|----------|---------|---------------|
| **SRWA Token** | Main token contract with SEP-41 interface | `transfer`, `mint`, `clawback`, `freeze` |
| **Compliance Core** | Orchestrates compliance checks | `can_transfer`, `bind_token`, `enable_module` |
| **Identity Registry** | Manages verified user identities | `register`, `is_verified`, `revoke` |
| **Identity Registry Storage** | Stores verifiable claims | `add_claim`, `revoke_claim`, `get_claim` |
| **Claim Topics Registry** | Defines required claim types | `add_claim_topic`, `list_claim_topics` |
| **Trusted Issuers Registry** | Manages authorized claim issuers | `add_trusted_issuer`, `is_trusted` |

### Compliance Modules

| Module | Purpose | Configuration |
|--------|---------|---------------|
| **Jurisdiction** | Geographic restrictions | Allowed/denied country codes |
| **Pause/Freeze** | Emergency controls | Global pause, address freezing |
| **Max Holders** | Holder count limits | Maximum number of token holders |
| **Lockup** | Token vesting | Linear/milestone vesting schedules |

### Integration Adapters

| Adapter | Purpose | Features |
|---------|---------|----------|
| **SoroSwap** | DEX integration | Pre-swap compliance checks, pool authorization |
| **Blend** | Lending integration | Collateral verification, LTV management |

## 🚀 Quick Start

### Prerequisites

```bash
# Install Soroban CLI
curl --proto '=https' --tlsv1.2 -sSf https://soroban.stellar.org/docs/getting-started/setup | sh

# Install Rust (if not already installed)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustup target add wasm32-unknown-unknown
```

### 1. Build Contracts

```bash
cd rwa
cargo build --release --target wasm32-unknown-unknown
```

### 2. Deploy Complete Ecosystem

```bash
# Set environment variables
export NETWORK=testnet
export ADMIN_ADDRESS=YOUR_ADMIN_ADDRESS

# Run deployment script
./scripts/deploy.sh
```

### 3. Set Up Trusted Issuer

```bash
# Configure a KYC provider
export ISSUER_ADDRESS=KYC_PROVIDER_ADDRESS
export ISSUER_NAME="KYC Provider"

./scripts/setup-issuer.sh
```

### 4. Issue Claims and Register Users

```bash
# Issue KYC claim for a user
soroban contract invoke \
  --id $IDENTITY_STORAGE_ID \
  --source $ISSUER_ADDRESS \
  --network $NETWORK \
  -- add_claim \
  --subject $USER_ADDRESS \
  --topic_id 1 \
  --issuer $ISSUER_ADDRESS \
  --data "0x1234567890abcdef" \
  --valid_until 1735689600

# Register user identity
soroban contract invoke \
  --id $IDENTITY_REGISTRY_ID \
  --source $ADMIN_ADDRESS \
  --network $NETWORK \
  -- register \
  --holder $USER_ADDRESS \
  --identity_id "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"
```

### 5. Mint Tokens

```bash
# Mint tokens to verified users
soroban contract invoke \
  --id $SRWA_TOKEN_ID \
  --source $ADMIN_ADDRESS \
  --network $NETWORK \
  -- mint \
  --to $USER_ADDRESS \
  --amount 1000000000000000000 # 1 token with 18 decimals
```

## 🔧 Configuration

### Token Templates

The Token Factory supports several pre-configured templates:

- **RWA Equity**: For equity securities (18 decimals, max 2000 holders)
- **RWA Debt**: For debt instruments (6 decimals, no holder limit)
- **Fund Share**: For fund tokens (18 decimals, max 500 holders)
- **Permissioned Stable**: For stablecoins (6 decimals, basic KYC)

### Compliance Module Configuration

```bash
# Configure jurisdiction restrictions
soroban contract invoke \
  --id $JURISDICTION_MODULE_ID \
  --source $ADMIN_ADDRESS \
  --network $NETWORK \
  -- configure_allowed_jurisdictions \
  --token $SRWA_TOKEN_ID \
  --jurisdictions '["US", "CA", "GB"]'

# Set maximum holders
soroban contract invoke \
  --id $MAX_HOLDERS_MODULE_ID \
  --source $ADMIN_ADDRESS \
  --network $NETWORK \
  -- set_max_holders \
  --token $SRWA_TOKEN_ID \
  --max_holders 1000
```

### SoroSwap Integration

```bash
# Authorize a pool for SRWA trading
soroban contract invoke \
  --id $SOROSWAP_ADAPTER_ID \
  --source $ADMIN_ADDRESS \
  --network $NETWORK \
  -- authorize_pool \
  --pool_address $POOL_ADDRESS \
  --token_a $SRWA_TOKEN_ID \
  --token_b $USDC_TOKEN_ID \
  --compliance_contract $COMPLIANCE_CORE_ID \
  --fee_bps 30
```

### Blend Integration

```bash
# Add SRWA as collateral in Blend
soroban contract invoke \
  --id $BLEND_ADAPTER_ID \
  --source $ADMIN_ADDRESS \
  --network $NETWORK \
  -- add_srwa_reserve \
  --reserve_address $RESERVE_ADDRESS \
  --srwa_token $SRWA_TOKEN_ID \
  --oracle $ORACLE_ADDRESS \
  --ltv_ratio 7500 \
  --liquidation_threshold 8500 \
  --pool_contract $BLEND_POOL_ADDRESS
```

## 🧪 Testing

```bash
# Run all tests
cargo test

# Run tests for specific contract
cargo test -p srwa_token

# Run integration tests
cargo test --test integration
```

## 📚 API Reference

### SRWA Token (SEP-41 + Extensions)

#### Core SEP-41 Functions
- `balance(id: Address) -> i128`
- `transfer(from: Address, to: Address, amount: i128)`
- `approve(from: Address, spender: Address, amount: i128, live_until_ledger: u32)`
- `allowance(from: Address, spender: Address) -> i128`
- `burn(from: Address, amount: i128)`
- `decimals() -> u32`
- `name() -> String`
- `symbol() -> String`

#### Admin Extensions
- `mint(to: Address, amount: i128)` - Mint new tokens
- `clawback(from: Address, amount: i128)` - Emergency token recovery
- `set_authorized(id: Address, authorized: bool)` - Authorize/deauthorize addresses
- `pause(paused: bool)` - Global pause/unpause
- `freeze(address: Address, amount: Option<i128>)` - Freeze tokens
- `force_transfer(from: Address, to: Address, amount: i128)` - Admin transfer

### Compliance Core

- `can_transfer(from: Address, to: Address, amount: i128, token: Address) -> bool`
- `bind_token(token: Address)` - Bind token to compliance
- `enable_module(module: Address)` - Enable compliance module
- `disable_module(module: Address)` - Disable compliance module

### Identity Registry

- `register(holder: Address, identity_id: BytesN<32>)` - Register user identity
- `is_verified(holder: Address) -> bool` - Check if user is verified
- `revoke(holder: Address)` - Revoke user identity

## 🔒 Security Considerations

1. **Admin Key Management**: Use multi-signature wallets for admin functions
2. **Compliance Updates**: Ensure compliance modules are audited before deployment
3. **Claim Verification**: Implement proper claim validation in trusted issuers
4. **Emergency Procedures**: Test pause/freeze mechanisms regularly
5. **Oracle Security**: Use multiple oracle sources for price feeds

## 🛣️ Roadmap

- [ ] **Cross-chain Bridge**: Support for multi-chain SRWA tokens
- [ ] **Advanced Analytics**: On-chain compliance reporting
- [ ] **Mobile SDK**: React Native integration
- [ ] **Governance Module**: Token holder voting mechanisms
- [ ] **Insurance Integration**: DeFi insurance for SRWA collateral

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

- **Documentation**: [Full documentation](#)
- **Discord**: [Community chat](#)
- **Issues**: [GitHub Issues](../../issues)

## 🙏 Acknowledgments

- **Stellar Development Foundation** for Soroban platform
- **TokenySolutions** for T-REX ERC-3643 reference implementation
- **SoroSwap** and **Blend** teams for DeFi integrations
- **ERC-3643 Working Group** for the security token standard