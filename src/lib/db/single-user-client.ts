/** Helper client-safe: no importa Prisma ni código de servidor. */

/** ¿Está activo el modo usuario único? (lado cliente / público) */
export function isSingleUserModeClient(): boolean {
  return process.env.NEXT_PUBLIC_SINGLE_USER_MODE === "true";
}
