"use client";

import { useState, useTransition } from "react";
import { createHabit } from "@/app/actions/habits";
import { Modal } from "@/components/Modal";
import { Icon } from "@/components/Icon";

const ICON_OPTIONS = [
  "self_improvement",
  "menu_book",
  "fitness_center",
  "water_drop",
  "bedtime",
  "directions_run",
  "restaurant",
  "code",
  "brush",
  "check_circle",
];

interface AddHabitButtonProps {
  variant?: "primary" | "ghost";
}

export function AddHabitButton({ variant = "ghost" }: AddHabitButtonProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("check_circle");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function reset() {
    setName("");
    setIcon("check_circle");
    setError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await createHabit({ name, icon });
      if (!res.ok) {
        setError(res.fieldErrors?.name?.[0] ?? res.error);
        return;
      }
      reset();
      setOpen(false);
    });
  }

  return (
    <>
      {variant === "primary" ? (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 bg-primary text-on-primary font-medium px-4 py-2 rounded-xl hover:bg-primary-fixed-dim transition-colors"
        >
          <Icon name="add" className="text-[20px]" />
          <span>Añadir Hábito</span>
        </button>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1 text-primary text-sm font-medium hover:bg-primary/10 px-2 py-1 rounded-md transition-colors"
        >
          <Icon name="add" className="text-[18px]" />
          <span>Añadir</span>
        </button>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Nuevo Hábito">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-label-caps font-label-caps text-on-surface-variant uppercase mb-2">
              Nombre
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              placeholder="Ej. Meditar 10 min"
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-2.5 text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-label-caps font-label-caps text-on-surface-variant uppercase mb-2">
              Ícono
            </label>
            <div className="grid grid-cols-5 gap-2">
              {ICON_OPTIONS.map((opt) => (
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
                  <Icon name={opt} />
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-error text-body-sm">{error}</p>
          )}

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
