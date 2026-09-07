"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateMonthlySavings } from "@/app/actions/finance";
import { formatCurrency } from "@/lib/logic/finance-logic";
import { Modal } from "@/components/comun/ui/Modal";
import { Icon } from "@/components/comun/ui/Icon";

const inputClass =
  "w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-2.5 text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all";
const labelClass =
  "block text-label-caps font-label-caps text-on-surface-variant uppercase mb-2";

/**
 * Modal ligero para **aportar más** al ahorro del mes (modelo híbrido).
 *
 * Controlado por el padre vía `open` / `onClose`, de modo que puede abrirse
 * tanto desde el botón "Aportar más" de la tarjeta de ahorro como desde el
 * banner de confirmación.
 *
 * Solo suma al ahorro actual (`mode: "add"`). Para **reemplazar** la cifra total
 * se usa el modal "Editar ahorro" (`SetSavingsButton`), evitando duplicar la
 * misma acción. Guardar marca el mes como confirmado.
 */
export function UpdateSavingsModal({
  open,
  onClose,
  month,
  monthLabel,
  currency,
  currentAmount,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  month: string;
  monthLabel?: string;
  currency: string;
  /** Ahorro actual del mes (para mostrar contexto y previsualizar el resultado). */
  currentAmount: number;
  /** Callback tras guardar con éxito (p. ej. cerrar el banner). */
  onSaved?: () => void;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const parsedAmount = Number(amount);
  const validAmount =
    amount !== "" && !Number.isNaN(parsedAmount) && parsedAmount > 0;
  const preview = validAmount ? currentAmount + parsedAmount : currentAmount;

  function reset() {
    setAmount("");
    setError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!validAmount) {
      setError("Ingresa un monto mayor a 0.");
      return;
    }
    startTransition(async () => {
      const res = await updateMonthlySavings({
        month,
        confirmed: true,
        newAmount: parsedAmount,
        mode: "add",
      });
      if (!res.ok) {
        setError(res.fieldErrors?.newAmount?.[0] ?? res.error);
        return;
      }
      reset();
      onClose();
      onSaved?.();
      router.refresh();
    });
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title="Aportar más al ahorro"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <Icon name="savings" className="text-primary text-[22px]" filled />
          </div>
          <div className="min-w-0">
            <p className="text-body-md font-body-md text-on-surface">
              ¿Generaste un ahorro más este mes? :D
            </p>
            {monthLabel && (
              <p className="text-body-sm text-on-surface-variant capitalize mt-0.5">
                {monthLabel} · actual{" "}
                <span className="text-primary font-mono">
                  {formatCurrency(currentAmount, { currency })}
                </span>
              </p>
            )}
          </div>
        </div>

        {/* Campo numérico: monto a sumar */}
        <div>
          <label className={labelClass} htmlFor="savings-amount">
            Monto a sumar
          </label>
          <input
            id="savings-amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            autoFocus
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            placeholder="0.00"
            className={inputClass}
          />
        </div>

        {/* Previsualización del resultado */}
        {validAmount && (
          <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-primary/5 border border-primary/20">
            <span className="text-body-sm text-on-surface-variant">
              Ahorro del mes quedará en
            </span>
            <span className="text-body-md font-mono font-semibold text-primary">
              {formatCurrency(preview, { currency })}
            </span>
          </div>
        )}

        {error && <p className="text-error text-body-sm">{error}</p>}

        <button
          type="submit"
          disabled={isPending}
          className="w-full py-2.5 rounded-xl bg-primary text-on-primary font-medium hover:bg-primary-fixed-dim transition-colors disabled:opacity-60"
        >
          {isPending ? "Guardando..." : "Sumar al ahorro"}
        </button>
      </form>
    </Modal>
  );
}

/**
 * Botón discreto "Aportar más" + su modal. Pensado para la tarjeta de Ahorro
 * Mensual en /finanzas. Gestiona su propio estado de apertura.
 *
 * Para **editar/reemplazar** la cifra total se usa el modal "Editar ahorro"
 * (`SetSavingsButton`) de la misma tarjeta; ambos escriben el mismo ahorro.
 */
export function AdjustSavingsButton({
  month,
  monthLabel,
  currency,
  currentAmount,
}: {
  month: string;
  monthLabel?: string;
  currency: string;
  currentAmount: number;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-[11px] sm:text-body-sm text-primary hover:underline"
      >
        <Icon name="add_circle" className="text-[16px]" />
        Aportar más
      </button>
      <UpdateSavingsModal
        open={open}
        onClose={() => setOpen(false)}
        month={month}
        monthLabel={monthLabel}
        currency={currency}
        currentAmount={currentAmount}
      />
    </>
  );
}
