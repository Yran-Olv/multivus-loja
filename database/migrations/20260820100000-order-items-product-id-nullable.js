'use strict';

/** Permite desvincular produto excluído dos pedidos (histórico mantém product_name). */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE order_items
      ALTER COLUMN product_id DROP NOT NULL;
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      UPDATE order_items SET product_id = (
        SELECT id FROM products ORDER BY id LIMIT 1
      )
      WHERE product_id IS NULL;
    `);
    await queryInterface.sequelize.query(`
      ALTER TABLE order_items
      ALTER COLUMN product_id SET NOT NULL;
    `);
  },
};
