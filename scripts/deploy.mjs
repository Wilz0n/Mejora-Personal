#!/usr/bin/env node
/**
 * LifeTracker · Script de despliegue automático (Vercel)
 * ------------------------------------------------------
 * Se ejecuta como buildCommand en Vercel. Su objetivo es que, una vez que
 * Neon está conectado al proyecto en Vercel (es decir, existe DATABASE_URL en
 * las variables de entorno), TODO el despliegue ocurra solo, sin pasos manuales:
 *
 *   1. prisma generate           -> genera el cliente Prisma (siempre).
 *   2. prisma db push            -> crea/sincroniza las tablas en Neon
 *                                   (solo si hay DATABASE_URL). Idempotente y
 *                                   no destructivo: aplica diferencias del
 *                                   schema sin borrar datos existentes.
 *   3. next build                -> compila la app Next.js (siempre).
 *
 * Arranque limpio: NO ejecuta seed. La base de datos queda vacía y lista.
 *
 * Si NO hay DATABASE_URL (p. ej. un preview build sin BD conectada), omite el
 * db push para no fallar el build, y solo genera cliente + compila.
 *
 * Es cross-platform y no depende de bash.
 */

import { execSync } from "node:child_process";

const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  dim: "\x1b[2m",
};
const step = (m) => console.log(`\n${c.bold}${c.cyan}▶ ${m}${c.reset}`);
const ok = (m) => console.log(`${c.green}✓${c.reset} ${m}`);
const warn = (m) => console.log(`${c.yellow}⚠${c.reset}  ${m}`);
const err = (m) => console.log(`${c.red}✗${c.reset} ${m}`);

function run(cmd, env = {}) {
  execSync(cmd, { stdio: "inherit", env: { ...process.env, ...env } });
}

/**
 * Variante directa (sin -pooler) de la connection string, recomendada por
 * Neon para migraciones/DDL. Si no aplica, devuelve la misma URL.
 */
function directUrl(url) {
  return url.replace("-pooler.", ".");
}

async function main() {
  console.log(`${c.bold}${c.cyan}
╔══════════════════════════════════════════╗
║      LifeTracker · Deploy automático      ║
╚══════════════════════════════════════════╝${c.reset}`);

  const dbUrl = process.env.DATABASE_URL?.trim();

  // 1) Cliente Prisma (siempre).
  step("1/3 · Generando cliente Prisma");
  run("npx prisma generate");
  ok("Cliente Prisma generado.");

  // 2) Sincronizar schema con la BD (solo si hay DATABASE_URL).
  step("2/3 · Sincronizando base de datos");
  if (dbUrl) {
    // `prisma db push` es idempotente y, por defecto, NO acepta pérdida de
    // datos (aborta si un cambio implicara borrar datos). Seguro en cada deploy.
    run("npx prisma db push --skip-generate", {
      DATABASE_URL: directUrl(dbUrl),
    });
    ok("Esquema sincronizado con la base de datos (Neon).");
  } else {
    warn(
      "DATABASE_URL no definida: se omite la sincronización de la BD.\n" +
        "  (Conecta Neon en Vercel para que las tablas se creen automáticamente.)",
    );
  }

  // 3) Compilar Next.js (siempre). Arranque limpio: sin seed.
  step("3/3 · Compilando la aplicación (next build)");
  run("npx next build");
  ok("Aplicación compilada.");

  console.log(`\n${c.green}${c.bold}Deploy listo 🎉${c.reset}`);
  console.log(
    `${c.dim}La app arranca limpia (sin datos de demo). ` +
      `El usuario crea su cuenta/entra según el modo configurado.${c.reset}`,
  );
}

main().catch((e) => {
  err("Falló el despliegue automático:");
  console.error(e?.message ?? e);
  process.exit(1);
});
