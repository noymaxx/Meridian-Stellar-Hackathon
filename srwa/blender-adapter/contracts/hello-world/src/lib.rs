#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, vec,
    Address, Env, Symbol, Vec, Map, String, BytesN, IntoVal
};

// Storage keys
const ADMIN_KEY: Symbol = symbol_short!("ADMIN");
const POOLS_KEY: Symbol = symbol_short!("POOLS");

// Events
const POOL_CREATED_EVENT: Symbol = symbol_short!("pool_crt");
const SUPPLY_EVENT: Symbol = symbol_short!("supply");
const BORROW_EVENT: Symbol = symbol_short!("borrow");
const REPAY_EVENT: Symbol = symbol_short!("repay");
const WITHDRAW_EVENT: Symbol = symbol_short!("withdraw");

// Official Blend Protocol Addresses on Testnet
const POOL_FACTORY_V2: &str = "CDSMKKCWEAYQW4DAUSH3XGRMIVIJB44TZ3UA5YCRHT6MP4LWEWR4GYV6";
const BACKSTOP_V2: &str = "CBHWKF4RHIKOKSURAKXSJRIIA7RJAMJH4VHRVPYGUF4AJ5L544LYZ35X";
const ORACLE_MOCK: &str = "CBKKSSMTHJJTQWSIOBJQAIGR42NSY43ZBKKXWF445PE4OLOTOGPOWWF4";
const EMITTER: &str = "CCS5ACKIDOIVW2QMWBF7H3ZM4ZIH2Q2NP7I3P3GH7YXXGN7I3WND3D6G";

// Official Token Addresses
const USDC_TOKEN: &str = "CAQCFVLOBK5GIULPNZRGATJJMIZL5BSP7X5YJVMGCPTUEPFM4AVSRCJU";
const XLM_TOKEN: &str = "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC";
const BLND_TOKEN: &str = "CB22KRA3YZVCNCQI64JQ5WE7UY2VAV7WFLK6A2JN3HEX56T2EDAFO7QF";
const WETH_TOKEN: &str = "CAZAQB3D7KSLSNOSQKYD2V4JP5V2Y3B4RDJZRLBFCCIXDCTE3WHSY3UE";
const WBTC_TOKEN: &str = "CAP5AMC2OHNVREO66DFIN6DHJMPOBAJ2KCDDIMFBR7WWJH5RZBFM3UEI";

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

// Pool configuration for Blend V2
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PoolInfo {
    pub pool_address: Address,
    pub name: String,
    pub oracle: Address,
    pub backstop_take_rate: u32,
    pub max_positions: u32,
}

// User position data
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct UserPositionData {
    pub supplied: Map<Address, i128>,
    pub borrowed: Map<Address, i128>,
}

// Pool reserve configuration for Blend V2
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ReserveConfig {
    pub index: u32,
    pub decimals: u32,
    pub c_factor: u32,
    pub l_factor: u32,
    pub util: u32,
    pub max_util: u32,
    pub r_one: u32,
    pub r_two: u32,
    pub r_three: u32,
    pub reactivity: u32,
}

#[contract]
pub struct BlendAdapterV2;

#[contractimpl]
impl BlendAdapterV2 {
    /// Initialize the Blend adapter with official Blend V2 contracts
    pub fn initialize(
        env: Env,
        admin: Address,
    ) {
        if env.storage().instance().has(&ADMIN_KEY) {
            panic!("Already initialized");
        }

        admin.require_auth();

        // Store configuration
        env.storage().instance().set(&ADMIN_KEY, &admin);
        
        // Initialize empty pools map
        let pools: Map<Address, PoolInfo> = Map::new(&env);
        env.storage().instance().set(&POOLS_KEY, &pools);
    }

    /// Deploy a new Blend lending pool using official pool factory
    pub fn deploy_pool(
        env: Env,
        admin: Address,
        name: String,
        salt: BytesN<32>,
        oracle: Address,
        backstop_take_rate: u32,
        max_positions: u32,
    ) -> Address {
        let stored_admin: Address = env.storage().instance()
            .get(&ADMIN_KEY)
            .expect("Not initialized");
        
        if admin != stored_admin {
            panic!("Unauthorized");
        }
        
        admin.require_auth();

        // Validate parameters according to Blend V2
        if backstop_take_rate > 10000 {
            panic!("Invalid backstop take rate");
        }
        if max_positions == 0 || max_positions > 12 {
            panic!("Invalid max positions");
        }

        // Use official Blend pool factory
        let pool_factory = Address::from_string(&String::from_str(&env, POOL_FACTORY_V2));

        // Deploy pool using Blend's pool factory V2
        let pool_address: Address = env.invoke_contract(
            &pool_factory,
            &Symbol::new(&env, "deploy"),
            vec![
                &env,
                admin.into_val(&env),
                name.clone().into_val(&env),
                salt.into_val(&env),
                oracle.clone().into_val(&env),
                backstop_take_rate.into_val(&env),
                max_positions.into_val(&env),
            ],
        );

        // Store pool info
        let pool_info = PoolInfo {
            pool_address: pool_address.clone(),
            name: name.clone(),
            oracle,
            backstop_take_rate,
            max_positions,
        };

        let mut pools: Map<Address, PoolInfo> = env.storage().instance()
            .get(&POOLS_KEY)
            .unwrap_or(Map::new(&env));
        
        pools.set(pool_address.clone(), pool_info);
        env.storage().instance().set(&POOLS_KEY, &pools);

        // Emit event
        env.events().publish(
            (POOL_CREATED_EVENT,),
            (pool_address.clone(), name)
        );

        pool_address
    }

    /// Submit requests to Blend pool with proper validation
    pub fn submit_requests(
        env: Env,
        from: Address,
        spender: Address,
        to: Address,
        pool_address: Address,
        requests: Vec<Request>,
    ) {
        from.require_auth();

        // Validate pool exists
        let pools: Map<Address, PoolInfo> = env.storage().instance()
            .get(&POOLS_KEY)
            .expect("Not initialized");
        
        if !pools.contains_key(pool_address.clone()) {
            panic!("Pool not found");
        }

        // Validate requests
        for request in requests.iter() {
            if request.amount <= 0 {
                panic!("Invalid amount");
            }
        }

        // Submit requests to Blend pool V2
        let _: () = env.invoke_contract(
            &pool_address,
            &Symbol::new(&env, "submit"),
            vec![
                &env,
                from.clone().into_val(&env),
                spender.into_val(&env),
                to.into_val(&env),
                requests.clone().into_val(&env),
            ],
        );

        // Emit appropriate events
        for request in requests.iter() {
            match request.request_type {
                RequestType::SupplyCollateral => {
                    env.events().publish(
                        (SUPPLY_EVENT,),
                        (from.clone(), pool_address.clone(), request.address.clone(), request.amount)
                    );
                },
                RequestType::Borrow => {
                    env.events().publish(
                        (BORROW_EVENT,),
                        (from.clone(), pool_address.clone(), request.address.clone(), request.amount)
                    );
                },
                RequestType::Repay => {
                    env.events().publish(
                        (REPAY_EVENT,),
                        (from.clone(), pool_address.clone(), request.address.clone(), request.amount)
                    );
                },
                RequestType::WithdrawCollateral => {
                    env.events().publish(
                        (WITHDRAW_EVENT,),
                        (from.clone(), pool_address.clone(), request.address.clone(), request.amount)
                    );
                },
                _ => {} // Other request types
            }
        }
    }

    /// Supply SRWA tokens as collateral to existing Blend pool
    pub fn supply_srwa_collateral(
        env: Env,
        from: Address,
        pool_address: Address,
        srwa_token: Address,
        amount: i128,
    ) {
        let request = Request {
            request_type: RequestType::SupplyCollateral,
            address: srwa_token,
            amount,
        };
        let requests = vec![&env, request];

        Self::submit_requests(
            env,
            from.clone(),
            from.clone(),
            from,
            pool_address,
            requests,
        )
    }

    /// Borrow USDC against SRWA collateral
    pub fn borrow_usdc(
        env: Env,
        from: Address,
        pool_address: Address,
        amount: i128,
    ) {
        let usdc_address = Address::from_string(&String::from_str(&env, USDC_TOKEN));
        
        let request = Request {
            request_type: RequestType::Borrow,
            address: usdc_address,
            amount,
        };
        let requests = vec![&env, request];

        Self::submit_requests(
            env,
            from.clone(),
            from.clone(),
            from,
            pool_address,
            requests,
        )
    }

    /// Repay USDC loan
    pub fn repay_usdc(
        env: Env,
        from: Address,
        pool_address: Address,
        amount: i128,
    ) {
        let usdc_address = Address::from_string(&String::from_str(&env, USDC_TOKEN));
        
        let request = Request {
            request_type: RequestType::Repay,
            address: usdc_address,
            amount,
        };
        let requests = vec![&env, request];

        Self::submit_requests(
            env,
            from.clone(),
            from.clone(),
            from,
            pool_address,
            requests,
        )
    }

    /// Withdraw SRWA collateral
    pub fn withdraw_srwa_collateral(
        env: Env,
        from: Address,
        pool_address: Address,
        srwa_token: Address,
        amount: i128,
    ) {
        let request = Request {
            request_type: RequestType::WithdrawCollateral,
            address: srwa_token,
            amount,
        };
        let requests = vec![&env, request];

        Self::submit_requests(
            env,
            from.clone(),
            from.clone(),
            from,
            pool_address,
            requests,
        )
    }

    /// Get user positions in a Blend pool
    pub fn get_user_positions(
        env: Env,
        pool_address: Address,
        user: Address,
    ) -> UserPositionData {
        let pools: Map<Address, PoolInfo> = env.storage().instance()
            .get(&POOLS_KEY)
            .expect("Not initialized");
        
        if !pools.contains_key(pool_address.clone()) {
            panic!("Pool not found");
        }

        // Call Blend pool to get actual positions
        let positions: UserPositionData = env.invoke_contract(
            &pool_address,
            &Symbol::new(&env, "get_positions"),
            vec![&env, user.into_val(&env)],
        );

        positions
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

    /// Get pool information
    pub fn get_pool_info(
        env: Env,
        pool_address: Address,
    ) -> PoolInfo {
        let pools: Map<Address, PoolInfo> = env.storage().instance()
            .get(&POOLS_KEY)
            .expect("Not initialized");
        
        pools.get(pool_address)
            .expect("Pool not found")
    }

    /// List all pools managed by this adapter
    pub fn get_all_pools(env: Env) -> Vec<Address> {
        let pools: Map<Address, PoolInfo> = env.storage().instance()
            .get(&POOLS_KEY)
            .expect("Not initialized");
        
        let mut pool_addresses = Vec::new(&env);
        for (address, _) in pools.iter() {
            pool_addresses.push_back(address);
        }
        
        pool_addresses
    }

    /// Get admin address
    pub fn get_admin(env: Env) -> Address {
        env.storage().instance()
            .get(&ADMIN_KEY)
            .expect("Not initialized")
    }

    /// Check if a pool exists in our registry
    pub fn pool_exists(env: Env, pool_address: Address) -> bool {
        let pools: Map<Address, PoolInfo> = env.storage().instance()
            .get(&POOLS_KEY)
            .unwrap_or(Map::new(&env));
        
        pools.contains_key(pool_address)
    }

    /// Register an existing Blend pool (if not deployed through this adapter)
    pub fn register_pool(
        env: Env,
        admin: Address,
        pool_address: Address,
        name: String,
        oracle: Address,
        backstop_take_rate: u32,
        max_positions: u32,
    ) {
        let stored_admin: Address = env.storage().instance()
            .get(&ADMIN_KEY)
            .expect("Not initialized");
        
        if admin != stored_admin {
            panic!("Unauthorized");
        }
        
        admin.require_auth();

        let pool_info = PoolInfo {
            pool_address: pool_address.clone(),
            name,
            oracle,
            backstop_take_rate,
            max_positions,
        };

        let mut pools: Map<Address, PoolInfo> = env.storage().instance()
            .get(&POOLS_KEY)
            .unwrap_or(Map::new(&env));
        
        pools.set(pool_address, pool_info);
        env.storage().instance().set(&POOLS_KEY, &pools);
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Env};

    #[test]
    fn test_initialize() {
        let env = Env::default();
        let contract_id = env.register_contract(None, BlendAdapterV2);
        let client = BlendAdapterV2Client::new(&env, &contract_id);

        let admin = Address::generate(&env);

        client.initialize(&admin);
        
        assert_eq!(client.get_admin(), admin);
    }

    #[test]
    fn test_official_addresses() {
        let env = Env::default();
        let contract_id = env.register_contract(None, BlendAdapterV2);
        let client = BlendAdapterV2Client::new(&env, &contract_id);

        let admin = Address::generate(&env);
        client.initialize(&admin);

        // Test that official addresses are accessible
        let _pool_factory = client.get_pool_factory();
        let _backstop = client.get_backstop();
        let _oracle = client.get_oracle();
        let _usdc = client.get_usdc_token();
        let _xlm = client.get_xlm_token();
        let _blnd = client.get_blnd_token();
    }
}