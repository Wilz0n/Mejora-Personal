import { weekDayKeys, monthDayKeys, todayKey } from "@/lib/dates";

export type Period = "week" | "month";

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
}

/** Devuelve las claves de día del periodo dado. */
export function periodDayKeys(period: Period, ref: Date = new Date()): string[] {
  return period === "week" ? weekDayKeys(ref) : monthDayKeys(ref);
}

/**
 * Calcula la tasa de cumplimiento de un hábito para el periodo.
 * Tasa = (días completados en el periodo / días totales del periodo) * 100.
 */
export function computeHabitRate(
  habit: HabitWithLogs,
  period: Period,
  ref: Date = new Date(),
): HabitRate {
  const days = periodDayKeys(period, ref);
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
): HabitRate[] {
  return habits.map((h) => computeHabitRate(h, period, ref));
}

/**
 * KPIs dinámicos:
 * - globalRate: promedio de las tasas de todos los hábitos activos.
 * - best: hábito con mayor tasa.
 * - worst: hábito con menor tasa.
 */
export function computeHabitKpis(rates: HabitRate[]): HabitKpis {
  if (rates.length === 0) {
    return { globalRate: 0, best: null, worst: null };
  }

  const globalRate = Math.round(
    rates.reduce((acc, r) => acc + r.rate, 0) / rates.length,
  );

  let best = rates[0];
  let worst = rates[0];
  for (const r of rates) {
    if (r.rate > best.rate) best = r;
    if (r.rate < worst.rate) worst = r;
  }

  return { globalRate, best, worst };
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
