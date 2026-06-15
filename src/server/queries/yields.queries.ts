import type { Role } from "@prisma/client";

import { canAccessAllFarms } from "@/server/auth/permissions";
import { prisma } from "@/server/db/prisma";
import { summarizeYieldRecords } from "@/server/services/yields/yield.service";
import type { YieldFilters } from "@/server/validators/yield.schema";

export type YieldAccessContext = {
  role: Role;
  assignedFarmIds: string[];
};

function dateFilter(filters: YieldFilters) {
  return {
    ...(filters.from ? { gte: filters.from } : {}),
    ...(filters.to ? { lte: filters.to } : {})
  };
}

function yieldWhere(filters: YieldFilters = {}) {
  const yieldDate = dateFilter(filters);

  return {
    ...(Object.keys(yieldDate).length > 0 ? { yieldDate } : {}),
    ...(filters.cropName ? { cropName: { contains: filters.cropName, mode: "insensitive" as const } } : {}),
    ...(filters.district ? { district: { contains: filters.district, mode: "insensitive" as const } } : {}),
    ...(filters.city ? { city: { contains: filters.city, mode: "insensitive" as const } } : {}),
    ...(filters.ownerId ? { ownerId: filters.ownerId } : {}),
    ...(filters.farmId ? { farmId: filters.farmId } : {})
  };
}

function accessWhere(context: YieldAccessContext) {
  if (canAccessAllFarms(context.role)) {
    return {};
  }

  return {
    farmId: {
      in: context.assignedFarmIds
    }
  };
}

export async function getYieldPageData(context: YieldAccessContext, filters: YieldFilters = {}) {
  const [records, cropSeasons] = await Promise.all([
    prisma.yieldRecord.findMany({
      where: {
        ...yieldWhere(filters),
        ...accessWhere(context)
      },
      include: {
        farm: true,
        landBlock: true,
        cropSeason: true,
        owner: true,
        harvest: true
      },
      orderBy: {
        yieldDate: "desc"
      }
    }),
    prisma.cropSeason.findMany({
      where: canAccessAllFarms(context.role)
        ? {}
        : {
            block: {
              farmId: {
                in: context.assignedFarmIds
              }
            }
          },
      include: {
        block: {
          include: {
            farm: true
          }
        }
      },
      orderBy: [{ status: "asc" }, { startDate: "desc" }]
    })
  ]);

  return {
    records,
    cropSeasons,
    summary: summarizeYieldRecords(
      records.map((record) => ({
        cropName: record.cropName,
        quantity: Number(record.quantity),
        unit: record.unit,
        yieldDate: record.yieldDate,
        city: record.city,
        district: record.district,
        farmId: record.farmId,
        ownerId: record.ownerId
      })),
      {
        from: filters.from,
        to: filters.to
      }
    )
  };
}

export async function getSuperAdminYieldData(filters: YieldFilters = {}) {
  const [records, owners, farms] = await Promise.all([
    prisma.yieldRecord.findMany({
      where: yieldWhere(filters),
      include: {
        farm: true,
        landBlock: true,
        owner: true,
        cropSeason: true
      },
      orderBy: [{ yieldDate: "desc" }, { cropName: "asc" }]
    }),
    prisma.user.findMany({
      where: {
        role: {
          in: ["LAND_OWNER", "OWNER", "ADMIN"]
        }
      },
      orderBy: [{ companyName: "asc" }, { name: "asc" }]
    }),
    prisma.farm.findMany({
      orderBy: {
        name: "asc"
      }
    })
  ]);

  const summary = summarizeYieldRecords(
    records.map((record) => ({
      cropName: record.cropName,
      quantity: Number(record.quantity),
      unit: record.unit,
      yieldDate: record.yieldDate,
      city: record.city,
      district: record.district,
      farmId: record.farmId,
      ownerId: record.ownerId
    })),
    {
      from: filters.from,
      to: filters.to
    }
  );

  return {
    records,
    owners,
    farms,
    summary
  };
}
