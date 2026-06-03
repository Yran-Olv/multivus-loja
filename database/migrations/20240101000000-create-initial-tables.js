'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Products table
    await queryInterface.createTable('products', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      category: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      image_url: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      stock_quantity: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      specifications: {
        type: Sequelize.JSONB,
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

    // Services table
    await queryInterface.createTable('services', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      icon: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      price_from: {
        type: Sequelize.DECIMAL(10, 2),
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
    });

    // Service requests table
    await queryInterface.createTable('service_requests', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
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
      service_type: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      device_info: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      problem_description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      priority: {
        type: Sequelize.STRING(20),
        defaultValue: 'normal',
      },
      status: {
        type: Sequelize.STRING(50),
        defaultValue: 'pending',
      },
      estimated_cost: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
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

    // Admin users table
    await queryInterface.createTable('admin_users', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      username: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
      },
      password_hash: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      full_name: {
        type: Sequelize.STRING(255),
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
    });

    // Customers table
    await queryInterface.createTable('customers', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
      },
      password_hash: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      phone: {
        type: Sequelize.STRING(50),
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

    // Contact messages table
    await queryInterface.createTable('contact_messages', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      phone: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      subject: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      status: {
        type: Sequelize.STRING(50),
        defaultValue: 'new',
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Softwares table (note: some scripts use 'software' singular, but code uses 'softwares' plural)
    await queryInterface.createTable('softwares', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      short_description: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      version: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      icon: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      features: {
        type: Sequelize.ARRAY(Sequelize.TEXT),
        allowNull: true,
      },
      screenshots: {
        type: Sequelize.ARRAY(Sequelize.TEXT),
        allowNull: true,
      },
      download_url: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      documentation_url: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      is_free: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      is_featured: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      category: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      platform: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      system_requirements: {
        type: Sequelize.JSONB,
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

    // WhatsApp config table (singular - como usado no código)
    await queryInterface.createTable('whatsapp_config', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      token: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      endpoint: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      queue_id: {
        type: Sequelize.STRING(255),
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

    // Create indexes for better performance
    await queryInterface.addIndex('products', ['category'], { name: 'idx_products_category' });
    await queryInterface.addIndex('products', ['is_active'], { name: 'idx_products_active' });
    await queryInterface.addIndex('service_requests', ['status'], { name: 'idx_service_requests_status' });
    await queryInterface.addIndex('service_requests', ['created_at'], { name: 'idx_service_requests_created' });
    await queryInterface.addIndex('contact_messages', ['status'], { name: 'idx_contact_messages_status' });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('whatsapp_config');
    await queryInterface.dropTable('softwares');
    await queryInterface.dropTable('contact_messages');
    await queryInterface.dropTable('customers');
    await queryInterface.dropTable('admin_users');
    await queryInterface.dropTable('service_requests');
    await queryInterface.dropTable('services');
    await queryInterface.dropTable('products');
  },
};

