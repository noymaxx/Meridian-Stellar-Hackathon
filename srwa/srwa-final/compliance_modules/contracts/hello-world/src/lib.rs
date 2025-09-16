#![no_std]

pub mod jurisdiction_module;
pub mod pause_freeze_module;
pub mod max_holders_module;
pub mod lockup_module;

use soroban_sdk::{contracttype, Address};

#[derive(Clone, Debug, Eq, PartialEq)]
#[contracttype]
pub struct TransferContext {
    pub from: Address,
    pub to: Address,
    pub amount: i128,
    pub token: Address,
}

pub trait ComplianceModule {
    fn configure(env: soroban_sdk::Env, params: soroban_sdk::Bytes);
    fn enable(env: soroban_sdk::Env, token: Address);
    fn disable(env: soroban_sdk::Env, token: Address);
    fn check(env: soroban_sdk::Env, context: &TransferContext) -> bool;
    fn transferred(env: soroban_sdk::Env, context: &TransferContext);
    fn created(env: soroban_sdk::Env, to: Address, amount: i128, token: Address);
    fn destroyed(env: soroban_sdk::Env, from: Address, amount: i128, token: Address);
}