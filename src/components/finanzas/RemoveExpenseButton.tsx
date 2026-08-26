"use client";

import { useState, useTransition } from "react";
import { deleteExpense } from "@/app/actions/finance";
import { Modal } from "@/components/comun/Modal";
import { Icon } from "@/components/comun/Icon";
import { formatCurrency } from "@/lib/finance-logic";

interface RemoveExpenseButtonProps {
  expenses: { id: string; category: string; amount: number }[];
  currency: string;
}

/**
 * Botón "Quitar Gasto" (se torna rojo al hover/click). Abre un modal con la
 * lista de gastos fijos registrados para eliminarlos. Reutiliza la Server
 * Action `deleteExpense` (borra por id + userId).
 */
export function RemoveExpenseButton({
  expenses,
  currency,
}: RemoveExpenseButtonProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete(id: string) {
    setError(null);
    setPendingId(id);
    startTransition(async () => {
      const res = await deleteExpense(id);
      setPendingId(null);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      if (expenses.length <= 1) setOpen(false);
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-on-surface-variant hover:text-error text-sm font-medium flex items-center gap-1 transition-colors"
      >
        <Icon name="remove" className="text-[18px]" /> Quitar Gasto
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Quitar Gasto Fijo">
        {expenses.length === 0 ? (
          <div className="py-8 flex flex-col items-center justify-center text-center gap-3 text-on-surface-variant">
            <Icon name="receipt_long" className="text-[40px] opacity-40" />
            <p className="text-body-sm">No tienes gastos fijos para quitar.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-body-sm text-on-surface-variant">
              Selecciona el gasto fijo que quieres eliminar.
            </p>
            <ul className="space-y-2">
              {expenses.map((e) => (
                <li
                  key={e.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-surface-container-lowest border border-outline-variant/40"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-body-md text-on-surface">
                      {e.category}
                    </span>
                    <span className="text-body-sm text-on-surface-variant font-mono">
                      {formatCurrency(e.amount, { currency })}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDelete(e.id)}
                    disabled={isPending}
                    aria-label={`Quitar ${e.category}`}
                    className="flex items-center gap-1 text-error border border-error/40 hover:bg-error/10 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Icon name="delete" className="text-[18px]" />
                    <span className="text-sm">
                      {isPending && pendingId === e.id ? "Quitando..." : "Quitar"}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            {error && <p className="text-error text-body-sm">{error}</p>}
          </div>
        )}
      </Modal>
    </>
  );
}
