'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('customers');
    if (!table.address) {
      await queryInterface.addColumn('customers', 'address', {
        type: Sequelize.STRING(500),
        allowNull: true,
      });
    }
    if (!table.city) {
      await queryInterface.addColumn('customers', 'city', {
        type: Sequelize.STRING(100),
        allowNull: true,
      });
    }
    if (!table.state) {
      await queryInterface.addColumn('customers', 'state', {
        type: Sequelize.STRING(2),
        allowNull: true,
      });
    }
    if (!table.zip_code) {
      await queryInterface.addColumn('customers', 'zip_code', {
        type: Sequelize.STRING(20),
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('customers', 'zip_code').catch(() => {});
    await queryInterface.removeColumn('customers', 'state').catch(() => {});
    await queryInterface.removeColumn('customers', 'city').catch(() => {});
    await queryInterface.removeColumn('customers', 'address').catch(() => {});
  },
};
