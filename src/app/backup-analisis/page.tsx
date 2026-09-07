"use client";

import { useState } from "react";

/**
 * Forma de los datos exportados por `/api/export?format=json`
 * (ver `getUserExportData`). Se deja tipado para que el diseño posterior
 * pueda consumir estos campos con seguridad.
 */
type ExportedData = {
  exportedAt: string;
  profile: {
    name: string | null;
    email: string | null;
    memberSince: string | null;
  };
  habits: {
    name: string;
    icon: string;
    logs: { date: string; completed: boolean }[];
  }[];
  finance: {
    monthlyIncome: number;
    currency: string;
    fixedExpenses: { category: string; amount: number }[];
    projects: {
      name: string;
      targetAmount: number;
      allocatedAmount: number;
      tag: string;
    }[];
  };
};

/**
 * Página oculta "/backup-analisis".
 *
 * Recibe el archivo JSON que el usuario exportó previamente desde Ajustes,
 * lo parsea y deja los datos listos en estado (`data`) para el análisis.
 *
 * NOTA: por ahora solo es estructura funcional (recepción + parseo). El diseño
 * y la visualización del análisis se construirán encima de `data`.
 */
export default function BackupAnalisisPage() {
  const [data, setData] = useState<ExportedData | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    setData(null);
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as ExportedData;
      // Validación mínima de estructura para evitar romper el render posterior.
      if (!parsed || !Array.isArray(parsed.habits) || !parsed.finance) {
        setError(
          "El archivo no tiene el formato esperado. Usa el JSON exportado desde Ajustes.",
        );
        return;
      }
      setData(parsed);
    } catch {
      setError("No se pudo leer el archivo. Asegúrate de que sea un JSON válido.");
    }
  }

  return (
    <main className="min-h-screen p-6">
      {/* Estructura funcional mínima. El diseño se construirá aquí encima. */}
      <h1 className="text-headline-lg font-headline-lg text-on-surface mb-4">
        Análisis / Backup
      </h1>

      <input
        type="file"
        accept="application/json,.json"
        onChange={handleFile}
        className="mb-4"
      />

      {error && <p className="text-error text-body-sm">{error}</p>}

      {/* Datos ya parseados y disponibles para el diseño del análisis. */}
      {data && (
        <pre className="mt-4 overflow-auto text-body-sm text-on-surface-variant">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </main>
  );
}
