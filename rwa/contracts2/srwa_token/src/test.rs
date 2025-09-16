#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env, String};

#[test]
fn test_srwa_token() {
    let env = Env::default();
    let contract_id = env.register(SrwaToken, ());
    let client = SrwaTokenClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let compliance = Address::generate(&env);
    let user1 = Address::generate(&env);
    let user2 = Address::generate(&env);

    // Initialize token
    client.initialize(
        &admin,
        &String::from_str(&env, "Security Token"),
        &String::from_str(&env, "SRWA"),
        &8u32,
        &compliance,
    );

    // Mock admin authorization
    env.mock_all_auths();

    // Test metadata
    assert_eq!(client.name(), String::from_str(&env, "Security Token"));
    assert_eq!(client.symbol(), String::from_str(&env, "SRWA"));
    assert_eq!(client.decimals(), 8u32);
    assert_eq!(client.total_supply(), 0i128);

    // Test mint
    let mint_amount = 1000i128;
    client.mint(&user1, &mint_amount);

    assert_eq!(client.balance(&user1), mint_amount);
    assert_eq!(client.total_supply(), mint_amount);

    // Test transfer
    let transfer_amount = 100i128;
    client.transfer(&user1, &user2, &transfer_amount);

    assert_eq!(client.balance(&user1), mint_amount - transfer_amount);
    assert_eq!(client.balance(&user2), transfer_amount);

    // Test approval and transfer_from
    let approval_amount = 50i128;
    client.approve(&user1, &user2, &approval_amount, &1000u32);
    assert_eq!(client.allowance(&user1, &user2), approval_amount);

    client.transfer_from(&user2, &user1, &user2, &approval_amount);
    assert_eq!(client.balance(&user2), transfer_amount + approval_amount);
    assert_eq!(client.allowance(&user1, &user2), 0i128);

    // Test burn
    let burn_amount = 25i128;
    client.burn(&user2, &burn_amount);
    assert_eq!(client.balance(&user2), transfer_amount + approval_amount - burn_amount);
    assert_eq!(client.total_supply(), mint_amount - burn_amount);

    // Test admin functions
    client.pause(&true);
    assert!(client.is_paused());

    client.freeze(&user1, &Some(100i128));
    assert!(client.is_frozen(&user1));
    assert_eq!(client.get_frozen_amount(&user1), 100i128);

    client.unfreeze(&user1);
    assert!(!client.is_frozen(&user1));

    // Test authorization
    client.set_authorized(&user1, &false);
    assert!(!client.authorized(&user1));

    client.set_authorized(&user1, &true);
    assert!(client.authorized(&user1));
}