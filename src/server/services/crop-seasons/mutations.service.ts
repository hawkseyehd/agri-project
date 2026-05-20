import type { CropSeasonInput } from "@/server/validators/crop-season.schema";

type CropSeasonDelegate = {
  create(args: unknown): Promise<{ id: string }>;
  update(args: unknown): Promise<unknown>;
};

type CropSeasonCreateDb = {
  cropSeason: Pick<CropSeasonDelegate, "create">;
};

type CropSeasonUpdateDb = {
  cropSeason: Pick<CropSeasonDelegate, "update">;
};

function toDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function cropSeasonData(input: CropSeasonInput) {
  return {
    blockId: input.blockId,
    cropType: input.cropType,
    cropName: input.cropName,
    variety: input.variety,
    startDate: toDate(input.startDate),
    endDate: input.endDate ? toDate(input.endDate) : null,
    harvestTiming: input.harvestTiming,
    status: input.status
  };
}

export async function createCropSeason(db: CropSeasonCreateDb, input: CropSeasonInput) {
  return db.cropSeason.create({
    data: cropSeasonData(input)
  });
}

export async function updateCropSeason(db: CropSeasonUpdateDb, id: string, input: CropSeasonInput) {
  return db.cropSeason.update({
    where: {
      id
    },
    data: cropSeasonData(input)
  });
}
