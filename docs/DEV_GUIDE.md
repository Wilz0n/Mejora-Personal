# 🛠️ Guía para Desarrolladores (Junior) — LifeTracker

Bienvenido/a al equipo. Esta guía te deja listo/a para **trabajar en el proyecto en tu computadora** sin miedo a romper producción. Está escrita para perfiles **junior**, así que explica el *por qué* de cada cosa, no sólo el *cómo*.

---

## 1. ¿Qué es este proyecto? (mapa mental rápido)

LifeTracker es una app de **hábitos + finanzas personales**. Lee `docs/AI_CONTEXT.md` para el detalle de arquitectura. En resumen:

- **Next.js 14 (App Router)** → framework. Las páginas viven en `src/app/`.
- **Server Components** para leer datos + **Server Actions** para guardarlos.
- **Prisma** → habla con la base de datos **PostgreSQL** (usamos **Neon**).
- **Zod** → valida formularios. **Tailwind** → estilos.
- **NextAuth** → login (opcional; en uso personal se apaga con el "Modo Usuario Único").

---

## 2. Qué instalar en tu entorno

| Herramienta | Versión | Para qué | Dónde |
|-------------|---------|----------|-------|
| **Node.js** | 18 o superior (LTS) | Ejecutar la app | https://nodejs.org |
| **Git** | cualquiera reciente | Control de versiones | https://git-scm.com |
| **Editor** | VS Code recomendado | Escribir código | https://code.visualstudio.com |
| **Cuenta Neon** | gratis | Tu base de datos de desarrollo | https://neon.tech |

Verifica Node y Git:

```bash
node --version   # v18+ 
git --version
```

> 💡 **Recomendación importante:** usa **tu propia base de datos de Neon para desarrollo**, distinta de la de producción. Así experimentas sin miedo a corromper los datos reales. Ver sección 6.

---

## 3. Clonar y arrancar en local (primera vez)

```bash
# 1. Clona el repositorio
git clone git@github.com:Wilz0n/Mejora-Personal.git
cd Mejora-Personal

# 2. Configuración guiada (crea .env.local, instala deps, crea tablas)
npm run setup
```

El script `npm run setup` te preguntará:
1. Tu `DATABASE_URL` (la de **tu** Neon de desarrollo).
2. Modo de autenticación → responde **S** (Modo Usuario Único) para desarrollar sin login.
3. Si quieres datos de ejemplo → **S** es útil para ver la app con contenido.

Cuando termine:

```bash
npm run dev
```

Abre **http://localhost:3000**. 🎉

### ¿Prefieres hacerlo manual?

```bash
npm install
cp .env.example .env.local
# edita .env.local (ver sección 4)
npx prisma db push     # crea las tablas en tu BD
npm run db:seed        # opcional: datos demo
npm run dev
```

### 🐳 Opción todo-en-uno con base de datos interna (`npm run dev:verify`)

Si **no quieres crear una cuenta de Neon** solo para probar, o quieres verificar rápido que el proyecto entero funciona de punta a punta, usa el verificador local. Levanta una **base de datos Postgres interna y temporal** dentro de un contenedor Docker, crea las tablas y compila la app — todo automático.

```bash
npm run dev:verify          # levanta BD interna + tablas + compila
SEED=true npm run dev:verify # además carga datos de ejemplo
```

Cuando termine, arranca normal con `npm run dev`.

**¿Cómo funciona y por qué?**
1. Comprueba que tengas **Docker** (es lo que provee la BD interna sin instalar Postgres a mano).
2. Levanta un contenedor `postgres:16-alpine` en el puerto **5433** (usa 5433 en vez de 5432 para **no chocar** con un Postgres que ya tengas instalado).
3. Respalda tu `.env.local` (si existe) y genera uno temporal apuntando a esa BD interna, en **Modo Usuario Único** (sin login) para que puedas entrar directo.
4. Corre `prisma generate` + `prisma db push` (crea las tablas) y luego `next build` (verifica que todo compila).

> 💡 **¿Por qué usar esto?** Es la forma más rápida de tener un entorno reproducible y **desechable**: cuando termines, borras la BD con `docker rm -f lifetracker-dev-db` y no queda rastro. Ideal para probar cambios sin ensuciar tu BD de desarrollo. Requiere **Docker** instalado (https://docs.docker.com/get-docker/).
>
> ⚙️ Flags: `SEED=true` (datos demo), `KEEP_DB=true` (no sugiere borrar la BD al final), `DEV_DB_PORT=5433` (cambia el puerto).

---

## 4. Variables de entorno (`.env.local`)

El archivo `.env.local` **nunca se sube a git** (está en `.gitignore`). Para desarrollo, con modo usuario único:

```bash
DATABASE_URL="postgresql://...tu-neon-de-DEV-pooler...neon.tech/neondb?sslmode=require"
SINGLE_USER_MODE="true"
NEXT_PUBLIC_SINGLE_USER_MODE="true"
```

Si quieres probar el **login real** (NextAuth) en local:

```bash
DATABASE_URL="postgresql://..."
SINGLE_USER_MODE="false"
NEXT_PUBLIC_SINGLE_USER_MODE="false"
NEXTAUTH_SECRET="genera-uno-con: openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"
```

> ⚠️ Detalle sobre Neon: para **migraciones** (`prisma db push`) usa la conexión **directa** (sin `-pooler` en el host); para la app en runtime da igual, pero la *pooled* es la recomendada. El `npm run setup` maneja esto por ti automáticamente.

---

## 5. Cómo está organizado el código (dónde tocar qué)

```
src/
├─ app/
│  ├─ (app)/            # páginas que requieren usuario
│  │  ├─ page.tsx       # Dashboard
│  │  ├─ habitos/       # Hábitos (vista semanal + mensual)
│  │  ├─ finanzas/      # Finanzas y proyectos
│  │  ├─ proyectos/     # Proyectos (en construcción)
│  │  ├─ settings/      # Ajustes y perfil
│  │  └─ support/       # Soporte (en construcción)
│  ├─ login, register   # páginas de auth
│  ├─ api/export/       # endpoint de exportación de datos (JSON/CSV)
│  └─ actions/          # Server Actions = aquí se GUARDAN los datos
│     ├─ habits.ts · finance.ts · settings.ts · auth.ts
├─ components/          # UI, organizada por dominio
│  ├─ comun/            # compartidos: Icon, Modal, Sidebar, Topbar,
│  │                    #   ProgressRing, ProjectModal (modal reutilizable)…
│  ├─ habitos/          # HabitCheckbox, AddHabitButton, MonthlyTracker
│  ├─ finanzas/         # AddProjectButton, FinanceModals
│  ├─ settings/         # CurrencySelect, EditProfileButton, PurgeDataButton
│  └─ auth/             # LoginForm, RegisterForm
├─ lib/                 # el "cerebro": lógica de negocio y acceso a datos
│  ├─ *-logic.ts        # cálculos puros (tasas, balances) — fáciles de testear
│  ├─ data.ts           # consultas a la BD (siempre filtran por userId)
│  ├─ session.ts        # getUserId() — identidad del usuario
│  └─ validators.ts     # esquemas Zod
└─ types/               # tipos TS
prisma/schema.prisma    # definición de la base de datos
scripts/setup.mjs       # instalador guiado (local)
scripts/dev-verify.mjs  # verificación local con BD interna (Docker)
scripts/deploy.mjs      # build de Vercel (crea tablas + compila, automático)
```

> 🗂️ **Nota sobre rutas:** las URLs están en **español** (`/habitos`, `/finanzas`, `/proyectos`, `/settings`). Los componentes se agrupan por la **página/dominio** al que pertenecen; los que se usan en varias páginas viven en `components/comun/`.

**Reglas del proyecto (respétalas):**
1. Toda consulta/guardado **filtra por `userId`** (viene de `getUserId()`). Nunca leas datos "de todos".
2. La **lógica de cálculo** va en `src/lib/*-logic.ts` como funciones puras. Las Server Actions sólo: autenticar → validar con Zod → guardar → `revalidatePath`.
3. `HabitLog.date` es un **string `"YYYY-MM-DD"`**. Usa los helpers de `src/lib/dates.ts`.
4. En componentes de cliente, importa `single-user-client.ts` (no `single-user.ts`, que usa Prisma).

---

## 6. 🌿 Trabajar en `dev` sin afectar producción (LO MÁS IMPORTANTE)

Este es el punto central. **Producción se despliega desde la rama `main`.** Nunca trabajes directo en `main`.

### Cómo están conectadas las ramas y Vercel

```
Rama main  ──▶  Vercel Producción  (https://wilnuxmejora.vercel.app)
Rama dev   ──▶  Vercel Preview     (URL temporal, NO afecta producción)
otras ramas ─▶  Vercel Preview     (cada push genera su preview)
```

Vercel crea un **deploy de preview** por cada rama/push que **no es `main`**. Eso te da una URL para probar tus cambios en internet **sin tocar la producción real**.

### Flujo de trabajo recomendado (paso a paso)

**1. Actualiza tu copia local antes de empezar:**
```bash
git checkout dev
git pull origin dev
```

**2. Crea una rama para tu tarea** (a partir de `dev`):
```bash
git checkout -b feature/mi-nueva-funcionalidad
```

**3. Desarrolla en local** con `npm run dev`, usando **tu** base de datos de Neon de desarrollo (no la de producción).

**4. Verifica que compila antes de subir:**
```bash
npm run build
```

**5. Sube tu rama:**
```bash
git add .
git commit -m "feat: describe tu cambio"
git push -u origin feature/mi-nueva-funcionalidad
```
Vercel generará una **URL de preview** automáticamente para revisar tus cambios.

**6. Integra a `dev` mediante Pull Request** (en GitHub): `feature/... → dev`. Prueba en el preview de `dev`.

**7. Cuando `dev` esté estable y quieras publicar**, abre un Pull Request `dev → main`. Al mergearlo, **Vercel despliega a producción**.

### Reglas de oro para no romper prod

- ✅ Trabaja siempre en ramas de feature o en `dev`.
- ✅ Usa una **base de datos de desarrollo separada** (otro proyecto en Neon).
- ✅ Corre `npm run build` localmente antes de subir.
- ❌ **Nunca** hagas `git push` directo a `main`.
- ❌ **Nunca** uses la `DATABASE_URL` de producción en tu `.env.local` para experimentar.
- ❌ **Nunca** hagas `git push --force` a ramas compartidas (`main`, `dev`).

> 💡 ¿Por qué una BD separada para dev? Porque en desarrollo vas a borrar, recrear tablas (`prisma db push`) y meter datos de prueba. Si usaras la BD de producción, arruinarías los datos reales del usuario.

---

## 7. Comandos útiles del día a día

| Comando | Qué hace |
|---------|----------|
| `npm run dev` | Servidor de desarrollo con recarga en caliente. **Antes de arrancar** ejecuta `predev` → sincroniza tu BD local con el schema automáticamente (`scripts/db-sync.mjs`) |
| `npm run dev:verify` | Levanta una **BD interna (Docker)**, crea tablas y compila — verificación de punta a punta |
| `npm run build` | Compila (¡córrelo antes de hacer push!) |
| `npm run setup` | Configuración guiada inicial (con tu Neon) |
| `npm run deploy` | Lo que ejecuta Vercel: crea tablas si hay `DATABASE_URL` + compila (no lo necesitas en local) |
| `npm run db:push` | Sincroniza el schema de Prisma con tu BD |
| `npm run db:seed` | Carga datos de demostración |
| `npx prisma studio` | Abre un panel visual para ver/editar la BD |

> 🔄 **Sobre `predev` (importante):** cada vez que corres `npm run dev`, se sincroniza tu BD local con el `schema.prisma` automáticamente. Así, al traer cambios que agregan columnas (ej. `currency`, `monthlySavings`), no tienes que acordarte de correr `prisma db push`. Es seguro: si no hay `DATABASE_URL` o la BD está apagada, **avisa pero no bloquea** el arranque. Puedes desactivarlo con `SKIP_DB_SYNC=true npm run dev`.

---

## 8. Cómo hacer cambios comunes (recetas)

**Agregar un campo a un modelo:**
1. Edita `prisma/schema.prisma`.
2. `npm run db:push` (contra tu BD de dev).
3. Ajusta `src/lib/data.ts` y la lógica/UI que lo use.

**Agregar una nueva métrica de hábitos:**
1. Escribe una función pura en `src/lib/habits-logic.ts`.
2. Úsala en la página correspondiente (`src/app/(app)/...`).

**Agregar una acción que guarde datos:**
1. Crea el esquema Zod en `src/lib/validators.ts`.
2. Crea la Server Action en `src/app/actions/...` (patrón: `getUserId` → `safeParse` → verificar propiedad → Prisma → `revalidatePath`).
3. Llámala desde un componente cliente con mutación optimista.

---

## 9. Solución de problemas en local

| Problema | Solución |
|----------|----------|
| `Environment variable not found: DATABASE_URL` | Falta o está vacío `.env.local`. Corre `npm run setup`. |
| Cambios en el schema no aparecen | Corre `npm run db:push` y reinicia `npm run dev`. |
| Error de tipos al compilar | Corre `npx tsc --noEmit` para ver el detalle. |
| La app pide login y no quiero | Pon `SINGLE_USER_MODE=true` y `NEXT_PUBLIC_SINGLE_USER_MODE=true` en `.env.local`. |
| `NO_SECRET` al usar login | Falta `NEXTAUTH_SECRET` en `.env.local`. |

---

## 10. Funcionalidades recientes (dónde vive cada una)

Estas son las features agregadas en el rediseño. Útil para saber qué archivo tocar.

**Hábitos**
- **Quitar hábito:** botón rojo "Quitar Hábito" (junto a "Añadir Hábito") → abre modal con la lista de hábitos. Componente: `src/components/habitos/RemoveHabitButton.tsx`. Acción: `deleteHabit` en `src/app/actions/habits.ts`.
- **Vista mensual (heatmap):** `src/components/habitos/MonthlyTracker.tsx` + helper `monthWeeks()` en `src/lib/dates.ts`.
- **Anillo de progreso:** `src/components/comun/ProgressRing.tsx`.

**Finanzas**
- **Quitar proyecto:** botón "-" en cada tarjeta → `src/components/finanzas/RemoveProjectButton.tsx` (acción `deleteProject`).
- **Quitar gasto fijo:** botón rojo "Quitar Gasto" → modal con lista → `src/components/finanzas/RemoveExpenseButton.tsx` (acción `deleteExpense`).
- **Modal reutilizable de proyecto:** `src/components/comun/ProjectModal.tsx` (base para otros popups).
- **Ahorro Mensual:** sección editable con el chanchito. Se **descuenta del balance**. Si no defines un monto, usa el **20% del ingreso** como sugerencia; puedes editarlo. Componente: `SetSavingsButton` en `FinanceModals.tsx`. Acción: `setMonthlySavings`. Lógica: `computeFinanceSummary` (resta el ahorro) y `suggestedSavings()` en `src/lib/finance-logic.ts`. Campo BD: `FinancialSummary.monthlySavings`.

**Ajustes / Perfil (`/settings`)**
- **Editar perfil:** `src/components/settings/EditProfileButton.tsx` (acción `updateProfile`).
**Ajustes / Perfil (`/settings`)**
- **Editar perfil (nombre + foto):** `src/components/settings/EditProfileButton.tsx` (acción `updateProfile`).
  - **Nombre:** al guardarlo se refleja en el saludo del Dashboard ("Hola, {nombre}") y en el topbar. La acción hace `revalidatePath("/", "layout")` para refrescar toda la app.
  - **Foto (avatar):** se **sube desde el equipo** y se **optimiza en el navegador** (canvas → recorte cuadrado 128×128 → compresión). Elige el formato más ligero disponible: **AVIF → WebP → JPEG → PNG**. Resultado ~5–15 KB, guardado como Data URL en `User.image` (no satura la BD). Acepta subir AVIF/PNG/WebP/JPG; recomienda AVIF.
  - El avatar se muestra en el **topbar** (`Topbar` recibe `avatar` desde `layout.tsx`) y en **Settings → Identidad**.
- **Moneda por defecto (USD/PEN):** `src/components/settings/CurrencySelect.tsx` (acción `setCurrency`). Campo BD: `FinancialSummary.currency`. Constantes/formato: `SUPPORTED_CURRENCIES` y `formatCurrency` en `finance-logic.ts`.
- **Exportar datos (JSON/CSV):** endpoint `src/app/api/export/route.ts` (usa `getUserExportData`).
- **Purgar datos de cuenta:** `src/components/settings/PurgeDataButton.tsx` (acción `purgeAccountData`, **destructiva**, con confirmación por palabra).
- Acciones de settings: `src/app/actions/settings.ts`.

**Automatización de BD y despliegue** (ver también `DEPLOYMENT.md`)
- `scripts/deploy.mjs` → buildCommand de Vercel: crea/sincroniza tablas si hay `DATABASE_URL` + compila.
- `scripts/dev-verify.mjs` → verificación local con BD interna (Docker).
- `scripts/db-sync.mjs` → hook `predev`: sincroniza tu BD local antes de `npm run dev`.

> 🧩 **Patrón para "quitar" algo:** botón cliente → modal con lista (o botón directo) → Server Action `deleteX` (que ya filtra por `userId`) → `revalidatePath`. Reutiliza los componentes `Remove*Button` existentes como plantilla.

### Notas de UI importantes (para no repetir bugs)

- **Modales = usa siempre `src/components/comun/Modal.tsx`.** Se renderiza con un **React Portal** en `document.body`. Esto es obligatorio porque las tarjetas usan `.glass-panel` (con `backdrop-filter`), y un ancestro con `backdrop-filter`/`transform` **atrapa** los elementos `position: fixed`. Sin el portal, los popups se muestran cortados/descentrados dentro de su tarjeta. No crees modales con `fixed` sueltos dentro de una tarjeta.
- **Topbar con `shrink-0`:** el header vive en un flex-column; sin `shrink-0` se comprime cuando la página tiene mucho contenido (se veía "aplastado" en Finanzas). Mantén `h-16 shrink-0`.
- **Subida de imágenes:** Vercel tiene filesystem efímero (no se pueden escribir archivos). Por eso el avatar se comprime y se guarda como Data URL en la BD. Si algún día se necesitan imágenes grandes o muchos usuarios, migrar a **Vercel Blob** (guardar solo la URL).

---

## 📚 Documentos relacionados

- **Arquitectura y funcionamiento interno** → `docs/AI_CONTEXT.md`
- **Instalación y despliegue completo** → `DEPLOYMENT.md`
- **Manual de uso de la app** → `USER_GUIDE.md`
- **Guía para usuario final (no técnico)** → `docs/GUIA_USUARIO.md`
