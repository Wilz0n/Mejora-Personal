import { prisma } from "@/lib/prisma";
import { periodDayKeys, type Period } from "@/lib/habits-logic";
import type { HabitWithLogs } from "@/lib/habits-logic";

/**
 * Todas las funciones aquí reciben `userId` explícito y filtran por él,
 * garantizando aislamiento por usuario (multi-tenancy).
 */

/** Hábitos del usuario con sus logs dentro del periodo indicado. */
export async function getHabitsWithLogs(
  userId: string,
  period: Period,
  ref: Date = new Date(),
): Promise<HabitWithLogs[]> {
  const days = periodDayKeys(period, ref);
  const habits = await prisma.habit.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    include: {
      logs: {
        where: { date: { in: days } },
        select: { date: true, completed: true },
      },
    },
  });
  return habits.map((h) => ({
    id: h.id,
    name: h.name,
    icon: h.icon,
    logs: h.logs,
  }));
}

/** Hábitos del usuario con el log de HOY (para el dashboard). */
export async function getHabitsForToday(
  userId: string,
  todayKey: string,
): Promise<HabitWithLogs[]> {
  const habits = await prisma.habit.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    include: {
      logs: {
        where: { date: todayKey },
        select: { date: true, completed: true },
      },
    },
  });
  return habits.map((h) => ({
    id: h.id,
    name: h.name,
    icon: h.icon,
    logs: h.logs,
  }));
}

/** Datos financieros del usuario, con Decimals convertidos a number. */
export async function getFinanceData(userId: string) {
  const [summary, fixedExpenses, projects] = await Promise.all([
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

  return {
    monthlyIncome: summary ? Number(summary.monthlyIncome) : 0,
    monthlySavings: summary ? Number(summary.monthlySavings) : 0,
    currency: summary?.currency ?? "USD",
    fixedExpenses: fixedExpenses.map((e) => ({
      id: e.id,
      category: e.category,
      amount: Number(e.amount),
    })),
    projects: projects.map((p) => ({
      id: p.id,
      name: p.name,
      targetAmount: Number(p.targetAmount),
      allocatedAmount: Number(p.allocatedAmount),
      monthlyContribution: Number(p.monthlyContribution),
      completed: p.completedAt !== null,
      tag: p.tag,
    })),
  };
}

/** Perfil básico del usuario (para la sección Ajustes / Identidad). */
export async function getUserProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true, image: true },
  });
  return {
    name: user?.name ?? "Usuario",
    email: user?.email ?? "",
    image: user?.image ?? null,
  };
}

export interface MonthlyFinanceData {
  month: string;
  monthLabel: string;
  monthlyIncome: number;
  monthlySavings: number;
  totalFixedExpenses: number;
  availableBalance: number;
  currency: string;
  expensesByCategory: {
    category: string;
    amount: number;
    percent: number;
  }[];
  projectsSnapshot: {
    name: string;
    tag: string;
    targetAmount: number;
    allocatedAmount: number;
    progress: number;
  }[];
  updatedAt: string;
}

/**
 * Lee el cierre financiero guardado del usuario. Si no se pasa `month`,
 * devuelve el más reciente. Devuelve null si no hay ningún cierre guardado.
 * Convierte Decimal→number y parsea los campos JSON.
 */
export async function getMonthlyFinance(
  userId: string,
  month?: string,
): Promise<MonthlyFinanceData | null> {
  const record = month
    ? await prisma.monthlyFinance.findUnique({
        where: { userId_month: { userId, month } },
      })
    : await prisma.monthlyFinance.findFirst({
        where: { userId },
        orderBy: { month: "desc" },
      });

  if (!record) return null;

  const safeParse = <T>(raw: string, fallback: T): T => {
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  };

  return {
    month: record.month,
    monthLabel: record.monthLabel,
    monthlyIncome: Number(record.monthlyIncome),
    monthlySavings: Number(record.monthlySavings),
    totalFixedExpenses: Number(record.totalFixedExpenses),
    availableBalance: Number(record.availableBalance),
    currency: record.currency,
    expensesByCategory: safeParse(record.expensesByCategory, []),
    projectsSnapshot: safeParse(record.projectsSnapshot, []),
    updatedAt: record.updatedAt.toISOString(),
  };
}

/**
 * Reúne todos los datos del usuario (hábitos + logs, finanzas, proyectos)
 * para exportarlos. Devuelve un objeto serializable a JSON.
 */
export async function getUserExportData(userId: string) {
  const [profile, habits, summary, fixedExpenses, projects] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true, createdAt: true },
      }),
      prisma.habit.findMany({
        where: { userId },
        orderBy: { createdAt: "asc" },
        include: {
          logs: {
            select: { date: true, completed: true },
            orderBy: { date: "asc" },
          },
        },
      }),
      prisma.financialSummary.findUnique({ where: { userId } }),
      prisma.fixedExpense.findMany({ where: { userId } }),
      prisma.projectGoal.findMany({ where: { userId } }),
    ]);

  return {
    exportedAt: new Date().toISOString(),
    profile: {
      name: profile?.name ?? null,
      email: profile?.email ?? null,
      memberSince: profile?.createdAt?.toISOString() ?? null,
    },
    habits: habits.map((h) => ({
      name: h.name,
      icon: h.icon,
      logs: h.logs,
    })),
    finance: {
      monthlyIncome: summary ? Number(summary.monthlyIncome) : 0,
      currency: summary?.currency ?? "USD",
      fixedExpenses: fixedExpenses.map((e) => ({
        category: e.category,
        amount: Number(e.amount),
      })),
      projects: projects.map((p) => ({
        name: p.name,
        targetAmount: Number(p.targetAmount),
        allocatedAmount: Number(p.allocatedAmount),
        tag: p.tag,
      })),
    },
  };
}
