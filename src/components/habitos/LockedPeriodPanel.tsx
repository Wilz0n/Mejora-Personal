import { Icon } from "@/components/comun/ui/Icon";

/**
 * Panel informativo (solo lectura) que se muestra en lugar del tracker cuando
 * el usuario intenta acceder a una vista de hábitos (trimestral / semestral)
 * sin cumplir la antigüedad requerida.
 *
 * Muestra un mensaje motivador y un indicador visual de la antigüedad actual
 * (en meses) frente a la requerida para desbloquear la vista.
 *
 * Diseño coherente con el design system "Nocturne" (glass-panel + tokens M3).
 */
export function LockedPeriodPanel({
  periodLabel,
  currentMonths,
  requiredMonths,
}: {
  /** Nombre de la vista bloqueada, ej. "Trimestral". */
  periodLabel: string;
  /** Meses de antigüedad acumulada del usuario. */
  currentMonths: number;
  /** Meses de antigüedad requeridos para desbloquear. */
  requiredMonths: number;
}) {
  const clampedCurrent = Math.min(currentMonths, requiredMonths);
  const pct = requiredMonths > 0
    ? Math.min(100, Math.round((clampedCurrent / requiredMonths) * 100))
    : 0;
  const remaining = Math.max(0, requiredMonths - currentMonths);

  return (
    <div className="lg:col-span-2 glass-panel rounded-xl overflow-hidden flex flex-col relative">
      {/* Halo decorativo sutil */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-3xl -mr-12 -mt-12 pointer-events-none" />

      <div className="p-4 border-b border-outline-variant/30 bg-surface-container/50 flex items-center justify-between">
        <h3 className="text-headline-md font-headline-md text-on-surface">
          Vista {periodLabel} bloqueada
        </h3>
        <span className="flex items-center gap-1.5 text-on-surface-variant/70 text-[10px] sm:text-[11px] font-label-caps uppercase">
          <Icon name="lock" className="text-[12px] sm:text-[14px]" />
          Bloqueado
        </span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center gap-6 px-6 py-12 sm:py-16">
        {/* Icono principal */}
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Icon
            name="hourglass_empty"
            className="text-[32px] sm:text-[40px] text-primary"
          />
        </div>

        {/* Mensaje */}
        <div className="max-w-md flex flex-col gap-2">
          <p className="text-body-lg font-bold text-on-surface">
            Aún no tienes suficiente historial registrado
          </p>
          <p className="text-body-md text-on-surface-variant leading-relaxed">
            Por falta de antigüedad todavía no podemos mostrarte esta vista.
            Sigue esforzándote y marcando tus mejoras cada día para generar
            historial y habilitar estas funciones.
          </p>
        </div>

        {/* Indicador de antigüedad: actual vs requerida */}
        <div className="w-full max-w-sm flex flex-col gap-3">
          <div className="flex items-baseline justify-between">
            <span className="text-[11px] text-on-surface-variant font-label-caps uppercase">
              Tu antigüedad
            </span>
            <span className="text-body-sm text-on-surface">
              <span className="font-bold text-primary">{currentMonths}</span>
              <span className="text-on-surface-variant">
                {" "}
                / {requiredMonths} {requiredMonths === 1 ? "mes" : "meses"}
              </span>
            </span>
          </div>

          {/* Barra de progreso de antigüedad */}
          <div className="w-full h-2.5 rounded-full bg-surface-container overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>

          <p className="text-[11px] text-on-surface-variant/70">
            {remaining > 0
              ? `Te ${remaining === 1 ? "falta" : "faltan"} ${remaining} ${
                  remaining === 1 ? "mes" : "meses"
                } para desbloquear esta vista.`
              : "¡Ya casi! Sigue registrando tu progreso."}
          </p>
        </div>
      </div>
    </div>
  );
}
