export interface FinanceInput {
  monthlyIncome: number;
  monthlySavings?: number;
  fixedExpenses: { id: string; category: string; amount: number }[];
  microExpenses?: {
    id: string;
    category: string;
    amount: number;
    icon?: string;
  }[];
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
  totalMicroExpenses: number;
  totalAllocated: number;
  /** Balance Disponible = Ingreso - Ahorro - Gastos Fijos - Gastos Hormiga - Asignado a proyectos ACTIVOS (no cumplidos). */
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
  const totalMicroExpenses = (input.microExpenses ?? []).reduce(
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
    input.monthlyIncome -
    monthlySavings -
    totalFixedExpenses -
    totalMicroExpenses -
    totalAllocated;

  return {
    monthlyIncome: input.monthlyIncome,
    monthlySavings,
    totalFixedExpenses,
    totalMicroExpenses,
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

export interface MicroExpenseCategoryBreakdown {
  category: string;
  amount: number;
  percent: number;
  icon: string;
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
 * Calcula el desglose de gastos hormiga agrupados por categoría.
 * Para cada categoría devuelve el subtotal acumulado, un ícono representativo
 * (el del primer gasto registrado de esa categoría) y el porcentaje que
 * representa sobre el total de gastos hormiga. Ordenado de mayor a menor monto.
 */
export function computeMicroExpenseBreakdown(
  microExpenses: { category: string; amount: number; icon?: string }[],
): MicroExpenseCategoryBreakdown[] {
  const total = microExpenses.reduce((acc, e) => acc + e.amount, 0);
  if (total === 0) return [];

  const groups = new Map<string, { amount: number; icon: string }>();
  for (const e of microExpenses) {
    const existing = groups.get(e.category);
    if (existing) {
      existing.amount += e.amount;
    } else {
      groups.set(e.category, {
        amount: e.amount,
        icon: e.icon ?? "local_cafe",
      });
    }
  }

  return Array.from(groups.entries())
    .map(([category, { amount, icon }]) => ({
      category,
      amount,
      icon,
      percent: Math.round((amount / total) * 100),
    }))
    .sort((a, b) => b.amount - a.amount);
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

// --- Historial Financiero (mensual / trimestral / semestral) ---

/**
 * Modo de agrupación del historial financiero:
 *  - "monthly"     → cada mes de forma independiente.
 *  - "quarterly"   → grupos de 3 meses.
 *  - "semiannual"  → grupos de 6 meses.
 */
export type FinanceHistoryPeriod = "monthly" | "quarterly" | "semiannual";

/** Número de meses que abarca cada grupo del historial. */
export const FINANCE_HISTORY_GROUP_SIZE: Record<FinanceHistoryPeriod, number> = {
  monthly: 1,
  quarterly: 3,
  semiannual: 6,
};

/** Registro mensual de entrada para el historial (derivado de MonthlyFinance). */
export interface FinanceHistoryEntry {
  month: string; // "YYYY-MM"
  monthLabel: string; // "Agosto 2026"
  monthlyIncome: number;
  monthlySavings: number;
  totalFixedExpenses: number;
  totalMicroExpenses: number;
  availableBalance: number;
  /** null = pendiente, true = ahorró, false = no ahorró (ahorro efectivo 0). */
  savingsConfirmed: boolean | null;
}

/** Un grupo del historial (1 mes en "monthly", hasta 3 o 6 en los otros modos). */
export interface FinanceHistoryGroup {
  /** Clave del grupo: el mes del primer elemento (más antiguo) del grupo. */
  key: string;
  /** Etiqueta legible: un mes ("Agosto 2026") o un rango ("Jun – Ago 2026"). */
  label: string;
  /** Meses incluidos en el grupo (orden cronológico ascendente). */
  months: FinanceHistoryEntry[];
  /** Suma de ingresos del grupo. */
  totalIncome: number;
  /** Ahorro EFECTIVO del grupo (los meses con savingsConfirmed === false = 0). */
  totalSavings: number;
  /** Suma de gastos fijos del grupo. */
  totalFixedExpenses: number;
  /** Suma de gastos hormiga del grupo. */
  totalMicroExpenses: number;
  /** Suma de balances disponibles del grupo. */
  totalAvailable: number;
  /** Promedios mensuales dentro del grupo (para métricas comparables). */
  avgIncome: number;
  avgSavings: number;
}

/** Ahorro efectivo de un mes: 0 si el usuario declaró que no ahorró. */
export function effectiveMonthlySavings(entry: FinanceHistoryEntry): number {
  return entry.savingsConfirmed === false ? 0 : entry.monthlySavings;
}

/**
 * Abrevia una etiqueta de mes "Agosto 2026" → { month: "Ago", year: "2026" }.
 * Robusto ante etiquetas que solo traigan la clave ("2026-08").
 */
function splitMonthLabel(label: string): { month: string; year: string } {
  const parts = label.trim().split(/\s+/);
  if (parts.length >= 2) {
    const month = parts[0].slice(0, 3);
    const cap = month.charAt(0).toUpperCase() + month.slice(1);
    return { month: cap, year: parts[parts.length - 1] };
  }
  return { month: label, year: "" };
}

/** Etiqueta de un grupo: un mes, o un rango "Jun – Ago 2026". */
function groupLabel(months: FinanceHistoryEntry[]): string {
  if (months.length === 0) return "";
  if (months.length === 1) return months[0].monthLabel;
  const first = splitMonthLabel(months[0].monthLabel);
  const last = splitMonthLabel(months[months.length - 1].monthLabel);
  if (first.year === last.year) {
    return `${first.month} – ${last.month} ${last.year}`.trim();
  }
  return `${first.month} ${first.year} – ${last.month} ${last.year}`.trim();
}

/**
 * Agrupa el historial financiero según el periodo elegido.
 *
 * Entrada: `entries` en orden cronológico ASCENDENTE (mes más antiguo primero).
 * En "monthly" cada mes es su propio grupo. En "quarterly"/"semiannual" se
 * agrupan desde el más reciente hacia atrás en bloques de 3 / 6 meses (de modo
 * que el grupo más reciente siempre esté "completo" y el más antiguo pueda ser
 * parcial). El resultado se devuelve en orden ascendente.
 *
 * Función pura y testeable (no depende de `Date.now`).
 */
export function groupFinanceHistory(
  entries: FinanceHistoryEntry[],
  period: FinanceHistoryPeriod,
): FinanceHistoryGroup[] {
  const size = FINANCE_HISTORY_GROUP_SIZE[period];
  if (entries.length === 0) return [];

  // Ordena ascendente por clave de mes (defensivo).
  const sorted = [...entries].sort((a, b) => a.month.localeCompare(b.month));

  if (size === 1) {
    return sorted.map((m) => buildGroup([m]));
  }

  // Agrupa desde el más reciente hacia atrás para que el bloque reciente quede
  // completo; luego se invierte para devolver en orden ascendente.
  const chunks: FinanceHistoryEntry[][] = [];
  for (let i = sorted.length; i > 0; i -= size) {
    const start = Math.max(0, i - size);
    chunks.push(sorted.slice(start, i));
  }
  chunks.reverse();
  return chunks.map(buildGroup);
}

/** Construye un grupo con sus totales y promedios a partir de sus meses. */
function buildGroup(months: FinanceHistoryEntry[]): FinanceHistoryGroup {
  const totalIncome = months.reduce((a, m) => a + m.monthlyIncome, 0);
  const totalSavings = months.reduce((a, m) => a + effectiveMonthlySavings(m), 0);
  const totalFixedExpenses = months.reduce((a, m) => a + m.totalFixedExpenses, 0);
  const totalMicroExpenses = months.reduce((a, m) => a + m.totalMicroExpenses, 0);
  const totalAvailable = months.reduce((a, m) => a + m.availableBalance, 0);
  const n = months.length || 1;
  return {
    key: months[0].month,
    label: groupLabel(months),
    months,
    totalIncome,
    totalSavings,
    totalFixedExpenses,
    totalMicroExpenses,
    totalAvailable,
    avgIncome: Math.round((totalIncome / n) * 100) / 100,
    avgSavings: Math.round((totalSavings / n) * 100) / 100,
  };
}
