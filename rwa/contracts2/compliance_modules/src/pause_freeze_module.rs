use soroban_sdk::{
    contract, contractimpl, symbol_short, Address, Env, Symbol
};
use crate::TransferContext;

const ADMIN: Symbol = symbol_short!("ADMIN");
const PAUSED_TOKENS: Symbol = symbol_short!("PAUSED");
const FROZEN_ADDRESSES: Symbol = symbol_short!("FROZEN");
const PARTIAL_FREEZES: Symbol = symbol_short!("PARTIAL");

#[contract]
pub struct PauseFreezeModule;

#[contractimpl]
impl PauseFreezeModule {
    pub fn initialize(env: Env, admin: Address) {
        if env.storage().instance().has(&ADMIN) {
            panic!("Already initialized");
        }
        env.storage().instance().set(&ADMIN, &admin);
    }

    // Global pause/unpause for a token
    pub fn pause_token(env: Env, token: Address) {
        Self::require_admin(&env);
        let key = (PAUSED_TOKENS, token.clone());
        env.storage().persistent().set(&key, &true);

        env.events().publish(
            (symbol_short!("TOKEN_PAUSE"),),
            token
        );
    }

    pub fn unpause_token(env: Env, token: Address) {
        Self::require_admin(&env);
        let key = (PAUSED_TOKENS, token.clone());
        env.storage().persistent().remove(&key);

        env.events().publish(
            (symbol_short!("TOKEN_UNPAUSE"),),
            token
        );
    }

    pub fn is_token_paused(env: Env, token: Address) -> bool {
        let key = (PAUSED_TOKENS, token);
        env.storage().persistent().get(&key).unwrap_or(false)
    }

    // Address-level freezing
    pub fn freeze_address(env: Env, token: Address, address: Address) {
        Self::require_admin(&env);
        let key = (FROZEN_ADDRESSES, token.clone(), address.clone());
        env.storage().persistent().set(&key, &true);

        env.events().publish(
            (symbol_short!("ADDR_FREEZE"),),
            (token, address)
        );
    }

    pub fn unfreeze_address(env: Env, token: Address, address: Address) {
        Self::require_admin(&env);
        let key = (FROZEN_ADDRESSES, token.clone(), address.clone());
        env.storage().persistent().remove(&key);

        env.events().publish(
            (symbol_short!("ADDR_UNFREEZE"),),
            (token, address)
        );
    }

    pub fn is_address_frozen(env: Env, token: Address, address: Address) -> bool {
        let key = (FROZEN_ADDRESSES, token, address);
        env.storage().persistent().get(&key).unwrap_or(false)
    }

    // Partial freeze (freeze specific amount)
    pub fn partial_freeze(env: Env, token: Address, address: Address, amount: i128) {
        Self::require_admin(&env);
        let key = (PARTIAL_FREEZES, token.clone(), address.clone());
        let current_frozen: i128 = env.storage().persistent().get(&key).unwrap_or(0);
        let new_frozen = current_frozen + amount;
        env.storage().persistent().set(&key, &new_frozen);

        env.events().publish(
            (symbol_short!("PARTIAL_FREEZE"),),
            (token, address, amount, new_frozen)
        );
    }

    pub fn partial_unfreeze(env: Env, token: Address, address: Address, amount: i128) {
        Self::require_admin(&env);
        let key = (PARTIAL_FREEZES, token.clone(), address.clone());
        let current_frozen: i128 = env.storage().persistent().get(&key).unwrap_or(0);
        let new_frozen = (current_frozen - amount).max(0);

        if new_frozen == 0 {
            env.storage().persistent().remove(&key);
        } else {
            env.storage().persistent().set(&key, &new_frozen);
        }

        env.events().publish(
            (symbol_short!("PARTIAL_UNFREEZE"),),
            (token, address, amount, new_frozen)
        );
    }

    pub fn get_frozen_amount(env: Env, token: Address, address: Address) -> i128 {
        let key = (PARTIAL_FREEZES, token, address);
        env.storage().persistent().get(&key).unwrap_or(0)
    }

    pub fn check_transfer(env: Env, context: TransferContext) -> bool {
        // Check if token is globally paused
        if Self::is_token_paused(&env, &context.token) {
            return false;
        }

        // Check if from or to address is frozen
        if Self::is_address_frozen(&env, &context.token, &context.from) ||
           Self::is_address_frozen(&env, &context.token, &context.to) {
            return false;
        }

        // Check partial freeze on from address
        let frozen_amount = Self::get_frozen_amount(&env, &context.token, &context.from);
        if frozen_amount > 0 {
            // This would need to check the actual balance vs frozen amount
            // For now, simplified check
            return context.amount <= frozen_amount;
        }

        true
    }

    fn require_admin(env: &Env) {
        let admin: Address = env.storage().instance().get(&ADMIN).unwrap();
        admin.require_auth();
    }
}