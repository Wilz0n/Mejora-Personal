import { Icon } from "@/components/comun/Icon";
import { formatCurrency } from "@/lib/finance-logic";
import type { SavingsHistoryData } from "@/lib/data";

interface SavingsHistoryProps {
  data: SavingsHistoryData;
  currency: string;
  /** Si true, muestra una versión más compacta (para la vista de edición). */
  compact?: boolean;
}

/** Formatea una fecha ISO a texto legible corto. */
function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("es", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Último día del mes actual (fecha límite para editar el ahorro). */
function lastDayOfCurrentMonth(): string {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return lastDay.toLocaleDateString("es", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Días restantes en el mes actual. */
function daysLeftInMonth(): number {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return lastDay - now.getDate();
}

/**
 * Mini-gráfico del historial de ahorro mes a mes + total acumulado.
 * Renderiza barras proporcionales por cada mes guardado, con el total
 * destacado arriba. Si no hay historial, muestra una nota invitando a guardar.
 *
 * Preparado para extenderse a "Nivel 2" (aportes individuales): la interfaz
 * SavingsHistoryData es compatible con ambas fuentes de datos.
 */
export function SavingsHistory({ data, currency, compact = false }: SavingsHistoryProps) {
  const { history, totalAccumulated } = data;

  // Sin historial: nota motivacional.
  if (history.length === 0) {
    return (
      <div className="glass-panel rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-3 text-on-surface-variant">
        <Icon name="savings" className="text-[24px] opacity-50 shrink-0" />
        <div>
          <p className="text-body-sm">
            Aún no tienes historial de ahorro. Guarda tu primera finanza para
            empezar a ver cómo crece tu ahorro mes a mes.
          </p>
          <p className="text-[11px] text-on-surface-variant/60 mt-1">
            💡 Solo se registra un valor por mes. Puedes editarlo hasta fin de mes.
          </p>
        </div>
      </div>
    );
  }

  const maxSavings = Math.max(...history.map((h) => h.savings), 1);
  const lastEntry = history[history.length - 1];

  return (
    <div className={`glass-panel rounded-xl ${compact ? "p-4" : "p-4 sm:p-6"}`}>
      {/* Header con total acumulado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-outline-variant/30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
            <Icon name="trending_up" className="text-primary text-lg sm:text-xl" />
          </div>
          <div>
            <p className="text-[10px] sm:text-label-caps font-label-caps text-on-surface-variant uppercase">
              Ahorro Acumulado
            </p>
            <p className="text-body-lg sm:text-headline-md font-headline-md text-primary font-mono">
              {formatCurrency(totalAccumulated, { currency })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 sm:gap-4 text-on-surface-variant/60">
          <div className="flex items-center gap-1">
            <Icon name="calendar_month" className="text-[14px] sm:text-[16px]" />
            <span className="text-[10px] sm:text-[11px] font-label-caps">
              {history.length} {history.length === 1 ? "mes" : "meses"}
            </span>
          </div>
          {/* Última actualización */}
          <div className="flex items-center gap-1">
            <Icon name="update" className="text-[14px] sm:text-[16px]" />
            <span className="text-[10px] sm:text-[11px] font-label-caps">
              {formatDate(lastEntry.updatedAt)}
            </span>
          </div>
        </div>
      </div>

      {/* Mini-gráfico de barras */}
      <div className={`flex items-end gap-1 sm:gap-2 ${compact ? "h-[70px] sm:h-[80px]" : "h-[90px] sm:h-[120px]"}`}>
        {history.map((h) => {
          const pct = Math.max(6, Math.round((h.savings / maxSavings) * 100));
          return (
            <div
              key={h.month}
              className="flex-1 flex flex-col items-center gap-1 h-full justify-end min-w-0"
            >
              <div
                className="w-full bg-primary/80 rounded-t-md transition-all hover:bg-primary group relative"
                style={{ height: `${pct}%` }}
                title={`${h.monthLabel}: ${formatCurrency(h.savings, { currency })}`}
              >
                {/* Tooltip on hover (desktop) */}
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-surface-container px-2 py-1 rounded text-[10px] text-on-surface whitespace-nowrap pointer-events-none z-10">
                  {formatCurrency(h.savings, { currency })}
                </div>
              </div>
              <span className="text-[8px] sm:text-[10px] text-on-surface-variant/70 font-label-caps text-center leading-tight truncate w-full">
                {h.monthLabel.split(" ")[0]}
              </span>
            </div>
          );
        })}
      </div>

      {/* Resumen + nota informativa debajo del gráfico */}
      {!compact && (
        <div className="mt-4 pt-3 border-t border-outline-variant/30 space-y-3">
          {history.length >= 2 && (
            <div className="flex items-center justify-between text-body-sm">
              <span className="text-on-surface-variant">
                Promedio mensual
              </span>
              <span className="text-on-surface font-mono font-medium">
                {formatCurrency(totalAccumulated / history.length, { currency })}
              </span>
            </div>
          )}
          {/* Fecha límite de edición */}
          <div className="flex items-start gap-2 p-2.5 sm:p-3 rounded-lg bg-primary/5 border border-primary/20">
            <Icon name="schedule" className="text-[16px] text-primary mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] sm:text-body-sm text-on-surface leading-snug">
                Puedes editar el ahorro de este mes hasta el{" "}
                <span className="font-bold text-primary">{lastDayOfCurrentMonth()}</span>
              </p>
              <p className="text-[10px] sm:text-[11px] text-on-surface-variant mt-0.5">
                {daysLeftInMonth() === 0
                  ? "Hoy es el último día para editar."
                  : `${daysLeftInMonth()} día${daysLeftInMonth() > 1 ? "s" : ""} restante${daysLeftInMonth() > 1 ? "s" : ""} para editar.`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-[5px] text-on-surface-variant/60">
            <Icon name="info" className="text-[14px] shrink-0" />
            <p className="text-[10px] sm:text-[11px] leading-relaxed">
              Se registra un valor por mes (el último guardado). Al terminar el
              mes, ese ahorro queda fijo en tu historial.
            </p>
          </div>
        </div>
      )}

      {/* Nota compacta para la vista de edición */}
      {compact && (
        <div className="mt-3 pt-[5px] space-y-1.5">
          <div className="flex items-center gap-1.5 p-2 rounded-md bg-primary/5 border border-primary/15">
            <Icon name="schedule" className="text-[12px] text-primary shrink-0" />
            <p className="text-[10px] sm:text-[11px] text-on-surface leading-snug">
              Editable hasta el <span className="font-bold text-primary">{lastDayOfCurrentMonth()}</span>
              {" · "}{daysLeftInMonth()} día{daysLeftInMonth() > 1 ? "s" : ""} restante{daysLeftInMonth() > 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-on-surface-variant/50">
            <Icon name="info" className="text-[11px] shrink-0" />
            <p className="text-[9px] sm:text-[10px] leading-relaxed">
              Un registro por mes · Último: {formatDate(lastEntry.updatedAt)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
