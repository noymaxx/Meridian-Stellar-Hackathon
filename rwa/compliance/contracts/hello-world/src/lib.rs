#![no_std]
use soroban_sdk::{
    contract, contractimpl, symbol_short, Address, Env, String, Symbol, 
    Error, panic_with_error, IntoVal
};

// Error types
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum ErrorCode {
    Unauthorized = 1,
    ComplianceFailed = 2,
    InvalidRuleset = 3,
    InvalidAssetType = 4,
    TransferBlocked = 5,
}

impl From<ErrorCode> for Error {
    fn from(error: ErrorCode) -> Self {
        Error::from_contract_error(error as u32)
    }
}

impl IntoVal<Env, Error> for ErrorCode {
    fn into_val(&self, _env: &Env) -> Error {
        Error::from_contract_error(*self as u32)
    }
}

// Storage keys
const ADMIN: Symbol = symbol_short!("ADMIN");
const IDENTITY_REGISTRY: Symbol = symbol_short!("ID_REG");
const RULESETS: Symbol = symbol_short!("RULES");
const TRANSFER_LIMITS: Symbol = symbol_short!("LIMITS");

// Events
const RULESET_UPDATED: Symbol = symbol_short!("RULES_UPD");
const TRANSFER_BLOCKED: Symbol = symbol_short!("TRANS_BLK");

// Ruleset structure - using individual fields for storage
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Ruleset {
    pub region: String,
    pub asset_type: String,
    pub max_transfer_amount: i128,
    pub daily_limit: i128,
    pub requires_kyc: bool,
    pub requires_kyb: bool,
    pub whitelist_only: bool,
}

// Transfer limits structure - using individual fields for storage
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct TransferLimits {
    pub daily_amount: i128,
    pub last_reset: u32,
    pub transaction_count: u32,
}

#[contract]
pub struct Compliance;

#[contractimpl]
impl Compliance {
    // Initialize the compliance contract
    pub fn initialize(env: Env, admin: Address, identity_registry: Address) {
        if env.storage().instance().has(&ADMIN) {
            panic_with_error!(&env, ErrorCode::Unauthorized);
        }

        env.storage().instance().set(&ADMIN, &admin);
        env.storage().instance().set(&IDENTITY_REGISTRY, &identity_registry);
    }

    // Pre-transfer compliance check
    pub fn pre_transfer(
        env: Env,
        from: Address,
        to: Address,
        amount: i128,
        asset_type: String,
        region: String,
    ) -> bool {
        // Get ruleset for the region and asset type
        let ruleset_key = (RULESETS, region.clone(), asset_type.clone());
        
        // Check if ruleset exists
        if !env.storage().persistent().has(&ruleset_key) {
            panic_with_error!(&env, ErrorCode::InvalidRuleset);
        }

        // Get individual fields
        let max_transfer_amount: i128 = env.storage().persistent().get(&(ruleset_key.clone(), symbol_short!("MAX_AMT"))).unwrap();
        let daily_limit: i128 = env.storage().persistent().get(&(ruleset_key.clone(), symbol_short!("DAILY_LIM"))).unwrap();
        let requires_kyc: bool = env.storage().persistent().get(&(ruleset_key.clone(), symbol_short!("KYC"))).unwrap();
        let requires_kyb: bool = env.storage().persistent().get(&(ruleset_key.clone(), symbol_short!("KYB"))).unwrap();
        let whitelist_only: bool = env.storage().persistent().get(&(ruleset_key.clone(), symbol_short!("WHITELIST"))).unwrap();

        // Check if transfer amount exceeds maximum
        if amount > max_transfer_amount {
            env.events().publish((TRANSFER_BLOCKED,), (from, to, amount, "Amount exceeds limit"));
            return false;
        }

        // Check daily limits
        if !Self::check_daily_limits(&env, &from, amount, daily_limit) {
            env.events().publish((TRANSFER_BLOCKED,), (from, to, amount, "Daily limit exceeded"));
            return false;
        }

        // Check KYC requirements
        if requires_kyc {
            let _identity_registry: Address = env.storage().instance().get(&IDENTITY_REGISTRY).unwrap();
            // This would call the identity registry contract
            // For now, assume it returns true
        }

        // Check KYB requirements
        if requires_kyb {
            let _identity_registry: Address = env.storage().instance().get(&IDENTITY_REGISTRY).unwrap();
            // This would call the identity registry contract
            // For now, assume it returns true
        }

        // Check whitelist if required
        if whitelist_only {
            if !Self::is_whitelisted(env.clone(), to.clone()) {
                env.events().publish((TRANSFER_BLOCKED,), (from, to, amount, "Address not whitelisted"));
                return false;
            }
        }

        // Check for suspicious patterns
        if !Self::check_suspicious_patterns(&env, &from, &to, amount) {
            env.events().publish((TRANSFER_BLOCKED,), (from, to, amount, "Suspicious pattern detected"));
            return false;
        }

        true
    }

    // Set ruleset for a region and asset type
    pub fn set_ruleset(
        env: Env,
        region: String,
        asset_type: String,
        max_transfer_amount: i128,
        daily_limit: i128,
        requires_kyc: bool,
        requires_kyb: bool,
        whitelist_only: bool,
    ) -> bool {
        Self::require_admin(&env);

        let ruleset_key = (RULESETS, region.clone(), asset_type.clone());
        
        // Store individual fields
        env.storage().persistent().set(&(ruleset_key.clone(), symbol_short!("MAX_AMT")), &max_transfer_amount);
        env.storage().persistent().set(&(ruleset_key.clone(), symbol_short!("DAILY_LIM")), &daily_limit);
        env.storage().persistent().set(&(ruleset_key.clone(), symbol_short!("KYC")), &requires_kyc);
        env.storage().persistent().set(&(ruleset_key.clone(), symbol_short!("KYB")), &requires_kyb);
        env.storage().persistent().set(&(ruleset_key.clone(), symbol_short!("WHITELIST")), &whitelist_only);
        
        // Mark that ruleset exists
        env.storage().persistent().set(&ruleset_key, &true);

        // Emit event
        env.events().publish((RULESET_UPDATED,), (region, asset_type));

        true
    }

    // Get ruleset for a region and asset type - returns individual values
    pub fn get_ruleset(env: Env, region: String, asset_type: String) -> (bool, i128, i128, bool, bool, bool) {
        let ruleset_key = (RULESETS, region.clone(), asset_type.clone());
        
        // Check if ruleset exists
        if !env.storage().persistent().has(&ruleset_key) {
            return (false, 0, 0, false, false, false);
        }

        // Get individual fields
        let max_transfer_amount: i128 = env.storage().persistent().get(&(ruleset_key.clone(), symbol_short!("MAX_AMT"))).unwrap_or(0);
        let daily_limit: i128 = env.storage().persistent().get(&(ruleset_key.clone(), symbol_short!("DAILY_LIM"))).unwrap_or(0);
        let requires_kyc: bool = env.storage().persistent().get(&(ruleset_key.clone(), symbol_short!("KYC"))).unwrap_or(false);
        let requires_kyb: bool = env.storage().persistent().get(&(ruleset_key.clone(), symbol_short!("KYB"))).unwrap_or(false);
        let whitelist_only: bool = env.storage().persistent().get(&(ruleset_key.clone(), symbol_short!("WHITELIST"))).unwrap_or(false);

        (true, max_transfer_amount, daily_limit, requires_kyc, requires_kyb, whitelist_only)
    }

    // Add address to whitelist
    pub fn add_to_whitelist(env: Env, addr: Address) -> bool {
        Self::require_admin(&env);

        let key = (symbol_short!("WHITELIST"), addr.clone());
        env.storage().persistent().set(&key, &true);

        true
    }

    // Remove address from whitelist
    pub fn remove_from_whitelist(env: Env, addr: Address) -> bool {
        Self::require_admin(&env);

        let key = (symbol_short!("WHITELIST"), addr.clone());
        env.storage().persistent().remove(&key);

        true
    }

    // Check if address is whitelisted
    pub fn is_whitelisted(env: Env, addr: Address) -> bool {
        let key = (symbol_short!("WHITELIST"), addr);
        env.storage().persistent().get(&key).unwrap_or(false)
    }

    // Get transfer limits for an address - returns individual values
    pub fn get_transfer_limits(env: Env, addr: Address) -> (bool, i128, u32, u32) {
        let limits_key = (TRANSFER_LIMITS, addr.clone());
        
        // Check if limits exist
        if !env.storage().persistent().has(&limits_key) {
            return (false, 0, 0, 0);
        }

        // Get individual fields
        let daily_amount: i128 = env.storage().persistent().get(&(limits_key.clone(), symbol_short!("DAILY_AMT"))).unwrap_or(0);
        let last_reset: u32 = env.storage().persistent().get(&(limits_key.clone(), symbol_short!("LAST_RST"))).unwrap_or(0);
        let transaction_count: u32 = env.storage().persistent().get(&(limits_key.clone(), symbol_short!("TXN_COUNT"))).unwrap_or(0);

        (true, daily_amount, last_reset, transaction_count)
    }

    // Reset daily limits (called by admin or automated process)
    pub fn reset_daily_limits(env: Env, addr: Address) -> bool {
        Self::require_admin(&env);

        let limits_key = (TRANSFER_LIMITS, addr.clone());
        
        // Store individual fields
        env.storage().persistent().set(&(limits_key.clone(), symbol_short!("DAILY_AMT")), &0i128);
        env.storage().persistent().set(&(limits_key.clone(), symbol_short!("LAST_RST")), &env.ledger().sequence());
        env.storage().persistent().set(&(limits_key.clone(), symbol_short!("TXN_COUNT")), &0u32);
        
        // Mark that limits exist
        env.storage().persistent().set(&limits_key, &true);

        true
    }

    // Internal functions
    fn require_admin(env: &Env) {
        let admin: Address = env.storage().instance().get(&ADMIN).unwrap();
        admin.require_auth();
    }

    fn check_daily_limits(env: &Env, addr: &Address, amount: i128, daily_limit: i128) -> bool {
        let limits_key = (TRANSFER_LIMITS, addr.clone());
        let current_ledger = env.ledger().sequence();
        
        // Get current limits or initialize
        let daily_amount: i128 = env.storage().persistent().get(&(limits_key.clone(), symbol_short!("DAILY_AMT"))).unwrap_or(0);
        let last_reset: u32 = env.storage().persistent().get(&(limits_key.clone(), symbol_short!("LAST_RST"))).unwrap_or(current_ledger);
        let transaction_count: u32 = env.storage().persistent().get(&(limits_key.clone(), symbol_short!("TXN_COUNT"))).unwrap_or(0);

        let mut new_daily_amount = daily_amount;
        let mut new_last_reset = last_reset;
        let mut new_transaction_count = transaction_count;

        // Reset if it's a new day (assuming 1 ledger = 1 second for simplicity)
        if current_ledger - last_reset > 86400 { // 24 hours
            new_daily_amount = 0;
            new_last_reset = current_ledger;
            new_transaction_count = 0;
        }

        // Check if adding this amount would exceed daily limit
        if new_daily_amount + amount > daily_limit {
            return false;
        }

        // Update limits
        new_daily_amount += amount;
        new_transaction_count += 1;
        
        // Store updated limits
        env.storage().persistent().set(&(limits_key.clone(), symbol_short!("DAILY_AMT")), &new_daily_amount);
        env.storage().persistent().set(&(limits_key.clone(), symbol_short!("LAST_RST")), &new_last_reset);
        env.storage().persistent().set(&(limits_key.clone(), symbol_short!("TXN_COUNT")), &new_transaction_count);
        env.storage().persistent().set(&limits_key, &true);

        true
    }

    fn check_suspicious_patterns(_env: &Env, _from: &Address, _to: &Address, _amount: i128) -> bool {
        // Implement suspicious pattern detection
        // This could include:
        // - Unusual transfer amounts
        // - Rapid successive transfers
        // - Transfers to known suspicious addresses
        // - Round number transfers (potential test transactions)
        
        // For now, return true (no suspicious patterns)
        true
    }
}

mod test;