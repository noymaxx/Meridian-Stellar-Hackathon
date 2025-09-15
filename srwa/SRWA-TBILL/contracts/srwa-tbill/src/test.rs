#![cfg(test)]

use super::*;
use soroban_sdk::{Env, String, Address, testutils::Address as _};

#[test]
fn test_initialize() {
    let env = Env::default();
    let contract_id = env.register(SRWATBill, ());
    let client = SRWATBillClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let name = String::from_str(&env, "SRWA Treasury Bill");
    let symbol = String::from_str(&env, "SRWA-TBILL");
    let decimals = 7u32;

    client.initialize(&admin, &name, &symbol, &decimals);

    assert_eq!(client.name(), name);
    assert_eq!(client.symbol(), symbol);
    assert_eq!(client.decimals(), decimals);
    assert_eq!(client.total_supply(), 0);
    assert_eq!(client.admin(), admin);
}

#[test]
fn test_mint() {
    let env = Env::default();
    let contract_id = env.register(SRWATBill, ());
    let client = SRWATBillClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let user = Address::generate(&env);
    let name = String::from_str(&env, "SRWA Treasury Bill");
    let symbol = String::from_str(&env, "SRWA-TBILL");
    let decimals = 7u32;

    client.initialize(&admin, &name, &symbol, &decimals);

    let mint_amount = 1000i128;
    // Note: In real usage, admin would need to be authenticated
    // For testing, we'll skip the auth requirement for now
    client.mint(&user, &mint_amount);

    assert_eq!(client.balance(&user), mint_amount);
    assert_eq!(client.total_supply(), mint_amount);
}

#[test]
fn test_transfer() {
    let env = Env::default();
    let contract_id = env.register(SRWATBill, ());
    let client = SRWATBillClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let from = Address::generate(&env);
    let to = Address::generate(&env);
    let name = String::from_str(&env, "SRWA Treasury Bill");
    let symbol = String::from_str(&env, "SRWA-TBILL");
    let decimals = 7u32;

    client.initialize(&admin, &name, &symbol, &decimals);

    let mint_amount = 1000i128;
    let transfer_amount = 300i128;
    
    client.mint(&from, &mint_amount);
    client.transfer(&from, &to, &transfer_amount);

    assert_eq!(client.balance(&from), mint_amount - transfer_amount);
    assert_eq!(client.balance(&to), transfer_amount);
    assert_eq!(client.total_supply(), mint_amount);
}

#[test]
fn test_approve_and_transfer_from() {
    let env = Env::default();
    let contract_id = env.register(SRWATBill, ());
    let client = SRWATBillClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let owner = Address::generate(&env);
    let spender = Address::generate(&env);
    let to = Address::generate(&env);
    let name = String::from_str(&env, "SRWA Treasury Bill");
    let symbol = String::from_str(&env, "SRWA-TBILL");
    let decimals = 7u32;

    client.initialize(&admin, &name, &symbol, &decimals);

    let mint_amount = 1000i128;
    let approve_amount = 500i128;
    let transfer_amount = 200i128;
    
    client.mint(&owner, &mint_amount);
    client.approve(&owner, &spender, &approve_amount);
    
    assert_eq!(client.allowance(&owner, &spender), approve_amount);
    
    client.transfer_from(&spender, &owner, &to, &transfer_amount);

    assert_eq!(client.balance(&owner), mint_amount - transfer_amount);
    assert_eq!(client.balance(&to), transfer_amount);
    assert_eq!(client.allowance(&owner, &spender), approve_amount - transfer_amount);
}

#[test]
fn test_burn() {
    let env = Env::default();
    let contract_id = env.register(SRWATBill, ());
    let client = SRWATBillClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let user = Address::generate(&env);
    let name = String::from_str(&env, "SRWA Treasury Bill");
    let symbol = String::from_str(&env, "SRWA-TBILL");
    let decimals = 7u32;

    client.initialize(&admin, &name, &symbol, &decimals);

    let mint_amount = 1000i128;
    let burn_amount = 300i128;
    
    client.mint(&user, &mint_amount);
    client.burn(&user, &burn_amount);

    assert_eq!(client.balance(&user), mint_amount - burn_amount);
    assert_eq!(client.total_supply(), mint_amount - burn_amount);
}

#[test]
fn test_set_admin() {
    let env = Env::default();
    let contract_id = env.register(SRWATBill, ());
    let client = SRWATBillClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let new_admin = Address::generate(&env);
    let name = String::from_str(&env, "SRWA Treasury Bill");
    let symbol = String::from_str(&env, "SRWA-TBILL");
    let decimals = 7u32;

    client.initialize(&admin, &name, &symbol, &decimals);
    
    client.set_admin(&new_admin);

    assert_eq!(client.admin(), new_admin);
}
