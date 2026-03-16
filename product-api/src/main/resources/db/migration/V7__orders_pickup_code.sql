ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS pickup_code VARCHAR(6);

-- Уникальность кода получения среди заказов (только если код задан).
CREATE UNIQUE INDEX IF NOT EXISTS uq_orders_pickup_code
    ON orders (pickup_code)
    WHERE pickup_code IS NOT NULL;

