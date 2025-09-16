#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env, BytesN, Bytes};

#[test]
fn test_identity_registry_storage() {
    let env = Env::default();
    let contract_id = env.register(IdentityRegistryStorage, ());
    let client = IdentityRegistryStorageClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let subject = Address::generate(&env);
    let issuer = Address::generate(&env);

    // Initialize
    client.initialize(&admin);

    // Mock admin authorization
    env.mock_all_auths();

    // Add claim
    let data = Bytes::from_array(&env, &[1, 2, 3, 4]);
    let topic_id = 1u32; // KYC
    let valid_until = env.ledger().timestamp() + 86400; // Valid for 1 day

    client.add_claim(&subject, &topic_id, &issuer, &data, &valid_until);

    // Check claim exists
    assert!(client.has_claim(&subject, &topic_id));

    // Get claim
    let claim = client.get_claim(&subject, &topic_id).unwrap();
    assert_eq!(claim.issuer, issuer);
    assert_eq!(claim.topic_id, topic_id);
    assert!(!claim.revoked);

    // Revoke claim
    let revocation_ref = BytesN::from_array(&env, &[5; 32]);
    client.revoke_claim(&subject, &topic_id, &revocation_ref);

    // Check claim is revoked
    assert!(!client.has_claim(&subject, &topic_id));
    let revoked_claim = client.get_claim(&subject, &topic_id).unwrap();
    assert!(revoked_claim.revoked);
}