'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('services');
    if (!table.features) {
      await queryInterface.addColumn('services', 'features', {
        type: Sequelize.ARRAY(Sequelize.TEXT),
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('services');
    if (table.features) {
      await queryInterface.removeColumn('services', 'features');
    }
  },
};
