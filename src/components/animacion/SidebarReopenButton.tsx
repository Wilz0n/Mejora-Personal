"use client";

import { useSidebarCollapse } from "@/components/animacion/SidebarCollapseContext";
import { Icon } from "@/components/comun/ui/Icon";

/**
 * Botón flotante (SOLO Desktop) que reaparece en la esquina superior izquierda
 * cuando la barra lateral está colapsada, usando el MISMO icono/logo. Al
 * pulsarlo, la barra vuelve a desplegarse desde la izquierda.
 *
 * Se oculta (sin ocupar espacio) cuando la barra está desplegada, y en móvil.
 */
export function SidebarReopenButton({ appIcon }: { appIcon: string | null }) {
  const { collapsed, toggle } = useSidebarCollapse();

  return (
    <button
      onClick={toggle}
      aria-label="Mostrar menú lateral"
      aria-expanded={!collapsed}
      className={`hidden md:flex fixed top-3 left-3 z-[60] w-10 h-10 rounded-lg bg-surface-container border border-outline-variant items-center justify-center shadow-lg transition-all duration-300 ease-in-out hover:border-primary/50 ${
        collapsed
          ? "opacity-100 translate-x-0 pointer-events-auto"
          : "opacity-0 -translate-x-14 pointer-events-none"
      }`}
    >
      {appIcon ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={appIcon}
          alt="Menú"
          className="w-6 h-6 object-contain rounded"
        />
      ) : (
        <Icon name="eco" className="text-primary" filled />
      )}
    </button>
  );
}
