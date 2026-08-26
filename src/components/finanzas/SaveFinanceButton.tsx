"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { saveMonthlyFinance } from "@/app/actions/finance";
import { Icon } from "@/components/comun/Icon";

/**
 * Botón "Guardar Finanza".
 *
 * Toma la configuración financiera actual (ingreso, ahorro, gastos fijos y
 * proyectos) y la guarda como un cierre del mes vía `saveMonthlyFinance`.
 * Tras guardar, navega a la vista "Finanzas del Mes" (/finanzas/mes).
 */
export function SaveFinanceButton() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const res = await saveMonthlyFinance();
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.push("/finanzas/mes");
    });
  }

  return (
    <div className="flex flex-col items-start sm:items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-surface-container-high border border-outline-variant text-on-background hover:bg-surface-variant transition-colors text-body-sm font-body-sm whitespace-nowrap disabled:opacity-60"
      >
        <Icon name="save" className="text-[18px]" />
        <span>{isPending ? "Guardando..." : "Guardar Finanza"}</span>
      </button>
      {error && <p className="text-error text-body-sm">{error}</p>}
    </div>
  );
}
