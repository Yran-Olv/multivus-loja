'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Chat messages table
    await queryInterface.createTable('chat_messages', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      session_id: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      sender_type: {
        type: Sequelize.ENUM('customer', 'admin'),
        allowNull: false,
      },
      sender_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      sender_email: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      is_read: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Create indexes
    await queryInterface.addIndex('chat_messages', ['session_id'], { name: 'idx_chat_messages_session_id' });
    await queryInterface.addIndex('chat_messages', ['is_read'], { name: 'idx_chat_messages_read' });
    await queryInterface.addIndex('chat_messages', ['created_at'], { name: 'idx_chat_messages_created_at' });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('chat_messages');
  },
};

