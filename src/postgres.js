const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const db = require('./db/models/index')

class DB {
    constructor() {
        this.db = db;

        this.db.Users.findAll().then(users => {
            console.log("All users:", users.map(u=>u.chat_id));
        });
    }
    

    getUser(chatId) {
        return this.db.Users.findOne({
            where: {
                chat_id: chatId
            }
        })
        // return this.db.select('kek_user.id')
        // .from('kek_user')
        // .where('kek_user.chat_id', chatId)
        // .run();
    }

    createUser(chatId, additional = {}) {
        const value = Object.assign({chat_id: chatId}, additional)
        return this.db.Users.create(value)
        // return this.db.insert('chat_id', 'created_at')
        // .into('kek_user')
        // .values({chat_id: chatId, created_at: new Date()})
        // .run();
    }

    // updateUser(chatId, value) {
    //     return this.db.Users.findAll({
    //         where: {
    //             chat_id: chatId
    //         }
    //     })
        // return this.db.select('kek_user.id')
        // .from('kek_user')
        // .where('kek_user.chat_id', chatId)
        // .run();
    // }

    async getUserRoles(chatId) {
        return (await this.db.UserRole.findAll({
            where: {
                user_id: chatId
            }
        })).map(r => r.role_name)
        // console.log("AllRoles", allRoles)
        // return (await this.db.select('user_role.role_name')
        // .from('user_role')
        // .where('user_role.user_id', chatId)
        // .run()).map(r => r.role_name);
    }

    async isHe(chatId, role_name) {
        return (await this.getUserRoles(chatId)).indexOf(role_name) > -1
    }

    createUserRole(chatId, role_name) {
        return this.db.UserRole.create({user_id: chatId, role_name})
        // return this.db.insert('user_id', 'role_name', 'created_at')
        // .into('user_role')
        // .values({user_id: chatId, role_name, created_at: new Date()})
        // .run();
    }

    findSource(mime_type, original_size) {
        return this.db.Sources.findAll({
            where: {
                mime_type,
                original_size
            }
        })
        // return this.db.select(  'file_source.id', 'file_source.mime_type', 'file_source.hash_sha256',
        //                         'file_source.original_id', 'file_source.original_size', 'file_source.voice_id')
        // .from('file_source')
        // .where('file_source.mime_type', mime_type)
        // .and('file_source.original_size', original_size)
        // .run();
    }

    findSourceByHashAndMime(hash_sha256, mime_type) {
        return this.db.Sources.findOne({
            where: {
                hash_sha256,
                mime_type
            }
        })
        // return this.db.select(  'file_source.id', 'file_source.mime_type', 'file_source.hash_sha256',
        //                         'file_source.original_id', 'file_source.original_size', 'file_source.voice_id')
        // .from('file_source')
        // .where('file_source.hash_sha256', hash_sha256)
        // .where('file_source.mime_type', mime_type)
        // .run();
    }

    createSource(mime_type, hash_sha256, original_id, original_size, voice_id) {
        return this.db.Sources.create({mime_type,
            hash_sha256,
            original_id,
            original_size,
            voice_id
        })
        // console.log('createSource', `mime_type:${mime_type}, hash_sha256:${hash_sha256}, original_id:${original_id}, original_size:${original_size}, voice_id:${voice_id}`)
        // return this.db.insert(  'mime_type', 'hash_sha256',
        //                         'original_id', 'original_size', 'voice_id')
        // .into('file_source')
        // .values({mime_type,
        // hash_sha256,
        // original_id,
        // original_size,
        // voice_id})
        // .run();
    }

    createVoice(file_id, hash_sha256, owner_id, duration, size, active) {
        return this.db.Voices.create({
            file_id,
            hash_sha256,
            owner_id,
            duration,
            size,
            active
        })
        // console.log('createVoice', `file_id: ${file_id}, hash_sha256: ${ hash_sha256}, owner_id: ${owner_id}, duration: ${duration}, size: ${size}, active: ${active}`)
        // return this.db.insert(  'file_id', 'hash_sha256', 'owner_id',
        //                         'duration', 'size', 'active')
        // .into('voices')
        // .values({file_id,
        // hash_sha256,
        // owner_id,
        // duration,
        // size,
        // active})
        // .returning('id')
        // .run();
    }

    getAllowedVoicesLike(from_id, like) {
        // this.db.select()
        // .from('voices')
        // .leftJoin('voice_permissions')
        // .on('voices.id', '"voice_permissions"."voice_id"')
        // .where('voice_permissions.owner_chat_id', from_id)
        // .and('voices.title', 'ILIKE', `'%${like}%'`)
        // .orderBy('used', 'desc')
        // .run();
        return this.db.Voices.findAll({
            where: {
                title: {
                    [Op.iLike]: `%${like}%`
                },
                active: true
            },
            include: [
                {
                    model: this.db.VoicePermissions,
                    where: {
                        [Op.or]: [{owner_chat_id: 0}, {owner_chat_id: from_id}]
                    }
                }
            ],
            order: [
                ['used', 'DESC'],
            ],
        })
        // return this.db.select()
        // .from('voices')
        // .leftJoin('voice_permissions')
        // .on('voices.id', '"voice_permissions"."voice_id"')
        // .where('voices.title', 'ILIKE', `'%${like}%'`)
        // .and('voice_permissions.owner_chat_id', from_id)
        // .or('voice_permissions.owner_chat_id', 0)
        // .orderBy('used', 'desc')
        // .run()
    }

    getVoiceById(id) {
        return this.db.Voices.findOne({
            where: {
                id
            }
        })
        // return this.db.select()
        // .from('voices')
        // .where('voices.id', id)
        // .run();
    }

    getVoiceByCached(file_id_cached) {
        return this.db.Voices.findOne({
            where: {
                file_id_cached
            }
        })
        // return this.db.select()
        // .from('voices')
        // .where('voices.id', id)
        // .run();
    }

    async updateVoiceCounterById(id) {
        const voice = await this.getVoiceById(id)
        // this.db.select('voices.used')
        // .from('voices')
        // .where('voices.id', id)
        // .run();

        if (voice) {
            return await this.db.Voices.update({
                used: voice.used + 1
            },{
                where: {
                    id
                }
            })
            // this.db.update('voices')
            // .set('used', counter)
            // .where('id', id)
            // .returning('*')
            // .run();
        } else {
            return []
        }
    }

    updateCachedVoice(id, file_id_cached, size, title) {
        return this.db.Voices.update({
            file_id_cached,
            size,
            title,
            active: true,
        },{
            where: {
                id
            }
        })
        // this.db.update('voices')
        // .set('file_id_cached', file_id_cached)
        // .set('size', size)
        // .set('title', title)
        // .set('active', true)
        // .where('id', id)
        // .returning('*')
        // .run();
    }

    // findVoiceById(id) {
    //     return this.db.select()
    //     .from('voices')
    //     .where('voices.id', id)
    //     .run();
    // }

    getTasks(chat_id, message_type, fullfilled = false) {
        return this.db.Tasks.findAll({
            where: {
                chat_id,
                message_type,
                fullfilled
            },
            order: [
                ['created_at', 'DESC'],
            ],
        })
        // this.db.select('id', 'task', 'content')
        // .from('tasks')
        // .where('tasks.chat_id', chat_id)
        // .and('tasks.fullfilled', false)
        // .and('tasks.message_type', message_type)
        // .orderBy('created_at', 'desc')
        // // .and('tasks.task', task)
        // .run();
    }

    createTask(chat_id, message_type, task, content) {
        return this.db.Tasks.create({chat_id,
            message_type,
            task,
            content})
        // return this.db.insert(  'chat_id', 'message_type', 'task',
        //                         'content')
        // .into('tasks')
        // .values({chat_id,
        // message_type,
        // task,
        // content})
        // .returning('id')
        // .run();
    }

    fullfillTask(id) {
        // console.log(id)
        return this.db.Tasks.update({
            fullfilled: true,
            fullfilled_at: new Date()
        },{
            where: {
                id
            }
        })
        // return this.db.update('tasks')
        // .set('fullfilled', true)
        // .set('fullfilled_at', new Date())
        // .where('id', id)
        // .returning('*')
        // .run();
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
        return this.db.VoicePermissions.create({
            voice_id,
            owner_chat_id,
        })
        // return this.db.insert(  'voice_id', 'owner_chat_id',
        //                         'created_at')
        // .into('voice_permissions')
        // .values({voice_id,
        // owner_chat_id,
        // created_at: new Date()})
        // .returning('id')
        // .run();
    }

    getPermByUserAndVoiceId(owner_chat_id, voice_id) {
        return this.db.VoicePermissions.findAll({
            where: {
                owner_chat_id,
                voice_id
            }
        })
        // return this.db.select()
        // .from('voice_permissions')
        // .where('owner_chat_id', owner_chat_id)
        // .and('voice_id', voice_id)
        // .run();
    }

    getPermByVoiceId(voice_id) {
        return this.db.VoicePermissions.findAll({
            where: {
                voice_id
            }
        })
    }

    deletePermByVoiceId(voice_id) {
        return this.db.VoicePermissions.destroy({
            where: {
                voice_id
            }
        })
    }

    getSourcesVoiceId(voice_id) {
        return this.db.Sources.findOne({
            where: {
                voice_id
            }
        })
    }

    deleteSourcesVoiceId(voice_id) {
        return this.db.Sources.destroy({
            where: {
                voice_id
            }
        })
    }
}

module.exports = { DB }