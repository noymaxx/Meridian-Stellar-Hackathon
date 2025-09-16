use soroban_sdk::{
    contract, contractimpl, symbol_short, Address, BytesN, Env, Symbol, Vec
};

use crate::Identity;

const ADMIN: Symbol = symbol_short!("ADMIN");
const STORAGE: Symbol = symbol_short!("STORAGE");
const CLAIM_TOPICS: Symbol = symbol_short!("TOPICS");
const TRUSTED_ISSUERS: Symbol = symbol_short!("ISSUERS");
const IDENTITIES: Symbol = symbol_short!("IDENTS");

#[contract]
pub struct IdentityRegistry;

#[contractimpl]
impl IdentityRegistry {
    pub fn initialize(
        env: Env,
        admin: Address,
        storage_contract: Address,
        claim_topics_registry: Address,
        trusted_issuers_registry: Address,
    ) {
        if env.storage().instance().has(&ADMIN) {
            panic!("Already initialized");
        }

        env.storage().instance().set(&ADMIN, &admin);
        env.storage().instance().set(&STORAGE, &storage_contract);
        env.storage().instance().set(&CLAIM_TOPICS, &claim_topics_registry);
        env.storage().instance().set(&TRUSTED_ISSUERS, &trusted_issuers_registry);
    }

    pub fn register(env: Env, holder: Address, identity_id: BytesN<32>) {
        Self::require_admin(&env);

        let identity = Identity {
            holder: holder.clone(),
            identity_id: identity_id.clone(),
            verified: Self::is_verified(env.clone(), holder.clone()),
        };

        let key = (IDENTITIES, holder.clone());
        env.storage().persistent().set(&key, &identity);

        env.events().publish(
            (symbol_short!("REGISTER"),),
            (holder, identity_id.clone())
        );
    }

    pub fn revoke(env: Env, holder: Address) {
        Self::require_admin(&env);

        let key = (IDENTITIES, holder.clone());
        env.storage().persistent().remove(&key);

        env.events().publish(
            (symbol_short!("REVOKE"),),
            holder
        );
    }

    pub fn is_verified(env: Env, holder: Address) -> bool {
        // Get required claim topics from ClaimTopicsRegistry
        let claim_topics_registry: Address = env.storage().instance().get(&CLAIM_TOPICS).unwrap();
        let required_topics = Self::get_required_topics(&env, &claim_topics_registry);

        // Get trusted issuers registry
        let trusted_issuers_registry: Address = env.storage().instance().get(&TRUSTED_ISSUERS).unwrap();

        // Get storage contract
        let storage_contract: Address = env.storage().instance().get(&STORAGE).unwrap();

        // Check all required topics have valid claims from trusted issuers
        for topic_id in required_topics.iter() {
            if !Self::has_valid_claim_for_topic(&env, &holder, topic_id, &storage_contract, &trusted_issuers_registry) {
                return false;
            }
        }

        true
    }

    pub fn get_identity(env: Env, holder: Address) -> Option<Identity> {
        let key = (IDENTITIES, holder);
        env.storage().persistent().get(&key)
    }

    pub fn update_verification_status(env: Env, holder: Address) {
        Self::require_admin(&env);

        let key = (IDENTITIES, holder.clone());
        if let Some(mut identity) = env.storage().persistent().get::<_, Identity>(&key) {
            identity.verified = Self::is_verified(env.clone(), holder.clone());
            env.storage().persistent().set(&key, &identity);

            env.events().publish(
                (symbol_short!("VERIF_UPD"),),
                (holder.clone(), identity.verified)
            );
        }
    }


    fn require_admin(env: &Env) {
        let admin: Address = env.storage().instance().get(&ADMIN).unwrap();
        admin.require_auth();
    }

    fn get_required_topics(env: &Env, _claim_topics_registry: &Address) -> Vec<u32> {
        // This would call the ClaimTopicsRegistry contract
        // For now, return a hardcoded list
        let mut topics = Vec::new(env);
        topics.push_back(1); // KYC
        topics.push_back(2); // AML
        topics
    }

    fn has_valid_claim_for_topic(
        _env: &Env,
        _holder: &Address,
        _topic_id: u32,
        _storage_contract: &Address,
        _trusted_issuers_registry: &Address,
    ) -> bool {
        // This would call the IdentityRegistryStorage contract to get claim
        // and TrustedIssuersRegistry to verify issuer
        // For now, simplified implementation
        true
    }
}