import type { PrismaClient } from "@prisma/client";
import { type PermissionPage, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

import { prisma } from "@/server/db/prisma";
import type { ManagerFarmAssignmentInput, ManagerUserInput, PasswordChangeInput, ProfileUpdateInput } from "@/server/validators/settings/settings.schema";

type SettingsPrisma = PrismaClient;

export type PagePermissionInput = {
  page: PermissionPage;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
};

export async function createManagerUser(input: ManagerUserInput, db: SettingsPrisma = prisma, ownerId?: string) {
  const password = await bcrypt.hash(input.password, 10);

  return db.user.create({
    data: {
      name: input.name,
      email: input.email,
      password,
      role: ownerId ? Role.TENANT_USER : Role.MANAGER,
      ownerId,
      packageTier: "NONE",
      subscriptionApprovedAt: ownerId ? new Date() : null,
      assignments: {
        create: input.farmIds.map((farmId) => ({
          farmId
        }))
      }
    }
  });
}

export async function assignManagerToFarms(input: ManagerFarmAssignmentInput, db: SettingsPrisma = prisma, ownerId?: string) {
  return db.$transaction(async (tx) => {
    const manager = await tx.user.findFirst({
      where: {
        id: input.managerId,
        role: {
          in: [Role.MANAGER, Role.TENANT_USER]
        },
        ...(ownerId ? { ownerId } : {})
      }
    });

    if (!manager) {
      throw new Error("Manager not found.");
    }

    await tx.farmManager.deleteMany({
      where: {
        managerId: input.managerId
      }
    });

    await tx.farmManager.createMany({
      data: input.farmIds.map((farmId) => ({
        managerId: input.managerId,
        farmId
      })),
      skipDuplicates: true
    });

    return manager;
  });
}

export async function setUserPagePermissions(userId: string, permissions: PagePermissionInput[], db: SettingsPrisma = prisma) {
  await db.userPagePermission.deleteMany({
    where: {
      userId
    }
  });

  if (permissions.length === 0) {
    return;
  }

  await db.userPagePermission.createMany({
    data: permissions.map((permission) => ({
      userId,
      page: permission.page,
      canView: permission.canView,
      canCreate: permission.canCreate,
      canEdit: permission.canEdit,
      canDelete: permission.canDelete
    })),
    skipDuplicates: true
  });
}

export async function updateUserProfile(userId: string, input: ProfileUpdateInput, db: SettingsPrisma = prisma) {
  return db.user.update({
    where: {
      id: userId
    },
    data: {
      name: input.name,
      email: input.email
    }
  });
}

export async function changeUserPassword(userId: string, input: PasswordChangeInput, db: SettingsPrisma = prisma) {
  const user = await db.user.findUnique({
    where: {
      id: userId
    }
  });

  if (!user) {
    throw new Error("User not found.");
  }

  const currentPasswordMatches = await bcrypt.compare(input.currentPassword, user.password);
  if (!currentPasswordMatches) {
    throw new Error("Current password is incorrect.");
  }

  const password = await bcrypt.hash(input.newPassword, 10);

  return db.user.update({
    where: {
      id: userId
    },
    data: {
      password
    }
  });
}
