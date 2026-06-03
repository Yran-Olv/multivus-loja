'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Adicionar campo customer_address na tabela service_requests
    await queryInterface.addColumn('service_requests', 'customer_address', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('service_requests', 'customer_address');
  },
};

