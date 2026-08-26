"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/comun/Icon";

const NAV = [
  { href: "/", label: "Dashboard", icon: "dashboard" },
  { href: "/habitos", label: "Hábitos", icon: "event_repeat" },
  { href: "/finanzas", label: "Finanzas", icon: "payments" },
];

export function Topbar({ avatar }: { avatar?: string | null }) {
  const pathname = usePathname();
  return (
    <>
      <header className="flex justify-between items-center h-16 shrink-0 px-gutter sticky top-0 w-full z-40 backdrop-blur-md bg-background/80 border-b border-outline-variant">
        <div className="md:hidden flex items-center gap-3">
          <h1 className="text-headline-md font-headline-md font-bold text-primary">
            LifeTracker
          </h1>
        </div>
        <div className="flex items-center gap-4 ml-auto">
          <button className="text-on-surface-variant hover:text-primary transition-colors">
            <Icon name="notifications" />
          </button>
          <Link
            href="/settings"
            aria-label="Ajustes y perfil"
            className="w-8 h-8 rounded-full overflow-hidden bg-primary-container flex items-center justify-center text-on-primary-container hover:scale-105 transition-transform"
          >
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatar}
                alt="Perfil"
                className="w-full h-full object-cover"
              />
            ) : (
              <Icon name="person" className="text-[18px]" filled />
            )}
          </Link>
        </div>
      </header>

      {/* Bottom nav móvil */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex justify-around items-center h-16 bg-surface-container-lowest border-t border-outline-variant">
        {NAV.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 text-[11px] ${
                active ? "text-primary" : "text-on-surface-variant"
              }`}
            >
              <Icon name={item.icon} filled={active} className="text-[22px]" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
