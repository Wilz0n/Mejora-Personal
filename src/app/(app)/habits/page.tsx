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
  dayOfMonth,
  todayKey,
  monthLabel,
} from "@/lib/dates";
import { HabitCheckbox } from "@/components/HabitCheckbox";
import { AddHabitButton } from "@/components/AddHabitButton";
import { Icon } from "@/components/Icon";

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
      <section className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-headline-lg font-headline-lg text-on-surface mb-1">
            Seguimiento de Hábitos
          </h2>
          <p className="text-body-md text-on-surface-variant capitalize">
            {period === "week" ? "Vista semanal" : `Vista mensual · ${monthLabel()}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ViewToggle current={period} />
          {period === "week" && <AddHabitButton variant="primary" />}
        </div>
      </section>

      {/* KPIs */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="glass-panel p-5 rounded-2xl flex flex-col gap-2">
          <p className="text-label-caps font-label-caps text-on-surface-variant uppercase">
            Tasa Global
          </p>
          <h3 className="text-stats-lg font-stats-lg text-on-surface">
            {kpis.globalRate}
            <span className="text-headline-md">%</span>
          </h3>
          <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden mt-1">
            <div
              className="bg-primary h-full rounded-full"
              style={{ width: `${kpis.globalRate}%` }}
            />
          </div>
        </div>
        <KpiHabit
          label="Mejor Hábito"
          icon="emoji_events"
          iconClass="text-tertiary"
          habit={kpis.best}
        />
        <KpiHabit
          label="Por Mejorar"
          icon="trending_down"
          iconClass="text-error"
          habit={kpis.worst}
        />
      </section>

      {/* Grid de hábitos */}
      <section className="glass-panel rounded-2xl p-4 sm:p-6 overflow-x-auto no-scrollbar">
        {habits.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-center gap-3 text-on-surface-variant">
            <Icon name="event_repeat" className="text-[40px] opacity-40" />
            <p className="text-body-md">Aún no tienes hábitos.</p>
            {period === "week" && <AddHabitButton variant="primary" />}
          </div>
        ) : (
          <table className="w-full border-collapse min-w-[560px]">
            <thead>
              <tr>
                <th className="text-left text-label-caps font-label-caps text-on-surface-variant uppercase pb-4 pr-4 sticky left-0 bg-transparent">
                  Hábito
                </th>
                {days.map((d) => (
                  <th
                    key={d}
                    className={`text-center pb-4 px-1 ${
                      d === today ? "text-primary" : "text-on-surface-variant"
                    }`}
                  >
                    <div className="text-label-caps font-label-caps uppercase">
                      {period === "week" ? shortWeekdayLabel(d) : dayOfMonth(d)}
                    </div>
                  </th>
                ))}
                <th className="text-center text-label-caps font-label-caps text-on-surface-variant uppercase pb-4 pl-3">
                  %
                </th>
              </tr>
            </thead>
            <tbody>
              {habits.map((habit) => {
                const rate = rateById.get(habit.id);
                return (
                  <tr
                    key={habit.id}
                    className="border-t border-outline-variant/20"
                  >
                    <td className="py-3 pr-4 sticky left-0 bg-background/60 backdrop-blur-sm">
                      <div className="flex items-center gap-2 min-w-[140px]">
                        <Icon
                          name={habit.icon}
                          className="text-[18px] text-primary opacity-80"
                        />
                        <span className="text-body-md text-on-surface truncate">
                          {habit.name}
                        </span>
                      </div>
                    </td>
                    {days.map((d) => (
                      <td key={d} className="py-2 px-1 text-center">
                        <div className="flex justify-center">
                          <HabitCheckbox
                            habitId={habit.id}
                            date={d}
                            initialCompleted={
                              rate?.completionByDay[d] ?? false
                            }
                            label={habit.name}
                            variant="cell"
                          />
                        </div>
                      </td>
                    ))}
                    <td className="py-2 pl-3 text-center">
                      <span className="text-body-md font-medium text-on-surface">
                        {rate?.rate ?? 0}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}

function ViewToggle({ current }: { current: Period }) {
  const base =
    "px-4 py-1.5 rounded-lg text-sm font-medium transition-colors";
  return (
    <div className="flex items-center gap-1 bg-surface-container-low rounded-xl p-1 border border-outline-variant">
      <Link
        href="/habits?view=week"
        className={
          current === "week"
            ? `${base} bg-primary text-on-primary`
            : `${base} text-on-surface-variant hover:text-on-surface`
        }
      >
        Semanal
      </Link>
      <Link
        href="/habits?view=month"
        className={
          current === "month"
            ? `${base} bg-primary text-on-primary`
            : `${base} text-on-surface-variant hover:text-on-surface`
        }
      >
        Mensual
      </Link>
    </div>
  );
}

function KpiHabit({
  label,
  icon,
  iconClass,
  habit,
}: {
  label: string;
  icon: string;
  iconClass: string;
  habit: { name: string; rate: number } | null;
}) {
  return (
    <div className="glass-panel p-5 rounded-2xl flex flex-col gap-2">
      <div className="flex justify-between items-start">
        <p className="text-label-caps font-label-caps text-on-surface-variant uppercase">
          {label}
        </p>
        <Icon name={icon} className={`${iconClass} opacity-80`} />
      </div>
      {habit ? (
        <>
          <h3 className="text-headline-md font-headline-md text-on-surface truncate">
            {habit.name}
          </h3>
          <p className="text-body-sm text-on-surface-variant">
            {habit.rate}% de cumplimiento
          </p>
        </>
      ) : (
        <p className="text-body-sm text-on-surface-variant mt-2">
          Sin datos aún
        </p>
      )}
    </div>
  );
}
