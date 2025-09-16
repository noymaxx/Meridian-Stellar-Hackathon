#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, Address, Bytes, Env, String, Symbol, Map
};

// Storage keys
const ADMIN: Symbol = symbol_short!("ADMIN");
const COMPLIANCE: Symbol = symbol_short!("COMPLIAN");
const NAME: Symbol = symbol_short!("NAME");
const SYMBOL: Symbol = symbol_short!("SYMBOL");
const DECIMALS: Symbol = symbol_short!("DECIMALS");
const TOTAL_SUPPLY: Symbol = symbol_short!("TOTAL");
const BALANCES: Symbol = symbol_short!("BALANCE");
const ALLOWANCES: Symbol = symbol_short!("ALLOWANCE");
const PAUSED: Symbol = symbol_short!("PAUSED");
const FROZEN: Symbol = symbol_short!("FROZEN");
const AUTHORIZED: Symbol = symbol_short!("AUTH");

// Events
const TRANSFER: Symbol = symbol_short!("TRANSFER");
const APPROVE: Symbol = symbol_short!("APPROVE");
const MINT: Symbol = symbol_short!("MINT");
const BURN: Symbol = symbol_short!("BURN");
const CLAWBACK: Symbol = symbol_short!("CLAWBACK");

#[derive(Clone, Debug, Eq, PartialEq)]
#[contracttype]
pub enum DataKey {
    Balance(Address),
    Allowance(Address, Address),
    Frozen(Address),
    Authorized(Address),
}

#[contract]
pub struct SrwaToken;

#[contractimpl]
impl SrwaToken {
    // SEP-41 Token Interface Implementation

    pub fn initialize(
        env: Env,
        admin: Address,
        name: String,
        symbol: String,
        decimals: u32,
        compliance_contract: Address,
    ) {
        if env.storage().instance().has(&ADMIN) {
            panic!("Already initialized");
        }

        env.storage().instance().set(&ADMIN, &admin);
        env.storage().instance().set(&NAME, &name);
        env.storage().instance().set(&SYMBOL, &symbol);
        env.storage().instance().set(&DECIMALS, &decimals);
        env.storage().instance().set(&TOTAL_SUPPLY, &0i128);
        env.storage().instance().set(&COMPLIANCE, &compliance_contract);
        env.storage().instance().set(&PAUSED, &false);
    }

    // SEP-41 Core Functions

    pub fn allowance(env: Env, from: Address, spender: Address) -> i128 {
        let key = DataKey::Allowance(from, spender);
        env.storage().persistent().get(&key).unwrap_or(0)
    }

    pub fn approve(env: Env, from: Address, spender: Address, amount: i128, live_until_ledger: u32) {
        from.require_auth();

        if amount < 0 {
            panic!("Negative amount");
        }

        let key = DataKey::Allowance(from.clone(), spender.clone());
        env.storage().persistent().set(&key, &amount);

        // Set expiration for the allowance
        env.storage().persistent().extend_ttl(&key, live_until_ledger, live_until_ledger);

        env.events().publish((APPROVE,), (from, spender, amount));
    }

    pub fn balance(env: Env, id: Address) -> i128 {
        let key = DataKey::Balance(id);
        env.storage().persistent().get(&key).unwrap_or(0)
    }

    pub fn transfer(env: Env, from: Address, to: Address, amount: i128) {
        from.require_auth();
        Self::transfer_internal(&env, &from, &to, amount);
    }

    pub fn transfer_from(env: Env, spender: Address, from: Address, to: Address, amount: i128) {
        spender.require_auth();

        let allowance_key = DataKey::Allowance(from.clone(), spender.clone());
        let allowance = env.storage().persistent().get(&allowance_key).unwrap_or(0);

        if allowance < amount {
            panic!("Insufficient allowance");
        }

        env.storage().persistent().set(&allowance_key, &(allowance - amount));
        Self::transfer_internal(&env, &from, &to, amount);
    }

    pub fn burn(env: Env, from: Address, amount: i128) {
        from.require_auth();
        Self::burn_internal(&env, &from, amount);
    }

    pub fn burn_from(env: Env, spender: Address, from: Address, amount: i128) {
        spender.require_auth();

        let allowance_key = DataKey::Allowance(from.clone(), spender.clone());
        let allowance = env.storage().persistent().get(&allowance_key).unwrap_or(0);

        if allowance < amount {
            panic!("Insufficient allowance");
        }

        env.storage().persistent().set(&allowance_key, &(allowance - amount));
        Self::burn_internal(&env, &from, amount);
    }

    pub fn decimals(env: Env) -> u32 {
        env.storage().instance().get(&DECIMALS).unwrap()
    }

    pub fn name(env: Env) -> String {
        env.storage().instance().get(&NAME).unwrap()
    }

    pub fn symbol(env: Env) -> String {
        env.storage().instance().get(&SYMBOL).unwrap()
    }

    // Stellar Asset Extension Functions

    pub fn mint(env: Env, to: Address, amount: i128) {
        Self::require_admin(&env);
        Self::mint_internal(&env, &to, amount);
    }

    pub fn clawback(env: Env, from: Address, amount: i128) {
        Self::require_admin(&env);
        Self::clawback_internal(&env, &from, amount);
    }

    pub fn set_authorized(env: Env, id: Address, authorized: bool) {
        Self::require_admin(&env);
        let key = DataKey::Authorized(id.clone());
        env.storage().persistent().set(&key, &authorized);

        env.events().publish((symbol_short!("AUTH_SET"),), (id, authorized));
    }

    pub fn authorized(env: Env, id: Address) -> bool {
        let key = DataKey::Authorized(id);
        env.storage().persistent().get(&key).unwrap_or(true)
    }

    pub fn set_admin(env: Env, new_admin: Address) {
        Self::require_admin(&env);
        env.storage().instance().set(&ADMIN, &new_admin);
    }

    pub fn admin(env: Env) -> Address {
        env.storage().instance().get(&ADMIN).unwrap()
    }

    // SRWA-specific Functions

    pub fn set_compliance(env: Env, compliance_contract: Address) {
        Self::require_admin(&env);
        env.storage().instance().set(&COMPLIANCE, &compliance_contract);
    }

    pub fn get_compliance(env: Env) -> Address {
        env.storage().instance().get(&COMPLIANCE).unwrap()
    }

    pub fn pause(env: Env, paused: bool) {
        Self::require_admin(&env);
        env.storage().instance().set(&PAUSED, &paused);

        env.events().publish(
            (if paused { symbol_short!("PAUSED") } else { symbol_short!("UNPAUSED") },),
            ()
        );
    }

    pub fn is_paused(env: Env) -> bool {
        env.storage().instance().get(&PAUSED).unwrap_or(false)
    }

    pub fn freeze(env: Env, address: Address, amount: Option<i128>) {
        Self::require_admin(&env);
        let key = DataKey::Frozen(address.clone());

        match amount {
            Some(amt) => env.storage().persistent().set(&key, &amt),
            None => env.storage().persistent().set(&key, &i128::MAX), // Full freeze
        }

        env.events().publish((symbol_short!("FROZEN"),), (address, amount));
    }

    pub fn unfreeze(env: Env, address: Address) {
        Self::require_admin(&env);
        let key = DataKey::Frozen(address.clone());
        env.storage().persistent().remove(&key);

        env.events().publish((symbol_short!("UNFROZEN"),), address);
    }

    pub fn is_frozen(env: Env, address: Address) -> bool {
        let key = DataKey::Frozen(address);
        env.storage().persistent().has(&key)
    }

    pub fn get_frozen_amount(env: Env, address: Address) -> i128 {
        let key = DataKey::Frozen(address);
        env.storage().persistent().get(&key).unwrap_or(0)
    }

    pub fn total_supply(env: Env) -> i128 {
        env.storage().instance().get(&TOTAL_SUPPLY).unwrap_or(0)
    }

    pub fn force_transfer(env: Env, from: Address, to: Address, amount: i128) {
        Self::require_admin(&env);
        Self::transfer_without_compliance(&env, &from, &to, amount);
    }

    // Internal Functions

    fn transfer_internal(env: &Env, from: &Address, to: &Address, amount: i128) {
        if amount < 0 {
            panic!("Negative amount");
        }

        if amount == 0 {
            return;
        }

        // Check if paused
        if Self::is_paused(env.clone()) {
            panic!("Token is paused");
        }

        // Check authorization
        if !Self::authorized(env.clone(), from.clone()) || !Self::authorized(env.clone(), to.clone()) {
            panic!("Not authorized");
        }

        // Check compliance before transfer
        let compliance_contract: Address = env.storage().instance().get(&COMPLIANCE).unwrap();
        if !Self::check_compliance(env, &compliance_contract, from, to, amount) {
            panic!("Transfer not compliant");
        }

        // Check frozen status
        let frozen_amount = Self::get_frozen_amount(env.clone(), from.clone());
        let from_balance = Self::balance(env.clone(), from.clone());
        if frozen_amount > 0 && (from_balance - amount) < frozen_amount {
            panic!("Transfer would violate freeze");
        }

        // Perform transfer
        let from_key = DataKey::Balance(from.clone());
        let to_key = DataKey::Balance(to.clone());

        let from_balance = env.storage().persistent().get(&from_key).unwrap_or(0);
        let to_balance = env.storage().persistent().get(&to_key).unwrap_or(0);

        if from_balance < amount {
            panic!("Insufficient balance");
        }

        env.storage().persistent().set(&from_key, &(from_balance - amount));
        env.storage().persistent().set(&to_key, &(to_balance + amount));

        // Notify compliance contract
        Self::notify_compliance_transferred(env, &compliance_contract, from, to, amount);

        env.events().publish((TRANSFER,), (from.clone(), to.clone(), amount));
    }

    fn transfer_without_compliance(env: &Env, from: &Address, to: &Address, amount: i128) {
        if amount < 0 {
            panic!("Negative amount");
        }

        let from_key = DataKey::Balance(from.clone());
        let to_key = DataKey::Balance(to.clone());

        let from_balance = env.storage().persistent().get(&from_key).unwrap_or(0);
        let to_balance = env.storage().persistent().get(&to_key).unwrap_or(0);

        if from_balance < amount {
            panic!("Insufficient balance");
        }

        env.storage().persistent().set(&from_key, &(from_balance - amount));
        env.storage().persistent().set(&to_key, &(to_balance + amount));

        env.events().publish((TRANSFER,), (from.clone(), to.clone(), amount));
    }

    fn mint_internal(env: &Env, to: &Address, amount: i128) {
        if amount < 0 {
            panic!("Negative amount");
        }

        // Check authorization
        if !Self::authorized(env.clone(), to.clone()) {
            panic!("Not authorized");
        }

        let to_key = DataKey::Balance(to.clone());
        let balance = env.storage().persistent().get(&to_key).unwrap_or(0);
        env.storage().persistent().set(&to_key, &(balance + amount));

        let total_supply = Self::total_supply(env.clone());
        env.storage().instance().set(&TOTAL_SUPPLY, &(total_supply + amount));

        // Notify compliance contract
        let compliance_contract: Address = env.storage().instance().get(&COMPLIANCE).unwrap();
        Self::notify_compliance_created(env, &compliance_contract, to, amount);

        env.events().publish((MINT,), (to.clone(), amount));
    }

    fn burn_internal(env: &Env, from: &Address, amount: i128) {
        if amount < 0 {
            panic!("Negative amount");
        }

        let from_key = DataKey::Balance(from.clone());
        let balance = env.storage().persistent().get(&from_key).unwrap_or(0);

        if balance < amount {
            panic!("Insufficient balance");
        }

        env.storage().persistent().set(&from_key, &(balance - amount));

        let total_supply = Self::total_supply(env.clone());
        env.storage().instance().set(&TOTAL_SUPPLY, &(total_supply - amount));

        // Notify compliance contract
        let compliance_contract: Address = env.storage().instance().get(&COMPLIANCE).unwrap();
        Self::notify_compliance_destroyed(env, &compliance_contract, from, amount);

        env.events().publish((BURN,), (from.clone(), amount));
    }

    fn clawback_internal(env: &Env, from: &Address, amount: i128) {
        if amount < 0 {
            panic!("Negative amount");
        }

        let from_key = DataKey::Balance(from.clone());
        let balance = env.storage().persistent().get(&from_key).unwrap_or(0);

        if balance < amount {
            panic!("Insufficient balance");
        }

        env.storage().persistent().set(&from_key, &(balance - amount));

        let total_supply = Self::total_supply(env.clone());
        env.storage().instance().set(&TOTAL_SUPPLY, &(total_supply - amount));

        env.events().publish((CLAWBACK,), (from.clone(), amount));
    }

    fn check_compliance(env: &Env, compliance_contract: &Address, from: &Address, to: &Address, amount: i128) -> bool {
        // This would call the compliance contract's can_transfer function
        // For now, simplified implementation
        true
    }

    fn notify_compliance_transferred(env: &Env, compliance_contract: &Address, from: &Address, to: &Address, amount: i128) {
        // This would call the compliance contract's transferred function
        // For now, simplified implementation
    }

    fn notify_compliance_created(env: &Env, compliance_contract: &Address, to: &Address, amount: i128) {
        // This would call the compliance contract's created function
        // For now, simplified implementation
    }

    fn notify_compliance_destroyed(env: &Env, compliance_contract: &Address, from: &Address, amount: i128) {
        // This would call the compliance contract's destroyed function
        // For now, simplified implementation
    }

    fn require_admin(env: &Env) {
        let admin: Address = env.storage().instance().get(&ADMIN).unwrap();
        admin.require_auth();
    }
}

mod test;