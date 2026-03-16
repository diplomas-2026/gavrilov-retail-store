ALTER TABLE assistant_messages
    ADD COLUMN IF NOT EXISTS recommended_product_ids TEXT;

CREATE INDEX IF NOT EXISTS idx_assistant_messages_user_id_recommended_products
    ON assistant_messages(user_id)
    WHERE recommended_product_ids IS NOT NULL;

