BEGIN;

CREATE TABLE "connect_usn_roster" (
    "usn" VARCHAR(20) NOT NULL,
    "full_name" VARCHAR(120) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "imported_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "connect_usn_roster_pkey" PRIMARY KEY ("usn")
);

CREATE INDEX "connect_usn_roster_full_name_idx" ON "connect_usn_roster"("full_name");
CREATE INDEX "connect_usn_roster_is_active_idx" ON "connect_usn_roster"("is_active");

COMMIT;
