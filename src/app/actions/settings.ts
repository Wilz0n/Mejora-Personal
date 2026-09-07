"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { getUserId } from "@/lib/db/session";
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

/**
 * Archiva y REINICIA el ciclo de datos del usuario (feature del 7º mes).
 *
 * A diferencia de `purgeAccountData`, además de borrar los datos del dominio
 * marca `User.dataResetAt = now()`, de modo que la antigüedad efectiva vuelve a
 * cero y el ciclo de 6 meses empieza de nuevo (se rehabilitan las vistas y
 * desaparece el aviso de archivado). NO borra la cuenta.
 *
 * Requisito B1: la confirmación de que el usuario YA exportó sus datos se hace
 * de forma explícita en la UI (checkbox/confirmación) antes de invocar esta
 * acción; aquí solo se ejecuta el reinicio.
 */
export async function archiveAndReset(): Promise<ActionResult> {
  const userId = await getUserId();

  await prisma.$transaction([
    // HabitLog se borra por cascada al borrar Habit.
    prisma.habit.deleteMany({ where: { userId } }),
    prisma.fixedExpense.deleteMany({ where: { userId } }),
    prisma.microExpense.deleteMany({ where: { userId } }),
    prisma.projectGoal.deleteMany({ where: { userId } }),
    prisma.financialSummary.deleteMany({ where: { userId } }),
    prisma.monthlyFinance.deleteMany({ where: { userId } }),
    // Reinicia el ciclo: la antigüedad efectiva se contará desde ahora.
    prisma.user.update({
      where: { id: userId },
      data: { dataResetAt: new Date() },
    }),
  ]);

  revalidatePath("/");
  revalidatePath("/habitos");
  revalidatePath("/finanzas");
  revalidatePath("/finanzas/mes");
  revalidatePath("/settings");
  return { ok: true };
}
const SUPPORTED_TIMEZONES = ["America/Lima", "America/New_York"];

/** Define la zona horaria del usuario. */
export async function setTimezone(input: { timezone: string }): Promise<ActionResult> {
  const userId = await getUserId();

  const { timezone } = input;
  if (!SUPPORTED_TIMEZONES.includes(timezone)) {
    return { ok: false, error: "Zona horaria no soportada" };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { timezone },
  });

  revalidatePath("/");
  revalidatePath("/habitos");
  revalidatePath("/settings");
  return { ok: true };
}
