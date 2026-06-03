'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Verificar se a tabela softwares existe
    const [results] = await queryInterface.sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'softwares'
      )
    `);
    
    const tableExists = results[0]?.exists || false;

    if (tableExists) {
      // Verificar quais colunas já existem
      const [columns] = await queryInterface.sequelize.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'softwares'
      `);

      const columnNames = columns.map(c => c.column_name);

      // Adicionar colunas que faltam
      if (!columnNames.includes('is_featured')) {
        await queryInterface.addColumn('softwares', 'is_featured', {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
        });
      }

      if (!columnNames.includes('short_description')) {
        await queryInterface.addColumn('softwares', 'short_description', {
          type: Sequelize.STRING(500),
          allowNull: true,
        });
      }

      if (!columnNames.includes('version')) {
        await queryInterface.addColumn('softwares', 'version', {
          type: Sequelize.STRING(50),
          allowNull: true,
        });
      }

      if (!columnNames.includes('features')) {
        await queryInterface.addColumn('softwares', 'features', {
          type: Sequelize.ARRAY(Sequelize.TEXT),
          allowNull: true,
        });
      }

      if (!columnNames.includes('screenshots')) {
        await queryInterface.addColumn('softwares', 'screenshots', {
          type: Sequelize.ARRAY(Sequelize.TEXT),
          allowNull: true,
        });
      }

      if (!columnNames.includes('download_url')) {
        await queryInterface.addColumn('softwares', 'download_url', {
          type: Sequelize.TEXT,
          allowNull: true,
        });
      }

      if (!columnNames.includes('documentation_url')) {
        await queryInterface.addColumn('softwares', 'documentation_url', {
          type: Sequelize.TEXT,
          allowNull: true,
        });
      }

      if (!columnNames.includes('price')) {
        await queryInterface.addColumn('softwares', 'price', {
          type: Sequelize.DECIMAL(10, 2),
          allowNull: true,
        });
      }

      if (!columnNames.includes('is_free')) {
        await queryInterface.addColumn('softwares', 'is_free', {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
        });
      }

      if (!columnNames.includes('category')) {
        await queryInterface.addColumn('softwares', 'category', {
          type: Sequelize.STRING(100),
          allowNull: true,
        });
      }

      if (!columnNames.includes('platform')) {
        await queryInterface.addColumn('softwares', 'platform', {
          type: Sequelize.STRING(100),
          allowNull: true,
        });
      }

      if (!columnNames.includes('system_requirements')) {
        await queryInterface.addColumn('softwares', 'system_requirements', {
          type: Sequelize.JSONB,
          allowNull: true,
        });
      }

      // Criar índice para is_featured se não existir
      const [indexes] = await queryInterface.sequelize.query(`
        SELECT indexname 
        FROM pg_indexes 
        WHERE tablename = 'softwares' 
        AND indexname = 'idx_softwares_featured'
      `);

      if (indexes.length === 0) {
        await queryInterface.addIndex('softwares', ['is_featured'], { name: 'idx_softwares_featured' });
      }
    }
  },

  async down(queryInterface, Sequelize) {
    // Não fazer nada no down - deixar as colunas como estão
  },
};

