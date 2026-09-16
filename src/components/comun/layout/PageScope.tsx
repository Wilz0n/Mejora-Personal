"use client";

import { usePathname } from "next/navigation";

/**
 * Deriva un identificador de página (`data-page`) a partir de la ruta actual.
 *
 * Permite que el QuickCSS del usuario apunte a una página concreta con
 * selectores como `[data-page="dashboard"] .glass-panel { ... }` sin afectar al
 * resto de la app. Es opcional: la mayoría de temas se hacen con variables
 * globales; esto solo habilita el ajuste fino por página.
 *
 * Mapeo:
 * - `/`                          → dashboard
 * - `/habitos`                   → habitos
 * - `/finanzas`, `/finanzas/*`   → finanzas
 * - otras rutas                  → el primer segmento de la ruta
 */
function pageIdFromPath(pathname: string): string {
  if (pathname === "/") return "dashboard";
  const seg = pathname.split("/").filter(Boolean)[0] ?? "dashboard";
  // /finanzas, /finanzas/mes y /finanzas/historial comparten el mismo scope.
  return seg;
}

/**
 * Envuelve el contenido de las rutas autenticadas y expone `data-page`
 * (y `data-route`, la ruta completa por si se quiere aún más precisión).
 */
export function PageScope({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div data-page={pageIdFromPath(pathname)} data-route={pathname}>
      {children}
    </div>
  );
}
