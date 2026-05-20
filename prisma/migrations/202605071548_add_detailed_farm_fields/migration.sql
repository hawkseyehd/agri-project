-- CreateEnum
CREATE TYPE "FarmType" AS ENUM ('OWNER', 'CONTRACTOR', 'LEASE');

-- AlterTable
ALTER TABLE "Farm"
ADD COLUMN "address" TEXT NOT NULL DEFAULT '',
ADD COLUMN "area" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN "type" "FarmType" NOT NULL DEFAULT 'OWNER',
ADD COLUMN "farmCode" TEXT,
ADD COLUMN "village" TEXT,
ADD COLUMN "city" TEXT,
ADD COLUMN "district" TEXT,
ADD COLUMN "region" TEXT,
ADD COLUMN "country" TEXT,
ADD COLUMN "gpsCoordinates" TEXT,
ADD COLUMN "registrationNumber" TEXT,
ADD COLUMN "landRecordNumber" TEXT,
ADD COLUMN "leaseStartDate" TIMESTAMP(3),
ADD COLUMN "leaseEndDate" TIMESTAMP(3),
ADD COLUMN "contactPerson" TEXT,
ADD COLUMN "contactPhone" TEXT,
ADD COLUMN "description" TEXT,
ADD COLUMN "soilType" TEXT,
ADD COLUMN "soilPh" DECIMAL(65,30),
ADD COLUMN "organicMatterLevel" TEXT,
ADD COLUMN "salinityIssue" TEXT,
ADD COLUMN "lastSoilTestDate" TIMESTAMP(3),
ADD COLUMN "fertilityNotes" TEXT,
ADD COLUMN "knownProblems" TEXT,
ADD COLUMN "irrigationMethod" TEXT,
ADD COLUMN "waterSource" TEXT,
ADD COLUMN "waterSourcesCount" INTEGER,
ADD COLUMN "pumpType" TEXT,
ADD COLUMN "waterAvailability" TEXT,
ADD COLUMN "irrigationEnergySource" TEXT,
ADD COLUMN "waterScheduleNotes" TEXT,
ADD COLUMN "permanentWorkersCount" INTEGER,
ADD COLUMN "seasonalWorkersCount" INTEGER,
ADD COLUMN "defaultDailyWage" DECIMAL(65,30),
ADD COLUMN "inventoryNotes" TEXT,
ADD COLUMN "equipmentNotes" TEXT,
ADD COLUMN "openingBalance" DECIMAL(65,30),
ADD COLUMN "currency" TEXT,
ADD COLUMN "seasonalBudget" DECIMAL(65,30),
ADD COLUMN "expenseCategories" TEXT,
ADD COLUMN "documentsNotes" TEXT,
ADD COLUMN "alertsNotes" TEXT,
ADD COLUMN "managerNotes" TEXT;

UPDATE "Farm"
SET "address" = COALESCE("location", '')
WHERE "address" = '';
