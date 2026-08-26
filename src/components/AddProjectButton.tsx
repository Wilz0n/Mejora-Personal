"use client";

import { useState, useTransition } from "react";
import { createProject } from "@/app/actions/finance";
import { Modal } from "@/components/Modal";
import { Icon } from "@/components/Icon";

export function AddProjectButton() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [allocated, setAllocated] = useState("");
  const [tag, setTag] = useState("General");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function reset() {
    setName("");
    setTarget("");
    setAllocated("");
    setTag("General");
    setError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await createProject({
        name,
        targetAmount: target,
        allocatedAmount: allocated === "" ? 0 : allocated,
        tag,
      });
      if (!res.ok) {
        setError(
          res.fieldErrors?.name?.[0] ??
            res.fieldErrors?.targetAmount?.[0] ??
            res.fieldErrors?.allocatedAmount?.[0] ??
            res.error,
        );
        return;
      }
      reset();
      setOpen(false);
    });
  }

  const inputClass =
    "w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-2.5 text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all";
  const labelClass =
    "block text-label-caps font-label-caps text-on-surface-variant uppercase mb-2";

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-primary text-on-primary font-medium px-4 py-2 rounded-xl hover:bg-primary-fixed-dim transition-colors"
      >
        <Icon name="add" className="text-[20px]" />
        <span>Nuevo Proyecto</span>
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Nuevo Proyecto / Compra"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>Nombre</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              placeholder="Ej. Nueva laptop"
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Costo total</label>
              <input
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                type="number"
                min="0"
                step="0.01"
                placeholder="1500"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Ahorro inicial</label>
              <input
                value={allocated}
                onChange={(e) => setAllocated(e.target.value)}
                type="number"
                min="0"
                step="0.01"
                placeholder="0"
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Etiqueta</label>
            <input
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              placeholder="General"
              className={inputClass}
            />
          </div>

          {error && <p className="text-error text-body-sm">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex-1 py-2.5 rounded-xl border border-outline-variant text-on-surface-variant hover:bg-surface-variant transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 py-2.5 rounded-xl bg-primary text-on-primary font-medium hover:bg-primary-fixed-dim transition-colors disabled:opacity-60"
            >
              {isPending ? "Guardando..." : "Crear"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
