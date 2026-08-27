"use client";

import { useState, useTransition, useRef, useCallback } from "react";
import { toggleExpensePaid } from "@/app/actions/finance";
import { Icon } from "@/components/comun/Icon";

interface FixedExpenseItemProps {
  id: string;
  category: string;
  amount: string; // Ya formateado con currency
  icon: string;
  paidThisMonth: boolean;
}

/**
 * Item de gasto fijo con soporte de doble click (desktop) y doble tap (móvil)
 * para marcar como "pagado este mes". Cuando está pagado, muestra un fondo verde.
 */
export function FixedExpenseItem({
  id,
  category,
  amount,
  icon,
  paidThisMonth,
}: FixedExpenseItemProps) {
  const [paid, setPaid] = useState(paidThisMonth);
  const [isPending, startTransition] = useTransition();

  // Para detectar doble tap en móvil
  const lastTapRef = useRef(0);

  const handleToggle = useCallback(() => {
    // Mutación optimista
    setPaid((prev) => !prev);
    startTransition(async () => {
      const result = await toggleExpensePaid(id);
      if (!result.ok) {
        // Revertir si falla
        setPaid((prev) => !prev);
      }
    });
  }, [id]);

  const handleDoubleClick = useCallback(() => {
    handleToggle();
  }, [handleToggle]);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const now = Date.now();
      const DOUBLE_TAP_DELAY = 300; // ms

      if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
        e.preventDefault();
        handleToggle();
        lastTapRef.current = 0;
      } else {
        lastTapRef.current = now;
      }
    },
    [handleToggle],
  );

  return (
    <div
      onDoubleClick={handleDoubleClick}
      onTouchEnd={handleTouchEnd}
      className={`flex items-center justify-between p-3 rounded-lg border transition-all select-none cursor-pointer group ${
        paid
          ? "bg-green-500/15 border-green-500/40 hover:border-green-400/60"
          : "bg-surface-container-low border-transparent hover:border-outline-variant"
      } ${isPending ? "opacity-70" : ""}`}
      title={paid ? "Pagado ✓ — doble clic para desmarcar" : "Doble clic para marcar como pagado"}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors ${
            paid
              ? "bg-green-500/20 text-green-400"
              : "bg-surface-variant/40 text-on-surface-variant group-hover:text-primary"
          }`}
        >
          <Icon
            name={paid ? "check_circle" : icon}
            className="text-[18px]"
            filled={paid}
          />
        </div>
        <span
          className={`text-body-md font-body-md ${
            paid ? "text-green-300 line-through opacity-80" : "text-on-background"
          }`}
        >
          {category}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span
          className={`text-body-md font-body-md font-mono ${
            paid ? "text-green-400" : "text-on-surface"
          }`}
        >
          {amount}
        </span>
        {paid && (
          <Icon
            name="verified"
            className="text-green-400 text-[16px]"
            filled
          />
        )}
      </div>
    </div>
  );
}
