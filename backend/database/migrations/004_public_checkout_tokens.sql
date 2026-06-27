ALTER TABLE visitors ADD COLUMN public_checkout_token_hash TEXT;
ALTER TABLE visitors ADD COLUMN public_checkout_token_expires_at TEXT;
ALTER TABLE visitors ADD COLUMN public_checkout_used_at TEXT;
CREATE INDEX IF NOT EXISTS idx_visitors_public_checkout_token ON visitors(public_checkout_token_hash, public_checkout_used_at, public_checkout_token_expires_at);

ALTER TABLE vehicles ADD COLUMN public_checkout_token_hash TEXT;
ALTER TABLE vehicles ADD COLUMN public_checkout_token_expires_at TEXT;
ALTER TABLE vehicles ADD COLUMN public_checkout_used_at TEXT;
CREATE INDEX IF NOT EXISTS idx_vehicles_public_checkout_token ON vehicles(public_checkout_token_hash, public_checkout_used_at, public_checkout_token_expires_at);
