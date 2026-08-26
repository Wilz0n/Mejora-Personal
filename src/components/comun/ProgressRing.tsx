interface ProgressRingProps {
  /** Porcentaje 0..100. */
  value: number;
  label?: string;
  size?: number;
}

/**
 * Anillo de progreso radial (SVG) con el estilo del diseño Nocturne.
 * Reutilizable: se usa en los resúmenes semanal y mensual de hábitos.
 */
export function ProgressRing({
  value,
  label = "Completado",
  size = 176,
}: ProgressRingProps) {
  const r = 44;
  const circumference = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, value));
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div
      className="relative flex items-center justify-center mx-auto"
      style={{ width: size, height: size }}
    >
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle
          className="text-surface-container-high"
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
        />
        <circle
          className="text-primary"
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.35s" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="text-stats-lg font-stats-lg text-primary">
          {clamped}%
        </span>
        <span className="text-label-caps font-label-caps text-on-surface-variant mt-1 uppercase">
          {label}
        </span>
      </div>
    </div>
  );
}
