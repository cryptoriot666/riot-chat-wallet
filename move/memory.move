module riot_chat::memory {
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::event;
    use std::string::{Self, String};
    use std::vector;

    // ======== Structs ========

    public struct Memory has key, store {
        id: UID,
        wallet: address,
        agent_id: String,
        content: String,
        session_id: String,
        timestamp: u64,
        tx_digest: String,
    }

    public struct MemoryArchive has key, store {
        id: UID,
        wallet: address,
        memories: vector<address>,
        session_count: u64,
        last_updated: u64,
    }

    // ======== Events ========

    public struct MemoryStored has copy, drop {
        memory_id: address,
        wallet: address,
        agent_id: String,
        session_id: String,
        timestamp: u64,
    }

    public struct BatchMemoryStored has copy, drop {
        archive_id: address,
        wallet: address,
        agent_id: String,
        message_count: u64,
        session_id: String,
        timestamp: u64,
    }

    // ======== Functions ========

    /// Create a MemoryArchive for a wallet (one-time setup)
    public fun create_archive(ctx: &mut TxContext) {
        let archive = MemoryArchive {
            id: object::new(ctx),
            wallet: tx_context::sender(ctx),
            memories: vector::empty(),
            session_count: 0,
            last_updated: tx_context::epoch(ctx),
        };
        transfer::transfer(archive, tx_context::sender(ctx));
    }

    /// Store single memory
    public fun store_memory(
        archive: &mut MemoryArchive,
        agent_id: String,
        content: String,
        session_id: String,
        tx_digest: String,
        ctx: &mut TxContext
    ) {
        let memory = Memory {
            id: object::new(ctx),
            wallet: archive.wallet,
            agent_id,
            content,
            session_id,
            timestamp: tx_context::epoch(ctx),
            tx_digest,
        };

        let memory_id = object::id_address(&memory);
        vector::push_back(&mut archive.memories, memory_id);
        archive.last_updated = tx_context::epoch(ctx);

        transfer::transfer(memory, archive.wallet);

        event::emit(MemoryStored {
            memory_id,
            wallet: archive.wallet,
            agent_id: memory.agent_id,
            session_id: memory.session_id,
            timestamp: memory.timestamp,
        });
    }

    /// Batch store multiple memories in one transaction
    public fun batch_store_memory(
        archive: &mut MemoryArchive,
        agent_id: String,
        messages: vector<String>,
        session_id: String,
        tx_digest: String,
        ctx: &mut TxContext
    ) {
        let message_count = vector::length(&messages);
        let wallet = archive.wallet;
        let i = 0;

        while (i < message_count) {
            let content = vector::pop_back(&mut messages);
            let memory = Memory {
                id: object::new(ctx),
                wallet,
                agent_id: agent_id,
                content,
                session_id: session_id,
                timestamp: tx_context::epoch(ctx),
                tx_digest: tx_digest,
            };

            let memory_id = object::id_address(&memory);
            vector::push_back(&mut archive.memories, memory_id);

            transfer::transfer(memory, wallet);
            i = i + 1;
        };

        archive.session_count = archive.session_count + 1;
        archive.last_updated = tx_context::epoch(ctx);

        event::emit(BatchMemoryStored {
            archive_id: object::id_address(archive),
            wallet,
            agent_id,
            message_count,
            session_id,
            timestamp: tx_context::epoch(ctx),
        });
    }

    /// Get memory by object ID (returns fields)
    public fun get_memory_fields(memory: &Memory): (address, String, String, String, u64, String) {
        (memory.wallet, memory.agent_id, memory.content, memory.session_id, memory.timestamp, memory.tx_digest)
    }

    /// Get archive stats
    public fun get_archive_stats(archive: &MemoryArchive): (address, u64, u64, u64) {
        (archive.wallet, vector::length(&archive.memories), archive.session_count, archive.last_updated)
    }

    /// Check if wallet has archive
    public fun has_archive(wallet: address): bool {
        // This would be checked off-chain via RPC
        true
    }
}
