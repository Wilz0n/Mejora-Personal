import Link from "next/link";
import { getUserId } from "@/lib/db/session";
import { getFinanceHistory } from "@/lib/db/data";
import {
  formatCurrency,
  groupFinanceHistory,
  effectiveMonthlySavings,
  type FinanceHistoryPeriod,
  type FinanceHistoryGroup,
} from "@/lib/logic/finance-logic";
import { Icon } from "@/components/comun/ui/Icon";

export const dynamic = "force-dynamic";

/** Mapea el query param `?view=` al periodo de agrupación del historial. */
function resolvePeriod(view?: string): FinanceHistoryPeriod {
  switch (view) {
    case "quarterly":
      return "quarterly";
    case "semiannual":
      return "semiannual";
    default:
      return "monthly";
  }
}

export default async function FinanceHistoryPage({
  searchParams,
}: {
  searchParams: { view?: string };
}) {
  const userId = await getUserId();
  const period = resolvePeriod(searchParams.view);

  const { entries, currency } = await getFinanceHistory(userId);
  const groups = groupFinanceHistory(entries, period);

  // Totales globales (todo el historial) para la fila de KPIs.
  const totalMonths = entries.length;
  const totalSavings = entries.reduce(
    (a, e) => a + effectiveMonthlySavings(e),
    0,
  );
  const totalIncome = entries.reduce((a, e) => a + e.monthlyIncome, 0);
  const avgSavings =
    totalMonths > 0 ? Math.round((totalSavings / totalMonths) * 100) / 100 : 0;

  const periodSubtitle =
    period === "monthly"
      ? "Registro mes a mes"
      : period === "quarterly"
        ? "Agrupado por trimestres (3 meses)"
        : "Agrupado por semestres (6 meses)";

  return (
    <div className="space-y-stack-lg">
      {/* Header + toggle */}
      <section className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-outline-variant/30 pb-4">
        <div>
          <h2 className="text-headline-lg-mobile md:text-headline-lg font-headline-lg text-on-background mb-1">
            Historial Financiero
          </h2>
          <p className="text-body-md font-body-md text-on-surface-variant">
            {periodSubtitle}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
          <ViewToggle current={period} />
          <Link
            href="/finanzas/mes"
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-surface-container-high border border-outline-variant text-on-background hover:bg-surface-variant transition-colors text-body-sm font-body-sm whitespace-nowrap"
          >
            <Icon name="arrow_back" className="text-[18px]" />
            Volver
          </Link>
        </div>
      </section>

      {totalMonths === 0 ? (
        <div className="glass-panel rounded-2xl py-16 flex flex-col items-center justify-center text-center gap-3 text-on-surface-variant">
          <Icon name="history" className="text-[40px] opacity-40" />
          <p className="text-body-md">Aún no tienes historial financiero.</p>
          <p className="text-body-sm max-w-md">
            Cada mes se guarda un registro de tu cierre. Guarda tu primera
            finanza para empezar a construir tu historial.
          </p>
          <Link
            href="/finanzas"
            className="mt-2 flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 transition-colors text-body-sm"
          >
            <Icon name="edit" className="text-[18px]" />
            Ir a Finanzas
          </Link>
        </div>
      ) : (
        <>
          {/* KPIs globales */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-gutter">
            <KpiCard
              icon="calendar_month"
              iconClass="text-primary"
              glowClass="bg-primary/10 group-hover:bg-primary/20"
              title="Meses Registrados"
              value={String(totalMonths)}
            />
            <KpiCard
              icon="savings"
              iconClass="text-tertiary"
              glowClass="bg-tertiary/10 group-hover:bg-tertiary/20"
              title="Ahorro Acumulado"
              value={formatCurrency(totalSavings, { currency })}
            />
            <KpiCard
              icon="trending_up"
              iconClass="text-secondary"
              glowClass="bg-secondary/10 group-hover:bg-secondary/20"
              title="Ahorro Promedio"
              value={formatCurrency(avgSavings, { currency })}
            />
            <KpiCard
              icon="arrow_upward"
              iconClass="text-primary"
              glowClass="bg-primary/10 group-hover:bg-primary/20"
              title="Ingreso Total"
              value={formatCurrency(totalIncome, { currency })}
            />
          </section>

          {/* Grupos (mes a mes, o trimestres/semestres) */}
          <section className="space-y-gutter">
            {[...groups].reverse().map((g) => (
              <HistoryGroupCard
                key={g.key}
                group={g}
                currency={currency}
                grouped={period !== "monthly"}
              />
            ))}
          </section>
        </>
      )}
    </div>
  );
}

/** Tarjeta de un grupo del historial (un mes o un rango). */
function HistoryGroupCard({
  group,
  currency,
  grouped,
}: {
  group: FinanceHistoryGroup;
  currency: string;
  grouped: boolean;
}) {
  return (
    <div className="glass-panel rounded-xl p-5 sm:p-6">
      {/* Cabecera del grupo */}
      <div className="flex items-center justify-between gap-3 mb-4 pb-4 border-b border-outline-variant/30">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20 flex-shrink-0">
            <Icon name="event" className="text-primary text-xl" />
          </div>
          <div className="min-w-0">
            <h3 className="text-headline-md font-headline-md text-on-background capitalize truncate">
              {group.label}
            </h3>
            {grouped && (
              <p className="text-[11px] font-label-caps text-on-surface-variant uppercase">
                {group.months.length}{" "}
                {group.months.length === 1 ? "mes" : "meses"}
              </p>
            )}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-[10px] font-label-caps text-on-surface-variant uppercase">
            Ahorro
          </p>
          <p className="text-body-lg font-body-lg text-primary font-mono font-semibold">
            {formatCurrency(group.totalSavings, { currency })}
          </p>
        </div>
      </div>

      {/* Métricas del grupo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-1">
        <Metric label="Ingreso" value={formatCurrency(group.totalIncome, { currency })} />
        <Metric label="Gastos Fijos" value={formatCurrency(group.totalFixedExpenses, { currency })} tone="error" />
        <Metric label="Gastos Hormiga" value={formatCurrency(group.totalMicroExpenses, { currency })} tone="secondary" />
        <Metric label="Balance" value={formatCurrency(group.totalAvailable, { currency })} tone={group.totalAvailable < 0 ? "error" : "default"} />
      </div>

      {/* Detalle mes a mes dentro del grupo (solo en trimestral/semestral) */}
      {grouped && group.months.length > 1 && (
        <div className="mt-4 pt-4 border-t border-outline-variant/30 space-y-2">
          <p className="text-[10px] font-label-caps text-on-surface-variant uppercase mb-2">
            Desglose mensual
          </p>
          {group.months.map((m) => {
            const eff = effectiveMonthlySavings(m);
            const notSaved = m.savingsConfirmed === false;
            return (
              <div
                key={m.month}
                className="flex items-center justify-between gap-3 p-3 rounded-lg bg-surface-container-lowest border border-outline-variant/30"
              >
                <span className="text-body-sm font-body-sm text-on-background capitalize truncate">
                  {m.monthLabel}
                </span>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <span className="text-[11px] font-label-caps text-on-surface-variant hidden sm:inline">
                    Ingreso: {formatCurrency(m.monthlyIncome, { currency })}
                  </span>
                  <span
                    className={`text-body-sm font-mono font-semibold ${
                      notSaved ? "text-on-surface-variant line-through opacity-70" : "text-primary"
                    }`}
                  >
                    {formatCurrency(eff, { currency })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Metric({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "error" | "secondary";
}) {
  const valueClass =
    tone === "error"
      ? "text-error"
      : tone === "secondary"
        ? "text-secondary"
        : "text-on-background";
  return (
    <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-lg p-3">
      <p className="text-[10px] font-label-caps text-on-surface-variant uppercase mb-1">
        {label}
      </p>
      <p className={`text-body-sm sm:text-body-md font-mono font-semibold ${valueClass}`}>
        {value}
      </p>
    </div>
  );
}

function KpiCard({
  icon,
  iconClass,
  glowClass,
  title,
  value,
}: {
  icon: string;
  iconClass: string;
  glowClass: string;
  title: string;
  value: string;
}) {
  return (
    <div className="glass-panel rounded-xl p-4 sm:p-6 relative overflow-hidden group">
      <div
        className={`absolute -right-4 -top-4 w-24 h-24 rounded-full blur-2xl transition-all ${glowClass}`}
      />
      <div className="flex items-center gap-2 mb-3">
        <Icon name={icon} className={iconClass} />
        <h3 className="text-[10px] sm:text-label-caps font-label-caps text-on-surface-variant tracking-wider">
          {title}
        </h3>
      </div>
      <p className="text-body-lg sm:text-stats-lg font-stats-lg font-mono text-on-background">
        {value}
      </p>
    </div>
  );
}

function ViewToggle({ current }: { current: FinanceHistoryPeriod }) {
  const options: { view: FinanceHistoryPeriod; label: string }[] = [
    { view: "monthly", label: "Mensual" },
    { view: "quarterly", label: "Trimestral" },
    { view: "semiannual", label: "Semestral" },
  ];
  const base =
    "text-center whitespace-nowrap px-3 py-2.5 sm:py-1.5 rounded-md font-label-caps text-[13px] sm:text-[11px] transition-colors";
  return (
    <div className="grid grid-cols-3 sm:flex w-full sm:w-auto bg-surface-container rounded-lg p-1.5 sm:p-1 border border-outline-variant gap-1 sm:gap-0.5">
      {options.map((o) => (
        <Link
          key={o.view}
          href={`/finanzas/historial?view=${o.view}`}
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
