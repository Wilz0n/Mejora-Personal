"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/comun/ui/Icon";
import { formatCurrency } from "@/lib/logic/finance-logic";
import {
  analyzeBackup,
  type ExportedData,
  type Level,
} from "@/lib/logic/backup-analysis";

/** Color de barra/segmento según nivel de cumplimiento. */
function levelBar(level: Level): string {
  if (level === "good") return "bg-primary";
  if (level === "mid") return "bg-tertiary";
  return "bg-error/70";
}

/**
 * Página oculta "/backup-analisis".
 *
 * El usuario sube el JSON que exportó desde Ajustes; se parsea y se analiza con
 * `analyzeBackup` (lógica pura). Muestra el consolidado histórico de sus ~6
 * meses: KPIs, hábitos mes a mes, distribución de pagos, ahorro histórico y
 * gastos hormiga. Diseño traducido al design system "Nocturne".
 */
export default function BackupAnalisisPage() {
  const [data, setData] = useState<ExportedData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const analysis = useMemo(() => analyzeBackup(data), [data]);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    setData(null);
    setFileName(null);
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as ExportedData;
      if (!parsed || !Array.isArray(parsed.habits) || !parsed.finance) {
        setError(
          "El archivo no tiene el formato esperado. Usa el JSON exportado desde Ajustes.",
        );
        return;
      }
      setData(parsed);
      setFileName(file.name);
    } catch {
      setError("No se pudo leer el archivo. Asegúrate de que sea un JSON válido.");
    }
  }

  const c = analysis.currency;

  return (
    <main className="min-h-screen bg-background px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      <div className="max-w-container-max mx-auto space-y-5 sm:space-y-6">
        {/* Header */}
        <section className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-headline-lg font-headline-lg text-on-surface tracking-tight">
              backup-analisis
            </h1>
            <p className="text-body-sm text-on-surface-variant mt-0.5">
              Resumen histórico y consolidado de Hábitos y Finanzas
            </p>
          </div>
          {/* Cargar archivo exportado */}
          <label className="inline-flex items-center gap-2 bg-surface-variant hover:bg-surface-container-high border border-outline-variant text-on-surface font-body-md px-5 py-2.5 rounded-lg transition-colors cursor-pointer self-start">
            <Icon name="upload_file" className="text-primary" />
            {fileName ? "Cambiar archivo" : "Subir backup (JSON)"}
            <input
              type="file"
              accept="application/json,.json"
              onChange={handleFile}
              className="hidden"
            />
          </label>
        </section>

        {error && (
          <div className="flex items-start gap-3 p-3 rounded-lg bg-error-container/10 border border-error/30">
            <Icon name="error" className="text-error mt-0.5" />
            <p className="text-body-sm text-on-surface-variant">{error}</p>
          </div>
        )}

        {/* Estado vacío: aún no se ha subido nada */}
        {!analysis.hasData && !error && (
          <div className="glass-panel rounded-2xl py-16 flex flex-col items-center justify-center text-center gap-3 text-on-surface-variant">
            <Icon name="insights" className="text-[40px] opacity-40" />
            <p className="text-body-md max-w-sm">
              Sube el archivo <span className="text-on-surface font-medium">JSON</span>{" "}
              que exportaste desde Ajustes para ver el análisis de tus meses de
              uso.
            </p>
          </div>
        )}

        {analysis.hasData && (
          <>
            {/* Rango de fechas */}
            {analysis.rangeLabel && (
              <p className="text-body-sm text-on-surface-variant -mt-1">
                <Icon name="calendar_month" className="text-[16px] align-middle mr-1" />
                {analysis.rangeLabel} · {analysis.monthCount}{" "}
                {analysis.monthCount === 1 ? "mes" : "meses"}
              </p>
            )}

            {/* Sección 1: KPIs globales */}
            <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <KpiCard
                label="Tasa Éxito Hábitos"
                value={`${analysis.kpis.habitSuccessRate}%`}
                hint="Cumplimiento consolidado"
              />
              <KpiCard
                label="Ingreso Total"
                value={formatCurrency(analysis.kpis.totalIncome, { currency: c })}
                hint="Flujo bruto registrado"
                accent="text-primary"
              />
              <KpiCard
                label="Gasto Fijo Total"
                value={formatCurrency(analysis.kpis.totalFixedExpenses, {
                  currency: c,
                })}
                hint="Total egresos operacionales"
                accent="text-error"
              />
              <KpiCard
                label="Ahorro Neto"
                value={formatCurrency(analysis.kpis.netSavings, { currency: c })}
                hint={`Margen libre (${analysis.kpis.savingsRatePct}%)`}
                accent="text-tertiary"
              />
            </section>

            {/* Sección 2: Hábitos */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Progreso mes a mes por hábito */}
              <div className="lg:col-span-2 glass-panel rounded-2xl p-4 sm:p-6 flex flex-col">
                <div className="mb-5">
                  <h3 className="text-headline-md font-headline-md text-on-surface">
                    Seguimiento de Hábitos
                  </h3>
                  <p className="text-body-sm text-on-surface-variant">
                    {analysis.rangeLabel} · Consolidado por mes
                  </p>
                </div>

                {analysis.habits.series.length === 0 ? (
                  <EmptyHint text="No hay hábitos registrados en este backup." />
                ) : (
                  <div className="divide-y divide-outline-variant/30">
                    {/* Cabecera de meses */}
                    <div className="flex items-center gap-3 sm:gap-4 pb-3 text-[10px] sm:text-[11px] font-label-caps text-on-surface-variant uppercase tracking-wider">
                      <span className="w-28 sm:w-40 shrink-0">Hábito</span>
                      <div
                        className="flex-1 grid gap-1.5 sm:gap-2 text-center"
                        style={{
                          gridTemplateColumns: `repeat(${Math.max(1, analysis.monthCount)}, minmax(0, 1fr))`,
                        }}
                      >
                        {analysis.habits.series[0].monthly.map((m) => (
                          <span key={m.month} className="capitalize truncate">
                            {m.label}
                          </span>
                        ))}
                      </div>
                      <span className="w-10 sm:w-12 text-right shrink-0">Tasa</span>
                    </div>

                    {/* Filas por hábito */}
                    {analysis.habits.series.map((h) => (
                      <div
                        key={h.name}
                        className="flex items-center gap-3 sm:gap-4 py-3.5"
                      >
                        <div className="w-28 sm:w-40 shrink-0 flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                            <Icon name={h.icon} className="text-[14px] text-primary" />
                          </div>
                          <span className="text-body-sm text-on-surface font-medium truncate">
                            {h.name}
                          </span>
                        </div>
                        <div
                          className="flex-1 grid gap-1.5 sm:gap-2 items-center"
                          style={{
                            gridTemplateColumns: `repeat(${Math.max(1, h.monthly.length)}, minmax(0, 1fr))`,
                          }}
                        >
                          {h.monthly.map((m) => (
                            <div
                              key={m.month}
                              className={`h-2.5 rounded-full ${levelBar(m.level)}`}
                              title={`${m.label}: ${m.rate}%`}
                            />
                          ))}
                        </div>
                        <span className="w-10 sm:w-12 text-right shrink-0 font-mono font-semibold text-on-surface text-xs sm:text-sm">
                          {h.rate}%
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Leyenda */}
                <div className="mt-4 pt-3 border-t border-outline-variant/30 flex items-center gap-4 sm:gap-5 text-[11px] text-on-surface-variant flex-wrap">
                  <LegendDot className="bg-primary" text="Consolidado (≥80%)" />
                  <LegendDot className="bg-tertiary" text="En progreso (40–79%)" />
                  <LegendDot className="bg-error/70" text="En riesgo (<40%)" />
                </div>
              </div>

              {/* Resumen de hábitos (gauge + destacados) */}
              <div className="glass-panel rounded-2xl p-4 sm:p-6 flex flex-col">
                <h3 className="text-headline-md font-headline-md text-on-surface mb-2">
                  Seguimientos de Hábitos
                </h3>
                <Gauge value={analysis.habits.globalRate} label="Global Success" />
                <div className="space-y-2.5 mt-2">
                  <StatCard
                    label="Mejor Hábito"
                    name={analysis.habits.best?.name ?? "—"}
                    rate={analysis.habits.best?.rate ?? 0}
                    bar="bg-primary"
                  />
                  <StatCard
                    label="Hábito Reciente"
                    name={analysis.habits.recent?.name ?? "—"}
                    rate={analysis.habits.recent?.rate ?? 0}
                    bar="bg-primary-fixed-dim"
                  />
                  <StatCard
                    label="Por Mejorar"
                    name={analysis.habits.worst?.name ?? "—"}
                    rate={analysis.habits.worst?.rate ?? 0}
                    bar="bg-tertiary"
                  />
                </div>
              </div>
            </section>

            {/* Sección 3: Finanzas */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Distribución de pagos mensuales */}
              <div className="lg:col-span-2 glass-panel rounded-2xl p-4 sm:p-6 flex flex-col">
                <div className="mb-6">
                  <h3 className="text-headline-md font-headline-md text-on-surface">
                    Distribución de Pagos Mensuales
                  </h3>
                  <p className="text-body-sm text-on-surface-variant">
                    {analysis.rangeLabel} · Volumen registrado por mes
                  </p>
                </div>
                <BarChart
                  bars={analysis.finance.incomeByMonth.map((b) => ({
                    label: b.label,
                    heightPct: b.heightPct,
                    color: "bg-primary",
                  }))}
                />
                {analysis.finance.peakIncome && (
                  <div className="mt-4 flex items-center justify-between text-body-sm text-on-surface-variant flex-wrap gap-1">
                    <span>
                      Mayor volumen: {analysis.finance.peakIncome.label} (
                      {formatCurrency(analysis.finance.peakIncome.value, {
                        currency: c,
                      })}
                      )
                    </span>
                  </div>
                )}
              </div>

              {/* Categorías de gastos */}
              <div className="glass-panel rounded-2xl p-4 sm:p-6 flex flex-col">
                <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30">
                  <h3 className="text-headline-md font-headline-md text-on-surface">
                    Categorías de Gastos
                  </h3>
                </div>
                <Gauge
                  value={100}
                  centerText={formatCurrency(analysis.finance.totalExpenses, {
                    currency: c,
                  })}
                  label="Total Gastos"
                />
                <div className="space-y-2.5">
                  {analysis.finance.expensesByCategory.length === 0 ? (
                    <EmptyHint text="Sin categorías de gasto." />
                  ) : (
                    analysis.finance.expensesByCategory
                      .slice(0, 6)
                      .map((cat, i) => (
                        <div
                          key={cat.category}
                          className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-3 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span
                              className={`w-1 h-7 rounded-full ${["bg-primary", "bg-primary-fixed-dim", "bg-tertiary", "bg-secondary", "bg-error/70", "bg-outline"][i % 6]}`}
                            />
                            <div className="min-w-0">
                              <p className="text-[10px] text-on-surface-variant font-label-caps uppercase tracking-wide truncate">
                                {cat.category}
                              </p>
                              <p className="text-body-sm font-semibold text-on-surface">
                                {formatCurrency(cat.amount, { currency: c })}
                              </p>
                            </div>
                          </div>
                          <span className="text-body-md font-bold font-mono text-on-surface shrink-0">
                            {cat.percent}%
                          </span>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </section>

            {/* Sección 4: Ahorro histórico + Gastos hormiga */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Ahorro histórico */}
              <div className="lg:col-span-2 glass-panel rounded-2xl p-4 sm:p-6 flex flex-col">
                <div className="mb-6">
                  <h3 className="text-headline-md font-headline-md text-on-surface">
                    Ahorro Histórico
                  </h3>
                  <p className="text-body-sm text-on-surface-variant">
                    {analysis.rangeLabel} · Ahorro registrado por mes
                  </p>
                </div>
                <BarChart
                  bars={analysis.savings.byMonth.map((b) => ({
                    label: b.label,
                    heightPct: b.heightPct,
                    color: "bg-tertiary",
                  }))}
                />
                <div className="mt-4 flex items-center justify-between text-body-sm text-on-surface-variant flex-wrap gap-1">
                  {analysis.savings.peak && (
                    <span>
                      Mayor ahorro: {analysis.savings.peak.label} (
                      {formatCurrency(analysis.savings.peak.value, { currency: c })}
                      )
                    </span>
                  )}
                  <span className="text-primary">
                    Total: {formatCurrency(analysis.savings.total, { currency: c })}
                  </span>
                </div>
              </div>

              {/* Gastos hormiga */}
              <div className="glass-panel rounded-2xl p-4 sm:p-6 flex flex-col">
                <h3 className="text-headline-md font-headline-md text-on-surface mb-2">
                  Gastos Hormiga
                </h3>
                <Gauge
                  value={100}
                  amber
                  centerText={formatCurrency(analysis.microExpenses.total, {
                    currency: c,
                  })}
                  label="Total gastado"
                />
                <div className="space-y-2.5 mt-2">
                  <StatText
                    label="Donde más gastaste"
                    name={analysis.microExpenses.most?.category ?? "—"}
                    value={
                      analysis.microExpenses.most
                        ? formatCurrency(analysis.microExpenses.most.amount, {
                            currency: c,
                          })
                        : "—"
                    }
                    bar="bg-error/70"
                  />
                  <StatText
                    label="Donde menos gastaste"
                    name={analysis.microExpenses.least?.category ?? "—"}
                    value={
                      analysis.microExpenses.least
                        ? formatCurrency(analysis.microExpenses.least.amount, {
                            currency: c,
                          })
                        : "—"
                    }
                    bar="bg-primary"
                  />
                  <StatText
                    label="Mes de mayor gasto"
                    name={analysis.microExpenses.topMonth?.label ?? "—"}
                    value={
                      analysis.microExpenses.topMonth
                        ? formatCurrency(analysis.microExpenses.topMonth.amount, {
                            currency: c,
                          })
                        : "—"
                    }
                    bar="bg-tertiary"
                  />
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

// ------------------------- Subcomponentes UI ------------------------------

function KpiCard({
  label,
  value,
  hint,
  accent = "text-on-surface",
}: {
  label: string;
  value: string;
  hint: string;
  accent?: string;
}) {
  return (
    <div className="glass-panel rounded-2xl p-5 flex flex-col justify-between">
      <span className="text-body-sm text-on-surface-variant font-medium">
        {label}
      </span>
      <div className="mt-4">
        <span className={`text-stats-lg font-stats-lg ${accent}`}>{value}</span>
        <p className="text-body-sm text-on-surface-variant mt-1">{hint}</p>
      </div>
    </div>
  );
}

function Gauge({
  value,
  label,
  centerText,
  amber = false,
}: {
  value: number;
  label: string;
  centerText?: string;
  amber?: boolean;
}) {
  const circumference = 251.2;
  const offset = circumference - (Math.min(100, Math.max(0, value)) / 100) * circumference;

  // El texto interior debe caber dentro del anillo (~118px de ancho útil).
  // Para porcentajes (texto corto) usamos una fuente grande fija; para montos
  // ajustamos el tamaño según la longitud, de modo que "S/ 217.50" se vea
  // grande y "S/ 1,000,000.00" se reduzca sin salirse nunca del círculo.
  const text = centerText ?? `${value}%`;
  const len = text.length;
  let fontSize: number;
  if (centerText) {
    // Ancho útil ≈ 118px; ~0.62em por carácter en font-extrabold.
    fontSize = Math.max(13, Math.min(30, Math.floor(118 / (len * 0.62))));
  } else {
    fontSize = 44; // porcentaje: siempre corto
  }

  return (
    <div className="flex flex-col items-center justify-center mt-2 mb-6">
      <div className="relative w-40 h-40 sm:w-44 sm:h-44 flex items-center justify-center">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            fill="transparent"
            r="40"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="7"
          />
          <circle
            cx="50"
            cy="50"
            fill="transparent"
            r="40"
            stroke={amber ? "#f59e0b" : "#818cf8"}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            strokeWidth="7"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-2">
          <span
            className="font-extrabold text-on-surface leading-none whitespace-nowrap"
            style={{ fontSize: `${fontSize}px` }}
          >
            {text}
          </span>
          <span className="text-[8px] sm:text-[9px] uppercase tracking-wider text-on-surface-variant font-semibold mt-1 leading-tight">
            {label}
          </span>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  name,
  rate,
  bar,
}: {
  label: string;
  name: string;
  rate: number;
  bar: string;
}) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-3 flex items-center justify-between gap-2">
      <div className="flex items-center gap-3 min-w-0">
        <span className={`w-1 h-7 rounded-full shrink-0 ${bar}`} />
        <div className="min-w-0">
          <p className="text-[10px] text-on-surface-variant font-label-caps uppercase tracking-wide truncate">
            {label}
          </p>
          <p className="text-body-sm font-semibold text-on-surface truncate">
            {name}
          </p>
        </div>
      </div>
      <span className="text-body-md font-bold font-mono text-on-surface shrink-0 whitespace-nowrap">
        {rate}%
      </span>
    </div>
  );
}

function StatText({
  label,
  name,
  value,
  bar,
}: {
  label: string;
  name: string;
  value: string;
  bar: string;
}) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-3 flex items-center justify-between gap-2">
      <div className="flex items-center gap-3 min-w-0">
        <span className={`w-1 h-7 rounded-full shrink-0 ${bar}`} />
        <div className="min-w-0">
          <p className="text-[10px] text-on-surface-variant font-label-caps uppercase tracking-wide truncate">
            {label}
          </p>
          <p className="text-body-sm font-semibold text-on-surface truncate">
            {name}
          </p>
        </div>
      </div>
      <span className="text-body-sm sm:text-body-md font-bold font-mono text-on-surface shrink-0 whitespace-nowrap">
        {value}
      </span>
    </div>
  );
}

function BarChart({
  bars,
}: {
  bars: { label: string; heightPct: number; color: string }[];
}) {
  if (bars.length === 0) {
    return <EmptyHint text="Sin datos mensuales en este backup." />;
  }
  return (
    <div className="h-60 flex items-end justify-between gap-2 sm:gap-3 border-b border-outline-variant/30 pb-2">
      {bars.map((b) => (
        <div
          key={b.label}
          className="flex-1 flex flex-col items-center gap-2 h-full justify-end group"
        >
          <div
            className={`w-full max-w-[48px] ${b.color} rounded-t-md transition-all group-hover:brightness-110`}
            style={{ height: `${Math.max(4, b.heightPct)}%` }}
            title={`${b.label}`}
          />
          <span className="text-[10px] sm:text-[11px] text-on-surface-variant font-mono capitalize truncate max-w-full">
            {b.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function LegendDot({ className, text }: { className: string; text: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`w-2.5 h-2.5 rounded-sm ${className}`} />
      <span>{text}</span>
    </div>
  );
}

function EmptyHint({ text }: { text: string }) {
  return (
    <div className="py-8 text-center text-body-sm text-on-surface-variant">
      {text}
    </div>
  );
}
