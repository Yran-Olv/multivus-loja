'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Reviews table
    await queryInterface.createTable('reviews', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      product_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'products',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      customer_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      customer_email: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      rating: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          max: 5,
        },
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      comment: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      is_approved: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Create indexes
    await queryInterface.addIndex('reviews', ['product_id'], { name: 'idx_reviews_product_id' });
    await queryInterface.addIndex('reviews', ['is_approved'], { name: 'idx_reviews_approved' });
    await queryInterface.addIndex('reviews', ['created_at'], { name: 'idx_reviews_created_at' });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('reviews');
  },
};

