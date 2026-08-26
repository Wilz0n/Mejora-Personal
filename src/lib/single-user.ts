import { prisma } from "@/lib/prisma";

/**
 * "Modo Usuario Único" (Single User Mode) para despliegues self-hosted de uso
 * personal. Cuando está activo, la app omite el login de NextAuth y usa siempre
 * un único usuario por defecto, creándolo automáticamente si no existe.
 *
 * Se controla con la variable de entorno de servidor SINGLE_USER_MODE=true.
 * (Existe también NEXT_PUBLIC_SINGLE_USER_MODE para que el cliente pueda ocultar
 * la UI de login/logout, ver isSingleUserModeClient()).
 */

export const SINGLE_USER_EMAIL =
  process.env.SINGLE_USER_EMAIL ?? "owner@lifetracker.local";

/** ¿Está activo el modo usuario único? (lado servidor) */
export function isSingleUserMode(): boolean {
  return (
    process.env.SINGLE_USER_MODE === "true" ||
    process.env.NEXT_PUBLIC_SINGLE_USER_MODE === "true"
  );
}

// Cache en memoria para no consultar la BD en cada request.
let cachedUserId: string | null = null;

/**
 * Devuelve el id del usuario por defecto, creándolo si hace falta.
 * Sólo debe llamarse cuando isSingleUserMode() es true.
 */
export async function getOrCreateSingleUserId(): Promise<string> {
  if (cachedUserId) return cachedUserId;

  const user = await prisma.user.upsert({
    where: { email: SINGLE_USER_EMAIL },
    update: {},
    create: {
      email: SINGLE_USER_EMAIL,
      name: "Yo",
    },
    select: { id: true },
  });

  cachedUserId = user.id;
  return user.id;
}
