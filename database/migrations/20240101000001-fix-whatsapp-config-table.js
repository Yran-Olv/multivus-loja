'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Verificar se a tabela whatsapp_configs existe (plural - incorreto)
    const [results] = await queryInterface.sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'whatsapp_configs'
      )
    `);
    
    const tableExists = results[0].exists;

    if (tableExists) {
      // Verificar se a tabela whatsapp_config (singular) já existe
      const [results2] = await queryInterface.sequelize.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'whatsapp_config'
        )
      `);
      
      const correctTableExists = results2[0]?.exists || false;

      if (!correctTableExists) {
        // Renomear a tabela de whatsapp_configs para whatsapp_config
        await queryInterface.sequelize.query(`
          ALTER TABLE whatsapp_configs RENAME TO whatsapp_config
        `);

        // Verificar e renomear colunas se necessário
        const [columns] = await queryInterface.sequelize.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'whatsapp_config' 
          AND column_name IN ('api_token', 'api_endpoint')
        `);

        if (columns.length > 0) {
          // Renomear api_token para token
          if (columns.find(c => c.column_name === 'api_token')) {
            await queryInterface.sequelize.query(`
              ALTER TABLE whatsapp_config RENAME COLUMN api_token TO token
            `);
          }

          // Renomear api_endpoint para endpoint
          if (columns.find(c => c.column_name === 'api_endpoint')) {
            await queryInterface.sequelize.query(`
              ALTER TABLE whatsapp_config RENAME COLUMN api_endpoint TO endpoint
            `);
          }
        }

        // Adicionar colunas user_id e queue_id se não existirem
        const [allColumns] = await queryInterface.sequelize.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'whatsapp_config'
        `);

        const columnNames = allColumns.map(c => c.column_name);

        if (!columnNames.includes('user_id')) {
          await queryInterface.addColumn('whatsapp_config', 'user_id', {
            type: Sequelize.STRING(255),
            allowNull: true,
          });
        }

        if (!columnNames.includes('queue_id')) {
          await queryInterface.addColumn('whatsapp_config', 'queue_id', {
            type: Sequelize.STRING(255),
            allowNull: true,
          });
        }
      } else {
        // Se a tabela correta já existe, apenas remover a incorreta
        await queryInterface.dropTable('whatsapp_configs');
      }
    } else {
      // Se a tabela não existe, criar corretamente
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
    }
  },

  async down(queryInterface, Sequelize) {
    // Não fazer nada no down - deixar como está
  },
};

