import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserId } from "@/lib/session";
import { getMonthlyFinance, getFinanceData, getSavingsHistory } from "@/lib/data";
import { formatCurrency } from "@/lib/finance-logic";
import { SavingsHistory } from "@/components/finanzas/SavingsHistory";
import { Icon } from "@/components/comun/Icon";

export const dynamic = "force-dynamic";

/** Colores rotativos para las barras de categorías/metas (estilo Nocturne). */
const ACCENTS = [
  { bar: "bg-primary", text: "text-primary" },
  { bar: "bg-tertiary", text: "text-tertiary" },
  { bar: "bg-error", text: "text-error" },
  { bar: "bg-secondary", text: "text-secondary" },
] as const;

export default async function MonthlyFinancePage() {
  const userId = await getUserId();
  const [finance, current, savingsHistory] = await Promise.all([
    getMonthlyFinance(userId),
    getFinanceData(userId),
    getSavingsHistory(userId),
  ]);

  // El usuario tiene datos financieros configurados ACTUALMENTE.
  const hasCurrentData =
    current.monthlyIncome > 0 ||
    current.fixedExpenses.length > 0 ||
    current.projects.length > 0;

  // Redirige a la página de edición cuando:
  //  - No hay cierre guardado, o
  //  - El usuario ya no tiene datos configurados (p. ej. tras purgar),
  //    aunque exista un cierre viejo. Así no se muestra info obsoleta.
  if (!finance || !hasCurrentData) {
    redirect("/finanzas");
  }
  const { currency } = finance;
  const savingsPctOfIncome =
    finance.monthlyIncome > 0
      ? Math.round((finance.monthlySavings / finance.monthlyIncome) * 100)
      : 0;

  return (
    <div className="space-y-stack-lg">
      {/* Header */}
      <section className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h2 className="text-headline-lg-mobile md:text-headline-lg font-headline-lg text-on-background mb-1">
            Finanzas del Mes
          </h2>
          <p className="text-body-sm font-body-sm text-on-surface-variant capitalize">
            {finance.monthLabel}
          </p>
        </div>
        <Link
          href="/finanzas"
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-surface-container-high border border-outline-variant text-on-background hover:bg-surface-variant transition-colors text-body-sm font-body-sm whitespace-nowrap"
        >
          <Icon name="edit" className="text-[18px]" />
          Editar Finanza
        </Link>
      </section>

      {/* KPIs */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
        <KpiCard
          icon="arrow_upward"
          iconClass="text-primary"
          glowClass="bg-primary/10 group-hover:bg-primary/20"
          title="Ingreso Total"
          badge="Mensual"
          value={formatCurrency(finance.monthlyIncome, { currency })}
        />
        <KpiCard
          icon="arrow_downward"
          iconClass="text-error"
          glowClass="bg-error/10 group-hover:bg-error/20"
          title="Gasto Fijo Total"
          badge="Mensual"
          value={formatCurrency(finance.totalFixedExpenses, { currency })}
        />
        <KpiCard
          icon="savings"
          iconClass="text-tertiary"
          glowClass="bg-tertiary/10 group-hover:bg-tertiary/20"
          title="Ahorro Neto"
          badge={`${savingsPctOfIncome}% ingreso`}
          value={formatCurrency(finance.monthlySavings, { currency })}
        />
        <KpiCard
          icon="account_balance_wallet"
          iconClass="text-secondary"
          glowClass="bg-secondary/10 group-hover:bg-secondary/20"
          title="Balance Disponible"
          badge="Para proyectos"
          value={formatCurrency(finance.availableBalance, { currency })}
          valueClass={
            finance.availableBalance < 0 ? "text-error" : "text-on-background"
          }
        />
      </section>

      {/* Historial de ahorro acumulado */}
      <SavingsHistory data={savingsHistory} currency={currency} />

      {/* Bento grid: Metas activas + Categorías de gastos */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
        {/* Metas activas */}
        <div className="lg:col-span-2 glass-panel rounded-xl p-6 flex flex-col min-h-[400px]">
          <div className="flex justify-between items-center mb-6 border-b border-outline-variant pb-4">
            <h3 className="text-headline-md font-headline-md font-semibold text-on-surface">
              Metas Activas
            </h3>
            <span className="px-3 py-1 bg-surface-container rounded-md text-body-sm text-on-surface-variant">
              {finance.projectsSnapshot.length}{" "}
              {finance.projectsSnapshot.length === 1 ? "proyecto" : "proyectos"}
            </span>
          </div>

          {finance.projectsSnapshot.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 text-on-surface-variant">
              <Icon name="account_tree" className="text-[40px] opacity-40" />
              <p className="text-body-sm">Sin metas activas este mes.</p>
            </div>
          ) : (
            <div className="flex-1 space-y-4">
              {finance.projectsSnapshot.map((p, i) => {
                const accent = ACCENTS[i % ACCENTS.length];
                return (
                  <div
                    key={`${p.name}-${i}`}
                    className="bg-surface-container-lowest border border-outline-variant/50 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="text-body-md font-body-md text-on-background font-bold mb-1">
                          {p.name}
                        </h4>
                        <span
                          className={`inline-block px-2 py-0.5 rounded-sm bg-primary/10 ${accent.text} text-label-caps font-label-caps uppercase border border-primary/20`}
                        >
                          {p.tag}
                        </span>
                      </div>
                      <span className={`text-headline-md font-bold ${accent.text}`}>
                        {p.progress}%
                      </span>
                    </div>
                    <div className="w-full bg-surface-container-lowest rounded-full h-2 overflow-hidden mb-3 border border-outline-variant/30">
                      <div
                        className={`${accent.bar} h-2 rounded-full transition-all`}
                        style={{ width: `${p.progress}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-label-caps font-label-caps text-on-surface-variant font-mono">
                      <span>
                        Asignado: {formatCurrency(p.allocatedAmount, { currency })}
                      </span>
                      <span>
                        Meta: {formatCurrency(p.targetAmount, { currency })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Categorías de gastos (estilo Resumen Semanal) */}
        <div className="glass-panel rounded-xl p-6 flex flex-col min-h-[400px]">
          <h3 className="text-headline-md font-headline-md font-semibold text-on-surface mb-6 border-b border-outline-variant pb-4">
            Categorías de Gastos
          </h3>
          <div className="flex-1 flex flex-col justify-center items-center pt-2">
            {/* Anillo estilo ProgressRing */}
            <div
              className="relative flex items-center justify-center mx-auto mb-6 sm:mb-8"
              style={{ width: "min(200px, 60vw)", height: "min(200px, 60vw)" }}
            >
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  className="text-surface-container-high"
                  cx="50"
                  cy="50"
                  r="44"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                />
                <circle
                  className="text-primary"
                  cx="50"
                  cy="50"
                  r="44"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 44}
                  strokeDashoffset={0}
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center px-2">
                <span className="text-xl sm:text-2xl font-bold text-on-background leading-tight">
                  {formatCurrency(finance.totalFixedExpenses, { currency })}
                </span>
                <span className="text-[10px] sm:text-label-caps font-label-caps text-on-surface-variant mt-1 uppercase">
                  Total Gastos
                </span>
              </div>
            </div>

            {finance.expensesByCategory.length === 0 ? (
              <p className="text-body-sm text-on-surface-variant text-center">
                Sin gastos fijos registrados este mes.
              </p>
            ) : (
              <div className="w-full flex flex-col gap-4">
                {finance.expensesByCategory.map((c, i) => {
                  const accent = ACCENTS[i % ACCENTS.length];
                  // Cruzar con el estado live de paidThisMonth
                  const liveExpense = current.fixedExpenses.find(
                    (e) => e.category.toLowerCase() === c.category.toLowerCase()
                  );
                  const isPaid = liveExpense?.paidThisMonth ?? false;

                  return (
                    <div
                      key={`${c.category}-${i}`}
                      className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                        isPaid
                          ? "bg-green-500/10 border border-green-500/40"
                          : "bg-surface-container-lowest border border-outline-variant/30"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {isPaid ? (
                          <div className="w-2 h-8 rounded-full bg-green-500" />
                        ) : (
                          <div className={`w-2 h-8 rounded-full ${accent.bar}`} />
                        )}
                        <div>
                          <p className={`text-[10px] font-label-caps uppercase ${
                            isPaid ? "text-green-400" : "text-on-surface-variant"
                          }`}>
                            {c.category}
                          </p>
                          <p className={`text-body-sm font-bold font-mono ${
                            isPaid ? "text-green-300 line-through opacity-80" : "text-on-surface"
                          }`}>
                            {formatCurrency(c.amount, { currency })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-headline-md font-bold ${
                          isPaid ? "text-green-400" : accent.text
                        }`}>
                          {c.percent}%
                        </span>
                        {isPaid && (
                          <Icon name="check_circle" className="text-green-400 text-[18px]" filled />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function KpiCard({
  icon,
  iconClass,
  glowClass,
  title,
  badge,
  value,
  valueClass = "text-on-background",
}: {
  icon: string;
  iconClass: string;
  glowClass: string;
  title: string;
  badge: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="glass-panel rounded-xl p-6 relative overflow-hidden group">
      <div
        className={`absolute -right-4 -top-4 w-24 h-24 rounded-full blur-2xl transition-all ${glowClass}`}
      />
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-2">
          <Icon name={icon} className={iconClass} />
          <h3 className="text-label-caps font-label-caps text-on-surface-variant tracking-wider">
            {title}
          </h3>
        </div>
        <span className="px-2 py-1 bg-surface-container rounded text-[10px] text-on-surface-variant whitespace-nowrap">
          {badge}
        </span>
      </div>
      <p className={`text-stats-lg font-stats-lg font-mono ${valueClass}`}>
        {value}
      </p>
    </div>
  );
}
