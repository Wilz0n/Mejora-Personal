"use client";

import { useState, useTransition } from "react";
import { createExpense, setMonthlyIncome } from "@/app/actions/finance";
import { Modal } from "@/components/comun/Modal";
import { Icon } from "@/components/comun/Icon";

const inputClass =
  "w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-2.5 text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all";
const labelClass =
  "block text-label-caps font-label-caps text-on-surface-variant uppercase mb-2";

export function AddExpenseButton() {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await createExpense({ category, amount });
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
        <span>Gasto fijo</span>
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Nuevo Gasto Fijo">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>Categoría</label>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              autoFocus
              placeholder="Ej. Renta"
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
              placeholder="500"
              className={inputClass}
            />
          </div>
          {error && <p className="text-error text-body-sm">{error}</p>}
          <button
            type="submit"
            disabled={isPending}
            className="w-full py-2.5 rounded-xl bg-primary text-on-primary font-medium hover:bg-primary-fixed-dim transition-colors disabled:opacity-60"
          >
            {isPending ? "Guardando..." : "Añadir gasto"}
          </button>
        </form>
      </Modal>
    </>
  );
}

export function SetIncomeButton({ current }: { current: number }) {
  const [open, setOpen] = useState(false);
  const [income, setIncome] = useState(String(current || ""));
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await setMonthlyIncome({ monthlyIncome: income });
      if (!res.ok) {
        setError(res.fieldErrors?.monthlyIncome?.[0] ?? res.error);
        return;
      }
      setOpen(false);
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-sm border border-outline-variant text-on-surface-variant px-3 py-2 rounded-xl hover:bg-surface-variant transition-colors"
      >
        <Icon name="edit" className="text-[18px]" />
        <span>Ingreso mensual</span>
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Ingreso Mensual"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>Ingreso mensual</label>
            <input
              value={income}
              onChange={(e) => setIncome(e.target.value)}
              autoFocus
              type="number"
              min="0"
              step="0.01"
              placeholder="3000"
              className={inputClass}
            />
          </div>
          {error && <p className="text-error text-body-sm">{error}</p>}
          <button
            type="submit"
            disabled={isPending}
            className="w-full py-2.5 rounded-xl bg-primary text-on-primary font-medium hover:bg-primary-fixed-dim transition-colors disabled:opacity-60"
          >
            {isPending ? "Guardando..." : "Guardar"}
          </button>
        </form>
      </Modal>
    </>
  );
}
