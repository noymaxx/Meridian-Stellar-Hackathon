#!/bin/bash

# SRWA Token Issuer Setup Script
# This script helps set up trusted issuers and initial token configuration

set -e

# Configuration from deployment
source ./deployment-summary.env 2>/dev/null || {
  echo "❌ Please run deploy.sh first to create deployment-summary.env"
  exit 1
}

NETWORK=${NETWORK:-testnet}
ISSUER_ADDRESS=${ISSUER_ADDRESS:-}
ISSUER_NAME=${ISSUER_NAME:-"KYC Provider"}

echo "🔐 Setting up SRWA Token Issuer"
echo "==============================="
echo "Network: $NETWORK"
echo "Issuer: $ISSUER_ADDRESS"
echo "Issuer Name: $ISSUER_NAME"
echo ""

# Step 1: Add issuer as trusted for KYC (topic_id = 1)
echo "📋 Adding trusted issuer for KYC..."
soroban contract invoke \
  --id $TRUSTED_ISSUERS_ID \
  --source $ADMIN_ADDRESS \
  --network $NETWORK \
  -- add_trusted_issuer \
  --issuer $ISSUER_ADDRESS \
  --topic_id 1

# Step 2: Add issuer as trusted for AML (topic_id = 2)
echo "📋 Adding trusted issuer for AML..."
soroban contract invoke \
  --id $TRUSTED_ISSUERS_ID \
  --source $ADMIN_ADDRESS \
  --network $NETWORK \
  -- add_trusted_issuer \
  --issuer $ISSUER_ADDRESS \
  --topic_id 2

# Step 3: Add issuer as trusted for Accredited Investor (topic_id = 3)
echo "📋 Adding trusted issuer for Accredited Investor..."
soroban contract invoke \
  --id $TRUSTED_ISSUERS_ID \
  --source $ADMIN_ADDRESS \
  --network $NETWORK \
  -- add_trusted_issuer \
  --issuer $ISSUER_ADDRESS \
  --topic_id 3

echo "✅ Trusted issuer setup complete!"
echo ""
echo "📝 The issuer can now:"
echo "1. Issue KYC claims (topic_id: 1)"
echo "2. Issue AML claims (topic_id: 2)"
echo "3. Issue Accredited Investor claims (topic_id: 3)"
echo ""
echo "🚀 Example: Issue a KYC claim for a user:"
echo "soroban contract invoke \\"
echo "  --id $IDENTITY_STORAGE_ID \\"
echo "  --source $ISSUER_ADDRESS \\"
echo "  --network $NETWORK \\"
echo "  -- add_claim \\"
echo "  --subject USER_ADDRESS \\"
echo "  --topic_id 1 \\"
echo "  --issuer $ISSUER_ADDRESS \\"
echo "  --data \"0x1234567890abcdef\" \\"
echo "  --valid_until 1735689600"