"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/session";
import {
  createProjectSchema,
  createExpenseSchema,
  setIncomeSchema,
  setSavingsSchema,
} from "@/lib/validators";
import type { ActionResult } from "@/lib/action-result";

function revalidateFinance() {
  revalidatePath("/");
  revalidatePath("/finanzas");
}

/** Crea un nuevo ProjectGoal y recalcula (vía revalidate) el balance. */
export async function createProject(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const userId = await getUserId();

  const parsed = createProjectSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Datos inválidos",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { name, targetAmount, allocatedAmount, tag } = parsed.data;

  // El monto inicial define también el abono mensual fijo (cada clic del botón +).
  const monthlyContribution = allocatedAmount;
  const completedAt = allocatedAmount >= targetAmount ? new Date() : null;

  const project = await prisma.projectGoal.create({
    data: {
      userId,
      name,
      targetAmount,
      allocatedAmount,
      monthlyContribution,
      completedAt,
      tag,
    },
    select: { id: true },
  });

  revalidateFinance();
  return { ok: true, data: { id: project.id } };
}

/**
 * Abona el monto mensual fijo del proyecto (botón verde "+").
 * Suma monthlyContribution a allocatedAmount, topado a la meta.
 * Si alcanza la meta, marca el proyecto como cumplido (deja de descontar del balance).
 */
export async function contributeToProject(
  projectId: string,
): Promise<ActionResult> {
  const userId = await getUserId();

  const project = await prisma.projectGoal.findFirst({
    where: { id: projectId, userId },
    select: {
      targetAmount: true,
      allocatedAmount: true,
      monthlyContribution: true,
    },
  });
  if (!project) return { ok: false, error: "Proyecto no encontrado" };

  const target = Number(project.targetAmount);
  const current = Number(project.allocatedAmount);
  const step = Number(project.monthlyContribution);

  if (step <= 0) {
    return {
      ok: false,
      error: "Este proyecto no tiene un abono mensual definido.",
    };
  }

  const next = Math.min(target, current + step);
  const completedAt = next >= target ? new Date() : null;

  await prisma.projectGoal.updateMany({
    where: { id: projectId, userId },
    data: { allocatedAmount: next, completedAt },
  });

  revalidateFinance();
  return { ok: true };
}

/** Actualiza el monto asignado (ahorro) de un proyecto. */
export async function updateProjectAllocation(
  projectId: string,
  allocatedAmount: number,
): Promise<ActionResult> {
  const userId = await getUserId();
  if (allocatedAmount < 0) return { ok: false, error: "Monto inválido" };

  const result = await prisma.projectGoal.updateMany({
    where: { id: projectId, userId },
    data: { allocatedAmount },
  });
  if (result.count === 0) return { ok: false, error: "Proyecto no encontrado" };

  revalidateFinance();
  return { ok: true };
}

export async function deleteProject(projectId: string): Promise<ActionResult> {
  const userId = await getUserId();
  const result = await prisma.projectGoal.deleteMany({
    where: { id: projectId, userId },
  });
  if (result.count === 0) return { ok: false, error: "Proyecto no encontrado" };
  revalidateFinance();
  return { ok: true };
}

/** Crea un gasto fijo. */
export async function createExpense(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const userId = await getUserId();

  const parsed = createExpenseSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Datos inválidos",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { category, amount } = parsed.data;

  const expense = await prisma.fixedExpense.create({
    data: { userId, category, amount },
    select: { id: true },
  });

  revalidateFinance();
  return { ok: true, data: { id: expense.id } };
}

export async function deleteExpense(expenseId: string): Promise<ActionResult> {
  const userId = await getUserId();
  const result = await prisma.fixedExpense.deleteMany({
    where: { id: expenseId, userId },
  });
  if (result.count === 0) return { ok: false, error: "Gasto no encontrado" };
  revalidateFinance();
  return { ok: true };
}

/** Define/actualiza el ingreso mensual (upsert sobre FinancialSummary.userId). */
export async function setMonthlyIncome(input: unknown): Promise<ActionResult> {
  const userId = await getUserId();

  const parsed = setIncomeSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Datos inválidos",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { monthlyIncome } = parsed.data;

  await prisma.financialSummary.upsert({
    where: { userId },
    create: { userId, monthlyIncome },
    update: { monthlyIncome },
  });

  revalidateFinance();
  return { ok: true };
}

/** Define/actualiza el ahorro mensual (se descuenta del balance disponible). */
export async function setMonthlySavings(input: unknown): Promise<ActionResult> {
  const userId = await getUserId();

  const parsed = setSavingsSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Datos inválidos",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { monthlySavings } = parsed.data;

  await prisma.financialSummary.upsert({
    where: { userId },
    create: { userId, monthlySavings },
    update: { monthlySavings },
  });

  revalidateFinance();
  return { ok: true };
}
