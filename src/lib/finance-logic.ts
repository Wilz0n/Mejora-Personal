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
