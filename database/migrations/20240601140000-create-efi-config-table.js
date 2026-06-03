'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('efi_config', {
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
      pix_key: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      certificate_path: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      certificate_passphrase: {
        type: Sequelize.TEXT,
        allowNull: true,
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

    await queryInterface.addIndex('efi_config', ['is_active'], {
      name: 'idx_efi_config_active',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('efi_config');
  },
};
