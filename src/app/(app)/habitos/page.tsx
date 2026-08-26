import Link from "next/link";
import { getUserId } from "@/lib/session";
import { getHabitsWithLogs } from "@/lib/data";
import {
  computeHabitRates,
  computeHabitKpis,
  periodDayKeys,
  type Period,
} from "@/lib/habits-logic";
import {
  shortWeekdayLabel,
  todayKey,
  monthLabel,
  monthWeeks,
} from "@/lib/dates";
import { HabitCheckbox } from "@/components/habitos/HabitCheckbox";
import { AddHabitButton } from "@/components/habitos/AddHabitButton";
import { MonthlyTracker } from "@/components/habitos/MonthlyTracker";
import { ProgressRing } from "@/components/comun/ProgressRing";
import { Icon } from "@/components/comun/Icon";

export const dynamic = "force-dynamic";

export default async function HabitsPage({
  searchParams,
}: {
  searchParams: { view?: string };
}) {
  const period: Period = searchParams.view === "month" ? "month" : "week";
  const userId = await getUserId();

  const habits = await getHabitsWithLogs(userId, period);
  const rates = computeHabitRates(habits, period);
  const kpis = computeHabitKpis(rates);
  const days = periodDayKeys(period);
  const today = todayKey();
  const rateById = new Map(rates.map((r) => [r.id, r]));

  return (
    <>
      {/* Header + toggle */}
      <section className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-outline-variant/30 pb-4 mb-8">
        <div>
          <h2 className="text-headline-lg font-headline-lg text-on-surface mb-1">
            Seguimiento de Hábitos
          </h2>
          <p className="text-body-md text-on-surface-variant capitalize">
            {monthLabel()}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ViewToggle current={period} />
          <AddHabitButton variant="primary" />
        </div>
      </section>

      {habits.length === 0 ? (
        <div className="glass-panel rounded-2xl py-16 flex flex-col items-center justify-center text-center gap-3 text-on-surface-variant">
          <Icon name="event_repeat" className="text-[40px] opacity-40" />
          <p className="text-body-md">Aún no tienes hábitos.</p>
          <AddHabitButton variant="primary" />
        </div>
      ) : (
        <section className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {period === "week" ? (
            <WeeklyTracker
              days={days}
              habits={habits}
              rateById={rateById}
              today={today}
            />
          ) : (
            <MonthlyTracker
              weeks={monthWeeks()}
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
          )}

          {/* Panel de resumen (semanal y mensual) */}
          <SummaryPanel
            title={period === "week" ? "Resumen Semanal" : "Resumen Mensual"}
            kpis={kpis}
          />
        </section>
      )}
    </>
  );
}

/** Tracker semanal: tabla L-D + tasa, ocupa 3 columnas del grid. */
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
    <div className="lg:col-span-3 glass-panel rounded-xl overflow-hidden flex flex-col">
      <div className="p-4 border-b border-outline-variant/30 bg-surface-container/50">
        <h3 className="text-headline-md font-headline-md text-on-surface">
          Tracker Semanal
        </h3>
      </div>
      <div className="p-0 overflow-x-auto no-scrollbar">
        <table className="w-full text-left border-collapse min-w-[560px]">
          <thead>
            <tr className="text-label-caps font-label-caps text-on-surface-variant border-b border-outline-variant/50">
              <th className="p-4 font-medium sticky left-0 bg-surface-container-low z-10 w-48">
                Hábito
              </th>
              {days.map((d) => (
                <th
                  key={d}
                  className={`p-4 font-medium text-center ${
                    d === today ? "text-primary" : ""
                  }`}
                >
                  {shortWeekdayLabel(d).charAt(0)}
                </th>
              ))}
              <th className="p-4 font-medium text-right">Tasa</th>
            </tr>
          </thead>
          <tbody className="text-body-sm font-body-sm">
            {habits.map((habit) => {
              const rate = rateById.get(habit.id);
              return (
                <tr
                  key={habit.id}
                  className="border-b border-outline-variant/20 hover:bg-surface-variant/30 transition-colors group"
                >
                  <td className="p-4 sticky left-0 bg-surface-container-low group-hover:bg-surface-variant/30 transition-colors">
                    <div className="flex items-center gap-3 min-w-[140px]">
                      <Icon
                        name={habit.icon}
                        className="text-[18px] text-primary opacity-80"
                      />
                      <span className="text-on-surface truncate">
                        {habit.name}
                      </span>
                    </div>
                  </td>
                  {days.map((d) => (
                    <td key={d} className="p-4 text-center">
                      <div className="flex justify-center">
                        <HabitCheckbox
                          habitId={habit.id}
                          date={d}
                          initialCompleted={rate?.completionByDay[d] ?? false}
                          label={habit.name}
                          variant="cell"
                        />
                      </div>
                    </td>
                  ))}
                  <td className="p-4 text-right font-medium text-primary-fixed-dim">
                    {rate?.rate ?? 0}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
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

      <ProgressRing value={kpis.globalRate} label="Completado" size={160} />

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
      </div>
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
  const base = "px-4 py-1.5 rounded-md text-label-caps font-label-caps transition-colors";
  return (
    <div className="flex bg-surface-container rounded-lg p-1 border border-outline-variant">
      <Link
        href="/habitos?view=week"
        className={
          current === "week"
            ? `${base} bg-surface-variant text-on-surface shadow-sm`
            : `${base} text-on-surface-variant hover:text-on-surface`
        }
      >
        Semanal
      </Link>
      <Link
        href="/habitos?view=month"
        className={
          current === "month"
            ? `${base} bg-surface-variant text-on-surface shadow-sm`
            : `${base} text-on-surface-variant hover:text-on-surface`
        }
      >
        Mensual
      </Link>
    </div>
  );
}
