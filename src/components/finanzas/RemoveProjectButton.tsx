"use client";

import { useTransition } from "react";
import { deleteProject } from "@/app/actions/finance";
import { Icon } from "@/components/comun/Icon";

/**
 * Botón "-" para quitar un proyecto. Se coloca en la esquina superior derecha
 * de cada tarjeta de proyecto. Reutiliza la Server Action `deleteProject`
 * (borra por id + userId, con aislamiento por usuario).
 */
export function RemoveProjectButton({
  projectId,
  projectName,
}: {
  projectId: string;
  projectName: string;
}) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      await deleteProject(projectId);
    });
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      aria-label={`Quitar proyecto ${projectName}`}
      title="Quitar proyecto"
      className="w-6 h-6 flex items-center justify-center rounded-md border border-outline-variant/50 text-on-surface-variant hover:border-error/50 hover:text-error hover:bg-error/10 transition-colors disabled:opacity-50"
    >
      <Icon name={isPending ? "hourglass_empty" : "remove"} className="text-[16px]" />
    </button>
  );
}
