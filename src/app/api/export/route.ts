import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/session";
import { getUserExportData } from "@/lib/data";

export const dynamic = "force-dynamic";

/**
 * GET /api/export?format=json|csv
 * Descarga un archivo con todos los datos del usuario autenticado.
 */
export async function GET(req: NextRequest) {
  const userId = await getUserId();
  const format = req.nextUrl.searchParams.get("format") === "csv" ? "csv" : "json";
  const data = await getUserExportData(userId);
  const stamp = new Date().toISOString().slice(0, 10);

  if (format === "json") {
    return new NextResponse(JSON.stringify(data, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="lifetracker-${stamp}.json"`,
      },
    });
  }

  // CSV: secciones concatenadas (hábitos, gastos fijos, proyectos).
  const csv = buildCsv(data);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="lifetracker-${stamp}.csv"`,
    },
  });
}

function esc(v: unknown): string {
  let s = String(v ?? "");
  // Mitiga "CSV/Formula injection": si una celda empieza con un carácter que
  // Excel/Sheets interpretan como fórmula, se antepone un apóstrofe para
  // neutralizarla (evita ejecución de fórmulas al abrir el CSV).
  if (/^[=+\-@\t\r]/.test(s)) {
    s = `'${s}`;
  }
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function buildCsv(data: Awaited<ReturnType<typeof getUserExportData>>): string {
  const lines: string[] = [];

  lines.push("# HÁBITOS");
  lines.push("nombre,icono,fecha,completado");
  for (const h of data.habits) {
    if (h.logs.length === 0) {
      lines.push([esc(h.name), esc(h.icon), "", ""].join(","));
    }
    for (const log of h.logs) {
      lines.push(
        [esc(h.name), esc(h.icon), esc(log.date), esc(log.completed)].join(","),
      );
    }
  }

  lines.push("");
  lines.push("# GASTOS FIJOS");
  lines.push("categoria,monto");
  for (const e of data.finance.fixedExpenses) {
    lines.push([esc(e.category), esc(e.amount)].join(","));
  }

  lines.push("");
  lines.push("# PROYECTOS");
  lines.push("nombre,meta,asignado,etiqueta");
  for (const p of data.finance.projects) {
    lines.push(
      [esc(p.name), esc(p.targetAmount), esc(p.allocatedAmount), esc(p.tag)].join(
        ",",
      ),
    );
  }

  lines.push("");
  lines.push("# FINANZAS");
  lines.push("ingreso_mensual,moneda");
  lines.push(
    [esc(data.finance.monthlyIncome), esc(data.finance.currency)].join(","),
  );

  return lines.join("\n");
}
