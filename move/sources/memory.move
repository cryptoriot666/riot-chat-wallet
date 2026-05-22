module riot::memory {
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::event;
    use std::string::{Self, String};
    use std::vector;

    // ═══════════════════════════════════════════════════════════════
    // ORIGINAL STRUCTS (exactly as deployed v1)
    // ═══════════════════════════════════════════════════════════════

    public struct Memory has key {
        id: UID,
        wallet: address,
        agent_id: String,
        messages: vector<String>,
        summary: String,
        timestamp: u64,
    }

    // ═══════════════════════════════════════════════════════════════
    // NEW STRUCTS (v2 additions only)
    // ═══════════════════════════════════════════════════════════════

    public struct MemoryArchive has key {
        id: UID,
        wallet: address,
        memories: vector<address>,
        session_count: u64,
        last_updated: u64,
        total_messages: u64,
    }

    // ═══════════════════════════════════════════════════════════════
    // ORIGINAL EVENTS (exactly as deployed v1)
    // ═══════════════════════════════════════════════════════════════

    public struct MemoryStored has copy, drop {
        memory_id: address,
        wallet: address,
        agent_id: String,
        timestamp: u64,
    }

    // ═══════════════════════════════════════════════════════════════
    // NEW EVENTS (v2 additions only)
    // ═══════════════════════════════════════════════════════════════

    public struct BatchMemoryStored has copy, drop {
        archive_id: address,
        wallet: address,
        agent_id: String,
        message_count: u64,
        session_id: String,
        timestamp: u64,
        tx_digest: String,
    }

    // ═══════════════════════════════════════════════════════════════
    // ORIGINAL FUNCTIONS (exactly as deployed v1)
    // ═══════════════════════════════════════════════════════════════

    /// Store single memory (ORIGINAL v1 signature)
    public fun store_memory(
        wallet: address,
        agent_id: String,
        messages: vector<String>,
        summary: String,
        ctx: &mut TxContext
    ) {
        let memory = Memory {
            id: object::new(ctx),
            wallet,
            agent_id,
            messages,
            summary,
            timestamp: tx_context::epoch(ctx),
        };
        let memory_id = object::id_address(&memory);
        transfer::transfer(memory, wallet);
        event::emit(MemoryStored {
            memory_id,
            wallet,
            agent_id,
            timestamp: tx_context::epoch(ctx),
        });
    }

    /// Get memory summary (ORIGINAL v1 - 4 return types)
    public fun get_memory_summary(memory: &Memory): (address, String, String, u64) {
        (memory.wallet, memory.agent_id, memory.summary, memory.timestamp)
    }

    /// Check if caller is owner (ORIGINAL v1)
    public fun is_owner(memory: &Memory, caller: address): bool {
        memory.wallet == caller
    }

    // ═══════════════════════════════════════════════════════════════
    // NEW FUNCTIONS (v2 additions only)
    // ═══════════════════════════════════════════════════════════════

    /// Create a MemoryArchive for a wallet (NEW v2)
    public fun create_archive(ctx: &mut TxContext) {
        let archive = MemoryArchive {
            id: object::new(ctx),
            wallet: tx_context::sender(ctx),
            memories: vector::empty(),
            session_count: 0,
            last_updated: tx_context::epoch(ctx),
            total_messages: 0,
        };
        transfer::transfer(archive, tx_context::sender(ctx));
    }

    /// Batch store multiple memories in ONE transaction (NEW v2)
    public fun batch_store_memory(
        archive: &mut MemoryArchive,
        agent_id: String,
        mut messages: vector<String>,
        session_id: String,
        tx_digest: String,
        ctx: &mut TxContext
    ) {
        let message_count = vector::length(&messages);
        let wallet = archive.wallet;
        let mut i = 0;
        while (i < message_count) {
            let content = vector::pop_back(&mut messages);
            let mut single_messages = vector::empty<String>();
            vector::push_back(&mut single_messages, content);
            let memory = Memory {
                id: object::new(ctx),
                wallet,
                agent_id: agent_id,
                messages: single_messages,
                summary: session_id,
                timestamp: tx_context::epoch(ctx),
            };
            let memory_id = object::id_address(&memory);
            vector::push_back(&mut archive.memories, memory_id);
            transfer::transfer(memory, wallet);
            i = i + 1;
        };
        archive.session_count = archive.session_count + 1;
        archive.last_updated = tx_context::epoch(ctx);
        archive.total_messages = archive.total_messages + message_count;
        event::emit(BatchMemoryStored {
            archive_id: object::id_address(archive),
            wallet,
            agent_id,
            message_count,
            session_id,
            timestamp: tx_context::epoch(ctx),
            tx_digest,
        });
    }

    /// Get archive stats (NEW v2)
    public fun get_archive_stats(archive: &MemoryArchive): (address, u64, u64, u64, u64) {
        (archive.wallet, vector::length(&archive.memories), archive.session_count, archive.last_updated, archive.total_messages)
    }

    /// Get all memory IDs from archive (NEW v2)
    public fun get_memory_ids(archive: &MemoryArchive): vector<address> {
        archive.memories
    }
}
