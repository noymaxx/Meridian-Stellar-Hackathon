#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, vec,
    Address, Env, Symbol, Vec, Map, String, BytesN, IntoVal
};

// Storage keys - MÁXIMO 9 CARACTERES
const ADMIN_KEY: Symbol = symbol_short!("ADMIN");
const POOLS_KEY: Symbol = symbol_short!("POOLS");
const TOKENS_KEY: Symbol = symbol_short!("TOKENS");
const POSITIONS: Symbol = symbol_short!("POSITIONS");
const RESERVES: Symbol = symbol_short!("RESERVES");
const BLEND_POS: Symbol = symbol_short!("BLEND_POS");
const COMPLIANCE: Symbol = symbol_short!("COMPLIANT");

// Events - MÁXIMO 9 CARACTERES
const POOL_NEW: Symbol = symbol_short!("POOL_NEW");
const SUPPLY: Symbol = symbol_short!("SUPPLY");
const BORROW: Symbol = symbol_short!("BORROW");
const REPAY: Symbol = symbol_short!("REPAY");
const WITHDRAW: Symbol = symbol_short!("WITHDRAW");

// Request types para Blend Protocol
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum RequestType {
    SupplyCollateral = 0,
    WithdrawCollateral = 1,
    Borrow = 4,
    Repay = 5,
}

// Request structure para Blend Protocol
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Request {
    pub request_type: RequestType,
    pub address: Address,
    pub amount: i128,
}

// Blend Pool Reserve Info
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ReserveInfo {
    pub asset: Address,
    pub c_factor: u32,
    pub l_factor: u32,
    pub util: u32,
    pub max_util: u32,
    pub r_base: u32,
    pub r_one: u32,
    pub r_two: u32,
    pub r_three: u32,
    pub reactivity: u32,
    pub supply_cap: i128,
    pub enabled: bool,
}

// Blend Pool Position
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct BlendPosition {
    pub user: Address,
    pub pool: Address,
    pub collateral: Map<Address, i128>,
    pub debt: Map<Address, i128>,
    pub last_update: u64,
}

// Compliance Result
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ComplianceResult {
    pub is_compliant: bool,
    pub reason: String,
    pub required_actions: Vec<String>,
}

// Estruturas simplificadas
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PoolInfo {
    pub pool_address: Address,
    pub name: String,
    pub oracle: Address,
    pub max_positions: u32,
    pub is_active: bool,
    pub created_at: u64,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct TokenConfig {
    pub token_address: Address,
    pub pool_address: Address,
    pub ltv_ratio: u32,
    pub liq_threshold: u32,
    pub is_authorized: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Position {
    pub user: Address,
    pub pool: Address,
    pub collateral: i128,
    pub borrowed: i128,
    pub health_factor: u32,
    pub can_borrow: bool,
}

#[contract]
pub struct BlendPoolIntegration;

#[contractimpl]
impl BlendPoolIntegration {
    /// Inicializar o contrato
    pub fn initialize(env: Env, admin: Address) {
        if env.storage().instance().has(&ADMIN_KEY) {
            panic!("Already initialized");
        }

        admin.require_auth();
        env.storage().instance().set(&ADMIN_KEY, &admin);
        
        // Inicializar mapas vazios
        let pools: Map<Address, PoolInfo> = Map::new(&env);
        let tokens: Map<Address, TokenConfig> = Map::new(&env);
        let positions: Map<(Address, Address), Position> = Map::new(&env);
        
        env.storage().instance().set(&POOLS_KEY, &pools);
        env.storage().instance().set(&TOKENS_KEY, &tokens);
        env.storage().instance().set(&POSITIONS, &positions);
    }

    /// Criar pool simplificado
    pub fn create_pool(
        env: Env,
        admin: Address,
        name: String,
        oracle: Address,
        max_positions: u32,
    ) -> Address {
        let stored_admin: Address = env.storage().instance()
            .get(&ADMIN_KEY)
            .expect("Not initialized");
        
        if admin != stored_admin {
            panic!("Unauthorized");
        }
        
        admin.require_auth();

        // Validações simples
        if max_positions == 0 || max_positions > 12 {
            panic!("Invalid max positions");
        }

        // Criar endereço do pool de forma simples
        let pool_address = Self::generate_pool_address(&env, &admin, &name);

        // Criar info do pool
        let pool_info = PoolInfo {
            pool_address: pool_address.clone(),
            name: name.clone(),
            oracle: oracle.clone(),
            max_positions,
            is_active: true,
            created_at: env.ledger().timestamp(),
        };

        // Armazenar
        let mut pools: Map<Address, PoolInfo> = env.storage().instance()
            .get(&POOLS_KEY)
            .unwrap_or(Map::new(&env));
        
        pools.set(pool_address.clone(), pool_info);
        env.storage().instance().set(&POOLS_KEY, &pools);

        // Emitir evento
        env.events().publish(
            (POOL_NEW,),
            (pool_address.clone(), name, oracle)
        );

        pool_address
    }

    /// Registrar pool existente
    pub fn register_pool(
        env: Env,
        admin: Address,
        pool_address: Address,
        name: String,
        oracle: Address,
        max_positions: u32,
    ) {
        let stored_admin: Address = env.storage().instance()
            .get(&ADMIN_KEY)
            .expect("Not initialized");
        
        if admin != stored_admin {
            panic!("Unauthorized");
        }
        
        admin.require_auth();

        if max_positions == 0 || max_positions > 12 {
            panic!("Invalid max positions");
        }

        let pool_info = PoolInfo {
            pool_address: pool_address.clone(),
            name: name.clone(),
            oracle: oracle.clone(),
            max_positions,
            is_active: true,
            created_at: env.ledger().timestamp(),
        };

        let mut pools: Map<Address, PoolInfo> = env.storage().instance()
            .get(&POOLS_KEY)
            .unwrap_or(Map::new(&env));
        
        pools.set(pool_address.clone(), pool_info);
        env.storage().instance().set(&POOLS_KEY, &pools);

        env.events().publish(
            (POOL_NEW,),
            (pool_address, name, oracle)
        );
    }

    /// Adicionar token SRWA ao pool
    pub fn add_token_to_pool(
        env: Env,
        admin: Address,
        pool_address: Address,
        token: Address,
        ltv_ratio: u32,
        liq_threshold: u32,
    ) {
        let stored_admin: Address = env.storage().instance()
            .get(&ADMIN_KEY)
            .expect("Not initialized");
        
        if admin != stored_admin {
            panic!("Unauthorized");
        }
        
        admin.require_auth();

        // Validações
        if ltv_ratio > liq_threshold {
            panic!("LTV > liquidation threshold");
        }
        if liq_threshold > 10000 {
            panic!("Invalid liquidation threshold");
        }

        // Verificar se pool existe
        let pools: Map<Address, PoolInfo> = env.storage().instance()
            .get(&POOLS_KEY)
            .expect("Not initialized");
        
        if !pools.contains_key(pool_address.clone()) {
            panic!("Pool not found");
        }

        // Criar config do token
        let token_config = TokenConfig {
            token_address: token.clone(),
            pool_address: pool_address.clone(),
            ltv_ratio,
            liq_threshold,
            is_authorized: true,
        };

        // Armazenar
        let mut tokens: Map<Address, TokenConfig> = env.storage().instance()
            .get(&TOKENS_KEY)
            .unwrap_or(Map::new(&env));
        
        tokens.set(token, token_config);
        env.storage().instance().set(&TOKENS_KEY, &tokens);
    }

    /// Supply collateral SRWA
    pub fn supply_collateral(
        env: Env,
        from: Address,
        pool_address: Address,
        token: Address,
        amount: i128,
    ) {
        from.require_auth();

        if amount <= 0 {
            panic!("Invalid amount");
        }

        // Verificar se token é autorizado
        let tokens: Map<Address, TokenConfig> = env.storage().instance()
            .get(&TOKENS_KEY)
            .expect("Not initialized");
        
        let token_config = tokens.get(token.clone())
            .expect("Token not authorized");

        if token_config.pool_address != pool_address {
            panic!("Token not for this pool");
        }

        // Verificar se pool está ativo
        let pools: Map<Address, PoolInfo> = env.storage().instance()
            .get(&POOLS_KEY)
            .expect("Not initialized");
        
        let pool_info = pools.get(pool_address.clone())
            .expect("Pool not found");

        if !pool_info.is_active {
            panic!("Pool inactive");
        }

        // Verificar compliance antes da operação
        let compliance_result = Self::check_compliance(
            env.clone(),
            from.clone(),
            pool_address.clone(),
            token.clone(),
            amount,
            RequestType::SupplyCollateral,
        );

        if !compliance_result.is_compliant {
            panic!("Compliance check failed");
        }

        // Criar Request para Blend Protocol
        let request = Request {
            request_type: RequestType::SupplyCollateral,
            address: token.clone(),
            amount,
        };
        let requests = vec![&env, request];

        // Chamar pool Blend REAL para supply
        let _: () = env.invoke_contract(
            &pool_address,
            &Symbol::new(&env, "submit"),
            vec![
                &env,
                from.clone().into_val(&env),
                from.clone().into_val(&env), // spender
                from.clone().into_val(&env), // to
                requests.into_val(&env),
            ],
        );

        // Atualizar posição local
        Self::update_position(
            env.clone(),
            from.clone(),
            pool_address.clone(),
            amount,
            0, // não está borrowing
        );

        // Atualizar posição Blend
        Self::update_blend_position(
            env.clone(),
            from.clone(),
            pool_address.clone(),
            token.clone(),
            amount,
            0,
        );

        env.events().publish(
            (SUPPLY,),
            (from, pool_address, token, amount)
        );
    }

    /// Borrow contra collateral SRWA - Integração REAL com Blend
    pub fn borrow_amount(
        env: Env,
        from: Address,
        pool_address: Address,
        token: Address,
        amount: i128,
    ) {
        from.require_auth();

        if amount <= 0 {
            panic!("Invalid amount");
        }

        // Verificar pool ativo
        let pools: Map<Address, PoolInfo> = env.storage().instance()
            .get(&POOLS_KEY)
            .expect("Not initialized");
        
        let pool_info = pools.get(pool_address.clone())
            .expect("Pool not found");

        if !pool_info.is_active {
            panic!("Pool inactive");
        }

        // Verificar capacidade de borrow
        let position = Self::get_position(env.clone(), from.clone(), pool_address.clone());
        if !position.can_borrow {
            panic!("Cannot borrow more");
        }

        // Verificar compliance antes da operação
        let compliance_result = Self::check_compliance(
            env.clone(),
            from.clone(),
            pool_address.clone(),
            token.clone(),
            amount,
            RequestType::Borrow,
        );

        if !compliance_result.is_compliant {
            panic!("Compliance check failed");
        }

        // Criar Request para Blend Protocol
        let request = Request {
            request_type: RequestType::Borrow,
            address: token.clone(),
            amount,
        };
        let requests = vec![&env, request];

        // Chamar pool Blend REAL para borrow
        let _: () = env.invoke_contract(
            &pool_address,
            &Symbol::new(&env, "submit"),
            vec![
                &env,
                from.clone().into_val(&env),
                from.clone().into_val(&env), // spender
                from.clone().into_val(&env), // to
                requests.into_val(&env),
            ],
        );

        // Atualizar posição local
        Self::update_position(
            env.clone(),
            from.clone(),
            pool_address.clone(),
            0, // não está supplying
            amount,
        );

        // Atualizar posição Blend
        Self::update_blend_position(
            env.clone(),
            from.clone(),
            pool_address.clone(),
            token.clone(),
            0,
            amount,
        );

        env.events().publish(
            (BORROW,),
            (from, pool_address, token, amount)
        );
    }

    /// Repagar empréstimo - Integração REAL com Blend
    pub fn repay_amount(
        env: Env,
        from: Address,
        pool_address: Address,
        token: Address,
        amount: i128,
    ) {
        from.require_auth();

        if amount <= 0 {
            panic!("Invalid amount");
        }

        // Verificar compliance antes da operação
        let compliance_result = Self::check_compliance(
            env.clone(),
            from.clone(),
            pool_address.clone(),
            token.clone(),
            amount,
            RequestType::Repay,
        );

        if !compliance_result.is_compliant {
            panic!("Compliance check failed");
        }

        // Criar Request para Blend Protocol
        let request = Request {
            request_type: RequestType::Repay,
            address: token.clone(),
            amount,
        };
        let requests = vec![&env, request];

        // Chamar pool Blend REAL para repay
        let _: () = env.invoke_contract(
            &pool_address,
            &Symbol::new(&env, "submit"),
            vec![
                &env,
                from.clone().into_val(&env),
                from.clone().into_val(&env), // spender
                from.clone().into_val(&env), // to
                requests.into_val(&env),
            ],
        );

        // Atualizar posição local (valor negativo = repayment)
        Self::update_position(
            env.clone(),
            from.clone(),
            pool_address.clone(),
            0,
            -amount,
        );

        // Atualizar posição Blend
        Self::update_blend_position(
            env.clone(),
            from.clone(),
            pool_address.clone(),
            token.clone(),
            0,
            -amount,
        );

        env.events().publish(
            (REPAY,),
            (from, pool_address, token, amount)
        );
    }

    /// Withdraw collateral - Integração REAL com Blend
    pub fn withdraw_collateral(
        env: Env,
        from: Address,
        pool_address: Address,
        token: Address,
        amount: i128,
    ) {
        from.require_auth();

        if amount <= 0 {
            panic!("Invalid amount");
        }

        // Verificar posição atual
        let position = Self::get_position(env.clone(), from.clone(), pool_address.clone());
        
        if position.collateral < amount {
            panic!("Insufficient collateral");
        }

        // Verificar compliance antes da operação
        let compliance_result = Self::check_compliance(
            env.clone(),
            from.clone(),
            pool_address.clone(),
            token.clone(),
            amount,
            RequestType::WithdrawCollateral,
        );

        if !compliance_result.is_compliant {
            panic!("Compliance check failed");
        }

        // Criar Request para Blend Protocol
        let request = Request {
            request_type: RequestType::WithdrawCollateral,
            address: token.clone(),
            amount,
        };
        let requests = vec![&env, request];

        // Chamar pool Blend REAL para withdraw
        let _: () = env.invoke_contract(
            &pool_address,
            &Symbol::new(&env, "submit"),
            vec![
                &env,
                from.clone().into_val(&env),
                from.clone().into_val(&env), // spender
                from.clone().into_val(&env), // to
                requests.into_val(&env),
            ],
        );

        // Atualizar posição local (valor negativo = withdrawal)
        Self::update_position(
            env.clone(),
            from.clone(),
            pool_address.clone(),
            -amount,
            0,
        );

        // Atualizar posição Blend
        Self::update_blend_position(
            env.clone(),
            from.clone(),
            pool_address.clone(),
            token.clone(),
            -amount,
            0,
        );

        env.events().publish(
            (WITHDRAW,),
            (from, pool_address, token, amount)
        );
    }

    /// Get posição do usuário
    pub fn get_position(
        env: Env,
        user: Address,
        pool_address: Address,
    ) -> Position {
        let positions: Map<(Address, Address), Position> = env.storage().instance()
            .get(&POSITIONS)
            .expect("Not initialized");
        
        let key = (user.clone(), pool_address.clone());
        positions.get(key).unwrap_or(Position {
            user,
            pool: pool_address,
            collateral: 0,
            borrowed: 0,
            health_factor: 0,
            can_borrow: true,
        })
    }

    /// Get todos os pools
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

    /// Get info do pool
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

    /// Obter posição Blend do usuário
    pub fn get_blend_position(
        env: Env,
        user: Address,
        pool_address: Address,
    ) -> BlendPosition {
        let positions: Map<Address, BlendPosition> = env.storage().instance()
            .get(&BLEND_POS)
            .unwrap_or(Map::new(&env));

        positions.get(user.clone())
            .unwrap_or(BlendPosition {
                user: user.clone(),
                pool: pool_address,
                collateral: Map::new(&env),
                debt: Map::new(&env),
                last_update: env.ledger().timestamp(),
            })
    }

    /// Adicionar reserva ao pool Blend
    pub fn add_reserve_to_pool(
        env: Env,
        admin: Address,
        pool_address: Address,
        asset: Address,
        c_factor: u32,
        l_factor: u32,
        max_util: u32,
        r_base: u32,
        r_one: u32,
    ) {
        admin.require_auth();

        // Verificar se é admin
        let stored_admin: Address = env.storage().instance()
            .get(&ADMIN_KEY)
            .expect("Not initialized");

        if admin != stored_admin {
            panic!("Not authorized");
        }

        // Criar ReserveInfo
        let reserve_info = ReserveInfo {
            asset: asset.clone(),
            c_factor,
            l_factor,
            util: 0,
            max_util,
            r_base,
            r_one,
            r_two: 1000,
            r_three: 10000,
            reactivity: 100,
            supply_cap: 1000000000000,
            enabled: true,
        };

        // Armazenar reserva
        let mut reserves: Map<Address, ReserveInfo> = env.storage().instance()
            .get(&RESERVES)
            .unwrap_or(Map::new(&env));

        reserves.set(asset.clone(), reserve_info);
        env.storage().instance().set(&RESERVES, &reserves);

        // Chamar pool Blend para adicionar reserva
        let _: () = env.invoke_contract(
            &pool_address,
            &Symbol::new(&env, "queue_set_reserve"),
            vec![
                &env,
                asset.into_val(&env),
                c_factor.into_val(&env),
                l_factor.into_val(&env),
                max_util.into_val(&env),
                r_base.into_val(&env),
                r_one.into_val(&env),
            ],
        );
    }

    /// Obter informações da reserva
    pub fn get_reserve_info(
        env: Env,
        pool_address: Address,
        asset: Address,
    ) -> ReserveInfo {
        let reserves: Map<Address, ReserveInfo> = env.storage().instance()
            .get(&RESERVES)
            .unwrap_or(Map::new(&env));

        reserves.get(asset.clone())
            .unwrap_or(ReserveInfo {
                asset: asset.clone(),
                c_factor: 0,
                l_factor: 0,
                util: 0,
                max_util: 0,
                r_base: 0,
                r_one: 0,
                r_two: 0,
                r_three: 0,
                reactivity: 0,
                supply_cap: 0,
                enabled: false,
            })
    }

    /// Obter todas as reservas do pool
    pub fn get_pool_reserves(
        env: Env,
        pool_address: Address,
    ) -> Vec<Address> {
        let reserves: Map<Address, ReserveInfo> = env.storage().instance()
            .get(&RESERVES)
            .unwrap_or(Map::new(&env));

        let mut asset_list = Vec::new(&env);
        for (asset, _) in reserves.iter() {
            asset_list.push_back(asset);
        }
        asset_list
    }

    /// Verificar compliance de uma operação
    pub fn check_operation_compliance(
        env: Env,
        user: Address,
        pool_address: Address,
        token: Address,
        amount: i128,
        request_type: RequestType,
    ) -> ComplianceResult {
        Self::check_compliance(env, user, pool_address, token, amount, request_type)
    }

    /// Configurar reserva no pool Blend automaticamente
    pub fn setup_pool_reserve(
        env: Env,
        admin: Address,
        pool_address: Address,
        asset: Address,
    ) {
        admin.require_auth();

        // Verificar se é admin
        let stored_admin: Address = env.storage().instance()
            .get(&ADMIN_KEY)
            .expect("Not initialized");

        if admin != stored_admin {
            panic!("Not authorized");
        }

        // Armazenar reserva localmente
        let reserve_info = ReserveInfo {
            asset: asset.clone(),
            c_factor: 8000,
            l_factor: 7500,
            util: 0,
            max_util: 9500,
            r_base: 0,
            r_one: 500,
            r_two: 1000,
            r_three: 10000,
            reactivity: 100,
            supply_cap: 1000000000000,
            enabled: true,
        };

        let mut reserves: Map<Address, ReserveInfo> = env.storage().instance()
            .get(&RESERVES)
            .unwrap_or(Map::new(&env));

        reserves.set(asset, reserve_info);
        env.storage().instance().set(&RESERVES, &reserves);
    }

    /// Get config do token
    pub fn get_token_config(
        env: Env,
        token: Address,
    ) -> TokenConfig {
        let tokens: Map<Address, TokenConfig> = env.storage().instance()
            .get(&TOKENS_KEY)
            .expect("Not initialized");
        
        tokens.get(token)
            .expect("Token not found")
    }

    /// Get admin
    pub fn get_admin(env: Env) -> Address {
        env.storage().instance()
            .get(&ADMIN_KEY)
            .expect("Not initialized")
    }

    /// Verificar se pool existe
    pub fn pool_exists(env: Env, pool_address: Address) -> bool {
        let pools: Map<Address, PoolInfo> = env.storage().instance()
            .get(&POOLS_KEY)
            .unwrap_or(Map::new(&env));
        
        pools.contains_key(pool_address)
    }

    // Helper functions

    fn generate_pool_address(env: &Env, admin: &Address, name: &String) -> Address {
        // Para integração REAL com Blend, vamos usar o register_pool
        // que permite registrar pools Blend existentes
        // Por enquanto, retornamos um endereço mock que será substituído
        // quando o pool real for registrado via register_pool
        env.current_contract_address()
    }

    /// Verificar compliance antes de operações
    fn check_compliance(
        env: Env,
        user: Address,
        pool_address: Address,
        token: Address,
        amount: i128,
        request_type: RequestType,
    ) -> ComplianceResult {
        // Verificar se o usuário tem identidade válida
        let identity_registry = Self::get_identity_registry(env.clone());
        let has_identity = Self::check_user_identity(env.clone(), identity_registry, user.clone());
        
        if !has_identity {
            return ComplianceResult {
                is_compliant: false,
                reason: String::from_str(&env, "User identity not verified"),
                required_actions: vec![&env],
            };
        }

        // Verificar limites de posição
        let position = Self::get_position(env.clone(), user.clone(), pool_address.clone());
        let max_collateral = Self::get_max_collateral(env.clone(), pool_address.clone(), token.clone());
        let max_debt = Self::get_max_debt(env.clone(), pool_address.clone(), token.clone());

        match request_type {
            RequestType::SupplyCollateral => {
                if position.collateral + amount > max_collateral {
                    return ComplianceResult {
                        is_compliant: false,
                        reason: String::from_str(&env, "Exceeds maximum collateral limit"),
                        required_actions: vec![&env],
                    };
                }
            },
            RequestType::Borrow => {
                if position.borrowed + amount > max_debt {
                    return ComplianceResult {
                        is_compliant: false,
                        reason: String::from_str(&env, "Exceeds maximum debt limit"),
                        required_actions: vec![&env],
                    };
                }
            },
            _ => {}
        }

        // Verificar se o token está autorizado para o pool
        let tokens: Map<Address, TokenConfig> = env.storage().instance()
            .get(&TOKENS_KEY)
            .expect("Not initialized");
        
        if let Some(token_config) = tokens.get(token.clone()) {
            if !token_config.is_authorized {
                return ComplianceResult {
                    is_compliant: false,
                    reason: String::from_str(&env, "Token not authorized for this pool"),
                    required_actions: vec![&env],
                };
            }
        } else {
            return ComplianceResult {
                is_compliant: false,
                reason: String::from_str(&env, "Token not found in pool configuration"),
                required_actions: vec![&env],
            };
        }

        ComplianceResult {
            is_compliant: true,
            reason: String::from_str(&env, "All compliance checks passed"),
            required_actions: vec![&env],
        }
    }

    /// Atualizar posição Blend
    fn update_blend_position(
        env: Env,
        user: Address,
        pool_address: Address,
        token: Address,
        collateral_change: i128,
        debt_change: i128,
    ) {
        let mut positions: Map<Address, BlendPosition> = env.storage().instance()
            .get(&BLEND_POS)
            .unwrap_or(Map::new(&env));

        let mut position = positions.get(user.clone())
            .unwrap_or(BlendPosition {
                user: user.clone(),
                pool: pool_address.clone(),
                collateral: Map::new(&env),
                debt: Map::new(&env),
                last_update: env.ledger().timestamp(),
            });

        // Atualizar collateral
        let current_collateral = position.collateral.get(token.clone()).unwrap_or(0);
        position.collateral.set(token.clone(), current_collateral + collateral_change);

        // Atualizar debt
        let current_debt = position.debt.get(token.clone()).unwrap_or(0);
        position.debt.set(token.clone(), current_debt + debt_change);

        // Atualizar timestamp
        position.last_update = env.ledger().timestamp();

        positions.set(user, position);
        env.storage().instance().set(&BLEND_POS, &positions);
    }

    /// Obter endereço do Identity Registry
    fn get_identity_registry(env: Env) -> Address {
        // Em uma implementação real, isso viria de configuração
        // Por enquanto, retornamos um endereço mock
        env.current_contract_address()
    }

    /// Verificar identidade do usuário
    fn check_user_identity(env: Env, identity_registry: Address, user: Address) -> bool {
        // Em uma implementação real, chamaríamos o Identity Registry
        // Por enquanto, retornamos true para simplificar
        true
    }

    /// Obter máximo de collateral permitido
    fn get_max_collateral(env: Env, pool_address: Address, token: Address) -> i128 {
        // Em uma implementação real, consultaríamos o pool Blend
        // Por enquanto, retornamos um valor alto
        1000000000000
    }

    /// Obter máximo de debt permitido
    fn get_max_debt(env: Env, pool_address: Address, token: Address) -> i128 {
        // Em uma implementação real, consultaríamos o pool Blend
        // Por enquanto, retornamos um valor baseado no collateral
        let position = Self::get_position(env.clone(), env.current_contract_address(), pool_address);
        position.collateral * 8 / 10 // 80% do collateral
    }

    fn update_position(
        env: Env,
        user: Address,
        pool_address: Address,
        collateral_delta: i128,
        borrowed_delta: i128,
    ) {
        let mut positions: Map<(Address, Address), Position> = env.storage().instance()
            .get(&POSITIONS)
            .expect("Not initialized");
        
        let key = (user.clone(), pool_address.clone());
        let mut position = positions.get(key.clone()).unwrap_or(Position {
            user: user.clone(),
            pool: pool_address.clone(),
            collateral: 0,
            borrowed: 0,
            health_factor: 0,
            can_borrow: true,
        });

        // Atualizar valores
        position.collateral += collateral_delta;
        position.borrowed += borrowed_delta;

        // Recalcular health factor
        position.health_factor = Self::calculate_health_factor(&position);
        position.can_borrow = position.health_factor < 8000; // 80% threshold

        positions.set(key, position);
        env.storage().instance().set(&POSITIONS, &positions);
    }

    fn calculate_health_factor(position: &Position) -> u32 {
        if position.collateral <= 0 {
            return 0;
        }

        // Cálculo simples: (borrowed / collateral) * 10000
        ((position.borrowed * 10000) / position.collateral) as u32
    }
}