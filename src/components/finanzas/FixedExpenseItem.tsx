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
  // Feedback visual: indica que el primer tap fue registrado y espera el segundo
  const [awaitingSecondTap, setAwaitingSecondTap] = useState(false);

  // Estado del primer tap para detección de doble tap en móvil
  const lastTapRef = useRef<{ time: number; x: number; y: number }>({
    time: 0,
    x: 0,
    y: 0,
  });
  // Posición inicial del toque actual (para detectar scroll/arrastre)
  const touchStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  // Evita que el onClick sintético post-touch dispare de más
  const touchHandledRef = useRef(false);
  // Timer para limpiar el estado "esperando segundo tap"
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearResetTimer = useCallback(() => {
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }
  }, []);

  const handleToggle = useCallback(() => {
    clearResetTimer();
    setAwaitingSecondTap(false);
    lastTapRef.current = { time: 0, x: 0, y: 0 };
    // Mutación optimista
    setPaid((prev) => !prev);
    startTransition(async () => {
      const result = await toggleExpensePaid(id);
      if (!result.ok) {
        // Revertir si falla
        setPaid((prev) => !prev);
      }
    });
  }, [id, clearResetTimer]);

  const handleDoubleClick = useCallback(() => {
    // Solo desktop: en móvil el toggle lo maneja el flujo táctil.
    if (touchHandledRef.current) return;
    handleToggle();
  }, [handleToggle]);

  // Guardamos la posición donde empieza el toque
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY };
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const now = Date.now();
      const DOUBLE_TAP_DELAY = 450; // ms — ventana más holgada para móvil
      const MOVE_TOLERANCE = 24; // px — distancia máx. permitida entre taps

      const t = e.changedTouches[0];
      const x = t.clientX;
      const y = t.clientY;

      // Si el dedo se movió mucho desde el touchstart, fue scroll/arrastre: ignorar
      const dragDist = Math.hypot(
        x - touchStartRef.current.x,
        y - touchStartRef.current.y,
      );
      if (dragDist > MOVE_TOLERANCE) {
        clearResetTimer();
        setAwaitingSecondTap(false);
        lastTapRef.current = { time: 0, x: 0, y: 0 };
        return;
      }

      const prev = lastTapRef.current;
      const withinTime = now - prev.time < DOUBLE_TAP_DELAY;
      const withinDist =
        Math.hypot(x - prev.x, y - prev.y) < MOVE_TOLERANCE * 2;

      if (prev.time > 0 && withinTime && withinDist) {
        // Doble tap válido
        e.preventDefault();
        touchHandledRef.current = true;
        // Reset del flag tras el ciclo de eventos sintéticos
        setTimeout(() => {
          touchHandledRef.current = false;
        }, 700);
        handleToggle();
      } else {
        // Primer tap: registrar posición + feedback visual
        lastTapRef.current = { time: now, x, y };
        setAwaitingSecondTap(true);
        clearResetTimer();
        resetTimerRef.current = setTimeout(() => {
          setAwaitingSecondTap(false);
          lastTapRef.current = { time: 0, x: 0, y: 0 };
        }, DOUBLE_TAP_DELAY);
      }
    },
    [handleToggle, clearResetTimer],
  );

  return (
    <div
      onDoubleClick={handleDoubleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{ touchAction: "manipulation" }}
      className={`flex items-center justify-between p-3 rounded-lg border transition-all select-none cursor-pointer group ${
        paid
          ? "bg-green-500/15 border-green-500/40 hover:border-green-400/60"
          : awaitingSecondTap
            ? "bg-surface-container-low border-primary/60 ring-1 ring-primary/40"
            : "bg-surface-container-low border-transparent hover:border-outline-variant"
      } ${isPending ? "opacity-70" : ""}`}
      title={
        paid
          ? "Pagado ✓ — doble toque/clic para desmarcar"
          : awaitingSecondTap
            ? "Toca otra vez para marcar como pagado"
            : "Doble toque/clic para marcar como pagado"
      }
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
