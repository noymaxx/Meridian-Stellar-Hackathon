#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, Address, Bytes, BytesN, Env, Symbol, Vec
};

const ADMIN: Symbol = symbol_short!("ADMIN");
const CLAIMS: Symbol = symbol_short!("CLAIMS");

#[derive(Clone, Debug, Eq, PartialEq)]
#[contracttype]
pub struct Claim {
    pub issuer: Address,
    pub topic_id: u32,
    pub data_hash: BytesN<32>,
    pub issued_at: u64,
    pub valid_until: u64,
    pub revoked: bool,
    pub revocation_ref: BytesN<32>,
}

#[derive(Clone, Debug, Eq, PartialEq)]
#[contracttype]
pub struct Identity {
    pub holder: Address,
    pub identity_id: BytesN<32>,
    pub verified: bool,
}

#[contract]
pub struct IdentityRegistryStorage;

#[contractimpl]
impl IdentityRegistryStorage {
    pub fn initialize(env: Env, admin: Address) {
        if env.storage().instance().has(&ADMIN) {
            panic!("Already initialized");
        }
        env.storage().instance().set(&ADMIN, &admin);
    }

    pub fn add_claim(
        env: Env,
        subject: Address,
        topic_id: u32,
        issuer: Address,
        data: Bytes,
        valid_until: u64,
    ) {
        Self::require_admin(&env);

        let data_hash = env.crypto().sha256(&data);
        let claim = Claim {
            issuer: issuer.clone(),
            topic_id,
            data_hash: data_hash.into(),
            issued_at: env.ledger().timestamp(),
            valid_until,
            revoked: false,
            revocation_ref: BytesN::from_array(&env, &[0; 32]),
        };

        let key = (CLAIMS, subject.clone(), topic_id);
        env.storage().persistent().set(&key, &claim);

        env.events().publish(
            (symbol_short!("CLAIM_ADD"),),
            (subject, topic_id, issuer.clone())
        );
    }

    pub fn revoke_claim(
        env: Env,
        subject: Address,
        topic_id: u32,
        revocation_ref: BytesN<32>,
    ) {
        Self::require_admin(&env);

        let key = (CLAIMS, subject.clone(), topic_id);
        if let Some(mut claim) = env.storage().persistent().get::<_, Claim>(&key) {
            claim.revoked = true;
            claim.revocation_ref = revocation_ref.clone();
            env.storage().persistent().set(&key, &claim);

            env.events().publish(
                (symbol_short!("CLAIM_REV"),),
                (subject, topic_id, revocation_ref.clone())
            );
        }
    }

    pub fn get_claim(env: Env, subject: Address, topic_id: u32) -> Option<Claim> {
        let key = (CLAIMS, subject, topic_id);
        env.storage().persistent().get(&key)
    }

    pub fn has_claim(env: Env, subject: Address, topic_id: u32) -> bool {
        let key = (CLAIMS, subject, topic_id);
        if let Some(claim) = env.storage().persistent().get::<_, Claim>(&key) {
            !claim.revoked && claim.valid_until > env.ledger().timestamp()
        } else {
            false
        }
    }

    pub fn get_claims_by_subject(env: Env, _subject: Address) -> Vec<(u32, Claim)> {
        let claims = Vec::new(&env);
        // Note: In a real implementation, you'd need an index to efficiently query by subject
        // For now, this is a simplified version
        claims
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

// pub mod identity_registry;

mod test;