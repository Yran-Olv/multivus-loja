'use strict';
const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Seeder} */
module.exports = {
  async up(queryInterface) {
    const passwordHash = await bcrypt.hash('admin123', 10);

    await queryInterface.bulkInsert(
      'admin_users',
      [
        {
          username: 'admin',
          password_hash: passwordHash,
          email: 'admin@multivus.com.br',
          full_name: 'Administrador',
          is_active: true,
          created_at: new Date(),
        },
      ],
      { ignoreDuplicates: true }
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('admin_users', { username: 'admin' }, {});
  },
};
