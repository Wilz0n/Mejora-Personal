"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Icon } from "@/components/Icon";
import { isSingleUserModeClient } from "@/lib/single-user-client";

const NAV = [
  { href: "/", label: "Dashboard", icon: "dashboard" },
  { href: "/habits", label: "Hábitos", icon: "event_repeat" },
  { href: "/finance", label: "Finanzas", icon: "payments" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav className="hidden md:flex flex-col h-full py-stack-md px-gutter bg-surface-container-lowest border-r border-outline-variant fixed h-screen w-60 left-0 top-0 z-50">
      <div className="flex items-center gap-3 mb-10">
        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
          <Icon name="eco" className="text-primary" filled />
        </div>
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
              : pathname.startsWith(item.href);
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
              <Icon name={item.icon} filled={active} />
              <span className="text-body-md font-body-md">{item.label}</span>
            </Link>
          );
        })}
      </div>

      <div className="mt-auto space-y-1 pt-6 border-t border-outline-variant/30">
        {!isSingleUserModeClient() && (
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-on-surface-variant font-medium hover:bg-surface-variant transition-colors"
          >
            <Icon name="logout" />
            <span className="text-body-md font-body-md">Cerrar sesión</span>
          </button>
        )}
      </div>
    </nav>
  );
}
