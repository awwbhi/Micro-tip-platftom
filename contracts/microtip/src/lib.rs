//! Soroban Micro-tip Platform Smart Contract
//! 
//! This contract enables users to send micro-tips (small amounts of cryptocurrency)
//! to recipients on the Stellar network. It provides functionality for:
//! - Sending tips with custom messages
//! - Managing tip balances and withdrawals
//! - Tracking tip history and statistics
//! - Supporting multiple token types

#![no_std]

// Import necessary Soroban SDK modules
use soroban_sdk::{
    contract, contractimpl, contracttype, Address, Env, String, Symbol, Vec, Map,
    token::Client as TokenClient, TryFromVal, FromVal,
};

// ============================================================================
// DATA STRUCTURES
// ============================================================================

/// Represents a single tip transaction in the system
/// Contains metadata about who tipped whom and when
#[contracttype]
#[derive(Clone, Debug)]
pub struct Tip {
    /// Address of the person sending the tip
    from: Address,
    /// Address of the tip recipient
    to: Address,
    /// Amount of the tip in the smallest unit of the token
    amount: i128,
    /// Message attached to the tip (optional, up to 256 characters)
    message: String,
    /// Timestamp (in seconds) when the tip was sent
    timestamp: u64,
    /// Token contract address used for this tip
    token: Address,
}

/// Represents the balance information for a user
/// Tracks accumulated tips and withdrawal information
#[contracttype]
#[derive(Clone, Debug)]
pub struct Balance {
    /// Total amount of tips received (never decreases unless withdrawn)
    total_received: i128,
    /// Amount currently available for withdrawal
    available: i128,
    /// Amount that has been withdrawn by the user
    withdrawn: i128,
    /// Token address associated with this balance
    token: Address,
}

/// User profile containing aggregated statistics
/// Provides quick access to user activity information
#[contracttype]
#[derive(Clone, Debug)]
pub struct UserProfile {
    /// Total number of tips sent by this user
    tips_sent: u32,
    /// Total number of tips received by this user
    tips_received: u32,
    /// Total amount sent in tips (across all tokens)
    total_sent: i128,
    /// Total amount received in tips (across all tokens)
    total_received: i128,
    /// Timestamp of the user's first interaction with the contract
    first_interaction: u64,
}

// ============================================================================
// CONTRACT STATE
// ============================================================================

/// Main contract struct that implements all Soroban contract methods
#[contract]
pub struct MicrotipContract;

// ============================================================================
// CONTRACT IMPLEMENTATION
// ============================================================================

#[contractimpl]
impl MicrotipContract {
    /// Initializes the contract
    /// This function should be called once when deploying the contract
    /// 
    /// # Arguments
    /// * `env` - The Soroban environment
    pub fn init(env: Env) {
        // Initialize contract state if needed
        // This is where you would set up initial configuration
        let contract_initialized = Symbol::new(&env, "init");
        env.storage().instance().set(&contract_initialized, &true);
    }

    /// Sends a tip from one address to another
    /// This is the main function of the microtip platform
    /// 
    /// # Arguments
    /// * `env` - The Soroban environment
    /// * `from` - Address of the person sending the tip
    /// * `to` - Address of the tip recipient
    /// * `token` - Contract address of the token to send
    /// * `amount` - Amount of the tip (in smallest token units)
    /// * `message` - Optional message to attach to the tip (max 256 chars)
    /// 
    /// # Returns
    /// Returns the unique ID of the created tip
    /// 
    /// # Panics
    /// - If amount is zero or negative
    /// - If sender doesn't have sufficient balance
    /// - If 'from' and 'to' are the same address
    pub fn send_tip(
        env: Env,
        from: Address,
        to: Address,
        token: Address,
        amount: i128,
        message: String,
    ) -> u64 {
        // Verify the sender (authorization check)
        from.require_auth();

        // Validation: Ensure amount is positive
        assert!(amount > 0, "Tip amount must be greater than zero");

        // Validation: Prevent self-tipping
        assert!(from != to, "Cannot send a tip to yourself");

        // Validation: Ensure message is not excessively long
        assert!(message.len() <= 256, "Message must be 256 characters or less");

        // Get the token contract client to handle transfers
        let token_client = TokenClient::new(&env, &token);

        // Transfer the tip amount from sender to contract
        token_client.transfer(&from, &env.current_contract_address(), &amount);

        // Get the current timestamp for recording when the tip was sent
        let timestamp = env.ledger().timestamp();

        // Generate a unique tip ID (could be based on ledger sequence + counter)
        let tip_id = env.ledger().sequence();

        // Create a Tip structure containing all the metadata
        let tip = Tip {
            from: from.clone(),
            to: to.clone(),
            amount,
            message: message.clone(),
            timestamp,
            token: token.clone(),
        };

        // Store the tip in contract storage using a unique key
        let tip_key = Symbol::new(&env, "tip");
        let mut tips: Vec<Tip> = env
            .storage()
            .instance()
            .get(&tip_key)
            .unwrap_or_else(|| Vec::new(&env));
        tips.push_back(tip);
        env.storage().instance().set(&tip_key, &tips);

        // Update the recipient's balance
        Self::update_balance(&env, &to, &token, amount, true);

        // Update user profiles for statistics tracking
        Self::update_sender_profile(&env, &from, amount);
        Self::update_recipient_profile(&env, &to, amount);

        // Emit an event (if using Soroban event system)
        // This allows off-chain listeners to track tips in real-time
        env.events().publish((Symbol::new(&env, "tip_sent"),), (from, to, amount, timestamp));

        // Return the tip ID for future reference
        tip_id
    }

    /// Allows a user to withdraw their accumulated tip balance
    /// After withdrawal, the amount is transferred to the user's address
    /// 
    /// # Arguments
    /// * `env` - The Soroban environment
    /// * `user` - Address of the user withdrawing funds
    /// * `token` - Token contract address to withdraw
    /// * `amount` - Amount to withdraw
    /// 
    /// # Panics
    /// - If user doesn't have sufficient available balance
    pub fn withdraw(
        env: Env,
        user: Address,
        token: Address,
        amount: i128,
    ) {
        // Verify authorization - only the user can withdraw their own funds
        user.require_auth();

        // Validation: Ensure amount is positive
        assert!(amount > 0, "Withdrawal amount must be greater than zero");

        // Retrieve the user's current balance for this token
        let balance_key = Symbol::new(&env, &format!("balance_{}_{}", user, token));
        let mut balance: Balance = env
            .storage()
            .instance()
            .get(&balance_key)
            .expect("User has no balance to withdraw");

        // Validation: Ensure user has sufficient available balance
        assert!(
            balance.available >= amount,
            "Insufficient available balance for withdrawal"
        );

        // Reduce the available balance
        balance.available -= amount;
        // Track total withdrawn
        balance.withdrawn += amount;

        // Update the balance in storage
        env.storage().instance().set(&balance_key, &balance);

        // Create token client to handle the actual transfer
        let token_client = TokenClient::new(&env, &token);

        // Transfer the withdrawn amount from contract to user
        token_client.transfer(&env.current_contract_address(), &user, &amount);

        // Emit withdrawal event for tracking
        let timestamp = env.ledger().timestamp();
        env.events().publish(
            (Symbol::new(&env, "withdrawal"),),
            (user, token, amount, timestamp),
        );
    }

    /// Retrieves the balance information for a user and specific token
    /// Shows total received, available, and withdrawn amounts
    /// 
    /// # Arguments
    /// * `env` - The Soroban environment
    /// * `user` - Address of the user
    /// * `token` - Token contract address
    /// 
    /// # Returns
    /// A Balance structure containing the user's balance information
    pub fn get_balance(env: Env, user: Address, token: Address) -> Balance {
        // Construct the storage key for this user's balance
        let balance_key = Symbol::new(&env, &format!("balance_{}_{}", user, token));

        // Retrieve from storage, or return a default (zero) balance if not found
        env.storage()
            .instance()
            .get(&balance_key)
            .unwrap_or_else(|| Balance {
                total_received: 0,
                available: 0,
                withdrawn: 0,
                token: token.clone(),
            })
    }

    /// Retrieves the user profile with aggregated statistics
    /// Useful for displaying user activity on a dashboard
    /// 
    /// # Arguments
    /// * `env` - The Soroban environment
    /// * `user` - Address of the user
    /// 
    /// # Returns
    /// A UserProfile structure containing activity statistics
    pub fn get_user_profile(env: Env, user: Address) -> UserProfile {
        // Construct the storage key for this user's profile
        let profile_key = Symbol::new(&env, &format!("profile_{}", user));

        // Retrieve from storage, or return a default profile if not found
        env.storage()
            .instance()
            .get(&profile_key)
            .unwrap_or_else(|| UserProfile {
                tips_sent: 0,
                tips_received: 0,
                total_sent: 0,
                total_received: 0,
                first_interaction: env.ledger().timestamp(),
            })
    }

    /// Retrieves all tips sent to a specific user
    /// Useful for displaying tip history on user dashboards
    /// 
    /// # Arguments
    /// * `env` - The Soroban environment
    /// * `user` - Address to get tips for
    /// 
    /// # Returns
    /// A vector of Tip structures received by the user
    pub fn get_tips_for_user(env: Env, user: Address) -> Vec<Tip> {
        // Retrieve all tips from storage
        let tip_key = Symbol::new(&env, "tip");
        let all_tips: Vec<Tip> = env
            .storage()
            .instance()
            .get(&tip_key)
            .unwrap_or_else(|| Vec::new(&env));

        // Filter tips to only include those received by the specified user
        let mut user_tips = Vec::new(&env);
        for tip in all_tips.iter() {
            if tip.to == user {
                user_tips.push_back(tip);
            }
        }

        user_tips
    }

    /// Retrieves the total number of tips in the system
    /// Useful for displaying platform statistics
    /// 
    /// # Arguments
    /// * `env` - The Soroban environment
    /// 
    /// # Returns
    /// The count of all tips ever sent on the platform
    pub fn get_total_tips_count(env: Env) -> u32 {
        // Retrieve all tips from storage
        let tip_key = Symbol::new(&env, "tip");
        let tips: Vec<Tip> = env
            .storage()
            .instance()
            .get(&tip_key)
            .unwrap_or_else(|| Vec::new(&env));

        // Return the length as the count
        tips.len() as u32
    }

    // ========================================================================
    // INTERNAL HELPER FUNCTIONS
    // ========================================================================

    /// Updates a user's balance when they receive a tip
    /// Internal function called by send_tip
    /// 
    /// # Arguments
    /// * `env` - The Soroban environment
    /// * `user` - Address of the user receiving the tip
    /// * `token` - Token contract address
    /// * `amount` - Amount to add to the balance
    /// * `is_deposit` - Whether this is a deposit (true) or withdrawal (false)
    fn update_balance(env: &Env, user: &Address, token: &Address, amount: i128, is_deposit: bool) {
        // Construct the storage key for this balance
        let balance_key = Symbol::new(env, &format!("balance_{}_{}", user, token));

        // Retrieve existing balance or create a new one
        let mut balance: Balance = env
            .storage()
            .instance()
            .get(&balance_key)
            .unwrap_or_else(|| Balance {
                total_received: 0,
                available: 0,
                withdrawn: 0,
                token: token.clone(),
            });

        // Update balance values
        if is_deposit {
            balance.total_received += amount;
            balance.available += amount;
        }

        // Save the updated balance to storage
        env.storage().instance().set(&balance_key, &balance);
    }

    /// Updates the sender's user profile statistics
    /// Internal function called by send_tip
    /// 
    /// # Arguments
    /// * `env` - The Soroban environment
    /// * `user` - Address of the user sending the tip
    /// * `amount` - Amount of the tip sent
    fn update_sender_profile(env: &Env, user: &Address, amount: i128) {
        // Construct the storage key for this user's profile
        let profile_key = Symbol::new(env, &format!("profile_{}", user));

        // Retrieve existing profile or create a new one
        let mut profile: UserProfile = env
            .storage()
            .instance()
            .get(&profile_key)
            .unwrap_or_else(|| UserProfile {
                tips_sent: 0,
                tips_received: 0,
                total_sent: 0,
                total_received: 0,
                first_interaction: env.ledger().timestamp(),
            });

        // Increment send statistics
        profile.tips_sent += 1;
        profile.total_sent += amount;

        // Save the updated profile to storage
        env.storage().instance().set(&profile_key, &profile);
    }

    /// Updates the recipient's user profile statistics
    /// Internal function called by send_tip
    /// 
    /// # Arguments
    /// * `env` - The Soroban environment
    /// * `user` - Address of the user receiving the tip
    /// * `amount` - Amount of the tip received
    fn update_recipient_profile(env: &Env, user: &Address, amount: i128) {
        // Construct the storage key for this user's profile
        let profile_key = Symbol::new(env, &format!("profile_{}", user));

        // Retrieve existing profile or create a new one
        let mut profile: UserProfile = env
            .storage()
            .instance()
            .get(&profile_key)
            .unwrap_or_else(|| UserProfile {
                tips_sent: 0,
                tips_received: 0,
                total_sent: 0,
                total_received: 0,
                first_interaction: env.ledger().timestamp(),
            });

        // Increment receive statistics
        profile.tips_received += 1;
        profile.total_received += amount;

        // Save the updated profile to storage
        env.storage().instance().set(&profile_key, &profile);
    }
}

// ============================================================================
// TESTS MODULE
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::testutils::{Address as _, Ledger};

    #[test]
    fn test_send_tip() {
        // Test the send_tip functionality
        // This would include mocking the environment and token contracts
        // For a complete implementation, you would test:
        // 1. Successful tip sending
        // 2. Balance updates
        // 3. Profile updates
        // 4. Event emissions
    }

    #[test]
    fn test_withdraw() {
        // Test the withdraw functionality
        // This would include:
        // 1. Successful withdrawal
        // 2. Insufficient balance scenarios
        // 3. Proper balance deduction
    }

    #[test]
    fn test_validations() {
        // Test input validations
        // This would include:
        // 1. Zero or negative amounts
        // 2. Self-tipping prevention
        // 3. Message length limits
    }
}
