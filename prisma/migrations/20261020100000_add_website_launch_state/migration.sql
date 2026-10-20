-- CreateEnum
CREATE TYPE "LaunchStatus" AS ENUM ('NORMAL', 'STAY_TUNED', 'COUNTDOWN_RUNNING', 'ANIMATION', 'LAUNCHED');

-- CreateTable
CREATE TABLE "website_launch_state" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "status" "LaunchStatus" NOT NULL DEFAULT 'NORMAL',
    "countdown_started_at" TIMESTAMPTZ,
    "countdown_ends_at" TIMESTAMPTZ,
    "animation_started_at" TIMESTAMPTZ,
    "animation_ends_at" TIMESTAMPTZ,
    "launched_at" TIMESTAMPTZ,
    "version" BIGINT NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by_admin_id" UUID,

    CONSTRAINT "website_launch_state_pkey" PRIMARY KEY ("id")
);

-- Ensure a strict single-row global state
ALTER TABLE "website_launch_state"
ADD CONSTRAINT "website_launch_state_single_row" CHECK ("id" = 1);

-- CreateIndex
CREATE INDEX "website_launch_state_status_idx" ON "website_launch_state"("status");

-- AddForeignKey
ALTER TABLE "website_launch_state" ADD CONSTRAINT "website_launch_state_updated_by_admin_id_fkey" FOREIGN KEY ("updated_by_admin_id") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed singleton row
INSERT INTO "website_launch_state" ("id", "status", "version")
VALUES (1, 'NORMAL', 0)
ON CONFLICT ("id") DO NOTHING;
