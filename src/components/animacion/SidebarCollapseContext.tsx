"use client";

import { createContext, useContext, useState } from "react";

/**
 * Estado del colapso de la barra lateral (SOLO Desktop).
 *
 * En Desktop el usuario puede ocultar/mostrar la barra lateral pulsando el
 * icono/logo. Este contexto comparte el estado entre:
 *  - `Sidebar`: se desliza fuera de pantalla cuando `collapsed`.
 *  - El contenedor principal del layout: ajusta su margen izquierdo.
 *  - `SidebarReopenButton`: botón flotante (mismo icono) para reabrir.
 *
 * En móvil no aplica: la navegación es la bottom-nav, que no usa este estado.
 */
interface SidebarCollapseValue {
  collapsed: boolean;
  toggle: () => void;
  setCollapsed: (v: boolean) => void;
}

const SidebarCollapseContext = createContext<SidebarCollapseValue | null>(null);

export function SidebarCollapseProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <SidebarCollapseContext.Provider
      value={{ collapsed, toggle: () => setCollapsed((c) => !c), setCollapsed }}
    >
      {children}
    </SidebarCollapseContext.Provider>
  );
}

/** Hook para consumir el estado de colapso. Lanza si falta el provider. */
export function useSidebarCollapse(): SidebarCollapseValue {
  const ctx = useContext(SidebarCollapseContext);
  if (!ctx) {
    throw new Error(
      "useSidebarCollapse debe usarse dentro de <SidebarCollapseProvider>",
    );
  }
  return ctx;
}
