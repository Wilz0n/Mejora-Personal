import { getUserId } from "@/lib/session";
import { getFinanceData } from "@/lib/data";
import {
  computeFinanceSummary,
  computeProjectsProgress,
  formatCurrency,
} from "@/lib/finance-logic";
import { AddProjectButton } from "@/components/finanzas/AddProjectButton";
import { RemoveProjectButton } from "@/components/finanzas/RemoveProjectButton";
import {
  AddExpenseButton,
  SetIncomeButton,
} from "@/components/finanzas/FinanceModals";
import { RemoveExpenseButton } from "@/components/finanzas/RemoveExpenseButton";
import { Icon } from "@/components/comun/Icon";

export const dynamic = "force-dynamic";

/** Iconos por categoría de gasto (heurística simple sobre el nombre). */
function expenseIcon(category: string): string {
  const c = category.toLowerCase();
  if (/(alquiler|renta|casa|hogar|vivienda)/.test(c)) return "home";
  if (/(luz|agua|gas|servicio|internet|electric)/.test(c)) return "bolt";
  if (/(super|comida|mercado|despensa|food)/.test(c)) return "shopping_cart";
  if (/(auto|carro|transporte|gasolina)/.test(c)) return "directions_car";
  return "receipt_long";
}

export default async function FinancePage() {
  const userId = await getUserId();
  const finance = await getFinanceData(userId);
  const summary = computeFinanceSummary(finance);
  const projects = computeProjectsProgress(finance.projects);
  const currency = finance.currency;

  // "Ahorro Automático" = 20% del ingreso (feature del diseño nuevo, placeholder).
  const autoSavings = Math.round(summary.monthlyIncome * 0.2);
  // % disponible respecto al ingreso, para la barra del "Balance Restante".
  const availablePct =
    summary.monthlyIncome > 0
      ? Math.max(
          0,
          Math.min(
            100,
            Math.round((summary.availableBalance / summary.monthlyIncome) * 100),
          ),
        )
      : 0;

  return (
    <>
      {/* Header */}
      <section className="mb-stack-lg flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-headline-lg-mobile md:text-headline-lg font-headline-lg text-on-background mb-1">
            Distribución Financiera
          </h2>
          <p className="text-body-md font-body-md text-on-surface-variant">
            Gestiona tus asignaciones mensuales y metas activas.
          </p>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-stack-lg">
        {/* Columna izquierda: ingreso + gastos fijos (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-stack-lg">
          {/* Ingreso mensual */}
          <div className="glass-panel rounded-xl p-stack-md flex flex-col sm:flex-row items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center border border-outline-variant/50 flex-shrink-0">
              <Icon
                name="account_balance_wallet"
                className="text-primary text-2xl"
              />
            </div>
            <div className="flex-1 w-full">
              <p className="block text-label-caps font-label-caps text-on-surface-variant mb-1 uppercase">
                Ingreso Mensual
              </p>
              <div className="flex items-center justify-between gap-3">
                <span className="text-body-lg font-body-lg text-on-background font-mono">
                  {formatCurrency(summary.monthlyIncome, { currency })}
                </span>
                <SetIncomeButton current={summary.monthlyIncome} />
              </div>
            </div>
          </div>

          {/* Gastos fijos */}
          <div className="glass-panel rounded-xl p-stack-md flex flex-col h-full">
            <div className="flex items-center justify-between mb-stack-md pb-stack-sm border-b border-outline-variant/30">
              <h3 className="text-headline-md font-headline-md text-on-background text-lg">
                Gastos Fijos
              </h3>
              <div className="flex items-center gap-3">
                {finance.fixedExpenses.length > 0 && (
                  <RemoveExpenseButton
                    expenses={finance.fixedExpenses}
                    currency={currency}
                  />
                )}
                <AddExpenseButton />
              </div>
            </div>

            {finance.fixedExpenses.length === 0 ? (
              <div className="py-8 flex flex-col items-center justify-center text-center gap-3 text-on-surface-variant">
                <Icon name="receipt_long" className="text-[36px] opacity-40" />
                <p className="text-body-sm">Sin gastos fijos.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {finance.fixedExpenses.map((e) => (
                  <div
                    key={e.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-surface-container-low border border-transparent hover:border-outline-variant transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-md bg-surface-variant/40 flex items-center justify-center text-on-surface-variant group-hover:text-primary transition-colors">
                        <Icon
                          name={expenseIcon(e.category)}
                          className="text-[18px]"
                        />
                      </div>
                      <span className="text-body-md font-body-md text-on-background">
                        {e.category}
                      </span>
                    </div>
                    <div className="text-body-md font-body-md text-on-surface font-mono">
                      {formatCurrency(e.amount, { currency })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Ahorro automático (20%) */}
            <div className="mt-stack-md pt-stack-sm border-t border-outline-variant/30">
              <div className="flex items-center justify-between p-4 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                    <Icon name="savings" className="text-[18px]" />
                  </div>
                  <div>
                    <span className="block text-body-md font-body-md text-on-background font-medium">
                      Ahorro Automático
                    </span>
                    <span className="block text-label-caps font-label-caps text-on-surface-variant">
                      20% del ingreso
                    </span>
                  </div>
                </div>
                <div className="text-body-lg font-body-lg text-primary font-mono font-semibold">
                  {formatCurrency(autoSavings, { currency })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Columna derecha: balance + proyectos (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-stack-lg">
          {/* Balance restante */}
          <div className="bg-surface-container border border-outline-variant rounded-xl p-stack-md shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
              <Icon name="account_balance" className="text-6xl" filled />
            </div>
            <h3 className="text-label-caps font-label-caps text-on-surface-variant uppercase tracking-wider mb-2">
              Balance Restante
            </h3>
            <div
              className={`text-stats-lg font-stats-lg mb-1 font-mono tracking-tight ${
                summary.availableBalance < 0 ? "text-error" : "text-on-background"
              }`}
            >
              {formatCurrency(summary.availableBalance, { currency })}
            </div>
            <p className="text-body-sm font-body-sm text-on-surface-variant mb-6">
              Disponible para proyectos y ocio.
            </p>
            <div className="w-full bg-surface-container-lowest rounded-full h-2 overflow-hidden mb-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${availablePct}%` }}
              />
            </div>
            <div className="flex justify-between text-label-caps font-label-caps text-on-surface-variant">
              <span>{availablePct}% disponible</span>
              <span>{formatCurrency(summary.monthlyIncome, { currency })} total</span>
            </div>
          </div>

          {/* Proyectos activos */}
          <div className="glass-panel rounded-xl p-stack-md flex-1">
            <div className="flex items-center justify-between mb-stack-md pb-stack-sm border-b border-outline-variant/30">
              <h3 className="text-headline-md font-headline-md text-on-background text-lg">
                Proyectos Activos
              </h3>
              <AddProjectButton variant="icon" />
            </div>

            {projects.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center gap-3 text-on-surface-variant">
                <Icon name="account_tree" className="text-[40px] opacity-40" />
                <p className="text-body-sm">Sin proyectos todavía.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {projects.map((p) => (
                  <div
                    key={p.id}
                    className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 group hover:border-outline transition-colors"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="text-body-md font-body-md text-on-background font-bold mb-1">
                          {p.name}
                        </h4>
                        <span className="inline-block px-2 py-0.5 rounded-sm bg-primary/10 text-primary text-label-caps font-label-caps uppercase border border-primary/20">
                          {p.tag}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ProjectRing progress={p.progress} />
                        <RemoveProjectButton
                          projectId={p.id}
                          projectName={p.name}
                        />
                      </div>
                    </div>
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between items-center">
                        <span className="text-label-caps font-label-caps text-on-surface-variant">
                          Asignado:
                        </span>
                        <span className="text-body-md font-body-md text-on-background font-mono font-semibold">
                          {formatCurrency(p.allocatedAmount, { currency })}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-label-caps font-label-caps text-on-surface-variant">
                          Meta:
                        </span>
                        <span className="text-body-md font-body-md text-on-surface-variant font-mono">
                          {formatCurrency(p.targetAmount, { currency })}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 bg-surface-container-low p-2 rounded border border-outline-variant/50">
                      <Icon
                        name="info"
                        className="text-primary text-[16px] mt-0.5"
                      />
                      <p className="text-[11px] leading-tight text-on-surface-variant">
                        Este monto se descuenta del balance sin afectar tus
                        ahorros.
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

/** Anillo circular de progreso pequeño para cada tarjeta de proyecto. */
function ProjectRing({ progress }: { progress: number }) {
  return (
    <div className="w-10 h-10 rounded-full border-[3px] border-surface-container relative flex items-center justify-center">
      <svg
        className="absolute inset-0 w-full h-full -rotate-90 text-primary"
        viewBox="0 0 36 36"
      >
        <path
          className="stroke-current text-surface-container"
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          strokeDasharray="100, 100"
          strokeWidth="3"
        />
        <path
          className="stroke-current text-primary"
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          strokeDasharray={`${progress}, 100`}
          strokeWidth="3"
        />
      </svg>
      <span className="text-[10px] font-mono text-on-background">
        {progress}%
      </span>
    </div>
  );
}
