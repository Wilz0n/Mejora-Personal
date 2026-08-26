#!/usr/bin/env node
/**
 * LifeTracker · Script de configuración automatizada
 * ---------------------------------------------------
 * Deja la app lista para usar en local:
 *   1. Obtiene tu DATABASE_URL de Neon (u otro Postgres).
 *   2. Elige el modo: Usuario Único (sin login) o con login.
 *   3. Genera el archivo .env.local.
 *   4. Instala dependencias (npm install).
 *   5. Crea las tablas en la base de datos (prisma db push).
 *   6. (Opcional) Carga datos de demostración (db:seed).
 *
 * MODO INTERACTIVO:      npm run setup
 * MODO NO INTERACTIVO:   (útil para automatizar)
 *   DATABASE_URL="postgres://..." SINGLE_USER_MODE=true SEED=false npm run setup -- --yes
 *
 * Es cross-platform (Windows, macOS, Linux) y no requiere bash.
 */

import readline from "node:readline";
import { execSync } from "node:child_process";
import { existsSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";

const ENV_FILE = ".env.local";
const NON_INTERACTIVE = process.argv.includes("--yes") || process.argv.includes("-y");

const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  dim: "\x1b[2m",
};
const log = (m = "") => console.log(m);
const title = (m) => log(`\n${c.bold}${c.cyan}${m}${c.reset}`);
const ok = (m) => log(`${c.green}✓${c.reset} ${m}`);
const warn = (m) => log(`${c.yellow}⚠${c.reset}  ${m}`);
const err = (m) => log(`${c.red}✗${c.reset} ${m}`);

function run(cmd, env = {}) {
  execSync(cmd, { stdio: "inherit", env: { ...process.env, ...env } });
}

/** Normaliza la connection string de Neon para Prisma. */
function normalizeUrl(url) {
  let out = url.trim().replace(/^["']|["']$/g, "");
  out = out.replace(/[?&]channel_binding=require/gi, "");
  out = out.replace(/&&+/g, "&").replace(/[?&]$/, "");
  if (!out.includes("?") && out.includes("&")) out = out.replace("&", "?");
  out = out.replace(/\?&/, "?");
  if (!/sslmode=/i.test(out)) {
    out += (out.includes("?") ? "&" : "?") + "sslmode=require";
  }
  return out;
}

/** Variante directa (sin -pooler) para migraciones. */
function directUrl(url) {
  return url.replace("-pooler.", ".");
}

// ── Pequeño lector de líneas basado en eventos (fiable con pipes) ──
function makePrompter() {
  const rl = readline.createInterface({ input: process.stdin });
  const queue = [];
  let waiting = null;
  let closed = false;

  rl.on("line", (line) => {
    if (waiting) {
      const w = waiting;
      waiting = null;
      w(line);
    } else {
      queue.push(line);
    }
  });
  rl.on("close", () => {
    closed = true;
    if (waiting) {
      const w = waiting;
      waiting = null;
      w(null); // EOF
    }
  });

  const nextLine = () =>
    new Promise((resolve) => {
      if (queue.length) return resolve(queue.shift());
      if (closed) return resolve(null);
      waiting = resolve;
    });

  return {
    close: () => rl.close(),
    async ask(question, def = "") {
      process.stdout.write(
        def ? `${question} ${c.dim}(${def})${c.reset}: ` : `${question}: `,
      );
      const line = await nextLine();
      return line == null ? "" : line;
    },
    async askYesNo(question, def = true) {
      const hint = def ? "S/n" : "s/N";
      process.stdout.write(`${question} ${c.dim}[${hint}]${c.reset}: `);
      const line = await nextLine();
      const a = (line ?? "").trim().toLowerCase();
      if (!a) return def;
      return ["s", "si", "sí", "y", "yes"].includes(a);
    },
  };
}

async function main() {
  const p = makePrompter();

  log(`${c.bold}${c.cyan}
╔══════════════════════════════════════════╗
║        LifeTracker · Setup local          ║
╚══════════════════════════════════════════╝${c.reset}`);
  log(
    `${c.dim}Antes de continuar necesitas una base de datos Postgres.\n` +
      `Crea una gratis en https://neon.tech y copia su connection string.\n` +
      `Ejemplo:\n` +
      `  postgresql://usuario:password@ep-xxxx-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require${c.reset}`,
  );

  // 1) DATABASE_URL (por env en modo no interactivo, o preguntando)
  title("1) Base de datos");
  let dbUrl = process.env.DATABASE_URL?.trim() || "";
  if (NON_INTERACTIVE) {
    if (!dbUrl) {
      err("Modo --yes requiere la variable DATABASE_URL definida.");
      p.close();
      process.exit(1);
    }
  } else {
    while (true) {
      const answer = await p.ask(
        "Pega tu DATABASE_URL de Neon/Postgres",
        dbUrl ? "usar la del entorno" : "",
      );
      const candidate = answer.trim() || dbUrl;
      if (!candidate) {
        warn("La DATABASE_URL es obligatoria.");
        continue;
      }
      if (!/^postgres(ql)?:\/\//i.test(candidate)) {
        warn("Debe empezar con postgres:// o postgresql://. Inténtalo de nuevo.");
        continue;
      }
      dbUrl = candidate;
      break;
    }
  }
  dbUrl = normalizeUrl(dbUrl);
  ok("DATABASE_URL registrada.");

  // 2) Modo de uso
  title("2) Modo de autenticación");
  log(
    `${c.dim}· Usuario Único: entras directo, sin login (ideal uso personal).\n` +
      `· Con login: registro/inicio de sesión con email y contraseña.${c.reset}`,
  );
  let singleUser;
  if (NON_INTERACTIVE) {
    singleUser = String(process.env.SINGLE_USER_MODE ?? "true").toLowerCase() === "true";
    log(`Modo usuario único: ${singleUser ? "sí" : "no"} (por variable de entorno)`);
  } else {
    singleUser = await p.askYesNo("¿Usar Modo Usuario Único (sin login)?", true);
  }

  // 3) Generar .env.local
  title("3) Generando .env.local");
  let writeEnv = true;
  if (existsSync(ENV_FILE) && !NON_INTERACTIVE) {
    writeEnv = await p.askYesNo(`Ya existe ${ENV_FILE}. ¿Sobrescribir?`, false);
    if (!writeEnv) warn(`Conservando ${ENV_FILE} existente.`);
  }

  const secret = randomBytes(32).toString("base64");
  const lines = [
    `# Generado por 'npm run setup' el ${new Date().toISOString()}`,
    `DATABASE_URL="${dbUrl}"`,
    "",
  ];
  if (singleUser) {
    lines.push(
      "# Modo Usuario Único (sin login)",
      'SINGLE_USER_MODE="true"',
      'NEXT_PUBLIC_SINGLE_USER_MODE="true"',
    );
  } else {
    lines.push(
      "# Modo con login (NextAuth)",
      'SINGLE_USER_MODE="false"',
      'NEXT_PUBLIC_SINGLE_USER_MODE="false"',
      `NEXTAUTH_SECRET="${secret}"`,
      'NEXTAUTH_URL="http://localhost:3000"',
    );
  }
  if (writeEnv) {
    writeFileSync(ENV_FILE, lines.join("\n") + "\n");
    ok(`${ENV_FILE} creado.`);
  }

  // 4) Instalar dependencias
  title("4) Instalando dependencias (npm install)");
  try {
    run("npm install");
    ok("Dependencias instaladas.");
  } catch {
    err("Falló npm install.");
    p.close();
    process.exit(1);
  }

  // 5) Crear tablas (usa conexión directa para migraciones)
  title("5) Creando tablas (prisma db push)");
  const migrationUrl = directUrl(dbUrl);
  try {
    run("npx prisma db push", { DATABASE_URL: migrationUrl });
    ok("Tablas creadas / sincronizadas.");
  } catch {
    err("Falló prisma db push. Verifica tu DATABASE_URL y el acceso a la BD.");
    p.close();
    process.exit(1);
  }

  // 6) Seed opcional
  title("6) Datos de demostración (opcional)");
  let seed;
  if (NON_INTERACTIVE) {
    seed = String(process.env.SEED ?? "false").toLowerCase() === "true";
  } else {
    seed = await p.askYesNo("¿Cargar datos de ejemplo?", false);
  }
  if (seed) {
    try {
      run("npm run db:seed", { DATABASE_URL: migrationUrl });
      ok("Datos demo cargados (demo@lifetracker.app / password123).");
    } catch {
      warn("El seed falló, pero la app ya está lista igualmente.");
    }
  }

  p.close();

  log(`\n${c.green}${c.bold}¡Listo! 🎉${c.reset}`);
  log("Inicia la app con:");
  log(`  ${c.cyan}npm run dev${c.reset}`);
  log(`Y abre ${c.cyan}http://localhost:3000${c.reset}`);
  if (!singleUser) {
    log(`${c.dim}Modo con login: ve a /register para crear tu cuenta.${c.reset}`);
  }
  process.exit(0);
}

main().catch((e) => {
  err("Error inesperado en el setup:");
  console.error(e);
  process.exit(1);
});
