'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE software_activation_links
      ADD COLUMN IF NOT EXISTS short_code VARCHAR(12);
    `);

    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_software_activation_links_short_code
      ON software_activation_links (short_code)
      WHERE short_code IS NOT NULL;
    `);

    await queryInterface.sequelize.query(`
      UPDATE software_activation_links
      SET short_code = upper(substr(md5(random()::text || id::text || clock_timestamp()::text), 1, 8))
      WHERE short_code IS NULL OR trim(short_code) = '';
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS idx_software_activation_links_short_code;
    `);
    await queryInterface.sequelize.query(`
      ALTER TABLE software_activation_links DROP COLUMN IF EXISTS short_code;
    `);
  },
};
