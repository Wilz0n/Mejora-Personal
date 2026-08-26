"use client";

import { useState, useTransition } from "react";
import { deleteHabit } from "@/app/actions/habits";
import { Modal } from "@/components/comun/Modal";
import { Icon } from "@/components/comun/Icon";

interface RemoveHabitButtonProps {
  habits: { id: string; name: string; icon: string }[];
}

/**
 * Botón "Quitar Hábito" (rojo). Abre un modal con la lista de hábitos
 * registrados; cada uno se puede eliminar. Reutiliza la Server Action
 * `deleteHabit` (borra por id + userId, con aislamiento por usuario).
 */
export function RemoveHabitButton({ habits }: RemoveHabitButtonProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete(id: string) {
    setError(null);
    setPendingId(id);
    startTransition(async () => {
      const res = await deleteHabit(id);
      setPendingId(null);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      // Si ya no quedan hábitos, cierra el modal.
      if (habits.length <= 1) setOpen(false);
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 border border-error/40 text-error font-medium px-4 py-2 rounded-xl hover:bg-error/10 transition-colors"
      >
        <Icon name="delete" className="text-[20px]" />
        <span>Quitar Hábito</span>
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Quitar Hábito">
        {habits.length === 0 ? (
          <div className="py-8 flex flex-col items-center justify-center text-center gap-3 text-on-surface-variant">
            <Icon name="event_repeat" className="text-[40px] opacity-40" />
            <p className="text-body-sm">No tienes hábitos para quitar.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-body-sm text-on-surface-variant">
              Selecciona el hábito que quieres eliminar. Esta acción borra el
              hábito y todo su historial.
            </p>
            <ul className="space-y-2">
              {habits.map((h) => (
                <li
                  key={h.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-surface-container-lowest border border-outline-variant/40"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center border border-outline-variant">
                      <Icon name={h.icon} className="text-[18px] text-primary" />
                    </div>
                    <span className="text-body-md text-on-surface">{h.name}</span>
                  </div>
                  <button
                    onClick={() => handleDelete(h.id)}
                    disabled={isPending}
                    aria-label={`Quitar ${h.name}`}
                    className="flex items-center gap-1 text-error border border-error/40 hover:bg-error/10 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Icon name="delete" className="text-[18px]" />
                    <span className="text-sm">
                      {isPending && pendingId === h.id ? "Quitando..." : "Quitar"}
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
