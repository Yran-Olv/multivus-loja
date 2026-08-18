-- Entrega automática WhatsApp (Whaticket) — softwares
ALTER TABLE softwares ADD COLUMN IF NOT EXISTS activation_url TEXT;
ALTER TABLE softwares ADD COLUMN IF NOT EXISTS activation_message_template TEXT;
ALTER TABLE softwares ADD COLUMN IF NOT EXISTS order_id_prefix VARCHAR(16);
ALTER TABLE softwares ADD COLUMN IF NOT EXISTS link_validity_days INTEGER;
