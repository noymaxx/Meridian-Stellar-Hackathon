# PanoramaBlock - SRWA Standard Documentation

Welcome to the PanoramaBlock technical documentation. This repository contains comprehensive documentation for the SRWA (Stellar Real-World Asset) standard and the PanoramaBlock ecosystem for institutional RWA lending on Stellar.

## 📚 Table of Contents

- [Overview](#overview)
- [Part I: Technical Vision & Strategy](#part-i-technical-vision--strategy)
- [Part II: SRWA Token & Compliance Specification](#part-ii-srwa-token--compliance-specification)
- [Part III: Integration Guides](#part-iii-integration-guides)
- [Part IV: Operations & Governance](#part-iv-operations--governance)
- [Quick Start](#quick-start)
- [External Resources](#external-resources)
- [Contributing](#contributing)
- [License](#license)

## Overview

PanoramaBlock introduces SRWA: a SEP-41–compatible fungible token with ERC-3643–inspired identity & compliance. SRWA moves compliance to the asset layer so every dApp that can move a SEP-41 token can automatically respect regulation.

### Key Features

- **Token-first Compliance**: Built-in compliance at the asset layer
- **Composable by Default**: Works with any SEP-41 compatible dApp
- **Institutional Grade**: Designed for regulated financial institutions
- **Modular Architecture**: Flexible compliance modules
- **Oracle Integration**: Hybrid pricing with NAV clamping

---

## Part I: Technical Vision & Strategy

### 1. Our Vision

**What we are standardizing**

PanoramaBlock introduces SRWA: a SEP-41–compatible fungible token with ERC-3643–inspired identity & compliance. SRWA moves compliance to the asset layer so every dApp that can move a SEP-41 token can automatically respect regulation.

**SRWA composes natively with:**
- **Blend (money market)**: SRWA as collateral, reserve listing, IRM, isolated spokes per RWA class
- **SoroSwap (AMM/Router)**: execution (SRWA↔USDC/XLM), rebalancing, partial liquidations with slippage guards
- **Reflector (price feeds)**: TWAP/spot/FX inputs clamped by custodial NAV via our OracleAdapter
- **DeFindex (data/vaults)**: APY/TVL/positions dashboards; optional USDC→RWA vaults

**Normative properties:**
- **P-1 (Compliance correctness)**: every state mutation that alters token balances MUST call Compliance.can_transfer() and MUST revert on false
- **P-2 (Determinism)**: given the same set of claims, modules, and integration allowlists, can_transfer is pure and deterministic
- **P-3 (Oracle hygiene)**: effective price for collateral logic MUST be clamp(TWAP_Reflector, NAV±band) * (1-haircut), with hard staleness thresholds and degraded mode
- **P-4 (Composable by default)**: any dApp that can call SEP-41 transfer/transfer_from/mint/burn can support SRWA without bespoke KYC code
- **P-5 (Upgrade discipline)**: upgrades MUST be governed by multisig + timelock with explicit storage migration and audit events

**Strategic end-state**: SRWA becomes the default envelope for permissioned RWAs on Stellar: plug once (issuers), compose anywhere (DeFi), operate with institutional guardrails (oracle + partial liq + modules).

### 2. Product & Market Thesis

#### The Problems

- **C-1 Fragmented compliance**: today, each protocol implements ad-hoc eligibility checks. This is error-prone and not composable
- **C-2 NAV vs on-chain price**: RWA tokens need valuation integrity; pure spot is noisy, pure NAV is stale
- **C-3 Liquidity silos & UX**: institutions want one standard rail to access lending, swaps, vaults, not N bespoke bridges
- **C-4 Auditability & operations**: regulated actors require explicit event trails, force actions, and deterministic policies

#### Our Solution

- **A-1 Compliance on the token (SRWA)**: identity, claims, sanctions, jurisdictions, accreditation, lockups, transfer windows, max holders—enforced before balance changes
- **A-2 Hybrid price oracle**: Reflector TWAP/FX clamped by custodial NAV (haircut + bands + staleness/degraded mode)
- **A-3 Motorized composability**: Blend provides isolated lending spokes; SoroSwap provides execution and paths; DeFindex provides data/vaults; our Optimizer adds P2P matching with Blend fallback
- **A-4 Operational rigor**: deterministic TokenFactory, admin console for registries and modules, IntegrationAllowlist for protocol endpoints, and runbooks

### 3. Value Proposition

#### For Issuers/Banks
- **Single integration surface**: deploy SRWA via TokenFactory; set registries/modules; get DeFi-ready distribution
- **Operations**: force transfer, freeze, lockups, transfer windows—event-logged and permissioned
- **SLA**: eligibility update < T+1 block; registry mutations reflected atomically; event retention ≥ 365 days

#### For Institutional Borrowers
- **Capital efficiency**: deposit SRWA as collateral; borrow USDC in Blend spokes
- **Predictable risk**: effective price uses NAV bands (Δ bounded), staleness limits, partial liq with lot size caps
- **SLA**: simulate→sign→send within <5s typical; liquidation engine lot execution <N blocks after HF breach

#### For Liquidity Providers/Treasuries
- **Guardrailed yield**: IRM with conservative slopes; utilization caps; partial liq; oracle safeguards
- **Analytics**: DeFindex + event streams for APY/TVL/borrows/liq slippage

### 4. Design Tenets & Trade-offs

- **Token-first compliance (SRWA)** → pro: composability, single source of truth; con: more checks per transfer (mitigated by compact storage & caching)
- **Oracle clamping** → pro: bounded valuation drift; con: extreme spot deviations are ignored (intended)
- **Isolated spokes in Blend** → pro: blast radius limited; con: fragmented liquidity (mitigated by Optimizer + router)
- **Explicit allowlisting** → pro: safer integrations; con: governance overhead (mitigated with batched updates & events)
- **Upgrade discipline** → pro: safer evolution; con: slower changes (intended for institutional trust)

### 5. System Architecture Overview

**Token-first Architecture:**

The SRWA ecosystem follows a token-first compliance approach where:

**Core Layer:**
- **SRWA Token**: SEP-41 compatible fungible token with built-in compliance
- **Compliance Core**: ERC-3643 inspired compliance engine
- **Identity Registry**: Claims management and verification system

**Integration Layer:**
- **Blend Money Market**: Isolated spokes for different RWA classes
- **SoroSwap AMM**: Execution and routing for SRWA pairs
- **Reflector Oracle**: Price feeds with TWAP and spot data
- **DeFindex**: Data aggregation and vault management

**Compliance Modules:**
- **Jurisdiction Module**: Geographic restrictions and allowances
- **Sanctions Module**: OFAC and sanctions list checking
- **Accredited Module**: Investor accreditation requirements
- **Lockup Module**: Time-based transfer restrictions
- **Max Holders Module**: Maximum holder count limits

**Oracle System:**
- **TWAP Price**: Time-weighted average price from Reflector
- **NAV Custodian**: Custodian-attested Net Asset Value
- **Oracle Adapter**: Clamps TWAP with NAV bands and applies haircuts

### 6. Institutional Use-cases

#### Treasury Credit backed by T-Bills (SRWA-TBill → USDC)
- **Constraints**: LLTV ≤ 90%, liq threshold ≤ 92%, lot size caps for partial liq, bonus ≤ 50 bps
- **NAV cadence**: daily (or better), staleness max 24h (business); Reflector TWAP window 30 min, staleness ≤120s
- **Operational rules**: If NAV.stale == true ⇒ degraded mode: new borrows blocked, LLTV temporarily reduced

#### Private Credit / Receivables (SRWA-Receivables → USDC)
- **Differences**: LLTV ≤ 70%, threshold ≤ 75%, NAV cadence weekly/biweekly, haircut 100–300 bps, band ±100 bps
- **Per-issuer caps**: stricter; redemption cooldowns; transfer windows

#### CRE / Bridge Loans (SRWA-CRE → USDC)
- **Differences**: LLTV ≤ 60%, threshold ≤ 65%, NAV cadence monthly, haircut ≥150 bps, band ±150 bps
- **Larger lot caps**: on liquidation; stronger backstop requirement

---

## Part II: SRWA Token & Compliance Specification

### 1. Normative Requirements & Invariants

#### R-1 (Token surface)
SRWA MUST expose a SEP-41-compatible fungible interface:
- `name()`, `symbol()`, `decimals()`, `balance_of()`, `allowance()`, `approve(spender, amount, live_until?)`
- `transfer(from, to, amount)`, `transfer_from(spender, from, to, amount)`
- Admin extensions: `mint(to, amount)`, `burn(from, amount)`, `force_transfer(from, to, amount)`, `freeze(addr, on)`

#### R-2 (Compliance gate)
Every state mutation that moves balances MUST call `Compliance.can_transfer(ctx: TransferCtx) -> bool` and revert on false

#### R-3 (Determinism)
For a given ledger state (registries/modules/settings), `can_transfer()` MUST be deterministic and side-effect free

#### R-4 (Identity model)
Identity & claims align with ERC-3643 concepts:
- IdentityRegistry (IR) consults IdentityRegistryStorage (IRS) to evaluate holder claims
- ClaimTopicsRegistry (CTR) defines required claim topics per token/profile
- TrustedIssuersRegistry (TIR) controls who can issue/revoke claims per topic

### 2. Data Structures & State

#### TransferCtx
```rust
TransferCtx {
  token: Address,        // SRWA address
  operator: Address,     // msg.sender / router / protocol
  from: Address,         // zero for mint
  to: Address,           // zero for burn
  amount: Amount,
  now: Timestamp,
  purpose: enum { TRANSFER, MINT, BURN, FORCE, REDEEM },
  path: enum { DIRECT, ROUTER, POOL, BRIDGE },
}
```

#### Claim
```rust
Claim {
  topic: TopicId,
  issuer: Address,       // Trusted Issuer
  subject: Address,      // holder wallet
  data_hash: bytes32,    // hash of off-chain VC/evidence
  valid_until: Timestamp,
  ref: ClaimRef,         // external reference / URI id
  revoked: bool,
}
```

### 3. Function Contracts (APIs)

#### SRWA (SEP-41 + admin + compliance hook)

**Read functions:**
- `name() -> string`, `symbol() -> string`, `decimals() -> u32`
- `balance_of(addr: Address) -> Amount`
- `allowance(owner: Address, spender: Address) -> Amount`
- `is_frozen(addr: Address) -> bool`

**Write functions:**
- `approve(spender: Address, amount: Amount, live_until?: Timestamp)`
- `transfer(from: Address, to: Address, amount: Amount)`
- `transfer_from(spender: Address, from: Address, to: Address, amount: Amount)`
- `mint(to: Address, amount: Amount)` [admin]
- `burn(from: Address, amount: Amount)` [admin]
- `force_transfer(from: Address, to: Address, amount: Amount)` [transferAgent]
- `freeze(addr: Address, on: bool)` [admin]

### 4. Compliance Core & Modules

#### Compliance Flow

The compliance system follows a sequential check process:

1. **Global Pause Check**: If system is paused, deny all transfers
2. **Account Frozen Check**: If sender/receiver is frozen, deny transfer
3. **Integration Allowlist**: Verify operator is authorized
4. **Jurisdiction Module**: Check geographic restrictions
5. **Sanctions Module**: Verify addresses are not on sanctions lists
6. **Accredited Module**: Check investor accreditation requirements
7. **Lockup Module**: Verify no active lockups prevent transfer
8. **Max Holders Module**: Ensure holder count limits are respected
9. **Transfer Windows Module**: Check if transfer is allowed in current time window

#### Compliance Core Functions
- `bind_token(token_addr: Address)` [governance]
- `enable_module(id: bytes32, module_addr: Address)` [governance]
- `disable_module(id: bytes32)` [governance]
- `set_integration(addr: Address, allowed: bool)` [governance]
- `pause_global(on: bool)` [governance]
- `can_transfer(ctx: TransferCtx) -> bool`

#### Compliance Modules
- **JurisdictionModule**: allow_regions, deny_regions
- **SanctionsModule**: deny_list + reliance on subject having Sanctions=clear claim
- **AccreditedModule**: topic presence check for Accredited
- **LockupModule**: locks with unlock timestamps
- **MaxHoldersModule**: reads SRWA holder count and configured cap
- **PauseFreezeModule**: mirrors pause_global, frozen addrs
- **TransferWindowsModule**: windows by RegionCode or InvestorTier

### 5. Error Codes (Canonical)

```
0   OK
10  PAUSED
11  FROZEN_FROM
12  FROZEN_TO
13  NOT_ALLOWED_OPERATOR
14  FROM_NOT_VERIFIED
15  TO_NOT_VERIFIED
20  SANCTIONS_DENY
21  JURISDICTION_DENY
22  WINDOW_CLOSED
23  NOT_ACCREDITED
24  LOCKUP_ACTIVE
25  MAX_HOLDERS_EXCEEDED
30  NOT_AUTHORIZED
31  INSUFFICIENT_BALANCE
32  INSUFFICIENT_ALLOWANCE
33  INVALID_PARAM
34  EXPIRED_APPROVAL
40  INTERNAL_ERROR
```

### 6. Events & Telemetry Schema

#### Key Events
- `ComplianceDecision { ctx_hash, operator, from, to, amount, purpose, path, allowed, reason_code, ts }`
- `ClaimAdded { subject, topic, issuer, valid_until, ref, ts }`
- `ClaimRevoked { subject, topic, issuer, ref, ts }`
- `HolderRegistered { holder, identity_id, ts }`
- `ModuleEnabled { id, module_addr, ts }`
- `IntegrationSet { addr, allowed, ts }`
- `Transfer/Mint/Burn/ForceTransfer { from, to, amount, ctx_hash, ts }`

#### Metrics to export
- Compliance deny rate by reason_code
- Mean can_transfer latency (simulation)
- Holder count, distribution by region/tier
- Claim freshness (avg days to expiry)
- Event integrity (missing spans)

---

## Part III: Integration Guides

### Getting Started

#### Integration Flow

The typical integration process follows these steps:

1. **Deploy Core Contracts**: Deploy SRWA token, compliance core, and identity registry
2. **Bind Token to Compliance**: Link the SRWA token to the compliance system
3. **Enable Compliance Modules**: Activate required compliance modules (jurisdiction, sanctions, etc.)
4. **Add Integration Allowlist**: Authorize DeFi protocols (Blend, SoroSwap) to interact with SRWA
5. **Deploy DeFi Integrations**: Create Blend spokes and SoroSwap pools with SRWA support
6. **Configure Oracle**: Set up price feeds and NAV integration

#### Quick Start for Developers

1. **Environment Setup**
   - Install Stellar CLI and Soroban CLI
   - Set up testnet environment
   - Configure wallet (Freighter recommended)

2. **Deploy SRWA Token**
   ```bash
   soroban contract deploy --wasm srwa.wasm --source-account issuer
   soroban contract invoke --id <token_id> -- initialize \
     --admin <admin_address> \
     --name "Treasury Bill Token" \
     --symbol "SRWA-TBILL" \
     --decimals 6
   ```

3. **Configure Compliance**
   ```bash
   # Deploy compliance contracts
   soroban contract deploy --wasm compliance.wasm
   soroban contract deploy --wasm identity-registry.wasm
   
   # Bind token to compliance
   soroban contract invoke --id <compliance_id> -- bind_token --token <token_id>
   ```

### Blend Integration

#### Money Market Integration

1. **Deploy Blend Spoke for SRWA**
   ```rust
   // Create isolated spoke for T-Bill collateral
   let spoke_config = SpokeConfig {
     asset: srwa_token_address,
     lltv: 90,  // 90% for T-Bills
     liquidation_threshold: 92,
     liquidation_bonus: 50,  // 0.5%
     interest_rate_model: conservative_irm,
     max_holders: 1000,
   };
   ```

2. **Configure Oracle Adapter**
   ```rust
   let oracle_config = OracleConfig {
     reflector_address: reflector_contract,
     nav_custodian: custodian_address,
     twap_window: 1800,  // 30 minutes
     nav_band: 100,      // 1% band
     haircut: 50,        // 0.5% haircut
     staleness_threshold: 86400,  // 24 hours
   };
   ```

### SoroSwap Integration

#### AMM and Routing Integration

1. **Create SRWA/USDC Pool**
   ```rust
   // Initialize pool with SRWA as asset_a and USDC as asset_b
   let pool_config = PoolConfig {
     asset_a: srwa_token_address,
     asset_b: usdc_token_address,
     fee: 30,  // 0.3% fee
     admin: pool_admin,
   };
   ```

2. **Router Integration**
   ```rust
   // Add SRWA to integration allowlist
   compliance.set_integration(router_address, true);
   
   // Configure slippage guards
   let slippage_config = SlippageConfig {
     max_slippage_bps: 50,  // 0.5%
     lot_size_cap: 1000000, // 1M units
   };
   ```

### Reflector Integration

#### Oracle Integration

1. **Configure Price Feeds**
   ```rust
   let price_config = PriceConfig {
     base_asset: "USDC",
     quote_asset: "XLM",
     twap_window: 1800,  // 30 minutes
     staleness_threshold: 120,  // 2 minutes
   };
   ```

2. **NAV Integration**
   ```rust
   // Set up custodian NAV signing
   let nav_config = NavConfig {
     custodian: custodian_address,
     signing_key: custodian_signing_key,
     update_frequency: 86400,  // Daily
     band_percentage: 100,     // 1% band
   };
   ```

---

## Part IV: Operations & Governance

### Deployment Guide

#### Production Deployment

1. **Pre-deployment Checklist**
   - [ ] All contracts audited
   - [ ] Testnet testing completed
   - [ ] Governance multisig configured
   - [ ] Emergency procedures documented
   - [ ] Monitoring systems configured

2. **Deployment Steps**
   ```bash
   # 1. Deploy core contracts
   soroban contract deploy --wasm srwa.wasm --source-account governance
   soroban contract deploy --wasm compliance.wasm --source-account governance
   
   # 2. Initialize with governance
   soroban contract invoke --id <srwa_id> -- initialize \
     --admin <governance_multisig> \
     --compliance <compliance_id>
   
   # 3. Configure modules
   soroban contract invoke --id <compliance_id> -- enable_module \
     --module-id "jurisdiction" --module-addr <jurisdiction_module_id>
   ```

### Operations Runbook

#### Day-to-Day Operations

1. **Monitoring Checklist**
   - Check compliance deny rates
   - Monitor oracle staleness
   - Verify claim validity periods
   - Review liquidation events
   - Check system health metrics

2. **Emergency Procedures**
   - **Pause Global**: `compliance.pause_global(true)`
   - **Freeze Account**: `srwa.freeze(account, true)`
   - **Force Transfer**: `srwa.force_transfer(from, to, amount)`
   - **Update Oracle**: Emergency oracle update procedures

3. **Regular Maintenance**
   - Weekly: Review and update claim topics
   - Monthly: Audit compliance modules
   - Quarterly: Review and update risk parameters

### Governance Framework

#### Governance Structure

1. **Roles & Permissions**
   - **Governance**: Contract upgrades, parameter changes
   - **IssuerAdmin**: Register/revoke holders, manage claims
   - **ComplianceOfficer**: Module configuration, allowlist management
   - **TransferAgent**: Force transfers, emergency operations

2. **Proposal Process**
   1. Create proposal with detailed specifications
   2. Community discussion period (7 days)
   3. Technical review by auditors
   4. Governance vote (requires 67% majority)
   5. Timelock period (24-48 hours)
   6. Execution by governance multisig

3. **Emergency Governance**
   - Emergency pause: Immediate execution
   - Security incidents: Fast-track process
   - Oracle failures: Automatic degraded mode

### Security Considerations

#### Security Best Practices

1. **Access Control**
   - Multi-signature wallets for all admin functions
   - Role-based access control (RBAC)
   - Regular key rotation procedures
   - Hardware security modules (HSM) for critical keys

2. **Code Security**
   - Comprehensive audit before deployment
   - Formal verification for critical functions
   - Regular security updates and patches
   - Bug bounty program for community testing

3. **Operational Security**
   - Incident response procedures
   - Regular security training for operators
   - Monitoring and alerting systems
   - Backup and recovery procedures

---

## Quick Start

1. **For Developers**: Start with [Getting Started](#getting-started)
2. **For Integrators**: Review [API Reference](#function-contracts-apis)
3. **For Operators**: Check [Operations Runbook](#operations-runbook)

## External Resources

- [Stellar Developer Docs](https://developers.stellar.org)
- [SoroSwap DEX](https://soroswap.finance)
- [Reflector Oracle](https://reflector.network)
- [Freighter Wallet](https://freighter.app)

## Contributing

This documentation is maintained by the PanoramaBlock team. For updates or corrections, please submit a pull request or contact the team.

## License

This documentation is licensed under the MIT License. See [LICENSE](./LICENSE) for details.

---

## Project Setup

This project is built with:

- **Vite** - Build tool and development server
- **TypeScript** - Type-safe JavaScript
- **React** - UI framework
- **shadcn-ui** - Component library
- **Tailwind CSS** - Styling framework

### Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Deployment

The project can be deployed using:
- [Lovable](https://lovable.dev) - Click Share → Publish
- Custom domain setup available in Project Settings
