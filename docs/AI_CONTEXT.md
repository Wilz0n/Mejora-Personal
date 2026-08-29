# 🤖 AI Context — Cómo funciona LifeTracker

> Documento de contexto para asistentes de IA / LLMs. Describe **cómo funciona** la aplicación (arquitectura, modelos, lógica y flujo de datos). No es una guía de instalación. Optimizado para que una IA razone sobre el código sin leerlo entero.

## Resumen en una línea

LifeTracker es una app web de **hábitos + finanzas personales** en **Next.js 14 (App Router)** con **Prisma + PostgreSQL (Neon)**, **Server Actions** para mutaciones, **Zod** para validación y **NextAuth** para autenticación opcional. Soporta un **Modo Usuario Único** que omite el login. Rutas y textos en **español**.

## Stack técnico

| Capa | Tecnología |
|------|------------|
| Framework | Next.js 14 (App Router, React Server Components) |
| Lenguaje | TypeScript (strict) |
| ORM / BD | Prisma 5 sobre PostgreSQL (Neon) |
| Mutaciones | Server Actions (`"use server"`) con `revalidatePath` |
| Validación | Zod |
| Auth | NextAuth v4 (Credentials + Prisma Adapter, JWT) — omitible |
| Estilos | Tailwind CSS (design system "Nocturne", dark mode) |
| Iconos | Material Symbols Outlined (Google Fonts) |
| Deploy | Vercel; BD en Neon |

## Modelo de datos (`prisma/schema.prisma`)

Todos los modelos de dominio se aíslan por `userId` (multi-tenancy).

- **User**: `id, email (unique), name?, passwordHash?, image?, emailVerified?, createdAt`. Relaciones a todo lo demás.
- **Account / Session / VerificationToken**: requeridos por el Prisma Adapter de NextAuth.
- **Habit**: `id, userId, name, icon (default "check_circle"), createdAt`. Tiene muchos `HabitLog`.
- **HabitLog**: `id, habitId, date (String "YYYY-MM-DD"), completed (Boolean), createdAt`. **Unique(`habitId`, `date`)**: un registro por hábito por día. La fecha es un *day key* string para evitar problemas de zona horaria.
- **FinancialSummary**: `id, userId (unique), monthlyIncome (Decimal), monthlySavings (Decimal), currency (default "USD")`. Uno por usuario.
- **FixedExpense**: `id, userId, category, amount (Decimal), icon (default "receipt_long"), order (Int), paidThisMonth (Boolean, default false)`. El campo `icon` permite etiquetar el gasto (Material Symbols). `paidThisMonth` marca si el usuario ya pagó ese gasto en el mes actual (toggle con doble clic/tap).
- **ProjectGoal**: `id, userId, name, targetAmount (Decimal), allocatedAmount (Decimal), monthlyContribution (Decimal), completedAt (DateTime?), tag (default "General"), createdAt`. `completedAt != null` ⇒ proyecto cumplido (deja de descontar del balance).
- **MonthlyFinance**: snapshot del cierre mensual. `id, userId, month ("YYYY-MM"), monthLabel ("Agosto 2026"), monthlyIncome, monthlySavings, totalFixedExpenses, availableBalance (Decimals), currency, expensesByCategory (Text JSON: `[{category, amount, percent}]`), projectsSnapshot (Text JSON: `[{name, tag, targetAmount, allocatedAmount, progress}]`), savingsConfirmed (Boolean? — `null`=pendiente, `true`=ahorró, `false`=no ahorró), createdAt, updatedAt`. **Unique(`userId`, `month`)** → upsert por mes.

> Los `Decimal` de Prisma se convierten a `number` en la capa de datos (`src/lib/data.ts`) antes de llegar a la UI. Los campos JSON de `MonthlyFinance` se serializan con `JSON.stringify` al guardar y se parsean con `JSON.parse` (con fallback seguro) al leer.

## Autenticación y aislamiento por usuario

- `src/lib/auth.ts`: config de NextAuth (Credentials con bcrypt, JWT, callbacks que inyectan `user.id` en la sesión).
- `src/lib/session.ts`: **punto central de identidad**.
  - `getUserId()`: devuelve el `userId` de la sesión; si no hay sesión, redirige a `/login`.
  - `getUserIdOrNull()`: igual pero devuelve `null` sin redirigir.
  - **Modo Usuario Único:** si `SINGLE_USER_MODE=true`, ambas funciones **omiten NextAuth** y devuelven el id de un usuario por defecto creado on-demand (`src/lib/single-user.ts` → `getOrCreateSingleUserId`, caché en memoria, email `owner@lifetracker.local`).
- `src/lib/single-user-client.ts`: helper *client-safe* (`isSingleUserModeClient()`) que solo lee `NEXT_PUBLIC_SINGLE_USER_MODE`; se usa en componentes cliente para no importar Prisma al bundle del navegador.

**Regla de oro:** toda lectura/escritura pasa por `getUserId()` y filtra por ese `userId`. Las mutaciones verifican propiedad con `where: { id, userId }` (o `updateMany`/`deleteMany`).

## Estructura de rutas (App Router) — rutas en español

```
src/app/
├─ layout.tsx                       # Root: fuentes (Inter, JetBrains Mono, Material Symbols), <Providers>
├─ globals.css                      # Estilos base + utilidades (glass-panel, chart-bar-*)
├─ not-found.tsx                    # 404 (force-dynamic)
├─ (app)/                           # Grupo autenticado; layout llama getUserId()
│  ├─ layout.tsx                    # Sidebar + Topbar + contenedor (overflow-x-hidden)
│  ├─ page.tsx                      # DASHBOARD
│  ├─ habitos/page.tsx              # HÁBITOS — ?view=week|month
│  ├─ finanzas/page.tsx             # FINANZAS: edición/distribución (ingreso, ahorro, gastos, proyectos)
│  ├─ finanzas/mes/page.tsx         # FINANZAS DEL MES: cierre guardado (force-dynamic)
│  ├─ settings/page.tsx             # AJUSTES / perfil
│  ├─ proyectos, support            # (en construcción)
│  └─ loading.tsx por subruta       # skeletons
├─ login/, register/                # force-dynamic
├─ api/auth/[...nextauth]/route.ts  # handler NextAuth
├─ api/export/route.ts              # exportación JSON/CSV
└─ actions/                         # Server Actions
   ├─ habits.ts                     # toggleHabitLog, createHabit, deleteHabit
   ├─ finance.ts                    # createProject, contributeToProject, updateProjectAllocation,
   │                                #   deleteProject, createExpense, deleteExpense,
   │                                #   setMonthlyIncome, setMonthlySavings, saveMonthlyFinance,
   │                                #   toggleExpensePaid, reorderExpenses, confirmMonthlySavings
   ├─ settings.ts                   # updateProfile, setCurrency, purgeAccountData
   └─ auth.ts                       # registerUser
```

> `/login`, `/register`, `/not-found` usan `export const dynamic = "force-dynamic"` para evitar el prerender estático (fallaba con NextAuth por `NEXTAUTH_URL` ausente en build → `TypeError: Invalid URL`).

## Lógica de negocio (funciones puras, testeables)

### Fechas — `src/lib/dates.ts`
- `toDayKey(date)` / `todayKey()`: fecha → `"YYYY-MM-DD"`.
- `weekDayKeys(ref)`: 7 claves de la semana (lunes→domingo, ISO).
- `monthDayKeys(ref)`: claves del mes. `monthWeeks(ref)`: semanas ISO del mes (con `null` para días fuera del mes; la página filtra semanas 100% vacías).
- `lastMonthsDayKeys(months, ref)`: claves de día de los últimos N meses (trimestre=3, semestre=6). `periodMonths(months, ref)`: agrupa esos meses en `[{key "YYYY-MM", label "ago 2026", dayKeys}]` (para el progreso mes a mes).
- Etiquetas: `shortWeekdayLabel`, `dayOfMonth`, `monthLabel` (ej. "Agosto 2026").

### Hábitos — `src/lib/habits-logic.ts`
- `Period = "week" | "month" | "quarter" | "semester"`. `periodDayKeys(period)` devuelve las claves de día del periodo (semana ISO, mes, últimos 3 meses = trimestre, últimos 6 = semestre). `PERIOD_MONTHS = { quarter: 3, semester: 6 }`.
- `computeHabitRate(habit, period)`: **Tasa = (días completados ÷ días del periodo) × 100**. Devuelve `completionByDay` (mapa dayKey→bool).
- `computeHabitRates`, `computeHabitKpis` (`globalRate` promedio, `best`, `worst`, `consistentCount` = hábitos con tasa ≥ 80%, `atRiskCount` = hábitos con tasa < 40%, `totalHabits`), `habitsForToday`.

### Finanzas — `src/lib/finance-logic.ts`
- `computeFinanceSummary(input)`: `totalFixedExpenses`, `totalAllocated` (solo proyectos **activos**, no completados), y **`availableBalance = monthlyIncome − monthlySavings − totalFixedExpenses − totalAllocated`**.
- `suggestedSavings(income)`: 20% del ingreso.
- `computeProjectProgress` / `computeProjectsProgress`: **progreso = (allocated ÷ target) × 100** (cap 100), `remaining`, `completed`.
- `computeExpenseBreakdown(fixedExpenses)`: `[{category, amount, percent}]` (% sobre total).
- `computeProjectsSnapshot(projects)`: proyectos activos `[{name, tag, targetAmount, allocatedAmount, progress}]`.
- `currentMonthKey()`: `"YYYY-MM"` actual.
- `monthKeyOf(date)` / `previousMonthKey(date)`: clave de mes de una fecha / del mes anterior.
- `pendingSavingsConfirmation(records, now)`: **función pura, timezone-aware** (recibe `now`). Devuelve la clave `"YYYY-MM"` cuyo ahorro está pendiente de confirmar, o `null`. Reglas: prioriza el **mes anterior** con `savingsConfirmed === null` dentro de los primeros `SAVINGS_CONFIRM_GRACE_DAYS` (7) días del mes; si no, el **mes en curso** con `savingsConfirmed === null` en los últimos `SAVINGS_CONFIRM_WINDOW_DAYS` (3) días.
- `formatCurrency(value, {currency})`: `Intl.NumberFormat`. `SUPPORTED_CURRENCIES` = USD, PEN.

### Historial de Ahorro — `src/lib/data.ts` → `getSavingsHistory`
- Lee todos los `MonthlyFinance` del usuario ordenados por mes y devuelve `{ history: [{month, monthLabel, savings, savingsConfirmed, updatedAt}], totalAccumulated }`.
- **`totalAccumulated` respeta la confirmación:** los meses con `savingsConfirmed === false` cuentan como **0** en el acumulado; los pendientes (`null`) y confirmados (`true`) suman su cifra.
- `getMonthlyConfirmStates(userId)` devuelve `[{month, savingsConfirmed}]` (desc) para detectar el mes pendiente de confirmar.
- Unique `(userId, month)` garantiza un solo registro por mes (upsert). El usuario puede editar y re-guardar durante el mes; al terminar, queda fijo.
- El componente `SavingsHistory` (`src/components/finanzas/SavingsHistory.tsx`) muestra: total acumulado, mini-gráfico de barras mes a mes, promedio mensual, fecha de última actualización, y **fecha límite de edición** (último día del mes actual + días restantes). Versiones `compact` (para /finanzas) y completa (para /finanzas/mes).

### Validación — `src/lib/validators.ts`
Esquemas Zod: `createHabitSchema`, `toggleHabitLogSchema`, `createProjectSchema`, `createExpenseSchema` (incluye `icon`), `setIncomeSchema`, `setSavingsSchema`, `setCurrencySchema`, `confirmMonthlySavingsSchema` (`{month "YYYY-MM", confirmed bool}`), `updateProfileSchema`, `registerSchema`. Se usan con `.safeParse()` en cada Server Action; errores → `fieldErrors`.

## Sistema de iconos (Material Symbols)

- La fuente **Material Symbols Outlined** se carga en el layout root vía Google Fonts.
- `src/components/comun/Icon.tsx` renderiza `<span class="material-symbols-outlined">{name}</span>`; `name` es el nombre exacto del ícono en Material Symbols (catálogo: https://fonts.google.com/icons, estilo Outlined). Prop `filled` activa `font-variation-settings: 'FILL' 1`.
- **Hábitos:** catálogo en `ICON_OPTIONS` dentro de `src/components/habitos/AddHabitButton.tsx` (~33 iconos). Se guarda en `Habit.icon`. Para agregar más, se añade el string al array.
- **Gastos fijos:** catálogo en `EXPENSE_ICONS` dentro de `src/components/finanzas/FinanceModals.tsx` (16 iconos). Se guarda en `FixedExpense.icon`. La página `/finanzas` muestra el ícono guardado, con fallback a la heurística `expenseIcon(category)` (adivina por nombre) para gastos antiguos.

## Flujo de datos

**Lecturas (render):**
1. Server Component llama `getUserId()`.
2. Llama funciones de `src/lib/data.ts` (`getHabitsWithLogs`, `getHabitsForToday`, `getFinanceData`, `getMonthlyFinance`, `getUserProfile`) que consultan Prisma **filtrando por `userId`** y convierten `Decimal → number` (y parsean JSON en `getMonthlyFinance`).
3. Deriva métricas con las funciones puras `compute*`.
4. Renderiza. Páginas con datos de usuario usan `force-dynamic`.

**Escrituras (mutaciones):**
1. Componente cliente llama una **Server Action**.
2. La acción: `getUserId()` → `zodSchema.safeParse(input)` → verifica propiedad → escribe en Prisma → `revalidatePath(...)` → devuelve `ActionResult` (`{ ok: true }` o `{ ok: false, error, fieldErrors }`).
3. La UI hace **mutación optimista** cuando aplica (actualiza al instante; revierte si `ok` es `false`).

`ActionResult<T>` está en `src/lib/action-result.ts`.

## Componentes clave (`src/components/`)

- **Sidebar / Topbar** (`comun/`): navegación. Items: Dashboard `/`, Hábitos `/habitos`, Finanzas **`/finanzas/mes`**, Proyectos. El item "Finanzas" se marca activo tanto en `/finanzas` como en `/finanzas/mes`. Logout oculto en modo usuario único. Topbar incluye bottom-nav móvil.
- **HabitCheckbox** (`habitos/`): variantes `row` (listas) y `cell` (grilla). Optimista con `useState`+`useTransition`, llama `toggleHabitLog`. Prop **`readOnly`**: en la vista mensual renderiza un `div` (no botón) directamente desde `initialCompleted` (la prop, no el estado local) para no "pegar" checks al cambiar de semana. Tamaño responsive.
- **AddHabitButton** (`habitos/`): modal crear hábito (nombre + selector de ~33 iconos con scroll).
- **WeeklyTracker** (en `habitos/page.tsx`): grid responsive `[minmax(70px,1fr)_repeat(7,26px)_32px]` móvil / `36px/44px` desktop. Checkboxes interactivos.
- **MonthlyTracker** (`habitos/`): solo lectura, auto-selecciona la semana que contiene hoy (`weeks.findIndex`), usa dayKey como `key` de React. Leyenda Completado/Pendiente/Fuera del mes + "Solo lectura".
- **PeriodTracker** (en `habitos/page.tsx`): vistas **trimestral/semestral**. Solo lectura; muestra el progreso **mes a mes** (barra + % por mes de `periodMonths`), con color por nivel (≥80% primary, 40–79% tertiary, <40% error). Leyenda Consolidado/En progreso/En riesgo.
- **FinanceModals** (`finanzas/`): `AddExpenseButton` (categoría + monto + **selector de 16 iconos**), `SetIncomeButton`, `SetSavingsButton`.
- **FixedExpenseItem** (`finanzas/`): client component con doble clic (desktop) y doble tap (móvil, timeout 300ms) para toggle `paidThisMonth`. Mutación optimista → `toggleExpensePaid`. Visual: fondo verde + icono `check_circle` filled + line-through + badge `verified` cuando pagado; fondo normal + icono del gasto cuando no pagado.
- **AddProjectButton / RemoveProjectButton / ContributeButton** (`finanzas/`): crear proyecto; quitar con **modal de confirmación** (check verde / X roja); abonar mensual.
- **SaveFinanceButton** (`finanzas/`): guarda el cierre (`saveMonthlyFinance`) y navega a `/finanzas/mes`.
- **SavingsConfirmationModal** (`finanzas/`): client. Modal (portal) que pregunta "¿Pudiste realizar el ahorro? :D" al cierre del mes. Botón ✓ (`check_circle` verde) → `confirmMonthlySavings({month, confirmed:true})`; botón ✕ (`cancel` rojo) → `confirmed:false`. Se monta en `/finanzas` solo cuando `pendingSavingsConfirmation` detecta un mes pendiente. Funciona igual en modo multi-usuario y único.
- **LogoutButton** (`settings/`): client. Debajo de "Editar Perfil". En multi-usuario muestra un botón de peligro "Cerrar sesión" (`signOut({callbackUrl:"/login"})`); en modo usuario único (`isSingleUserModeClient()`) muestra el indicador pasivo "Modo Usuario Único activo" (coherente con el Sidebar).
- **Modal, Icon, ProgressRing, ProjectModal, Providers, Skeleton** (`comun/`): primitivos. `Modal` usa React Portal (obligatorio por `backdrop-filter` de `.glass-panel`).

## Pantallas (comportamiento funcional)

- **Dashboard (`/`)**: 4 KPIs (tasa global semanal, balance disponible, ahorro protegido, fondo de proyectos), "Hábitos de Hoy" (toggle instantáneo) y gráfico "Distribución Financiera" con 5 barras: Ingresos, Fijos, Ahorro, Proyectos, Disponible.
- **Hábitos (`/habitos?view=week|month|quarter|semester`)**: 4 periodos. **Semanal** = editable (marcar días). **Mensual** = solo lectura (refleja lo marcado en semanal, auto-abre la semana actual, muestra las semanas reales del mes). **Trimestral / Semestral** = solo lectura, progreso mes a mes (`PeriodTracker`). Panel de Resumen (más ancho, grid `lg:grid-cols-3`): anillo de tasa global + tarjetas Mejor Hábito, Por Mejorar, y KPIs **Consolidados** (≥80%) y **En Riesgo** (<40%) con conteo `x/total`. Crear hábito disponible en todas las vistas.
- **Finanzas — edición (`/finanzas`)**: ingreso, ahorro, gastos fijos (con ícono, marcables como "pagado" con doble clic/tap → fondo verde) y proyectos, todos editables. Tip informativo arriba de la sección de gastos fijos. Balance disponible (rojo si negativo). Botón "Guardar Finanza". Al cierre del mes (o inicio del siguiente) puede aparecer el **modal de confirmación de ahorro** (`SavingsConfirmationModal`) si hay un mes con `savingsConfirmed === null`.
- **Finanzas del Mes (`/finanzas/mes`)**: cierre guardado. KPIs (Ingreso, Gasto Fijo, Ahorro, Balance), "Metas Activas" (barras de progreso desde `projectsSnapshot`) y "Categorías de Gastos" (anillo + tarjetas desde `expensesByCategory`). Las tarjetas de categorías cruzan el snapshot con `current.fixedExpenses` (datos live) para mostrar el estado `paidThisMonth`: las categorías pagadas se resaltan con borde verde, barra lateral verde, texto verde con line-through, y un ícono `check_circle` filled verde (sincronizado en tiempo real con el toggle de `/finanzas`). Si no hay snapshot **o** el usuario ya no tiene datos actuales → `redirect("/finanzas")`. Botón "Editar Finanza" → `/finanzas`.

## Variables de entorno

| Variable | Uso |
|----------|-----|
| `DATABASE_URL` | Postgres (Neon). Runtime usa *pooled*; migraciones la *directa* (sin `-pooler`). |
| `SINGLE_USER_MODE` | `"true"` → servidor omite NextAuth y usa usuario por defecto. |
| `NEXT_PUBLIC_SINGLE_USER_MODE` | `"true"` → cliente oculta UI de login/logout. Debe coincidir con la anterior. |
| `NEXTAUTH_SECRET` / `NEXTAUTH_URL` | Solo en modo con login. Obligatorias en producción si NO se usa modo usuario único. En modo usuario único NO deben definirse. |

## Seguridad (medidas implementadas)

- **Secret de NextAuth robusto** (`src/lib/auth.ts` → `resolveSecret()`): usa `NEXTAUTH_SECRET`; en modo usuario único usa un placeholder (NextAuth no se usa); en **producción con login sin secret lanza error** (evita firmar JWT con un secreto público). En dev con login, placeholder.
- **Login en tiempo constante:** `authorize` compara siempre con bcrypt (contra un hash dummy si el usuario no existe) para no revelar por timing si un email está registrado.
- **Registro:** bloqueado en modo usuario único; mensaje de error **genérico** (no revela si el email existe); captura P2002 de Prisma. Contraseñas ≥ 8 caracteres con letra y número (Zod), hash bcrypt (10 rounds).
- **Aislamiento por `userId`** en toda query/mutación (multi-tenancy). Prisma parametrizado → sin inyección SQL.
- **Headers de seguridad** (`next.config.js`): `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, `Strict-Transport-Security`; `poweredByHeader: false`.
- **Export CSV:** neutraliza *CSV/formula injection* (celdas que empiezan con `= + - @` se prefijan con `'`).
- **Avatar:** validado por Zod (solo `data:image/...` o URLs http). Sin `dangerouslySetInnerHTML` ni `eval` en el código.
- **Secretos:** `.env.local` en `.gitignore`; solo `.env.example` (plantilla) versionado.

## Invariantes y decisiones de diseño (para no romper)

1. **Aislamiento por `userId`** en toda consulta/mutación.
2. `HabitLog.date` es **string `YYYY-MM-DD`**. Usar helpers de `dates.ts`.
3. Unicidad `HabitLog(habitId, date)` → `upsert` para el toggle.
4. `MonthlyFinance` unique `(userId, month)` → `upsert` por mes; campos JSON como Text.
5. `Decimal` de Prisma → `number` en `data.ts` antes de la UI.
6. Páginas con datos de usuario/auth → **`force-dynamic`**.
7. Lógica de negocio en `src/lib/*-logic.ts` como **funciones puras**; las Server Actions solo orquestan (auth + validar + persistir + revalidar).
8. En componentes cliente, importar `single-user-client.ts` (no `single-user.ts`) para no arrastrar Prisma al navegador.
9. La vista **mensual de hábitos es solo lectura**; el marcado ocurre solo en la vista semanal.
10. Modales siempre con `comun/Modal.tsx` (React Portal) por el `backdrop-filter` de `.glass-panel`.
