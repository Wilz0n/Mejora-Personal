"use client";

import { useState, useTransition } from "react";
import { deleteProject } from "@/app/actions/finance";
import { Modal } from "@/components/comun/Modal";
import { Icon } from "@/components/comun/Icon";

/**
 * Botón "-" para quitar un proyecto. Se coloca en la esquina superior derecha
 * de cada tarjeta de proyecto. Al pulsarlo abre un modal de confirmación
 * (para evitar borrados accidentales) con un botón de confirmar (check verde)
 * y uno de cancelar (X roja). Reutiliza la Server Action `deleteProject`
 * (borra por id + userId, con aislamiento por usuario).
 */
export function RemoveProjectButton({
  projectId,
  projectName,
}: {
  projectId: string;
  projectName: string;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      const res = await deleteProject(projectId);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setOpen(false);
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label={`Quitar proyecto ${projectName}`}
        title="Quitar proyecto"
        className="w-6 h-6 flex items-center justify-center rounded-md border border-outline-variant/50 text-on-surface-variant hover:border-error/50 hover:text-error hover:bg-error/10 transition-colors"
      >
        <Icon name="remove" className="text-[16px]" />
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Quitar Proyecto"
      >
        <div className="flex flex-col gap-6">
          <p className="text-body-md text-on-surface">
            ¿Seguro que quieres borrar tu proyecto{" "}
            <span className="font-bold">{projectName}</span>?
          </p>

          {error && <p className="text-error text-body-sm">{error}</p>}

          <div className="flex items-center justify-end gap-3">
            {/* Cancelar (X roja) */}
            <button
              onClick={() => setOpen(false)}
              disabled={isPending}
              aria-label="Cancelar"
              className="w-12 h-12 flex items-center justify-center rounded-full border border-error/40 text-error hover:bg-error/10 transition-colors disabled:opacity-50"
            >
              <Icon name="close" className="text-[24px]" />
            </button>
            {/* Confirmar (check verde) */}
            <button
              onClick={handleConfirm}
              disabled={isPending}
              aria-label="Confirmar borrado"
              className="w-12 h-12 flex items-center justify-center rounded-full border border-green-500/40 text-green-500 hover:bg-green-500/10 transition-colors disabled:opacity-50"
            >
              <Icon
                name={isPending ? "hourglass_empty" : "check"}
                className="text-[24px]"
              />
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
