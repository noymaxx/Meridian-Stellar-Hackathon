#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env};

#[test]
fn test_trusted_issuers_registry() {
    let env = Env::default();
    let contract_id = env.register(TrustedIssuersRegistry, ());
    let client = TrustedIssuersRegistryClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let issuer = Address::generate(&env);

    // Initialize
    client.initialize(&admin);

    // Mock admin authorization
    env.mock_all_auths();

    let topic_id = 1u32; // KYC

    // Initially not trusted
    assert!(!client.is_trusted(&issuer, &topic_id));

    // Add trusted issuer
    client.add_trusted_issuer(&issuer, &topic_id);

    // Now should be trusted
    assert!(client.is_trusted(&issuer, &topic_id));

    // Remove trusted issuer
    client.remove_trusted_issuer(&issuer, &topic_id);

    // Should no longer be trusted
    assert!(!client.is_trusted(&issuer, &topic_id));
}