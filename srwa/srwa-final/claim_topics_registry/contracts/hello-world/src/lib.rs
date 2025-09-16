#![no_std]
use soroban_sdk::{
    contract, contractimpl, symbol_short, Address, Env, String, Symbol, Vec
};

const ADMIN: Symbol = symbol_short!("ADMIN");
const TOPICS: Symbol = symbol_short!("TOPICS");

#[contract]
pub struct ClaimTopicsRegistry;

#[contractimpl]
impl ClaimTopicsRegistry {
    pub fn initialize(env: Env, admin: Address) {
        if env.storage().instance().has(&ADMIN) {
            panic!("Already initialized");
        }
        env.storage().instance().set(&ADMIN, &admin);
    }

    pub fn add_claim_topic(env: Env, topic_id: u32, topic_name: String) {
        Self::require_admin(&env);

        let key = (TOPICS, topic_id);
        env.storage().persistent().set(&key, &topic_name);

        env.events().publish(
            (symbol_short!("TOPIC_ADD"),),
            (topic_id, topic_name)
        );
    }

    pub fn remove_claim_topic(env: Env, topic_id: u32) {
        Self::require_admin(&env);

        let key = (TOPICS, topic_id);
        if env.storage().persistent().has(&key) {
            let topic_name: String = env.storage().persistent().get(&key).unwrap();
            env.storage().persistent().remove(&key);

            env.events().publish(
                (symbol_short!("TOPIC_REM"),),
                (topic_id, topic_name)
            );
        }
    }

    pub fn get_claim_topic(env: Env, topic_id: u32) -> Option<String> {
        let key = (TOPICS, topic_id);
        env.storage().persistent().get(&key)
    }

    pub fn has_claim_topic(env: Env, topic_id: u32) -> bool {
        let key = (TOPICS, topic_id);
        env.storage().persistent().has(&key)
    }

    pub fn list_claim_topics(env: Env) -> Vec<u32> {
        // Note: In a real implementation, you'd need an index to efficiently query all topics
        // For now, return hardcoded standard topics
        let mut topics = Vec::new(&env);
        topics.push_back(1); // KYC
        topics.push_back(2); // AML
        topics.push_back(3); // Accredited Investor
        topics.push_back(4); // Residency
        topics.push_back(5); // Sanctions Clear
        topics.push_back(6); // PEP Check
        topics
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