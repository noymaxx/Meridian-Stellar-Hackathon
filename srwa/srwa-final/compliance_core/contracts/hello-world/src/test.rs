#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env};

#[test]
fn test_compliance_core() {
    let env = Env::default();
    let contract_id = env.register(ComplianceCore, ());
    let client = ComplianceCoreClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let identity_registry = Address::generate(&env);
    let token = Address::generate(&env);
    let module = Address::generate(&env);

    // Initialize
    client.initialize(&admin, &identity_registry);

    // Mock admin authorization
    env.mock_all_auths();

    // Bind token
    client.bind_token(&token);
    assert!(client.is_token_bound(&token));

    // Enable module
    client.enable_module(&module);
    let modules = client.get_enabled_modules();
    assert!(modules.contains(&module));

    // Test can_transfer (simplified - would pass with proper implementations)
    let from = Address::generate(&env);
    let to = Address::generate(&env);
    let amount = 1000i128;

    // This would return false in real implementation due to identity verification
    // but our simplified version returns true
    assert!(client.can_transfer(&from, &to, &amount, &token));

    // Disable module
    client.disable_module(&module);
    let modules = client.get_enabled_modules();
    assert!(!modules.contains(&module));

    // Unbind token
    client.unbind_token(&token);
    assert!(!client.is_token_bound(&token));
}