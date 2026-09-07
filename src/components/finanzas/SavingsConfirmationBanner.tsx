"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateMonthlySavings } from "@/app/actions/finance";
import { UpdateSavingsModal } from "@/components/finanzas/modales/UpdateSavingsModal";
import { Icon } from "@/components/comun/ui/Icon";

/**
 * Banner sutil y cerrable de confirmación de ahorro (modelo híbrido).
 *
 * Reemplaza al antiguo `SavingsConfirmationModal` invasivo. Se muestra en la
 * parte superior de /finanzas y /finanzas/mes cuando existe un mes con
 * `savingsConfirmed === null` (detectado en el server vía
 * `pendingSavingsConfirmation`). No bloquea la navegación.
 *
 * Acciones:
 *  - Sí (check): `updateMonthlySavings({ confirmed: true })` conservando el monto.
 *  - Ajustar (+): abre `UpdateSavingsModal` para sumar/fijar un monto distinto.
 *  - No ahorré (✕): `updateMonthlySavings({ confirmed: false })` → cuenta como 0.
 *  - Descartar (X): oculta el banner durante la sesión sin alterar el registro.
 */
export function SavingsConfirmationBanner({
  month,
  monthLabel,
  savingsAmount,
  currency,
}: {
  month: string;
  monthLabel: string;
  /** Monto pactado del mes (para mostrar en el mensaje). */
  savingsAmount: number;
  currency: string;
}) {
  const router = useRouter();
  const [dismissed, setDismissed] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingChoice, setPendingChoice] = useState<boolean | null>(null);
  const [isPending, startTransition] = useTransition();

  const formattedAmount = new Intl.NumberFormat(
    currency === "PEN" ? "es-PE" : "en-US",
    { style: "currency", currency, minimumFractionDigits: 2 },
  ).format(savingsAmount);

  function answer(confirmed: boolean) {
    setError(null);
    setPendingChoice(confirmed);
    startTransition(async () => {
      const res = await updateMonthlySavings({ month, confirmed });
      if (!res.ok) {
        setError(res.error);
        setPendingChoice(null);
        return;
      }
      router.refresh();
    });
  }

  if (dismissed) return null;

  return (
    <>
      <div
        className="glass-panel rounded-xl border border-primary/25 bg-primary/5 p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3"
        role="status"
      >
        {/* Mensaje */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center shrink-0">
            <Icon name="savings" className="text-primary text-[20px]" filled />
          </div>
          <div className="min-w-0">
            <p className="text-body-sm sm:text-body-md text-on-surface leading-snug">
              ¿Cómo te fue con tu ahorro de{" "}
              <span className="capitalize font-medium">{monthLabel}</span>?
            </p>
            <p className="text-[11px] sm:text-body-sm text-on-surface-variant">
              Pactado:{" "}
              <span className="text-primary font-mono">{formattedAmount}</span>
            </p>
            {error && (
              <p className="text-error text-[11px] mt-1">{error}</p>
            )}
          </div>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          {/* Sí ahorré */}
          <button
            type="button"
            onClick={() => answer(true)}
            disabled={isPending}
            title="Sí, ahorré lo pactado"
            aria-label="Sí, ahorré lo pactado"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-green-500/40 text-green-400 hover:bg-green-500/10 transition-colors text-body-sm disabled:opacity-50"
          >
            <Icon
              name={
                isPending && pendingChoice === true
                  ? "hourglass_empty"
                  : "check_circle"
              }
              className="text-[18px]"
            />
            <span className="hidden sm:inline">Sí</span>
          </button>

          {/* Ajustar / +Ahorro */}
          <button
            type="button"
            onClick={() => setAdjustOpen(true)}
            disabled={isPending}
            title="Ajustar el monto ahorrado"
            aria-label="Ajustar el monto ahorrado"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-primary/40 text-primary hover:bg-primary/10 transition-colors text-body-sm disabled:opacity-50"
          >
            <Icon name="tune" className="text-[18px]" />
            <span className="hidden sm:inline">Ajustar</span>
          </button>

          {/* No ahorré */}
          <button
            type="button"
            onClick={() => answer(false)}
            disabled={isPending}
            title="No ahorré este mes (cuenta como 0)"
            aria-label="No ahorré este mes"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-error/40 text-error hover:bg-error/10 transition-colors text-body-sm disabled:opacity-50"
          >
            <Icon
              name={
                isPending && pendingChoice === false
                  ? "hourglass_empty"
                  : "cancel"
              }
              className="text-[18px]"
            />
            <span className="hidden sm:inline">No ahorré</span>
          </button>

          {/* Descartar (solo oculta durante la sesión) */}
          <button
            type="button"
            onClick={() => setDismissed(true)}
            disabled={isPending}
            title="Descartar por ahora"
            aria-label="Descartar por ahora"
            className="w-9 h-9 flex items-center justify-center rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-variant transition-colors disabled:opacity-50"
          >
            <Icon name="close" className="text-[18px]" />
          </button>
        </div>
      </div>

      {/* Modal de ajuste reutilizando el flujo del modelo híbrido */}
      <UpdateSavingsModal
        open={adjustOpen}
        onClose={() => setAdjustOpen(false)}
        month={month}
        monthLabel={monthLabel}
        currency={currency}
        currentAmount={savingsAmount}
        onSaved={() => setDismissed(true)}
      />
    </>
  );
}
