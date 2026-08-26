"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/session";
import { updateProfileSchema, setCurrencySchema } from "@/lib/validators";
import type { ActionResult } from "@/lib/action-result";

/** Actualiza el nombre (y opcionalmente el avatar por URL) del usuario. */
export async function updateProfile(
  input: unknown,
): Promise<ActionResult> {
  const userId = await getUserId();

  const parsed = updateProfileSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Datos inválidos",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { name, image } = parsed.data;

  await prisma.user.update({
    where: { id: userId },
    data: {
      name,
      ...(image !== undefined ? { image: image === "" ? null : image } : {}),
    },
  });

  revalidatePath("/settings");
  revalidatePath("/", "layout"); // refresca topbar (avatar) y dashboard (nombre)
  return { ok: true };
}

/** Define la moneda por defecto del usuario (persistente en FinancialSummary). */
export async function setCurrency(input: unknown): Promise<ActionResult> {
  const userId = await getUserId();

  const parsed = setCurrencySchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Moneda no soportada",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { currency } = parsed.data;

  await prisma.financialSummary.upsert({
    where: { userId },
    create: { userId, currency },
    update: { currency },
  });

  revalidatePath("/settings");
  revalidatePath("/finanzas");
  revalidatePath("/");
  return { ok: true };
}

/**
 * Purga DEFINITIVAMENTE todos los datos del usuario: hábitos (y sus logs por
 * cascada), gastos fijos, proyectos y resumen financiero. NO borra la cuenta.
 * Acción destructiva e irreversible.
 */
export async function purgeAccountData(): Promise<ActionResult> {
  const userId = await getUserId();

  await prisma.$transaction([
    // HabitLog se borra por cascada al borrar Habit.
    prisma.habit.deleteMany({ where: { userId } }),
    prisma.fixedExpense.deleteMany({ where: { userId } }),
    prisma.projectGoal.deleteMany({ where: { userId } }),
    prisma.financialSummary.deleteMany({ where: { userId } }),
    prisma.monthlyFinance.deleteMany({ where: { userId } }),
  ]);

  revalidatePath("/");
  revalidatePath("/habitos");
  revalidatePath("/finanzas");
  revalidatePath("/finanzas/mes");
  revalidatePath("/settings");
  return { ok: true };
}
