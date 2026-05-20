import { prisma } from "@/server/db/prisma";
import type { AuthenticatedUser } from "@/server/auth/auth";
import { canAccessAllFarms } from "@/server/auth/permissions";

export async function getSettingsDashboardData(currentUser: AuthenticatedUser) {
  const isPlatform = canAccessAllFarms(currentUser.role);
  const farmWhere = isPlatform
    ? {}
    : {
        OR: [{ ownerId: currentUser.id }, { id: { in: currentUser.assignedFarmIds } }]
      };
  const userWhere = isPlatform ? {} : { ownerId: currentUser.id };

  const [users, farms] = await Promise.all([
    prisma.user.findMany({
      where: userWhere,
      include: {
        assignments: {
          include: {
            farm: true
          },
          orderBy: {
            farm: {
              name: "asc"
            }
          }
        },
        pagePermissions: true
      },
      orderBy: [{ role: "asc" }, { name: "asc" }]
    }),
    prisma.farm.findMany({
      where: farmWhere,
      orderBy: {
        name: "asc"
      }
    })
  ]);

  return {
    users,
    managers: users.filter((user) => user.role === "MANAGER" || user.role === "TENANT_USER"),
    farms
  };
}

export async function getSettingsProfile(userId: string) {
  return prisma.user.findUnique({
    where: {
      id: userId
    },
    select: {
      id: true,
      name: true,
      companyName: true,
      email: true,
      role: true,
      ownedFarms: {
        select: {
          id: true,
          name: true
        },
        orderBy: {
          name: "asc"
        }
      }
    }
  });
}
