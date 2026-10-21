BEGIN;

CREATE TABLE "connect_usn_lookup_rate_limits" (
    "ip_hash" CHAR(64) NOT NULL,
    "window_started_at" TIMESTAMPTZ NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 1,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "connect_usn_lookup_rate_limits_pkey" PRIMARY KEY ("ip_hash")
);

CREATE INDEX "connect_usn_lookup_rate_limits_updated_at_idx"
    ON "connect_usn_lookup_rate_limits"("updated_at");

COMMIT;
