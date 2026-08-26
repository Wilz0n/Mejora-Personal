import { getUserId } from "@/lib/session";
import { getHabitsForToday, getFinanceData, getHabitsWithLogs, getUserProfile } from "@/lib/data";
import {
  computeHabitRates,
  computeHabitKpis,
  habitsForToday,
} from "@/lib/habits-logic";
import {
  computeFinanceSummary,
  computeProjectsProgress,
  formatCurrency,
} from "@/lib/finance-logic";
import { todayKey, monthLabel } from "@/lib/dates";
import { HabitCheckbox } from "@/components/habitos/HabitCheckbox";
import { AddHabitButton } from "@/components/habitos/AddHabitButton";
import { Icon } from "@/components/comun/Icon";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const userId = await getUserId();
  const today = todayKey();

  const [todayHabits, weekHabits, finance, profile] = await Promise.all([
    getHabitsForToday(userId, today),
    getHabitsWithLogs(userId, "week"),
    getFinanceData(userId),
    getUserProfile(userId),
  ]);

  const todayList = habitsForToday(todayHabits);
  const weekKpis = computeHabitKpis(computeHabitRates(weekHabits, "week"));
  const summary = computeFinanceSummary(finance);
  const projects = computeProjectsProgress(finance.projects);
  const topProject = projects[0];
  const currency = finance.currency;

  // "Ahorro Protegido": 20% del ingreso mensual (feature nueva del diseño,
  // placeholder coherente hasta implementar lógica dedicada).
  const protectedSavings =
    summary.monthlySavings > 0
      ? summary.monthlySavings
      : Math.round(summary.monthlyIncome * 0.2);

  // Balance efectivo: descuenta el ahorro mostrado (guardado o sugerido),
  // coherente con la página de Finanzas.
  const availableBalance =
    summary.monthlyIncome -
    protectedSavings -
    summary.totalFixedExpenses -
    summary.totalAllocated;

  return (
    <>
      <section className="mb-10">
        <h2 className="text-headline-lg font-headline-lg text-on-surface mb-2">
          Hola, {profile.name}.
        </h2>
        <p className="text-body-lg font-body-lg text-on-surface-variant">
          Hoy es un buen día para avanzar.
        </p>
      </section>

      {/* KPI Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard
          label="Progreso de Hábitos"
          icon="trending_up"
          iconClass="text-primary"
          value={`${weekKpis.globalRate}`}
          suffix="%"
          bar={weekKpis.globalRate}
        />
        <KpiCard
          label="Balance Disponible"
          icon="account_balance_wallet"
          iconClass="text-on-surface-variant"
          value={formatCurrency(availableBalance, { currency })}
        />
        <KpiCard
          label="Ahorro Protegido"
          icon="shield"
          iconClass="text-secondary-container"
          value={formatCurrency(protectedSavings, { currency })}
        />
        <KpiCard
          label="Fondo de Proyecto Activo"
          icon="rocket_launch"
          iconClass="text-tertiary-container"
          value={formatCurrency(summary.totalAllocated, { currency })}
        />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hábitos de hoy */}
        <div className="glass-panel rounded-2xl p-6 lg:col-span-1 flex flex-col h-[400px]">
          <div className="flex justify-between items-center mb-6 border-b border-outline-variant/30 pb-4">
            <h3 className="text-headline-md font-headline-md text-on-surface">
              Hábitos de Hoy
            </h3>
            <AddHabitButton variant="ghost" />
          </div>
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 no-scrollbar">
            {todayList.length === 0 ? (
              <EmptyState
                icon="event_repeat"
                text="Aún no tienes hábitos. Crea el primero."
              />
            ) : (
              todayList.map((h) => (
                <HabitCheckbox
                  key={h.id}
                  habitId={h.id}
                  date={today}
                  initialCompleted={h.completedToday}
                  label={h.name}
                  icon={h.icon}
                />
              ))
            )}
          </div>
        </div>

        {/* Distribución financiera */}
        <div className="glass-panel rounded-2xl p-6 lg:col-span-2 flex flex-col h-[400px]">
          <div className="flex justify-between mb-6 border-b border-outline-variant/30 pb-4 items-center">
            <div>
              <h3 className="text-headline-md font-headline-md text-on-surface">
                Distribución Financiera
              </h3>
              <p className="text-sm text-on-surface-variant mt-1 capitalize">
                {monthLabel()}
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-6">
              <Legend color="bg-primary" label="Ingresos" />
              <Legend color="bg-outline" label="Fijos" />
              <Legend color="bg-secondary-container" label="Ahorro" />
            </div>
          </div>
          <FinanceChart
            income={summary.monthlyIncome}
            fixed={summary.totalFixedExpenses}
            savings={summary.totalAllocated}
            available={availableBalance}
          />
          {topProject && (
            <div className="mt-4 pt-4 border-t border-outline-variant/30">
              <div className="flex justify-between text-body-sm mb-2">
                <span className="text-on-surface-variant">
                  Proyecto destacado: {topProject.name}
                </span>
                <span className="text-primary font-medium">
                  {topProject.progress}%
                </span>
              </div>
              <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                <div
                  className="bg-primary h-full rounded-full transition-all"
                  style={{ width: `${topProject.progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

function KpiCard({
  label,
  icon,
  iconClass,
  value,
  suffix,
  bar,
}: {
  label: string;
  icon: string;
  iconClass: string;
  value: string;
  suffix?: string;
  bar?: number;
}) {
  return (
    <div className="glass-panel p-5 rounded-2xl flex flex-col gap-2 relative overflow-hidden">
      <div className="flex justify-between items-start">
        <p className="text-label-caps font-label-caps text-on-surface-variant uppercase">
          {label}
        </p>
        <Icon name={icon} className={`${iconClass} opacity-80`} />
      </div>
      <div className="flex items-baseline gap-1 mt-2">
        <h3 className="text-stats-lg font-stats-lg text-on-surface">
          {value}
          {suffix && <span className="text-headline-md">{suffix}</span>}
        </h3>
      </div>
      {typeof bar === "number" && (
        <div className="w-full bg-surface-container h-1.5 rounded-full mt-auto overflow-hidden">
          <div
            className="bg-primary h-full rounded-full transition-all"
            style={{ width: `${bar}%` }}
          />
        </div>
      )}
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-3 h-3 rounded-full ${color}`} />
      <span className="text-label-caps font-label-caps text-on-surface-variant">
        {label}
      </span>
    </div>
  );
}

function FinanceChart({
  income,
  fixed,
  savings,
  available,
}: {
  income: number;
  fixed: number;
  savings: number;
  available: number;
}) {
  const max = Math.max(income, fixed + savings + Math.max(0, available), 1);
  const pct = (v: number) => `${Math.max(2, Math.round((v / max) * 100))}%`;

  return (
    <div className="flex-1 flex items-end justify-around pb-6 pt-4 relative">
      <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-6">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="border-b border-outline-variant/20 w-full h-0" />
        ))}
      </div>
      <Bar label="Ingresos" segments={[{ cls: "chart-bar-income", h: pct(income) }]} />
      <Bar
        label="Fijos"
        segments={[{ cls: "chart-bar-fixed", h: pct(fixed) }]}
      />
      <Bar
        label="Ahorro"
        segments={[{ cls: "chart-bar-savings", h: pct(savings) }]}
      />
      <Bar
        label="Disponible"
        segments={[{ cls: "bg-tertiary-container", h: pct(Math.max(0, available)) }]}
      />
    </div>
  );
}

function Bar({
  label,
  segments,
}: {
  label: string;
  segments: { cls: string; h: string }[];
}) {
  return (
    <div className="flex flex-col items-center gap-2 z-10 w-full max-w-[60px]">
      <div className="w-full flex items-end gap-1 h-[200px]">
        {segments.map((s, i) => (
          <div
            key={i}
            className={`${s.cls} w-full rounded-t-sm transition-all`}
            style={{ height: s.h }}
          />
        ))}
      </div>
      <span className="text-label-caps font-label-caps text-on-surface-variant text-center">
        {label}
      </span>
    </div>
  );
}

function EmptyState({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center gap-3 text-on-surface-variant">
      <Icon name={icon} className="text-[40px] opacity-40" />
      <p className="text-body-sm max-w-[200px]">{text}</p>
    </div>
  );
}
