/**
 * Lógica pura de análisis del backup exportado (`/backup-analisis`).
 *
 * Recibe el JSON generado por `getUserExportData` y deriva las métricas que
 * consume la UI de análisis: KPIs globales, progreso de hábitos mes a mes,
 * distribución de pagos, ahorro histórico y consolidado de gastos hormiga.
 *
 * Son funciones PURAS (sin acceso a BD ni a `Date.now`) para poder testearlas
 * y ejecutarlas en el cliente sobre el archivo que sube el usuario.
 */

// ------------------------------- Tipos ------------------------------------

/** Estructura del archivo exportado (debe coincidir con getUserExportData). */
export interface ExportedData {
  exportedAt: string;
  profile: {
    name: string | null;
    email: string | null;
    memberSince: string | null;
  };
  habits: {
    name: string;
    icon: string;
    logs: { date: string; completed: boolean }[];
  }[];
  finance: {
    monthlyIncome: number;
    currency: string;
    fixedExpenses: { category: string; amount: number }[];
    projects: {
      name: string;
      targetAmount: number;
      allocatedAmount: number;
      tag: string;
    }[];
  };
  monthlyFinances: {
    month: string; // "YYYY-MM"
    monthLabel: string;
    monthlyIncome: number;
    monthlySavings: number;
    totalFixedExpenses: number;
    totalMicroExpenses: number;
    availableBalance: number;
    currency: string;
    expensesByCategory: { category: string; amount: number; percent: number }[];
    microExpensesByCategory: {
      category: string;
      amount: number;
      percent: number;
      icon: string;
    }[];
    savingsConfirmed: boolean | null;
  }[];
  microExpenses: {
    category: string;
    amount: number;
    icon: string;
    date: string;
  }[];
}

/** Nivel de cumplimiento (para colorear en la UI). */
export type Level = "good" | "mid" | "low";

export interface HabitMonthly {
  name: string;
  icon: string;
  /** % global del hábito en todo el periodo. */
  rate: number;
  /** % por cada mes del periodo (alineado con `months`). */
  monthly: { month: string; label: string; rate: number; level: Level }[];
}

export interface MonthlyBar {
  month: string;
  label: string;
  /** Valor bruto (p. ej. ingreso o ahorro del mes). */
  value: number;
  /** Altura relativa 0..100 respecto al máximo de la serie. */
  heightPct: number;
}

export interface BackupAnalysis {
  hasData: boolean;
  rangeLabel: string;
  currency: string;
  monthCount: number;
  // KPIs globales (fila superior).
  kpis: {
    habitSuccessRate: number;
    totalIncome: number;
    totalFixedExpenses: number;
    netSavings: number;
    savingsRatePct: number;
  };
  // Hábitos.
  habits: {
    globalRate: number;
    best: { name: string; rate: number } | null;
    worst: { name: string; rate: number } | null;
    recent: { name: string; rate: number } | null;
    series: HabitMonthly[];
  };
  // Finanzas: distribución de pagos e ingresos por mes.
  finance: {
    incomeByMonth: MonthlyBar[];
    peakIncome: { label: string; value: number } | null;
    expensesByCategory: { category: string; amount: number; percent: number }[];
    totalExpenses: number;
  };
  // Ahorro histórico por mes.
  savings: {
    byMonth: MonthlyBar[];
    peak: { label: string; value: number } | null;
    total: number;
  };
  // Gastos hormiga.
  microExpenses: {
    total: number;
    most: { category: string; amount: number } | null;
    least: { category: string; amount: number } | null;
    topMonth: { label: string; amount: number } | null;
  };
}

// ----------------------------- Utilidades ---------------------------------

/** Clasifica un porcentaje 0..100 en nivel de color. */
export function levelOf(rate: number): Level {
  if (rate >= 80) return "good";
  if (rate >= 40) return "mid";
  return "low";
}

/** Extrae "YYYY-MM" de una day key "YYYY-MM-DD". */
function monthKeyOf(dayKey: string): string {
  return dayKey.slice(0, 7);
}

/** Etiqueta legible "mar 2024" a partir de "YYYY-MM". */
function labelOfMonth(monthKey: string): string {
  const [y, m] = monthKey.split("-").map(Number);
  const d = new Date(y, (m ?? 1) - 1, 1);
  return d.toLocaleDateString("es", { month: "short", year: "numeric" });
}

function round(n: number): number {
  return Math.round(n);
}

// --------------------------- Análisis principal ---------------------------

/**
 * Construye el análisis completo del backup. Si `null`/estructura inválida,
 * devuelve `hasData: false`.
 */
export function analyzeBackup(data: ExportedData | null): BackupAnalysis {
  const empty: BackupAnalysis = {
    hasData: false,
    rangeLabel: "",
    currency: "USD",
    monthCount: 0,
    kpis: {
      habitSuccessRate: 0,
      totalIncome: 0,
      totalFixedExpenses: 0,
      netSavings: 0,
      savingsRatePct: 0,
    },
    habits: { globalRate: 0, best: null, worst: null, recent: null, series: [] },
    finance: {
      incomeByMonth: [],
      peakIncome: null,
      expensesByCategory: [],
      totalExpenses: 0,
    },
    savings: { byMonth: [], peak: null, total: 0 },
    microExpenses: { total: 0, most: null, least: null, topMonth: null },
  };

  if (!data || !Array.isArray(data.habits) || !data.finance) return empty;

  const currency = data.finance.currency ?? "USD";

  // 1) Meses del periodo. Se toman de monthlyFinances si existen; si no, se
  //    derivan de las fechas de los logs de hábitos.
  const monthSet = new Set<string>();
  for (const mf of data.monthlyFinances ?? []) monthSet.add(mf.month);
  if (monthSet.size === 0) {
    for (const h of data.habits) {
      for (const log of h.logs) monthSet.add(monthKeyOf(log.date));
    }
  }
  const months = Array.from(monthSet).sort();

  const rangeLabel =
    months.length > 0
      ? `${labelOfMonth(months[0])} – ${labelOfMonth(months[months.length - 1])}`
      : "";

  // 2) Hábitos: % por mes y global.
  const habitSeries: HabitMonthly[] = data.habits.map((h) => {
    // Agrupa los logs completados por mes.
    const doneByMonth = new Map<string, number>();
    const totalByMonth = new Map<string, number>();
    for (const log of h.logs) {
      const mk = monthKeyOf(log.date);
      totalByMonth.set(mk, (totalByMonth.get(mk) ?? 0) + 1);
      if (log.completed) doneByMonth.set(mk, (doneByMonth.get(mk) ?? 0) + 1);
    }
    const monthly = months.map((mk) => {
      const total = totalByMonth.get(mk) ?? 0;
      const done = doneByMonth.get(mk) ?? 0;
      const rate = total > 0 ? round((done / total) * 100) : 0;
      return { month: mk, label: labelOfMonth(mk), rate, level: levelOf(rate) };
    });
    // Global: promedio de meses con actividad.
    const active = monthly.filter((m) => (totalByMonth.get(m.month) ?? 0) > 0);
    const rate =
      active.length > 0
        ? round(active.reduce((a, m) => a + m.rate, 0) / active.length)
        : 0;
    return { name: h.name, icon: h.icon, rate, monthly };
  });

  const ratedHabits = habitSeries.filter((h) => h.monthly.length > 0);
  const globalRate =
    ratedHabits.length > 0
      ? round(ratedHabits.reduce((a, h) => a + h.rate, 0) / ratedHabits.length)
      : 0;

  let best: HabitMonthly | null = null;
  let worst: HabitMonthly | null = null;
  for (const h of ratedHabits) {
    if (!best || h.rate > best.rate) best = h;
    if (!worst || h.rate < worst.rate) worst = h;
  }
  // "Reciente": el último hábito de la lista (orden de creación en el export).
  const recent =
    data.habits.length > 0
      ? habitSeries[habitSeries.length - 1]
      : null;

  // 3) Finanzas: ingreso por mes y distribución de gastos por categoría.
  const mfs = data.monthlyFinances ?? [];
  const maxIncome = Math.max(0, ...mfs.map((m) => m.monthlyIncome));
  const incomeByMonth: MonthlyBar[] = mfs.map((m) => ({
    month: m.month,
    label: labelOfMonth(m.month),
    value: m.monthlyIncome,
    heightPct: maxIncome > 0 ? round((m.monthlyIncome / maxIncome) * 100) : 0,
  }));
  let peakIncome: { label: string; value: number } | null = null;
  for (const b of incomeByMonth) {
    if (!peakIncome || b.value > peakIncome.value)
      peakIncome = { label: b.label, value: b.value };
  }

  // Distribución de gastos por categoría: acumulada de todos los meses; si no
  // hay histórico, usa los gastos fijos actuales.
  const catTotals = new Map<string, number>();
  for (const m of mfs) {
    for (const c of m.expensesByCategory) {
      catTotals.set(c.category, (catTotals.get(c.category) ?? 0) + c.amount);
    }
  }
  if (catTotals.size === 0) {
    for (const e of data.finance.fixedExpenses) {
      catTotals.set(e.category, (catTotals.get(e.category) ?? 0) + e.amount);
    }
  }
  const totalExpenses = Array.from(catTotals.values()).reduce((a, v) => a + v, 0);
  const expensesByCategory = Array.from(catTotals.entries())
    .map(([category, amount]) => ({
      category,
      amount,
      percent: totalExpenses > 0 ? round((amount / totalExpenses) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  // 4) Ahorro histórico por mes (el ahorro no confirmado cuenta como 0).
  const maxSavings = Math.max(
    0,
    ...mfs.map((m) => (m.savingsConfirmed === false ? 0 : m.monthlySavings)),
  );
  const savingsByMonth: MonthlyBar[] = mfs.map((m) => {
    const value = m.savingsConfirmed === false ? 0 : m.monthlySavings;
    return {
      month: m.month,
      label: labelOfMonth(m.month),
      value,
      heightPct: maxSavings > 0 ? round((value / maxSavings) * 100) : 0,
    };
  });
  let peakSavings: { label: string; value: number } | null = null;
  for (const b of savingsByMonth) {
    if (!peakSavings || b.value > peakSavings.value)
      peakSavings = { label: b.label, value: b.value };
  }
  const totalSavings = savingsByMonth.reduce((a, b) => a + b.value, 0);

  // 5) Gastos hormiga: total, categoría más/menos, mes de mayor gasto.
  const microByCat = new Map<string, number>();
  const microByMonth = new Map<string, number>();
  for (const e of data.microExpenses ?? []) {
    microByCat.set(e.category, (microByCat.get(e.category) ?? 0) + e.amount);
    const mk = monthKeyOf(e.date.slice(0, 10));
    microByMonth.set(mk, (microByMonth.get(mk) ?? 0) + e.amount);
  }
  const microTotal = Array.from(microByCat.values()).reduce((a, v) => a + v, 0);
  let most: { category: string; amount: number } | null = null;
  let least: { category: string; amount: number } | null = null;
  for (const [category, amount] of microByCat.entries()) {
    if (!most || amount > most.amount) most = { category, amount };
    if (!least || amount < least.amount) least = { category, amount };
  }
  let topMonth: { label: string; amount: number } | null = null;
  for (const [mk, amount] of microByMonth.entries()) {
    if (!topMonth || amount > topMonth.amount)
      topMonth = { label: labelOfMonth(mk), amount };
  }

  // 6) KPIs globales consolidados del periodo.
  const totalIncome = mfs.reduce((a, m) => a + m.monthlyIncome, 0);
  const totalFixed = mfs.reduce((a, m) => a + m.totalFixedExpenses, 0);
  const netSavings = totalSavings;
  const savingsRatePct =
    totalIncome > 0 ? round((netSavings / totalIncome) * 100) : 0;

  return {
    hasData: true,
    rangeLabel,
    currency,
    monthCount: months.length,
    kpis: {
      habitSuccessRate: globalRate,
      totalIncome,
      totalFixedExpenses: totalFixed,
      netSavings,
      savingsRatePct,
    },
    habits: {
      globalRate,
      best: best ? { name: best.name, rate: best.rate } : null,
      worst: worst ? { name: worst.name, rate: worst.rate } : null,
      recent: recent ? { name: recent.name, rate: recent.rate } : null,
      series: habitSeries,
    },
    finance: {
      incomeByMonth,
      peakIncome,
      expensesByCategory,
      totalExpenses,
    },
    savings: {
      byMonth: savingsByMonth,
      peak: peakSavings,
      total: totalSavings,
    },
    microExpenses: { total: microTotal, most, least, topMonth },
  };
}
