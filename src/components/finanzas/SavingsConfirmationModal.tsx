"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { confirmMonthlySavings } from "@/app/actions/finance";
import { Modal } from "@/components/comun/Modal";
import { Icon } from "@/components/comun/Icon";

/**
 * Modal de confirmación del ahorro mensual.
 *
 * Se muestra al final del mes (o al inicio del mes siguiente) cuando existe un
 * cierre MonthlyFinance con `savingsConfirmed === null` para el mes indicado.
 * La detección vive en la página `/finanzas` (server) vía
 * `pendingSavingsConfirmation`; este componente solo renderiza el diálogo.
 *
 * Acciones:
 *  - Check (✓): confirma que SÍ ahorró → `savingsConfirmed = true`. El ahorro
 *    del mes se mantiene en el "Ahorro Acumulado".
 *  - X (✕): indica que NO ahorró → `savingsConfirmed = false`. El ahorro
 *    efectivo del mes pasa a contar como 0 en el acumulado.
 *
 * Funciona igual en modo multi-usuario y en SINGLE_USER_MODE (la Server Action
 * resuelve la identidad con getUserId()).
 */
export function SavingsConfirmationModal({
  month,
  monthLabel,
  savingsAmount,
}: {
  month: string;
  monthLabel: string;
  savingsAmount?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingChoice, setPendingChoice] = useState<boolean | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleAnswer(confirmed: boolean) {
    setError(null);
    setPendingChoice(confirmed);
    startTransition(async () => {
      const res = await confirmMonthlySavings({ month, confirmed });
      if (!res.ok) {
        setError(res.error);
        setPendingChoice(null);
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Modal
      open={open}
      onClose={() => setOpen(false)}
      title="Confirmación de Ahorro"
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-col items-center text-center gap-3">
          <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Icon name="savings" className="text-primary text-[28px]" filled />
          </div>
          <p className="text-headline-md font-headline-md text-on-surface">
            ¿Pudiste realizar el ahorro? :D
          </p>
          <p className="text-body-sm font-body-sm text-on-surface-variant capitalize">
            {monthLabel}
            {savingsAmount ? (
              <span className="not-italic">
                {" "}
                · <span className="text-primary font-mono">{savingsAmount}</span>
              </span>
            ) : null}
          </p>
        </div>

        {error && (
          <p className="text-error text-body-sm text-center">{error}</p>
        )}

        <div className="flex items-center justify-center gap-6">
          {/* No ahorró (X roja) */}
          <button
            onClick={() => handleAnswer(false)}
            disabled={isPending}
            aria-label="No, no pude ahorrar"
            title="No pude ahorrar"
            className="flex flex-col items-center gap-2 group disabled:opacity-50"
          >
            <span className="w-14 h-14 flex items-center justify-center rounded-full border border-error/40 text-error group-hover:bg-error/10 transition-colors">
              <Icon
                name={
                  isPending && pendingChoice === false
                    ? "hourglass_empty"
                    : "cancel"
                }
                className="text-[28px]"
              />
            </span>
            <span className="text-label-caps font-label-caps text-on-surface-variant uppercase">
              No
            </span>
          </button>

          {/* Sí ahorró (check verde) */}
          <button
            onClick={() => handleAnswer(true)}
            disabled={isPending}
            aria-label="Sí, pude ahorrar"
            title="Sí ahorré"
            className="flex flex-col items-center gap-2 group disabled:opacity-50"
          >
            <span className="w-14 h-14 flex items-center justify-center rounded-full border border-green-500/40 text-green-500 group-hover:bg-green-500/10 transition-colors">
              <Icon
                name={
                  isPending && pendingChoice === true
                    ? "hourglass_empty"
                    : "check_circle"
                }
                className="text-[28px]"
              />
            </span>
            <span className="text-label-caps font-label-caps text-on-surface-variant uppercase">
              Sí
            </span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
