"use client";

import { signOut } from "next-auth/react";
import { Icon } from "@/components/comun/Icon";
import { isSingleUserModeClient } from "@/lib/single-user-client";

/**
 * Botón "Cerrar sesión" para la sección Identidad de Ajustes.
 *
 * Comportamiento condicional según el modo de autenticación (coherente con el
 * Sidebar):
 *  - Multi-usuario (SINGLE_USER_MODE=false): botón de acción de peligro que
 *    llama a `signOut()` de next-auth y redirige a /login.
 *  - Modo Usuario Único (SINGLE_USER_MODE=true): oculta el botón y muestra un
 *    indicador pasivo "Modo Usuario Único activo".
 *
 * Usa `isSingleUserModeClient()` (lee NEXT_PUBLIC_SINGLE_USER_MODE) para no
 * arrastrar código de servidor / Prisma al bundle del navegador.
 */
export function LogoutButton() {
  if (isSingleUserModeClient()) {
    return (
      <div className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg border border-outline-variant bg-surface-container-low text-on-surface-variant">
        <Icon name="person_check" className="text-[18px]" />
        <span className="text-body-sm font-body-sm">
          Modo Usuario Único activo
        </span>
      </div>
    );
  }

  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-error/40 text-error hover:bg-error/10 transition-colors font-body-md"
    >
      <Icon name="logout" className="text-[20px]" />
      Cerrar sesión
    </button>
  );
}
