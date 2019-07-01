'use strict';
const Sequelize = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    const Users = sequelize.define('kek_user', {
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
        queries: {
            type: Sequelize.BIGINT(20),
            allowNull: false,
            defaultValue: 0
        },
        created_at: {
            type: Sequelize.DATE(),
            allowNull: false,
            defaultValue: Sequelize.NOW
        },
        updated_at: {
            type: Sequelize.DATE(),
            allowNull: false,
            defaultValue: Sequelize.NOW
        }
    }, {
            freezeTableName: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
        });
    const Voices = sequelize.define('voices', {
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
            defaultValue: false,
        },
        used: {
            type: Sequelize.BIGINT(20),
            allowNull: false,
            defaultValue: 0
        },
        created_at: {
            type: Sequelize.DATE(),
            allowNull: false,
            defaultValue: Sequelize.NOW
        },
        updated_at: {
            type: Sequelize.DATE(),
            allowNull: false,
            defaultValue: Sequelize.NOW
        }
    }, {
            freezeTableName: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
        });
    const Sources = sequelize.define('file_source', {
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
            type: Sequelize.DATE(),
            allowNull: false,
            defaultValue: Sequelize.NOW
        },
        updated_at: {
            type: Sequelize.DATE(),
            allowNull: false,
            defaultValue: Sequelize.NOW
        }
    }, {
            freezeTableName: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
        });
    const Tasks = sequelize.define('tasks', {
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
            defaultValue: false
        },
        fullfilled_at: {
            type: Sequelize.DATE(),
        },
        created_at: {
            type: Sequelize.DATE(),
            allowNull: false,
            defaultValue: Sequelize.NOW
        },
        updated_at: {
            type: Sequelize.DATE(),
            allowNull: false,
            defaultValue: Sequelize.NOW
        }
    }, {
            freezeTableName: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
        });
    const VoicePermissions = sequelize.define('voice_permissions', {
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
            type: Sequelize.DATE(),
            allowNull: false,
            defaultValue: Sequelize.NOW
        },
        updated_at: {
            type: Sequelize.DATE(),
            allowNull: false,
            defaultValue: Sequelize.NOW
        }
    }, {
            freezeTableName: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
        });

    Voices.hasMany(VoicePermissions
        ,
        {
            foreignKey: 'voice_id',
            sourceKey: 'id'
        }
    );

    const UserRole = sequelize.define('user_role', {
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
            type: Sequelize.DATE(),
            allowNull: false,
            defaultValue: Sequelize.NOW
        },
        updated_at: {
            type: Sequelize.DATE(),
            allowNull: false,
            defaultValue: Sequelize.NOW
        }
    }, {
            freezeTableName: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
        });

    return {
        Users,
        Voices,
        Sources,
        Tasks,
        VoicePermissions,
        UserRole
    };
};