#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env, String};

#[test]
fn test_integration_setup() {
    // Basic test to ensure modules compile
    let env = Env::default();

    let pool_info = PoolInfo {
        pool_address: Address::generate(&env),
        token_a: Address::generate(&env),
        token_b: Address::generate(&env),
        fee_bps: 30,
        is_srwa_pool: true,
        compliance_required: true,
    };

    let reserve_info = ReserveInfo {
        reserve_address: Address::generate(&env),
        token: Address::generate(&env),
        oracle: Address::generate(&env),
        is_srwa_reserve: true,
        compliance_required: true,
        ltv_ratio: 7500, // 75%
        liquidation_threshold: 8500, // 85%
    };

    // Basic checks
    assert_eq!(pool_info.fee_bps, 30);
    assert_eq!(reserve_info.ltv_ratio, 7500);
}