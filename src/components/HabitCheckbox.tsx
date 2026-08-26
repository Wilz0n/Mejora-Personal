"use client";

import { useTransition, useState } from "react";
import { toggleHabitLog } from "@/app/actions/habits";
import { Icon } from "@/components/Icon";

interface HabitCheckboxProps {
  habitId: string;
  date: string;
  initialCompleted: boolean;
  label?: string;
  icon?: string;
  variant?: "row" | "cell";
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
}: HabitCheckboxProps) {
  const [completed, setCompleted] = useState(initialCompleted);
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
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
    return (
      <button
        onClick={handleToggle}
        aria-pressed={completed}
        aria-label={`${label ?? "hábito"} ${date}`}
        className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all ${
          completed
            ? "bg-primary border-primary text-on-primary"
            : "bg-surface-container border-outline-variant text-transparent hover:border-primary/60"
        } ${isPending ? "opacity-70" : ""}`}
      >
        <Icon name="check" className="text-[18px]" />
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
