-- Для быстрого подсчёта суточного бюджета токенов (глобально по всем пользователям).
CREATE INDEX IF NOT EXISTS idx_assistant_messages_assistant_created_at
    ON assistant_messages (created_at)
    WHERE author = 'ASSISTANT' AND total_tokens IS NOT NULL;

