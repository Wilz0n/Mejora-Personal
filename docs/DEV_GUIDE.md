# 🛠️ Guía para Desarrolladores — LifeTracker

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

### Estandarización de variables (qué definir y qué NO)

La app tiene **dos modos** de autenticación. Cada modo necesita un set específico de variables. No mezcles variables de un modo con el otro: confunde y puede dar errores inesperados.

| Variable | Modo A (personal, sin login) | Modo B (con login) |
|----------|:---:|:---:|
| `DATABASE_URL` | ✅ Obligatoria | ✅ Obligatoria |
| `SINGLE_USER_MODE` | ✅ `"true"` | ✅ `"false"` |
| `NEXT_PUBLIC_SINGLE_USER_MODE` | ✅ `"true"` | ✅ `"false"` |
| `NEXTAUTH_SECRET` | ❌ **No definir** | ✅ Obligatoria |
| `NEXTAUTH_URL` | ❌ **No definir** | ✅ Obligatoria |

**Regla de oro:** en modo usuario único (`SINGLE_USER_MODE=true`), NO definas `NEXTAUTH_SECRET` ni `NEXTAUTH_URL`. La app las ignora, pero tenerlas ensucia la configuración y puede confundir a otros desarrolladores. Si ya las tienes (en Vercel o en `.env.local`) no rompe nada, pero la validación de arranque te lo advertirá.

#### Validación automática al arrancar (`predev`)

El hook `predev` (`scripts/db-sync.mjs`) incluye una **validación de variables** que se ejecuta cada vez que corres `npm run dev`. Detecta:

- **Inconsistencia** entre `SINGLE_USER_MODE` y `NEXT_PUBLIC_SINGLE_USER_MODE` (deben coincidir).
- **Variables innecesarias** para tu modo: te avisa si definiste `NEXTAUTH_*` con modo usuario único activo.
- **Variables faltantes** para tu modo: te avisa si falta `NEXTAUTH_SECRET` o `NEXTAUTH_URL` en modo login.

**Solo avisa, nunca bloquea.** Verás los avisos amarillos (`⚠`) justo antes de que arranque el servidor de desarrollo. Si todo está correcto, verás `✓ Variables de entorno correctas.`

#### Configuración en Vercel (producción)

Para uso personal, la configuración mínima en Vercel es:

```
DATABASE_URL = postgresql://...tu-neon-pooler.../neondb?sslmode=require
SINGLE_USER_MODE = true
NEXT_PUBLIC_SINGLE_USER_MODE = true
```

Solo 3 variables. No necesitas `NEXTAUTH_SECRET` ni `NEXTAUTH_URL` en modo usuario único. El script de deploy (`scripts/deploy.mjs`) crea las tablas automáticamente al detectar `DATABASE_URL`.

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
- **Marcar gasto como pagado (doble clic/tap):** `src/components/finanzas/FixedExpenseItem.tsx` — client component. Detecta doble clic (desktop) y doble tap (móvil, timeout 300ms). Toggle optimista del campo `paidThisMonth` vía acción `toggleExpensePaid` en `src/app/actions/finance.ts`. Visual: fondo `bg-green-500/15` + borde verde + icono `check_circle` filled + line-through + badge `verified`. Tip informativo verde (fuera del panel, arriba de la sección Gastos Fijos) explica la interacción al usuario. Campo BD: `FixedExpense.paidThisMonth` (Boolean, default false).
- **Abono mensual a proyectos:** botón verde "+" → `src/components/finanzas/ContributeButton.tsx` (acción `contributeToProject`). Suma el `monthlyContribution` (definido al crear el proyecto = monto inicial) a `allocatedAmount`, topado a la meta. Al alcanzar la meta marca `completedAt` → el proyecto queda **cumplido** y **deja de descontar del balance** (`computeFinanceSummary` solo resta proyectos activos). Campos BD: `ProjectGoal.monthlyContribution` y `ProjectGoal.completedAt`.
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

### Mejoras recientes (segunda iteración)

**Finanzas — Guardar Finanza (cierre mensual)**
- **Modelo BD:** `MonthlyFinance` en `prisma/schema.prisma` — snapshot mensual con unique `(userId, month)`. Campos: `monthlyIncome`, `monthlySavings`, `totalFixedExpenses`, `availableBalance`, `currency`, `expensesByCategory` (JSON text), `projectsSnapshot` (JSON text).
- **Lógica pura:** `computeExpenseBreakdown()`, `computeProjectsSnapshot()`, `currentMonthKey()` en `src/lib/finance-logic.ts`.
- **Server Action:** `saveMonthlyFinance()` en `src/app/actions/finance.ts` — lee config actual del usuario, calcula resumen, upsert por `(userId, month)`. No recibe input del cliente.
- **Data:** `getMonthlyFinance(userId, month?)` en `src/lib/data.ts` — lee el cierre más reciente o por mes específico. Parsea JSON, convierte Decimal→number.
- **Componente:** `src/components/finanzas/SaveFinanceButton.tsx` — client component con `useTransition`, guarda y navega a `/finanzas/mes`.
- **Página:** `src/app/(app)/finanzas/mes/page.tsx` — `force-dynamic`, KPIs, Metas Activas (`projectsSnapshot`), Categorías de Gastos (estilo `ProgressRing` + tarjetas barra vertical). Empty state si no hay cierre.

**Finanzas — Confirmación al borrar proyecto**
- **Componente:** `src/components/finanzas/RemoveProjectButton.tsx` — ahora abre un `Modal` de confirmación con texto "¿Seguro que quieres borrar tu proyecto [nombre]?" y botones check verde / X roja. La acción `deleteProject` solo se ejecuta al confirmar.

**Hábitos — Tracker Semanal rediseñado**
- **Función** `WeeklyTracker` en `src/app/(app)/habitos/page.tsx` — convertida de tabla HTML a grid CSS (`grid-cols-[1fr_repeat(8,40px)]`), filas como tarjetas con fondo/borde, ícono en badge, mismo estilo visual que el MonthlyTracker.

**Hábitos — Tracker Mensual solo lectura**
- `HabitCheckbox` (`src/components/habitos/HabitCheckbox.tsx`): nueva prop `readOnly`. En readonly renderiza un `div` (no botón) directamente desde `initialCompleted` (la prop), evitando el bug de estado local "pegado" al cambiar de semana.
- `MonthlyTracker` (`src/components/habitos/MonthlyTracker.tsx`): pasa `readOnly` a cada celda. Auto-selecciona la semana que contiene hoy (`weeks.findIndex`). Keys por `dayKey` (no por índice) para forzar refresco al cambiar de semana. Leyenda actualizada a estados reales + indicador "🔒 Solo lectura".

**Dashboard — Distribución Financiera con barra de Proyectos**
- `src/app/(app)/page.tsx`: quitado bloque "Proyecto destacado". `FinanceChart` recibe nueva prop `projects`. Se agrega barra "Proyectos" (color `bg-tertiary`) entre Ahorro y Disponible. Leyenda actualizada con 4 puntos. La barra "Ahorro" ahora usa `protectedSavings` (valor real) en vez de `totalAllocated`.

**Layout — Fix responsive móvil Hábitos**
- `src/app/(app)/habitos/page.tsx`: fila de controles usa `flex-col sm:flex-row` para apilar en móvil.
- `src/components/habitos/AddHabitButton.tsx` y `RemoveHabitButton.tsx`: `whitespace-nowrap` + `flex-1 sm:flex-none` para evitar partición de texto.
- `src/app/(app)/layout.tsx`: `min-w-0 overflow-x-hidden` en contenedor de contenido para eliminar scroll horizontal de página.

**Iconos (hábitos y gastos)**
- Los iconos son de **Material Symbols Outlined** (Google Fonts, cargados en el layout root). El componente `src/components/comun/Icon.tsx` renderiza `<span class="material-symbols-outlined">{name}</span>`; `name` es el nombre exacto del ícono en Material Symbols. La prop `filled` activa el relleno (`FILL 1`).
- **Hábitos:** el catálogo está en el array `ICON_OPTIONS` dentro de `src/components/habitos/AddHabitButton.tsx` (~33 iconos). Se guarda en `Habit.icon`. Para agregar más, añade el string del nombre del ícono a ese array.
- **Gastos fijos:** el catálogo está en `EXPENSE_ICONS` dentro de `src/components/finanzas/FinanceModals.tsx` (16 iconos). Se guarda en `FixedExpense.icon` (default `receipt_long`). La página `/finanzas` muestra el ícono guardado, con fallback a la heurística `expenseIcon(category)` (adivina por el nombre) para gastos antiguos sin ícono explícito.
- **Nombres válidos:** catálogo en https://fonts.google.com/icons (estilo *Outlined*).

> 🗄️ **Nota:** Para sincronizar estos cambios con tu BD de desarrollo, corre `npm run db:push`. Creará la tabla `MonthlyFinance`, el campo `icon` en `FixedExpense` y el campo `paidThisMonth` en `FixedExpense` sin borrar datos existentes. En Vercel, `scripts/deploy.mjs` lo hace automáticamente durante el despliegue.

---

## 11. Cómo funciona cada página (y por qué)

Guía rápida de dónde tocar y por qué cada página está diseñada así.

### Dashboard — `src/app/(app)/page.tsx`
Server Component `force-dynamic`. Lee en paralelo hábitos de hoy, hábitos de la semana y finanzas vía `data.ts`, y deriva KPIs con las funciones `compute*` de `lib`. Muestra 4 KPIs, "Hábitos de Hoy" (`HabitCheckbox` variante `row`, toggle optimista) y el gráfico "Distribución Financiera" (`FinanceChart` con barras Ingresos / Fijos / Ahorro / Proyectos / Disponible).
**Por qué así:** es una vista de resumen + acción rápida; reutiliza las mismas funciones puras de `lib` que las demás páginas para que los números sean consistentes en toda la app.

### Hábitos — `src/app/(app)/habitos/page.tsx`
Server Component. El query param `?view=week|month|quarter|semester` decide la vista (4 periodos).
- **Semanal (editable):** `WeeklyTracker` con `HabitCheckbox` interactivos que llaman `toggleHabitLog` con mutación optimista.
- **Mensual (solo lectura):** `MonthlyTracker` con `HabitCheckbox` en modo `readOnly`. Las semanas se filtran con `.filter(w => w.some(d => d !== null))` para mostrar solo las reales del mes (4, 5 o 6).
- **Trimestral / Semestral (solo lectura):** `PeriodTracker` — progreso mes a mes. Usa `periodMonths(3|6)` de `dates.ts` para agrupar por mes. Muestra barras de color por nivel de cumplimiento (≥80% primary, 40–79% tertiary, <40% error) con tasa global del periodo.

**Por qué las vistas largas (mes/trimestre/semestre) son solo lectura:** la semana ISO puede cruzar meses y el estado local de los checkboxes se "pegaba" al cambiar de semana. En `readOnly`, el checkbox renderiza directamente desde la prop `initialCompleted` (no del estado local), y el `MonthlyTracker` usa la `dayKey` como `key` de React para forzar el refresco. Además auto-selecciona la semana que contiene hoy (`weeks.findIndex`). El marcado ocurre **solo** en la vista semanal.

**Panel de Resumen** (grid `lg:grid-cols-3`, Resumen ocupa 1/3 del ancho): anillo `ProgressRing(180)` + tarjetas Mejor Hábito / Por Mejorar + **Consolidados** (≥80%) y **En Riesgo** (<40%) con `CountCard` (count/total + barra de progreso). Grid responsive: celdas 26px en móvil / 36px en desktop.

### Finanzas — edición — `src/app/(app)/finanzas/page.tsx`
Server Component. Muestra ingreso, ahorro, gastos fijos (con ícono, marcables como pagado vía `FixedExpenseItem`) y proyectos, todos editables (`FinanceModals`, `AddProjectButton`, `RemoveProjectButton` con modal de confirmación, `ContributeButton`). Arriba de la sección de gastos fijos hay un tip informativo verde que explica la interacción de doble clic/tap. El botón `SaveFinanceButton` guarda el cierre del mes.
**Cálculo del balance:** `availableBalance` descuenta el ahorro mostrado (guardado o sugerido 20%), los gastos fijos y lo asignado a proyectos activos. Es la vista donde el usuario *configura* sus finanzas.

### Finanzas del Mes — `src/app/(app)/finanzas/mes/page.tsx`
Server Component `force-dynamic`. Lee el snapshot guardado (`getMonthlyFinance`) **y** los datos actuales (`getFinanceData`). Si no hay snapshot **o** el usuario ya no tiene datos actuales (ingreso 0, sin gastos, sin proyectos) → `redirect("/finanzas")`.
**Por qué la doble verificación:** evita mostrar un cierre viejo después de que el usuario purga o borra sus datos. Renderiza KPIs, "Metas Activas" (desde `projectsSnapshot`) y "Categorías de Gastos" (anillo + tarjetas desde `expensesByCategory`, con texto responsive `min(200px, 60vw)` para que no se desborde).

**Indicador de pagado en Categorías de Gastos:** las tarjetas de categorías cruzan `finance.expensesByCategory` (snapshot JSON) con `current.fixedExpenses` (datos live de `getFinanceData`) para obtener el estado `paidThisMonth` de cada gasto. El cruce se hace por nombre de categoría (case-insensitive). Cuando `isPaid === true`, la tarjeta muestra: borde/fondo verde (`bg-green-500/10`, `border-green-500/40`), barra lateral `bg-green-500`, texto del nombre en `text-green-400`, monto en `text-green-300 line-through opacity-80`, porcentaje en `text-green-400`, e ícono `check_circle` filled verde. **No modifica el schema del snapshot** (`MonthlyFinance.expensesByCategory` sigue siendo `[{category, amount, percent}]`); usa los datos live para que se refleje en tiempo real sin necesidad de re-guardar la finanza.

### Flujo de navegación de Finanzas
- El link "Finanzas" del Sidebar/Topbar apunta a **`/finanzas/mes`**.
- "Editar Finanza" → `/finanzas`. "Guardar Finanza" → `saveMonthlyFinance` + navega a `/finanzas/mes`.
- El item de nav se marca activo tanto en `/finanzas` como en `/finanzas/mes`.

### Persistencia del cierre mensual
Modelo `MonthlyFinance` (unique `userId` + `month`). Se guarda con `saveMonthlyFinance` (upsert), se lee con `getMonthlyFinance`, y se borra en `purgeAccountData`. Detalle de los campos y JSON en `docs/AI_CONTEXT.md`.

### Historial de ahorro — `src/components/finanzas/SavingsHistory.tsx`
- **Data:** `getSavingsHistory(userId)` en `src/lib/data.ts` — lee `monthlySavings` y `updatedAt` de todos los `MonthlyFinance` del usuario, ordenados por mes ASC. Devuelve `{ history: [{month, monthLabel, savings, updatedAt}], totalAccumulated }`.
- **Componente:** `SavingsHistory` — server component, recibe `data`, `currency`, `compact?`. Muestra:
  - Total acumulado (suma de todos los meses).
  - Mini-gráfico de barras proporcionales por mes (con tooltip hover).
  - Promedio mensual (cuando hay ≥2 meses).
  - **Fecha de última actualización** (`updatedAt` del mes más reciente).
  - **Fecha límite de edición** (`lastDayOfCurrentMonth()` + `daysLeftInMonth()`): helper interno que calcula el último día del mes y cuántos días faltan. Nota visual con ícono `schedule` y destaque en `primary`.
  - Empty state motivacional si no hay historial.
- **Integración:** en `/finanzas` (compact, entre Ahorro y Gastos Fijos) y en `/finanzas/mes` (prominente, entre KPIs y Bento grid).
- **Regla de negocio:** unique `(userId, month)` = un registro por mes (upsert). El usuario puede editar y re-guardar dentro del mes; al terminar, queda fijo. La nota informativa explica esto al usuario.
- **Para Nivel 2 futuro:** agregar modelo `SavingsLog` con aportes individuales y extender `getSavingsHistory` sin tocar el componente visual.

---

## 12. Seguridad (medidas implementadas y por qué)

El proyecto sigue prácticas de seguridad por defecto. Cosas que **no debes romper**:

**Autenticación**
- `src/lib/auth.ts` → `resolveSecret()`: si `NEXTAUTH_SECRET` falta **en producción con login**, lanza error (fail-closed). En modo usuario único usa un placeholder inofensivo (NextAuth no se usa). Nunca pongas un secret estático en código.
- Login en **tiempo constante**: `authorize` hace `bcrypt.compare` contra un hash dummy si el usuario no existe (evita revelar por timing si un email está registrado).
- `registerUser` **bloqueado** en modo usuario único (no se pueden crear cuentas en despliegues personales).
- Mensaje de error de registro **genérico** ("No se pudo completar el registro") — no revela si el email ya existe.
- Contraseñas: mínimo 8 caracteres, al menos 1 letra y 1 número, máximo 72 (límite bcrypt). Hash con bcrypt salt 10.

**Headers HTTP** (`next.config.js`)
- `X-Content-Type-Options: nosniff` (evita MIME sniffing).
- `X-Frame-Options: DENY` (anti-clickjacking).
- `Referrer-Policy: strict-origin-when-cross-origin`.
- `Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()`.
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` (HSTS 2 años).
- `X-Powered-By` desactivado (`poweredByHeader: false`).

**Inyección y XSS**
- Prisma parametrizado en todas las queries → sin inyección SQL.
- Validación Zod en todas las Server Actions con tipos estrictos.
- No hay `dangerouslySetInnerHTML` ni `eval` en el código.
- Avatar validado por regex (solo `data:image/...` o URLs http).
- Export CSV: celdas que empiezan con `=`, `+`, `-`, `@` se neutralizan con `'` (anti-formula injection).

**Secretos**
- `.env.local` en `.gitignore`; solo `.env.example` (sin valores reales) se versiona.
- La validación de `predev` avisa si hay variables innecesarias/conflictivas (ver sección 4).

> **Al agregar funcionalidad nueva**, sigue estas reglas: toda consulta/mutación filtra por `getUserId()` (aislamiento), toda entrada de usuario se valida con Zod antes de tocar la BD, y nunca loguees secretos ni datos sensibles.

---

## 📚 Documentos relacionados

- **Arquitectura y funcionamiento interno** → `docs/AI_CONTEXT.md`
- **Instalación y despliegue completo** → `DEPLOYMENT.md`
- **Manual de uso de la app** → `USER_GUIDE.md`
- **Guía para usuario final (no técnico)** → `docs/GUIA_USUARIO.md`
