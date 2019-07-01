module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.sequelize.transaction((t) => {
            return Promise.all([
                queryInterface.addColumn('kek_user', 'queries', {
                    type: Sequelize.BIGINT(20),
                    allowNull: false,
                    defaultValue: 0
                }, { transaction: t }),
            ])
        })
    },

    down: (queryInterface, Sequelize) => {
        return queryInterface.sequelize.transaction((t) => {
            return Promise.all([
                queryInterface.removeColumn('kek_user', 'queries', { transaction: t }),
            ])
        })
    }
};