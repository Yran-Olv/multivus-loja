'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Alterar problem_description para permitir NULL
    await queryInterface.changeColumn('service_requests', 'problem_description', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    // Reverter para NOT NULL (mas pode falhar se houver registros com NULL)
    await queryInterface.changeColumn('service_requests', 'problem_description', {
      type: Sequelize.TEXT,
      allowNull: false,
    });
  },
};

