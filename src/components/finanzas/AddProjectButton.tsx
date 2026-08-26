"use client";

import { useState } from "react";
import { createProject } from "@/app/actions/finance";
import { ProjectModal } from "@/components/comun/ProjectModal";
import { Icon } from "@/components/comun/Icon";

/** Etiqueta con la que se guardan los proyectos creados desde Finanzas. */
const FINANCE_TAG = "Finanzas";

export function AddProjectButton({
  variant = "primary",
}: {
  variant?: "primary" | "icon";
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {variant === "icon" ? (
        <button
          onClick={() => setOpen(true)}
          aria-label="Nuevo proyecto"
          className="w-8 h-8 flex items-center justify-center rounded-md border border-primary/30 text-primary hover:bg-primary/10 transition-colors"
        >
          <Icon name="add" className="text-lg" />
        </button>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 bg-primary text-on-primary font-medium px-4 py-2 rounded-xl hover:bg-primary-fixed-dim transition-colors"
        >
          <Icon name="add" className="text-[20px]" />
          <span>Nuevo Proyecto</span>
        </button>
      )}

      <ProjectModal
        open={open}
        onClose={() => setOpen(false)}
        onSubmit={({ name, targetAmount, allocatedAmount }) =>
          createProject({
            name,
            targetAmount,
            allocatedAmount,
            tag: FINANCE_TAG,
          })
        }
      />
    </>
  );
}
