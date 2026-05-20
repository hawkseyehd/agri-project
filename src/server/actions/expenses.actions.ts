"use server";

import type { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { auth, getSessionUser as getAuthenticatedSessionUser } from "@/server/auth/auth";
import { assertCanUsePageAction } from "@/server/auth/page-permissions";
import { canAccessFarm } from "@/server/auth/permissions";
import { prisma } from "@/server/db/prisma";
import { expenseSchema } from "@/server/validators/expense.schema";

type ActionState = {
  ok: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

type SessionUser = {
  id?: string;
  role?: Role;
  assignedFarmIds?: string[];
};

async function getSessionUser() {
  const session = await auth();
  return session?.user as SessionUser | undefined;
}

function formValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function parseExpenseForm(formData: FormData) {
  return expenseSchema.safeParse({
    farmId: formValue(formData, "farmId"),
    blockId: formValue(formData, "blockId"),
    cropSeasonId: formValue(formData, "cropSeasonId"),
    category: formValue(formData, "category"),
    amount: formValue(formData, "amount"),
    paymentStatus: formValue(formData, "paymentStatus") || "PENDING",
    receiptPath: formValue(formData, "receiptPath"),
    expenseDate: formValue(formData, "expenseDate")
  });
}

async function assertFarmAccess(farmId: string, action: "create" | "edit") {
  const user = await getSessionUser();
  const sessionUser = getAuthenticatedSessionUser(await auth());

  if (!user?.role) {
    throw new Error("You must be signed in to manage expenses.");
  }

  if (!canAccessFarm(user.role, user.assignedFarmIds ?? [], farmId)) {
    throw new Error("You do not have access to this farm.");
  }

  if (sessionUser) {
    assertCanUsePageAction(sessionUser, "EXPENSES", action);
  }
}

async function assertExpenseRelations(farmId: string, cropSeasonId: string | undefined, action: "create" | "edit") {
  await assertFarmAccess(farmId, action);

  if (!cropSeasonId) {
    return;
  }

  const season = await prisma.cropSeason.findUnique({
    where: {
      id: cropSeasonId
    },
    select: {
      block: {
        select: {
          farmId: true
        }
      }
    }
  });

  if (!season) {
    throw new Error("Selected crop season was not found.");
  }

  if (season.block.farmId !== farmId) {
    throw new Error("Selected crop season does not belong to this farm.");
  }
}

export async function createExpenseAction(_previousState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = parseExpenseForm(formData);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Please fix the highlighted expense fields.",
      errors: parsed.error.flatten().fieldErrors
    };
  }

  try {
    await assertExpenseRelations(parsed.data.farmId, parsed.data.cropSeasonId, "create");

    await prisma.expense.create({
      data: {
        farmId: parsed.data.farmId,
        cropSeasonId: parsed.data.cropSeasonId,
        category: parsed.data.category,
        amount: parsed.data.amount,
        paymentStatus: parsed.data.paymentStatus,
        receiptPath: parsed.data.receiptPath,
        expenseDate: new Date(parsed.data.expenseDate)
      }
    });

    revalidatePath("/expenses");
    revalidatePath("/dashboard");

    return {
      ok: true,
      message: "Expense saved."
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Expense could not be saved."
    };
  }
}

export async function updateExpenseAction(id: string, _previousState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = parseExpenseForm(formData);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Please fix the highlighted expense fields.",
      errors: parsed.error.flatten().fieldErrors
    };
  }

  try {
    await assertExpenseRelations(parsed.data.farmId, parsed.data.cropSeasonId, "edit");

    await prisma.expense.update({
      where: {
        id
      },
      data: {
        farmId: parsed.data.farmId,
        cropSeasonId: parsed.data.cropSeasonId,
        category: parsed.data.category,
        amount: parsed.data.amount,
        paymentStatus: parsed.data.paymentStatus,
        receiptPath: parsed.data.receiptPath,
        expenseDate: new Date(parsed.data.expenseDate)
      }
    });

    revalidatePath("/expenses");
    revalidatePath("/dashboard");

    return {
      ok: true,
      message: "Expense updated."
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Expense could not be updated."
    };
  }
}
