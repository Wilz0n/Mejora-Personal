import Link from "next/link";
import { getUserId } from "@/lib/session";
import { getHabitsWithLogs } from "@/lib/data";
import {
  computeHabitRates,
  computeHabitKpis,
  periodDayKeys,
  PERIOD_MONTHS,
  type Period,
} from "@/lib/habits-logic";
import {
  shortWeekdayLabel,
  todayKey,
  monthLabel,
  monthWeeks,
  periodMonths,
} from "@/lib/dates";
import { HabitCheckbox } from "@/components/habitos/HabitCheckbox";
import { AddHabitButton } from "@/components/habitos/AddHabitButton";
import { RemoveHabitButton } from "@/components/habitos/RemoveHabitButton";
import { MonthlyTracker } from "@/components/habitos/MonthlyTracker";
import { ProgressRing } from "@/components/comun/ProgressRing";
import { Icon } from "@/components/comun/Icon";

export const dynamic = "force-dynamic";

export default async function HabitsPage({
  searchParams,
}: {
  searchParams: { view?: string };
}) {
  const period: Period = ((): Period => {
    switch (searchParams.view) {
      case "month":
        return "month";
      case "quarter":
        return "quarter";
      case "semester":
        return "semester";
      default:
        return "week";
    }
  })();
  const userId = await getUserId();

  const habits = await getHabitsWithLogs(userId, period);
  const rates = computeHabitRates(habits, period);
  const kpis = computeHabitKpis(rates);
  const days = periodDayKeys(period);
  const today = todayKey();
  const rateById = new Map(rates.map((r) => [r.id, r]));

  const summaryTitle =
    period === "week"
      ? "Resumen Semanal"
      : period === "month"
        ? "Resumen Mensual"
        : period === "quarter"
          ? "Resumen Trimestral"
          : "Resumen Semestral";

  const periodSubtitle =
    period === "week" || period === "month"
      ? monthLabel()
      : period === "quarter"
        ? "Últimos 3 meses"
        : "Últimos 6 meses";

  return (
    <>
      {/* Header + toggle */}
      <section className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-outline-variant/30 pb-4 mb-8">
        <div>
          <h2 className="text-headline-lg font-headline-lg text-on-surface mb-1">
            Seguimiento de Hábitos
          </h2>
          <p className="text-body-md text-on-surface-variant capitalize">
            {periodSubtitle}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
          <ViewToggle current={period} />
          <div className="flex items-center gap-3">
            {habits.length > 0 && <RemoveHabitButton habits={habits} />}
            <AddHabitButton variant="primary" />
          </div>
        </div>
      </section>

      {habits.length === 0 ? (
        <div className="glass-panel rounded-2xl py-16 flex flex-col items-center justify-center text-center gap-3 text-on-surface-variant">
          <Icon name="event_repeat" className="text-[40px] opacity-40" />
          <p className="text-body-md">Aún no tienes hábitos.</p>
          <AddHabitButton variant="primary" />
        </div>
      ) : (
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {period === "week" ? (
            <WeeklyTracker
              days={days}
              habits={habits}
              rateById={rateById}
              today={today}
            />
          ) : period === "month" ? (
            <MonthlyTracker
              weeks={monthWeeks().filter((w) => w.some((d) => d !== null))}
              today={today}
              habits={habits.map((h) => {
                const r = rateById.get(h.id);
                return {
                  id: h.id,
                  name: h.name,
                  icon: h.icon,
                  rate: r?.rate ?? 0,
                  completionByDay: r?.completionByDay ?? {},
                };
              })}
            />
          ) : (
            <PeriodTracker
              months={periodMonths(
                period === "quarter"
                  ? PERIOD_MONTHS.quarter
                  : PERIOD_MONTHS.semester,
              )}
              habits={habits.map((h) => {
                const r = rateById.get(h.id);
                return {
                  id: h.id,
                  name: h.name,
                  icon: h.icon,
                  rate: r?.rate ?? 0,
                  completionByDay: r?.completionByDay ?? {},
                };
              })}
            />
          )}

          {/* Panel de resumen */}
          <SummaryPanel title={summaryTitle} kpis={kpis} />
        </section>
      )}
    </>
  );
}

/** Tracker semanal: grilla L-D + tasa (mismo estilo visual que el mensual). */
function WeeklyTracker({
  days,
  habits,
  rateById,
  today,
}: {
  days: string[];
  habits: { id: string; name: string; icon: string }[];
  rateById: Map<string, { rate: number; completionByDay: Record<string, boolean> }>;
  today: string;
}) {
  return (
    <div className="lg:col-span-2 glass-panel rounded-xl overflow-hidden flex flex-col">
      <div className="p-4 border-b border-outline-variant/30 bg-surface-container/50">
        <h3 className="text-headline-md font-headline-md text-on-surface">
          Tracker Semanal
        </h3>
      </div>

      {/* Grilla */}
      <div className="p-3 sm:p-5 overflow-x-auto no-scrollbar">
        <div className="min-w-full">
          {/* Encabezado de días */}
          <div className="grid grid-cols-[minmax(70px,1fr)_repeat(7,26px)_32px] sm:grid-cols-[1fr_repeat(7,36px)_44px] gap-1 sm:gap-3 mb-3 sm:mb-4 px-1 sm:px-2">
            <div className="text-label-caps text-[10px] text-on-surface-variant uppercase">
              Hábito
            </div>
            {days.map((d) => (
              <div
                key={d}
                className={`text-center text-label-caps text-[10px] uppercase ${
                  d === today ? "text-primary font-bold" : "text-on-surface-variant"
                }`}
              >
                {shortWeekdayLabel(d).charAt(0)}
              </div>
            ))}
            <div className="text-center text-label-caps text-[10px] text-on-surface-variant uppercase">
              %
            </div>
          </div>

          {/* Filas de hábitos */}
          <div className="flex flex-col gap-2 sm:gap-3">
            {habits.map((habit) => {
              const rate = rateById.get(habit.id);
              return (
                <div
                  key={habit.id}
                  className="grid grid-cols-[minmax(70px,1fr)_repeat(7,26px)_32px] sm:grid-cols-[1fr_repeat(7,36px)_44px] gap-1 sm:gap-3 items-center p-1.5 sm:p-2 rounded-lg bg-surface-container/40 border border-outline-variant/30 hover:border-outline-variant/60 transition-colors"
                >
                  <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-md sm:rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                      <Icon name={habit.icon} className="text-[12px] sm:text-[16px] text-primary" />
                    </div>
                    <span className="text-[11px] sm:text-body-sm text-on-surface truncate">
                      {habit.name}
                    </span>
                  </div>
                  {days.map((d) => (
                    <div key={d} className="flex justify-center">
                      <HabitCheckbox
                        habitId={habit.id}
                        date={d}
                        initialCompleted={rate?.completionByDay[d] ?? false}
                        label={habit.name}
                        variant="cell"
                      />
                    </div>
                  ))}
                  <div className="flex justify-center">
                    <span className="text-[11px] font-bold text-primary-fixed-dim">
                      {rate?.rate ?? 0}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Tracker de periodo largo (trimestral / semestral): muestra el progreso
 * MES A MES de cada hábito, en solo lectura. Para cada mes calcula el % de
 * días completados de ese hábito dentro de ese mes. Útil para ver tendencia.
 */
function PeriodTracker({
  months,
  habits,
}: {
  months: { key: string; label: string; dayKeys: string[] }[];
  habits: {
    id: string;
    name: string;
    icon: string;
    rate: number;
    completionByDay: Record<string, boolean>;
  }[];
}) {
  /** % de cumplimiento de un hábito en un mes dado. */
  function monthRate(
    h: { completionByDay: Record<string, boolean> },
    dayKeys: string[],
  ): number {
    if (dayKeys.length === 0) return 0;
    const done = dayKeys.filter((d) => h.completionByDay[d]).length;
    return Math.round((done / dayKeys.length) * 100);
  }

  /** Color de la barra según el nivel de cumplimiento. */
  function barColor(rate: number): string {
    if (rate >= 80) return "bg-primary";
    if (rate >= 40) return "bg-tertiary";
    return "bg-error/70";
  }

  return (
    <div className="lg:col-span-2 glass-panel rounded-xl overflow-hidden flex flex-col">
      <div className="p-4 border-b border-outline-variant/30 bg-surface-container/50 flex items-center justify-between">
        <h3 className="text-headline-md font-headline-md text-on-surface">
          Progreso por Mes
        </h3>
        <span className="flex items-center gap-1.5 text-on-surface-variant/70 text-[10px] sm:text-[11px] font-label-caps uppercase">
          <Icon name="lock" className="text-[12px] sm:text-[14px]" />
          Solo lectura
        </span>
      </div>

      <div className="p-3 sm:p-5 overflow-x-auto no-scrollbar">
        <div className="min-w-full flex flex-col gap-2 sm:gap-3">
          {habits.map((h) => (
            <div
              key={h.id}
              className="p-2 sm:p-3 rounded-lg bg-surface-container/40 border border-outline-variant/30"
            >
              {/* Encabezado del hábito */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                    <Icon name={h.icon} className="text-[14px] sm:text-[16px] text-primary" />
                  </div>
                  <span className="text-[13px] sm:text-body-sm text-on-surface truncate">
                    {h.name}
                  </span>
                </div>
                <span className="text-[11px] sm:text-body-sm font-bold text-primary-fixed-dim shrink-0">
                  {h.rate}%
                </span>
              </div>

              {/* Barras por mes */}
              <div className="flex items-end justify-between gap-2">
                {months.map((m) => {
                  const rate = monthRate(h, m.dayKeys);
                  return (
                    <div
                      key={m.key}
                      className="flex-1 flex flex-col items-center gap-1.5"
                    >
                      <div className="w-full h-20 sm:h-24 flex items-end rounded-md bg-surface-container-lowest/60 overflow-hidden">
                        <div
                          className={`w-full ${barColor(rate)} rounded-t-md transition-all`}
                          style={{ height: `${Math.max(4, rate)}%` }}
                          title={`${m.label}: ${rate}%`}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-on-surface-variant">
                        {rate}%
                      </span>
                      <span className="text-[9px] sm:text-[10px] text-on-surface-variant/70 font-label-caps uppercase text-center leading-tight">
                        {m.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Leyenda */}
      <div className="px-3 sm:px-5 py-3 sm:py-4 mt-auto border-t border-outline-variant/30 bg-surface-container/40 flex items-center gap-3 sm:gap-6 flex-wrap">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-primary" />
          <span className="text-[10px] sm:text-[11px] text-on-surface-variant font-label-caps uppercase">
            Consolidado (≥80%)
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-tertiary" />
          <span className="text-[10px] sm:text-[11px] text-on-surface-variant font-label-caps uppercase">
            En progreso (40–79%)
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-error/70" />
          <span className="text-[10px] sm:text-[11px] text-on-surface-variant font-label-caps uppercase">
            En riesgo (&lt;40%)
          </span>
        </div>
      </div>
    </div>
  );
}

/** Panel lateral de resumen con anillo radial + Mejor / Por Mejorar. */
function SummaryPanel({
  title,
  kpis,
}: {
  title: string;
  kpis: ReturnType<typeof computeHabitKpis>;
}) {
  return (
    <div className="lg:col-span-1 glass-panel rounded-xl p-6 flex flex-col relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
      <h3 className="text-headline-md font-headline-md text-on-surface mb-6">
        {title}
      </h3>

      <ProgressRing value={kpis.globalRate} label="Completado" size={180} />

      <div className="flex flex-col gap-4 mt-8">
        <SummaryCard
          label="Mejor Hábito"
          color="bg-primary"
          name={kpis.best?.name ?? "—"}
          rate={kpis.best?.rate ?? 0}
          rateClass="text-primary"
        />
        <SummaryCard
          label="Por Mejorar"
          color="bg-tertiary"
          name={kpis.worst?.name ?? "—"}
          rate={kpis.worst?.rate ?? 0}
          rateClass="text-tertiary"
        />

        {/* Métricas de conjunto: cuántos hábitos van bien vs necesitan atención */}
        <div className="grid grid-cols-2 gap-3">
          <CountCard
            label="Consolidados"
            hint="≥ 80%"
            count={kpis.consistentCount}
            total={kpis.totalHabits}
            icon="verified"
            accent="text-primary"
            barColor="bg-primary"
          />
          <CountCard
            label="En Riesgo"
            hint="< 40%"
            count={kpis.atRiskCount}
            total={kpis.totalHabits}
            icon="warning"
            accent="text-error"
            barColor="bg-error/70"
          />
        </div>
      </div>
    </div>
  );
}

function CountCard({
  label,
  hint,
  count,
  total,
  icon,
  accent,
  barColor,
}: {
  label: string;
  hint: string;
  count: number;
  total: number;
  icon: string;
  accent: string;
  barColor: string;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/30 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Icon name={icon} className={`text-[18px] ${accent}`} />
        <p className="text-[11px] text-on-surface-variant font-label-caps uppercase">
          {label}
        </p>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className={`text-stats-lg font-stats-lg ${accent}`}>{count}</span>
        <span className="text-body-sm text-on-surface-variant">/ {total}</span>
      </div>
      <div className="w-full h-1.5 rounded-full bg-surface-container overflow-hidden">
        <div
          className={`h-full ${barColor} rounded-full transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[10px] text-on-surface-variant/70 font-label-caps uppercase">
        Tasa {hint}
      </span>
    </div>
  );
}

function SummaryCard({
  label,
  color,
  name,
  rate,
  rateClass,
}: {
  label: string;
  color: string;
  name: string;
  rate: number;
  rateClass: string;
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-surface-container-lowest border border-outline-variant/30">
      <div className="flex items-center gap-3">
        <div className={`w-2 h-8 rounded-full ${color}`} />
        <div>
          <p className="text-[10px] text-on-surface-variant font-label-caps uppercase">
            {label}
          </p>
          <p className="text-body-sm font-bold text-on-surface truncate max-w-[120px]">
            {name}
          </p>
        </div>
      </div>
      <span className={`text-headline-md font-bold ${rateClass}`}>{rate}%</span>
    </div>
  );
}

function ViewToggle({ current }: { current: Period }) {
  const options: { view: Period; label: string }[] = [
    { view: "week", label: "Semanal" },
    { view: "month", label: "Mensual" },
    { view: "quarter", label: "Trimestral" },
    { view: "semester", label: "Semestral" },
  ];
  const base =
    "text-center whitespace-nowrap px-3 py-1.5 rounded-md text-label-caps text-[11px] font-label-caps transition-colors";
  return (
    <div className="grid grid-cols-2 sm:flex w-full sm:w-auto bg-surface-container rounded-lg p-1 border border-outline-variant gap-0.5">
      {options.map((o) => (
        <Link
          key={o.view}
          href={`/habitos?view=${o.view}`}
          className={
            current === o.view
              ? `${base} bg-surface-variant text-on-surface shadow-sm`
              : `${base} text-on-surface-variant hover:text-on-surface`
          }
        >
          {o.label}
        </Link>
      ))}
    </div>
  );
}
