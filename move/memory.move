module riot::memory {
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use std::string::{Self, String};

    public struct Memory has key {
        id: UID,
        wallet: address,
        agent_id: String,
        messages_summary: String,  // ← Ganti dari vector<String>
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
        messages_summary: String,  // ← Single string
        summary: String,
        ctx: &mut TxContext
    ) {
        let timestamp = tx_context::epoch(ctx);
        
        let memory = Memory {
            id: object::new(ctx),
            wallet,
            agent_id,
            messages_summary,
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
}