module riot::memory {
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use std::string::{Self, String};
    use std::vector;

    public struct Memory has key {
        id: UID,
        wallet: address,
        agent_id: String,
        messages: vector<String>,
        summary: String,
        timestamp: u64,
    }

    public struct MemoryStored has copy, drop {
        memory_id: address,
        wallet: address,
        agent_id: String,
        timestamp: u64,
    }

    public fun store_memory(
        wallet: address,
        agent_id: String,
        messages: vector<String>,
        summary: String,
        ctx: &mut TxContext
    ) {
        let timestamp = tx_context::epoch(ctx);
        
        let memory = Memory {
            id: object::new(ctx),
            wallet,
            agent_id,
            messages,
            summary,
            timestamp,
        };

        let memory_id = object::id_address(&memory);
        
        sui::event::emit(MemoryStored {
            memory_id,
            wallet,
            agent_id,
            timestamp,
        });

        transfer::transfer(memory, wallet);
    }

    public fun get_memory_summary(memory: &Memory): (address, String, String, u64) {
        (memory.wallet, memory.agent_id, memory.summary, memory.timestamp)
    }

    public fun is_owner(memory: &Memory, wallet: address): bool {
        memory.wallet == wallet
    }
}
