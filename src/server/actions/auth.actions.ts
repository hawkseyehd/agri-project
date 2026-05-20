"use server";

import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";

import { prisma } from "@/server/db/prisma";
import { registrationSchema } from "@/server/validators/auth.schema";

export type RegistrationActionState = {
  ok: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

function formValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function defaultBetaSubscriptionExpiry() {
  const expiry = new Date();
  expiry.setMonth(expiry.getMonth() + 1);
  return expiry;
}

export async function registerUserAction(_previousState: RegistrationActionState, formData: FormData): Promise<RegistrationActionState> {
  const parsed = registrationSchema.safeParse({
    name: formValue(formData, "name"),
    email: formValue(formData, "email"),
    password: formValue(formData, "password"),
    confirmPassword: formValue(formData, "confirmPassword")
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Please fix the registration fields.",
      errors: parsed.error.flatten().fieldErrors
    };
  }

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
      role: Role.LAND_OWNER,
      packageTier: "GOLD",
      ownerId: null,
      subscriptionApprovedAt: new Date(),
      subscriptionExpiresAt: defaultBetaSubscriptionExpiry()
    }
  });

  return {
    ok: true,
    message: "Account created. Signing you in..."
  };
}
