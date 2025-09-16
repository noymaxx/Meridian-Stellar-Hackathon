#![no_std]
use soroban_sdk::{
    contract, contractimpl, symbol_short, Address, Env, Symbol, Vec
};

const ADMIN: Symbol = symbol_short!("ADMIN");
const ISSUERS: Symbol = symbol_short!("ISSUERS");

#[contract]
pub struct TrustedIssuersRegistry;

#[contractimpl]
impl TrustedIssuersRegistry {
    pub fn initialize(env: Env, admin: Address) {
        if env.storage().instance().has(&ADMIN) {
            panic!("Already initialized");
        }
        env.storage().instance().set(&ADMIN, &admin);
    }

    pub fn add_trusted_issuer(env: Env, issuer: Address, topic_id: u32) {
        Self::require_admin(&env);

        let key = (ISSUERS, issuer.clone(), topic_id);
        env.storage().persistent().set(&key, &true);

        env.events().publish(
            (symbol_short!("ISS_ADD"),),
            (issuer, topic_id)
        );
    }

    pub fn remove_trusted_issuer(env: Env, issuer: Address, topic_id: u32) {
        Self::require_admin(&env);

        let key = (ISSUERS, issuer.clone(), topic_id);
        env.storage().persistent().remove(&key);

        env.events().publish(
            (symbol_short!("ISS_REM"),),
            (issuer, topic_id)
        );
    }

    pub fn is_trusted(env: Env, issuer: Address, topic_id: u32) -> bool {
        let key = (ISSUERS, issuer, topic_id);
        env.storage().persistent().get(&key).unwrap_or(false)
    }

    pub fn get_trusted_issuers_for_topic(env: Env, _topic_id: u32) -> Vec<Address> {
        // Note: In a real implementation, you'd need an index to efficiently query by topic
        // For now, return empty vector
        Vec::new(&env)
    }

    pub fn get_topics_for_issuer(env: Env, _issuer: Address) -> Vec<u32> {
        // Note: In a real implementation, you'd need an index to efficiently query by issuer
        // For now, return empty vector
        Vec::new(&env)
    }

    pub fn set_admin(env: Env, new_admin: Address) {
        Self::require_admin(&env);
        env.storage().instance().set(&ADMIN, &new_admin);
    }

    pub fn get_admin(env: Env) -> Address {
        env.storage().instance().get(&ADMIN).unwrap()
    }

    fn require_admin(env: &Env) {
        let admin: Address = env.storage().instance().get(&ADMIN).unwrap();
        admin.require_auth();
    }
}

mod test;