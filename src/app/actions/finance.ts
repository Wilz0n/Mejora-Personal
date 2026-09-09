"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { getUserId, getUserTimezone } from "@/lib/db/session";
import {
  createProjectSchema,
  createExpenseSchema,
  createMicroExpenseSchema,
  setIncomeSchema,
  setSavingsSchema,
  confirmMonthlySavingsSchema,
  updateMonthlySavingsSchema,
} from "@/lib/validators";
import {
  computeFinanceSummary,
  computeExpenseBreakdown,
  computeMicroExpenseBreakdown,
  computeProjectsSnapshot,
  suggestedSavings,
  currentMonthKey,
  monthKeyOf,
} from "@/lib/logic/finance-logic";
import { monthLabel, nowInTimezone } from "@/lib/logic/dates";
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

/** Crea un gasto hormiga (micro-gasto). */
export async function createMicroExpense(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const userId = await getUserId();

  const parsed = createMicroExpenseSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Datos inválidos",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { category, amount, icon } = parsed.data;

  const micro = await prisma.microExpense.create({
    data: { userId, category, amount, icon },
    select: { id: true },
  });

  revalidateFinance();
  return { ok: true, data: { id: micro.id } };
}

/** Elimina un gasto hormiga asegurando la propiedad. */
export async function deleteMicroExpense(
  microExpenseId: string,
): Promise<ActionResult> {
  const userId = await getUserId();
  const result = await prisma.microExpense.deleteMany({
    where: { id: microExpenseId, userId },
  });
  if (result.count === 0)
    return { ok: false, error: "Gasto hormiga no encontrado" };
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

  // Vincula el cierre del mes en curso (si existe) para que el gráfico, el
  // acumulado y la vista /finanzas/mes reflejen el mismo ahorro que la tarjeta.
  await syncCurrentMonthSavings(userId, monthlySavings);

  revalidateFinance();
  return { ok: true };
}

/**
 * Sincroniza el ahorro del cierre MonthlyFinance del MES EN CURSO con el valor
 * dado, recalculando su `availableBalance` y marcándolo como confirmado.
 *
 * Solo actúa si ya existe un cierre para el mes actual (no crea uno nuevo: el
 * cierre se materializa con "Guardar Finanza"). Mantiene una única fuente de
 * verdad entre la tarjeta de ahorro (FinancialSummary) y el snapshot mensual.
 */
async function syncCurrentMonthSavings(
  userId: string,
  savings: number,
): Promise<void> {
  const month = currentMonthKey();
  const existing = await prisma.monthlyFinance.findUnique({
    where: { userId_month: { userId, month } },
    select: {
      monthlyIncome: true,
      monthlySavings: true,
      totalFixedExpenses: true,
      totalMicroExpenses: true,
      availableBalance: true,
    },
  });
  if (!existing) return;

  const income = Number(existing.monthlyIncome);
  const prevSavings = Number(existing.monthlySavings);
  const fixed = Number(existing.totalFixedExpenses);
  const micro = Number(existing.totalMicroExpenses);
  const prevAvailable = Number(existing.availableBalance);
  // totalAllocated se deriva de los términos guardados y se mantiene constante.
  const totalAllocated = income - prevSavings - fixed - micro - prevAvailable;
  const availableBalance = income - savings - fixed - micro - totalAllocated;

  await prisma.monthlyFinance.update({
    where: { userId_month: { userId, month } },
    data: { monthlySavings: savings, availableBalance, savingsConfirmed: true },
  });
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
  const result = await writeMonthlySnapshot(userId, currentMonthKey(), monthLabel());
  if (!result.ok) return result;
  revalidateFinance();
  return { ok: true };
}

/**
 * Construye y persiste (upsert) el snapshot MonthlyFinance del `month` indicado
 * a partir de la configuración financiera ACTUAL del usuario (ingreso, ahorro,
 * gastos fijos, gastos hormiga y proyectos).
 *
 * Se usa tanto en "Guardar Finanza" (mes en curso) como en el reinicio mensual
 * lazy (para archivar el mes que termina con los datos que aún están vivos).
 * No revalida rutas: el llamador decide cuándo hacerlo.
 */
async function writeMonthlySnapshot(
  userId: string,
  month: string,
  label: string,
): Promise<ActionResult> {
  // Reúne la configuración financiera actual del usuario.
  const [summary, fixedExpensesRaw, microExpensesRaw, projectsRaw] =
    await Promise.all([
      prisma.financialSummary.findUnique({ where: { userId } }),
      prisma.fixedExpense.findMany({
        where: { userId },
        orderBy: { amount: "desc" },
      }),
      prisma.microExpense.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
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
  const microExpenses = microExpensesRaw.map((e) => ({
    id: e.id,
    category: e.category,
    amount: Number(e.amount),
    icon: e.icon,
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
    microExpenses,
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
    financeSummary.totalMicroExpenses -
    financeSummary.totalAllocated;

  const expensesByCategory = computeExpenseBreakdown(fixedExpenses);
  const microExpensesByCategory = computeMicroExpenseBreakdown(microExpenses);
  const projectsSnapshot = computeProjectsSnapshot(projects);

  await prisma.monthlyFinance.upsert({
    where: { userId_month: { userId, month } },
    create: {
      userId,
      month,
      monthLabel: label,
      monthlyIncome: financeSummary.monthlyIncome,
      monthlySavings: savings,
      totalFixedExpenses: financeSummary.totalFixedExpenses,
      totalMicroExpenses: financeSummary.totalMicroExpenses,
      availableBalance,
      currency,
      expensesByCategory: JSON.stringify(expensesByCategory),
      microExpensesByCategory: JSON.stringify(microExpensesByCategory),
      projectsSnapshot: JSON.stringify(projectsSnapshot),
    },
    update: {
      monthLabel: label,
      monthlyIncome: financeSummary.monthlyIncome,
      monthlySavings: savings,
      totalFixedExpenses: financeSummary.totalFixedExpenses,
      totalMicroExpenses: financeSummary.totalMicroExpenses,
      availableBalance,
      currency,
      expensesByCategory: JSON.stringify(expensesByCategory),
      microExpensesByCategory: JSON.stringify(microExpensesByCategory),
      projectsSnapshot: JSON.stringify(projectsSnapshot),
    },
  });

  return { ok: true };
}

/**
 * Reinicio mensual LAZY (sin cron). Se invoca al renderizar /finanzas.
 *
 * Cuando el mes en curso (según la timezone del usuario) es distinto del último
 * mes en que se ejecutó el reinicio (`FinancialSummary.lastFinanceResetMonth`):
 *  1. Archiva el cierre del mes ANTERIOR con los datos que aún están vivos
 *     (snapshot en MonthlyFinance), si el usuario tiene configuración.
 *  2. Resetea para empezar el nuevo mes desde cero:
 *       - `monthlySavings = 0`
 *       - borra todos los `MicroExpense` (gastos hormiga)
 *       - pone `paidThisMonth = false` en los gastos fijos
 *     Se CONSERVAN: ingreso mensual, montos de gastos fijos y proyectos/metas.
 *  3. Marca `lastFinanceResetMonth = mes actual` (idempotente).
 *
 * Es idempotente: si ya se procesó el mes actual, no hace nada. Si el usuario
 * es nuevo (sin marca previa), solo fija la marca al mes actual sin resetear.
 */
export async function ensureMonthlyRollover(userId: string): Promise<void> {
  const timezone = await getUserTimezone(userId);
  const now = nowInTimezone(timezone);
  const thisMonth = monthKeyOf(now);

  const summary = await prisma.financialSummary.findUnique({
    where: { userId },
    select: { lastFinanceResetMonth: true },
  });

  const last = summary?.lastFinanceResetMonth ?? null;

  // Ya procesado este mes → nada que hacer.
  if (last === thisMonth) return;

  // Usuario sin marca previa (nuevo o primer render tras la migración): solo
  // fija la marca al mes actual. No reseteamos porque los datos vivos son del
  // mes en curso; el archivado empezará el próximo cambio de mes.
  if (last === null) {
    await prisma.financialSummary.upsert({
      where: { userId },
      create: { userId, lastFinanceResetMonth: thisMonth },
      update: { lastFinanceResetMonth: thisMonth },
    });
    return;
  }

  // Cambió el mes respecto al último reinicio → archivar el mes anterior y
  // resetear. El mes a archivar es `last` (el último mes activo del usuario).
  const prevLabel = monthLabel(
    new Date(Number(last.slice(0, 4)), Number(last.slice(5, 7)) - 1, 1),
  );

  // 1) Archiva el cierre del mes anterior con los datos vivos (best-effort:
  //    si no hay configuración suficiente, writeMonthlySnapshot devuelve ok:false
  //    y simplemente no se archiva).
  await writeMonthlySnapshot(userId, last, prevLabel);

  // 2) Reset del nuevo mes.
  await prisma.$transaction([
    prisma.financialSummary.update({
      where: { userId },
      data: { monthlySavings: 0, lastFinanceResetMonth: thisMonth },
    }),
    prisma.microExpense.deleteMany({ where: { userId } }),
    prisma.fixedExpense.updateMany({
      where: { userId },
      data: { paidThisMonth: false },
    }),
  ]);
}

/** Toggle del estado "pagado este mes" de un gasto fijo (doble clic/tap). */
export async function toggleExpensePaid(expenseId: string): Promise<ActionResult> {
  const userId = await getUserId();

  const expense = await prisma.fixedExpense.findFirst({
    where: { id: expenseId, userId },
    select: { paidThisMonth: true },
  });
  if (!expense) return { ok: false, error: "Gasto no encontrado" };

  await prisma.fixedExpense.updateMany({
    where: { id: expenseId, userId },
    data: { paidThisMonth: !expense.paidThisMonth },
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

/**
 * Registra si el usuario logró (o no) su ahorro del mes indicado.
 *
 * - `confirmed = true`  → `savingsConfirmed = true`. La cifra de ahorro del mes
 *   se mantiene y sigue sumando al "Ahorro Acumulado".
 * - `confirmed = false` → `savingsConfirmed = false`. El ahorro efectivo del mes
 *   cuenta como 0 en el acumulado (ver `getSavingsHistory` en `data.ts`).
 *
 * Actualiza el registro MonthlyFinance del mes. Si aún no existe un cierre para
 * ese mes, lo crea con los datos actuales del usuario antes de fijar la bandera.
 * Funciona igual en modo multi-usuario y en SINGLE_USER_MODE (usa getUserId()).
 */
export async function confirmMonthlySavings(
  input: unknown,
): Promise<ActionResult> {
  const userId = await getUserId();

  const parsed = confirmMonthlySavingsSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Datos inválidos",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { month, confirmed } = parsed.data;

  const existing = await prisma.monthlyFinance.findUnique({
    where: { userId_month: { userId, month } },
    select: { id: true },
  });

  if (existing) {
    await prisma.monthlyFinance.update({
      where: { userId_month: { userId, month } },
      data: { savingsConfirmed: confirmed },
    });
  } else {
    // No hay cierre guardado para ese mes: construye un snapshot mínimo con la
    // configuración actual y fija la bandera. (Camino defensivo; normalmente el
    // modal solo aparece cuando ya existe un cierre.)
    const [summary, fixedExpensesRaw] = await Promise.all([
      prisma.financialSummary.findUnique({ where: { userId } }),
      prisma.fixedExpense.findMany({ where: { userId } }),
    ]);

    const monthlyIncome = summary ? Number(summary.monthlyIncome) : 0;
    const monthlySavingsRaw = summary ? Number(summary.monthlySavings) : 0;
    const currency = summary?.currency ?? "USD";
    const fixedExpenses = fixedExpensesRaw.map((e) => ({
      category: e.category,
      amount: Number(e.amount),
    }));
    const totalFixedExpenses = fixedExpenses.reduce((a, e) => a + e.amount, 0);
    const savings =
      monthlySavingsRaw > 0 ? monthlySavingsRaw : suggestedSavings(monthlyIncome);
    const availableBalance = monthlyIncome - savings - totalFixedExpenses;

    await prisma.monthlyFinance.create({
      data: {
        userId,
        month,
        monthLabel: month,
        monthlyIncome,
        monthlySavings: savings,
        totalFixedExpenses,
        availableBalance,
        currency,
        expensesByCategory: JSON.stringify(
          computeExpenseBreakdown(fixedExpenses),
        ),
        projectsSnapshot: JSON.stringify([]),
        savingsConfirmed: confirmed,
      },
    });
  }

  revalidateFinance();
  return { ok: true };
}

/**
 * Actualiza el ahorro de un mes (modelo híbrido de confirmación continua).
 *
 * Firma: `{ month, confirmed, newAmount?, mode? }`.
 *
 * - Sin `newAmount`: solo fija `savingsConfirmed = confirmed` (equivalente a las
 *   acciones "Sí ahorré" / "No ahorré" del banner).
 * - Con `newAmount` y `mode = "add"`: suma `newAmount` al ahorro del mes.
 * - Con `newAmount` y `mode = "set"`: fija `newAmount` como el ahorro total del mes.
 *
 * Al cambiar el monto se recalcula `availableBalance` del mes:
 *   availableBalance = monthlyIncome − monthlySavings − totalFixedExpenses
 *                      − totalMicroExpenses − totalAllocated
 * (los totales se conservan del cierre existente; el único término que cambia
 * es `monthlySavings`).
 *
 * Si no existe un cierre para ese mes, se construye un snapshot mínimo con la
 * configuración actual del usuario (camino defensivo). Funciona igual en modo
 * multi-usuario y en SINGLE_USER_MODE (usa getUserId()).
 */
export async function updateMonthlySavings(
  input: unknown,
): Promise<ActionResult> {
  const userId = await getUserId();

  const parsed = updateMonthlySavingsSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Datos inválidos",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { month, confirmed, newAmount, mode } = parsed.data;

  // Ahorro final del mes tras el ajuste (para sincronizar FinancialSummary si
  // el mes objetivo es el mes en curso). Se completa en cada rama.
  let resolvedSavings: number | null = null;

  const existing = await prisma.monthlyFinance.findUnique({
    where: { userId_month: { userId, month } },
    select: {
      monthlyIncome: true,
      monthlySavings: true,
      totalFixedExpenses: true,
      totalMicroExpenses: true,
      availableBalance: true,
    },
  });

  if (existing) {
    const data: {
      savingsConfirmed: boolean;
      monthlySavings?: number;
      availableBalance?: number;
    } = { savingsConfirmed: confirmed };

    // Ajuste de monto (opcional): recalcula ahorro y balance del mes.
    if (typeof newAmount === "number") {
      const currentSavings = Number(existing.monthlySavings);
      const nextSavings =
        mode === "add" ? currentSavings + newAmount : newAmount;

      // Reconstruye totalAllocated a partir de los términos guardados.
      const income = Number(existing.monthlyIncome);
      const fixed = Number(existing.totalFixedExpenses);
      const micro = Number(existing.totalMicroExpenses);
      const prevAvailable = Number(existing.availableBalance);
      // totalAllocated = income − prevSavings − fixed − micro − prevAvailable
      const totalAllocated = income - currentSavings - fixed - micro - prevAvailable;
      const nextAvailable = income - nextSavings - fixed - micro - totalAllocated;

      data.monthlySavings = nextSavings;
      data.availableBalance = nextAvailable;
      resolvedSavings = nextSavings;
    }

    await prisma.monthlyFinance.update({
      where: { userId_month: { userId, month } },
      data,
    });
  } else {
    // No hay cierre para ese mes: snapshot mínimo con la config actual.
    const [summary, fixedExpensesRaw] = await Promise.all([
      prisma.financialSummary.findUnique({ where: { userId } }),
      prisma.fixedExpense.findMany({ where: { userId } }),
    ]);

    const monthlyIncome = summary ? Number(summary.monthlyIncome) : 0;
    const monthlySavingsRaw = summary ? Number(summary.monthlySavings) : 0;
    const currency = summary?.currency ?? "USD";
    const fixedExpenses = fixedExpensesRaw.map((e) => ({
      category: e.category,
      amount: Number(e.amount),
    }));
    const totalFixedExpenses = fixedExpenses.reduce((a, e) => a + e.amount, 0);

    const baseSavings =
      monthlySavingsRaw > 0 ? monthlySavingsRaw : suggestedSavings(monthlyIncome);
    const savings =
      typeof newAmount === "number"
        ? mode === "add"
          ? baseSavings + newAmount
          : newAmount
        : baseSavings;
    const availableBalance = monthlyIncome - savings - totalFixedExpenses;
    if (typeof newAmount === "number") resolvedSavings = savings;

    await prisma.monthlyFinance.create({
      data: {
        userId,
        month,
        monthLabel: month,
        monthlyIncome,
        monthlySavings: savings,
        totalFixedExpenses,
        availableBalance,
        currency,
        expensesByCategory: JSON.stringify(
          computeExpenseBreakdown(fixedExpenses),
        ),
        projectsSnapshot: JSON.stringify([]),
        savingsConfirmed: confirmed,
      },
    });
  }

  // Si se ajustó el monto del MES EN CURSO, sincroniza también la configuración
  // viva (FinancialSummary), que es la que muestra la tarjeta "Ahorro Mensual"
  // en /finanzas. Así el número visible refleja el ajuste al instante.
  if (resolvedSavings !== null && month === currentMonthKey()) {
    await prisma.financialSummary.upsert({
      where: { userId },
      create: { userId, monthlySavings: resolvedSavings },
      update: { monthlySavings: resolvedSavings },
    });
  }

  revalidateFinance();
  return { ok: true };
}
