import type { PackageTier, Role } from "@prisma/client";

export type PermissionAction = "view" | "create" | "edit" | "delete";

export type PagePermission = {
  page: string;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
};

export type FarmAccessScope =
  | {
      type: "all";
    }
  | {
      type: "assigned";
      farmIds: string[];
    };

export function canAccessAllFarms(role: Role) {
  return role === "SUPER_ADMIN" || role === "ADMIN";
}

export function canManageUsers(role: Role) {
  return role === "SUPER_ADMIN" || role === "ADMIN";
}

export function canOpenAppModules(role: Role) {
  return role !== "PENDING_USER";
}

export function getPackageUserLimit(packageTier: PackageTier) {
  if (packageTier === "GOLD") {
    return 3;
  }

  if (packageTier === "PLATINUM") {
    return 5;
  }

  return 0;
}

export function canAccessPackageUsers(role: Role, packageTier: PackageTier) {
  return role === "SUPER_ADMIN" || (role === "LAND_OWNER" && getPackageUserLimit(packageTier) > 0);
}

export function canManageTenant(role: Role) {
  return role === "SUPER_ADMIN" || role === "LAND_OWNER" || role === "OWNER" || role === "ADMIN";
}

export function canUsePagePermission(role: Role, permissions: PagePermission[], page: string, action: PermissionAction) {
  if (!canOpenAppModules(role)) {
    return false;
  }

  if (role === "SUPER_ADMIN" || role === "LAND_OWNER" || role === "OWNER" || role === "ADMIN") {
    return true;
  }

  const permission = permissions.find((entry) => entry.page === page);
  if (!permission) {
    return false;
  }

  if (action === "view") {
    return permission.canView;
  }

  if (action === "create") {
    return permission.canCreate;
  }

  if (action === "edit") {
    return permission.canEdit;
  }

  return permission.canDelete;
}

export function canAccessFarm(role: Role, assignedFarmIds: string[], farmId: string) {
  return canOpenAppModules(role) && (canAccessAllFarms(role) || assignedFarmIds.includes(farmId));
}

export function getFarmAccessScope(role: Role, assignedFarmIds: string[]): FarmAccessScope {
  if (canAccessAllFarms(role)) {
    return { type: "all" };
  }

  return {
    type: "assigned",
    farmIds: Array.from(new Set(assignedFarmIds))
  };
}

export function assertCanAccessFarm(role: Role, assignedFarmIds: string[], farmId: string) {
  if (!canAccessFarm(role, assignedFarmIds, farmId)) {
    throw new Error("You do not have access to this farm.");
  }
}
