'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const [columns] = await queryInterface.sequelize.query(`
      SELECT column_name FROM information_schema.columns WHERE table_name = 'softwares'
    `);
    const names = columns.map(c => c.column_name);

    if (!names.includes('sold_out_message')) {
      await queryInterface.addColumn('softwares', 'sold_out_message', {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    }

    await queryInterface.createTable('software_activation_links', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      software_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'softwares', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      activation_url: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      status: {
        type: Sequelize.STRING(16),
        allowNull: false,
        defaultValue: 'available',
      },
      order_reference: {
        type: Sequelize.STRING(64),
        allowNull: true,
      },
      used_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('software_activation_links', ['software_id', 'status'], {
      name: 'idx_software_activation_links_software_status',
    });
    await queryInterface.addIndex('software_activation_links', ['activation_url'], {
      name: 'idx_software_activation_links_url',
      unique: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('software_activation_links').catch(() => {});
    await queryInterface.removeColumn('softwares', 'sold_out_message').catch(() => {});
  },
};
