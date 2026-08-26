#!/usr/bin/env node
/**
 * LifeTracker · Sincronización de schema para desarrollo local
 * ------------------------------------------------------------
 * Se ejecuta automáticamente ANTES de `npm run dev` (hook `predev`).
 * Mantiene tu base de datos LOCAL al día con `prisma/schema.prisma`, de modo
 * que al traer cambios nuevos (p. ej. columnas `currency`, `monthlySavings`)
 * no tengas que acordarte de correr `prisma db push` a mano.
 *
 * Comportamiento seguro (no rompe tu flujo):
 *   - Si hay DATABASE_URL (en .env.local / .env): corre `prisma db push`.
 *   - Si NO hay DATABASE_URL o falla la conexión: avisa y continúa (no aborta
 *     el arranque de dev), para no bloquear cuando trabajas sin BD.
 *   - Se puede desactivar con SKIP_DB_SYNC=true.
 */

import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const c = {
  reset: "\x1b[0m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  dim: "\x1b[2m",
};
const ok = (m) => console.log(`${c.green}✓${c.reset} ${m}`);
const warn = (m) => console.log(`${c.yellow}⚠${c.reset}  ${m}`);
const info = (m) => console.log(`${c.dim}${m}${c.reset}`);

if (String(process.env.SKIP_DB_SYNC ?? "").toLowerCase() === "true") {
  info("db-sync omitido (SKIP_DB_SYNC=true).");
  process.exit(0);
}

/** Busca DATABASE_URL en el entorno o en .env.local / .env. */
function findDatabaseUrl() {
  if (process.env.DATABASE_URL?.trim()) return process.env.DATABASE_URL.trim();
  for (const file of [".env.local", ".env"]) {
    if (existsSync(file)) {
      const line = readFileSync(file, "utf8")
        .split("\n")
        .find((l) => l.trim().startsWith("DATABASE_URL="));
      if (line) {
        return line
          .slice(line.indexOf("=") + 1)
          .trim()
          .replace(/^["']|["']$/g, "");
      }
    }
  }
  return "";
}

const dbUrl = findDatabaseUrl();

if (!dbUrl) {
  warn(
    "No hay DATABASE_URL configurada. Se omite la sincronización de la BD.\n" +
      "  Configúrala con 'npm run setup' o usa 'npm run dev:verify' (BD interna).",
  );
  process.exit(0);
}

// Para migraciones/DDL, Neon recomienda la conexión directa (sin -pooler).
const directUrl = dbUrl.replace("-pooler.", ".");

try {
  console.log(`${c.cyan}▶ Sincronizando tu BD local con el schema...${c.reset}`);
  execSync("npx prisma db push --skip-generate", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: directUrl },
  });
  ok("Base de datos local sincronizada.");
} catch {
  warn(
    "No se pudo sincronizar la BD (¿sin conexión o BD apagada?).\n" +
      "  El servidor de desarrollo arrancará igual. Si ves errores de columnas,\n" +
      "  corre manualmente: npx prisma db push",
  );
}

// ─── Validación de variables de entorno ────────────────────────────────────
// Avisa de configuraciones innecesarias o conflictivas, sin bloquear el arranque.
validateEnvVars();

function loadEnvVar(name) {
  if (process.env[name]?.trim()) return process.env[name].trim();
  for (const file of [".env.local", ".env"]) {
    if (existsSync(file)) {
      const line = readFileSync(file, "utf8")
        .split("\n")
        .find((l) => l.trim().startsWith(`${name}=`));
      if (line) {
        return line
          .slice(line.indexOf("=") + 1)
          .trim()
          .replace(/^["']|["']$/g, "");
      }
    }
  }
  return "";
}

function validateEnvVars() {
  const singleUser = loadEnvVar("SINGLE_USER_MODE").toLowerCase() === "true";
  const singleUserPublic = loadEnvVar("NEXT_PUBLIC_SINGLE_USER_MODE").toLowerCase() === "true";
  const hasNextAuthSecret = !!loadEnvVar("NEXTAUTH_SECRET");
  const hasNextAuthUrl = !!loadEnvVar("NEXTAUTH_URL");

  console.log(`\n${c.cyan}▶ Validando variables de entorno...${c.reset}`);

  let warnings = 0;

  // Inconsistencia entre SINGLE_USER_MODE y NEXT_PUBLIC_SINGLE_USER_MODE
  if (singleUser !== singleUserPublic) {
    warn(
      "SINGLE_USER_MODE y NEXT_PUBLIC_SINGLE_USER_MODE tienen valores distintos.\n" +
        "  Deben coincidir (ambas 'true' o ambas 'false'). Si no, el servidor\n" +
        "  y el cliente se comportarán de forma diferente.",
    );
    warnings++;
  }

  if (singleUser) {
    // Modo Usuario Único: NEXTAUTH_* son innecesarias
    if (hasNextAuthSecret) {
      warn(
        "NEXTAUTH_SECRET está definida pero no se usa (modo usuario único).\n" +
          "  Puedes quitarla para mantener la configuración limpia.",
      );
      warnings++;
    }
    if (hasNextAuthUrl) {
      warn(
        "NEXTAUTH_URL está definida pero no se usa (modo usuario único).\n" +
          "  Puedes quitarla para mantener la configuración limpia.",
      );
      warnings++;
    }
  } else {
    // Modo con login: NEXTAUTH_* son obligatorias
    if (!hasNextAuthSecret) {
      warn(
        "NEXTAUTH_SECRET no está definida. Es obligatoria en modo con login.\n" +
          "  Genera una con: openssl rand -base64 32\n" +
          "  Sin ella, NextAuth fallará con error NO_SECRET.",
      );
      warnings++;
    }
    if (!hasNextAuthUrl) {
      warn(
        "NEXTAUTH_URL no está definida. Es obligatoria en modo con login.\n" +
          '  Para desarrollo local usa: NEXTAUTH_URL="http://localhost:3000"',
      );
      warnings++;
    }
  }

  if (warnings === 0) {
    ok("Variables de entorno correctas.");
  } else {
    info(
      `  ${warnings} aviso(s). La app arrancará igual, pero revisa tu .env.local.\n` +
        "  Ver .env.example para la configuración recomendada.",
    );
  }
}

process.exit(0);
