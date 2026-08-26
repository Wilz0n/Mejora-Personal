import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isSingleUserMode, getOrCreateSingleUserId } from "@/lib/single-user";

/**
 * Devuelve el userId de la sesión activa.
 *
 * - En "Modo Usuario Único" (SINGLE_USER_MODE=true) devuelve el id del usuario
 *   por defecto, creándolo automáticamente y sin pedir credenciales.
 * - En modo normal, si no hay sesión, redirige a /login.
 *
 * Úsalo en Server Components / Server Actions para garantizar el aislamiento
 * por usuario (multi-tenancy).
 */
export async function getUserId(): Promise<string> {
  if (isSingleUserMode()) {
    return getOrCreateSingleUserId();
  }

  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    redirect("/login");
  }
  return userId;
}

/** Variante que no redirige; devuelve null si no hay sesión. */
export async function getUserIdOrNull(): Promise<string | null> {
  if (isSingleUserMode()) {
    return getOrCreateSingleUserId();
  }

  const session = await auth();
  return session?.user?.id ?? null;
}
