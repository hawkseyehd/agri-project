import type { PackageTier, Role } from "@prisma/client";
import type { DefaultSession } from "next-auth";

type SessionPagePermission = {
  page: string;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
};

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      packageTier: PackageTier;
      companyName?: string | null;
      ownerId?: string | null;
      subscriptionApprovedAt?: string | null;
      subscriptionExpiresAt?: string | null;
      pagePermissions: SessionPagePermission[];
      assignedFarmIds: string[];
    } & DefaultSession["user"];
  }

  interface User {
    role: Role;
    packageTier: PackageTier;
    companyName?: string | null;
    ownerId?: string | null;
    subscriptionApprovedAt?: Date | null;
    subscriptionExpiresAt?: Date | null;
    pagePermissions: SessionPagePermission[];
    assignedFarmIds: string[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: Role;
    packageTier?: PackageTier;
    companyName?: string | null;
    ownerId?: string | null;
    subscriptionApprovedAt?: string | null;
    subscriptionExpiresAt?: string | null;
    pagePermissions?: SessionPagePermission[];
    assignedFarmIds?: string[];
  }
}
