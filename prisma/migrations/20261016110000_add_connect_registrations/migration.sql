CREATE TABLE "connect_registrations" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "auth_user_id" UUID,
  "email" VARCHAR(320) NOT NULL,
  "usn" VARCHAR(20) NOT NULL,
  "full_name" VARCHAR(120) NOT NULL,
  "email_confirmed_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "connect_registrations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "connect_registrations_auth_user_id_key"
  ON "connect_registrations"("auth_user_id");
CREATE UNIQUE INDEX "connect_registrations_email_key"
  ON "connect_registrations"("email");
CREATE UNIQUE INDEX "connect_registrations_usn_key"
  ON "connect_registrations"("usn");
CREATE INDEX "connect_registrations_email_confirmed_at_idx"
  ON "connect_registrations"("email_confirmed_at");
