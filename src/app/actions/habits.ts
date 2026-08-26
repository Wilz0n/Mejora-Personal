"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/session";
import {
  createHabitSchema,
  toggleHabitLogSchema,
} from "@/lib/validators";
import type { ActionResult } from "@/lib/action-result";

/** Verifica que el hábito pertenezca al usuario (aislamiento). */
async function assertHabitOwnership(habitId: string, userId: string) {
  const habit = await prisma.habit.findFirst({
    where: { id: habitId, userId },
    select: { id: true },
  });
  return Boolean(habit);
}

/**
 * Marca/desmarca un HabitLog para una fecha concreta.
 * Usa upsert sobre la unique (habitId, date).
 */
export async function toggleHabitLog(input: unknown): Promise<ActionResult> {
  const userId = await getUserId();

  const parsed = toggleHabitLogSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Datos inválidos",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { habitId, date, completed } = parsed.data;

  if (!(await assertHabitOwnership(habitId, userId))) {
    return { ok: false, error: "Hábito no encontrado" };
  }

  await prisma.habitLog.upsert({
    where: { habitId_date: { habitId, date } },
    create: { habitId, date, completed },
    update: { completed },
  });

  revalidatePath("/");
  revalidatePath("/habitos");
  return { ok: true };
}

/** Crea un nuevo hábito vinculado al usuario actual. */
export async function createHabit(input: unknown): Promise<ActionResult<{ id: string }>> {
  const userId = await getUserId();

  const parsed = createHabitSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Datos inválidos",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { name, icon } = parsed.data;

  const habit = await prisma.habit.create({
    data: { userId, name, icon },
    select: { id: true },
  });

  revalidatePath("/");
  revalidatePath("/habitos");
  return { ok: true, data: { id: habit.id } };
}

/** Elimina un hábito del usuario. */
export async function deleteHabit(habitId: string): Promise<ActionResult> {
  const userId = await getUserId();
  const result = await prisma.habit.deleteMany({ where: { id: habitId, userId } });
  if (result.count === 0) return { ok: false, error: "Hábito no encontrado" };
  revalidatePath("/");
  revalidatePath("/habitos");
  return { ok: true };
}
