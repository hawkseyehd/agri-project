ALTER TYPE "PermissionPage" ADD VALUE IF NOT EXISTS 'YIELDS';

CREATE TABLE "YieldRecord" (
  "id" TEXT NOT NULL,
  "farmId" TEXT NOT NULL,
  "landBlockId" TEXT NOT NULL,
  "cropSeasonId" TEXT NOT NULL,
  "harvestId" TEXT,
  "ownerId" TEXT,
  "cropName" TEXT NOT NULL,
  "quantity" DECIMAL(65,30) NOT NULL,
  "unit" TEXT NOT NULL,
  "yieldDate" TIMESTAMP(3) NOT NULL,
  "farmName" TEXT NOT NULL,
  "city" TEXT,
  "district" TEXT,
  "region" TEXT,
  "country" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "YieldRecord_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "YieldRecord_harvestId_key" ON "YieldRecord"("harvestId");
CREATE INDEX "YieldRecord_cropName_district_yieldDate_idx" ON "YieldRecord"("cropName", "district", "yieldDate");
CREATE INDEX "YieldRecord_farmId_yieldDate_idx" ON "YieldRecord"("farmId", "yieldDate");
CREATE INDEX "YieldRecord_ownerId_yieldDate_idx" ON "YieldRecord"("ownerId", "yieldDate");

ALTER TABLE "YieldRecord" ADD CONSTRAINT "YieldRecord_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "YieldRecord" ADD CONSTRAINT "YieldRecord_landBlockId_fkey" FOREIGN KEY ("landBlockId") REFERENCES "LandBlock"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "YieldRecord" ADD CONSTRAINT "YieldRecord_cropSeasonId_fkey" FOREIGN KEY ("cropSeasonId") REFERENCES "CropSeason"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "YieldRecord" ADD CONSTRAINT "YieldRecord_harvestId_fkey" FOREIGN KEY ("harvestId") REFERENCES "Harvest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "YieldRecord" ADD CONSTRAINT "YieldRecord_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "YieldRecord" (
  "id",
  "farmId",
  "landBlockId",
  "cropSeasonId",
  "harvestId",
  "ownerId",
  "cropName",
  "quantity",
  "unit",
  "yieldDate",
  "farmName",
  "city",
  "district",
  "region",
  "country",
  "notes",
  "updatedAt"
)
SELECT
  'yield_' || h."id",
  f."id",
  lb."id",
  cs."id",
  h."id",
  f."ownerId",
  cs."cropName",
  h."quantity",
  h."unit",
  h."harvestDate",
  f."name",
  f."city",
  f."district",
  f."region",
  f."country",
  h."notes",
  CURRENT_TIMESTAMP
FROM "Harvest" h
JOIN "CropSeason" cs ON cs."id" = h."cropSeasonId"
JOIN "LandBlock" lb ON lb."id" = cs."blockId"
JOIN "Farm" f ON f."id" = lb."farmId"
ON CONFLICT ("harvestId") DO NOTHING;
