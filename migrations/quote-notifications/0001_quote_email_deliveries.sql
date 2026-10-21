-- Dedicated notification ledger only. Do not apply to a production database.
CREATE TABLE IF NOT EXISTS quote_email_deliveries (
  notification_key TEXT PRIMARY KEY NOT NULL,
  wix_request_id TEXT NOT NULL,
  collection_id TEXT NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('sending', 'accepted', 'failed')),
  provider_message_id TEXT,
  failure_code TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (collection_id, wix_request_id)
);
CREATE INDEX IF NOT EXISTS quote_email_deliveries_state ON quote_email_deliveries(state, created_at);
