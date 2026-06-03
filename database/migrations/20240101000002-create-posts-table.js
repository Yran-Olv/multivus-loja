'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Posts table (blog) - opcional mas usado pelo sistema
    await queryInterface.createTable('posts', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      slug: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
      },
      excerpt: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      category: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      tags: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: true,
      },
      featured_image: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      author_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'admin_users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        allowNull: true,
      },
      is_published: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      published_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      views: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
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
    await queryInterface.addIndex('posts', ['slug'], { name: 'idx_posts_slug', unique: true });
    await queryInterface.addIndex('posts', ['is_published'], { name: 'idx_posts_published' });
    await queryInterface.addIndex('posts', ['category'], { name: 'idx_posts_category' });
    await queryInterface.addIndex('posts', ['published_at'], { name: 'idx_posts_published_at' });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('posts');
  },
};

