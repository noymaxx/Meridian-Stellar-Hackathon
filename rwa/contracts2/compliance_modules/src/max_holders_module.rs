use soroban_sdk::{
    contract, contractimpl, symbol_short, Address, Env, Symbol
};
use crate::TransferContext;

const ADMIN: Symbol = symbol_short!("ADMIN");
const MAX_HOLDERS: Symbol = symbol_short!("MAX_HOLD");
const HOLDER_COUNT: Symbol = symbol_short!("HOLD_CNT");
const HOLDERS: Symbol = symbol_short!("HOLDERS");

#[contract]
pub struct MaxHoldersModule;

#[contractimpl]
impl MaxHoldersModule {
    pub fn initialize(env: Env, admin: Address) {
        if env.storage().instance().has(&ADMIN) {
            panic!("Already initialized");
        }
        env.storage().instance().set(&ADMIN, &admin);
    }

    pub fn set_max_holders(env: Env, token: Address, max_holders: u32) {
        Self::require_admin(&env);
        let key = (MAX_HOLDERS, token.clone());
        env.storage().persistent().set(&key, &max_holders);

        env.events().publish(
            (symbol_short!("MAX_SET"),),
            (token, max_holders)
        );
    }

    pub fn get_max_holders(env: Env, token: Address) -> u32 {
        let key = (MAX_HOLDERS, token);
        env.storage().persistent().get(&key).unwrap_or(0)
    }

    pub fn get_holder_count(env: Env, token: Address) -> u32 {
        let key = (HOLDER_COUNT, token);
        env.storage().persistent().get(&key).unwrap_or(0)
    }

    pub fn is_holder(env: Env, token: Address, address: Address) -> bool {
        let key = (HOLDERS, token, address);
        env.storage().persistent().get(&key).unwrap_or(false)
    }

    pub fn add_holder(env: Env, token: Address, address: Address) {
        if !Self::is_holder(&env, &token, &address) {
            let holder_key = (HOLDERS, token.clone(), address.clone());
            env.storage().persistent().set(&holder_key, &true);

            let count_key = (HOLDER_COUNT, token.clone());
            let current_count = Self::get_holder_count(&env, &token);
            env.storage().persistent().set(&count_key, &(current_count + 1));

            env.events().publish(
                (symbol_short!("HOLDER_ADD"),),
                (token, address, current_count + 1)
            );
        }
    }

    pub fn remove_holder(env: Env, token: Address, address: Address) {
        if Self::is_holder(&env, &token, &address) {
            let holder_key = (HOLDERS, token.clone(), address.clone());
            env.storage().persistent().remove(&holder_key);

            let count_key = (HOLDER_COUNT, token.clone());
            let current_count = Self::get_holder_count(&env, &token);
            if current_count > 0 {
                env.storage().persistent().set(&count_key, &(current_count - 1));
            }

            env.events().publish(
                (symbol_short!("HOLDER_REM"),),
                (token, address, current_count.saturating_sub(1))
            );
        }
    }

    pub fn check_transfer(env: Env, context: TransferContext) -> bool {
        let max_holders = Self::get_max_holders(&env, &context.token);

        // If no limit is set, allow transfer
        if max_holders == 0 {
            return true;
        }

        // If recipient is already a holder, allow transfer
        if Self::is_holder(&env, &context.token, &context.to) {
            return true;
        }

        // Check if adding a new holder would exceed the limit
        let current_count = Self::get_holder_count(&env, &context.token);
        current_count < max_holders
    }

    pub fn transferred(env: Env, context: TransferContext) {
        // This would be called after a successful transfer
        // to update holder status

        // Check if recipient should be added as a holder
        // (This would need integration with token contract to check balance)
        if context.amount > 0 && !Self::is_holder(&env, &context.token, &context.to) {
            Self::add_holder(&env, &context.token, &context.to);
        }

        // Check if sender should be removed as a holder
        // (This would need integration with token contract to check if balance is now 0)
        // For now, we don't automatically remove holders as we can't check balances
    }

    pub fn created(env: Env, to: Address, amount: i128, token: Address) {
        // Called when tokens are minted
        if amount > 0 && !Self::is_holder(&env, &token, &to) {
            Self::add_holder(&env, &token, &to);
        }
    }

    pub fn destroyed(env: Env, from: Address, amount: i128, token: Address) {
        // Called when tokens are burned
        // Would need to check if balance is now 0 to remove holder
        // For now, simplified implementation
        if amount > 0 {
            // Don't automatically remove - would need balance check
        }
    }

    fn require_admin(env: &Env) {
        let admin: Address = env.storage().instance().get(&ADMIN).unwrap();
        admin.require_auth();
    }
}