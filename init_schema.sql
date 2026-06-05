-- Supabase SQL Schema for MedCenter
-- Run this in the Supabase SQL Editor

DROP TABLE IF EXISTS "admins";
DROP TABLE IF EXISTS "users";
DROP TABLE IF EXISTS "lessons";
DROP TABLE IF EXISTS "questions";
DROP TABLE IF EXISTS "question_lists";

CREATE TABLE IF NOT EXISTS "admins" (
  "id" TEXT PRIMARY KEY,
  "accessKey" TEXT,
  "name" TEXT
);

CREATE TABLE IF NOT EXISTS "users" (
  "id" TEXT PRIMARY KEY,
  "ra" TEXT,
  "name" TEXT,
  "completedLessons" TEXT[],
  "avatarColor" TEXT,
  "totalXP" INTEGER,
  "exerciseProgress" JSONB,
  "listProgress" JSONB,
  "isRankVisible" BOOLEAN
);

CREATE TABLE IF NOT EXISTS "lessons" (
  "id" TEXT PRIMARY KEY,
  "subjectId" TEXT,
  "title" TEXT,
  "youtubeIds" TEXT[],
  "duration" TEXT,
  "category" TEXT,
  "slideUrl" TEXT,
  "summaryUrl" TEXT,
  "date" TEXT,
  "type" TEXT,
  "description" TEXT,
  "targetSlots" TEXT[],
  "period" INTEGER,
  "isContinuation" BOOLEAN,
  "examPeriod" TEXT,
  "createdAt" TEXT,
  "updatedAt" TEXT
);

CREATE TABLE IF NOT EXISTS "questions" (
  "id" TEXT PRIMARY KEY,
  "subjectId" TEXT,
  "lessonId" TEXT,
  "question" TEXT,
  "options" TEXT[],
  "correctOptionIndex" INTEGER,
  "explanation" TEXT
);

CREATE TABLE IF NOT EXISTS "question_lists" (
  "id" TEXT PRIMARY KEY,
  "title" TEXT,
  "description" TEXT,
  "period" INTEGER,
  "subjectId" TEXT,
  "questions" JSONB,
  "createdAt" TEXT
);

-- RLS Configuration (Optional, default allows operation if keys are provided but best practice is to set policies)
-- For this migration we'll permit anon access temporarily for insert:

ALTER TABLE "admins" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "lessons" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "questions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "question_lists" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon all admins" ON "admins" FOR ALL USING (true);
CREATE POLICY "Allow anon all users" ON "users" FOR ALL USING (true);
CREATE POLICY "Allow anon all lessons" ON "lessons" FOR ALL USING (true);
CREATE POLICY "Allow anon all questions" ON "questions" FOR ALL USING (true);
CREATE POLICY "Allow anon all question_lists" ON "question_lists" FOR ALL USING (true);
