#![no_std]

pub mod soroswap_adapter;
pub mod blend_adapter;

use soroban_sdk::{contracttype, Address};

mod test;

#[derive(Clone, Debug, Eq, PartialEq)]
#[contracttype]
pub struct PoolInfo {
    pub pool_address: Address,
    pub token_a: Address,
    pub token_b: Address,
    pub fee_bps: u32,
    pub is_srwa_pool: bool,
    pub compliance_required: bool,
}

#[derive(Clone, Debug, Eq, PartialEq)]
#[contracttype]
pub struct ReserveInfo {
    pub reserve_address: Address,
    pub token: Address,
    pub oracle: Address,
    pub is_srwa_reserve: bool,
    pub compliance_required: bool,
    pub ltv_ratio: u32, // Loan-to-value ratio in basis points
    pub liquidation_threshold: u32,
}