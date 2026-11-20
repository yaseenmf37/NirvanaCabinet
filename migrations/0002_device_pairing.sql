CREATE TABLE IF NOT EXISTS "pairing_intents" (
  "code_hash" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "company_id" text NOT NULL REFERENCES "companies"("id") ON DELETE CASCADE,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "expires_at" timestamptz NOT NULL,
  "consumed_at" timestamptz,
  "device_id" text
);
CREATE INDEX IF NOT EXISTS "pairing_intents_expiry_idx" ON "pairing_intents" ("expires_at");
CREATE INDEX IF NOT EXISTS "pairing_intents_user_idx" ON "pairing_intents" ("user_id");

CREATE TABLE IF NOT EXISTS "devices" (
  "id" text PRIMARY KEY NOT NULL,
  "company_id" text NOT NULL REFERENCES "companies"("id") ON DELETE CASCADE,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "fingerprint" text NOT NULL UNIQUE,
  "sketchup_version" text NOT NULL,
  "os" text NOT NULL,
  "extension_version" text NOT NULL,
  "paired_at" timestamptz NOT NULL,
  "last_seen_at" timestamptz NOT NULL,
  "status" text NOT NULL CHECK ("status" IN ('paired', 'revoked')),
  "revoked_at" timestamptz,
  "revoke_reason" text,
  "refresh_hash" text NOT NULL,
  "refresh_jti" text NOT NULL,
  "rotation_count" integer NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS "devices_user_idx" ON "devices" ("user_id");
CREATE INDEX IF NOT EXISTS "devices_company_idx" ON "devices" ("company_id");
