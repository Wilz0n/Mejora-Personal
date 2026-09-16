import {
  LayoutDashboard,
  Repeat,
  Wallet,
  FolderKanban,
  Settings,
  LifeBuoy,
  LogOut,
  type LucideIcon,
} from "lucide-react";

/**
 * Iconos LOCALES de navegación (paquete `lucide-react`, SVG empaquetados).
 *
 * A diferencia de los Material Symbols (que dependen de una fuente cargada
 * desde Google Fonts por URL), estos iconos se sirven desde el propio bundle:
 * no dependen de red externa y son 100% nuestros. Se usan en la Sidebar y en
 * la bottom-nav móvil (Topbar).
 *
 * Para cambiar un icono, sustituye el import de lucide-react y el mapa. Cada
 * clave es estable (no cambiarla: la usan Sidebar/Topbar).
 */
export type NavIconKey =
  | "dashboard"
  | "habitos"
  | "finanzas"
  | "proyectos"
  | "ajustes"
  | "soporte"
  | "logout";

const ICONS: Record<NavIconKey, LucideIcon> = {
  dashboard: LayoutDashboard,
  habitos: Repeat,
  finanzas: Wallet,
  proyectos: FolderKanban,
  ajustes: Settings,
  soporte: LifeBuoy,
  logout: LogOut,
};

interface NavIconProps {
  name: NavIconKey;
  className?: string;
  /** Grosor del trazo (line-icons). Por defecto 2. */
  strokeWidth?: number;
  /** Tamaño en px del SVG. Por defecto 22. */
  size?: number;
  /** Relleno del icono cuando el item está activo. */
  filled?: boolean;
}

/**
 * Renderiza un icono de navegación local. `currentColor` hereda el color del
 * texto, por lo que sigue respondiendo al QuickCSS (ej. `.text-primary`).
 */
export function NavIcon({
  name,
  className = "",
  strokeWidth = 2,
  size = 22,
  filled = false,
}: NavIconProps) {
  const Cmp = ICONS[name];
  return (
    <Cmp
      className={`shrink-0 ${className}`}
      width={size}
      height={size}
      strokeWidth={strokeWidth}
      // Un relleno tenue con el color actual da feedback de "activo" sin perder
      // el estilo de línea.
      fill={filled ? "currentColor" : "none"}
      fillOpacity={filled ? 0.15 : 0}
      aria-hidden
    />
  );
}
