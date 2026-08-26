"use client";

import { useTransition } from "react";
import { contributeToProject } from "@/app/actions/finance";
import { Icon } from "@/components/comun/Icon";

/**
 * Botón verde "+" que abona el monto mensual fijo del proyecto en cada clic.
 * Se deshabilita cuando el proyecto ya está cumplido (100%).
 */
export function ContributeButton({
  projectId,
  projectName,
  completed,
}: {
  projectId: string;
  projectName: string;
  completed: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  function handleContribute() {
    startTransition(async () => {
      await contributeToProject(projectId);
    });
  }

  if (completed) {
    return (
      <span className="flex items-center gap-1 text-[11px] font-label-caps uppercase text-green-400 border border-green-500/30 bg-green-500/10 px-2 py-1 rounded-md">
        <Icon name="check_circle" className="text-[16px]" filled />
        Cumplido
      </span>
    );
  }

  return (
    <button
      onClick={handleContribute}
      disabled={isPending}
      aria-label={`Abonar a ${projectName}`}
      title="Registrar abono mensual"
      className="w-8 h-8 flex items-center justify-center rounded-md border border-green-500/40 text-green-400 hover:bg-green-500/15 transition-colors disabled:opacity-50"
    >
      <Icon name={isPending ? "hourglass_empty" : "add"} className="text-lg" />
    </button>
  );
}
