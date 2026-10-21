BEGIN;

ALTER TABLE "connect_usn_lookup_rate_limits"
    RENAME TO "connect_auth_rate_limits";

ALTER TABLE "connect_auth_rate_limits"
    RENAME CONSTRAINT "connect_usn_lookup_rate_limits_pkey"
    TO "connect_auth_rate_limits_pkey";

ALTER INDEX "connect_usn_lookup_rate_limits_updated_at_idx"
    RENAME TO "connect_auth_rate_limits_updated_at_idx";

COMMIT;
