'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Adicionar campos de recuperação de senha na tabela customers
    await queryInterface.addColumn('customers', 'password_reset_code', {
      type: Sequelize.STRING(6),
      allowNull: true,
    });

    await queryInterface.addColumn('customers', 'password_reset_expires_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('customers', 'password_reset_expires_at');
    await queryInterface.removeColumn('customers', 'password_reset_code');
  },
};

