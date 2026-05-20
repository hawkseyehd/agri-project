"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAuthUser } from "@/server/auth/auth";
import { prisma } from "@/server/db/prisma";
import { firstFarmSetupSchema, planRequestSchema } from "@/server/validators/onboarding.schema";

export type OnboardingActionState = {
  ok: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

function formValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function requestPlanAction(_previousState: OnboardingActionState, formData: FormData): Promise<OnboardingActionState> {
  const parsed = planRequestSchema.safeParse({
    packageTier: formValue(formData, "packageTier")
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Choose a package before requesting approval.",
      errors: parsed.error.flatten().fieldErrors
    };
  }

  try {
    const user = await requireAuthUser();

    if (user.role !== "PENDING_USER") {
      throw new Error("Plan requests are only available for pending accounts.");
    }

    await prisma.user.update({
      where: {
        id: user.id
      },
      data: {
        packageTier: parsed.data.packageTier,
        subscriptionApprovedAt: null,
        subscriptionExpiresAt: null
      }
    });
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Plan request could not be saved."
    };
  }

  revalidatePath("/get-started");
  return {
    ok: true,
    message: "Plan request saved. A super admin can now approve your access."
  };
}

export async function requestPlanFormAction(formData: FormData) {
  await requestPlanAction({ ok: false }, formData);
  redirect("/get-started?requested=1");
}

export async function createFirstFarmAction(_previousState: OnboardingActionState, formData: FormData): Promise<OnboardingActionState> {
  const parsed = firstFarmSetupSchema.safeParse({
    companyName: formValue(formData, "companyName")
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Please fix the company details.",
      errors: parsed.error.flatten().fieldErrors
    };
  }

  try {
    const user = await requireAuthUser();

    if (user.role !== "LAND_OWNER") {
      throw new Error("Only approved land owners can set up a company.");
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
      message: error instanceof Error ? error.message : "Company setup could not be completed."
    };
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}
