# SRWA Token Architecture Documentation

## Overview

The SRWA (Security RWA) token system is a comprehensive implementation of ERC-3643 compliant security tokens on Stellar's Soroban platform. It provides a modular, upgradeable framework for issuing and managing permissioned tokens with full regulatory compliance.

## Design Principles

### 1. **Compliance-First Architecture**
Every token transfer is gated through a comprehensive compliance framework that validates:
- Identity verification status
- Required claims (KYC, AML, etc.)
- Jurisdiction restrictions
- Transfer limits and lockups
- Pause/freeze states

### 2. **Modular Design**
The system uses a plugin architecture where compliance rules are implemented as separate modules that can be:
- Enabled/disabled per token
- Configured independently
- Upgraded without affecting other components
- Composed to create complex compliance profiles

### 3. **SEP-41 Native**
Built specifically for Soroban with full SEP-41 token interface compatibility, enabling:
- Seamless integration with Stellar ecosystem
- Native multi-signature support
- Efficient state management
- Built-in authorization mechanisms

### 4. **DeFi Integration Ready**
Designed from the ground up to work with DeFi protocols through specialized adapters:
- Pre-transaction compliance validation
- Pool/contract whitelisting
- Oracle integration for collateral valuation
- Automated liquidation protection

## Component Architecture

### Core Layer

```
┌─────────────────────────────────────────────────────────────┐
│                        SRWA Token                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   SEP-41 Core   │  │ Admin Extension │  │ Compliance   │ │
│  │                 │  │                 │  │   Hooks      │ │
│  │ • transfer      │  │ • mint          │  │ • pre_check  │ │
│  │ • approve       │  │ • clawback      │  │ • post_notify│ │
│  │ • burn          │  │ • freeze        │  │              │ │
│  │ • balance       │  │ • pause         │  │              │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                    Compliance Core                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │ Module Manager  │  │ Transfer Gate   │  │ Event Hooks  │ │
│  │                 │  │                 │  │              │ │
│  │ • enable        │  │ • can_transfer  │  │ • transferred│ │
│  │ • disable       │  │ • validate_all  │  │ • created    │ │
│  │ • configure     │  │ • early_exit    │  │ • destroyed  │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Identity Layer

```
┌─────────────────────────────────────────────────────────────┐
│                   Identity Registry                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │ User Management │  │ Verification    │  │ Integration  │ │
│  │                 │  │                 │  │              │ │
│  │ • register      │  │ • is_verified   │  │ • storage    │ │
│  │ • revoke        │  │ • check_claims  │  │ • topics     │ │
│  │ • update        │  │ • validate      │  │ • issuers    │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
                                │
                    ┌───────────┼───────────┐
                    ▼           ▼           ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ Identity        │ │ Claim Topics    │ │ Trusted Issuers │
│ Registry        │ │ Registry        │ │ Registry        │
│ Storage         │ │                 │ │                 │
│                 │ │ • KYC           │ │ • per topic     │
│ • claims        │ │ • AML           │ │ • authorization │
│ • revocation    │ │ • Accredited    │ │ • key rotation  │
│ • expiration    │ │ • Residency     │ │                 │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

### Compliance Module Layer

```
┌─────────────────────────────────────────────────────────────┐
│                   Compliance Modules                        │
├─────────────────┬─────────────────┬─────────────────────────┤
│  Jurisdiction   │  Pause/Freeze   │      Max Holders        │
│                 │                 │                         │
│ • allow_list    │ • global_pause  │ • count_tracking        │
│ • deny_list     │ • address_freeze│ • limit_enforcement     │
│ • auto_detect   │ • partial_freeze│ • add/remove_holders    │
├─────────────────┼─────────────────┼─────────────────────────┤
│     Lockup      │ Transfer Window │      Custom Module      │
│                 │                 │                         │
│ • vesting       │ • market_hours  │ • user_defined          │
│ • cliff_period  │ • blackout      │ • plugin_interface      │
│ • milestone     │ • quiet_period  │ • configurable          │
└─────────────────┴─────────────────┴─────────────────────────┘
```

### Integration Layer

```
┌─────────────────────────────────────────────────────────────┐
│                  DeFi Integrations                          │
├─────────────────────────────┬───────────────────────────────┤
│        SoroSwap             │           Blend               │
│                             │                               │
│ ┌─────────────────────────┐ │ ┌───────────────────────────┐ │
│ │    Pool Management      │ │ │    Reserve Management     │ │
│ │                         │ │ │                           │ │
│ │ • pool_authorization    │ │ │ • collateral_validation   │ │
│ │ • pre_swap_validation   │ │ │ • ltv_calculation         │ │
│ │ • compliance_checking   │ │ │ • liquidation_protection  │ │
│ └─────────────────────────┘ │ └───────────────────────────┘ │
│                             │                               │
│ ┌─────────────────────────┐ │ ┌───────────────────────────┐ │
│ │   User Experience       │ │ │     Oracle Integration    │ │
│ │                         │ │ │                           │ │
│ │ • eligibility_check     │ │ │ • price_feeds             │ │
│ │ • transaction_preview   │ │ │ • heartbeat_monitoring    │ │
│ │ • error_messaging       │ │ │ • deviation_thresholds    │ │
│ └─────────────────────────┘ │ └───────────────────────────┘ │
└─────────────────────────────┴───────────────────────────────┘
```

## Data Flow

### Transfer Validation Flow

```
User Transfer Request
        │
        ▼
┌─────────────────┐
│   SRWA Token    │ ◄── 1. Transfer called
│   SEP-41        │     (from, to, amount)
└─────────────────┘
        │
        ▼ 2. Pre-transfer validation
┌─────────────────┐
│ Compliance Core │ ◄── can_transfer(from, to, amount, token)
└─────────────────┘
        │
        ▼ 3. Check identity verification
┌─────────────────┐
│ Identity        │ ◄── is_verified(from) && is_verified(to)
│ Registry        │
└─────────────────┘
        │
        ▼ 4. Validate each enabled module
┌─────────────────┐
│ Compliance      │ ◄── For each module: check(from, to, amount)
│ Modules         │
└─────────────────┘
        │
        ▼ 5. If all checks pass
┌─────────────────┐
│ Execute         │ ◄── Update balances, emit events
│ Transfer        │
└─────────────────┘
        │
        ▼ 6. Post-transfer notifications
┌─────────────────┐
│ Compliance      │ ◄── transferred(from, to, amount)
│ Modules         │     (for stateful modules)
└─────────────────┘
```

### Identity Verification Flow

```
KYC Provider
        │
        ▼ 1. Submit verified claims
┌─────────────────┐
│ Identity        │ ◄── add_claim(subject, topic, data, expiry)
│ Registry        │     (only by trusted issuer)
│ Storage         │
└─────────────────┘
        │
        ▼ 2. Register user identity
┌─────────────────┐
│ Identity        │ ◄── register(holder, identity_id)
│ Registry        │     (by admin)
└─────────────────┘
        │
        ▼ 3. Verification check
┌─────────────────┐
│ Compliance      │ ◄── is_verified(holder)
│ Validation      │     • Check required topics
│                 │     • Validate claim expiry
│                 │     • Verify issuer trust
└─────────────────┘
```

## State Management

### Token State
- **Balances**: `Map<Address, i128>` - User token balances
- **Allowances**: `Map<(Address, Address), i128>` - Spending permissions
- **Authorization**: `Map<Address, bool>` - Address authorization status
- **Frozen**: `Map<Address, i128>` - Frozen token amounts per address
- **Metadata**: Name, symbol, decimals, total supply
- **Admin**: Current admin address
- **Compliance**: Bound compliance contract address

### Compliance State
- **Bound Tokens**: `Set<Address>` - Tokens using this compliance
- **Enabled Modules**: `Vec<Address>` - Active compliance modules
- **Identity Registry**: Reference to identity verification contract

### Identity State
- **Identities**: `Map<Address, Identity>` - Registered user identities
- **Claims**: `Map<(Address, u32), Claim>` - Verifiable claims per user
- **Topics**: `Map<u32, String>` - Required claim topics
- **Trusted Issuers**: `Map<(Address, u32), bool>` - Authorized claim issuers

### Module State (varies by module)
- **Jurisdiction**: Allowed/denied country lists per token
- **Pause/Freeze**: Pause status, frozen addresses and amounts
- **Max Holders**: Current holder count, holder addresses
- **Lockup**: Vesting schedules, released amounts

## Security Model

### Access Control
1. **Admin Controls**: Multi-signature admin for critical functions
2. **Role Separation**: Different roles for different operations
3. **Trusted Issuers**: Separate authorization for claim issuance
4. **Module Permissions**: Modules can only affect their own state

### Validation Layers
1. **Signature Validation**: Soroban native authorization
2. **Identity Verification**: Claims-based identity proof
3. **Compliance Checks**: Multi-module validation
4. **Business Logic**: Token-specific rules

### Emergency Procedures
1. **Global Pause**: Halt all transfers immediately
2. **Selective Freeze**: Freeze specific addresses or amounts
3. **Admin Clawback**: Emergency token recovery
4. **Module Disable**: Turn off problematic compliance rules

## Upgrade Strategy

### Contract Upgrades
- **Soroban Native**: Use built-in contract upgrade mechanism
- **State Migration**: Versioned state with migration functions
- **Rollback Plan**: Ability to revert to previous version

### Module Updates
- **Hot Swapping**: Enable/disable modules without token restart
- **Configuration Changes**: Update module parameters dynamically
- **Version Control**: Track module versions and compatibility

### Data Migration
- **State Versioning**: Include version in all state structures
- **Migration Scripts**: Automated data transformation
- **Compatibility Layer**: Support for legacy data formats

## Performance Considerations

### Gas Optimization
- **Minimal State Changes**: Batch operations where possible
- **Efficient Data Structures**: Use appropriate Soroban types
- **Early Exit**: Stop validation on first failure
- **Caching**: Cache frequently accessed data

### Scalability
- **Module Limits**: Cap number of enabled modules
- **Batch Operations**: Group related operations
- **Index Optimization**: Efficient data retrieval patterns

### Monitoring
- **Event Logging**: Comprehensive event emission
- **Metrics Collection**: Performance and usage metrics
- **Error Tracking**: Detailed error reporting

## Testing Strategy

### Unit Tests
- Individual contract function testing
- Module isolation testing
- State transition validation
- Error condition handling

### Integration Tests
- End-to-end transfer flows
- Multi-module interactions
- DeFi integration scenarios
- Upgrade path testing

### Security Tests
- Access control validation
- Attack vector testing
- Emergency procedure testing
- Oracle manipulation resistance

### Performance Tests
- Gas usage optimization
- Large-scale operation testing
- Concurrent access testing
- Network stress testing