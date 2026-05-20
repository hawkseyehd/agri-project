import type { FarmInput, FarmWithInitialBlockInput, LandBlockInput } from "@/server/validators/farm-land.schema";

type FarmDelegate = {
  create(args: unknown): Promise<{ id: string }>;
  update(args: unknown): Promise<unknown>;
};

type LandBlockDelegate = {
  create(args: unknown): Promise<{ id: string }>;
  update(args: unknown): Promise<unknown>;
};

type FarmCreateDb = {
  farm: Pick<FarmDelegate, "create">;
};

type FarmUpdateDb = {
  farm: Pick<FarmDelegate, "update">;
};

type LandBlockCreateDb = {
  landBlock: Pick<LandBlockDelegate, "create">;
};

type LandBlockUpdateDb = {
  landBlock: Pick<LandBlockDelegate, "update">;
};

export async function createFarm(db: FarmCreateDb, input: FarmWithInitialBlockInput) {
  const { initialBlockName, initialBlockAreaAcres, ...farmData } = input;

  return db.farm.create({
    data: {
      ...farmData,
      ...(initialBlockName
        ? {
            blocks: {
              create: {
                name: initialBlockName,
                areaAcres: initialBlockAreaAcres
              }
            }
          }
        : {})
    }
  });
}

export async function updateFarm(db: FarmUpdateDb, id: string, input: FarmInput) {
  return db.farm.update({
    where: {
      id
    },
    data: input
  });
}

export async function createLandBlock(db: LandBlockCreateDb, input: LandBlockInput) {
  return db.landBlock.create({
    data: {
      farmId: input.farmId,
      name: input.name,
      areaAcres: input.areaAcres
    }
  });
}

export async function updateLandBlock(db: LandBlockUpdateDb, id: string, input: LandBlockInput) {
  return db.landBlock.update({
    where: {
      id
    },
    data: {
      farmId: input.farmId,
      name: input.name,
      areaAcres: input.areaAcres
    }
  });
}
