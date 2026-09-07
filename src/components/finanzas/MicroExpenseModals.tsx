"use client";

import { useState, useTransition } from "react";
import { createMicroExpense, deleteMicroExpense } from "@/app/actions/finance";
import { Modal } from "@/components/comun/Modal";
import { Icon } from "@/components/comun/Icon";

const inputClass =
  "w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-2.5 text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all";
const labelClass =
  "block text-label-caps font-label-caps text-on-surface-variant uppercase mb-2";

/** Iconos disponibles para etiquetar gastos hormiga (antojos, café, etc.). */
const MICRO_EXPENSE_ICONS = [
  "local_cafe",
  "cookie",
  "fastfood",
  "local_bar",
  "shopping_bag",
  "directions_car",
  "icecream",
  "lunch_dining",
  "local_pizza",
  "cake",
  "sports_esports",
  "smoking_rooms",
  "local_taxi",
  "confirmation_number",
  "redeem",
  "storefront",
];

/**
 * Botón + modal para registrar un nuevo gasto hormiga.
 * Incluye concepto/categoría, monto y un selector visual de íconos.
 */
export function AddMicroExpenseButton() {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [icon, setIcon] = useState("local_cafe");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await createMicroExpense({ category, amount, icon });
      if (!res.ok) {
        setError(
          res.fieldErrors?.category?.[0] ??
            res.fieldErrors?.amount?.[0] ??
            res.error,
        );
        return;
      }
      setCategory("");
      setAmount("");
      setIcon("local_cafe");
      setOpen(false);
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-sm border border-outline-variant text-on-surface-variant px-3 py-2 rounded-xl hover:bg-surface-variant transition-colors"
      >
        <Icon name="add" className="text-[18px]" />
        <span>Gasto hormiga</span>
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Nuevo Gasto Hormiga"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>Concepto</label>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              autoFocus
              placeholder="Ej. Café, Antojos, Taxi"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Monto</label>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              type="number"
              min="0"
              step="0.01"
              placeholder="5"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Ícono</label>
            <div className="grid grid-cols-8 gap-2 max-h-[120px] overflow-y-auto no-scrollbar pr-1">
              {MICRO_EXPENSE_ICONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setIcon(opt)}
                  className={`aspect-square rounded-lg flex items-center justify-center border transition-all ${
                    icon === opt
                      ? "bg-primary/20 border-primary text-primary"
                      : "bg-surface-container-lowest border-outline-variant text-on-surface-variant hover:border-primary/50"
                  }`}
                >
                  <Icon name={opt} className="text-[18px]" />
                </button>
              ))}
            </div>
          </div>
          {error && <p className="text-error text-body-sm">{error}</p>}
          <button
            type="submit"
            disabled={isPending}
            className="w-full py-2.5 rounded-xl bg-primary text-on-primary font-medium hover:bg-primary-fixed-dim transition-colors disabled:opacity-60"
          >
            {isPending ? "Guardando..." : "Añadir gasto hormiga"}
          </button>
        </form>
      </Modal>
    </>
  );
}

interface MicroExpenseItemProps {
  id: string;
  category: string;
  amount: string; // Ya formateado con currency
  icon: string;
}

/**
 * Item individual de un gasto hormiga con ícono, concepto, monto y un botón
 * discreto de eliminación (mutación optimista vía deleteMicroExpense).
 */
export function MicroExpenseItem({
  id,
  category,
  amount,
  icon,
}: MicroExpenseItemProps) {
  const [removed, setRemoved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      // Mutación optimista
      setRemoved(true);
      const res = await deleteMicroExpense(id);
      if (!res.ok) setRemoved(false);
    });
  }

  if (removed) return null;

  return (
    <div
      className={`flex items-center justify-between p-3 rounded-lg border border-transparent bg-surface-container-low hover:border-outline-variant transition-all group ${
        isPending ? "opacity-60" : ""
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-md flex items-center justify-center bg-secondary/15 text-secondary flex-shrink-0">
          <Icon name={icon} className="text-[18px]" />
        </div>
        <span className="text-body-md font-body-md text-on-background truncate">
          {category}
        </span>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-body-md font-body-md font-mono text-on-surface">
          {amount}
        </span>
        <button
          onClick={handleDelete}
          disabled={isPending}
          aria-label={`Eliminar ${category}`}
          className="w-7 h-7 rounded-md flex items-center justify-center text-on-surface-variant/60 hover:text-error hover:bg-error/10 transition-colors disabled:opacity-50"
        >
          <Icon name="close" className="text-[16px]" />
        </button>
      </div>
    </div>
  );
}
