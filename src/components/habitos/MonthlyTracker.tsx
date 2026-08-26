"use client";

import { useState } from "react";
import { HabitCheckbox } from "@/components/habitos/HabitCheckbox";
import { Icon } from "@/components/comun/Icon";

export interface MonthlyHabit {
  id: string;
  name: string;
  icon: string;
  rate: number;
  completionByDay: Record<string, boolean>;
}

interface MonthlyTrackerProps {
  /** Semanas del mes: cada una es un array de 7 dayKeys (o null si está fuera del mes). */
  weeks: (string | null)[][];
  habits: MonthlyHabit[];
  today: string;
}

const WEEKDAYS = ["L", "M", "M", "J", "V", "S", "D"];

/**
 * Tracker mensual con selector de semana (Semana 1..N) y cuadrícula de checks
 * por día. Reutiliza HabitCheckbox para mantener la mutación optimista existente.
 */
export function MonthlyTracker({ weeks, habits, today }: MonthlyTrackerProps) {
  // Selecciona por defecto la semana que contiene el día de hoy (para que al
  // entrar se vean de inmediato las marcas de la semana en curso).
  const currentWeekIndex = Math.max(
    0,
    weeks.findIndex((wk) => wk.some((d) => d === today)),
  );
  const [activeWeek, setActiveWeek] = useState(currentWeekIndex);
  const week = weeks[activeWeek] ?? [];

  /** Tasa del hábito dentro de la semana activa (días marcados / días del mes en la semana). */
  function weekRate(h: MonthlyHabit): number {
    const days = week.filter((d): d is string => d !== null);
    if (days.length === 0) return 0;
    const done = days.filter((d) => h.completionByDay[d]).length;
    return Math.round((done / days.length) * 100);
  }

  return (
    <div className="lg:col-span-3 glass-panel rounded-xl overflow-hidden flex flex-col">
      {/* Selector de semanas */}
      <div className="px-5 py-2 border-b border-outline-variant/30 bg-surface-container/50 flex items-center gap-2 overflow-x-auto no-scrollbar">
        {weeks.map((_, i) => (
          <button
            key={i}
            onClick={() => setActiveWeek(i)}
            className={
              i === activeWeek
                ? "px-3 py-1.5 rounded-md text-label-caps text-[11px] bg-primary/20 text-primary border border-primary/30 whitespace-nowrap"
                : "px-3 py-1.5 rounded-md text-label-caps text-[11px] text-on-surface-variant hover:bg-surface-variant transition-colors whitespace-nowrap"
            }
          >
            Semana {i + 1}
          </button>
        ))}
      </div>

      {/* Cuadrícula */}
      <div className="p-5 overflow-x-auto no-scrollbar">
        <div className="min-w-full">
          <div className="grid grid-cols-[1fr_repeat(8,40px)] gap-4 mb-4 px-2">
            <div className="text-label-caps text-[10px] text-on-surface-variant uppercase">
              Hábito
            </div>
            {WEEKDAYS.map((d, i) => (
              <div
                key={i}
                className="text-center text-label-caps text-[10px] text-on-surface-variant"
              >
                {d}
              </div>
            ))}
            <div className="text-center text-label-caps text-[10px] text-on-surface-variant">
              Tasa
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {habits.map((h) => (
              <div
                key={h.id}
                className="grid grid-cols-[1fr_repeat(8,40px)] gap-4 items-center p-2 rounded-lg bg-surface-container/40 border border-outline-variant/30 hover:border-outline-variant/60 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                    <Icon name={h.icon} className="text-[16px] text-primary" />
                  </div>
                  <span className="text-body-sm text-on-surface truncate">
                    {h.name}
                  </span>
                </div>
                {week.map((day, i) =>
                  day === null ? (
                    <div key={`empty-${activeWeek}-${i}`} className="flex justify-center">
                      <div className="w-8 h-8 rounded-lg bg-surface-container-high/20 border border-outline-variant/20" />
                    </div>
                  ) : (
                    <div key={day} className="flex justify-center">
                      <HabitCheckbox
                        habitId={h.id}
                        date={day}
                        initialCompleted={h.completionByDay[day] ?? false}
                        label={h.name}
                        variant="cell"
                        readOnly
                      />
                    </div>
                  ),
                )}
                <div className="flex justify-center">
                  <span className="text-[11px] font-bold text-primary-fixed-dim">
                    {weekRate(h)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Leyenda */}
      <div className="px-5 py-4 mt-auto border-t border-outline-variant/30 bg-surface-container/40 flex items-center gap-6 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-md bg-primary/90 border border-primary" />
          <span className="text-[11px] text-on-surface-variant font-label-caps uppercase">
            Completado
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-md bg-surface-container-high/40 border border-outline-variant/40" />
          <span className="text-[11px] text-on-surface-variant font-label-caps uppercase">
            Pendiente
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-md bg-surface-container-high/20 border border-outline-variant/20" />
          <span className="text-[11px] text-on-surface-variant font-label-caps uppercase">
            Fuera del mes
          </span>
        </div>
        <div className="flex items-center gap-1.5 ml-auto text-on-surface-variant/70">
          <Icon name="lock" className="text-[14px]" />
          <span className="text-[11px] font-label-caps uppercase">
            Solo lectura · marca desde Semanal
          </span>
        </div>
      </div>
    </div>
  );
}
