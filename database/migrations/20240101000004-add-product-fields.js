'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Verificar se a tabela products existe
    const [results] = await queryInterface.sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'products'
      )
    `);
    
    const tableExists = results[0]?.exists || false;

    if (tableExists) {
      // Verificar quais colunas já existem
      const [columns] = await queryInterface.sequelize.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'products'
      `);

      const columnNames = columns.map(c => c.column_name);

      // Adicionar colunas que faltam
      if (!columnNames.includes('warranty')) {
        await queryInterface.addColumn('products', 'warranty', {
          type: Sequelize.STRING(100),
          allowNull: true,
        });
      }

      if (!columnNames.includes('delivery')) {
        await queryInterface.addColumn('products', 'delivery', {
          type: Sequelize.STRING(100),
          allowNull: true,
        });
      }

      if (!columnNames.includes('support')) {
        await queryInterface.addColumn('products', 'support', {
          type: Sequelize.STRING(100),
          allowNull: true,
        });
      }
    }
  },

  async down(queryInterface, Sequelize) {
    // Não fazer nada no down - deixar as colunas como estão
  },
};

