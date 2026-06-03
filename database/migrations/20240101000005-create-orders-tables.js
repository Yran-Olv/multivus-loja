'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Orders table
    await queryInterface.createTable('orders', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      order_number: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
      },
      customer_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      customer_email: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      customer_phone: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      customer_address: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      total_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      status: {
        type: Sequelize.STRING(50),
        defaultValue: 'pending',
      },
      payment_status: {
        type: Sequelize.STRING(50),
        defaultValue: 'pending',
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
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

    // Order items table
    await queryInterface.createTable('order_items', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      order_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'orders',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      product_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'products',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      product_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      product_price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      subtotal: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Create indexes for better performance
    await queryInterface.addIndex('orders', ['order_number'], { name: 'idx_orders_order_number' });
    await queryInterface.addIndex('orders', ['customer_email'], { name: 'idx_orders_customer_email' });
    await queryInterface.addIndex('orders', ['status'], { name: 'idx_orders_status' });
    await queryInterface.addIndex('orders', ['created_at'], { name: 'idx_orders_created_at' });
    await queryInterface.addIndex('order_items', ['order_id'], { name: 'idx_order_items_order_id' });
    await queryInterface.addIndex('order_items', ['product_id'], { name: 'idx_order_items_product_id' });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('order_items');
    await queryInterface.dropTable('orders');
  },
};

