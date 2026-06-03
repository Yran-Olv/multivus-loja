'use strict';

/**
 * Catálogo de demonstração — NÃO roda em produção por padrão.
 * Para forçar localmente: SEED_DEMO_DATA=1 npm run db:seed
 */
function allowDemoCatalog() {
  if (process.env.SEED_DEMO_DATA === '1') return true;
  if (process.env.SEED_DEMO_DATA === '0') return false;
  return process.env.NODE_ENV !== 'production';
}

/** @type {import('sequelize-cli').Seeder} */
module.exports = {
  async up(queryInterface) {
    if (!allowDemoCatalog()) {
      console.log('[seed] Catálogo demo ignorado (produção). Use SEED_DEMO_DATA=1 só em dev.');
      return;
    }

    await queryInterface.bulkInsert(
      'services',
      [
        { name: 'Assistência Técnica', description: 'Serviço completo de assistência técnica para computadores e notebooks', icon: 'wrench', price_from: 50.0, is_active: true, created_at: new Date() },
        { name: 'Instalação de Software', description: 'Instalação e configuração de softwares diversos', icon: 'download', price_from: 30.0, is_active: true, created_at: new Date() },
        { name: 'Formatação', description: 'Formatação completa de computadores e notebooks', icon: 'refresh-cw', price_from: 80.0, is_active: true, created_at: new Date() },
        { name: 'Backup de Dados', description: 'Serviço de backup e recuperação de dados', icon: 'save', price_from: 40.0, is_active: true, created_at: new Date() },
        { name: 'Remoção de Vírus', description: 'Remoção completa de vírus e malwares', icon: 'shield', price_from: 60.0, is_active: true, created_at: new Date() },
        { name: 'Upgrade de Hardware', description: 'Atualização e upgrade de componentes de hardware', icon: 'cpu', price_from: 100.0, is_active: true, created_at: new Date() },
        { name: 'Configuração de Rede', description: 'Configuração de redes domésticas e empresariais', icon: 'network', price_from: 70.0, is_active: true, created_at: new Date() },
        { name: 'Suporte Remoto', description: 'Suporte técnico remoto via acesso remoto', icon: 'monitor', price_from: 45.0, is_active: true, created_at: new Date() },
      ],
      { ignoreDuplicates: true }
    );

    const now = new Date();
    await queryInterface.bulkInsert(
      'products',
      [
        { name: 'Mouse Gamer RGB', description: 'Mouse gamer com iluminação RGB e 6 botões programáveis', category: 'Periféricos', price: 89.9, stock_quantity: 50, is_active: true, created_at: now, updated_at: now },
        { name: 'Teclado Mecânico', description: 'Teclado mecânico com switches Cherry MX', category: 'Periféricos', price: 299.9, stock_quantity: 30, is_active: true, created_at: now, updated_at: now },
        { name: 'Monitor 24" Full HD', description: 'Monitor LED 24 polegadas Full HD 1920x1080', category: 'Monitores', price: 599.9, stock_quantity: 20, is_active: true, created_at: now, updated_at: now },
        { name: 'SSD 500GB', description: 'SSD SATA III 500GB de alta performance', category: 'Armazenamento', price: 249.9, stock_quantity: 40, is_active: true, created_at: now, updated_at: now },
        { name: 'Memória RAM 16GB', description: 'Kit memória RAM DDR4 16GB (2x8GB) 3200MHz', category: 'Memória', price: 399.9, stock_quantity: 25, is_active: true, created_at: now, updated_at: now },
        { name: 'Placa de Vídeo RTX 3060', description: 'Placa de vídeo NVIDIA GeForce RTX 3060 12GB', category: 'Placas de Vídeo', price: 1999.9, stock_quantity: 10, is_active: true, created_at: now, updated_at: now },
        { name: 'Webcam Full HD', description: 'Webcam Full HD 1080p com microfone integrado', category: 'Periféricos', price: 149.9, stock_quantity: 35, is_active: true, created_at: now, updated_at: now },
        { name: 'Headset Gamer', description: 'Headset gamer com som surround 7.1 e microfone retrátil', category: 'Áudio', price: 199.9, stock_quantity: 45, is_active: true, created_at: now, updated_at: now },
      ],
      { ignoreDuplicates: true }
    );

    await queryInterface.bulkInsert(
      'softwares',
      [
        { name: 'Sistema de Gestão', description: 'Sistema completo de gestão empresarial com módulos de vendas, estoque e financeiro', icon: 'briefcase', is_active: true, created_at: now, updated_at: now },
        { name: 'E-commerce Platform', description: 'Plataforma completa de e-commerce com painel administrativo', icon: 'shopping-cart', is_active: true, created_at: now, updated_at: now },
        { name: 'App Mobile', description: 'Aplicativo mobile nativo para iOS e Android', icon: 'smartphone', is_active: true, created_at: now, updated_at: now },
        { name: 'Dashboard Analytics', description: 'Dashboard de analytics e métricas em tempo real', icon: 'bar-chart', is_active: true, created_at: now, updated_at: now },
      ],
      { ignoreDuplicates: true }
    );
  },

  async down(queryInterface) {
    const demoProducts = [
      'Mouse Gamer RGB',
      'Teclado Mecânico',
      'Monitor 24" Full HD',
      'SSD 500GB',
      'Memória RAM 16GB',
      'Placa de Vídeo RTX 3060',
      'Webcam Full HD',
      'Headset Gamer',
    ];
    const demoServices = [
      'Assistência Técnica',
      'Instalação de Software',
      'Formatação',
      'Backup de Dados',
      'Remoção de Vírus',
      'Upgrade de Hardware',
      'Configuração de Rede',
      'Suporte Remoto',
    ];
    const demoSoftwares = [
      'Sistema de Gestão',
      'E-commerce Platform',
      'App Mobile',
      'Dashboard Analytics',
    ];

    const { Op } = require('sequelize');
    await queryInterface.bulkDelete('products', { name: { [Op.in]: demoProducts } }, {});
    await queryInterface.bulkDelete('services', { name: { [Op.in]: demoServices } }, {});
    await queryInterface.bulkDelete('softwares', { name: { [Op.in]: demoSoftwares } }, {});
  },
};
