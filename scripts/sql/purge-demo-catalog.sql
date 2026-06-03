-- Remove apenas itens do seed de demonstração (mantém admin e pedidos de outros produtos).
DELETE FROM reviews WHERE product_id IN (
  SELECT id FROM products WHERE name IN (
    'Mouse Gamer RGB', 'Teclado Mecânico', 'Monitor 24" Full HD', 'SSD 500GB',
    'Memória RAM 16GB', 'Placa de Vídeo RTX 3060', 'Webcam Full HD', 'Headset Gamer'
  )
);
DELETE FROM order_items WHERE product_id IN (
  SELECT id FROM products WHERE name IN (
    'Mouse Gamer RGB', 'Teclado Mecânico', 'Monitor 24" Full HD', 'SSD 500GB',
    'Memória RAM 16GB', 'Placa de Vídeo RTX 3060', 'Webcam Full HD', 'Headset Gamer'
  )
);
DELETE FROM products WHERE name IN (
  'Mouse Gamer RGB', 'Teclado Mecânico', 'Monitor 24" Full HD', 'SSD 500GB',
  'Memória RAM 16GB', 'Placa de Vídeo RTX 3060', 'Webcam Full HD', 'Headset Gamer'
);
DELETE FROM services WHERE name IN (
  'Assistência Técnica', 'Instalação de Software', 'Formatação', 'Backup de Dados',
  'Remoção de Vírus', 'Upgrade de Hardware', 'Configuração de Rede', 'Suporte Remoto'
);
DELETE FROM softwares WHERE name IN (
  'Sistema de Gestão', 'E-commerce Platform', 'App Mobile', 'Dashboard Analytics'
);
