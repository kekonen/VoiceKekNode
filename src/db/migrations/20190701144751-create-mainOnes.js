'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    const voicesCreated = queryInterface.createTable('voices', {
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
    });
    const tasksCreated = queryInterface.createTable('tasks', {
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
    });

    const voice_permissionsCreated = queryInterface.createTable('voice_permissions', {
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
    });

    const file_sourceCreated = queryInterface.createTable('file_source', {
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
    });

    const kek_userCreated = queryInterface.createTable('kek_user', {
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
    });
    const user_roleCreated = queryInterface.createTable('user_role', {
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
    });

    return Promise.all([voicesCreated,
                        tasksCreated,
                        voice_permissionsCreated,
                        file_sourceCreated,
                        kek_userCreated,
                        user_roleCreated])
  },
  down: (queryInterface, Sequelize) => {
    let drops = []
    drops.push(queryInterface.dropTable('voices'));
    drops.push(queryInterface.dropTable('tasks'));
    drops.push(queryInterface.dropTable('voice_permissions'));
    drops.push(queryInterface.dropTable('file_source'));
    drops.push(queryInterface.dropTable('kek_user'));
    drops.push(queryInterface.dropTable('user_role'));

    return Promise.all(drops)
  }
};