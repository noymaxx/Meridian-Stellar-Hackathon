#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env, String, BytesN};

#[test]
fn test_token_factory() {
    let env = Env::default();
    let contract_id = env.register(TokenFactory, ());
    let client = TokenFactoryClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let token_admin = Address::generate(&env);

    // Initialize factory
    client.initialize(&admin);

    // Mock authorization
    env.mock_all_auths();

    // Test address prediction
    let salt = BytesN::from_array(&env, &[1; 32]);
    let (token_addr, compliance_addr, id_registry_addr, id_storage_addr, claim_topics_addr, trusted_issuers_addr) =
        client.predict_addresses(&salt);

    // Deploy token with template
    let name = String::from_str(&env, "Test Equity Token");
    let symbol = String::from_str(&env, "TET");

    let deployed = client.deploy_with_template(
        &salt,
        &TokenTemplate::RwaEquity,
        &name,
        &symbol,
        &token_admin,
    );

    // Verify deployment
    assert_eq!(deployed.token_address, token_addr);
    assert_eq!(deployed.compliance_address, compliance_addr);
    assert_eq!(deployed.deployer, token_admin);
    assert_eq!(deployed.config.name, name);
    assert_eq!(deployed.config.symbol, symbol);
    assert_eq!(deployed.config.decimals, 18u32); // RWA Equity default
    assert_eq!(deployed.config.max_holders, Some(2000u32)); // RWA Equity default

    // Test retrieval
    let retrieved = client.get_deployed_token(&token_addr).unwrap();
    assert_eq!(retrieved.token_address, deployed.token_address);
    assert_eq!(retrieved.config.name, deployed.config.name);
}