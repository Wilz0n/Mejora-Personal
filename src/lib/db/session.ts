import { redirect } from "next/navigation";
import { auth } from "@/lib/db/auth";
import { isSingleUserMode, getOrCreateSingleUserId } from "@/lib/db/single-user";
import { prisma } from "@/lib/db/prisma";

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

/** Obtiene la timezone del usuario (default: America/Lima). */
export async function getUserTimezone(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { timezone: true },
  });
  return user?.timezone ?? "America/Lima";
}

/**
 * Fecha de creación de la cuenta del usuario (para restricciones por
 * antigüedad, ej. desbloqueo de vistas trimestral/semestral de hábitos).
 * Si por algún motivo no se encuentra, devuelve "ahora" (antigüedad = 1 mes),
 * lo que deja disponibles solo semanal/mensual (comportamiento seguro).
 */
export async function getUserCreatedAt(userId: string): Promise<Date> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { createdAt: true },
  });
  return user?.createdAt ?? new Date();
}

/**
 * Inicio del "ciclo de datos" vigente del usuario: `max(createdAt, dataResetAt)`.
 *
 * Se usa como origen para calcular la antigüedad efectiva (desbloqueo de vistas
 * y umbral de archivado del 7º mes). Tras archivar/reiniciar, `dataResetAt` se
 * fija a "ahora", por lo que el ciclo de 6 meses vuelve a empezar sin perder la
 * fecha real de registro (`createdAt`).
 */
export async function getUserTenureStart(userId: string): Promise<Date> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { createdAt: true, dataResetAt: true },
  });
  const createdAt = user?.createdAt ?? new Date();
  const resetAt = user?.dataResetAt ?? null;
  if (resetAt && resetAt > createdAt) return resetAt;
  return createdAt;
}
