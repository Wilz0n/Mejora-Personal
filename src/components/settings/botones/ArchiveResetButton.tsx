"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { archiveAndReset } from "@/app/actions/settings";
import { Modal } from "@/components/comun/ui/Modal";
import { Icon } from "@/components/comun/ui/Icon";

/**
 * Botón "Reiniciar ciclo" (feature del 7º mes).
 *
 * Ejecuta `archiveAndReset`, que borra los datos del dominio y marca
 * `dataResetAt = now()` para reiniciar la antigüedad efectiva. A diferencia de
 * "Purgar Datos", su propósito es continuar usando la app tras exportar.
 *
 * Requisito B1: exige una confirmación EXPLÍCITA de que el usuario ya exportó
 * su progreso (checkbox) antes de habilitar el reinicio, porque técnicamente no
 * podemos saber si la descarga se completó.
 */
export function ArchiveResetButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleReset() {
    setError(null);
    startTransition(async () => {
      const res = await archiveAndReset();
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setOpen(false);
      setConfirmed(false);
      router.refresh();
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="bg-primary hover:opacity-90 text-on-primary font-body-md px-6 py-3 rounded-lg transition-opacity flex items-center gap-2 group"
      >
        <Icon
          name="restart_alt"
          className="group-hover:rotate-180 transition-transform duration-300"
        />
        Reiniciar ciclo
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Reiniciar ciclo de datos"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/10 border border-primary/30">
            <Icon name="info" className="text-primary mt-0.5" />
            <p className="text-body-sm text-on-surface-variant">
              Esto{" "}
              <span className="text-on-surface font-medium">
                borra tus datos actuales
              </span>{" "}
              (hábitos, registros, gastos y proyectos) y empieza un ciclo nuevo,
              rehabilitando todas las opciones. Podrás{" "}
              <span className="text-on-surface font-medium">
                reimportar tu archivo
              </span>{" "}
              exportado más adelante para revisar tus mejoras.
            </p>
          </div>

          <label className="flex items-start gap-3 p-3 rounded-lg bg-surface-container-lowest border border-outline-variant cursor-pointer">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-primary"
            />
            <span className="text-body-sm text-on-surface-variant">
              Confirmo que{" "}
              <span className="text-on-surface font-medium">
                ya descargué mi archivo exportado
              </span>{" "}
              (JSON o CSV) y entiendo que este paso borra los datos actuales.
            </span>
          </label>

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
              type="button"
              onClick={handleReset}
              disabled={isPending || !confirmed}
              className="flex-1 py-2.5 rounded-xl bg-primary text-on-primary font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isPending ? "Reiniciando..." : "Reiniciar ahora"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
