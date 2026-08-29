export interface FinanceInput {
  monthlyIncome: number;
  monthlySavings?: number;
  fixedExpenses: { id: string; category: string; amount: number }[];
  projects: {
    id: string;
    name: string;
    targetAmount: number;
    allocatedAmount: number;
    monthlyContribution?: number;
    completed?: boolean;
    tag: string;
  }[];
}

export interface FinanceSummary {
  monthlyIncome: number;
  monthlySavings: number;
  totalFixedExpenses: number;
  totalAllocated: number;
  /** Balance Disponible = Ingreso - Ahorro - Gastos Fijos - Asignado a proyectos ACTIVOS (no cumplidos). */
  availableBalance: number;
}

export interface ProjectProgress {
  id: string;
  name: string;
  tag: string;
  targetAmount: number;
  allocatedAmount: number;
  monthlyContribution: number;
  completed: boolean;
  /** Porcentaje de progreso = (allocated / target) * 100, cap a 100. */
  progress: number;
  remaining: number;
}

export function computeFinanceSummary(input: FinanceInput): FinanceSummary {
  const totalFixedExpenses = input.fixedExpenses.reduce(
    (acc, e) => acc + e.amount,
    0,
  );
  // Solo los proyectos ACTIVOS (no cumplidos) descuentan del balance.
  // Al completarse un proyecto, su monto deja de restar (Opción A).
  const totalAllocated = input.projects
    .filter((p) => !p.completed)
    .reduce((acc, p) => acc + p.allocatedAmount, 0);
  const monthlySavings = input.monthlySavings ?? 0;
  const availableBalance =
    input.monthlyIncome - monthlySavings - totalFixedExpenses - totalAllocated;

  return {
    monthlyIncome: input.monthlyIncome,
    monthlySavings,
    totalFixedExpenses,
    totalAllocated,
    availableBalance,
  };
}

/** Ahorro sugerido por defecto: 20% del ingreso mensual. */
export function suggestedSavings(monthlyIncome: number): number {
  return Math.round(monthlyIncome * 0.2 * 100) / 100;
}

export function computeProjectProgress(
  project: FinanceInput["projects"][number],
): ProjectProgress {
  const progress =
    project.targetAmount <= 0
      ? 0
      : Math.min(
          100,
          Math.round((project.allocatedAmount / project.targetAmount) * 100),
        );
  return {
    id: project.id,
    name: project.name,
    tag: project.tag,
    targetAmount: project.targetAmount,
    allocatedAmount: project.allocatedAmount,
    monthlyContribution: project.monthlyContribution ?? 0,
    completed: project.completed ?? false,
    progress,
    remaining: Math.max(0, project.targetAmount - project.allocatedAmount),
  };
}

export function computeProjectsProgress(
  projects: FinanceInput["projects"],
): ProjectProgress[] {
  return projects.map(computeProjectProgress);
}

/** Monedas soportadas por la app (foco en las más usadas). */
export const SUPPORTED_CURRENCIES = [
  { code: "USD", label: "USD ($)", locale: "en-US" },
  { code: "PEN", label: "PEN (S/)", locale: "es-PE" },
] as const;

export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number]["code"];

/** Locale por defecto para cada moneda soportada. */
function localeForCurrency(currency: string): string {
  return (
    SUPPORTED_CURRENCIES.find((c) => c.code === currency)?.locale ?? "en-US"
  );
}

/** Formatea un número como moneda. Usa el locale adecuado según la moneda. */
export function formatCurrency(
  value: number,
  opts: { currency?: string; locale?: string } = {},
): string {
  const { currency = "USD" } = opts;
  const locale = opts.locale ?? localeForCurrency(currency);
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

// --- Monthly Snapshot Helpers ---

export interface ExpenseCategoryBreakdown {
  category: string;
  amount: number;
  percent: number;
}

export interface ProjectSnapshotItem {
  name: string;
  tag: string;
  targetAmount: number;
  allocatedAmount: number;
  progress: number;
}

/**
 * Calcula el desglose de gastos fijos por categoría (porcentaje sobre el total).
 * Usado para armar el cierre mensual ("Guardar Finanza").
 */
export function computeExpenseBreakdown(
  fixedExpenses: { category: string; amount: number }[],
): ExpenseCategoryBreakdown[] {
  const total = fixedExpenses.reduce((acc, e) => acc + e.amount, 0);
  if (total === 0) return [];
  return fixedExpenses.map((e) => ({
    category: e.category,
    amount: e.amount,
    percent: Math.round((e.amount / total) * 100),
  }));
}

/**
 * Arma un snapshot de los proyectos activos para el cierre mensual.
 */
export function computeProjectsSnapshot(
  projects: FinanceInput["projects"],
): ProjectSnapshotItem[] {
  return projects
    .filter((p) => !p.completed)
    .map((p) => ({
      name: p.name,
      tag: p.tag,
      targetAmount: p.targetAmount,
      allocatedAmount: p.allocatedAmount,
      progress: computeProjectProgress(p).progress,
    }));
}

/**
 * Devuelve la clave del mes actual en formato "YYYY-MM" (ej. "2026-08").
 */
export function currentMonthKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

// --- Confirmación de Ahorro Mensual ---

/** Clave "YYYY-MM" de una fecha dada. */
export function monthKeyOf(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

/** Clave "YYYY-MM" del mes anterior a la fecha dada. */
export function previousMonthKey(date: Date): string {
  return monthKeyOf(new Date(date.getFullYear(), date.getMonth() - 1, 1));
}

/** Días que quedan en el mes de `date` (incluye el día actual). */
function daysLeftInMonth(date: Date): number {
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  return lastDay - date.getDate() + 1;
}

/** Día del mes de `date` (1-based). */
function dayOfMonthOf(date: Date): number {
  return date.getDate();
}

/**
 * Cuántos días antes del fin de mes se abre la ventana de confirmación del
 * mes en curso, y cuántos días del inicio del mes siguiente se sigue
 * permitiendo confirmar el mes anterior.
 */
export const SAVINGS_CONFIRM_WINDOW_DAYS = 3;
export const SAVINGS_CONFIRM_GRACE_DAYS = 7;

export interface MonthlyConfirmState {
  month: string;
  savingsConfirmed: boolean | null;
}

/**
 * Determina qué mes (si alguno) debe confirmar el usuario según la fecha
 * actual y los registros MonthlyFinance existentes.
 *
 * Reglas:
 *  - Ventana de cierre del mes actual: en los últimos `SAVINGS_CONFIRM_WINDOW_DAYS`
 *    días del mes, si existe un cierre del mes actual con `savingsConfirmed === null`,
 *    se solicita confirmar el mes actual.
 *  - Inicio del mes siguiente (periodo de gracia `SAVINGS_CONFIRM_GRACE_DAYS`):
 *    si el mes anterior tiene un cierre con `savingsConfirmed === null`,
 *    se solicita confirmarlo (tiene prioridad, es un mes ya terminado).
 *
 * Función pura: recibe `now` explícito para ser testeable y timezone-aware.
 * Devuelve la clave "YYYY-MM" a confirmar, o `null` si no hay nada pendiente.
 */
export function pendingSavingsConfirmation(
  records: MonthlyConfirmState[],
  now: Date,
): string | null {
  const byMonth = new Map(records.map((r) => [r.month, r]));

  // 1) Prioridad: el mes anterior sin responder, dentro del periodo de gracia.
  if (dayOfMonthOf(now) <= SAVINGS_CONFIRM_GRACE_DAYS) {
    const prev = previousMonthKey(now);
    const prevRecord = byMonth.get(prev);
    if (prevRecord && prevRecord.savingsConfirmed === null) {
      return prev;
    }
  }

  // 2) Ventana de cierre del mes en curso.
  if (daysLeftInMonth(now) <= SAVINGS_CONFIRM_WINDOW_DAYS) {
    const cur = monthKeyOf(now);
    const curRecord = byMonth.get(cur);
    if (curRecord && curRecord.savingsConfirmed === null) {
      return cur;
    }
  }

  return null;
}
