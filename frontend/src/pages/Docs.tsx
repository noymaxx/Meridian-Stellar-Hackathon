import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Search, BookOpen, Shield, AlertTriangle, Info, ExternalLink, Copy, Check } from "lucide-react";

export default function Docs() {
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleQuickLinkClick = (e: React.MouseEvent, sectionId: string) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Quick link clicked:', sectionId);
    scrollToSection(sectionId);
  };

  useEffect(() => {
    // Debug: detectar cliques em qualquer lugar
    const handleGlobalClick = (e: MouseEvent) => {
      console.log('Global click detected:', e.target);
      console.log('Click coordinates:', e.clientX, e.clientY);
    };

    document.addEventListener('click', handleGlobalClick, true);
    
    return () => {
      document.removeEventListener('click', handleGlobalClick, true);
    };
  }, []);

  const sections = [
    {
      id: "overview",
      title: "Overview",
      content: `PanoramaBlock introduces SRWA: a SEP-41–compatible fungible token with ERC-3643–inspired identity & compliance. SRWA moves compliance to the asset layer so every dApp that can move a SEP-41 token can automatically respect regulation.`,
      features: [
        "Token-first Compliance: Built-in compliance at the asset layer",
        "Composable by Default: Works with any SEP-41 compatible dApp",
        "Institutional Grade: Designed for regulated financial institutions",
        "Modular Architecture: Flexible compliance modules",
        "Oracle Integration: Hybrid pricing with NAV clamping"
      ]
    },
    {
      id: "technical-vision",
      title: "Technical Vision & Strategy",
      content: `Our vision standardizes SRWA as a SEP-41–compatible fungible token with ERC-3643–inspired identity & compliance. SRWA composes natively with Blend (money market), SoroSwap (AMM/Router), Reflector (price feeds), and DeFindex (data/vaults).`,
      subsections: [
        {
          title: "Normative Properties",
          content: "P-1 (Compliance correctness): every state mutation MUST call Compliance.can_transfer() and MUST revert on false. P-2 (Determinism): can_transfer is pure and deterministic. P-3 (Oracle hygiene): effective price MUST be clamp(TWAP_Reflector, NAV±band) * (1-haircut). P-4 (Composable by default): any dApp supporting SEP-41 can support SRWA. P-5 (Upgrade discipline): upgrades MUST be governed by multisig + timelock."
        },
        {
          title: "Product & Market Thesis",
          content: "Problems: C-1 Fragmented compliance, C-2 NAV vs on-chain price, C-3 Liquidity silos & UX, C-4 Auditability & operations. Solutions: A-1 Compliance on the token, A-2 Hybrid price oracle, A-3 Motorized composability, A-4 Operational rigor."
        }
      ]
    },
    {
      id: "architecture",
      title: "System Architecture Overview",
      content: `The SRWA ecosystem follows a token-first compliance approach with core layers including SRWA Token, Compliance Core, Identity Registry, and integration layers with Blend Money Market, SoroSwap AMM, Reflector Oracle, and DeFindex.`,
      image: "/docs/photo2Doc.png",
      subsections: [
        {
          title: "Core Layer",
          content: "SRWA Token: SEP-41 compatible fungible token with built-in compliance. Compliance Core: ERC-3643 inspired compliance engine. Identity Registry: Claims management and verification system."
        },
        {
          title: "Integration Layer",
          content: "Blend Money Market: Isolated spokes for different RWA classes. SoroSwap AMM: Execution and routing for SRWA pairs. Reflector Oracle: Price feeds with TWAP and spot data. DeFindex: Data aggregation and vault management."
        },
        {
          title: "Compliance Modules",
          content: "Jurisdiction Module: Geographic restrictions and allowances. Sanctions Module: OFAC and sanctions list checking. Accredited Module: Investor accreditation requirements. Lockup Module: Time-based transfer restrictions. Max Holders Module: Maximum holder count limits."
        }
      ]
    },
    {
      id: "token-architecture",
      title: "Token-first Architecture",
      content: `The SRWA ecosystem follows a token-first compliance approach where compliance is built into the token itself, ensuring that every dApp that can move a SEP-41 token can automatically respect regulation.`,
      image: "/docs/photo3Doc.png"
    },
    {
      id: "use-cases",
      title: "Institutional Use-cases",
      content: `Treasury Credit backed by T-Bills, Private Credit/Receivables, and CRE/Bridge Loans with specific constraints and operational rules for each asset class.`,
      image: "/docs/photo4Doc.png",
      subsections: [
        {
          title: "Treasury Credit (SRWA-TBill → USDC)",
          content: "Constraints: LLTV ≤ 90%, liq threshold ≤ 92%, lot size caps for partial liq, bonus ≤ 50 bps. NAV cadence: daily (or better), staleness max 24h (business); Reflector TWAP window 30 min, staleness ≤120s."
        },
        {
          title: "Private Credit / Receivables (SRWA-Receivables → USDC)",
          content: "Differences: LLTV ≤ 70%, threshold ≤ 75%, NAV cadence weekly/biweekly, haircut 100–300 bps, band ±100 bps. Per-issuer caps: stricter; redemption cooldowns; transfer windows."
        },
        {
          title: "CRE / Bridge Loans (SRWA-CRE → USDC)",
          content: "Differences: LLTV ≤ 60%, threshold ≤ 65%, NAV cadence monthly, haircut ≥150 bps, band ±150 bps. Larger lot caps: on liquidation; stronger backstop requirement."
        }
      ]
    },
    {
      id: "risks",
      title: "Risks, Assumptions & Mitigations",
      content: `Comprehensive risk assessment matrix covering compliance bypass, wrong/forged claims, NAV stale/oracle failure, liquidity shock, governance mistakes, data drift, and privacy leakage.`,
      image: "/docs/photo5Doc.png",
      riskMatrix: [
        { risk: "R-1 Compliance bypass", vector: "dApp calls mint/burn/transfer without checks", mitigation: "SRWA requires all balance-changing paths to call COMP.can_transfer; covered in contract; unit tests enforce" },
        { risk: "R-2 Wrong/forged claims", vector: "Malicious issuer of claims", mitigation: "Only Trusted Issuers (TIR) can write; events audited; key rotation runbooks; multi-sig for registry updates" },
        { risk: "R-3 NAV stale / oracle failure", vector: "Custodian outage; feed lag", mitigation: "Degraded mode, staleness guards, NAV haircuts, bands; Reflector TWAP fallback; alarms" },
        { risk: "R-4 Liquidity shock", vector: "Thin SRWA routes during liq", mitigation: "Partial liquidation with lot limits; pre-trade quotes; backstop configuration per spoke" },
        { risk: "R-5 Governance mistake", vector: "Bad upgrade/param change", mitigation: "Multisig + timelock; dry-run on test env; Upgraded and Configured events with diffs" }
      ]
    },
    {
      id: "contracts",
      title: "Contract Architecture",
      content: `Detailed contract structure including SRWA token, compliance core, identity registry, and all supporting modules.`,
      image: "/docs/photo6Doc.png"
    },
    {
      id: "technical-specs",
      title: "Technical Specifications",
      content: `Comprehensive technical specifications including normative requirements, data structures, function contracts, and compliance modules.`,
      subsections: [
        {
          title: "Normative Requirements & Invariants",
          content: "R-1 (Token surface): SRWA MUST expose a SEP-41-compatible fungible interface with name(), symbol(), decimals(), balance_of(), allowance(), approve(), transfer(), transfer_from(), plus admin extensions mint(), burn(), force_transfer(), freeze(). R-2 (Compliance gate): Every state mutation that moves balances MUST call Compliance.can_transfer(ctx: TransferCtx) -> bool and revert on false. R-3 (Determinism): can_transfer() MUST be deterministic and side-effect free. R-4 (Identity model): Identity & claims align with ERC-3643 concepts. R-5 (Integration allowlist): Compliance MUST support an IntegrationAllowlist for protocol endpoints. R-6 (Versioning & Upgrade): Upgrades MUST be gated by multisig + timelock. R-7 (Observability): All critical actions MUST emit structured events."
        },
        {
          title: "Data Structures & State",
          content: "Common types: Address (Soroban contract/account), Timestamp (u64 seconds), Amount (i128 base units), TopicId (u32), ClaimRef (bytes32), RegionCode (u32 ISO-3166), ErrorCode (u16). TransferCtx: {token, operator, from, to, amount, now, purpose, path}. Claim: {topic, issuer, subject, data_hash, valid_until, ref, revoked}. SRWA Storage: admin, transfer_agent, decimals, symbol, name, balances, allowances, frozen, compliance_addr, version."
        },
        {
          title: "Function Contracts (APIs)",
          content: "SRWA Read: name(), symbol(), decimals(), balance_of(), allowance(), is_frozen(), compliance(). SRWA Write: approve(), transfer(), transfer_from(), mint(), burn(), force_transfer(), freeze(). Identity & Claims: register(), revoke(), is_verified(), add_claim(), revoke_claim(), get_claims(). Compliance Core: bind_token(), enable_module(), disable_module(), set_integration(), pause_global(), can_transfer()."
        },
        {
          title: "Compliance Modules",
          content: "JurisdictionModule: Geographic restrictions with allow_regions and deny_regions. SanctionsModule: OFAC and sanctions list checking with deny_list. AccreditedModule: Investor accreditation requirements. LockupModule: Time-based transfer restrictions with locks[holder]. MaxHoldersModule: Maximum holder count limits. PauseFreezeModule: Mirrors pause_global and frozen accounts. TransferWindowsModule: Time windows per RegionCode or InvestorTier."
        },
        {
          title: "Error Codes (Canonical)",
          content: "0 OK, 10 PAUSED, 11 FROZEN_FROM, 12 FROZEN_TO, 13 NOT_ALLOWED_OPERATOR, 14 FROM_NOT_VERIFIED, 15 TO_NOT_VERIFIED, 20 SANCTIONS_DENY, 21 JURISDICTION_DENY, 22 WINDOW_CLOSED, 23 NOT_ACCREDITED, 24 LOCKUP_ACTIVE, 25 MAX_HOLDERS_EXCEEDED, 30 NOT_AUTHORIZED, 31 INSUFFICIENT_BALANCE, 32 INSUFFICIENT_ALLOWANCE, 33 INVALID_PARAM, 34 EXPIRED_APPROVAL, 40 INTERNAL_ERROR."
        },
        {
          title: "Events & Telemetry Schema",
          content: "Key Events: ComplianceDecision, ClaimAdded, ClaimRevoked, HolderRegistered, ModuleEnabled, IntegrationSet, Transfer/Mint/Burn/ForceTransfer, Upgraded, Configured. Metrics: Compliance deny rate by reason_code, Mean can_transfer latency, Holder count distribution, Claim freshness, Event integrity."
        },
        {
          title: "Security Considerations",
          content: "Reentrancy: SRWA and Compliance perform checks → effects only. Approval race: use approve(spender, 0) pattern. Front-running of claims: registry writes are privileged. PII minimization: only store data_hash. Time consistency: always pass ctx.now = ledger.timestamp(). Emergency response: pause_global, freeze, force_transfer with audit trails."
        }
      ]
    },
    {
      id: "integration-guides",
      title: "Integration Guides",
      content: `Comprehensive guides for integrating with Blend Money Market, SoroSwap AMM, Reflector Oracle, and DeFindex.`,
      subsections: [
        {
          title: "Blend Integration",
          content: "Deploy Blend Spoke for SRWA with isolated lending spokes. Configure Oracle Adapter with TWAP window, NAV bands, haircuts, and staleness thresholds. Set up conservative IRM with utilization caps and partial liquidation."
        },
        {
          title: "SoroSwap Integration",
          content: "Create SRWA/USDC pools with configurable fees. Integrate router with slippage guards and lot size caps. Add SRWA to integration allowlist for seamless DeFi composability."
        },
        {
          title: "Reflector Integration",
          content: "Configure price feeds with TWAP and spot data. Set up NAV integration with custodian signing. Implement degraded mode for oracle failures with fallback mechanisms."
        }
      ]
    },
    {
      id: "oracle-adapter",
      title: "OracleAdapter Specification",
      content: `Comprehensive specification for the OracleAdapter system that provides hybrid pricing with NAV clamping for SRWA tokens.`,
      subsections: [
        {
          title: "Objectives & Guarantees",
          content: "O-1 Safety over liveness: When price data is degraded, restrict borrowing and lower LLTVs. O-2 Determinism: get_effective_price() is pure and fully determined by adapter state. O-3 Bounded valuation drift: Market spot is clamped to NAV bands with haircut. O-4 Clock & staleness hygiene: Hard thresholds on TWAP staleness and NAV validity. O-5 Integrator simplicity: Single method returns (price, decimals, timestamp, status)."
        },
        {
          title: "Pricing Policy & Formulas",
          content: "Clamp with haircut & bands: P_spot = TWAP_Reflector, NAV = NAV_custodian, NAV_net = NAV' * (1 - haircut), Band_low = NAV_net * (1 - band), Band_high = NAV_net * (1 + band), Effective = clamp(P_spot, Band_low, Band_high). Staleness & status: If now - twap_timestamp > max_stale_reflector_secs → status >= SPOT_STALE. If now > valid_until → status >= NAV_STALE → enter degraded."
        },
        {
          title: "State, Config & Admin",
          content: "Storage: admin, custodian, reflector_feeds, twap_window_secs, max_stale_reflector_secs, nav_value, nav_decimals, nav_valid_until, nav_haircut_bps, nav_band_bps, nav_max_roc_bps, degraded, lltv_override_bps. Admin functions: init(), set_feeds(), set_bands(), set_staleness(), set_custodian(), set_degraded(), set_median_policy()."
        },
        {
          title: "Methods & Semantics",
          content: "submit_nav(): Custodian submits NAV with ROC guard. get_spot(): Query feeds for TWAP with staleness checks. get_effective_price(): Apply NAV clamp and compute status. is_degraded(): Returns degraded status. Degraded policies: BLOCK_NEW_BORROWS, LLTV_OVERRIDE_ACTIVE, WIDEN_BANDS, INCREASE_LIQ_BONUS."
        },
        {
          title: "Integration Contracts",
          content: "Blend Integration: Reserve oracle queries get_effective_price() for entry checks, accounting, and degraded handling. SoroSwap Integration: Quote pre-check with price impact limits, lot sizing for liquidations, finality handling for failed swaps. Security: Auth model requires custodian signature, replay protection via valid_until, feed diversity with median policy."
        }
      ]
    },
    {
      id: "blend-integration",
      title: "Blend Integration (Spokes, Risk, Flows, Liquidations)",
      content: `Comprehensive integration guide for Blend Money Market with isolated spokes, risk management, and liquidation flows.`,
      subsections: [
        {
          title: "Objectives & Design Constraints",
          content: "O-1 Isolation: Each Spoke is an isolated market for one RWA class. O-2 Token-first compliance: All SRWA movements gated by Compliance.can_transfer(). O-3 Oracle hygiene: Use OracleAdapter.get_effective_price() with guard parameters. O-4 Partial, guarded liquidation: Execute in small lots with slippage caps. O-5 Operability: Risk parameters change behind timelock + events."
        },
        {
          title: "Spoke Provisioning",
          content: "Components: BlendFactory, SpokePool, Reserve, OracleAdapter, SRWA, USDC. Default Spoke #1 (SRWA-TBill/USDC): LLTV 90%, Liq threshold 92%, Liq bonus 50 bps, IRM base 3% + slope1 6% until 80% util + slope2 30% 80→100%, SRWA reserve c_factor=0.90, USDC reserve borrowable=true util=0.80, Backstop take rate 5%."
        },
        {
          title: "Risk, Accounting & IRM",
          content: "Indexing: Each reserve maintains normalized indexes for borrow and supply. IRM Piecewise Linear: if U ≤ KINK: APR_borrow = base + slope1 * U, else: APR_borrow = base + slope1 * KINK + slope2 * (U − KINK). Collateral Valuation: V_coll = sum_i (amount_i * P_eff_i), Health Factor: HF = (V_coll * LLTV_eff) / V_debt."
        },
        {
          title: "Guarded Operations",
          content: "Price Guards: Frontends pass guard blob with p_min, p_max, ts_max_age. Spoke re-fetches P_eff and reverts if outside bounds or stale. Operation Preconditions: SupplyCollateral requires SRWA.transfer() allowed by Compliance. Borrow requires HF_after ≥ 1 with guard checks. WithdrawCollateral requires HF_after ≥ 1 after withdrawal."
        },
        {
          title: "Liquidations (Partial, Routed)",
          content: "Eligibility: Position eligible when HF < 1. Close factor CF caps debt repayable per action. Execution via SoroSwap: Compute target repay, convert SRWA→USDC with slippage_max, reduce lot size if needed, call repay() and recompute HF. Seizure math: Liquidator repays ΔD USDC, seizes SRWA worth ΔD * (1 + liq_bonus)."
        },
        {
          title: "Admin & Governance",
          content: "Mutable Parameters: Risk (LLTV, liq_threshold, liq_bonus), IRM (base, slopes, kink), Policy (close_factor, backstop_rate), Oracle links. Process: Propose change → timelock (24-72h) → Execute change → Events. Administrative Actions: pause(opset), set_reserve(), set_irm(), set_oracle(), activate()/deactivate()."
        }
      ]
    },
    {
      id: "soroswap-integration",
      title: "SoroSwap Integration (Routing, Liquidity, Compliance, Liquidations)",
      content: `Comprehensive integration guide for SoroSwap AMM with routing, liquidity management, and compliance enforcement.`,
      subsections: [
        {
          title: "Objectives & Constraints",
          content: "E-1 Execution-first safety: All swaps use guarded routes with price impact, age, minOut. E-2 Compliance on SRWA: Transfers must succeed only if Compliance.can_transfer() allows. E-3 Deterministic liquidation: Partial liquidation must be idempotent and monotonic. E-4 LP Policy control: Support public vs permissioned liquidity modes. E-5 Minimal surface area: Integrate via Router and Pool factory only."
        },
        {
          title: "Execution (Quotes & Swaps) — Guarded Routing",
          content: "Quote Policy: priceImpactBps ≤ SLP_MAX_BPS (30 bps default), route.hops ≤ H_MAX (prefer ≤2), liquidity_depth ≥ L_MIN, deadline = now + Δt_quote (60s). Swap Policy: Pre-flight compliance check for SRWA recipients, simulate → sign → send with minOut and deadline, failure modes include REVERT_SLIPPAGE and REVERT_COMPLIANCE."
        },
        {
          title: "Liquidity — Pair Creation & LP Policies",
          content: "Pair Creation: tokenA=SRWA, tokenB=USDC, seed liquidity from institutional backstop. Public Liquidity Mode: Anyone can add/remove liquidity if they pass SRWA compliance. Permissioned LP Mode: Use permissioned LP token or gate addLiquidity() with allowlist. Rebalancing: Backstop maintains depth and mid-price near OracleAdapter.effective_price."
        },
        {
          title: "Liquidation Engine — SRWA→USDC via SoroSwap",
          content: "Keeper Loop: Trigger on HF < 1, inputs include effective_price, target_HF, lot_max, slippage_max. Process: Repeat until HF ≥ target or lot_budget exhausted - compute amount_srwa to sell, quote() with slippage_max, reduce lot if impact > max, swap() → get USDC, repay() in Blend, recompute HF. Abort conditions: Oracle degraded, no route, lot < lot_min."
        },
        {
          title: "Integration Requirements",
          content: "Allowlisting: Add Router and Pool/Pair addresses to SRWA IntegrationAllowlist. Compliance: SRWA transfers from backstop to Pool must succeed, LP token minting follows mode. Security: Router must be allowlisted for temporary SRWA receipt during zaps. Monitoring: Track price impact, slippage, and compliance failures for operational insights."
        }
      ]
    },
    {
      id: "reflector-integration",
      title: "Reflector Integration (Oracles and Feeds)",
      content: `Comprehensive integration guide for Reflector Oracle with feed management, KPIs, and data schemas.`,
      subsections: [
        {
          title: "Objectives & Responsibilities",
          content: "D-1 Single internal source of truth: Build Panorama Indexer to ingest on-chain events. D-2 Oracle hygiene first: Integrate Reflector feeds with staleness, TWAP, bands/haircut via OracleAdapter. D-3 Institutional dashboards: Provide pool, position, risk, and liquidation views. D-4 Ops-grade observability: SLOs for freshness/accuracy with reconciliation. D-5 Optional vaults: Self-hosted USDC→Spoke vaults with our telemetry."
        },
        {
          title: "Reflector Integration",
          content: "Feed Taxonomy: SRWA/USD TWAP and spot, FX legs (USD/XLM, USDC/XLM), quality meta (timestamps, heartbeat, signer set). Query Model: get_spot() retrieves TWAP from configured feeds, drops stale data, aggregates by policy (FIRST/MEDIAN). Security: Feed data signed by Reflector signers, verify staleness, rely on feed-level guarantees."
        },
        {
          title: "KPIs & Formulas (Deterministic)",
          content: "Utilization: U = borrows / (cash + borrows − reserves). Borrow APR: if U ≤ KINK: apr_b = base + slope1 * U, else: apr_b = base + slope1 * KINK + slope2 * (U − KINK). Supply APR: apr_s ≈ apr_b * U * (1 − reserve_factor). TVL: sum over reserves amount * price. Health Factor: HF = (Σ coll_i * px_i * lltv_eff_i) / (Σ debt_j * px_j)."
        },
        {
          title: "Data Schemas & Read APIs",
          content: "Pool View: address, name, reserves with asset details, TVL, utilization, APY, oracle_status. Position View: account, pool, collateral/debt arrays, HF, limits. AMM Snapshot: pair, reserves, mid_price, price_impact_bps, volume_24h, oracle_dev_bps. Time-series: metric, window, points with timestamps. Oracle Surfaces: effective_price, twap_spot, nav, haircut_bps, band_bps, degraded status."
        },
        {
          title: "Indexer Implementation",
          content: "Event Ingestion: Subscribe to SRWA, Compliance, IdentityRegistry, OracleAdapter, Blend Spokes, SoroSwap Router/Pool. Calculators: APY from IRM + utilization, HF per position, liquidation stats, oracle status stream. Canonical Store: TSDB schema for pools, positions, AMM, oracle with hot cache and WS pub/sub."
        },
        {
          title: "SLOs & Alerting",
          content: "SLOs: Freshness P95 ≤ 20s lag, Oracle exposure P99 status != DEGRADED ≥ 99% monthly, Data loss 0 missed events, API availability ≥ 99.5% monthly. Alerts: ALERT_ORACLE_STALE, ALERT_INDEXER_LAG, ALERT_HF_SPIKE, ALERT_AMM_DEVIATION. Failure Modes: Reflector feed stale, NAV missing, Indexer lag, AMM deviation, Wrong decimals with specific runbooks."
        }
      ]
    },
    {
      id: "operations-governance",
      title: "Operations & Governance",
      content: `Comprehensive operational procedures, governance framework, and security considerations for running the SRWA ecosystem.`,
      subsections: [
        {
          title: "Deployment Guide",
          content: "Pre-deployment checklist including audits, testnet testing, governance multisig configuration, emergency procedures, and monitoring systems. Step-by-step deployment process with governance initialization."
        },
        {
          title: "Operations Runbook",
          content: "Day-to-day monitoring checklist, emergency procedures (pause global, freeze account, force transfer), and regular maintenance schedules. Weekly, monthly, and quarterly maintenance tasks."
        },
        {
          title: "Governance Framework",
          content: "Roles & permissions: Governance, IssuerAdmin, ComplianceOfficer, TransferAgent. Proposal process with community discussion, technical review, governance vote, and timelock execution. Emergency governance procedures."
        }
      ]
    },
    {
      id: "dataflow",
      title: "Dataflow Diagram",
      content: `Shows the flow from feeds through adapter to consumers in the oracle system.`,
      image: "/docs/photo7Doc.png"
    },
    {
      id: "degraded-mode",
      title: "Degraded Mode State Machine",
      content: `Illustrates the state transitions when the system enters degraded mode due to oracle failures or other issues.`,
      image: "/docs/Photo8Doc.png"
    }
  ];

  const filteredSections = sections.filter(section => {
    const searchLower = searchTerm.toLowerCase();
    
    // Search in main content
    if (section.title.toLowerCase().includes(searchLower) ||
        section.content.toLowerCase().includes(searchLower)) {
      return true;
    }
    
    // Search in features
    if (section.features && section.features.some(feature => 
        feature.toLowerCase().includes(searchLower))) {
      return true;
    }
    
    // Search in subsections
    if (section.subsections && section.subsections.some(subsection =>
        subsection.title.toLowerCase().includes(searchLower) ||
        subsection.content.toLowerCase().includes(searchLower))) {
      return true;
    }
    
    // Search in risk matrix
    if (section.riskMatrix && section.riskMatrix.some(risk =>
        risk.risk.toLowerCase().includes(searchLower) ||
        risk.vector.toLowerCase().includes(searchLower) ||
        risk.mitigation.toLowerCase().includes(searchLower))) {
      return true;
    }
    
    return false;
  });

  return (
    <>
      <style>{`
        * {
          pointer-events: auto !important;
        }
        [data-lov-id] {
          pointer-events: auto !important;
        }
        button, a, [role="button"] {
          pointer-events: auto !important;
          z-index: 9999 !important;
          position: relative !important;
        }
        .card-institutional {
          pointer-events: auto !important;
        }
        .card-institutional * {
          pointer-events: auto !important;
        }
      `}</style>
      <div className="min-h-screen bg-background" style={{ position: 'relative', zIndex: 1 }}>
        <Header />
        
        <main className="container mx-auto max-w-6xl px-6 py-12">
        <div className="mb-8">
          <h1 className="text-h1 font-semibold text-fg-primary mb-4 flex items-center gap-3">
            <BookOpen className="h-8 w-8" />
            PanoramaBlock - SRWA Standard Documentation
          </h1>
          <p className="text-body-1 text-fg-secondary mb-6">
            Comprehensive documentation for the SRWA (Stellar Real-World Asset) standard and the PanoramaBlock ecosystem for institutional RWA lending on Stellar.
          </p>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-fg-muted" />
            <Input
              placeholder="Search documentation..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="grid gap-6">
          {filteredSections.map((section, index) => (
            <Card key={section.id} id={section.id} className="card-institutional">
              <div className="p-6">
                <h2 className="text-h2 font-semibold text-fg-primary mb-4 flex items-center gap-2">
                  {section.title}
                  <Badge variant="secondary" className="text-xs">
                    Section {index + 1}
                  </Badge>
                </h2>
                
                {section.image && (
                  <div className="mb-6">
                    <img 
                      src={section.image} 
                      alt={section.title}
                      className="w-full max-w-4xl mx-auto rounded-lg shadow-lg"
                    />
                  </div>
                )}
                
                <p className="text-body-1 text-fg-secondary mb-4">
                  {section.content}
                </p>

                {/* Features List */}
                {section.features && (
                  <div className="mb-6">
                    <h3 className="text-h3 font-semibold text-fg-primary mb-3">Key Features</h3>
                    <ul className="space-y-2">
                      {section.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-body-2 text-fg-secondary">
                          <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Subsections */}
                {section.subsections && (
                  <div className="mb-6">
                    <Accordion type="single" collapsible className="w-full">
                      {section.subsections.map((subsection, idx) => (
                        <AccordionItem key={idx} value={`subsection-${idx}`}>
                          <AccordionTrigger className="text-left">
                            <h3 className="text-h3 font-semibold text-fg-primary">
                              {subsection.title}
                            </h3>
                          </AccordionTrigger>
                          <AccordionContent>
                            <p className="text-body-2 text-fg-secondary">
                              {subsection.content}
                            </p>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                )}

                {/* Risk Matrix */}
                {section.riskMatrix && (
                  <div className="mb-6">
                    <h3 className="text-h3 font-semibold text-fg-primary mb-4">Risk Assessment Matrix</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-border">
                        <thead>
                          <tr className="bg-accent">
                            <th className="border border-border p-3 text-left text-sm font-semibold">Risk</th>
                            <th className="border border-border p-3 text-left text-sm font-semibold">Vector</th>
                            <th className="border border-border p-3 text-left text-sm font-semibold">Mitigation</th>
                          </tr>
                        </thead>
                        <tbody>
                          {section.riskMatrix.map((risk, idx) => (
                            <tr key={idx} className="hover:bg-accent/50">
                              <td className="border border-border p-3 text-sm font-medium text-fg-primary">
                                {risk.risk}
                              </td>
                              <td className="border border-border p-3 text-sm text-fg-secondary">
                                {risk.vector}
                              </td>
                              <td className="border border-border p-3 text-sm text-fg-secondary">
                                {risk.mitigation}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="text-xs">
                    <Shield className="h-3 w-3 mr-1" />
                    Compliance
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    <Info className="h-3 w-3 mr-1" />
                    Technical
                  </Badge>
                  {section.subsections && (
                    <Badge variant="outline" className="text-xs">
                      <BookOpen className="h-3 w-3 mr-1" />
                      Detailed
                    </Badge>
                  )}
                  {section.riskMatrix && (
                    <Badge variant="outline" className="text-xs">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Risk Analysis
                    </Badge>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredSections.length === 0 && (
          <Card className="card-institutional">
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-fg-muted mx-auto mb-4" />
              <h3 className="text-h3 font-semibold text-fg-primary mb-2">
                No results found
              </h3>
              <p className="text-body-1 text-fg-secondary">
                Try adjusting your search terms or browse all sections.
              </p>
            </div>
          </Card>
        )}

        <div className="mt-12">
          <Card className="card-institutional">
            <div className="p-6">
              <h2 className="text-h2 font-semibold text-fg-primary mb-4">
                Quick Links
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 relative z-10" style={{ zIndex: 10 }}>
                <button 
                  onClick={(e) => handleQuickLinkClick(e, 'overview')}
                  className="flex items-center gap-2 p-3 rounded-lg border border-border hover:bg-accent transition-colors text-left w-full relative cursor-pointer"
                  style={{ 
                    zIndex: 9999, 
                    pointerEvents: 'auto',
                    position: 'relative'
                  }}
                  type="button"
                >
                  <BookOpen className="h-4 w-4" />
                  <span>Overview</span>
                </button>
                <button 
                  onClick={(e) => handleQuickLinkClick(e, 'technical-vision')}
                  className="flex items-center gap-2 p-3 rounded-lg border border-border hover:bg-accent transition-colors text-left w-full relative cursor-pointer"
                  style={{ 
                    zIndex: 9999, 
                    pointerEvents: 'auto',
                    position: 'relative'
                  }}
                  type="button"
                >
                  <BookOpen className="h-4 w-4" />
                  <span>Technical Vision</span>
                </button>
                <button 
                  onClick={(e) => handleQuickLinkClick(e, 'architecture')}
                  className="flex items-center gap-2 p-3 rounded-lg border border-border hover:bg-accent transition-colors text-left w-full relative cursor-pointer"
                  style={{ 
                    zIndex: 9999, 
                    pointerEvents: 'auto',
                    position: 'relative'
                  }}
                  type="button"
                >
                  <Shield className="h-4 w-4" />
                  <span>Architecture</span>
                </button>
                <button 
                  onClick={(e) => handleQuickLinkClick(e, 'technical-specs')}
                  className="flex items-center gap-2 p-3 rounded-lg border border-border hover:bg-accent transition-colors text-left w-full relative cursor-pointer"
                  style={{ 
                    zIndex: 9999, 
                    pointerEvents: 'auto',
                    position: 'relative'
                  }}
                  type="button"
                >
                  <BookOpen className="h-4 w-4" />
                  <span>Technical Specs</span>
                </button>
                <button 
                  onClick={(e) => handleQuickLinkClick(e, 'integration-guides')}
                  className="flex items-center gap-2 p-3 rounded-lg border border-border hover:bg-accent transition-colors text-left w-full relative cursor-pointer"
                  style={{ 
                    zIndex: 9999, 
                    pointerEvents: 'auto',
                    position: 'relative'
                  }}
                  type="button"
                >
                  <BookOpen className="h-4 w-4" />
                  <span>Integration Guides</span>
                </button>
                <button 
                  onClick={(e) => handleQuickLinkClick(e, 'oracle-adapter')}
                  className="flex items-center gap-2 p-3 rounded-lg border border-border hover:bg-accent transition-colors text-left w-full relative cursor-pointer"
                  style={{ 
                    zIndex: 9999, 
                    pointerEvents: 'auto',
                    position: 'relative'
                  }}
                  type="button"
                >
                  <BookOpen className="h-4 w-4" />
                  <span>OracleAdapter Spec</span>
                </button>
                <button 
                  onClick={(e) => handleQuickLinkClick(e, 'blend-integration')}
                  className="flex items-center gap-2 p-3 rounded-lg border border-border hover:bg-accent transition-colors text-left w-full relative cursor-pointer"
                  style={{ 
                    zIndex: 9999, 
                    pointerEvents: 'auto',
                    position: 'relative'
                  }}
                  type="button"
                >
                  <Shield className="h-4 w-4" />
                  <span>Blend Integration</span>
                </button>
                <button 
                  onClick={(e) => handleQuickLinkClick(e, 'soroswap-integration')}
                  className="flex items-center gap-2 p-3 rounded-lg border border-border hover:bg-accent transition-colors text-left w-full relative cursor-pointer"
                  style={{ 
                    zIndex: 9999, 
                    pointerEvents: 'auto',
                    position: 'relative'
                  }}
                  type="button"
                >
                  <BookOpen className="h-4 w-4" />
                  <span>SoroSwap Integration</span>
                </button>
                <button 
                  onClick={(e) => handleQuickLinkClick(e, 'reflector-integration')}
                  className="flex items-center gap-2 p-3 rounded-lg border border-border hover:bg-accent transition-colors text-left w-full relative cursor-pointer"
                  style={{ 
                    zIndex: 9999, 
                    pointerEvents: 'auto',
                    position: 'relative'
                  }}
                  type="button"
                >
                  <BookOpen className="h-4 w-4" />
                  <span>Reflector Integration</span>
                </button>
                <button 
                  onClick={(e) => handleQuickLinkClick(e, 'operations-governance')}
                  className="flex items-center gap-2 p-3 rounded-lg border border-border hover:bg-accent transition-colors text-left w-full relative cursor-pointer"
                  style={{ 
                    zIndex: 9999, 
                    pointerEvents: 'auto',
                    position: 'relative'
                  }}
                  type="button"
                >
                  <Shield className="h-4 w-4" />
                  <span>Operations & Governance</span>
                </button>
                <button 
                  onClick={(e) => handleQuickLinkClick(e, 'risks')}
                  className="flex items-center gap-2 p-3 rounded-lg border border-border hover:bg-accent transition-colors text-left w-full relative cursor-pointer"
                  style={{ 
                    zIndex: 9999, 
                    pointerEvents: 'auto',
                    position: 'relative'
                  }}
                  type="button"
                >
                  <AlertTriangle className="h-4 w-4" />
                  <span>Risk Assessment</span>
                </button>
                <a 
                  href="https://developers.stellar.org" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 rounded-lg border border-border hover:bg-accent transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>Stellar Docs</span>
                </a>
                <a 
                  href="https://soroswap.finance" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 rounded-lg border border-border hover:bg-accent transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>SoroSwap</span>
                </a>
                <a 
                  href="https://reflector.network" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 rounded-lg border border-border hover:bg-accent transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>Reflector Oracle</span>
                </a>
              </div>
            </div>
          </Card>
        </div>
      </main>
      </div>
    </>
  );
}

/*
CÓDIGO ORIGINAL COMENTADO - DESCOMENTE QUANDO NECESSÁRIO

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Search, BookOpen, Shield, AlertTriangle, Info, ExternalLink, Copy, Check } from "lucide-react";

// ... resto do código original comentado ...
*/