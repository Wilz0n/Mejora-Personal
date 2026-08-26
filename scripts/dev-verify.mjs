#!/usr/bin/env node
/**
 * LifeTracker · Verificación local para el desarrollador
 * ------------------------------------------------------
 * Levanta TODO el proyecto en local con una base de datos INTERNA y efímera,
 * para verificar que el proyecto funciona de punta a punta antes de desplegar.
 *
 *   1. Comprueba Docker (para la BD interna Postgres).
 *   2. Levanta un Postgres efímero en un contenedor (puerto configurable).
 *   3. Genera un .env.local temporal en modo Usuario Único (sin login).
 *   4. prisma generate + prisma db push  -> crea las tablas.
 *   5. (Opcional) seed de datos demo con SEED=true.
 *   6. next build                          -> valida que compila.
 *   7. Deja instrucciones para `npm run dev`.
 *
 * Uso:
 *   npm run dev:verify              # levanta BD interna, migra y compila
 *   SEED=true npm run dev:verify    # además carga datos de ejemplo
 *   KEEP_DB=true npm run dev:verify # no detiene el contenedor al terminar
 *
 * Requiere Docker instalado y corriendo. Cross-platform.
 */

import { execSync, spawnSync } from "node:child_process";
import { existsSync, writeFileSync, renameSync } from "node:fs";
import { randomBytes } from "node:crypto";

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

const CONTAINER = "lifetracker-dev-db";
const DB_PORT = process.env.DEV_DB_PORT || "5433"; // 5433 para no chocar con un Postgres local en 5432
const DB_USER = "lifetracker";
const DB_PASS = "lifetracker";
const DB_NAME = "lifetracker_dev";
const DATABASE_URL = `postgresql://${DB_USER}:${DB_PASS}@localhost:${DB_PORT}/${DB_NAME}?sslmode=disable`;
const ENV_FILE = ".env.local";
const KEEP_DB = String(process.env.KEEP_DB ?? "false").toLowerCase() === "true";
const SEED = String(process.env.SEED ?? "false").toLowerCase() === "true";

function run(cmd, env = {}) {
  execSync(cmd, { stdio: "inherit", env: { ...process.env, ...env } });
}
function silent(cmd) {
  return spawnSync(cmd, { shell: true, encoding: "utf8" });
}
function hasDocker() {
  const r = silent("docker --version");
  return r.status === 0;
}
function dockerRunning() {
  const r = silent("docker info");
  return r.status === 0;
}

function startDb() {
  // Si ya existe el contenedor, reinícialo; si no, créalo.
  const exists = silent(`docker ps -a --filter "name=^/${CONTAINER}$" --format "{{.Names}}"`)
    .stdout.trim();
  if (exists === CONTAINER) {
    run(`docker start ${CONTAINER}`);
  } else {
    run(
      `docker run -d --name ${CONTAINER} ` +
        `-e POSTGRES_USER=${DB_USER} -e POSTGRES_PASSWORD=${DB_PASS} -e POSTGRES_DB=${DB_NAME} ` +
        `-p ${DB_PORT}:5432 postgres:16-alpine`,
    );
  }
}

/** Espera a que Postgres acepte conexiones (pg_isready dentro del contenedor). */
function waitForDb(timeoutMs = 60000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const r = silent(`docker exec ${CONTAINER} pg_isready -U ${DB_USER} -d ${DB_NAME}`);
    if (r.status === 0 && /accepting connections/.test(r.stdout)) return true;
    silent("node -e \"setTimeout(()=>{},1000)\""); // pequeña pausa cross-platform
  }
  return false;
}

function writeEnv() {
  // Respaldar .env.local existente para no pisar la config del desarrollador.
  if (existsSync(ENV_FILE)) {
    const backup = `${ENV_FILE}.bak-${Date.now()}`;
    renameSync(ENV_FILE, backup);
    warn(`Respaldé tu ${ENV_FILE} en ${backup}`);
  }
  const secret = randomBytes(32).toString("base64");
  const content = [
    `# Generado por 'npm run dev:verify' el ${new Date().toISOString()}`,
    `# BD interna efímera (Docker). NO usar en producción.`,
    `DATABASE_URL="${DATABASE_URL}"`,
    "",
    "# Modo Usuario Único (sin login) para verificación rápida",
    'SINGLE_USER_MODE="true"',
    'NEXT_PUBLIC_SINGLE_USER_MODE="true"',
    `NEXTAUTH_SECRET="${secret}"`,
    'NEXTAUTH_URL="http://localhost:3000"',
    "",
  ].join("\n");
  writeFileSync(ENV_FILE, content);
  ok(`${ENV_FILE} generado (apunta a la BD interna).`);
}

async function main() {
  console.log(`${c.bold}${c.cyan}
╔══════════════════════════════════════════╗
║   LifeTracker · Verificación local (dev)  ║
╚══════════════════════════════════════════╝${c.reset}`);

  step("1/6 · Comprobando Docker");
  if (!hasDocker()) {
    err("Docker no está instalado. Instálalo desde https://docs.docker.com/get-docker/");
    process.exit(1);
  }
  if (!dockerRunning()) {
    err("Docker está instalado pero no en ejecución. Inícialo y reintenta.");
    process.exit(1);
  }
  ok("Docker disponible.");

  step("2/6 · Levantando base de datos interna (Postgres efímero)");
  startDb();
  process.stdout.write(`${c.dim}Esperando a que Postgres acepte conexiones...${c.reset}\n`);
  if (!waitForDb()) {
    err("La base de datos no respondió a tiempo.");
    process.exit(1);
  }
  ok(`Postgres interno listo en localhost:${DB_PORT} (db: ${DB_NAME}).`);

  step("3/6 · Generando .env.local temporal");
  writeEnv();

  step("4/6 · Generando cliente y creando tablas");
  run("npx prisma generate");
  run("npx prisma db push", { DATABASE_URL });
  ok("Esquema aplicado a la BD interna.");

  step("5/6 · Datos de demostración");
  if (SEED) {
    run("npm run db:seed", { DATABASE_URL });
    ok("Datos demo cargados.");
  } else {
    console.log(`${c.dim}Omitido (usa SEED=true para cargar datos de ejemplo).${c.reset}`);
  }

  step("6/6 · Compilando la app (next build)");
  run("npx next build", { DATABASE_URL });
  ok("La app compila correctamente contra la BD interna.");

  console.log(`\n${c.green}${c.bold}Verificación local lista 🎉${c.reset}`);
  console.log("Arranca la app en modo desarrollo con:");
  console.log(`  ${c.cyan}npm run dev${c.reset}   → http://localhost:3000`);
  console.log(
    `${c.dim}La BD interna sigue corriendo en el contenedor '${CONTAINER}'.${c.reset}`,
  );

  if (!KEEP_DB) {
    console.log(
      `\n${c.dim}Para detener y eliminar la BD interna cuando termines:\n` +
        `  docker rm -f ${CONTAINER}${c.reset}`,
    );
  }
}

main().catch((e) => {
  err("Falló la verificación local:");
  console.error(e?.message ?? e);
  process.exit(1);
});
