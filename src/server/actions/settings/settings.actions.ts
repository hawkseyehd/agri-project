"use server";

import { revalidatePath } from "next/cache";
import { PermissionPage } from "@prisma/client";

import { requireAuthUser } from "@/server/auth/auth";
import { canAccessAllFarms, canAccessPackageUsers, getPackageUserLimit } from "@/server/auth/permissions";
import { prisma } from "@/server/db/prisma";
import {
  assignManagerToFarms,
  changeUserPassword,
  createManagerUser,
  setUserPagePermissions,
  updateUserProfile,
  type PagePermissionInput
} from "@/server/services/settings/settings.service";
import {
  companyNameSchema,
  managerFarmAssignmentSchema,
  managerUserSchema,
  ownedFarmNameSchema,
  passwordChangeSchema,
  profileUpdateSchema
} from "@/server/validators/settings/settings.schema";

export type SettingsActionState = {
  ok: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

function formValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function formValues(formData: FormData, key: string) {
  return formData.getAll(key).filter((value): value is string => typeof value === "string");
}

const permissionPages = Object.values(PermissionPage);

function permissionInputs(formData: FormData): PagePermissionInput[] {
  return permissionPages.map((page) => ({
    page,
    canView: formData.get(`${page}:view`) === "on",
    canCreate: formData.get(`${page}:create`) === "on",
    canEdit: formData.get(`${page}:edit`) === "on",
    canDelete: formData.get(`${page}:delete`) === "on"
  }));
}

async function requireUserManagement() {
  const user = await requireAuthUser();

  if (!canAccessPackageUsers(user.role, user.packageTier)) {
    throw new Error("User management requires Gold, Platinum, or super admin access.");
  }

  return user;
}

async function assertTenantUserLimit(userId: string, limit: number) {
  if (limit === 0) {
    return;
  }

  const existingUsers = await prisma.user.count({
    where: {
      ownerId: userId,
      role: "TENANT_USER"
    }
  });

  if (existingUsers >= limit) {
    throw new Error(`Your package allows up to ${limit} users.`);
  }
}

function validationState(message: string, errors: Record<string, string[]>): SettingsActionState {
  return {
    ok: false,
    message,
    errors
  };
}

export async function createManagerAction(_previousState: SettingsActionState, formData: FormData): Promise<SettingsActionState> {
  const parsed = managerUserSchema.safeParse({
    name: formValue(formData, "name"),
    email: formValue(formData, "email"),
    password: formValue(formData, "password"),
    farmIds: formValues(formData, "farmIds")
  });

  if (!parsed.success) {
    return validationState("Please fix the manager fields.", parsed.error.flatten().fieldErrors);
  }

  try {
    const user = await requireUserManagement();
    if (!canAccessAllFarms(user.role)) {
      await assertTenantUserLimit(user.id, getPackageUserLimit(user.packageTier));
    }
    await createManagerUser(parsed.data, undefined, canAccessAllFarms(user.role) ? undefined : user.id);
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Manager could not be created."
    };
  }

  revalidatePath("/settings");
  return {
    ok: true,
    message: "Manager created and assigned."
  };
}

export async function assignManagerAction(_previousState: SettingsActionState, formData: FormData): Promise<SettingsActionState> {
  const parsed = managerFarmAssignmentSchema.safeParse({
    managerId: formValue(formData, "managerId"),
    farmIds: formValues(formData, "farmIds")
  });

  if (!parsed.success) {
    return validationState("Please choose a manager and at least one farm.", parsed.error.flatten().fieldErrors);
  }

  try {
    const user = await requireUserManagement();
    await assignManagerToFarms(parsed.data, undefined, canAccessAllFarms(user.role) ? undefined : user.id);
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Manager assignments could not be updated."
    };
  }

  revalidatePath("/settings");
  return {
    ok: true,
    message: "Manager farm assignments updated."
  };
}

export async function updateUserPermissionsAction(_previousState: SettingsActionState, formData: FormData): Promise<SettingsActionState> {
  const userId = formValue(formData, "userId");

  if (!userId) {
    return {
      ok: false,
      message: "Choose a user before updating permissions."
    };
  }

  try {
    const user = await requireUserManagement();
    const target = await prisma.user.findFirst({
      where: {
        id: userId,
        ...(canAccessAllFarms(user.role) ? {} : { ownerId: user.id })
      },
      select: {
        id: true
      }
    });

    if (!target) {
      throw new Error("User not found for this account.");
    }

    await setUserPagePermissions(userId, permissionInputs(formData));
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Permissions could not be updated."
    };
  }

  revalidatePath("/settings");
  return {
    ok: true,
    message: "User permissions updated."
  };
}

export async function updateProfileAction(_previousState: SettingsActionState, formData: FormData): Promise<SettingsActionState> {
  const parsed = profileUpdateSchema.safeParse({
    name: formValue(formData, "name"),
    email: formValue(formData, "email")
  });

  if (!parsed.success) {
    return validationState("Please fix the profile fields.", parsed.error.flatten().fieldErrors);
  }

  try {
    const user = await requireAuthUser();
    await updateUserProfile(user.id, parsed.data);
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Profile could not be updated."
    };
  }

  revalidatePath("/settings");
  return {
    ok: true,
    message: "Profile updated."
  };
}

export async function updateCompanyNameAction(_previousState: SettingsActionState, formData: FormData): Promise<SettingsActionState> {
  const parsed = companyNameSchema.safeParse({
    companyName: formValue(formData, "companyName")
  });

  if (!parsed.success) {
    return validationState("Please fix the company name.", parsed.error.flatten().fieldErrors);
  }

  try {
    const user = await requireAuthUser();
    if (user.role !== "LAND_OWNER") {
      throw new Error("Only land owners can update company settings.");
    }

    await prisma.user.update({
      where: {
        id: user.id
      },
      data: {
        companyName: parsed.data.companyName
      }
    });
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Company name could not be updated."
    };
  }

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return {
    ok: true,
    message: "Company name updated."
  };
}

export async function updateOwnedFarmNameAction(_previousState: SettingsActionState, formData: FormData): Promise<SettingsActionState> {
  const parsed = ownedFarmNameSchema.safeParse({
    farmId: formValue(formData, "farmId"),
    farmName: formValue(formData, "farmName")
  });

  if (!parsed.success) {
    return validationState("Please fix the farm name.", parsed.error.flatten().fieldErrors);
  }

  try {
    const user = await requireAuthUser();
    if (user.role !== "LAND_OWNER") {
      throw new Error("Only land owners can update farm names.");
    }

    const result = await prisma.farm.updateMany({
      where: {
        id: parsed.data.farmId,
        ownerId: user.id
      },
      data: {
        name: parsed.data.farmName
      }
    });

    if (result.count === 0) {
      throw new Error("Farm not found for this company.");
    }
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Farm name could not be updated."
    };
  }

  revalidatePath("/settings");
  revalidatePath("/farms");
  revalidatePath(`/farms/${parsed.data.farmId}`);
  return {
    ok: true,
    message: "Farm name updated."
  };
}

export async function changePasswordAction(_previousState: SettingsActionState, formData: FormData): Promise<SettingsActionState> {
  const parsed = passwordChangeSchema.safeParse({
    currentPassword: formValue(formData, "currentPassword"),
    newPassword: formValue(formData, "newPassword"),
    confirmPassword: formValue(formData, "confirmPassword")
  });

  if (!parsed.success) {
    return validationState("Please fix the password fields.", parsed.error.flatten().fieldErrors);
  }

  try {
    const user = await requireAuthUser();
    await changeUserPassword(user.id, parsed.data);
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Password could not be changed."
    };
  }

  return {
    ok: true,
    message: "Password changed."
  };
}
