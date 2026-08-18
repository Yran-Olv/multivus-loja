'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const [columns] = await queryInterface.sequelize.query(`
      SELECT column_name FROM information_schema.columns WHERE table_name = 'softwares'
    `);
    const names = columns.map(c => c.column_name);

    if (!names.includes('activation_url')) {
      await queryInterface.addColumn('softwares', 'activation_url', {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    }
    if (!names.includes('activation_message_template')) {
      await queryInterface.addColumn('softwares', 'activation_message_template', {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    }
    if (!names.includes('order_id_prefix')) {
      await queryInterface.addColumn('softwares', 'order_id_prefix', {
        type: Sequelize.STRING(16),
        allowNull: true,
      });
    }
    if (!names.includes('link_validity_days')) {
      await queryInterface.addColumn('softwares', 'link_validity_days', {
        type: Sequelize.INTEGER,
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('softwares', 'link_validity_days').catch(() => {});
    await queryInterface.removeColumn('softwares', 'order_id_prefix').catch(() => {});
    await queryInterface.removeColumn('softwares', 'activation_message_template').catch(() => {});
    await queryInterface.removeColumn('softwares', 'activation_url').catch(() => {});
  },
};
