-- CreateEnum
CREATE TYPE "RawDataSourceType" AS ENUM ('CDS', 'WEBSITE', 'IPEDS', 'NCES', 'LINKU_OUTCOMES');

-- CreateEnum
CREATE TYPE "ApplicationRound" AS ENUM ('ED', 'ED2', 'EA', 'REA', 'RD', 'ROLLING');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('DRAFT', 'SUBMITTED');

-- CreateEnum
CREATE TYPE "EssayType" AS ENUM ('PERSONAL', 'SUPPLEMENT');

-- CreateEnum
CREATE TYPE "AdmissionsResult" AS ENUM ('ACCEPTED', 'REJECTED', 'WAITLIST');

-- CreateTable
CREATE TABLE "University" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "country" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "University_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UniversityRawData" (
    "id" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "sourceType" "RawDataSourceType" NOT NULL,
    "year" INTEGER NOT NULL,
    "rawJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UniversityRawData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UniversityStatistics" (
    "id" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "gpa25" DECIMAL(4,2),
    "gpa50" DECIMAL(4,2),
    "gpa75" DECIMAL(4,2),
    "sat25" INTEGER,
    "sat50" INTEGER,
    "sat75" INTEGER,
    "acceptanceRate" DECIMAL(5,2),
    "internationalAcceptanceRate" DECIMAL(5,2),
    "needBlind" BOOLEAN NOT NULL DEFAULT false,
    "needAwareSeverity" INTEGER,
    "edBoostFactor" DECIMAL(3,2),
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "dataConfidenceScore" INTEGER,
    "approvedAt" TIMESTAMP(3),
    "approvedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UniversityStatistics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UniversityStatisticsHistory" (
    "id" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "gpa25" DECIMAL(4,2),
    "gpa50" DECIMAL(4,2),
    "gpa75" DECIMAL(4,2),
    "sat25" INTEGER,
    "sat50" INTEGER,
    "sat75" INTEGER,
    "acceptanceRate" DECIMAL(5,2),
    "internationalAcceptanceRate" DECIMAL(5,2),
    "needBlind" BOOLEAN NOT NULL DEFAULT false,
    "needAwareSeverity" INTEGER,
    "edBoostFactor" DECIMAL(3,2),
    "dataConfidenceScore" INTEGER,
    "effectiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UniversityStatisticsHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UniversityMajorMultiplier" (
    "id" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "majorName" TEXT NOT NULL,
    "multiplier" DECIMAL(3,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UniversityMajorMultiplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UniversityValues" (
    "id" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "valuesJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UniversityValues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserGlobalProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "gpa" DECIMAL(4,2),
    "sat" INTEGER,
    "schoolContext" TEXT,
    "ecasJson" JSONB NOT NULL DEFAULT '[]',
    "honorsJson" JSONB NOT NULL DEFAULT '[]',
    "awardsJson" JSONB NOT NULL DEFAULT '[]',
    "intendedMajor" TEXT,
    "personalEssay" TEXT,
    "lorRating" INTEGER,
    "hooksJson" JSONB DEFAULT '[]',
    "resumeUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserGlobalProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserUniversityApplication" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "round" "ApplicationRound" NOT NULL,
    "financialAidRequest" BOOLEAN,
    "supplementEssay" TEXT,
    "universitySpecificQuestions" JSONB,
    "portfolioLinks" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "ApplicationStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserUniversityApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lor" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "teacherName" TEXT NOT NULL,
    "strengthRating" INTEGER NOT NULL,
    "relationshipRating" INTEGER NOT NULL,
    "credibilityRating" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Lor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EssayAnalysis" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "universityId" TEXT,
    "essayType" "EssayType" NOT NULL,
    "contentHash" TEXT,
    "coherence" INTEGER,
    "narrativeDepth" INTEGER,
    "originality" INTEGER,
    "alignment" INTEGER,
    "essayScore0_100" INTEGER,
    "valueAlignmentScore0_100" INTEGER,
    "rawResponseJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EssayAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdmissionsOutcome" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "universityId" TEXT NOT NULL,
    "profileVector" JSONB NOT NULL,
    "result" "AdmissionsResult" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdmissionsOutcome_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "University_slug_key" ON "University"("slug");

-- CreateIndex
CREATE INDEX "University_slug_idx" ON "University"("slug");

-- CreateIndex
CREATE INDEX "UniversityRawData_universityId_sourceType_year_idx" ON "UniversityRawData"("universityId", "sourceType", "year");

-- CreateIndex
CREATE UNIQUE INDEX "UniversityStatistics_universityId_year_key" ON "UniversityStatistics"("universityId", "year");

-- CreateIndex
CREATE INDEX "UniversityStatistics_universityId_isActive_idx" ON "UniversityStatistics"("universityId", "isActive");

-- CreateIndex
CREATE INDEX "UniversityStatisticsHistory_universityId_year_effectiveAt_idx" ON "UniversityStatisticsHistory"("universityId", "year", "effectiveAt");

-- CreateIndex
CREATE UNIQUE INDEX "UniversityMajorMultiplier_universityId_majorName_key" ON "UniversityMajorMultiplier"("universityId", "majorName");

-- CreateIndex
CREATE INDEX "UniversityMajorMultiplier_universityId_idx" ON "UniversityMajorMultiplier"("universityId");

-- CreateIndex
CREATE UNIQUE INDEX "UniversityValues_universityId_key" ON "UniversityValues"("universityId");

-- CreateIndex
CREATE UNIQUE INDEX "UserGlobalProfile_userId_key" ON "UserGlobalProfile"("userId");

-- CreateIndex
CREATE INDEX "UserGlobalProfile_userId_idx" ON "UserGlobalProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserUniversityApplication_userId_universityId_key" ON "UserUniversityApplication"("userId", "universityId");

-- CreateIndex
CREATE INDEX "UserUniversityApplication_userId_idx" ON "UserUniversityApplication"("userId");

-- CreateIndex
CREATE INDEX "UserUniversityApplication_universityId_idx" ON "UserUniversityApplication"("universityId");

-- CreateIndex
CREATE INDEX "Lor_userId_idx" ON "Lor"("userId");

-- CreateIndex
CREATE INDEX "EssayAnalysis_userId_idx" ON "EssayAnalysis"("userId");

-- CreateIndex
CREATE INDEX "EssayAnalysis_universityId_idx" ON "EssayAnalysis"("universityId");

-- CreateIndex
CREATE INDEX "AdmissionsOutcome_universityId_idx" ON "AdmissionsOutcome"("universityId");

-- CreateIndex
CREATE INDEX "AdmissionsOutcome_userId_idx" ON "AdmissionsOutcome"("userId");

-- AddForeignKey
ALTER TABLE "UniversityRawData" ADD CONSTRAINT "UniversityRawData_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UniversityStatistics" ADD CONSTRAINT "UniversityStatistics_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UniversityStatistics" ADD CONSTRAINT "UniversityStatistics_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UniversityStatisticsHistory" ADD CONSTRAINT "UniversityStatisticsHistory_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UniversityMajorMultiplier" ADD CONSTRAINT "UniversityMajorMultiplier_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UniversityValues" ADD CONSTRAINT "UniversityValues_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserGlobalProfile" ADD CONSTRAINT "UserGlobalProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserUniversityApplication" ADD CONSTRAINT "UserUniversityApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserUniversityApplication" ADD CONSTRAINT "UserUniversityApplication_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lor" ADD CONSTRAINT "Lor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EssayAnalysis" ADD CONSTRAINT "EssayAnalysis_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EssayAnalysis" ADD CONSTRAINT "EssayAnalysis_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdmissionsOutcome" ADD CONSTRAINT "AdmissionsOutcome_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdmissionsOutcome" ADD CONSTRAINT "AdmissionsOutcome_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
