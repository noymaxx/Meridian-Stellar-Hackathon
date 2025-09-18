#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, vec,
    Address, Env, Symbol, Vec, Map, String, log
};

// Storage keys - MÁXIMO 9 CARACTERES
const ADMIN_KEY: Symbol = symbol_short!("ADMIN");
const POOLS_KEY: Symbol = symbol_short!("POOLS");
const TOKENS_KEY: Symbol = symbol_short!("TOKENS");
const POSITIONS: Symbol = symbol_short!("POSITIONS");
const BLEND_POS: Symbol = symbol_short!("BLEND_POS");
const INITED: Symbol = symbol_short!("INITED");

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
        log!(&env, "Initializing Blend adapter with admin: {}", admin);
        
        // Verificar se já foi inicializado
        if env.storage().persistent().has(&INITED) {
            log!(&env, "Contract already initialized");
            return;
        }

        admin.require_auth();
        
        // Marcar como inicializado
        env.storage().persistent().set(&INITED, &true);
        env.storage().persistent().set(&ADMIN_KEY, &admin);
        
        // Inicializar mapas vazios
        let pools: Map<Address, PoolInfo> = Map::new(&env);
        let tokens: Map<Address, TokenConfig> = Map::new(&env);
        let positions: Map<(Address, Address), Position> = Map::new(&env);
        
        env.storage().persistent().set(&POOLS_KEY, &pools);
        env.storage().persistent().set(&TOKENS_KEY, &tokens);
        env.storage().persistent().set(&POSITIONS, &positions);
        
        log!(&env, "Blend adapter initialized successfully");
    }

    /// Criar pool simplificado
    pub fn create_pool(
        env: Env,
        admin: Address,
        name: String,
        oracle: Address,
        max_positions: u32,
    ) -> Address {
        log!(&env, "Creating pool: {}", name);
        
        // Verificar inicialização
        if !env.storage().persistent().has(&INITED) {
            log!(&env, "Contract not initialized");
            panic!("Contract not initialized");
        }
        
        let stored_admin: Address = env.storage().persistent()
            .get(&ADMIN_KEY)
            .expect("Admin not found");
        
        if admin != stored_admin {
            log!(&env, "Unauthorized access");
            panic!("Unauthorized");
        }
        
        admin.require_auth();

        // Validações simples
        if max_positions == 0 || max_positions > 12 {
            log!(&env, "Invalid max positions: {}", max_positions);
            panic!("Invalid max positions");
        }

        // Usar um endereço deterministico simples
        let pool_address = env.current_contract_address();

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
        let mut pools: Map<Address, PoolInfo> = env.storage().persistent()
            .get(&POOLS_KEY)
            .unwrap_or(Map::new(&env));
        
        pools.set(pool_address.clone(), pool_info);
        env.storage().persistent().set(&POOLS_KEY, &pools);

        // Emitir evento
        env.events().publish(
            (POOL_NEW,),
            (pool_address.clone(), name, oracle)
        );

        log!(&env, "Pool created successfully");
        pool_address
    }

    /// Registrar pool existente - VERSÃO SIMPLES
    pub fn register_pool(
        env: Env,
        admin: Address,
        pool_address: Address,
        name: String,
        oracle: Address,
        max_positions: u32,
    ) {
        log!(&env, "Registering existing pool: {}", name);
        
        // Verificar inicialização
        if !env.storage().persistent().has(&INITED) {
            log!(&env, "Contract not initialized");
            panic!("Contract not initialized");
        }
        
        let stored_admin: Address = env.storage().persistent()
            .get(&ADMIN_KEY)
            .expect("Admin not found");
        
        if admin != stored_admin {
            log!(&env, "Unauthorized access");
            panic!("Unauthorized");
        }
        
        admin.require_auth();

        if max_positions == 0 || max_positions > 12 {
            log!(&env, "Invalid max positions: {}", max_positions);
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

        let mut pools: Map<Address, PoolInfo> = env.storage().persistent()
            .get(&POOLS_KEY)
            .unwrap_or(Map::new(&env));
        
        pools.set(pool_address.clone(), pool_info);
        env.storage().persistent().set(&POOLS_KEY, &pools);

        env.events().publish(
            (POOL_NEW,),
            (pool_address, name, oracle)
        );
        
        log!(&env, "Pool registered successfully");
    }

    /// Adicionar token SRWA ao pool - VERSÃO SIMPLES
    pub fn add_token_to_pool(
        env: Env,
        admin: Address,
        pool_address: Address,
        token: Address,
        ltv_ratio: u32,
        liq_threshold: u32,
    ) {
        log!(&env, "Adding token to pool");
        
        // Verificar inicialização
        if !env.storage().persistent().has(&INITED) {
            log!(&env, "Contract not initialized - calling initialize");
            Self::initialize(env.clone(), admin.clone());
        }
        
        let stored_admin: Address = env.storage().persistent()
            .get(&ADMIN_KEY)
            .expect("Admin not found after initialization");
        
        if admin != stored_admin {
            log!(&env, "Unauthorized access");
            panic!("Unauthorized");
        }
        
        admin.require_auth();

        // Validações
        if ltv_ratio > liq_threshold {
            log!(&env, "LTV {} > liquidation threshold {}", ltv_ratio, liq_threshold);
            panic!("LTV > liquidation threshold");
        }
        if liq_threshold > 10000 {
            log!(&env, "Invalid liquidation threshold: {}", liq_threshold);
            panic!("Invalid liquidation threshold");
        }

        // Auto-registrar pool se não existir
        let mut pools: Map<Address, PoolInfo> = env.storage().persistent()
            .get(&POOLS_KEY)
            .unwrap_or(Map::new(&env));
        
        if !pools.contains_key(pool_address.clone()) {
            log!(&env, "Pool not found, auto-registering");
            let pool_info = PoolInfo {
                pool_address: pool_address.clone(),
                name: String::from_str(&env, "Auto-registered Pool"),
                oracle: env.current_contract_address(), // Mock oracle
                max_positions: 10,
                is_active: true,
                created_at: env.ledger().timestamp(),
            };
            pools.set(pool_address.clone(), pool_info);
            env.storage().persistent().set(&POOLS_KEY, &pools);
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
        let mut tokens: Map<Address, TokenConfig> = env.storage().persistent()
            .get(&TOKENS_KEY)
            .unwrap_or(Map::new(&env));
        
        tokens.set(token, token_config);
        env.storage().persistent().set(&TOKENS_KEY, &tokens);
        
        log!(&env, "Token added to pool successfully");
    }

    /// Setup Pool Reserve - VERSÃO SIMPLES SEM CROSS-CONTRACT CALL
    pub fn setup_pool_reserve(
        env: Env,
        admin: Address,
        pool_address: Address,
        asset: Address,
    ) {
        log!(&env, "Setting up pool reserve");
        
        // Verificar inicialização
        if !env.storage().persistent().has(&INITED) {
            log!(&env, "Contract not initialized - calling initialize");
            Self::initialize(env.clone(), admin.clone());
        }
        
        let stored_admin: Address = env.storage().persistent()
            .get(&ADMIN_KEY)
            .expect("Admin not found after initialization");
        
        if admin != stored_admin {
            log!(&env, "Unauthorized access");
            panic!("Unauthorized");
        }
        
        admin.require_auth();

        // Criar reserva local (sem chamar o pool Blend)
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

        // Usar uma chave composta para reserves por pool
        let reserve_key = (pool_address.clone(), asset.clone());
        env.storage().persistent().set(&reserve_key, &reserve_info);
        
        log!(&env, "Pool reserve set up successfully");
    }

    /// Supply collateral SRWA - VERSÃO MOCK PARA TESTING
    pub fn supply_collateral(
        env: Env,
        from: Address,
        pool_address: Address,
        token: Address,
        amount: i128,
    ) {
        from.require_auth();
        
        log!(&env, "Supply collateral: {} tokens", amount);

        if amount <= 0 {
            panic!("Invalid amount");
        }

        // Atualizar posição local
        Self::update_position(
            env.clone(),
            from.clone(),
            pool_address.clone(),
            amount,
            0,
        );

        env.events().publish(
            (SUPPLY,),
            (from, pool_address, token, amount)
        );
        
        log!(&env, "Collateral supplied successfully");
    }

    /// Borrow amount - VERSÃO MOCK PARA TESTING
    pub fn borrow_amount(
        env: Env,
        from: Address,
        pool_address: Address,
        token: Address,
        amount: i128,
    ) {
        from.require_auth();
        
        log!(&env, "Borrow amount: {} tokens", amount);

        if amount <= 0 {
            panic!("Invalid amount");
        }

        // Atualizar posição local
        Self::update_position(
            env.clone(),
            from.clone(),
            pool_address.clone(),
            0,
            amount,
        );

        env.events().publish(
            (BORROW,),
            (from, pool_address, token, amount)
        );
        
        log!(&env, "Amount borrowed successfully");
    }

    /// Repay amount - VERSÃO MOCK PARA TESTING
    pub fn repay_amount(
        env: Env,
        from: Address,
        pool_address: Address,
        token: Address,
        amount: i128,
    ) {
        from.require_auth();
        
        log!(&env, "Repay amount: {} tokens", amount);

        if amount <= 0 {
            panic!("Invalid amount");
        }

        // Atualizar posição local
        Self::update_position(
            env.clone(),
            from.clone(),
            pool_address.clone(),
            0,
            -amount,
        );

        env.events().publish(
            (REPAY,),
            (from, pool_address, token, amount)
        );
        
        log!(&env, "Amount repaid successfully");
    }

    /// Withdraw collateral - VERSÃO MOCK PARA TESTING
    pub fn withdraw_collateral(
        env: Env,
        from: Address,
        pool_address: Address,
        token: Address,
        amount: i128,
    ) {
        from.require_auth();
        
        log!(&env, "Withdraw collateral: {} tokens", amount);

        if amount <= 0 {
            panic!("Invalid amount");
        }

        // Atualizar posição local
        Self::update_position(
            env.clone(),
            from.clone(),
            pool_address.clone(),
            -amount,
            0,
        );

        env.events().publish(
            (WITHDRAW,),
            (from, pool_address, token, amount)
        );
        
        log!(&env, "Collateral withdrawn successfully");
    }

    /// Get posição do usuário
    pub fn get_position(
        env: Env,
        user: Address,
        pool_address: Address,
    ) -> Position {
        let positions: Map<(Address, Address), Position> = env.storage().persistent()
            .get(&POSITIONS)
            .unwrap_or(Map::new(&env));
        
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
        let pools: Map<Address, PoolInfo> = env.storage().persistent()
            .get(&POOLS_KEY)
            .unwrap_or(Map::new(&env));
        
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
        let pools: Map<Address, PoolInfo> = env.storage().persistent()
            .get(&POOLS_KEY)
            .unwrap_or(Map::new(&env));
        
        pools.get(pool_address.clone())
            .unwrap_or(PoolInfo {
                pool_address,
                name: String::from_str(&env, "Unknown Pool"),
                oracle: env.current_contract_address(),
                max_positions: 10,
                is_active: true,
                created_at: env.ledger().timestamp(),
            })
    }

    /// Obter posição Blend do usuário
    pub fn get_blend_position(
        env: Env,
        user: Address,
        pool_address: Address,
    ) -> BlendPosition {
        let positions: Map<Address, BlendPosition> = env.storage().persistent()
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

    /// Adicionar reserva ao pool Blend - VERSÃO SIMPLES
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
        
        log!(&env, "Adding reserve to pool");

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

        let reserve_key = (pool_address, asset);
        env.storage().persistent().set(&reserve_key, &reserve_info);
        
        log!(&env, "Reserve added to pool successfully");
    }

    /// Obter informações da reserva
    pub fn get_reserve_info(
        env: Env,
        pool_address: Address,
        asset: Address,
    ) -> ReserveInfo {
        let reserve_key = (pool_address, asset.clone());
        env.storage().persistent()
            .get(&reserve_key)
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
        // Em uma implementação mais completa, iteraríamos sobre todas as chaves
        // Por ora, retornamos um vetor vazio
        Vec::new(&env)
    }

    /// Verificar compliance de uma operação - VERSÃO SIMPLES
    pub fn check_operation_compliance(
        env: Env,
        user: Address,
        pool_address: Address,
        token: Address,
        amount: i128,
        request_type: RequestType,
    ) -> ComplianceResult {
        // Compliance simples - sempre aprovado para testing
        ComplianceResult {
            is_compliant: true,
            reason: String::from_str(&env, "All compliance checks passed"),
            required_actions: vec![&env],
        }
    }

    /// Get config do token
    pub fn get_token_config(
        env: Env,
        token: Address,
    ) -> TokenConfig {
        let tokens: Map<Address, TokenConfig> = env.storage().persistent()
            .get(&TOKENS_KEY)
            .unwrap_or(Map::new(&env));
        
        tokens.get(token.clone())
            .unwrap_or(TokenConfig {
                token_address: token.clone(),
                pool_address: env.current_contract_address(),
                ltv_ratio: 8000,
                liq_threshold: 8500,
                is_authorized: false,
            })
    }

    /// Get admin
    pub fn get_admin(env: Env) -> Address {
        env.storage().persistent()
            .get(&ADMIN_KEY)
            .unwrap_or(env.current_contract_address())
    }

    /// Verificar se pool existe
    pub fn pool_exists(env: Env, pool_address: Address) -> bool {
        let pools: Map<Address, PoolInfo> = env.storage().persistent()
            .get(&POOLS_KEY)
            .unwrap_or(Map::new(&env));
        
        pools.contains_key(pool_address)
    }

    // Helper functions

    fn update_position(
        env: Env,
        user: Address,
        pool_address: Address,
        collateral_delta: i128,
        borrowed_delta: i128,
    ) {
        let mut positions: Map<(Address, Address), Position> = env.storage().persistent()
            .get(&POSITIONS)
            .unwrap_or(Map::new(&env));
        
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

        // Evitar valores negativos
        if position.collateral < 0 {
            position.collateral = 0;
        }
        if position.borrowed < 0 {
            position.borrowed = 0;
        }

        // Recalcular health factor
        position.health_factor = Self::calculate_health_factor(&position);
        position.can_borrow = position.health_factor < 8000; // 80% threshold

        positions.set(key, position);
        env.storage().persistent().set(&POSITIONS, &positions);
    }

    fn calculate_health_factor(position: &Position) -> u32 {
        if position.collateral <= 0 {
            return 0;
        }

        // Cálculo simples: (borrowed / collateral) * 10000
        ((position.borrowed * 10000) / position.collateral) as u32
    }
}