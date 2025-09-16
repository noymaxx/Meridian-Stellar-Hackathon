use soroban_sdk::{
    contract, contractimpl, symbol_short, Address, Env, Symbol, Vec
};
use crate::ReserveInfo;

const ADMIN: Symbol = symbol_short!("ADMIN");
const AUTHORIZED_RESERVES: Symbol = symbol_short!("AUTH_RES");
const RESERVE_ORACLES: Symbol = symbol_short!("ORACLES");
const POOL_CONTRACTS: Symbol = symbol_short!("POOLS");

#[contract]
pub struct BlendAdapter;

#[contractimpl]
impl BlendAdapter {
    pub fn init_blend(env: Env, admin: Address) {
        if env.storage().instance().has(&ADMIN) {
            panic!("Already initialized");
        }
        env.storage().instance().set(&ADMIN, &admin);
    }

    /// Add SRWA token as a reserve in Blend
    pub fn add_srwa_reserve(
        env: Env,
        reserve_address: Address,
        srwa_token: Address,
        oracle: Address,
        ltv_ratio: u32,
        liquidation_threshold: u32,
        pool_contract: Address,
    ) {
        Self::require_admin(&env);

        let reserve_info = ReserveInfo {
            reserve_address: reserve_address.clone(),
            token: srwa_token.clone(),
            oracle: oracle.clone(),
            is_srwa_reserve: true,
            compliance_required: true,
            ltv_ratio,
            liquidation_threshold,
        };

        let key = (AUTHORIZED_RESERVES, srwa_token.clone());
        env.storage().persistent().set(&key, &reserve_info);

        let oracle_key = (RESERVE_ORACLES, srwa_token.clone());
        env.storage().persistent().set(&oracle_key, &oracle);

        let pool_key = (POOL_CONTRACTS, srwa_token.clone());
        env.storage().persistent().set(&pool_key, &pool_contract);

        // Authorize the pool contract to hold SRWA tokens
        Self::authorize_pool_in_token(&env, &srwa_token, &pool_contract);

        env.events().publish(
            (symbol_short!("RES_ADD"),),
            (reserve_address, srwa_token, oracle)
        );
    }

    /// Remove SRWA reserve from Blend
    pub fn remove_srwa_reserve(env: Env, srwa_token: Address) {
        Self::require_admin(&env);

        let key = (AUTHORIZED_RESERVES, srwa_token.clone());
        if let Some(reserve_info) = env.storage().persistent().get::<_, ReserveInfo>(&key) {
            // Remove authorization from pool contract
            let pool_key = (POOL_CONTRACTS, srwa_token.clone());
            if let Some(pool_contract) = env.storage().persistent().get::<_, Address>(&pool_key) {
                Self::deauthorize_pool_in_token(&env, &srwa_token, &pool_contract);
                env.storage().persistent().remove(&pool_key);
            }

            env.storage().persistent().remove(&key);

            let oracle_key = (RESERVE_ORACLES, srwa_token.clone());
            env.storage().persistent().remove(&oracle_key);
        }

        env.events().publish(
            (symbol_short!("RES_REM"),),
            srwa_token
        );
    }

    /// Check if a user can supply SRWA tokens as collateral
    pub fn can_supply_collateral(
        env: Env,
        user: Address,
        srwa_token: Address,
        amount: i128,
    ) -> bool {
        let key = (AUTHORIZED_RESERVES, srwa_token.clone());
        if let Some(reserve_info) = env.storage().persistent().get::<_, ReserveInfo>(&key) {
            if !reserve_info.compliance_required {
                return true;
            }

            // Check compliance for the user
            Self::check_user_compliance(&env, &user, &srwa_token, amount)
        } else {
            false // Reserve not authorized
        }
    }

    /// Check if a user can borrow against SRWA collateral
    pub fn can_borrow_against_srwa(
        env: Env,
        user: Address,
        srwa_token: Address,
        collateral_amount: i128,
        borrow_amount: i128,
    ) -> bool {
        let key = (AUTHORIZED_RESERVES, srwa_token.clone());
        if let Some(reserve_info) = env.storage().persistent().get::<_, ReserveInfo>(&key) {
            // Check LTV ratio
            let oracle_price = Self::get_oracle_price(&env, &reserve_info.oracle);
            let collateral_value = (collateral_amount * oracle_price) / 1_000_000; // Assuming 6 decimal oracle
            let max_borrow = (collateral_value * reserve_info.ltv_ratio as i128) / 10_000;

            if borrow_amount > max_borrow {
                return false;
            }

            // Check compliance
            Self::check_user_compliance(&env, &user, &srwa_token, collateral_amount)
        } else {
            false
        }
    }

    /// Pre-supply compliance check
    pub fn pre_supply_check(
        env: Env,
        user: Address,
        srwa_token: Address,
        amount: i128,
    ) -> bool {
        Self::can_supply_collateral(env, user, srwa_token, amount)
    }

    /// Pre-borrow compliance check
    pub fn pre_borrow_check(
        env: Env,
        user: Address,
        srwa_token: Address,
        collateral_amount: i128,
        borrow_amount: i128,
    ) -> bool {
        Self::can_borrow_against_srwa(env, user, srwa_token, collateral_amount, borrow_amount)
    }

    /// Get current LTV ratio for a position
    pub fn get_position_ltv(
        env: Env,
        srwa_token: Address,
        collateral_amount: i128,
        debt_amount: i128,
    ) -> u32 {
        let key = (AUTHORIZED_RESERVES, srwa_token.clone());
        if let Some(reserve_info) = env.storage().persistent().get::<_, ReserveInfo>(&key) {
            let oracle_price = Self::get_oracle_price(&env, &reserve_info.oracle);
            let collateral_value = (collateral_amount * oracle_price) / 1_000_000;

            if collateral_value == 0 {
                return 0;
            }

            ((debt_amount * 10_000) / collateral_value) as u32
        } else {
            0
        }
    }

    /// Check if position needs liquidation
    pub fn needs_liquidation(
        env: Env,
        srwa_token: Address,
        collateral_amount: i128,
        debt_amount: i128,
    ) -> bool {
        let key = (AUTHORIZED_RESERVES, srwa_token.clone());
        if let Some(reserve_info) = env.storage().persistent().get::<_, ReserveInfo>(&key) {
            let current_ltv = Self::get_position_ltv(env, srwa_token, collateral_amount, debt_amount);
            current_ltv > reserve_info.liquidation_threshold
        } else {
            false
        }
    }

    /// Update oracle for a reserve
    pub fn update_oracle(env: Env, srwa_token: Address, new_oracle: Address) {
        Self::require_admin(&env);

        let key = (AUTHORIZED_RESERVES, srwa_token.clone());
        if let Some(mut reserve_info) = env.storage().persistent().get::<_, ReserveInfo>(&key) {
            reserve_info.oracle = new_oracle.clone();
            env.storage().persistent().set(&key, &reserve_info);

            let oracle_key = (RESERVE_ORACLES, srwa_token.clone());
            env.storage().persistent().set(&oracle_key, &new_oracle);
        }

        env.events().publish(
            (symbol_short!("ORACLE_UP"),),
            (srwa_token, new_oracle)
        );
    }

    /// Update LTV parameters
    pub fn update_ltv_params(
        env: Env,
        srwa_token: Address,
        ltv_ratio: u32,
        liquidation_threshold: u32,
    ) {
        Self::require_admin(&env);

        let key = (AUTHORIZED_RESERVES, srwa_token.clone());
        if let Some(mut reserve_info) = env.storage().persistent().get::<_, ReserveInfo>(&key) {
            reserve_info.ltv_ratio = ltv_ratio;
            reserve_info.liquidation_threshold = liquidation_threshold;
            env.storage().persistent().set(&key, &reserve_info);
        }

        env.events().publish(
            (symbol_short!("LTV_UPD"),),
            (srwa_token, ltv_ratio, liquidation_threshold)
        );
    }

    /// Get reserve information
    pub fn get_reserve_info(env: Env, srwa_token: Address) -> Option<ReserveInfo> {
        let key = (AUTHORIZED_RESERVES, srwa_token);
        env.storage().persistent().get(&key)
    }

    /// Get all authorized reserves
    pub fn get_authorized_reserves(env: Env) -> Vec<ReserveInfo> {
        // Note: In a real implementation, you'd need an index to efficiently query all reserves
        // For now, return empty vector
        Vec::new(&env)
    }

    // Helper functions

    fn get_oracle_price(env: &Env, oracle: &Address) -> i128 {
        // This would call the oracle contract to get the current price
        // For now, return a mock price
        1_000_000 // $1.00 with 6 decimals
    }

    fn check_user_compliance(
        env: &Env,
        user: &Address,
        srwa_token: &Address,
        amount: i128,
    ) -> bool {
        // This would check if the user can transfer the SRWA tokens to the pool
        // by calling the compliance contract
        // For now, simplified implementation
        true
    }

    fn authorize_pool_in_token(env: &Env, token: &Address, pool: &Address) {
        // This would call the SRWA token's set_authorized function
        // For now, simplified implementation
    }

    fn deauthorize_pool_in_token(env: &Env, token: &Address, pool: &Address) {
        // This would call the SRWA token's set_authorized function with false
        // For now, simplified implementation
    }

    fn require_admin(env: &Env) {
        let admin: Address = env.storage().instance().get(&ADMIN).unwrap();
        admin.require_auth();
    }
}