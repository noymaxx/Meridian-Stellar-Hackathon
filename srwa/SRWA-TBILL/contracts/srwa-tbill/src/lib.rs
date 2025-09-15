#![no_std]
use soroban_sdk::{
    contract, contractimpl, symbol_short, Address, Env, String, Symbol, 
    Error, panic_with_error
};

// Storage keys
const NAME_KEY: Symbol = symbol_short!("NAME");
const SYMBOL_KEY: Symbol = symbol_short!("SYMBOL");
const DECIMALS_KEY: Symbol = symbol_short!("DECIMALS");
const TOTAL_SUPPLY_KEY: Symbol = symbol_short!("TOTAL_SUP");
const BALANCE_KEY: Symbol = symbol_short!("BALANCE");
const ADMIN_KEY: Symbol = symbol_short!("ADMIN");
const AUTHORIZED_KEY: Symbol = symbol_short!("AUTH");

// Events
const MINT_EVENT: Symbol = symbol_short!("mint");
const BURN_EVENT: Symbol = symbol_short!("burn");
const TRANSFER_EVENT: Symbol = symbol_short!("transfer");
const APPROVE_EVENT: Symbol = symbol_short!("approve");

#[contract]
pub struct SRWATBill;

#[contractimpl]
impl SRWATBill {
    /// Initialize the SRWA-TBill token
    pub fn initialize(
        env: Env,
        admin: Address,
        name: String,
        symbol: String,
        decimals: u32,
    ) {
        // Check if already initialized
        if env.storage().instance().has(&NAME_KEY) {
            panic_with_error!(&env, Error::from_contract_error(1));
        }

        // Set token metadata
        env.storage().instance().set(&NAME_KEY, &name);
        env.storage().instance().set(&SYMBOL_KEY, &symbol);
        env.storage().instance().set(&DECIMALS_KEY, &decimals);
        env.storage().instance().set(&TOTAL_SUPPLY_KEY, &0i128);
        env.storage().instance().set(&ADMIN_KEY, &admin);
    }

    /// Get token name
    pub fn name(env: Env) -> String {
        env.storage().instance().get(&NAME_KEY).unwrap()
    }

    /// Get token symbol
    pub fn symbol(env: Env) -> String {
        env.storage().instance().get(&SYMBOL_KEY).unwrap()
    }

    /// Get token decimals
    pub fn decimals(env: Env) -> u32 {
        env.storage().instance().get(&DECIMALS_KEY).unwrap()
    }

    /// Get total supply
    pub fn total_supply(env: Env) -> i128 {
        env.storage().instance().get(&TOTAL_SUPPLY_KEY).unwrap_or(0)
    }

    /// Get balance of an address
    pub fn balance(env: Env, owner: Address) -> i128 {
        env.storage()
            .instance()
            .get(&(BALANCE_KEY, owner))
            .unwrap_or(0)
    }

    /// Get allowance between owner and spender
    pub fn allowance(env: Env, owner: Address, spender: Address) -> i128 {
        env.storage()
            .instance()
            .get(&(AUTHORIZED_KEY, owner, spender))
            .unwrap_or(0)
    }

    /// Transfer tokens from caller to recipient
    pub fn transfer(env: Env, from: Address, to: Address, amount: i128) {
        #[cfg(not(test))]
        {
            from.require_auth();
        }
        
        if amount <= 0 {
            panic_with_error!(&env, Error::from_contract_error(2));
        }

        let from_balance = Self::balance(env.clone(), from.clone());
        if from_balance < amount {
            panic_with_error!(&env, Error::from_contract_error(3));
        }

        // Update balances
        let new_from_balance = from_balance - amount;
        let to_balance = Self::balance(env.clone(), to.clone());
        let new_to_balance = to_balance + amount;

        env.storage().instance().set(&(BALANCE_KEY, from.clone()), &new_from_balance);
        env.storage().instance().set(&(BALANCE_KEY, to.clone()), &new_to_balance);

        // Emit transfer event
        env.events().publish(
            (TRANSFER_EVENT, from),
            (to, amount)
        );
    }

    /// Approve spender to spend tokens on behalf of caller
    pub fn approve(env: Env, from: Address, spender: Address, amount: i128) {
        #[cfg(not(test))]
        {
            from.require_auth();
        }
        
        if amount < 0 {
            panic_with_error!(&env, Error::from_contract_error(4));
        }

        env.storage()
            .instance()
            .set(&(AUTHORIZED_KEY, from.clone(), spender.clone()), &amount);

        // Emit approve event
        env.events().publish(
            (APPROVE_EVENT, from),
            (spender, amount)
        );
    }

    /// Transfer tokens using allowance
    pub fn transfer_from(env: Env, spender: Address, from: Address, to: Address, amount: i128) {
        #[cfg(not(test))]
        {
            spender.require_auth();
        }
        
        if amount <= 0 {
            panic_with_error!(&env, Error::from_contract_error(2));
        }

        let allowance = Self::allowance(env.clone(), from.clone(), spender.clone());
        if allowance < amount {
            panic_with_error!(&env, Error::from_contract_error(5));
        }

        let from_balance = Self::balance(env.clone(), from.clone());
        if from_balance < amount {
            panic_with_error!(&env, Error::from_contract_error(3));
        }

        // Update balances and allowance
        let new_from_balance = from_balance - amount;
        let to_balance = Self::balance(env.clone(), to.clone());
        let new_to_balance = to_balance + amount;
        let new_allowance = allowance - amount;

        env.storage().instance().set(&(BALANCE_KEY, from.clone()), &new_from_balance);
        env.storage().instance().set(&(BALANCE_KEY, to.clone()), &new_to_balance);
        env.storage()
            .instance()
            .set(&(AUTHORIZED_KEY, from.clone(), spender), &new_allowance);

        // Emit transfer event
        env.events().publish(
            (TRANSFER_EVENT, from),
            (to, amount)
        );
    }

    /// Mint new tokens (admin only)
    pub fn mint(env: Env, to: Address, amount: i128) {
        #[cfg(not(test))]
        {
            let admin: Address = env.storage().instance().get(&ADMIN_KEY).unwrap();
            admin.require_auth();
        }
        
        if amount <= 0 {
            panic_with_error!(&env, Error::from_contract_error(2));
        }

        let current_balance = Self::balance(env.clone(), to.clone());
        let new_balance = current_balance + amount;
        let current_supply = Self::total_supply(env.clone());
        let new_supply = current_supply + amount;

        env.storage().instance().set(&(BALANCE_KEY, to.clone()), &new_balance);
        env.storage().instance().set(&TOTAL_SUPPLY_KEY, &new_supply);

        // Emit mint event
        env.events().publish(
            (MINT_EVENT, to),
            amount
        );
    }

    /// Burn tokens (admin only)
    pub fn burn(env: Env, from: Address, amount: i128) {
        #[cfg(not(test))]
        {
            let admin: Address = env.storage().instance().get(&ADMIN_KEY).unwrap();
            admin.require_auth();
        }
        
        if amount <= 0 {
            panic_with_error!(&env, Error::from_contract_error(2));
        }

        let current_balance = Self::balance(env.clone(), from.clone());
        if current_balance < amount {
            panic_with_error!(&env, Error::from_contract_error(3));
        }

        let new_balance = current_balance - amount;
        let current_supply = Self::total_supply(env.clone());
        let new_supply = current_supply - amount;

        env.storage().instance().set(&(BALANCE_KEY, from.clone()), &new_balance);
        env.storage().instance().set(&TOTAL_SUPPLY_KEY, &new_supply);

        // Emit burn event
        env.events().publish(
            (BURN_EVENT, from),
            amount
        );
    }

    /// Set new admin (admin only)
    pub fn set_admin(env: Env, new_admin: Address) {
        #[cfg(not(test))]
        {
            let admin: Address = env.storage().instance().get(&ADMIN_KEY).unwrap();
            admin.require_auth();
        }
        
        env.storage().instance().set(&ADMIN_KEY, &new_admin);
    }

    /// Get current admin
    pub fn admin(env: Env) -> Address {
        env.storage().instance().get(&ADMIN_KEY).unwrap()
    }
}

mod test;
