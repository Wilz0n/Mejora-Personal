export interface FinanceInput {
  monthlyIncome: number;
  fixedExpenses: { id: string; category: string; amount: number }[];
  projects: {
    id: string;
    name: string;
    targetAmount: number;
    allocatedAmount: number;
    tag: string;
  }[];
}

export interface FinanceSummary {
  monthlyIncome: number;
  totalFixedExpenses: number;
  totalAllocated: number;
  /** Balance Disponible = Ingreso - Gastos Fijos - Montos Asignados a Proyectos. */
  availableBalance: number;
}

export interface ProjectProgress {
  id: string;
  name: string;
  tag: string;
  targetAmount: number;
  allocatedAmount: number;
  /** Porcentaje de progreso = (allocated / target) * 100, cap a 100. */
  progress: number;
  remaining: number;
}

export function computeFinanceSummary(input: FinanceInput): FinanceSummary {
  const totalFixedExpenses = input.fixedExpenses.reduce(
    (acc, e) => acc + e.amount,
    0,
  );
  const totalAllocated = input.projects.reduce(
    (acc, p) => acc + p.allocatedAmount,
    0,
  );
  const availableBalance =
    input.monthlyIncome - totalFixedExpenses - totalAllocated;

  return {
    monthlyIncome: input.monthlyIncome,
    totalFixedExpenses,
    totalAllocated,
    availableBalance,
  };
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
    progress,
    remaining: Math.max(0, project.targetAmount - project.allocatedAmount),
  };
}

export function computeProjectsProgress(
  projects: FinanceInput["projects"],
): ProjectProgress[] {
  return projects.map(computeProjectProgress);
}

/** Formatea un número como moneda (por defecto USD, sin decimales en miles). */
export function formatCurrency(
  value: number,
  opts: { currency?: string; locale?: string } = {},
): string {
  const { currency = "USD", locale = "en-US" } = opts;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
