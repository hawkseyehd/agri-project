import {
  AttendanceStatus,
  CropSeasonStatus,
  CropType,
  DailyReportStatus,
  InventoryMovementType,
  PrismaClient,
  Role,
  WorkerStatus
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("ChangeMe123!", 10);

  await prisma.user.upsert({
    where: { email: "super@example.com" },
    update: { name: "Platform Super Admin", role: Role.SUPER_ADMIN, packageTier: "NONE", subscriptionApprovedAt: new Date(), ownerId: null },
    create: {
      name: "Platform Super Admin",
      email: "super@example.com",
      password,
      role: Role.SUPER_ADMIN,
      packageTier: "NONE",
      subscriptionApprovedAt: new Date()
    }
  });

  const owner = await prisma.user.upsert({
    where: { email: "owner@example.com" },
    update: { name: "Demo Owner", role: Role.LAND_OWNER, packageTier: "PLATINUM", subscriptionApprovedAt: new Date(), ownerId: null },
    create: {
      name: "Demo Owner",
      email: "owner@example.com",
      password,
      role: Role.LAND_OWNER,
      packageTier: "PLATINUM",
      subscriptionApprovedAt: new Date()
    }
  });

  const manager = await prisma.user.upsert({
    where: { email: "manager@example.com" },
    update: { name: "Demo Manager", role: Role.TENANT_USER, packageTier: "NONE", subscriptionApprovedAt: new Date(), ownerId: owner.id },
    create: {
      name: "Demo Manager",
      email: "manager@example.com",
      password,
      role: Role.TENANT_USER,
      packageTier: "NONE",
      subscriptionApprovedAt: new Date(),
      ownerId: owner.id
    }
  });

  const farm =
    (await prisma.farm.findFirst({ where: { name: "Chak 42 Demo Farm" } })) ??
    (await prisma.farm.create({
      data: {
        ownerId: owner.id,
        name: "Chak 42 Demo Farm",
        location: "Okara, Punjab"
      }
    }));

  await prisma.farm.update({
    where: { id: farm.id },
    data: { ownerId: owner.id }
  });

  await prisma.farmManager.upsert({
    where: {
      farmId_managerId: {
        farmId: farm.id,
        managerId: owner.id
      }
    },
    update: {},
    create: {
      farmId: farm.id,
      managerId: owner.id
    }
  });

  await prisma.farmManager.upsert({
    where: {
      farmId_managerId: {
        farmId: farm.id,
        managerId: manager.id
      }
    },
    update: {},
    create: {
      farmId: farm.id,
      managerId: manager.id
    }
  });

  const block =
    (await prisma.landBlock.findFirst({ where: { farmId: farm.id, name: "Block A" } })) ??
    (await prisma.landBlock.create({
      data: {
        farmId: farm.id,
        name: "Block A",
        areaAcres: 12
      }
    }));

  const season =
    (await prisma.cropSeason.findFirst({
      where: {
        blockId: block.id,
        cropName: "Wheat",
        startDate: new Date("2025-11-15")
      }
    })) ??
    (await prisma.cropSeason.create({
      data: {
        blockId: block.id,
        cropType: CropType.CROP,
        cropName: "Wheat",
        variety: "Galaxy-2013",
        startDate: new Date("2025-11-15"),
        endDate: new Date("2026-04-30"),
        status: CropSeasonStatus.ACTIVE
      }
    }));

  const worker =
    (await prisma.worker.findFirst({ where: { farmId: farm.id, name: "Ali Raza" } })) ??
    (await prisma.worker.create({
      data: {
        farmId: farm.id,
        name: "Ali Raza",
        workerType: "Field Worker",
        dailyWage: 1500,
        status: WorkerStatus.ACTIVE
      }
    }));

  const inventoryItem =
    (await prisma.inventoryItem.findFirst({ where: { farmId: farm.id, name: "Urea Fertilizer" } })) ??
    (await prisma.inventoryItem.create({
      data: {
        farmId: farm.id,
        name: "Urea Fertilizer",
        itemType: "Fertiliser",
        unit: "BAG",
        quantity: 40,
        lowStockLevel: 10
      }
    }));

  const reportDate = new Date("2026-04-28");
  const report = await prisma.dailyReport.upsert({
    where: {
      cropSeasonId_managerId_reportDate: {
        cropSeasonId: season.id,
        managerId: manager.id,
        reportDate
      }
    },
    update: {
      status: DailyReportStatus.SUBMITTED,
      submittedAt: reportDate,
      notes: "Activities:\nIrrigation completed on Block A.\n\nInventory usage:\nApplied urea fertilizer."
    },
    create: {
      cropSeasonId: season.id,
      managerId: manager.id,
      reportDate,
      status: DailyReportStatus.SUBMITTED,
      submittedAt: reportDate,
      notes: "Activities:\nIrrigation completed on Block A.\n\nInventory usage:\nApplied urea fertilizer."
    }
  });

  if (!(await prisma.laborAttendance.findFirst({ where: { workerId: worker.id, reportDate } }))) {
    await prisma.laborAttendance.create({
      data: {
        farmId: farm.id,
        workerId: worker.id,
        dailyReportId: report.id,
        reportDate,
        status: AttendanceStatus.PRESENT,
        wageAmount: 1500,
        paidAmount: 1500
      }
    });
  }

  if (!(await prisma.expense.findFirst({ where: { farmId: farm.id, category: "Fertilizer", expenseDate: reportDate } }))) {
    await prisma.expense.create({
      data: {
        farmId: farm.id,
        cropSeasonId: season.id,
        category: "Fertilizer",
        amount: 12000,
        paymentStatus: "PAID",
        expenseDate: reportDate
      }
    });
  }

  if (!(await prisma.inventoryMovement.findFirst({ where: { itemId: inventoryItem.id, dailyReportId: report.id } }))) {
    await prisma.inventoryMovement.create({
      data: {
        itemId: inventoryItem.id,
        dailyReportId: report.id,
        type: InventoryMovementType.USAGE,
        quantity: 4,
        notes: "Used for wheat crop top dressing."
      }
    });
  }

  if (!(await prisma.activityLog.findFirst({ where: { userId: owner.id, action: "SEED_DEMO_DATA" } }))) {
    await prisma.activityLog.create({
      data: {
        farmId: farm.id,
        userId: owner.id,
        action: "SEED_DEMO_DATA",
        entityType: "Farm",
        entityId: farm.id
      }
    });
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });
