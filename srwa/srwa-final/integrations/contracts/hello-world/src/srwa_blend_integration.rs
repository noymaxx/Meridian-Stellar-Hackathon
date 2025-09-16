use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, vec,
    Address, Env, Symbol, Vec, Map, String, BytesN, IntoVal
};

use crate::ReserveInfo;

// Storage keys
const ADMIN_KEY: Symbol = symbol_short!("ADMIN");
const SRWA_POOLS_KEY: Symbol = symbol_short!("SRWA_POOL");
const BLEND_RESERVES_KEY: Symbol = symbol_short!("BLEND_RES");
const COMPLIANCE_CORE_KEY: Symbol = symbol_short!("COMP_CORE");
const IDENTITY_REG_KEY: Symbol = symbol_short!("ID_REG");

// Events
const SRWA_POOL_CREATED: Symbol = symbol_short!("srwa_pool");
const BLEND_RESERVE_ADDED: Symbol = symbol_short!("blend_res");
const COMPLIANCE_CHECK: Symbol = symbol_short!("comp_chk");
const LIQUIDATION_EVENT: Symbol = symbol_short!("liquidate");

// Official Blend Protocol Addresses on Testnet
const POOL_FACTORY_V2: &str = "CDSMKKCWEAYQW4DAUSH3XGRMIVIJB44TZ3UA5YCRHT6MP4LWEWR4GYV6";
const BACKSTOP_V2: &str = "CBHWKF4RHIKOKSURAKXSJRIIA7RJAMJH4VHRVPYGUF4AJ5L544LYZ35X";
const ORACLE_MOCK: &str = "CBKKSSMTHJJTQWSIOBJQAIGR42NSY43ZBKKXWF445PE4OLOTOGPOWWF4";

// Official Token Addresses
const USDC_TOKEN: &str = "CAQCFVLOBK5GIULPNZRGATJJMIZL5BSP7X5YJVMGCPTUEPFM4AVSRCJU";
const XLM_TOKEN: &str = "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC";
const BLND_TOKEN: &str = "CB22KRA3YZVCNCQI64JQ5WE7UY2VAV7WFLK6A2JN3HEX56T2EDAFO7QF";

// Request types for Blend Protocol operations
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum RequestType {
    SupplyCollateral = 0,
    WithdrawCollateral = 1,
    SupplyLiability = 2,
    WithdrawLiability = 3,
    Borrow = 4,
    Repay = 5,
    FillUserLiquidationAuction = 6,
    FillBadDebtAuction = 7,
    FillInterestAuction = 8,
    DeleteLiquidationAuction = 9,
}

// Request structure for Blend operations
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Request {
    pub request_type: RequestType,
    pub address: Address,
    pub amount: i128,
}

// Enhanced pool configuration for SRWA-Blend integration
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct SRWAPoolInfo {
    pub pool_address: Address,
    pub srwa_token: Address,
    pub name: String,
    pub oracle: Address,
    pub backstop_take_rate: u32,
    pub max_positions: u32,
    pub ltv_ratio: u32,
    pub liquidation_threshold: u32,
    pub compliance_required: bool,
    pub is_active: bool,
}

// User position data with compliance info
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct UserPositionData {
    pub supplied: Map<Address, i128>,
    pub borrowed: Map<Address, i128>,
    pub compliance_status: bool,
    pub ltv_ratio: u32,
}

// Compliance check result
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ComplianceResult {
    pub is_compliant: bool,
    pub reason: String,
    pub required_claims: Vec<u32>,
}

#[contract]
pub struct SRWABlendIntegration;

#[contractimpl]
impl SRWABlendIntegration {
    /// Initialize the SRWA-Blend integration
    pub fn initialize(
        env: Env,
        admin: Address,
        compliance_core: Address,
        identity_registry: Address,
    ) {
        if env.storage().instance().has(&ADMIN_KEY) {
            panic!("Already initialized");
        }

        admin.require_auth();

        // Store configuration
        env.storage().instance().set(&ADMIN_KEY, &admin);
        env.storage().instance().set(&COMPLIANCE_CORE_KEY, &compliance_core);
        env.storage().instance().set(&IDENTITY_REG_KEY, &identity_registry);
        
        // Initialize empty maps
        let srwa_pools: Map<Address, SRWAPoolInfo> = Map::new(&env);
        let blend_reserves: Map<Address, ReserveInfo> = Map::new(&env);
        
        env.storage().instance().set(&SRWA_POOLS_KEY, &srwa_pools);
        env.storage().instance().set(&BLEND_RESERVES_KEY, &blend_reserves);
    }

    /// Deploy a new SRWA lending pool using Blend V2
    pub fn deploy_srwa_pool(
        env: Env,
        admin: Address,
        srwa_token: Address,
        name: String,
        salt: BytesN<32>,
        oracle: Address,
        backstop_take_rate: u32,
        max_positions: u32,
        ltv_ratio: u32,
        liquidation_threshold: u32,
    ) -> Address {
        let stored_admin: Address = env.storage().instance()
            .get(&ADMIN_KEY)
            .expect("Not initialized");
        
        if admin != stored_admin {
            panic!("Unauthorized");
        }
        
        admin.require_auth();

        // Validate parameters
        if backstop_take_rate > 10000 {
            panic!("Invalid backstop take rate");
        }
        if max_positions == 0 || max_positions > 12 {
            panic!("Invalid max positions");
        }
        if ltv_ratio > liquidation_threshold {
            panic!("LTV ratio cannot exceed liquidation threshold");
        }

        // For now, create a mock pool address instead of calling Blend directly
        // This allows us to test the integration without depending on Blend's exact API
        let pool_address = Address::from_string(&String::from_str(&env, "C1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCD"));
        
        // TODO: Implement proper Blend V2 pool deployment when API is stable

        // Create SRWA pool info
        let srwa_pool_info = SRWAPoolInfo {
            pool_address: pool_address.clone(),
            srwa_token: srwa_token.clone(),
            name: name.clone(),
            oracle: oracle.clone(),
            backstop_take_rate,
            max_positions,
            ltv_ratio,
            liquidation_threshold,
            compliance_required: true,
            is_active: true,
        };

        // Store SRWA pool info
        let mut srwa_pools: Map<Address, SRWAPoolInfo> = env.storage().instance()
            .get(&SRWA_POOLS_KEY)
            .unwrap_or(Map::new(&env));
        
        srwa_pools.set(pool_address.clone(), srwa_pool_info);
        env.storage().instance().set(&SRWA_POOLS_KEY, &srwa_pools);

        // Create Blend reserve info
        let reserve_info = ReserveInfo {
            reserve_address: pool_address.clone(),
            token: srwa_token.clone(),
            oracle: oracle.clone(),
            is_srwa_reserve: true,
            compliance_required: true,
            ltv_ratio,
            liquidation_threshold,
        };

        // Store Blend reserve info
        let mut blend_reserves: Map<Address, ReserveInfo> = env.storage().instance()
            .get(&BLEND_RESERVES_KEY)
            .unwrap_or(Map::new(&env));
        
        blend_reserves.set(srwa_token.clone(), reserve_info);
        env.storage().instance().set(&BLEND_RESERVES_KEY, &blend_reserves);

        // Emit events
        env.events().publish(
            (SRWA_POOL_CREATED,),
            (pool_address.clone(), srwa_token.clone(), name)
        );

        env.events().publish(
            (BLEND_RESERVE_ADDED,),
            (pool_address.clone(), srwa_token, oracle)
        );

        pool_address
    }

    /// Check compliance for SRWA token operations
    pub fn check_compliance(
        env: Env,
        user: Address,
        srwa_token: Address,
        _operation: String,
        amount: i128,
    ) -> ComplianceResult {
        let compliance_core: Address = env.storage().instance()
            .get(&COMPLIANCE_CORE_KEY)
            .expect("Not initialized");

        let identity_registry: Address = env.storage().instance()
            .get(&IDENTITY_REG_KEY)
            .expect("Not initialized");

        // Check if token is bound to compliance core
        let is_bound: bool = env.invoke_contract(
            &compliance_core,
            &Symbol::new(&env, "is_token_bound"),
            vec![&env, srwa_token.into_val(&env)],
        );

        if !is_bound {
            return ComplianceResult {
                is_compliant: false,
                reason: String::from_str(&env, "Token not bound to compliance core"),
                required_claims: Vec::new(&env),
            };
        }

        // Check user identity claims - simplified for now
        let has_identity: bool = true; // TODO: Implement proper identity check

        if !has_identity {
            return ComplianceResult {
                is_compliant: false,
                reason: String::from_str(&env, "User identity not verified"),
                required_claims: vec![&env, 1], // RWA Verification claim
            };
        }

        // Check if user can perform the operation
        let can_operate: bool = env.invoke_contract(
            &compliance_core,
            &Symbol::new(&env, "check_transfer"),
            vec![
                &env,
                srwa_token.into_val(&env),
                user.into_val(&env),
                user.into_val(&env),
                amount.into_val(&env),
            ],
        );

        ComplianceResult {
            is_compliant: can_operate,
            reason: if can_operate {
                String::from_str(&env, "Compliance check passed")
            } else {
                String::from_str(&env, "Transfer not allowed by compliance rules")
            },
            required_claims: if can_operate { Vec::new(&env) } else { vec![&env, 1] },
        }
    }

    /// Supply SRWA tokens as collateral with compliance check
    pub fn supply_srwa_collateral(
        env: Env,
        from: Address,
        pool_address: Address,
        srwa_token: Address,
        amount: i128,
    ) {
        from.require_auth();

        // Check compliance first
        let compliance_result = Self::check_compliance(
            env.clone(),
            from.clone(),
            srwa_token.clone(),
            String::from_str(&env, "supply_collateral"),
            amount,
        );

        if !compliance_result.is_compliant {
            panic!("Compliance check failed");
        }

        // Get pool info
        let srwa_pools: Map<Address, SRWAPoolInfo> = env.storage().instance()
            .get(&SRWA_POOLS_KEY)
            .expect("Not initialized");
        
        let pool_info = srwa_pools.get(pool_address.clone())
            .expect("Pool not found");

        if !pool_info.is_active {
            panic!("Pool is not active");
        }

        // Create supply request
        let request = Request {
            request_type: RequestType::SupplyCollateral,
            address: srwa_token.clone(),
            amount,
        };
        let requests = vec![&env, request];

        // Submit to Blend pool
        let _: () = env.invoke_contract(
            &pool_address,
            &Symbol::new(&env, "submit"),
            vec![
                &env,
                from.clone().into_val(&env),
                from.clone().into_val(&env),
                from.into_val(&env),
                requests.into_val(&env),
            ],
        );

        // Emit compliance event
        env.events().publish(
            (COMPLIANCE_CHECK,),
            (from, pool_address, srwa_token, amount, true)
        );
    }

    /// Borrow against SRWA collateral with compliance check
    pub fn borrow_against_srwa(
        env: Env,
        from: Address,
        pool_address: Address,
        borrow_token: Address,
        amount: i128,
    ) {
        from.require_auth();

        // Get pool info
        let srwa_pools: Map<Address, SRWAPoolInfo> = env.storage().instance()
            .get(&SRWA_POOLS_KEY)
            .expect("Not initialized");
        
        let pool_info = srwa_pools.get(pool_address.clone())
            .expect("Pool not found");

        if !pool_info.is_active {
            panic!("Pool is not active");
        }

        // Check LTV ratio
        let current_ltv = Self::get_user_position_ltv(
            env.clone(),
            pool_address.clone(),
            from.clone(),
        );

        if current_ltv > pool_info.ltv_ratio {
            panic!("Borrow would exceed LTV limit");
        }

        // Create borrow request
        let request = Request {
            request_type: RequestType::Borrow,
            address: borrow_token,
            amount,
        };
        let requests = vec![&env, request];

        // Submit to Blend pool
        let _: () = env.invoke_contract(
            &pool_address,
            &Symbol::new(&env, "submit"),
            vec![
                &env,
                from.clone().into_val(&env),
                from.clone().into_val(&env),
                from.into_val(&env),
                requests.into_val(&env),
            ],
        );
    }

    /// Get user positions with compliance status
    pub fn get_user_positions(
        env: Env,
        pool_address: Address,
        user: Address,
    ) -> UserPositionData {
        // Get positions from Blend pool
        let positions: UserPositionData = env.invoke_contract(
            &pool_address,
            &Symbol::new(&env, "get_positions"),
            vec![&env, user.into_val(&env)],
        );

        // Check compliance status
        let srwa_pools: Map<Address, SRWAPoolInfo> = env.storage().instance()
            .get(&SRWA_POOLS_KEY)
            .expect("Not initialized");
        
        let pool_info = srwa_pools.get(pool_address.clone())
            .expect("Pool not found");

        let compliance_result = Self::check_compliance(
            env.clone(),
            user.clone(),
            pool_info.srwa_token,
            String::from_str(&env, "check_positions"),
            0,
        );

        // Calculate current LTV
        let ltv = Self::get_user_position_ltv(env, pool_address, user);

        UserPositionData {
            supplied: positions.supplied,
            borrowed: positions.borrowed,
            compliance_status: compliance_result.is_compliant,
            ltv_ratio: ltv,
        }
    }

    /// Get current LTV ratio for a position
    pub fn get_user_position_ltv(
        env: Env,
        pool_address: Address,
        user: Address,
    ) -> u32 {
        let srwa_pools: Map<Address, SRWAPoolInfo> = env.storage().instance()
            .get(&SRWA_POOLS_KEY)
            .expect("Not initialized");
        
        let pool_info = srwa_pools.get(pool_address.clone())
            .expect("Pool not found");

        // Get positions from Blend pool
        let positions: UserPositionData = env.invoke_contract(
            &pool_address,
            &Symbol::new(&env, "get_positions"),
            vec![&env, user.into_val(&env)],
        );

        // Calculate LTV based on SRWA token collateral
        let srwa_supplied = positions.supplied.get(pool_info.srwa_token.clone())
            .unwrap_or(0);
        
        let total_borrowed = positions.borrowed.iter()
            .map(|(_, amount)| amount)
            .sum::<i128>();

        if srwa_supplied == 0 {
            return 0;
        }

        // Mock oracle price (in real implementation, call oracle)
        let oracle_price = 1_000_000; // $1.00 with 6 decimals
        let collateral_value = (srwa_supplied * oracle_price) / 1_000_000;

        if collateral_value == 0 {
            return 0;
        }

        ((total_borrowed * 10_000) / collateral_value) as u32
    }

    /// Check if position needs liquidation
    pub fn check_liquidation_needed(
        env: Env,
        pool_address: Address,
        user: Address,
    ) -> bool {
        let srwa_pools: Map<Address, SRWAPoolInfo> = env.storage().instance()
            .get(&SRWA_POOLS_KEY)
            .expect("Not initialized");
        
        let pool_info = srwa_pools.get(pool_address.clone())
            .expect("Pool not found");

        let current_ltv = Self::get_user_position_ltv(env, pool_address, user);
        current_ltv > pool_info.liquidation_threshold
    }

    /// Liquidate a position
    pub fn liquidate_position(
        env: Env,
        liquidator: Address,
        pool_address: Address,
        user: Address,
        srwa_token: Address,
        amount: i128,
    ) {
        liquidator.require_auth();

        // Check if liquidation is needed
        if !Self::check_liquidation_needed(env.clone(), pool_address.clone(), user.clone()) {
            panic!("Position does not need liquidation");
        }

        // Create liquidation request
        let request = Request {
            request_type: RequestType::FillUserLiquidationAuction,
            address: srwa_token,
            amount,
        };
        let requests = vec![&env, request];

        // Submit to Blend pool
        let _: () = env.invoke_contract(
            &pool_address,
            &Symbol::new(&env, "submit"),
            vec![
                &env,
                liquidator.clone().into_val(&env),
                liquidator.clone().into_val(&env),
                user.into_val(&env),
                requests.into_val(&env),
            ],
        );

        // Emit liquidation event
        env.events().publish(
            (LIQUIDATION_EVENT,),
            (liquidator, pool_address, user, amount)
        );
    }

    /// Get SRWA pool information
    pub fn get_srwa_pool_info(
        env: Env,
        pool_address: Address,
    ) -> SRWAPoolInfo {
        let srwa_pools: Map<Address, SRWAPoolInfo> = env.storage().instance()
            .get(&SRWA_POOLS_KEY)
            .expect("Not initialized");
        
        srwa_pools.get(pool_address)
            .expect("Pool not found")
    }

    /// Get all SRWA pools
    pub fn get_all_srwa_pools(env: Env) -> Vec<Address> {
        let srwa_pools: Map<Address, SRWAPoolInfo> = env.storage().instance()
            .get(&SRWA_POOLS_KEY)
            .expect("Not initialized");
        
        let mut pool_addresses = Vec::new(&env);
        for (address, _) in srwa_pools.iter() {
            pool_addresses.push_back(address);
        }
        
        pool_addresses
    }

    /// Update pool parameters (admin only)
    pub fn update_pool_params(
        env: Env,
        admin: Address,
        pool_address: Address,
        ltv_ratio: u32,
        liquidation_threshold: u32,
    ) {
        let stored_admin: Address = env.storage().instance()
            .get(&ADMIN_KEY)
            .expect("Not initialized");
        
        if admin != stored_admin {
            panic!("Unauthorized");
        }
        
        admin.require_auth();

        let mut srwa_pools: Map<Address, SRWAPoolInfo> = env.storage().instance()
            .get(&SRWA_POOLS_KEY)
            .expect("Not initialized");
        
        if let Some(mut pool_info) = srwa_pools.get(pool_address.clone()) {
            pool_info.ltv_ratio = ltv_ratio;
            pool_info.liquidation_threshold = liquidation_threshold;
            srwa_pools.set(pool_address, pool_info);
            env.storage().instance().set(&SRWA_POOLS_KEY, &srwa_pools);
        }
    }

    /// Get official contract addresses
    pub fn get_pool_factory(env: Env) -> Address {
        Address::from_string(&String::from_str(&env, POOL_FACTORY_V2))
    }

    pub fn get_backstop(env: Env) -> Address {
        Address::from_string(&String::from_str(&env, BACKSTOP_V2))
    }

    pub fn get_oracle(env: Env) -> Address {
        Address::from_string(&String::from_str(&env, ORACLE_MOCK))
    }

    pub fn get_usdc_token(env: Env) -> Address {
        Address::from_string(&String::from_str(&env, USDC_TOKEN))
    }

    pub fn get_xlm_token(env: Env) -> Address {
        Address::from_string(&String::from_str(&env, XLM_TOKEN))
    }

    pub fn get_blnd_token(env: Env) -> Address {
        Address::from_string(&String::from_str(&env, BLND_TOKEN))
    }

    /// Get admin address
    pub fn get_admin(env: Env) -> Address {
        env.storage().instance()
            .get(&ADMIN_KEY)
            .expect("Not initialized")
    }

    /// Check if a pool exists
    pub fn pool_exists(env: Env, pool_address: Address) -> bool {
        let srwa_pools: Map<Address, SRWAPoolInfo> = env.storage().instance()
            .get(&SRWA_POOLS_KEY)
            .unwrap_or(Map::new(&env));
        
        srwa_pools.contains_key(pool_address)
    }

    /// Register an existing Blend pool for SRWA integration
    pub fn register_blend_pool(
        env: Env,
        admin: Address,
        pool_address: Address,
        srwa_token: Address,
        name: String,
        oracle: Address,
        backstop_take_rate: u32,
        max_positions: u32,
        ltv_ratio: u32,
        liquidation_threshold: u32,
    ) {
        let stored_admin: Address = env.storage().instance()
            .get(&ADMIN_KEY)
            .expect("Not initialized");
        
        if admin != stored_admin {
            panic!("Unauthorized");
        }
        
        admin.require_auth();

        // Validate parameters
        if backstop_take_rate > 10000 {
            panic!("Invalid backstop take rate");
        }
        if max_positions == 0 || max_positions > 12 {
            panic!("Invalid max positions");
        }
        if ltv_ratio > liquidation_threshold {
            panic!("LTV ratio cannot exceed liquidation threshold");
        }

        // Create SRWA pool info
        let srwa_pool_info = SRWAPoolInfo {
            pool_address: pool_address.clone(),
            srwa_token: srwa_token.clone(),
            name: name.clone(),
            oracle: oracle.clone(),
            backstop_take_rate,
            max_positions,
            ltv_ratio,
            liquidation_threshold,
            compliance_required: true,
            is_active: true,
        };

        // Store SRWA pool info
        let mut srwa_pools: Map<Address, SRWAPoolInfo> = env.storage().instance()
            .get(&SRWA_POOLS_KEY)
            .unwrap_or(Map::new(&env));
        
        srwa_pools.set(pool_address.clone(), srwa_pool_info);
        env.storage().instance().set(&SRWA_POOLS_KEY, &srwa_pools);

        // Create Blend reserve info
        let reserve_info = ReserveInfo {
            reserve_address: pool_address.clone(),
            token: srwa_token.clone(),
            oracle: oracle.clone(),
            is_srwa_reserve: true,
            compliance_required: true,
            ltv_ratio,
            liquidation_threshold,
        };

        // Store Blend reserve info
        let mut blend_reserves: Map<Address, ReserveInfo> = env.storage().instance()
            .get(&BLEND_RESERVES_KEY)
            .unwrap_or(Map::new(&env));
        
        blend_reserves.set(srwa_token.clone(), reserve_info);
        env.storage().instance().set(&BLEND_RESERVES_KEY, &blend_reserves);

        // Emit events
        env.events().publish(
            (SRWA_POOL_CREATED,),
            (pool_address.clone(), srwa_token.clone(), name)
        );

        env.events().publish(
            (BLEND_RESERVE_ADDED,),
            (pool_address, srwa_token, oracle)
        );
    }
}
