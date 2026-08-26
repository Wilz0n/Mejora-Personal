"use client";

import { useTransition, useState } from "react";
import { toggleHabitLog } from "@/app/actions/habits";
import { Icon } from "@/components/comun/Icon";

interface HabitCheckboxProps {
  habitId: string;
  date: string;
  initialCompleted: boolean;
  label?: string;
  icon?: string;
  variant?: "row" | "cell";
  /** Si es true, la celda es solo lectura (no se puede marcar). */
  readOnly?: boolean;
}

/**
 * Checkbox con mutación optimista: actualiza la UI al instante y sincroniza
 * con el servidor vía Server Action. Si falla, revierte el estado.
 */
export function HabitCheckbox({
  habitId,
  date,
  initialCompleted,
  label,
  icon,
  variant = "row",
  readOnly = false,
}: HabitCheckboxProps) {
  const [completed, setCompleted] = useState(initialCompleted);
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    if (readOnly) return;
    const next = !completed;
    setCompleted(next); // optimista
    startTransition(async () => {
      const res = await toggleHabitLog({ habitId, date, completed: next });
      if (!res.ok) {
        setCompleted(!next); // revertir
      }
    });
  }

  if (variant === "cell") {
    // Modo solo lectura: muestra el estado sin permitir marcarlo (p. ej. la
    // vista Mensual, que solo refleja lo marcado en la vista Semanal).
    // Importante: renderiza directamente desde `initialCompleted` (la prop),
    // NO desde el estado local, para que al cambiar de semana refleje siempre
    // los datos frescos y no queden checks "pegados" de la semana anterior.
    if (readOnly) {
      return (
        <div
          aria-label={`${label ?? "hábito"} ${date}${initialCompleted ? " completado" : " pendiente"}`}
          className={`w-6 h-6 sm:w-7 sm:h-7 rounded-md sm:rounded-lg flex items-center justify-center border ${
            initialCompleted
              ? "bg-primary/90 border-primary text-on-primary"
              : "bg-surface-container-high/40 border-outline-variant/40 text-transparent"
          }`}
        >
          <Icon name="check" className="text-[14px] sm:text-[16px]" />
        </div>
      );
    }

    return (
      <button
        onClick={handleToggle}
        aria-pressed={completed}
        aria-label={`${label ?? "hábito"} ${date}`}
        className={`w-6 h-6 sm:w-7 sm:h-7 rounded-md sm:rounded-lg flex items-center justify-center border transition-all ${
          completed
            ? "bg-primary border-primary text-on-primary shadow-sm shadow-primary/20"
            : "bg-surface-container-high border-outline-variant text-transparent hover:border-primary hover:bg-primary/10 hover:text-primary/50"
        } ${isPending ? "opacity-70" : ""}`}
      >
        <Icon name="check" className="text-[14px] sm:text-[16px]" />
      </button>
    );
  }

  return (
    <button
      onClick={handleToggle}
      className="w-full flex items-center justify-between p-3 rounded-lg bg-surface-container/60 hover:bg-surface-container border border-outline-variant/50 transition-colors group text-left"
    >
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center">
          <span
            className={`w-5 h-5 border-2 rounded-md flex items-center justify-center transition-all ${
              completed
                ? "bg-primary border-primary"
                : "border-outline"
            }`}
          >
            {completed && (
              <Icon name="check" className="text-[16px] text-on-primary" />
            )}
          </span>
        </div>
        <span
          className={`text-body-md font-body-md transition-colors ${
            completed
              ? "text-on-surface-variant line-through opacity-70"
              : "text-on-surface"
          }`}
        >
          {label}
        </span>
      </div>
      {icon && (
        <Icon name={icon} className="text-[18px] text-outline opacity-60" />
      )}
    </button>
  );
}
