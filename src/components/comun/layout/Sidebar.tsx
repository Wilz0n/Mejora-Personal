"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Icon } from "@/components/comun/ui/Icon";
import { NavIcon, type NavIconKey } from "@/components/comun/ui/NavIcon";
import { isSingleUserModeClient } from "@/lib/db/single-user-client";
import { useSidebarCollapse } from "@/components/animacion/SidebarCollapseContext";

const NAV: { href: string; label: string; icon: NavIconKey }[] = [
  { href: "/", label: "Dashboard", icon: "dashboard" },
  { href: "/habitos", label: "Hábitos", icon: "habitos" },
  { href: "/finanzas/mes", label: "Finanzas", icon: "finanzas" },
  { href: "/proyectos", label: "Proyectos", icon: "proyectos" },
];

const FOOTER_NAV: { href: string; label: string; icon: NavIconKey }[] = [
  { href: "/settings", label: "Ajustes", icon: "ajustes" },
  { href: "/support", label: "Soporte", icon: "soporte" },
];

export function Sidebar({ appIcon }: { appIcon: string | null }) {
  const pathname = usePathname();
  const { collapsed, toggle } = useSidebarCollapse();

  return (
    <nav
      className={`hidden md:flex flex-col h-full py-stack-md px-gutter bg-surface-container-lowest border-r border-outline-variant fixed h-screen w-60 left-0 top-0 z-50 transition-transform duration-300 ease-in-out ${
        collapsed ? "-translate-x-full" : "translate-x-0"
      }`}
    >
      <div className="flex items-center gap-3 mb-10">
        {/* Logo = botón para colapsar/expandir la barra (solo Desktop).
            Mantiene el mismo icono; muestra el icono personalizado si existe. */}
        <button
          type="button"
          onClick={toggle}
          aria-label="Ocultar menú lateral"
          aria-expanded={!collapsed}
          className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0 overflow-hidden hover:bg-primary/30 transition-colors"
        >
          {appIcon ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={appIcon}
              alt="Logo"
              className="w-7 h-7 object-contain rounded"
            />
          ) : (
            <Icon name="eco" className="text-primary" filled />
          )}
        </button>
        <div>
          <h1 className="text-headline-md font-headline-md font-bold text-primary leading-tight">
            LifeTracker
          </h1>
          <p className="text-label-caps font-label-caps text-on-surface-variant">
            Productive Mindset
          </p>
        </div>
      </div>

      <div className="flex-1 space-y-1">
        {NAV.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href) ||
                // "Finanzas" se marca activo tanto en /finanzas como /finanzas/mes
                (item.href === "/finanzas/mes" && pathname.startsWith("/finanzas"));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={
                active
                  ? "flex items-center gap-3 px-3 py-2 rounded-lg text-primary font-bold border-r-2 border-primary bg-surface-variant/30 transition-colors"
                  : "flex items-center gap-3 px-3 py-2 rounded-lg text-on-surface-variant font-medium hover:bg-surface-variant transition-colors"
              }
            >
              <NavIcon name={item.icon} filled={active} />
              <span className="text-body-md font-body-md">{item.label}</span>
            </Link>
          );
        })}
      </div>

      <div className="mt-auto space-y-1 pt-6 border-t border-outline-variant/30">
        {FOOTER_NAV.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={
                active
                  ? "flex items-center gap-3 px-3 py-2 rounded-lg text-primary font-bold border-r-2 border-primary bg-surface-variant/30 transition-colors"
                  : "flex items-center gap-3 px-3 py-2 rounded-lg text-on-surface-variant font-medium hover:bg-surface-variant transition-colors"
              }
            >
              <NavIcon name={item.icon} filled={active} />
              <span className="text-body-md font-body-md">{item.label}</span>
            </Link>
          );
        })}
        {!isSingleUserModeClient() && (
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-on-surface-variant font-medium hover:bg-surface-variant transition-colors"
          >
            <NavIcon name="logout" />
            <span className="text-body-md font-body-md">Cerrar sesión</span>
          </button>
        )}
      </div>
    </nav>
  );
}
