const Sequelize = require('sequelize');
const Op = Sequelize.Op;

class DB {
    constructor({ hostname, user, password, database }) {

        const sequelize = new Sequelize(database, user, password, {
            host: hostname,
            dialect: 'postgres'
        });

/*
        CREATE TABLE kek_user (
        id SERIAL PRIMARY KEY,
        chat_id INTEGER NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
*/
        this.Users = sequelize.define('kek_user', {
            id: {
                type: Sequelize.BIGINT(20),
                primaryKey: true,
                allowNull: false,
                autoIncrement: true
            },
            chat_id: {
                type: Sequelize.BIGINT(20),
                allowNull: false,
            },
            created_at: {
                type : Sequelize.DATE(),
                allowNull : false,
                defaultValue : Sequelize.NOW
            },
            updated_at: {
                type : Sequelize.DATE(),
                allowNull : false,
                defaultValue : Sequelize.NOW
            }
          }, {
            freezeTableName: true,
            createdAt : 'created_at',
            updatedAt : 'updated_at',
        });

/*
        CREATE TABLE voices (
            id SERIAL PRIMARY KEY,
            file_id VARCHAR(40) UNIQUE NOT NULL,
            file_id_cached VARCHAR(40),
            hash_sha256 VARCHAR(64),
            owner_id INTEGER NOT NULL,
            title VARCHAR(90),
            duration INTEGER,
            size INTEGER,
            active BOOLEAN NOT NULL DEFAULT 'f',
            used INTEGER NOT NULL DEFAULT 0
        );
*/
        
        this.Voices = sequelize.define('voices', {
            id: {
                type: Sequelize.BIGINT(20),
                primaryKey: true,
                allowNull: false,
                autoIncrement: true
            },
            file_id: {
                type: Sequelize.STRING(40),
                allowNull: false,
                unique: true,
            },
            file_id_cached: {
                type: Sequelize.STRING(40),
                unique: true,
            },
            hash_sha256: {
                type: Sequelize.STRING(64),
            },
            owner_id: {
                type: Sequelize.BIGINT(20),
                allowNull: false,
            },
            title: {
                type: Sequelize.STRING(90),
            },
            duration: {
                type: Sequelize.BIGINT(20),
            },
            size: {
                type: Sequelize.BIGINT(20),
            },
            active: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue : false,
            },
            used: {
                type : Sequelize.BIGINT(20),
                allowNull : false,
                defaultValue : 0
            },
            created_at: {
                type : Sequelize.DATE(),
                allowNull : false,
                defaultValue : Sequelize.NOW
            },
            updated_at: {
                type : Sequelize.DATE(),
                allowNull : false,
                defaultValue : Sequelize.NOW
            }
          }, {
            freezeTableName: true,
            createdAt : 'created_at',
            updatedAt : 'updated_at',
        });
        
/*
        CREATE TABLE file_source (
            id SERIAL PRIMARY KEY,
            mime_type VARCHAR(20) NOT NULL,
            hash_sha256 VARCHAR(64) NOT NULL,
            original_id VARCHAR(40) NOT NULL,
            original_size INTEGER,
            voice_id SERIAL,
            created_at TIMESTAMP NOT NULL DEFAULT NOW()
          );
*/

        this.Sources = sequelize.define('file_source', {
            id: {
                type: Sequelize.BIGINT(20),
                primaryKey: true,
                allowNull: false,
                autoIncrement: true
            },
            mime_type: {
                type: Sequelize.STRING(20),
                allowNull: false,
            },
            hash_sha256: {
                type: Sequelize.STRING(64),
                allowNull: false,
                unique: true,
            },
            original_id: {
                type: Sequelize.STRING(40),
                allowNull: false,
            },
            original_size: {
                type: Sequelize.BIGINT(20),
            },
            voice_id: {
                type: Sequelize.BIGINT(20),
            },
            created_at: {
                type : Sequelize.DATE(),
                allowNull : false,
                defaultValue : Sequelize.NOW
            },
            updated_at: {
                type : Sequelize.DATE(),
                allowNull : false,
                defaultValue : Sequelize.NOW
            }
          }, {
            freezeTableName: true,
            createdAt : 'created_at',
            updatedAt : 'updated_at',
        });


/*
        CREATE TABLE tasks (
  id SERIAL PRIMARY KEY,
  chat_id INTEGER NOT NULL,
  message_type INTEGER NOT NULL,
  task VARCHAR(15) NOT NULL,
  content VARCHAR(40) NOT NULL,
  fullfilled BOOLEAN NOT NULL DEFAULT 'f',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  fullfilled_at TIMESTAMP
);
*/
        
        this.Tasks = sequelize.define('tasks', {
            id: {
                type: Sequelize.BIGINT(20),
                primaryKey: true,
                allowNull: false,
                autoIncrement: true
            },
            chat_id: {
                type: Sequelize.BIGINT(20),
                allowNull: false,
            },
            message_type: {
                type: Sequelize.SMALLINT,
                allowNull: false,
            },
            task: {
                type: Sequelize.STRING(15),
                allowNull: false,
            },
            content: {
                type: Sequelize.STRING(40),
                allowNull: false,
            },
            fullfilled: {
                type: Sequelize.BOOLEAN,
                defaultValue : false
            },
            fullfilled_at: {
                type: Sequelize.DATE(),
            },
            created_at: {
                type : Sequelize.DATE(),
                allowNull : false,
                defaultValue : Sequelize.NOW
            },
            updated_at: {
                type : Sequelize.DATE(),
                allowNull : false,
                defaultValue : Sequelize.NOW
            }
          }, {
            freezeTableName: true,
            createdAt : 'created_at',
            updatedAt : 'updated_at',
        });


        /*
        CREATE TABLE voice_permissions (
        id SERIAL PRIMARY KEY,
        voice_id SERIAL,
        owner_chat_id INTEGER NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
*/
        
        this.VoicePermissions = sequelize.define('voice_permissions', {
            id: {
                type: Sequelize.BIGINT(20),
                primaryKey: true,
                allowNull: false,
                autoIncrement: true
            },
            voice_id: {
                type: Sequelize.BIGINT(20),
            },
            owner_chat_id: {
                type: Sequelize.BIGINT(20),
                allowNull: false,
            },
            created_at: {
                type : Sequelize.DATE(),
                allowNull : false,
                defaultValue : Sequelize.NOW
            },
            updated_at: {
                type : Sequelize.DATE(),
                allowNull : false,
                defaultValue : Sequelize.NOW
            }
          }, {
            freezeTableName: true,
            createdAt : 'created_at',
            updatedAt : 'updated_at',
        });

        this.Voices.hasMany(this.VoicePermissions
            ,
            {
                foreignKey : 'voice_id',
                sourceKey: 'id'
            }
            );
        
        // this.VoicePermissions.belongsTo(this.Voices,
        //     {
        //         foreignKey : 'voice_id',
        //         targetKey: 'id'
        // });

        /*
        CREATE TABLE user_role (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        role_name VARCHAR(10) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
        */
        
        this.UserRole = sequelize.define('user_role', {
            id: {
                type: Sequelize.BIGINT(20),
                primaryKey: true,
                allowNull: false,
                autoIncrement: true
            },
            user_id: {
                type: Sequelize.BIGINT(20),
                allowNull: false,
            },
            role_name: {
                type: Sequelize.STRING(10),
                allowNull: false,
            },
            created_at: {
                type : Sequelize.DATE(),
                allowNull : false,
                defaultValue : Sequelize.NOW
            },
            updated_at: {
                type : Sequelize.DATE(),
                allowNull : false,
                defaultValue : Sequelize.NOW
            }
          }, {
            freezeTableName: true,
            createdAt : 'created_at',
            updatedAt : 'updated_at',
        });

        this.Users.findAll().then(users => {
            console.log("All users:", users.map(u=>u.chat_id));
        });
    }
    

    getUser(chatId) {
        return this.Users.findAll({
            where: {
                chat_id: chatId
            }
        })
        // return this.db.select('kek_user.id')
        // .from('kek_user')
        // .where('kek_user.chat_id', chatId)
        // .run();
    }

    createUser(chatId) {
        return this.Users.create({chat_id: chatId})
        // return this.db.insert('chat_id', 'created_at')
        // .into('kek_user')
        // .values({chat_id: chatId, created_at: new Date()})
        // .run();
    }

    async getUserRoles(chatId) {
        return (await this.UserRole.findAll({
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

    createUserRole(chatId, role_name) {
        return this.UserRole.create({user_id: chatId, role_name})
        // return this.db.insert('user_id', 'role_name', 'created_at')
        // .into('user_role')
        // .values({user_id: chatId, role_name, created_at: new Date()})
        // .run();
    }

    findSource(mime_type, original_size) {
        return this.Sources.findAll({
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
        return this.Sources.findAll({
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
        return this.Sources.create({mime_type,
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
        return this.Voices.create({
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
        return this.Voices.findAll({
            where: {
                title: {
                    [Op.iLike]: `%${like}%`
                }
            },
            include: [
                {
                    model: this.VoicePermissions,
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
        return this.Voices.findOne({
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
        return this.Voices.findOne({
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
            return await this.Voices.update({
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
        return this.Voices.update({
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
        return this.Tasks.findAll({
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
        return this.Tasks.create({chat_id,
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
        return this.Tasks.update({
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
        return this.VoicePermissions.create({
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
        return this.VoicePermissions.findAll({
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
        return this.VoicePermissions.findAll({
            where: {
                voice_id
            }
        })
    }

    deletePermByVoiceId(voice_id) {
        return this.VoicePermissions.destroy({
            where: {
                voice_id
            }
        })
    }

    getSourcesVoiceId(voice_id) {
        return this.Sources.findOne({
            where: {
                voice_id
            }
        })
    }

    deleteSourcesVoiceId(voice_id) {
        return this.Sources.destroy({
            where: {
                voice_id
            }
        })
    }
}

module.exports = { DB }