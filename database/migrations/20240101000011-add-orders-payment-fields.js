'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Adicionar campos de pagamento na tabela orders
    await queryInterface.addColumn('orders', 'payment_intent_id', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });

    await queryInterface.addColumn('orders', 'payment_method', {
      type: Sequelize.STRING(50),
      allowNull: true,
    });

    // Criar índice para payment_intent_id
    await queryInterface.addIndex('orders', ['payment_intent_id'], { name: 'idx_orders_payment_intent_id' });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('orders', 'idx_orders_payment_intent_id');
    await queryInterface.removeColumn('orders', 'payment_method');
    await queryInterface.removeColumn('orders', 'payment_intent_id');
  },
};

