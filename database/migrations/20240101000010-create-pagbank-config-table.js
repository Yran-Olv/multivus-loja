'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // PagBank config table
    await queryInterface.createTable('pagbank_config', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      client_id: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      client_secret: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      environment: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'sandbox',
      },
      webhook_url: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Create indexes
    await queryInterface.addIndex('pagbank_config', ['is_active'], { name: 'idx_pagbank_config_active' });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('pagbank_config');
  },
};

