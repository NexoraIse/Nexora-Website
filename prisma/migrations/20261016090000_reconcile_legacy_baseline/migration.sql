BEGIN;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM "admins"
        WHERE "username" !~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
    ) THEN
        RAISE EXCEPTION 'Cannot reconcile legacy admin usernames: every username must be an email address. Resolve legacy admin accounts before retrying this migration.';
    END IF;
END
$$;

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'EDITOR');

-- CreateEnum
CREATE TYPE "PublishStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "NoticePriority" AS ENUM ('NORMAL', 'IMPORTANT', 'URGENT');

-- Preserve legacy admin login identifiers as email addresses.
ALTER INDEX "admins_username_key" RENAME TO "admins_email_key";

-- AlterTable
ALTER TABLE "admins" RENAME COLUMN "username" TO "email";
ALTER TABLE "admins"
ADD COLUMN     "name" TEXT,
ADD COLUMN     "password" TEXT,
ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'ADMIN',
ADD COLUMN     "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

-- AlterTable
ALTER TABLE "notices" ADD COLUMN     "attachment_name" TEXT,
ADD COLUMN     "attachment_type" TEXT,
ADD COLUMN     "attachment_url" TEXT,
ADD COLUMN     "author_name" TEXT DEFAULT 'Nexora Executive Board',
ADD COLUMN     "author_role" TEXT DEFAULT 'ISE Department',
ADD COLUMN     "category" TEXT NOT NULL DEFAULT 'General',
ADD COLUMN     "created_by_id" UUID,
ADD COLUMN     "expiry_date" TIMESTAMPTZ,
ADD COLUMN     "is_pinned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "priority" "NoticePriority" NOT NULL DEFAULT 'NORMAL',
ADD COLUMN     "publish_date" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "slug" TEXT,
ADD COLUMN     "status" "PublishStatus" NOT NULL DEFAULT 'PUBLISHED',
ADD COLUMN     "summary" TEXT,
ADD COLUMN     "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "full_description" TEXT,
    "image_url" TEXT,
    "icon_name" TEXT DEFAULT 'Code',
    "start_date" TIMESTAMPTZ,
    "end_date" TIMESTAMPTZ,
    "date_display" TEXT,
    "venue" TEXT,
    "venue_display" TEXT,
    "status" "PublishStatus" NOT NULL DEFAULT 'PUBLISHED',
    "registration_open" BOOLEAN NOT NULL DEFAULT true,
    "registration_url" TEXT,
    "registration_deadline" TIMESTAMPTZ,
    "eligibility" TEXT,
    "organizer" TEXT DEFAULT 'Nexora ISE Technical Committee',
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_by_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "achievements" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "student_or_team_name" TEXT,
    "category" TEXT NOT NULL,
    "competition_or_event" TEXT,
    "award_or_position" TEXT,
    "achievement_date" TIMESTAMPTZ,
    "date_display" TEXT,
    "image" TEXT,
    "external_url" TEXT,
    "status" "PublishStatus" NOT NULL DEFAULT 'PUBLISHED',
    "created_by_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_resources" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "slug" TEXT,
    "description" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "semester" INTEGER,
    "academic_year" TEXT,
    "category" TEXT NOT NULL DEFAULT 'notes',
    "resource_type" TEXT NOT NULL DEFAULT 'PDF',
    "file_url" TEXT,
    "thumbnail_url" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "PublishStatus" NOT NULL DEFAULT 'PUBLISHED',
    "created_by_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "learning_resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_categories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entity_id" TEXT,
    "details" TEXT,
    "ip_address" TEXT,
    "admin_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "active_sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "token_hash" TEXT NOT NULL,
    "admin_email" TEXT NOT NULL,
    "user_agent" TEXT,
    "ip_address" TEXT,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "active_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "events_slug_key" ON "events"("slug");

-- CreateIndex
CREATE INDEX "events_status_idx" ON "events"("status");

-- CreateIndex
CREATE INDEX "events_category_idx" ON "events"("category");

-- CreateIndex
CREATE UNIQUE INDEX "achievements_slug_key" ON "achievements"("slug");

-- CreateIndex
CREATE INDEX "achievements_status_idx" ON "achievements"("status");

-- CreateIndex
CREATE INDEX "achievements_category_idx" ON "achievements"("category");

-- CreateIndex
CREATE UNIQUE INDEX "learning_resources_slug_key" ON "learning_resources"("slug");

-- CreateIndex
CREATE INDEX "learning_resources_status_idx" ON "learning_resources"("status");

-- CreateIndex
CREATE INDEX "learning_resources_subject_idx" ON "learning_resources"("subject");

-- CreateIndex
CREATE INDEX "learning_resources_semester_idx" ON "learning_resources"("semester");

-- CreateIndex
CREATE UNIQUE INDEX "content_categories_name_key" ON "content_categories"("name");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_entity_idx" ON "audit_logs"("entity");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "active_sessions_token_hash_key" ON "active_sessions"("token_hash");

-- CreateIndex
CREATE UNIQUE INDEX "notices_slug_key" ON "notices"("slug");

-- CreateIndex
CREATE INDEX "notices_status_idx" ON "notices"("status");

-- CreateIndex
CREATE INDEX "notices_category_idx" ON "notices"("category");

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notices" ADD CONSTRAINT "notices_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "achievements" ADD CONSTRAINT "achievements_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_resources" ADD CONSTRAINT "learning_resources_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

COMMIT;
