import type { AuthenticatedUser } from "@/server/auth/auth";
import { canUsePagePermission, type PermissionAction } from "@/server/auth/permissions";

export function assertCanUsePageAction(user: AuthenticatedUser, page: string, action: PermissionAction) {
  if (!canUsePagePermission(user.role, user.pagePermissions, page, action)) {
    throw new Error(`You do not have ${action} permission for this page.`);
  }
}
