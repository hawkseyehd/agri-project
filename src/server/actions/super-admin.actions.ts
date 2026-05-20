"use server";

import { PackageTier, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAuthUser } from "@/server/auth/auth";
import { canManageUsers } from "@/server/auth/permissions";
import { prisma } from "@/server/db/prisma";

export type SuperAdminActionState = {
  ok: boolean;
  message?: string;
  errors?: Record<string, string[] | undefined>;
};

const createPlatformUserSchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  email: z.string().trim().email("Enter a valid email address.").transform((value) => value.toLowerCase()),
  password: z.string().min(8, "Password must be at least 8 characters."),
  packageTier: z.enum(["NONE", "SILVER", "GOLD", "PLATINUM"]),
  subscriptionExpiresAt: z.string().trim().optional()
});

function formValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function roleValue(value: string): Role {
  if (value === "LAND_OWNER" || value === "TENANT_USER" || value === "PENDING_USER" || value === "SUPER_ADMIN") {
    return value;
  }

  throw new Error("Invalid role.");
}

function packageValue(value: string): PackageTier {
  if (value === "NONE" || value === "SILVER" || value === "GOLD" || value === "PLATINUM") {
    return value;
  }

  throw new Error("Invalid package.");
}

function optionalDateValue(value: string) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid expiry date/time.");
  }

  return date;
}

function defaultSubscriptionExpiry() {
  const expiry = new Date();
  expiry.setMonth(expiry.getMonth() + 1);
  return expiry;
}

export async function createPlatformUserAction(_previousState: SuperAdminActionState, formData: FormData): Promise<SuperAdminActionState> {
  try {
    const actor = await requireAuthUser();
    if (!canManageUsers(actor.role)) {
      throw new Error("Only super admins can create platform users.");
    }

    const parsed = createPlatformUserSchema.safeParse({
      name: formValue(formData, "name"),
      email: formValue(formData, "email"),
      password: formValue(formData, "password"),
      packageTier: formValue(formData, "packageTier") || "NONE",
      subscriptionExpiresAt: formValue(formData, "subscriptionExpiresAt")
    });

    if (!parsed.success) {
      return {
        ok: false,
        message: "Please fix the user details.",
        errors: parsed.error.flatten().fieldErrors
      };
    }

    const packageTier = packageValue(parsed.data.packageTier);
    const requestedExpiry = optionalDateValue(parsed.data.subscriptionExpiresAt ?? "");
    const isPremium = packageTier !== "NONE";
    const existingUser = await prisma.user.findUnique({
      where: {
        email: parsed.data.email
      },
      select: {
        id: true
      }
    });

    if (existingUser) {
      return {
        ok: false,
        message: "An account already exists for this email."
      };
    }

    const password = await bcrypt.hash(parsed.data.password, 10);

    await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        password,
        role: "LAND_OWNER",
        packageTier,
        ownerId: null,
        subscriptionApprovedAt: isPremium ? new Date() : null,
        subscriptionExpiresAt: isPremium ? requestedExpiry ?? defaultSubscriptionExpiry() : null
      }
    });
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "User could not be created."
    };
  }

  revalidatePath("/super-admin");
  revalidatePath("/super-admin/users");
  return {
    ok: true,
    message: "User created."
  };
}

export async function updateUserAccessAction(_previousState: SuperAdminActionState, formData: FormData): Promise<SuperAdminActionState> {
  try {
    const actor = await requireAuthUser();
    if (!canManageUsers(actor.role)) {
      throw new Error("Only super admins can update platform user access.");
    }

    const userId = formValue(formData, "userId");
    const role = roleValue(formValue(formData, "role"));
    const packageTier = packageValue(formValue(formData, "packageTier"));
    const approved = formValue(formData, "approved") === "on";
    const subscriptionExpiresAt = optionalDateValue(formValue(formData, "subscriptionExpiresAt"));

    if (approved && role !== "PENDING_USER" && packageTier === "NONE") {
      throw new Error("Choose a paid package before approving a user.");
    }

    if (approved && role !== "PENDING_USER" && !subscriptionExpiresAt) {
      throw new Error("Expiry date/time is required for approved users.");
    }

    await prisma.user.update({
      where: {
        id: userId
      },
      data: {
        role,
        packageTier,
        subscriptionApprovedAt: approved && role !== "PENDING_USER" ? new Date() : null,
        subscriptionExpiresAt: approved && role !== "PENDING_USER" ? subscriptionExpiresAt : null
      }
    });
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "User access could not be updated."
    };
  }

  revalidatePath("/super-admin");
  revalidatePath("/super-admin/users");
  return {
    ok: true,
    message: "User access updated."
  };
}

export async function createPlatformUserFormAction(formData: FormData) {
  await createPlatformUserAction({ ok: false }, formData);
}

export async function updateUserAccessFormAction(formData: FormData) {
  await updateUserAccessAction({ ok: false }, formData);
}
