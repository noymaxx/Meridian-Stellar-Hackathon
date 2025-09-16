use soroban_sdk::{
    contract, contractimpl, symbol_short, Address, Bytes, Env, String, Symbol, Vec
};
use crate::{TransferContext, ComplianceModule};

const ADMIN: Symbol = symbol_short!("ADMIN");
const ALLOWED_JURISDICTIONS: Symbol = symbol_short!("ALLOW_JUR");
const DENIED_JURISDICTIONS: Symbol = symbol_short!("DENY_JUR");
const ENABLED_TOKENS: Symbol = symbol_short!("TOKENS");

#[contract]
pub struct JurisdictionModule;

#[contractimpl]
impl JurisdictionModule {
    pub fn init_jurisdiction(env: Env, admin: Address) {
        if env.storage().instance().has(&ADMIN) {
            panic!("Already initialized");
        }
        env.storage().instance().set(&ADMIN, &admin);
    }

    pub fn configure_allowed_jurisdictions(env: Env, token: Address, jurisdictions: Vec<String>) {
        Self::require_admin(&env);
        let key = (ALLOWED_JURISDICTIONS, token);
        env.storage().persistent().set(&key, &jurisdictions);
    }

    pub fn configure_denied_jurisdictions(env: Env, token: Address, jurisdictions: Vec<String>) {
        Self::require_admin(&env);
        let key = (DENIED_JURISDICTIONS, token);
        env.storage().persistent().set(&key, &jurisdictions);
    }

    pub fn add_allowed_jurisdiction(env: Env, token: Address, jurisdiction: String) {
        Self::require_admin(&env);
        let key = (ALLOWED_JURISDICTIONS, token.clone());
        let mut jurisdictions: Vec<String> = env.storage().persistent().get(&key).unwrap_or_else(|| Vec::new(&env));

        if !jurisdictions.contains(&jurisdiction) {
            jurisdictions.push_back(jurisdiction.clone());
            env.storage().persistent().set(&key, &jurisdictions);
        }
    }

    pub fn remove_allowed_jurisdiction(env: Env, token: Address, jurisdiction: String) {
        Self::require_admin(&env);
        let key = (ALLOWED_JURISDICTIONS, token.clone());
        let mut jurisdictions: Vec<String> = env.storage().persistent().get(&key).unwrap_or_else(|| Vec::new(&env));

        if let Some(index) = jurisdictions.first_index_of(&jurisdiction) {
            jurisdictions.remove(index);
            env.storage().persistent().set(&key, &jurisdictions);
        }
    }

    pub fn add_denied_jurisdiction(env: Env, token: Address, jurisdiction: String) {
        Self::require_admin(&env);
        let key = (DENIED_JURISDICTIONS, token.clone());
        let mut jurisdictions: Vec<String> = env.storage().persistent().get(&key).unwrap_or_else(|| Vec::new(&env));

        if !jurisdictions.contains(&jurisdiction) {
            jurisdictions.push_back(jurisdiction.clone());
            env.storage().persistent().set(&key, &jurisdictions);
        }
    }

    pub fn remove_denied_jurisdiction(env: Env, token: Address, jurisdiction: String) {
        Self::require_admin(&env);
        let key = (DENIED_JURISDICTIONS, token.clone());
        let mut jurisdictions: Vec<String> = env.storage().persistent().get(&key).unwrap_or_else(|| Vec::new(&env));

        if let Some(index) = jurisdictions.first_index_of(&jurisdiction) {
            jurisdictions.remove(index);
            env.storage().persistent().set(&key, &jurisdictions);
        }
    }

    pub fn is_jurisdiction_allowed(env: Env, token: Address, jurisdiction: String) -> bool {
        let denied_key = (DENIED_JURISDICTIONS, token.clone());
        let denied: Vec<String> = env.storage().persistent().get(&denied_key).unwrap_or_else(|| Vec::new(&env));

        if denied.contains(&jurisdiction) {
            return false;
        }

        let allowed_key = (ALLOWED_JURISDICTIONS, token);
        let allowed: Vec<String> = env.storage().persistent().get(&allowed_key).unwrap_or_else(|| Vec::new(&env));

        // If no allowed list is set, allow all (except denied)
        allowed.is_empty() || allowed.contains(&jurisdiction)
    }

    pub fn enable_for_token(env: Env, token: Address) {
        Self::require_admin(&env);
        let key = (ENABLED_TOKENS, token.clone());
        env.storage().persistent().set(&key, &true);
    }

    pub fn disable_for_token(env: Env, token: Address) {
        Self::require_admin(&env);
        let key = (ENABLED_TOKENS, token.clone());
        env.storage().persistent().remove(&key);
    }

    pub fn is_enabled_for_token(env: Env, token: Address) -> bool {
        let key = (ENABLED_TOKENS, token);
        env.storage().persistent().get(&key).unwrap_or(false)
    }

    pub fn check_jurisdiction(env: Env, context: TransferContext) -> bool {
        if !Self::is_enabled_for_token(env.clone(), context.token.clone()) {
            return true; // Module not enabled for this token
        }

        // Check jurisdiction for both from and to addresses
        let from_jurisdiction = Self::get_address_jurisdiction(&env, &context.from);
        let to_jurisdiction = Self::get_address_jurisdiction(&env, &context.to);

        Self::is_jurisdiction_allowed(env.clone(), context.token.clone(), from_jurisdiction) &&
        Self::is_jurisdiction_allowed(env.clone(), context.token.clone(), to_jurisdiction)
    }

    fn get_address_jurisdiction(env: &Env, address: &Address) -> String {
        // This would query the IdentityRegistry for jurisdiction claim
        // For now, return a default jurisdiction
        String::from_str(env, "US")
    }

    fn require_admin(env: &Env) {
        let admin: Address = env.storage().instance().get(&ADMIN).unwrap();
        admin.require_auth();
    }
}