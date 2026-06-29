ALTER TABLE "CropSeason" ADD COLUMN "archivedAt" TIMESTAMP(3);
ALTER TABLE "Harvest" ADD COLUMN "archivedAt" TIMESTAMP(3);
ALTER TABLE "Sale" ADD COLUMN "archivedAt" TIMESTAMP(3);

CREATE INDEX "CropSeason_archivedAt_idx" ON "CropSeason"("archivedAt");
CREATE INDEX "Harvest_archivedAt_idx" ON "Harvest"("archivedAt");
CREATE INDEX "Sale_archivedAt_idx" ON "Sale"("archivedAt");
