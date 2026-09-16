"use client";

import { useSidebarCollapse } from "@/components/animacion/SidebarCollapseContext";

/**
 * Contenedor del área principal que reacciona al colapso de la barra lateral.
 *
 * En Desktop, cuando la barra está desplegada deja un margen izquierdo de 15rem
 * (ancho de la sidebar, `w-60`); cuando está colapsada, el margen pasa a 0 y el
 * contenido ocupa todo el ancho. La transición del margen crea la animación de
 * apertura/cierre coordinada con el deslizamiento de la barra.
 *
 * En móvil no hay margen (la sidebar está oculta y se usa la bottom-nav), así
 * que el colapso no tiene efecto: el margen base ya es 0 hasta `md`.
 */
export function MainContent({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebarCollapse();
  return (
    <main
      className={`flex-1 flex flex-col h-screen overflow-y-auto bg-background no-scrollbar transition-[margin] duration-300 ease-in-out ${
        collapsed ? "md:ml-0" : "md:ml-60"
      }`}
    >
      {children}
    </main>
  );
}
