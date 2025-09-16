#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, Address, Env, Symbol, Vec
};

const ADMIN: Symbol = symbol_short!("ADMIN");
const IDENTITY_REGISTRY: Symbol = symbol_short!("ID_REG");
const MODULES: Symbol = symbol_short!("MODULES");
const BOUND_TOKENS: Symbol = symbol_short!("TOKENS");

#[derive(Clone, Debug, Eq, PartialEq)]
#[contracttype]
pub struct TransferContext {
    pub from: Address,
    pub to: Address,
    pub amount: i128,
    pub token: Address,
}

#[contract]
pub struct ComplianceCore;

#[contractimpl]
impl ComplianceCore {
    pub fn initialize(env: Env, admin: Address, identity_registry: Address) {
        if env.storage().instance().has(&ADMIN) {
            panic!("Already initialized");
        }

        env.storage().instance().set(&ADMIN, &admin);
        env.storage().instance().set(&IDENTITY_REGISTRY, &identity_registry);

        // Initialize empty modules list
        let modules: Vec<Address> = Vec::new(&env);
        env.storage().instance().set(&MODULES, &modules);
    }

    pub fn bind_token(env: Env, token: Address) {
        Self::require_admin(&env);

        let key = (BOUND_TOKENS, token.clone());
        env.storage().persistent().set(&key, &true);

        env.events().publish(
            (symbol_short!("TOK_BIND"),),
            token
        );
    }

    pub fn unbind_token(env: Env, token: Address) {
        Self::require_admin(&env);

        let key = (BOUND_TOKENS, token.clone());
        env.storage().persistent().remove(&key);

        env.events().publish(
            (symbol_short!("TOK_UNB"),),
            token
        );
    }

    pub fn is_token_bound(env: Env, token: Address) -> bool {
        let key = (BOUND_TOKENS, token);
        env.storage().persistent().get(&key).unwrap_or(false)
    }

    pub fn enable_module(env: Env, module: Address) {
        Self::require_admin(&env);

        let mut modules: Vec<Address> = env.storage().instance().get(&MODULES).unwrap_or_else(|| Vec::new(&env));

        if !modules.contains(&module) {
            modules.push_back(module.clone());
            env.storage().instance().set(&MODULES, &modules);

            env.events().publish(
                (symbol_short!("MODULE_EN"),),
                module
            );
        }
    }

    pub fn disable_module(env: Env, module: Address) {
        Self::require_admin(&env);

        let mut modules: Vec<Address> = env.storage().instance().get(&MODULES).unwrap_or_else(|| Vec::new(&env));

        if let Some(index) = modules.first_index_of(&module) {
            modules.remove(index);
            env.storage().instance().set(&MODULES, &modules);

            env.events().publish(
                (symbol_short!("MOD_DIS"),),
                module
            );
        }
    }

    pub fn get_enabled_modules(env: Env) -> Vec<Address> {
        env.storage().instance().get(&MODULES).unwrap_or_else(|| Vec::new(&env))
    }

    pub fn can_transfer(env: Env, from: Address, to: Address, amount: i128, token: Address) -> bool {
        // Check if token is bound to this compliance contract
        if !Self::is_token_bound(env.clone(), token.clone()) {
            return false;
        }

        // Check basic identity verification
        let identity_registry: Address = env.storage().instance().get(&IDENTITY_REGISTRY).unwrap();
        if !Self::is_verified(&env, &identity_registry, &from) || !Self::is_verified(&env, &identity_registry, &to) {
            return false;
        }

        // Check all enabled modules
        let modules = Self::get_enabled_modules(env.clone());
        let context = TransferContext {
            from: from.clone(),
            to: to.clone(),
            amount,
            token: token.clone(),
        };

        for module in modules.iter() {
            if !Self::check_module(&env, &module, &context) {
                return false;
            }
        }

        true
    }

    pub fn transferred(env: Env, from: Address, to: Address, amount: i128, token: Address) {
        // Notify all modules about the completed transfer
        let modules = Self::get_enabled_modules(env.clone());
        let context = TransferContext {
            from: from.clone(),
            to: to.clone(),
            amount,
            token: token.clone(),
        };

        for module in modules.iter() {
            Self::notify_module_transferred(&env, &module, &context);
        }

        env.events().publish(
            (symbol_short!("TRANSFER"),),
            (from, to, amount, token)
        );
    }

    pub fn created(env: Env, to: Address, amount: i128, token: Address) {
        // Notify all modules about token creation (minting)
        let modules = Self::get_enabled_modules(env.clone());

        for module in modules.iter() {
            Self::notify_module_created(&env, &module, &to, amount, &token);
        }

        env.events().publish(
            (symbol_short!("CREATED"),),
            (to, amount, token)
        );
    }

    pub fn destroyed(env: Env, from: Address, amount: i128, token: Address) {
        // Notify all modules about token destruction (burning)
        let modules = Self::get_enabled_modules(env.clone());

        for module in modules.iter() {
            Self::notify_module_destroyed(&env, &module, &from, amount, &token);
        }

        env.events().publish(
            (symbol_short!("DESTROYED"),),
            (from, amount, token)
        );
    }

    pub fn set_admin(env: Env, new_admin: Address) {
        Self::require_admin(&env);
        env.storage().instance().set(&ADMIN, &new_admin);
    }

    pub fn get_admin(env: Env) -> Address {
        env.storage().instance().get(&ADMIN).unwrap()
    }

    pub fn set_identity_registry(env: Env, identity_registry: Address) {
        Self::require_admin(&env);
        env.storage().instance().set(&IDENTITY_REGISTRY, &identity_registry);
    }

    pub fn get_identity_registry(env: Env) -> Address {
        env.storage().instance().get(&IDENTITY_REGISTRY).unwrap()
    }

    fn require_admin(env: &Env) {
        let admin: Address = env.storage().instance().get(&ADMIN).unwrap();
        admin.require_auth();
    }

    fn is_verified(env: &Env, identity_registry: &Address, holder: &Address) -> bool {
        // This would call the IdentityRegistry contract
        // For now, simplified implementation
        true
    }

    fn check_module(env: &Env, module: &Address, context: &TransferContext) -> bool {
        // This would call the module's check function
        // For now, simplified implementation
        true
    }

    fn notify_module_transferred(env: &Env, module: &Address, context: &TransferContext) {
        // This would call the module's transferred function
        // For now, simplified implementation
    }

    fn notify_module_created(env: &Env, module: &Address, to: &Address, amount: i128, token: &Address) {
        // This would call the module's created function
        // For now, simplified implementation
    }

    fn notify_module_destroyed(env: &Env, module: &Address, from: &Address, amount: i128, token: &Address) {
        // This would call the module's destroyed function
        // For now, simplified implementation
    }
}

mod test;