use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, Address, Env, Symbol, Vec
};
use crate::TransferContext;

const ADMIN: Symbol = symbol_short!("ADMIN");
const LOCKUPS: Symbol = symbol_short!("LOCKUPS");
const VESTING_SCHEDULES: Symbol = symbol_short!("VESTING");

#[derive(Clone, Debug, Eq, PartialEq)]
#[contracttype]
pub struct LockupSchedule {
    pub holder: Address,
    pub total_amount: i128,
    pub released_amount: i128,
    pub start_time: u64,
    pub cliff_time: u64,
    pub end_time: u64,
    pub revocable: bool,
    pub revoked: bool,
}

#[derive(Clone, Debug, Eq, PartialEq)]
#[contracttype]
pub struct VestingPeriod {
    pub release_time: u64,
    pub amount: i128,
    pub released: bool,
}

#[contract]
pub struct LockupModule;

#[contractimpl]
impl LockupModule {
    pub fn initialize(env: Env, admin: Address) {
        if env.storage().instance().has(&ADMIN) {
            panic!("Already initialized");
        }
        env.storage().instance().set(&ADMIN, &admin);
    }

    pub fn create_lockup(
        env: Env,
        token: Address,
        holder: Address,
        amount: i128,
        start_time: u64,
        cliff_time: u64,
        end_time: u64,
        revocable: bool,
    ) {
        Self::require_admin(&env);

        let lockup = LockupSchedule {
            holder: holder.clone(),
            total_amount: amount,
            released_amount: 0,
            start_time,
            cliff_time,
            end_time,
            revocable,
            revoked: false,
        };

        let key = (LOCKUPS, token.clone(), holder.clone());
        env.storage().persistent().set(&key, &lockup);

        env.events().publish(
            (symbol_short!("LOCKUP_CREATE"),),
            (token, holder, amount, start_time, cliff_time, end_time)
        );
    }

    pub fn create_vesting_schedule(
        env: Env,
        token: Address,
        holder: Address,
        schedule: Vec<VestingPeriod>,
    ) {
        Self::require_admin(&env);

        let key = (VESTING_SCHEDULES, token.clone(), holder.clone());
        env.storage().persistent().set(&key, &schedule);

        env.events().publish(
            (symbol_short!("VESTING_CREATE"),),
            (token, holder, schedule.len())
        );
    }

    pub fn revoke_lockup(env: Env, token: Address, holder: Address) {
        Self::require_admin(&env);

        let key = (LOCKUPS, token.clone(), holder.clone());
        if let Some(mut lockup) = env.storage().persistent().get::<_, LockupSchedule>(&key) {
            if lockup.revocable && !lockup.revoked {
                lockup.revoked = true;
                env.storage().persistent().set(&key, &lockup);

                env.events().publish(
                    (symbol_short!("LOCKUP_REVOKE"),),
                    (token, holder)
                );
            }
        }
    }

    pub fn release_vested_tokens(env: Env, token: Address, holder: Address) -> i128 {
        let current_time = env.ledger().timestamp();
        let mut total_released = 0i128;

        // Check linear vesting lockup
        let lockup_key = (LOCKUPS, token.clone(), holder.clone());
        if let Some(mut lockup) = env.storage().persistent().get::<_, LockupSchedule>(&lockup_key) {
            if !lockup.revoked {
                let releasable = Self::calculate_releasable_amount(&lockup, current_time);
                if releasable > 0 {
                    lockup.released_amount += releasable;
                    env.storage().persistent().set(&lockup_key, &lockup);
                    total_released += releasable;
                }
            }
        }

        // Check milestone vesting schedule
        let vesting_key = (VESTING_SCHEDULES, token.clone(), holder.clone());
        if let Some(mut schedule) = env.storage().persistent().get::<_, Vec<VestingPeriod>>(&vesting_key) {
            let mut updated = false;
            for i in 0..schedule.len() {
                let mut period = schedule.get(i).unwrap();
                if !period.released && current_time >= period.release_time {
                    period.released = true;
                    schedule.set(i, period.clone());
                    total_released += period.amount;
                    updated = true;
                }
            }
            if updated {
                env.storage().persistent().set(&vesting_key, &schedule);
            }
        }

        if total_released > 0 {
            env.events().publish(
                (symbol_short!("TOKENS_RELEASED"),),
                (token, holder, total_released)
            );
        }

        total_released
    }

    pub fn get_locked_amount(env: Env, token: Address, holder: Address) -> i128 {
        let current_time = env.ledger().timestamp();
        let mut locked_amount = 0i128;

        // Check linear vesting lockup
        let lockup_key = (LOCKUPS, token.clone(), holder.clone());
        if let Some(lockup) = env.storage().persistent().get::<_, LockupSchedule>(&lockup_key) {
            if !lockup.revoked {
                let releasable = Self::calculate_releasable_amount(&lockup, current_time);
                locked_amount += lockup.total_amount - lockup.released_amount - releasable;
            }
        }

        // Check milestone vesting schedule
        let vesting_key = (VESTING_SCHEDULES, token.clone(), holder.clone());
        if let Some(schedule) = env.storage().persistent().get::<_, Vec<VestingPeriod>>(&vesting_key) {
            for i in 0..schedule.len() {
                let period = schedule.get(i).unwrap();
                if !period.released && current_time < period.release_time {
                    locked_amount += period.amount;
                }
            }
        }

        locked_amount
    }

    pub fn check_transfer(env: Env, context: TransferContext) -> bool {
        let locked_amount = Self::get_locked_amount(&env, &context.token, &context.from);

        // This would need integration with the token contract to check actual balance
        // For now, simplified check assuming transfer amount doesn't exceed unlocked tokens
        // In reality, we'd need: balance - locked_amount >= transfer_amount

        true // Simplified for now
    }

    fn calculate_releasable_amount(lockup: &LockupSchedule, current_time: u64) -> i128 {
        if current_time < lockup.cliff_time {
            return 0;
        }

        if current_time >= lockup.end_time {
            return lockup.total_amount - lockup.released_amount;
        }

        // Linear vesting between cliff and end
        let vesting_duration = lockup.end_time - lockup.cliff_time;
        let elapsed_since_cliff = current_time - lockup.cliff_time;

        let total_vested = (lockup.total_amount * elapsed_since_cliff as i128) / vesting_duration as i128;
        let releasable = total_vested - lockup.released_amount;

        releasable.max(0)
    }

    fn require_admin(env: &Env) {
        let admin: Address = env.storage().instance().get(&ADMIN).unwrap();
        admin.require_auth();
    }
}