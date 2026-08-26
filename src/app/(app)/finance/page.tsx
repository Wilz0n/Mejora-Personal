import { getUserId } from "@/lib/session";
import { getFinanceData } from "@/lib/data";
import {
  computeFinanceSummary,
  computeProjectsProgress,
  formatCurrency,
} from "@/lib/finance-logic";
import { AddProjectButton } from "@/components/AddProjectButton";
import { AddExpenseButton, SetIncomeButton } from "@/components/FinanceModals";
import { Icon } from "@/components/Icon";

export const dynamic = "force-dynamic";

export default async function FinancePage() {
  const userId = await getUserId();
  const finance = await getFinanceData(userId);
  const summary = computeFinanceSummary(finance);
  const projects = computeProjectsProgress(finance.projects);

  return (
    <>
      <section className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-headline-lg font-headline-lg text-on-surface mb-1">
            Finanzas y Proyectos
          </h2>
          <p className="text-body-md text-on-surface-variant">
            Controla tu balance y tus metas de ahorro.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <SetIncomeButton current={summary.monthlyIncome} />
          <AddExpenseButton />
          <AddProjectButton />
        </div>
      </section>

      {/* Balance summary */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <SummaryCard
          label="Ingreso Mensual"
          value={formatCurrency(summary.monthlyIncome)}
          icon="payments"
          iconClass="text-primary"
        />
        <SummaryCard
          label="Gastos Fijos"
          value={formatCurrency(summary.totalFixedExpenses)}
          icon="receipt_long"
          iconClass="text-outline"
        />
        <SummaryCard
          label="Asignado a Proyectos"
          value={formatCurrency(summary.totalAllocated)}
          icon="savings"
          iconClass="text-secondary-container"
        />
        <SummaryCard
          label="Balance Disponible"
          value={formatCurrency(summary.availableBalance)}
          icon="account_balance_wallet"
          iconClass={
            summary.availableBalance < 0 ? "text-error" : "text-tertiary-container"
          }
          highlight
        />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Proyectos */}
        <section className="lg:col-span-2 glass-panel rounded-2xl p-6">
          <h3 className="text-headline-md font-headline-md text-on-surface mb-5">
            Proyectos Activos
          </h3>
          {projects.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center gap-3 text-on-surface-variant">
              <Icon name="account_tree" className="text-[40px] opacity-40" />
              <p className="text-body-md">Sin proyectos todavía.</p>
              <AddProjectButton />
            </div>
          ) : (
            <div className="space-y-4">
              {projects.map((p) => (
                <div
                  key={p.id}
                  className="p-4 rounded-xl bg-surface-container/50 border border-outline-variant/40"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-body-lg text-on-surface font-medium">
                          {p.name}
                        </h4>
                        <span className="text-label-caps font-label-caps uppercase px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                          {p.tag}
                        </span>
                      </div>
                      <p className="text-body-sm text-on-surface-variant mt-1">
                        {formatCurrency(p.allocatedAmount)} de{" "}
                        {formatCurrency(p.targetAmount)}
                      </p>
                    </div>
                    <span className="text-headline-md font-headline-md text-primary">
                      {p.progress}%
                    </span>
                  </div>
                  <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-primary h-full rounded-full transition-all"
                      style={{ width: `${p.progress}%` }}
                    />
                  </div>
                  <p className="text-body-sm text-on-surface-variant mt-2">
                    Faltan {formatCurrency(p.remaining)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Gastos fijos */}
        <section className="glass-panel rounded-2xl p-6">
          <h3 className="text-headline-md font-headline-md text-on-surface mb-5">
            Gastos Fijos
          </h3>
          {finance.fixedExpenses.length === 0 ? (
            <div className="py-8 flex flex-col items-center justify-center text-center gap-3 text-on-surface-variant">
              <Icon name="receipt_long" className="text-[36px] opacity-40" />
              <p className="text-body-sm">Sin gastos fijos.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {finance.fixedExpenses.map((e) => (
                <li
                  key={e.id}
                  className="flex justify-between items-center py-2 border-b border-outline-variant/20 last:border-0"
                >
                  <span className="text-body-md text-on-surface">
                    {e.category}
                  </span>
                  <span className="text-body-md text-on-surface-variant font-medium">
                    {formatCurrency(e.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  iconClass,
  highlight,
}: {
  label: string;
  value: string;
  icon: string;
  iconClass: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`glass-panel p-5 rounded-2xl flex flex-col gap-2 ${
        highlight ? "ring-1 ring-primary/30" : ""
      }`}
    >
      <div className="flex justify-between items-start">
        <p className="text-label-caps font-label-caps text-on-surface-variant uppercase">
          {label}
        </p>
        <Icon name={icon} className={`${iconClass} opacity-80`} />
      </div>
      <h3 className="text-headline-md font-headline-md text-on-surface mt-1">
        {value}
      </h3>
    </div>
  );
}
