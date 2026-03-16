ALTER TABLE assistant_messages
    ADD COLUMN IF NOT EXISTS prompt_tokens INTEGER,
    ADD COLUMN IF NOT EXISTS completion_tokens INTEGER,
    ADD COLUMN IF NOT EXISTS total_tokens INTEGER,
    ADD COLUMN IF NOT EXISTS model VARCHAR(120);

CREATE INDEX IF NOT EXISTS idx_assistant_messages_user_id_author_id ON assistant_messages(user_id, author, id);
