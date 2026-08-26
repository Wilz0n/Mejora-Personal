"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/components/comun/Modal";

const inputClass =
  "w-full bg-surface-container-lowest border border-outline-variant rounded-md py-2 px-3 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all";
const inputMoneyClass =
  "w-full bg-surface-container-lowest border border-outline-variant rounded-md py-2 pl-8 pr-3 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all font-mono";
const labelClass =
  "block text-label-caps font-label-caps text-on-surface-variant uppercase";

/** Resultado esperado de la acción de guardado (compatible con ActionResult). */
type SubmitResult = {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

interface ProjectModalProps {
  open: boolean;
  onClose: () => void;
  /**
   * Acción de guardado. Recibe los datos del proyecto/compra.
   * `tag` se envía fijo por quien invoca el modal (ver ProjectModal usage).
   */
  onSubmit: (data: {
    name: string;
    targetAmount: string;
    allocatedAmount: string | number;
  }) => Promise<SubmitResult>;
}

/**
 * Modal reutilizable "Nuevo Proyecto / Compra" (diseño Nocturne).
 * Presentación desacoplada de la lógica: recibe `onSubmit` para poder
 * reutilizarlo desde distintos botones/secciones en el futuro.
 */
export function ProjectModal({ open, onClose, onSubmit }: ProjectModalProps) {
  const [name, setName] = useState("");
  const [cost, setCost] = useState("");
  const [deposit, setDeposit] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function reset() {
    setName("");
    setCost("");
    setDeposit("");
    setError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await onSubmit({
        name,
        targetAmount: cost,
        allocatedAmount: deposit === "" ? 0 : deposit,
      });
      if (!res.ok) {
        setError(
          res.fieldErrors?.name?.[0] ??
            res.fieldErrors?.targetAmount?.[0] ??
            res.fieldErrors?.allocatedAmount?.[0] ??
            res.error ??
            "No se pudo guardar",
        );
        return;
      }
      reset();
      onClose();
    });
  }

  return (
    <Modal open={open} onClose={onClose} title="Nuevo Proyecto / Compra">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className={labelClass}>Nombre del Proyecto / Compra</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            placeholder="Ej. Nueva Laptop"
            className={inputClass}
          />
        </div>

        <div className="space-y-1">
          <label className={labelClass}>Precio / Costo Total</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
              $
            </span>
            <input
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              className={inputMoneyClass}
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className={labelClass}>
            Monto a Ahorrar / Depositar Inicialmente
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
              $
            </span>
            <input
              value={deposit}
              onChange={(e) => setDeposit(e.target.value)}
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              className={inputMoneyClass}
            />
          </div>
        </div>

        {error && <p className="text-error text-body-sm">{error}</p>}

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 bg-primary text-on-primary font-bold py-2.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {isPending ? "Guardando..." : "Crear Meta"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 border border-outline-variant text-on-surface-variant font-medium py-2.5 rounded-lg hover:bg-surface-variant transition-colors"
          >
            Cancelar
          </button>
        </div>
      </form>
    </Modal>
  );
}
