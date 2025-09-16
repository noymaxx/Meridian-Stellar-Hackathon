#!/bin/bash

# SRWA Token Deployment Script for Stellar Soroban
# This script deploys the complete SRWA ecosystem

set -e

# Configuration
NETWORK=${NETWORK:-testnet}
ADMIN_ADDRESS=${ADMIN_ADDRESS:-}
SALT=${SALT:-"0x0000000000000000000000000000000000000000000000000000000000000001"}

# Check dependencies
command -v soroban >/dev/null 2>&1 || { echo "soroban CLI is required but not installed. Aborting." >&2; exit 1; }

echo "🚀 Starting SRWA Token Deployment on $NETWORK"
echo "=====================================\n"

# Step 1: Build all contracts
echo "📦 Building contracts..."
cargo build --release --target wasm32-unknown-unknown

# Step 2: Deploy IdentityRegistryStorage
echo "🔐 Deploying IdentityRegistryStorage..."
IDENTITY_STORAGE_WASM="target/wasm32-unknown-unknown/release/identity_registry_storage.wasm"
IDENTITY_STORAGE_ID=$(soroban contract deploy \
  --wasm $IDENTITY_STORAGE_WASM \
  --source $ADMIN_ADDRESS \
  --network $NETWORK)
echo "✅ IdentityRegistryStorage deployed: $IDENTITY_STORAGE_ID"

# Step 3: Deploy ClaimTopicsRegistry
echo "📋 Deploying ClaimTopicsRegistry..."
CLAIM_TOPICS_WASM="target/wasm32-unknown-unknown/release/claim_topics_registry.wasm"
CLAIM_TOPICS_ID=$(soroban contract deploy \
  --wasm $CLAIM_TOPICS_WASM \
  --source $ADMIN_ADDRESS \
  --network $NETWORK)
echo "✅ ClaimTopicsRegistry deployed: $CLAIM_TOPICS_ID"

# Step 4: Deploy TrustedIssuersRegistry
echo "🔒 Deploying TrustedIssuersRegistry..."
TRUSTED_ISSUERS_WASM="target/wasm32-unknown-unknown/release/trusted_issuers_registry.wasm"
TRUSTED_ISSUERS_ID=$(soroban contract deploy \
  --wasm $TRUSTED_ISSUERS_WASM \
  --source $ADMIN_ADDRESS \
  --network $NETWORK)
echo "✅ TrustedIssuersRegistry deployed: $TRUSTED_ISSUERS_ID"

# Step 5: Deploy IdentityRegistry
echo "👤 Deploying IdentityRegistry..."
IDENTITY_REGISTRY_WASM="target/wasm32-unknown-unknown/release/identity_registry.wasm"
IDENTITY_REGISTRY_ID=$(soroban contract deploy \
  --wasm $IDENTITY_REGISTRY_WASM \
  --source $ADMIN_ADDRESS \
  --network $NETWORK)
echo "✅ IdentityRegistry deployed: $IDENTITY_REGISTRY_ID"

# Step 6: Deploy ComplianceCore
echo "⚖️  Deploying ComplianceCore..."
COMPLIANCE_CORE_WASM="target/wasm32-unknown-unknown/release/compliance_core.wasm"
COMPLIANCE_CORE_ID=$(soroban contract deploy \
  --wasm $COMPLIANCE_CORE_WASM \
  --source $ADMIN_ADDRESS \
  --network $NETWORK)
echo "✅ ComplianceCore deployed: $COMPLIANCE_CORE_ID"

# Step 7: Deploy Compliance Modules
echo "🔧 Deploying Compliance Modules..."

# Jurisdiction Module
JURISDICTION_WASM="target/wasm32-unknown-unknown/release/jurisdiction_module.wasm"
JURISDICTION_ID=$(soroban contract deploy \
  --wasm $JURISDICTION_WASM \
  --source $ADMIN_ADDRESS \
  --network $NETWORK)
echo "✅ JurisdictionModule deployed: $JURISDICTION_ID"

# Pause/Freeze Module
PAUSE_FREEZE_WASM="target/wasm32-unknown-unknown/release/pause_freeze_module.wasm"
PAUSE_FREEZE_ID=$(soroban contract deploy \
  --wasm $PAUSE_FREEZE_WASM \
  --source $ADMIN_ADDRESS \
  --network $NETWORK)
echo "✅ PauseFreezeModule deployed: $PAUSE_FREEZE_ID"

# Max Holders Module
MAX_HOLDERS_WASM="target/wasm32-unknown-unknown/release/max_holders_module.wasm"
MAX_HOLDERS_ID=$(soroban contract deploy \
  --wasm $MAX_HOLDERS_WASM \
  --source $ADMIN_ADDRESS \
  --network $NETWORK)
echo "✅ MaxHoldersModule deployed: $MAX_HOLDERS_ID"

# Lockup Module
LOCKUP_WASM="target/wasm32-unknown-unknown/release/lockup_module.wasm"
LOCKUP_ID=$(soroban contract deploy \
  --wasm $LOCKUP_WASM \
  --source $ADMIN_ADDRESS \
  --network $NETWORK)
echo "✅ LockupModule deployed: $LOCKUP_ID"

# Step 8: Deploy SRWA Token
echo "💰 Deploying SRWA Token..."
SRWA_TOKEN_WASM="target/wasm32-unknown-unknown/release/srwa_token.wasm"
SRWA_TOKEN_ID=$(soroban contract deploy \
  --wasm $SRWA_TOKEN_WASM \
  --source $ADMIN_ADDRESS \
  --network $NETWORK)
echo "✅ SRWA Token deployed: $SRWA_TOKEN_ID"

# Step 9: Deploy TokenFactory
echo "🏭 Deploying TokenFactory..."
TOKEN_FACTORY_WASM="target/wasm32-unknown-unknown/release/token_factory.wasm"
TOKEN_FACTORY_ID=$(soroban contract deploy \
  --wasm $TOKEN_FACTORY_WASM \
  --source $ADMIN_ADDRESS \
  --network $NETWORK)
echo "✅ TokenFactory deployed: $TOKEN_FACTORY_ID"

# Step 10: Deploy Integration Adapters
echo "🔌 Deploying Integration Adapters..."

# SoroSwap Adapter
SOROSWAP_ADAPTER_WASM="target/wasm32-unknown-unknown/release/soroswap_adapter.wasm"
SOROSWAP_ADAPTER_ID=$(soroban contract deploy \
  --wasm $SOROSWAP_ADAPTER_WASM \
  --source $ADMIN_ADDRESS \
  --network $NETWORK)
echo "✅ SoroSwap Adapter deployed: $SOROSWAP_ADAPTER_ID"

# Blend Adapter
BLEND_ADAPTER_WASM="target/wasm32-unknown-unknown/release/blend_adapter.wasm"
BLEND_ADAPTER_ID=$(soroban contract deploy \
  --wasm $BLEND_ADAPTER_WASM \
  --source $ADMIN_ADDRESS \
  --network $NETWORK)
echo "✅ Blend Adapter deployed: $BLEND_ADAPTER_ID"

# Step 11: Initialize contracts
echo "\n🔧 Initializing contracts..."

# Initialize IdentityRegistryStorage
soroban contract invoke \
  --id $IDENTITY_STORAGE_ID \
  --source $ADMIN_ADDRESS \
  --network $NETWORK \
  -- initialize \
  --admin $ADMIN_ADDRESS

# Initialize ClaimTopicsRegistry
soroban contract invoke \
  --id $CLAIM_TOPICS_ID \
  --source $ADMIN_ADDRESS \
  --network $NETWORK \
  -- initialize \
  --admin $ADMIN_ADDRESS

# Initialize TrustedIssuersRegistry
soroban contract invoke \
  --id $TRUSTED_ISSUERS_ID \
  --source $ADMIN_ADDRESS \
  --network $NETWORK \
  -- initialize \
  --admin $ADMIN_ADDRESS

# Initialize IdentityRegistry
soroban contract invoke \
  --id $IDENTITY_REGISTRY_ID \
  --source $ADMIN_ADDRESS \
  --network $NETWORK \
  -- initialize \
  --admin $ADMIN_ADDRESS \
  --storage_contract $IDENTITY_STORAGE_ID \
  --claim_topics_registry $CLAIM_TOPICS_ID \
  --trusted_issuers_registry $TRUSTED_ISSUERS_ID

# Initialize ComplianceCore
soroban contract invoke \
  --id $COMPLIANCE_CORE_ID \
  --source $ADMIN_ADDRESS \
  --network $NETWORK \
  -- initialize \
  --admin $ADMIN_ADDRESS \
  --identity_registry $IDENTITY_REGISTRY_ID

# Initialize SRWA Token
soroban contract invoke \
  --id $SRWA_TOKEN_ID \
  --source $ADMIN_ADDRESS \
  --network $NETWORK \
  -- initialize \
  --admin $ADMIN_ADDRESS \
  --name "Sample RWA Security Token" \
  --symbol "SRWA" \
  --decimals 18 \
  --compliance_contract $COMPLIANCE_CORE_ID

# Initialize TokenFactory
soroban contract invoke \
  --id $TOKEN_FACTORY_ID \
  --source $ADMIN_ADDRESS \
  --network $NETWORK \
  -- initialize \
  --admin $ADMIN_ADDRESS

# Initialize compliance modules
soroban contract invoke \
  --id $JURISDICTION_ID \
  --source $ADMIN_ADDRESS \
  --network $NETWORK \
  -- initialize \
  --admin $ADMIN_ADDRESS

soroban contract invoke \
  --id $PAUSE_FREEZE_ID \
  --source $ADMIN_ADDRESS \
  --network $NETWORK \
  -- initialize \
  --admin $ADMIN_ADDRESS

soroban contract invoke \
  --id $MAX_HOLDERS_ID \
  --source $ADMIN_ADDRESS \
  --network $NETWORK \
  -- initialize \
  --admin $ADMIN_ADDRESS

soroban contract invoke \
  --id $LOCKUP_ID \
  --source $ADMIN_ADDRESS \
  --network $NETWORK \
  -- initialize \
  --admin $ADMIN_ADDRESS

# Initialize integration adapters
soroban contract invoke \
  --id $SOROSWAP_ADAPTER_ID \
  --source $ADMIN_ADDRESS \
  --network $NETWORK \
  -- initialize \
  --admin $ADMIN_ADDRESS

soroban contract invoke \
  --id $BLEND_ADAPTER_ID \
  --source $ADMIN_ADDRESS \
  --network $NETWORK \
  -- initialize \
  --admin $ADMIN_ADDRESS

# Step 12: Wire contracts together
echo "\n🔗 Wiring contracts together..."

# Bind token to compliance
soroban contract invoke \
  --id $COMPLIANCE_CORE_ID \
  --source $ADMIN_ADDRESS \
  --network $NETWORK \
  -- bind_token \
  --token $SRWA_TOKEN_ID

# Enable compliance modules
soroban contract invoke \
  --id $COMPLIANCE_CORE_ID \
  --source $ADMIN_ADDRESS \
  --network $NETWORK \
  -- enable_module \
  --module $JURISDICTION_ID

soroban contract invoke \
  --id $COMPLIANCE_CORE_ID \
  --source $ADMIN_ADDRESS \
  --network $NETWORK \
  -- enable_module \
  --module $PAUSE_FREEZE_ID

soroban contract invoke \
  --id $COMPLIANCE_CORE_ID \
  --source $ADMIN_ADDRESS \
  --network $NETWORK \
  -- enable_module \
  --module $MAX_HOLDERS_ID

# Step 13: Setup basic claim topics
echo "\n📋 Setting up claim topics..."

soroban contract invoke \
  --id $CLAIM_TOPICS_ID \
  --source $ADMIN_ADDRESS \
  --network $NETWORK \
  -- add_claim_topic \
  --topic_id 1 \
  --topic_name "KYC"

soroban contract invoke \
  --id $CLAIM_TOPICS_ID \
  --source $ADMIN_ADDRESS \
  --network $NETWORK \
  -- add_claim_topic \
  --topic_id 2 \
  --topic_name "AML"

soroban contract invoke \
  --id $CLAIM_TOPICS_ID \
  --source $ADMIN_ADDRESS \
  --network $NETWORK \
  -- add_claim_topic \
  --topic_id 3 \
  --topic_name "Accredited_Investor"

# Step 14: Generate deployment summary
echo "\n📄 Deployment Summary"
echo "======================"
cat > deployment-summary.json << EOF
{
  "network": "$NETWORK",
  "admin": "$ADMIN_ADDRESS",
  "contracts": {
    "identity_registry_storage": "$IDENTITY_STORAGE_ID",
    "claim_topics_registry": "$CLAIM_TOPICS_ID",
    "trusted_issuers_registry": "$TRUSTED_ISSUERS_ID",
    "identity_registry": "$IDENTITY_REGISTRY_ID",
    "compliance_core": "$COMPLIANCE_CORE_ID",
    "srwa_token": "$SRWA_TOKEN_ID",
    "token_factory": "$TOKEN_FACTORY_ID",
    "modules": {
      "jurisdiction": "$JURISDICTION_ID",
      "pause_freeze": "$PAUSE_FREEZE_ID",
      "max_holders": "$MAX_HOLDERS_ID",
      "lockup": "$LOCKUP_ID"
    },
    "integrations": {
      "soroswap_adapter": "$SOROSWAP_ADAPTER_ID",
      "blend_adapter": "$BLEND_ADAPTER_ID"
    }
  },
  "deployed_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF

echo "✅ All contracts deployed and configured successfully!"
echo "📄 Deployment summary saved to deployment-summary.json"
echo "\n🎉 SRWA Token ecosystem is ready for use!"
echo "\n📝 Next steps:"
echo "1. Set up trusted issuers for KYC/AML verification"
echo "2. Configure jurisdiction and compliance rules"
echo "3. Register initial users and verify identities"
echo "4. Mint initial token supply"
echo "5. Set up SoroSwap and Blend integrations"