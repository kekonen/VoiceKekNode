const {shiphold} = require('ship-hold');

class DB {
    constructor({ hostname, user, password, database }) {
        this.db = shiphold({
            hostname,
            user,
            password,
            database
        });
    
        this.users = this.db.service({
            table: 'kek_user',
            primaryKey: 'id'
        });

        this.sources = this.db.service({
            table: 'file_source',
            primaryKey: 'id'
        });

        this.voices = this.db.service({
            table: 'voices',
            primaryKey: 'id'
        });

        this.tasks = this.db.service({
            table: 'tasks',
            primaryKey: 'id'
        });

        this.voice_permissions = this.db.service({
            table: 'voice_permissions',
            primaryKey: 'id'
        });
    }

    getUser(chatId) {
        return this.db.select('kek_user.id')
        .from('kek_user')
        .where('kek_user.chat_id', chatId)
        .run();
    }

    createUser(chatId) {
        return this.db.insert('chat_id', 'created_at')
        .into('kek_user')
        .values({chat_id: chatId, created_at: new Date()})
        .run();
    }

    findSource(mime_type, original_size) {
        return this.db.select(  'file_source.id', 'file_source.mime_type', 'file_source.hash_sha256',
                                'file_source.original_id', 'file_source.original_size', 'file_source.voice_id')
        .from('file_source')
        .where('file_source.mime_type', mime_type)
        .and('file_source.original_size', original_size)
        .run();
    }

    findSourceByHashAndMime(hash_sha256, mime_type) {
        return this.db.select(  'file_source.id', 'file_source.mime_type', 'file_source.hash_sha256',
                                'file_source.original_id', 'file_source.original_size', 'file_source.voice_id')
        .from('file_source')
        .where('file_source.hash_sha256', hash_sha256)
        .where('file_source.mime_type', mime_type)
        .run();
    }

    createSource(mime_type, hash_sha256, original_id, original_size, voice_id) {
        console.log('createSource', `mime_type:${mime_type}, hash_sha256:${hash_sha256}, original_id:${original_id}, original_size:${original_size}, voice_id:${voice_id}`)
        return this.db.insert(  'mime_type', 'hash_sha256',
                                'original_id', 'original_size', 'voice_id')
        .into('file_source')
        .values({mime_type,
        hash_sha256,
        original_id,
        original_size,
        voice_id})
        .run();
    }

    createVoice(file_id, hash_sha256, owner_id, duration, size, active) {
        console.log('createVoice', `file_id: ${file_id}, hash_sha256: ${ hash_sha256}, owner_id: ${owner_id}, duration: ${duration}, size: ${size}, active: ${active}`)
        return this.db.insert(  'file_id', 'hash_sha256', 'owner_id',
                                'duration', 'size', 'active')
        .into('voices')
        .values({file_id,
        hash_sha256,
        owner_id,
        duration,
        size,
        active})
        .returning('id')
        .run();
    }

    getAllowedVoicesLike(from_id, like) {
        console.log("getAllowedVoicesLike", this.db.select()
        .from('voices')
        .leftJoin('voice_permissions')
        .on('voices.id', '"voice_permissions"."voice_id"')
        .where('voice_permissions.owner_chat_id', from_id)
        .and('voices.title', 'ILIKE', `'%${like}%'`)
        .build().text)
        return this.db.select()
        .from('voices')
        .leftJoin('voice_permissions')
        .on('voices.id', '"voice_permissions"."voice_id"')
        .where('voice_permissions.owner_chat_id', from_id)
        .and('voices.title', 'ILIKE', `'%${like}%'`)
        .run();
    }

    getVoiceById(id) {
        return this.db.select()
        .from('voices')
        .where('voices.id', id)
        .run();
    }

    updateCachedVoice(id, file_id_cached, size, title) {
        return this.db.update('voices')
        .set('file_id_cached', file_id_cached)
        .set('size', size)
        .set('title', title)
        .set('active', true)
        .where('id', id)
        .returning('*')
        .run();
    }

    findVoiceById(id) {
        return this.db.select(  'voices.file_id', 'voices.file_id_cached', 'voices.hash_sha256',
                                'voices.owner_id', 'voices.title', 'voices.duration', 'voices.size', 'voices.active')
        .from('voices')
        .where('voices.id', id)
        .run();
    }

    findTasks(chat_id, message_type) {
        return this.db.select('id', 'task', 'content')
        .from('tasks')
        .where('tasks.chat_id', chat_id)
        .and('tasks.fullfilled', false)
        .and('tasks.message_type', message_type)
        // .and('tasks.task', task)
        .run();
    }

    createTask(chat_id, message_type, task, content) {
        return this.db.insert(  'chat_id', 'message_type', 'task',
                                'content')
        .into('tasks')
        .values({chat_id,
        message_type,
        task,
        content})
        .returning('id')
        .run();
    }

    fullfillTask(id) {
        console.log(id)
        return this.db.update('tasks')
        .set('fullfilled', true)
        .where('id', id)
        .returning('*')
        .run();
    }

    // findPerm(chat_id, message_type, task ) {
    //     return this.db.select('content')
    //     .from('tasks')
    //     .where('tasks.chat_id', chat_id)
    //     .and('tasks.message_type', message_type)
    //     .and('tasks.task', task)
    //     .run();
    // }

    createPerm(voice_id, owner_chat_id) {
        console.log(`createPerm vid: ${voice_id}`)
        return this.db.insert(  'voice_id', 'owner_chat_id',
                                'created_at')
        .into('voice_permissions')
        .values({voice_id,
        owner_chat_id,
        created_at: new Date()})
        .returning('id')
        .run();
    }

    findPermByUserAndVoiceId(owner_chat_id, voice_id) {
        return this.db.select()
        .from('voice_permissions')
        .where('owner_chat_id', owner_chat_id)
        .and('voice_id', voice_id)
        .run();
    }
}

module.exports = { DB }