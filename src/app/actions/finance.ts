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
import {
  computeFinanceSummary,
  computeExpenseBreakdown,
  computeProjectsSnapshot,
  suggestedSavings,
  currentMonthKey,
} from "@/lib/finance-logic";
import { monthLabel } from "@/lib/dates";
import type { ActionResult } from "@/lib/action-result";

function revalidateFinance() {
  revalidatePath("/");
  revalidatePath("/finanzas");
  revalidatePath("/finanzas/mes");
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

  const { category, amount, icon } = parsed.data;

  // Obtener el orden máximo actual para poner el nuevo al final
  const lastExpense = await prisma.fixedExpense.findFirst({
    where: { userId },
    orderBy: { order: "desc" },
    select: { order: true },
  });
  const nextOrder = (lastExpense?.order ?? -1) + 1;

  const expense = await prisma.fixedExpense.create({
    data: { userId, category, amount, icon, order: nextOrder },
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

/**
 * Guarda (o actualiza) el cierre financiero del mes actual como un snapshot.
 *
 * Toma la configuración actual del usuario (ingreso, ahorro, gastos fijos y
 * proyectos), calcula el resumen y el desglose, y hace upsert sobre
 * MonthlyFinance para el mes en curso ("YYYY-MM"). Se muestra luego en la
 * vista "Finanzas del Mes" (/finanzas/mes).
 */
export async function saveMonthlyFinance(): Promise<ActionResult> {
  const userId = await getUserId();

  // Reúne la configuración financiera actual del usuario.
  const [summary, fixedExpensesRaw, projectsRaw] = await Promise.all([
    prisma.financialSummary.findUnique({ where: { userId } }),
    prisma.fixedExpense.findMany({
      where: { userId },
      orderBy: { amount: "desc" },
    }),
    prisma.projectGoal.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const monthlyIncome = summary ? Number(summary.monthlyIncome) : 0;
  const monthlySavingsRaw = summary ? Number(summary.monthlySavings) : 0;
  const currency = summary?.currency ?? "USD";

  const fixedExpenses = fixedExpensesRaw.map((e) => ({
    id: e.id,
    category: e.category,
    amount: Number(e.amount),
  }));
  const projects = projectsRaw.map((p) => ({
    id: p.id,
    name: p.name,
    targetAmount: Number(p.targetAmount),
    allocatedAmount: Number(p.allocatedAmount),
    monthlyContribution: Number(p.monthlyContribution),
    completed: p.completedAt !== null,
    tag: p.tag,
  }));

  if (monthlyIncome <= 0 && fixedExpenses.length === 0) {
    return {
      ok: false,
      error: "Configura tu ingreso o gastos antes de guardar la finanza.",
    };
  }

  const financeSummary = computeFinanceSummary({
    monthlyIncome,
    monthlySavings: monthlySavingsRaw,
    fixedExpenses,
    projects,
  });

  // El ahorro mostrado: el definido o la sugerencia del 20% del ingreso.
  const savings =
    financeSummary.monthlySavings > 0
      ? financeSummary.monthlySavings
      : suggestedSavings(financeSummary.monthlyIncome);

  // Balance efectivo (mismo criterio que la página de Finanzas).
  const availableBalance =
    financeSummary.monthlyIncome -
    savings -
    financeSummary.totalFixedExpenses -
    financeSummary.totalAllocated;

  const expensesByCategory = computeExpenseBreakdown(fixedExpenses);
  const projectsSnapshot = computeProjectsSnapshot(projects);

  const month = currentMonthKey();
  const label = monthLabel();

  await prisma.monthlyFinance.upsert({
    where: { userId_month: { userId, month } },
    create: {
      userId,
      month,
      monthLabel: label,
      monthlyIncome: financeSummary.monthlyIncome,
      monthlySavings: savings,
      totalFixedExpenses: financeSummary.totalFixedExpenses,
      availableBalance,
      currency,
      expensesByCategory: JSON.stringify(expensesByCategory),
      projectsSnapshot: JSON.stringify(projectsSnapshot),
    },
    update: {
      monthLabel: label,
      monthlyIncome: financeSummary.monthlyIncome,
      monthlySavings: savings,
      totalFixedExpenses: financeSummary.totalFixedExpenses,
      availableBalance,
      currency,
      expensesByCategory: JSON.stringify(expensesByCategory),
      projectsSnapshot: JSON.stringify(projectsSnapshot),
    },
  });

  revalidateFinance();
  return { ok: true };
}

/** Reordena los gastos fijos del usuario. Recibe un array de IDs en el nuevo orden. */
export async function reorderExpenses(orderedIds: string[]): Promise<ActionResult> {
  const userId = await getUserId();

  // Verificar que todos los IDs pertenecen al usuario
  const expenses = await prisma.fixedExpense.findMany({
    where: { userId },
    select: { id: true },
  });
  const userExpenseIds = new Set(expenses.map((e) => e.id));

  for (const id of orderedIds) {
    if (!userExpenseIds.has(id)) {
      return { ok: false, error: "Gasto no encontrado" };
    }
  }

  // Actualizar el orden de cada gasto
  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.fixedExpense.update({
        where: { id },
        data: { order: index },
      })
    )
  );

  revalidateFinance();
  return { ok: true };
}
