BEGIN;

-- CreateEnum
CREATE TYPE "MemberType" AS ENUM ('STUDENT', 'ALUMNUS');

-- CreateEnum
CREATE TYPE "MemberApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "ProfileVisibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateEnum
CREATE TYPE "MemberExperienceType" AS ENUM ('EMPLOYMENT', 'INTERNSHIP', 'HIGHER_STUDIES', 'FREELANCE', 'OTHER');

-- CreateEnum
CREATE TYPE "ConnectReportTarget" AS ENUM ('PROFILE', 'KNOWLEDGE_PAGE');

-- CreateEnum
CREATE TYPE "ConnectReportStatus" AS ENUM ('OPEN', 'IN_REVIEW', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "UsnDisputeStatus" AS ENUM ('OPEN', 'IN_REVIEW', 'RESOLVED', 'DISMISSED');

-- CreateTable
CREATE TABLE "connect_usn_claims" (
    "usn" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "connect_usn_claims_pkey" PRIMARY KEY ("usn")
);

-- CreateTable
CREATE TABLE "connect_member_profiles" (
    "auth_user_id" UUID NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "usn" VARCHAR(20) NOT NULL,
    "full_name" VARCHAR(120) NOT NULL,
    "graduation_year" SMALLINT NOT NULL,
    "member_type" "MemberType" NOT NULL,
    "bio" VARCHAR(600),
    "avatar_url" TEXT,
    "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "interests" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "skills_in_development" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "help_areas" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "location" VARCHAR(120),
    "phone" VARCHAR(40),
    "phone_public" BOOLEAN NOT NULL DEFAULT false,
    "contact_email" TEXT,
    "contact_email_public" BOOLEAN NOT NULL DEFAULT false,
    "visibility" "ProfileVisibility" NOT NULL DEFAULT 'PRIVATE',
    "approval_status" "MemberApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "reviewed_by_id" UUID,
    "review_note" TEXT,
    "reviewed_at" TIMESTAMPTZ,
    "current_role" VARCHAR(160),
    "company" VARCHAR(160),
    "professional_journey" TEXT,
    "open_to_collaborate" BOOLEAN NOT NULL DEFAULT false,
    "mentoring_available" BOOLEAN NOT NULL DEFAULT false,
    "referral_available" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "connect_member_profiles_pkey" PRIMARY KEY ("auth_user_id")
);

-- CreateTable
CREATE TABLE "connect_member_social_links" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "profile_id" UUID NOT NULL,
    "label" VARCHAR(60) NOT NULL,
    "url" VARCHAR(2048) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "connect_member_social_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "connect_member_projects" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "profile_id" UUID NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "description" TEXT,
    "technologies" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "repository_url" VARCHAR(2048),
    "demo_url" VARCHAR(2048),
    "seeking_collaborators" BOOLEAN NOT NULL DEFAULT false,
    "preferred_teammate_skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "connect_member_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "connect_member_experiences" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "profile_id" UUID NOT NULL,
    "type" "MemberExperienceType" NOT NULL DEFAULT 'EMPLOYMENT',
    "role" VARCHAR(160) NOT NULL,
    "organization" VARCHAR(180),
    "description" TEXT,
    "started_at" DATE,
    "ended_at" DATE,
    "is_current" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "connect_member_experiences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "connect_member_achievements" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "profile_id" UUID NOT NULL,
    "title" VARCHAR(180) NOT NULL,
    "description" TEXT,
    "achieved_at" DATE,
    "url" VARCHAR(2048),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "connect_member_achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "connect_member_knowledge_pages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "profile_id" UUID NOT NULL,
    "draft_markdown" TEXT,
    "published_markdown" TEXT,
    "draft_updated_at" TIMESTAMPTZ,
    "published_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "connect_member_knowledge_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "connect_reports" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "profile_id" UUID NOT NULL,
    "target" "ConnectReportTarget" NOT NULL,
    "reporter_auth_user_id" UUID NOT NULL,
    "reason" VARCHAR(80) NOT NULL,
    "details" VARCHAR(2000),
    "status" "ConnectReportStatus" NOT NULL DEFAULT 'OPEN',
    "reviewed_by_id" UUID,
    "resolution_note" VARCHAR(2000),
    "reviewed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "connect_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "connect_usn_disputes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "usn" VARCHAR(20) NOT NULL,
    "reporter_auth_user_id" UUID NOT NULL,
    "details" VARCHAR(4000) NOT NULL,
    "status" "UsnDisputeStatus" NOT NULL DEFAULT 'OPEN',
    "reviewed_by_id" UUID,
    "resolution_note" VARCHAR(2000),
    "reviewed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "connect_usn_disputes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "connect_member_profiles_slug_key" ON "connect_member_profiles"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "connect_member_profiles_usn_key" ON "connect_member_profiles"("usn");

-- CreateIndex
CREATE INDEX "connect_member_profiles_approval_status_visibility_member_t_idx" ON "connect_member_profiles"("approval_status", "visibility", "member_type", "graduation_year");

-- CreateIndex
CREATE INDEX "connect_member_profiles_graduation_year_idx" ON "connect_member_profiles"("graduation_year");

-- CreateIndex
CREATE INDEX "connect_member_profiles_full_name_idx" ON "connect_member_profiles"("full_name");

-- CreateIndex
CREATE INDEX "connect_member_profiles_current_role_idx" ON "connect_member_profiles"("current_role");

-- CreateIndex
CREATE INDEX "connect_member_profiles_company_idx" ON "connect_member_profiles"("company");

-- CreateIndex
CREATE INDEX "connect_member_social_links_profile_id_sort_order_idx" ON "connect_member_social_links"("profile_id", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "connect_member_social_links_profile_id_url_key" ON "connect_member_social_links"("profile_id", "url");

-- CreateIndex
CREATE INDEX "connect_member_projects_profile_id_sort_order_idx" ON "connect_member_projects"("profile_id", "sort_order");

-- CreateIndex
CREATE INDEX "connect_member_projects_seeking_collaborators_idx" ON "connect_member_projects"("seeking_collaborators");

-- CreateIndex
CREATE INDEX "connect_member_experiences_profile_id_sort_order_idx" ON "connect_member_experiences"("profile_id", "sort_order");

-- CreateIndex
CREATE INDEX "connect_member_experiences_organization_idx" ON "connect_member_experiences"("organization");

-- CreateIndex
CREATE INDEX "connect_member_experiences_role_idx" ON "connect_member_experiences"("role");

-- CreateIndex
CREATE INDEX "connect_member_achievements_profile_id_sort_order_idx" ON "connect_member_achievements"("profile_id", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "connect_member_knowledge_pages_profile_id_key" ON "connect_member_knowledge_pages"("profile_id");

-- CreateIndex
CREATE INDEX "connect_reports_status_created_at_idx" ON "connect_reports"("status", "created_at");

-- CreateIndex
CREATE INDEX "connect_reports_profile_id_target_idx" ON "connect_reports"("profile_id", "target");

-- CreateIndex
CREATE INDEX "connect_reports_reporter_auth_user_id_created_at_idx" ON "connect_reports"("reporter_auth_user_id", "created_at");

-- CreateIndex
CREATE INDEX "connect_usn_disputes_status_created_at_idx" ON "connect_usn_disputes"("status", "created_at");

-- CreateIndex
CREATE INDEX "connect_usn_disputes_reporter_auth_user_id_created_at_idx" ON "connect_usn_disputes"("reporter_auth_user_id", "created_at");

-- AddForeignKey
ALTER TABLE "connect_member_profiles" ADD CONSTRAINT "connect_member_profiles_usn_fkey" FOREIGN KEY ("usn") REFERENCES "connect_usn_claims"("usn") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connect_member_profiles" ADD CONSTRAINT "connect_member_profiles_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connect_member_social_links" ADD CONSTRAINT "connect_member_social_links_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "connect_member_profiles"("auth_user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connect_member_projects" ADD CONSTRAINT "connect_member_projects_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "connect_member_profiles"("auth_user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connect_member_experiences" ADD CONSTRAINT "connect_member_experiences_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "connect_member_profiles"("auth_user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connect_member_achievements" ADD CONSTRAINT "connect_member_achievements_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "connect_member_profiles"("auth_user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connect_member_knowledge_pages" ADD CONSTRAINT "connect_member_knowledge_pages_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "connect_member_profiles"("auth_user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connect_reports" ADD CONSTRAINT "connect_reports_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "connect_member_profiles"("auth_user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connect_reports" ADD CONSTRAINT "connect_reports_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connect_usn_disputes" ADD CONSTRAINT "connect_usn_disputes_usn_fkey" FOREIGN KEY ("usn") REFERENCES "connect_usn_claims"("usn") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connect_usn_disputes" ADD CONSTRAINT "connect_usn_disputes_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

COMMIT;
