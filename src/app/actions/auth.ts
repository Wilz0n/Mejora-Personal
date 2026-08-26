"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validators";
import { isSingleUserMode } from "@/lib/single-user";
import type { ActionResult } from "@/lib/action-result";

export async function registerUser(input: unknown): Promise<ActionResult> {
  // En modo usuario único el login está desactivado: no se permite registrar
  // cuentas nuevas (evita creación de usuarios en despliegues personales).
  if (isSingleUserMode()) {
    return { ok: false, error: "El registro está deshabilitado." };
  }

  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Datos inválidos",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { name, email, password } = parsed.data;

  const passwordHash = await bcrypt.hash(password, 10);

  // Intentamos crear el usuario. Si el email ya existe, Prisma lanza P2002
  // (violación de unique). Devolvemos un mensaje GENÉRICO en ambos casos de
  // fallo para no revelar si un email está o no registrado (evita enumeración).
  try {
    await prisma.user.create({
      data: { name, email, passwordHash },
    });
  } catch (e: unknown) {
    if (
      typeof e === "object" &&
      e !== null &&
      "code" in e &&
      (e as { code?: string }).code === "P2002"
    ) {
      return {
        ok: false,
        error: "No se pudo completar el registro. Verifica tus datos o inicia sesión.",
      };
    }
    return {
      ok: false,
      error: "No se pudo completar el registro. Intenta de nuevo.",
    };
  }

  return { ok: true };
}
