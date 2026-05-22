module riot_chat::memory {
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::event;
    use std::string::{Self, String};
    use std::vector;

    public struct Memory has key, store {
        id: UID,
        wallet: address,
        agent_id: String,
        content: String,
        session_id: String,
        timestamp: u64,
        tx_digest: String,
        message_index: u64,
    }

    public struct MemoryArchive has key, store {
        id: UID,
        wallet: address,
        memories: vector<address>,
        session_count: u64,
        last_updated: u64,
        total_messages: u64,
    }

    public struct MemoryStored has copy, drop {
        memory_id: address,
        wallet: address,
        agent_id: String,
        session_id: String,
        timestamp: u64,
        message_index: u64,
    }

    public struct BatchMemoryStored has copy, drop {
        archive_id: address,
        wallet: address,
        agent_id: String,
        message_count: u64,
        session_id: String,
        timestamp: u64,
        tx_digest: String,
    }

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

    public fun store_memory(
        archive: &mut MemoryArchive,
        agent_id: String,
        content: String,
        session_id: String,
        tx_digest: String,
        ctx: &mut TxContext
    ) {
        let message_index = archive.total_messages;
        let memory = Memory {
            id: object::new(ctx),
            wallet: archive.wallet,
            agent_id,
            content,
            session_id,
            timestamp: tx_context::epoch(ctx),
            tx_digest,
            message_index,
        };
        let memory_id = object::id_address(&memory);
        vector::push_back(&mut archive.memories, memory_id);
        archive.last_updated = tx_context::epoch(ctx);
        archive.total_messages = archive.total_messages + 1;
        transfer::transfer(memory, archive.wallet);
        event::emit(MemoryStored {
            memory_id,
            wallet: archive.wallet,
            agent_id: memory.agent_id,
            session_id: memory.session_id,
            timestamp: memory.timestamp,
            message_index,
        });
    }

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
        let start_index = archive.total_messages;
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
                message_index: start_index + i,
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

    public fun get_memory_fields(memory: &Memory): (address, String, String, String, u64, String, u64) {
        (memory.wallet, memory.agent_id, memory.content, memory.session_id, memory.timestamp, memory.tx_digest, memory.message_index)
    }

    public fun get_archive_stats(archive: &MemoryArchive): (address, u64, u64, u64, u64) {
        (archive.wallet, vector::length(&archive.memories), archive.session_count, archive.last_updated, archive.total_messages)
    }

    public fun get_memory_ids(archive: &MemoryArchive): vector<address> {
        archive.memories
    }
}
