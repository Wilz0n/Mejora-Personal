import {
  weekDayKeys,
  monthDayKeys,
  lastMonthsDayKeys,
  todayKey,
  nowInTimezone,
} from "@/lib/logic/dates";

export type Period = "week" | "month" | "quarter" | "semester";

/** Número de meses que abarca cada periodo multi-mes. */
export const PERIOD_MONTHS: Record<"quarter" | "semester", number> = {
  quarter: 3,
  semester: 6,
};

/**
 * Antigüedad MÍNIMA (en meses acumulados) requerida para desbloquear cada
 * periodo. Semanal y mensual están siempre disponibles (mínimo 1). Trimestral
 * exige 3 meses; semestral exige 6.
 */
export const PERIOD_MIN_MONTHS: Record<Period, number> = {
  week: 1,
  month: 1,
  quarter: 3,
  semester: 6,
};

/**
 * Indica si el periodo está desbloqueado dado los meses de antigüedad del
 * usuario. `tenureMonths` es la antigüedad acumulada (ver `monthsSinceCreation`).
 */
export function isPeriodUnlocked(period: Period, tenureMonths: number): boolean {
  return tenureMonths >= PERIOD_MIN_MONTHS[period];
}

/**
 * Antigüedad (en meses de uso del ciclo actual) a partir de la cual se pide al
 * usuario archivar/exportar sus datos y reiniciar el ciclo. La app conserva
 * ~6 meses de datos; al llegar al 7º mes se activa el flujo de archivado.
 */
export const ARCHIVE_THRESHOLD_MONTHS = 7;

/**
 * Indica si el usuario alcanzó el umbral de archivado (7º mes o más del ciclo
 * actual). `tenureMonths` debe calcularse desde el inicio del ciclo vigente
 * (ver `monthsSinceTenureStart`, que parte de max(createdAt, dataResetAt)).
 */
export function isArchiveDue(tenureMonths: number): boolean {
  return tenureMonths >= ARCHIVE_THRESHOLD_MONTHS;
}

/** Devuelve las claves de día del periodo dado. */
export function periodDayKeys(
  period: Period,
  ref?: Date,
  timezone?: string,
  createdAt?: Date,
): string[] {
  const date = ref ?? (timezone ? nowInTimezone(timezone) : new Date());
  switch (period) {
    case "week":
      return weekDayKeys(date);
    case "month":
      return monthDayKeys(date);
    case "quarter":
      return lastMonthsDayKeys(PERIOD_MONTHS.quarter, date, undefined, createdAt);
    case "semester":
      return lastMonthsDayKeys(PERIOD_MONTHS.semester, date, undefined, createdAt);
  }
}

export interface HabitWithLogs {
  id: string;
  name: string;
  icon: string;
  logs: { date: string; completed: boolean }[];
}

export interface HabitRate {
  id: string;
  name: string;
  icon: string;
  completedDays: number;
  totalDays: number;
  rate: number; // 0..100 redondeado
  /** mapa dayKey -> completed, sólo para los días del periodo */
  completionByDay: Record<string, boolean>;
}

export interface HabitKpis {
  /** Tasa global = promedio de tasas de todos los hábitos activos. */
  globalRate: number;
  /** Hábito con mayor cumplimiento. */
  best: HabitRate | null;
  /** Hábito con menor cumplimiento. */
  worst: HabitRate | null;
  /** Nº de hábitos consolidados (tasa ≥ 80%). */
  consistentCount: number;
  /** Nº de hábitos en riesgo (tasa < 40%). */
  atRiskCount: number;
  /** Total de hábitos activos considerados. */
  totalHabits: number;
}

/**
 * Calcula la tasa de cumplimiento de un hábito para el periodo.
 * Tasa = (días completados en el periodo / días totales del periodo) * 100.
 */
export function computeHabitRate(
  habit: HabitWithLogs,
  period: Period,
  ref: Date = new Date(),
  createdAt?: Date,
): HabitRate {
  const days = periodDayKeys(period, ref, undefined, createdAt);
  const daySet = new Set(days);

  const completionByDay: Record<string, boolean> = {};
  for (const d of days) completionByDay[d] = false;

  for (const log of habit.logs) {
    if (daySet.has(log.date) && log.completed) {
      completionByDay[log.date] = true;
    }
  }

  const completedDays = Object.values(completionByDay).filter(Boolean).length;
  const totalDays = days.length;
  const rate = totalDays === 0 ? 0 : Math.round((completedDays / totalDays) * 100);

  return {
    id: habit.id,
    name: habit.name,
    icon: habit.icon,
    completedDays,
    totalDays,
    rate,
    completionByDay,
  };
}

/** Calcula las tasas de todos los hábitos. */
export function computeHabitRates(
  habits: HabitWithLogs[],
  period: Period,
  ref: Date = new Date(),
  createdAt?: Date,
): HabitRate[] {
  return habits.map((h) => computeHabitRate(h, period, ref, createdAt));
}

/**
 * KPIs dinámicos:
 * - globalRate: promedio de las tasas de todos los hábitos activos.
 * - best: hábito con mayor tasa.
 * - worst: hábito con menor tasa.
 * - consistentCount: hábitos consolidados (tasa ≥ 80%).
 * - atRiskCount: hábitos en riesgo (tasa < 40%).
 */
export function computeHabitKpis(rates: HabitRate[]): HabitKpis {
  if (rates.length === 0) {
    return {
      globalRate: 0,
      best: null,
      worst: null,
      consistentCount: 0,
      atRiskCount: 0,
      totalHabits: 0,
    };
  }

  const globalRate = Math.round(
    rates.reduce((acc, r) => acc + r.rate, 0) / rates.length,
  );

  let best = rates[0];
  let worst = rates[0];
  let consistentCount = 0;
  let atRiskCount = 0;
  for (const r of rates) {
    if (r.rate > best.rate) best = r;
    if (r.rate < worst.rate) worst = r;
    if (r.rate >= 80) consistentCount++;
    if (r.rate < 40) atRiskCount++;
  }

  return {
    globalRate,
    best,
    worst,
    consistentCount,
    atRiskCount,
    totalHabits: rates.length,
  };
}

/**
 * Filtra los hábitos que aplican "hoy" con su estado de completado del día.
 * En este modelo todos los hábitos son diarios, por lo que devuelve todos
 * con el flag de completado de hoy.
 */
export function habitsForToday(habits: HabitWithLogs[]): {
  id: string;
  name: string;
  icon: string;
  completedToday: boolean;
}[] {
  const key = todayKey();
  return habits.map((h) => ({
    id: h.id,
    name: h.name,
    icon: h.icon,
    completedToday: h.logs.some((l) => l.date === key && l.completed),
  }));
}
