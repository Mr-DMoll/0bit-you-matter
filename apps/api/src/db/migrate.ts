/**
 * Self-contained database migration + seed runner.
 *
 * Runs automatically on every API startup (called from server.ts).
 * Uses raw pg — NOT Prisma — so it works with the transaction-mode pooler
 * (pgbouncer=true) without needing a direct database connection.
 *
 * Every statement is idempotent:
 *   CREATE TABLE IF NOT EXISTS
 *   ALTER TABLE ... ADD COLUMN IF NOT EXISTS
 *   ALTER TYPE  ... ADD VALUE  IF NOT EXISTS
 *   CREATE INDEX IF NOT EXISTS
 *   INSERT ... ON CONFLICT DO NOTHING
 *
 * Safe to run on every restart — existing data is never touched.
 */

import pg from "pg";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
dotenv.config();

export async function runMigrationsAndSeed(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.warn("⚠️  [MIGRATE] DATABASE_URL not set — skipping migrations");
    return;
  }

  const pool   = new pg.Pool({ connectionString, max: 1, idleTimeoutMillis: 10_000 });
  const client = await pool.connect();

  try {
    console.log("🔄 [MIGRATE] Running startup migrations...");

    // ── Enums — base ─────────────────────────────────────────────────────────
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE "AccountStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'DELETED');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE "RegistrationMode" AS ENUM ('INVITE_ONLY', 'SELF_REGISTER', 'SELF_REGISTER_AUTO');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    // Role enum — create if missing, then add new YouMatter values idempotently.
    // NOTE: ALTER TYPE ADD VALUE cannot run inside a PL/pgSQL DO block (no subtransactions),
    // so we use plain ALTER TYPE ... IF NOT EXISTS statements directly.
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'USER');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    // Add YouMatter roles — safe no-ops if they already exist
    await client.query(`ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'CONTENT_MANAGER';`);
    await client.query(`ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'REVIEWER';`);
    await client.query(`ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'DATA_VERIFIER';`);
    await client.query(`ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'LEARNER';`);

    // ── Enums — YouMatter domain ──────────────────────────────────────────────
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE "ContentStatus" AS ENUM (
          'AI_GENERATED','IN_REVIEW','APPROVED','VERIFIED','REJECTED','ARCHIVED'
        );
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE "AssessmentType" AS ENUM (
          'INTEREST','APTITUDE','PERSONALITY','VALUES'
        );
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE "AssessmentStatus" AS ENUM (
          'NOT_STARTED','IN_PROGRESS','COMPLETED'
        );
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE "ContentType" AS ENUM (
          'CAREER','UNIVERSITY_PROGRAMME','UNIVERSITY_PROGRAMMES_BULK',
          'TVET_PROGRAMMES_BULK','PATHWAY','BURSARY','ASSESSMENT_QUESTION'
        );
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    // Idempotent additions for enum values added after initial deploy
    await client.query(`ALTER TYPE "ContentType" ADD VALUE IF NOT EXISTS 'UNIVERSITY_PROGRAMMES_BULK';`);
    await client.query(`ALTER TYPE "ContentType" ADD VALUE IF NOT EXISTS 'TVET_PROGRAMMES_BULK';`);
    await client.query(`ALTER TYPE "ContentType" ADD VALUE IF NOT EXISTS 'PATHWAY';`);
    await client.query(`ALTER TYPE "ContentType" ADD VALUE IF NOT EXISTS 'ASSESSMENT_QUESTIONS_BULK';`);
    await client.query(`ALTER TABLE "ContentReview" ADD COLUMN IF NOT EXISTS "entityId" TEXT;`);
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE "PathwayType" AS ENUM ('UNIVERSITY','TVET','LEARNERSHIP','DIRECT');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE "GenerationJobStatus" AS ENUM (
          'QUEUED','PROCESSING','COMPLETED','FAILED'
        );
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE "ReviewStatus" AS ENUM (
          'PENDING','IN_PROGRESS','APPROVED','REJECTED'
        );
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE "VerificationStatus" AS ENUM (
          'PENDING','IN_PROGRESS','VERIFIED','FLAGGED'
        );
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    // ── User table ────────────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS "User" (
        "id"                   TEXT            NOT NULL,
        "email"                TEXT            NOT NULL,
        "password"             TEXT,
        "role"                 "Role"          NOT NULL DEFAULT 'LEARNER',
        "accountStatus"        "AccountStatus" NOT NULL DEFAULT 'PENDING',
        "firstName"            TEXT,
        "lastName"             TEXT,
        "displayName"          TEXT,
        "avatarUrl"            TEXT,
        "phone"                TEXT,
        "verificationCode"     TEXT,
        "verificationExpires"  TIMESTAMP(3),
        "passwordResetToken"   TEXT,
        "passwordResetExpires" TIMESTAMP(3),
        "lastActiveAt"         TIMESTAMP(3),
        "city"                 TEXT,
        "country"              TEXT,
        "language"             TEXT,
        "dateOfBirth"          TIMESTAMP(3),
        "googleId"             TEXT,
        "googleRefreshToken"   TEXT,
        "invitedById"          TEXT,
        "createdAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "User_pkey" PRIMARY KEY ("id")
      );
    `);

    // Make password nullable for existing databases (learners use Google OAuth)
    await client.query(`ALTER TABLE "User" ALTER COLUMN "password" DROP NOT NULL;`);

    // Idempotent column additions for new YouMatter fields
    await client.query(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "city"       TEXT;`);
    await client.query(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "country"    TEXT;`);
    await client.query(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "language"   TEXT;`);
    await client.query(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "dateOfBirth" TIMESTAMP(3);`);
    await client.query(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phone"      TEXT;`);
    await client.query(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "grade"      INT;`);
    await client.query(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "province"   TEXT;`);
    await client.query(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "school"     TEXT;`);
    await client.query(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "managerId"  TEXT;`);

    // ── Supporting tables ─────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS "AuditLog" (
        "id"        TEXT NOT NULL,
        "userId"    TEXT NOT NULL,
        "action"    TEXT NOT NULL,
        "meta"      JSONB,
        "ip"        TEXT,
        "userAgent" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS "Notification" (
        "id"        TEXT    NOT NULL,
        "userId"    TEXT    NOT NULL,
        "title"     TEXT    NOT NULL,
        "body"      TEXT    NOT NULL,
        "read"      BOOLEAN NOT NULL DEFAULT false,
        "link"      TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS "SystemSetting" (
        "id"        TEXT NOT NULL,
        "key"       TEXT NOT NULL,
        "value"     TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("id")
      );
    `);

    // ── YouMatter — Careers ───────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS "CareerCluster" (
        "id"          TEXT NOT NULL,
        "name"        TEXT NOT NULL,
        "slug"        TEXT NOT NULL,
        "description" TEXT,
        "iconName"    TEXT,
        "colorHex"    TEXT,
        "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "CareerCluster_pkey" PRIMARY KEY ("id")
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS "Career" (
        "id"               TEXT            NOT NULL,
        "title"            TEXT            NOT NULL,
        "slug"             TEXT            NOT NULL,
        "clusterId"        TEXT            NOT NULL,
        "riasecCodes"      TEXT[]          NOT NULL DEFAULT '{}',
        "overview"         TEXT,
        "dayInTheLife"     TEXT,
        "howToGetThere"    TEXT,
        "earningsMin"      INT,
        "earningsMax"      INT,
        "earningsCurrency" TEXT            NOT NULL DEFAULT 'ZAR',
        "earningsNote"     TEXT,
        "nqfLevelMin"      INT,
        "saContext"        TEXT,
        "status"           "ContentStatus" NOT NULL DEFAULT 'AI_GENERATED',
        "qualityScore"     FLOAT,
        "viewCount"        INT             NOT NULL DEFAULT 0,
        "generatedById"    TEXT,
        "lastVerifiedAt"   TIMESTAMP(3),
        "lastVerifiedBy"   TEXT,
        "createdAt"        TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt"        TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Career_pkey" PRIMARY KEY ("id")
      );
    `);

    // ── YouMatter — Universities ──────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS "University" (
        "id"             TEXT            NOT NULL,
        "name"           TEXT            NOT NULL,
        "abbreviation"   TEXT,
        "province"       TEXT            NOT NULL,
        "type"           TEXT,
        "website"        TEXT,
        "logoUrl"        TEXT,
        "status"         "ContentStatus" NOT NULL DEFAULT 'AI_GENERATED',
        "lastVerifiedAt" TIMESTAMP(3),
        "createdAt"      TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt"      TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "University_pkey" PRIMARY KEY ("id")
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS "Programme" (
        "id"                  TEXT            NOT NULL,
        "universityId"        TEXT            NOT NULL,
        "name"                TEXT            NOT NULL,
        "faculty"             TEXT,
        "duration"            INT,
        "nqfLevel"            INT,
        "apsMin"              INT,
        "subjectRequirements" JSONB,
        "applicationOpenDate"  TIMESTAMP(3),
        "applicationCloseDate" TIMESTAMP(3),
        "status"              "ContentStatus" NOT NULL DEFAULT 'AI_GENERATED',
        "lastVerifiedAt"      TIMESTAMP(3),
        "createdAt"           TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt"           TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Programme_pkey" PRIMARY KEY ("id")
      );
    `);

    // ── YouMatter — TVET ─────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS "TvetCollege" (
        "id"             TEXT            NOT NULL,
        "name"           TEXT            NOT NULL,
        "abbreviation"   TEXT,
        "province"       TEXT            NOT NULL,
        "website"        TEXT,
        "logoUrl"        TEXT,
        "sourceUrl"      TEXT,
        "verifiedNote"   TEXT,
        "status"         "ContentStatus" NOT NULL DEFAULT 'AI_GENERATED',
        "lastVerifiedAt" TIMESTAMP(3),
        "createdAt"      TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt"      TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "TvetCollege_pkey" PRIMARY KEY ("id")
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS "TvetProgramme" (
        "id"                  TEXT            NOT NULL,
        "collegeId"           TEXT            NOT NULL,
        "name"                TEXT            NOT NULL,
        "programmeType"       TEXT            NOT NULL,
        "field"               TEXT            NOT NULL,
        "ncvLevel"            INT,
        "natedLevel"          TEXT,
        "duration"            INT,
        "entryRequirement"    TEXT,
        "description"         TEXT,
        "careerOutcomes"      TEXT[]          NOT NULL DEFAULT '{}',
        "subjectRequirements" TEXT,
        "sourceUrl"           TEXT,
        "verifiedNote"        TEXT,
        "status"              "ContentStatus" NOT NULL DEFAULT 'AI_GENERATED',
        "lastVerifiedAt"      TIMESTAMP(3),
        "createdAt"           TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt"           TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "TvetProgramme_pkey" PRIMARY KEY ("id")
      );
    `);

    // ── YouMatter — Pathways ──────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS "Pathway" (
        "id"                  TEXT            NOT NULL,
        "careerId"            TEXT            NOT NULL,
        "type"                "PathwayType"   NOT NULL,
        "title"               TEXT            NOT NULL,
        "durationLabel"       TEXT,
        "durationMonths"      INT,
        "estimatedCostMin"    INT,
        "estimatedCostMax"    INT,
        "costNote"            TEXT,
        "earnWhileLearn"      BOOLEAN         NOT NULL DEFAULT false,
        "entryRequirements"   TEXT,
        "apsMin"              INT,
        "gradeMin"            INT,
        "steps"               JSONB,
        "fundingOptions"      TEXT[]          NOT NULL DEFAULT '{}',
        "setaName"            TEXT,
        "qualificationEarned" TEXT,
        "nqfLevelEarned"      INT,
        "employmentNote"      TEXT,
        "pros"                TEXT[]          NOT NULL DEFAULT '{}',
        "cons"                TEXT[]          NOT NULL DEFAULT '{}',
        "sourceUrl"           TEXT,
        "verifiedNote"        TEXT,
        "status"              "ContentStatus" NOT NULL DEFAULT 'AI_GENERATED',
        "lastVerifiedAt"      TIMESTAMP(3),
        "createdAt"           TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt"           TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Pathway_pkey" PRIMARY KEY ("id")
      );
    `);

    // ── YouMatter — Bursaries ─────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS "Bursary" (
        "id"                  TEXT            NOT NULL,
        "name"                TEXT            NOT NULL,
        "provider"            TEXT            NOT NULL,
        "description"         TEXT,
        "amount"              TEXT,
        "fieldsOfStudy"       TEXT[]          NOT NULL DEFAULT '{}',
        "eligibilityCriteria" JSONB,
        "applicationUrl"      TEXT,
        "openDate"            TIMESTAMP(3),
        "closeDate"           TIMESTAMP(3),
        "status"              "ContentStatus" NOT NULL DEFAULT 'AI_GENERATED',
        "lastVerifiedAt"      TIMESTAMP(3),
        "sourceUrl"           TEXT,
        "createdAt"           TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt"           TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Bursary_pkey" PRIMARY KEY ("id")
      );
    `);

    // ── YouMatter — Assessments ───────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS "AssessmentQuestion" (
        "id"             TEXT             NOT NULL,
        "assessmentType" "AssessmentType" NOT NULL,
        "questionText"   TEXT             NOT NULL,
        "contextNote"    TEXT,
        "riasecMapping"  TEXT[]           NOT NULL DEFAULT '{}',
        "options"        JSONB,
        "status"         "ContentStatus"  NOT NULL DEFAULT 'AI_GENERATED',
        "orderIndex"     INT              NOT NULL DEFAULT 0,
        "createdAt"      TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt"      TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "AssessmentQuestion_pkey" PRIMARY KEY ("id")
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS "LearnerAssessmentSession" (
        "id"             TEXT               NOT NULL,
        "learnerId"      TEXT               NOT NULL,
        "assessmentType" "AssessmentType"   NOT NULL,
        "status"         "AssessmentStatus" NOT NULL DEFAULT 'NOT_STARTED',
        "startedAt"      TIMESTAMP(3),
        "completedAt"    TIMESTAMP(3),
        "results"        JSONB,
        "createdAt"      TIMESTAMP(3)       NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt"      TIMESTAMP(3)       NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "LearnerAssessmentSession_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "LearnerAssessmentSession_learnerId_assessmentType_key"
          UNIQUE ("learnerId", "assessmentType")
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS "LearnerAnswer" (
        "id"          TEXT         NOT NULL,
        "sessionId"   TEXT         NOT NULL,
        "questionId"  TEXT         NOT NULL,
        "answerValue" TEXT         NOT NULL,
        "answeredAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "LearnerAnswer_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "LearnerAnswer_sessionId_questionId_key" UNIQUE ("sessionId", "questionId")
      );
    `);

    // ── YouMatter — Learner Profile ───────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS "LearnerProfile" (
        "id"               TEXT         NOT NULL,
        "learnerId"        TEXT         NOT NULL,
        "riasecType"       TEXT,
        "riasecScores"     JSONB,
        "profileNarrative" TEXT,
        "strengthsSummary" TEXT,
        "subjects"         JSONB,
        "chosenCareerId"   TEXT,
        "generatedAt"      TIMESTAMP(3),
        "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "LearnerProfile_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "LearnerProfile_learnerId_key" UNIQUE ("learnerId")
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS "LearnerCareerMatch" (
        "id"              TEXT  NOT NULL,
        "profileId"       TEXT  NOT NULL,
        "careerId"        TEXT  NOT NULL,
        "matchPercentage" FLOAT NOT NULL,
        "matchReason"     TEXT,
        CONSTRAINT "LearnerCareerMatch_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "LearnerCareerMatch_profileId_careerId_key" UNIQUE ("profileId", "careerId")
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS "LearnerSavedCareer" (
        "id"        TEXT         NOT NULL,
        "profileId" TEXT         NOT NULL,
        "careerId"  TEXT         NOT NULL,
        "savedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "LearnerSavedCareer_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "LearnerSavedCareer_profileId_careerId_key" UNIQUE ("profileId", "careerId")
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS "LearnerRoadmap" (
        "id"         TEXT         NOT NULL,
        "profileId"  TEXT         NOT NULL,
        "careerId"   TEXT         NOT NULL,
        "milestones" JSONB,
        "isActive"   BOOLEAN      NOT NULL DEFAULT true,
        "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "LearnerRoadmap_pkey" PRIMARY KEY ("id")
      );
    `);

    // ── YouMatter — Content Pipeline ──────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS "PromptTemplate" (
        "id"           TEXT          NOT NULL,
        "contentType"  "ContentType" NOT NULL,
        "name"         TEXT          NOT NULL,
        "version"      INT           NOT NULL DEFAULT 1,
        "isActive"     BOOLEAN       NOT NULL DEFAULT true,
        "systemPrompt" TEXT          NOT NULL,
        "userPrompt"   TEXT          NOT NULL,
        "qualityScore" FLOAT,
        "rejectionRate" FLOAT,
        "editDistance" FLOAT,
        "usageCount"   INT           NOT NULL DEFAULT 0,
        "createdAt"    TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt"    TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PromptTemplate_pkey" PRIMARY KEY ("id")
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS "GenerationJob" (
        "id"               TEXT                  NOT NULL,
        "contentType"      "ContentType"         NOT NULL,
        "status"           "GenerationJobStatus" NOT NULL DEFAULT 'QUEUED',
        "parameters"       JSONB,
        "promptTemplateId" TEXT,
        "outputCareerId"   TEXT,
        "result"           JSONB,
        "errorLog"         TEXT,
        "retryCount"       INT                   NOT NULL DEFAULT 0,
        "requestedById"    TEXT                  NOT NULL,
        "startedAt"        TIMESTAMP(3),
        "completedAt"      TIMESTAMP(3),
        "createdAt"        TIMESTAMP(3)          NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt"        TIMESTAMP(3)          NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "GenerationJob_pkey" PRIMARY KEY ("id")
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS "ContentReview" (
        "id"               TEXT           NOT NULL,
        "contentType"      "ContentType"  NOT NULL,
        "careerId"         TEXT,
        "questionId"       TEXT,
        "reviewerId"       TEXT           NOT NULL,
        "status"           "ReviewStatus" NOT NULL DEFAULT 'PENDING',
        "confidenceRating" INT,
        "notes"            TEXT,
        "trackedChanges"   JSONB,
        "assignedAt"       TIMESTAMP(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "dueAt"            TIMESTAMP(3),
        "completedAt"      TIMESTAMP(3),
        "createdAt"        TIMESTAMP(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt"        TIMESTAMP(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "ContentReview_pkey" PRIMARY KEY ("id")
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS "DataVerification" (
        "id"             TEXT                 NOT NULL,
        "contentType"    "ContentType"        NOT NULL,
        "careerId"       TEXT,
        "programmeId"    TEXT,
        "bursaryId"      TEXT,
        "verifierId"     TEXT                 NOT NULL,
        "status"         "VerificationStatus" NOT NULL DEFAULT 'PENDING',
        "sourceUrl"      TEXT,
        "sourceNotes"    TEXT,
        "verifiedFields" JSONB,
        "verifiedAt"     TIMESTAMP(3),
        "createdAt"      TIMESTAMP(3)         NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt"      TIMESTAMP(3)         NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "DataVerification_pkey" PRIMARY KEY ("id")
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS "Source" (
        "id"               TEXT         NOT NULL,
        "name"             TEXT         NOT NULL,
        "url"              TEXT         NOT NULL,
        "type"             TEXT         NOT NULL,
        "isActive"         BOOLEAN      NOT NULL DEFAULT true,
        "reliabilityRating" INT,
        "lastCheckedAt"    TIMESTAMP(3),
        "notes"            TEXT,
        "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Source_pkey" PRIMARY KEY ("id")
      );
    `);

    // ── Indexes ───────────────────────────────────────────────────────────────
    // User
    await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key"    ON "User"("email");`);
    await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS "User_googleId_key" ON "User"("googleId");`);
    await client.query(`CREATE INDEX        IF NOT EXISTS "User_email_idx"    ON "User"("email");`);
    await client.query(`CREATE INDEX        IF NOT EXISTS "User_role_idx"     ON "User"("role");`);
    await client.query(`CREATE INDEX        IF NOT EXISTS "User_googleId_idx" ON "User"("googleId");`);
    await client.query(`CREATE INDEX        IF NOT EXISTS "User_managerId_idx" ON "User"("managerId");`);
    await client.query(`CREATE INDEX        IF NOT EXISTS "User_province_idx"  ON "User"("province");`);
    // AuditLog / Notification / SystemSetting
    await client.query(`CREATE INDEX        IF NOT EXISTS "AuditLog_userId_idx"    ON "AuditLog"("userId");`);
    await client.query(`CREATE INDEX        IF NOT EXISTS "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");`);
    await client.query(`CREATE INDEX        IF NOT EXISTS "Notification_userId_idx"      ON "Notification"("userId");`);
    await client.query(`CREATE INDEX        IF NOT EXISTS "Notification_userId_read_idx" ON "Notification"("userId","read");`);
    await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS "SystemSetting_key_key" ON "SystemSetting"("key");`);
    // CareerCluster / Career
    await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS "CareerCluster_name_key" ON "CareerCluster"("name");`);
    await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS "CareerCluster_slug_key" ON "CareerCluster"("slug");`);
    await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS "Career_slug_key"        ON "Career"("slug");`);
    await client.query(`CREATE INDEX        IF NOT EXISTS "Career_clusterId_idx"   ON "Career"("clusterId");`);
    await client.query(`CREATE INDEX        IF NOT EXISTS "Career_status_idx"      ON "Career"("status");`);
    // University / Programme
    await client.query(`CREATE INDEX IF NOT EXISTS "University_province_idx"     ON "University"("province");`);
    await client.query(`CREATE INDEX IF NOT EXISTS "University_status_idx"       ON "University"("status");`);
    await client.query(`CREATE INDEX IF NOT EXISTS "Programme_universityId_idx"  ON "Programme"("universityId");`);
    await client.query(`CREATE INDEX IF NOT EXISTS "Programme_apsMin_idx"        ON "Programme"("apsMin");`);
    await client.query(`CREATE INDEX IF NOT EXISTS "Programme_status_idx"        ON "Programme"("status");`);
    // Bursary
    await client.query(`CREATE INDEX IF NOT EXISTS "Bursary_status_idx"    ON "Bursary"("status");`);
    await client.query(`CREATE INDEX IF NOT EXISTS "Bursary_closeDate_idx" ON "Bursary"("closeDate");`);
    // Assessment
    await client.query(`CREATE INDEX IF NOT EXISTS "AssessmentQuestion_assessmentType_idx" ON "AssessmentQuestion"("assessmentType");`);
    await client.query(`CREATE INDEX IF NOT EXISTS "AssessmentQuestion_status_idx"         ON "AssessmentQuestion"("status");`);
    await client.query(`CREATE INDEX IF NOT EXISTS "LearnerAssessmentSession_learnerId_idx"      ON "LearnerAssessmentSession"("learnerId");`);
    await client.query(`CREATE INDEX IF NOT EXISTS "LearnerAssessmentSession_assessmentType_idx" ON "LearnerAssessmentSession"("assessmentType");`);
    await client.query(`CREATE INDEX IF NOT EXISTS "LearnerAssessmentSession_status_idx"         ON "LearnerAssessmentSession"("status");`);
    await client.query(`CREATE INDEX IF NOT EXISTS "LearnerAnswer_sessionId_idx" ON "LearnerAnswer"("sessionId");`);
    // Learner Profile
    await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS "LearnerProfile_learnerId_key"           ON "LearnerProfile"("learnerId");`);
    await client.query(`CREATE INDEX        IF NOT EXISTS "LearnerCareerMatch_profileId_idx"       ON "LearnerCareerMatch"("profileId");`);
    await client.query(`CREATE INDEX        IF NOT EXISTS "LearnerCareerMatch_matchPercentage_idx" ON "LearnerCareerMatch"("matchPercentage");`);
    await client.query(`CREATE INDEX        IF NOT EXISTS "LearnerSavedCareer_profileId_idx"       ON "LearnerSavedCareer"("profileId");`);
    await client.query(`CREATE INDEX        IF NOT EXISTS "LearnerRoadmap_profileId_idx"           ON "LearnerRoadmap"("profileId");`);
    await client.query(`CREATE INDEX        IF NOT EXISTS "LearnerRoadmap_careerId_idx"            ON "LearnerRoadmap"("careerId");`);
    // Content Pipeline
    await client.query(`CREATE INDEX IF NOT EXISTS "PromptTemplate_contentType_isActive_idx" ON "PromptTemplate"("contentType","isActive");`);
    await client.query(`CREATE INDEX IF NOT EXISTS "GenerationJob_status_idx"        ON "GenerationJob"("status");`);
    await client.query(`CREATE INDEX IF NOT EXISTS "GenerationJob_contentType_idx"   ON "GenerationJob"("contentType");`);
    await client.query(`CREATE INDEX IF NOT EXISTS "GenerationJob_requestedById_idx" ON "GenerationJob"("requestedById");`);
    await client.query(`CREATE INDEX IF NOT EXISTS "ContentReview_reviewerId_idx"    ON "ContentReview"("reviewerId");`);
    await client.query(`CREATE INDEX IF NOT EXISTS "ContentReview_status_idx"        ON "ContentReview"("status");`);
    await client.query(`CREATE INDEX IF NOT EXISTS "ContentReview_contentType_idx"   ON "ContentReview"("contentType");`);
    await client.query(`CREATE INDEX IF NOT EXISTS "DataVerification_verifierId_idx" ON "DataVerification"("verifierId");`);
    await client.query(`CREATE INDEX IF NOT EXISTS "DataVerification_status_idx"     ON "DataVerification"("status");`);
    await client.query(`CREATE INDEX IF NOT EXISTS "Source_type_idx"     ON "Source"("type");`);
    await client.query(`CREATE INDEX IF NOT EXISTS "Source_isActive_idx" ON "Source"("isActive");`);
    // TVET
    await client.query(`CREATE INDEX IF NOT EXISTS "TvetCollege_province_idx"         ON "TvetCollege"("province");`);
    await client.query(`CREATE INDEX IF NOT EXISTS "TvetCollege_status_idx"           ON "TvetCollege"("status");`);
    await client.query(`CREATE INDEX IF NOT EXISTS "TvetProgramme_collegeId_idx"      ON "TvetProgramme"("collegeId");`);
    await client.query(`CREATE INDEX IF NOT EXISTS "TvetProgramme_programmeType_idx"  ON "TvetProgramme"("programmeType");`);
    await client.query(`CREATE INDEX IF NOT EXISTS "TvetProgramme_field_idx"          ON "TvetProgramme"("field");`);
    await client.query(`CREATE INDEX IF NOT EXISTS "TvetProgramme_status_idx"         ON "TvetProgramme"("status");`);
    // Pathways
    await client.query(`CREATE INDEX IF NOT EXISTS "Pathway_careerId_idx" ON "Pathway"("careerId");`);
    await client.query(`CREATE INDEX IF NOT EXISTS "Pathway_type_idx"     ON "Pathway"("type");`);
    await client.query(`CREATE INDEX IF NOT EXISTS "Pathway_status_idx"   ON "Pathway"("status");`);

    // ── Idempotent column additions ───────────────────────────────────────────
    // TvetCollege — college type (PUBLIC | PRIVATE)
    await client.query(`ALTER TABLE "TvetCollege" ADD COLUMN IF NOT EXISTS "collegeType" TEXT NOT NULL DEFAULT 'PUBLIC';`);
    await client.query(`CREATE INDEX IF NOT EXISTS "TvetCollege_collegeType_idx" ON "TvetCollege"("collegeType");`);
    // LearnerProfile — study preference fields
    await client.query(`ALTER TABLE "LearnerProfile" ADD COLUMN IF NOT EXISTS "studyProvincePreference" TEXT;`);
    await client.query(`ALTER TABLE "LearnerProfile" ADD COLUMN IF NOT EXISTS "chosenPathwayType"       TEXT;`);
    // DataVerification — TVET + Pathway FK columns
    await client.query(`ALTER TABLE "DataVerification" ADD COLUMN IF NOT EXISTS "tvetProgrammeId" TEXT;`);
    await client.query(`ALTER TABLE "DataVerification" ADD COLUMN IF NOT EXISTS "pathwayId"       TEXT;`);

    // ── Foreign keys ──────────────────────────────────────────────────────────
    const fk = async (constraint: string, sql: string) => {
      await client.query(`
        DO $$ BEGIN
          ALTER TABLE ${sql};
        EXCEPTION WHEN duplicate_object THEN null; END $$;
      `);
    };
    await fk("User_invitedById_fkey",
      `"User" ADD CONSTRAINT "User_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE`);
    await fk("User_managerId_fkey",
      `"User" ADD CONSTRAINT "User_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE`);
    await fk("AuditLog_userId_fkey",
      `"AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    await fk("Notification_userId_fkey",
      `"Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    await fk("Career_clusterId_fkey",
      `"Career" ADD CONSTRAINT "Career_clusterId_fkey" FOREIGN KEY ("clusterId") REFERENCES "CareerCluster"("id")`);
    await fk("Programme_universityId_fkey",
      `"Programme" ADD CONSTRAINT "Programme_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    await fk("LearnerAssessmentSession_learnerId_fkey",
      `"LearnerAssessmentSession" ADD CONSTRAINT "LearnerAssessmentSession_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    await fk("LearnerAnswer_sessionId_fkey",
      `"LearnerAnswer" ADD CONSTRAINT "LearnerAnswer_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "LearnerAssessmentSession"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    await fk("LearnerAnswer_questionId_fkey",
      `"LearnerAnswer" ADD CONSTRAINT "LearnerAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "AssessmentQuestion"("id")`);
    await fk("LearnerProfile_learnerId_fkey",
      `"LearnerProfile" ADD CONSTRAINT "LearnerProfile_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    await fk("LearnerCareerMatch_profileId_fkey",
      `"LearnerCareerMatch" ADD CONSTRAINT "LearnerCareerMatch_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "LearnerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    await fk("LearnerCareerMatch_careerId_fkey",
      `"LearnerCareerMatch" ADD CONSTRAINT "LearnerCareerMatch_careerId_fkey" FOREIGN KEY ("careerId") REFERENCES "Career"("id")`);
    await fk("LearnerSavedCareer_profileId_fkey",
      `"LearnerSavedCareer" ADD CONSTRAINT "LearnerSavedCareer_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "LearnerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    await fk("LearnerSavedCareer_careerId_fkey",
      `"LearnerSavedCareer" ADD CONSTRAINT "LearnerSavedCareer_careerId_fkey" FOREIGN KEY ("careerId") REFERENCES "Career"("id")`);
    await fk("LearnerRoadmap_profileId_fkey",
      `"LearnerRoadmap" ADD CONSTRAINT "LearnerRoadmap_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "LearnerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    await fk("LearnerRoadmap_careerId_fkey",
      `"LearnerRoadmap" ADD CONSTRAINT "LearnerRoadmap_careerId_fkey" FOREIGN KEY ("careerId") REFERENCES "Career"("id")`);
    await fk("ContentReview_reviewerId_fkey",
      `"ContentReview" ADD CONSTRAINT "ContentReview_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id")`);
    await fk("DataVerification_verifierId_fkey",
      `"DataVerification" ADD CONSTRAINT "DataVerification_verifierId_fkey" FOREIGN KEY ("verifierId") REFERENCES "User"("id")`);
    await fk("GenerationJob_requestedById_fkey",
      `"GenerationJob" ADD CONSTRAINT "GenerationJob_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id")`);
    await fk("GenerationJob_promptTemplateId_fkey",
      `"GenerationJob" ADD CONSTRAINT "GenerationJob_promptTemplateId_fkey" FOREIGN KEY ("promptTemplateId") REFERENCES "PromptTemplate"("id")`);
    await fk("TvetProgramme_collegeId_fkey",
      `"TvetProgramme" ADD CONSTRAINT "TvetProgramme_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "TvetCollege"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    await fk("Pathway_careerId_fkey",
      `"Pathway" ADD CONSTRAINT "Pathway_careerId_fkey" FOREIGN KEY ("careerId") REFERENCES "Career"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    await fk("DataVerification_tvetProgrammeId_fkey",
      `"DataVerification" ADD CONSTRAINT "DataVerification_tvetProgrammeId_fkey" FOREIGN KEY ("tvetProgrammeId") REFERENCES "TvetProgramme"("id") ON DELETE SET NULL`);
    await fk("DataVerification_pathwayId_fkey",
      `"DataVerification" ADD CONSTRAINT "DataVerification_pathwayId_fkey" FOREIGN KEY ("pathwayId") REFERENCES "Pathway"("id") ON DELETE SET NULL`);

    console.log("✅ [MIGRATE] Schema ready");

    // ── Seed system settings ──────────────────────────────────────────────────
    await client.query(`
      INSERT INTO "SystemSetting" ("id","key","value","createdAt","updatedAt")
      VALUES (gen_random_uuid()::text,'registration_mode','SELF_REGISTER_AUTO',NOW(),NOW())
      ON CONFLICT ("key") DO NOTHING;
    `);
    await client.query(`
      INSERT INTO "SystemSetting" ("id","key","value","createdAt","updatedAt")
      VALUES (gen_random_uuid()::text,'app_name','You Matter',NOW(),NOW())
      ON CONFLICT ("key") DO NOTHING;
    `);

    // ── Seed super admin ──────────────────────────────────────────────────────
    const existing = await client.query(
      `SELECT id FROM "User" WHERE role = 'SUPER_ADMIN' LIMIT 1`
    );
    if (existing.rowCount === 0) {
      const passwordHash = await bcrypt.hash("SuperAdmin123!", 12);
      const id = Math.random().toString(36).slice(2) + Date.now().toString(36);
      await client.query(`
        INSERT INTO "User" (
          "id","email","password","role","accountStatus",
          "firstName","lastName","displayName","createdAt","updatedAt"
        ) VALUES ($1,$2,$3,'SUPER_ADMIN','ACTIVE','Super','Admin','Super Admin',NOW(),NOW())
        ON CONFLICT ("email") DO NOTHING;
      `, [id, "superadmin@example.com", passwordHash]);
      console.log("🌱 [MIGRATE] Super admin created → superadmin@example.com / SuperAdmin123!");
    } else {
      console.log("🌱 [MIGRATE] Super admin already exists — skipping seed");
    }

  } catch (err: any) {
    console.error("❌ [MIGRATE] Migration failed:", err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}
