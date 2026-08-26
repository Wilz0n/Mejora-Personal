"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { purgeAccountData } from "@/app/actions/settings";
import { Modal } from "@/components/comun/Modal";
import { Icon } from "@/components/comun/Icon";

const CONFIRM_WORD = "ELIMINAR";

/**
 * Botón "Purgar datos de cuenta". Acción destructiva e irreversible:
 * exige escribir una palabra de confirmación antes de ejecutar.
 */
export function PurgeDataButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handlePurge() {
    setError(null);
    startTransition(async () => {
      const res = await purgeAccountData();
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setOpen(false);
      setConfirm("");
      router.refresh();
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="bg-transparent hover:bg-error-container/10 border border-transparent hover:border-error-container text-error font-body-md px-4 py-3 rounded-lg transition-colors flex items-center gap-2"
      >
        <Icon name="delete_forever" />
        Purgar Datos de Cuenta
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Purgar Datos de Cuenta"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-error-container/10 border border-error/30">
            <Icon name="warning" className="text-error mt-0.5" />
            <p className="text-body-sm text-on-surface-variant">
              Esta acción borra{" "}
              <span className="text-on-surface font-medium">
                de forma permanente
              </span>{" "}
              tus hábitos, registros, gastos fijos y proyectos. No se puede
              deshacer.
            </p>
          </div>
          <div>
            <label className="block text-label-caps font-label-caps text-on-surface-variant uppercase mb-2">
              Escribe <span className="text-error">{CONFIRM_WORD}</span> para
              confirmar
            </label>
            <input
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoFocus
              placeholder={CONFIRM_WORD}
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-2.5 text-on-surface focus:border-error focus:ring-2 focus:ring-error/20 outline-none transition-all"
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
              type="button"
              onClick={handlePurge}
              disabled={isPending || confirm !== CONFIRM_WORD}
              className="flex-1 py-2.5 rounded-xl bg-error text-on-error font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isPending ? "Borrando..." : "Borrar todo"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
