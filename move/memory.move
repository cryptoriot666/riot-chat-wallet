module riot::memory {
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use std::string::{Self, String};
    use std::vector;

    /// Memory object stored on Sui blockchain
    struct Memory has key {
        id: UID,
        wallet: address,
        agent_id: String,
        messages: vector<String>,
        summary: String,
        timestamp: u64,
    }

    /// Event emitted when memory is stored
    struct MemoryStored has copy, drop {
        memory_id: address,
        wallet: address,
        agent_id: String,
        timestamp: u64,
    }

    /// Store memory on-chain
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

        // Emit event for indexing
        sui::event::emit(MemoryStored {
            memory_id,
            wallet,
            agent_id,
            timestamp,
        });

        // Transfer to wallet owner
        transfer::transfer(memory, wallet);
    }

    /// Get memory details (for verification)
    public fun get_memory_summary(memory: &Memory): (address, String, String, u64) {
        (memory.wallet, memory.agent_id, memory.summary, memory.timestamp)
    }

    /// Check if memory belongs to wallet
    public fun is_owner(memory: &Memory, wallet: address): bool {
        memory.wallet == wallet
    }
}
