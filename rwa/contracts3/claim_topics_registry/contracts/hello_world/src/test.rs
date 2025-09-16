// #![cfg(test)]

// use super::*;
// use soroban_sdk::{testutils::Address as _, Address, Env, String};

// #[test]
// fn test_claim_topics_registry() {
//     let env = Env::default();
//     let contract_id = env.register(ClaimTopicsRegistry, ());
//     let client = ClaimTopicsRegistryClient::new(&env, &contract_id);

//     let admin = Address::generate(&env);

//     // Initialize
//     client.initialize(&admin);

//     // Mock admin authorization
//     env.mock_all_auths();

//     // Add claim topic
//     let topic_id = 1u32;
//     let topic_name = String::from_str(&env, "KYC");

//     client.add_claim_topic(&topic_id, &topic_name);

//     // Check topic exists
//     assert!(client.has_claim_topic(&topic_id));
//     assert_eq!(client.get_claim_topic(&topic_id).unwrap(), topic_name);

//     // List topics should include our topic
//     let topics = client.list_claim_topics();
//     assert!(topics.contains(&topic_id));

//     // Remove topic
//     client.remove_claim_topic(&topic_id);

//     // Check topic no longer exists
//     assert!(!client.has_claim_topic(&topic_id));
//     assert!(client.get_claim_topic(&topic_id).is_none());
// }