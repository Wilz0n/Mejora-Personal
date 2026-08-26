# 🤖 AI Context — Cómo funciona LifeTracker

> Documento de contexto para asistentes de IA / LLMs. Describe **cómo funciona** la aplicación (arquitectura, modelos, lógica y flujo de datos). No es una guía de instalación. Optimizado para que una IA razone sobre el código sin tener que leerlo entero.

## Resumen en una línea

LifeTracker es una app web de **hábitos + finanzas personales** en **Next.js 14 (App Router)** con **Prisma + PostgreSQL (Neon)**, **Server Actions** para mutaciones, **Zod** para validación y **NextAuth** para autenticación opcional. Soporta un **Modo Usuario Único** que omite el login.

## Stack técnico

| Capa | Tecnología |
|------|------------|
| Framework | Next.js 14 (App Router, React Server Components) |
| Lenguaje | TypeScript (strict) |
| ORM / BD | Prisma 5 sobre PostgreSQL (Neon) |
| Mutaciones | Server Actions (`"use server"`) con `revalidatePath` |
| Validación | Zod |
| Auth | NextAuth v4 (Credentials + Prisma Adapter, estrategia JWT) — omitible |
| Estilos | Tailwind CSS (design system "Nocturne", dark mode) |
| Deploy | Vercel; BD en Neon |

## Modelo de datos (Prisma — `prisma/schema.prisma`)

Todos los modelos de dominio se aíslan por `userId` (multi-tenancy).

- **User**: `id, email (unique), name, passwordHash?, image?, emailVerified?, createdAt`. Relaciones a todo lo demás.
- **Account / Session / VerificationToken**: requeridos por el Prisma Adapter de NextAuth.
- **Habit**: `id, userId, name, icon, createdAt`. Tiene muchos `HabitLog`.
- **HabitLog**: `id, habitId, date (String "YYYY-MM-DD"), completed (Boolean), createdAt`. **Unique(`habitId`, `date`)**: un registro por hábito por día. La fecha se guarda como *day key* string para evitar problemas de zona horaria.
- **FinancialSummary**: `id, userId (unique), monthlyIncome (Decimal)`. Uno por usuario.
- **FixedExpense**: `id, userId, category, amount (Decimal)`.
- **ProjectGoal**: `id, userId, name, targetAmount (Decimal), allocatedAmount (Decimal), tag, createdAt`.

> Los `Decimal` de Prisma se convierten a `number` en la capa de datos antes de llegar a la UI (ver `src/lib/data.ts`).

## Autenticación y aislamiento por usuario

- `src/lib/auth.ts`: config de NextAuth (Credentials con bcrypt, JWT, callbacks que inyectan `user.id` en la sesión).
- `src/lib/session.ts`: **punto central de identidad**.
  - `getUserId()`: devuelve el `userId` de la sesión; si no hay sesión, redirige a `/login`.
  - `getUserIdOrNull()`: igual pero devuelve `null` sin redirigir.
  - **Modo Usuario Único:** si `SINGLE_USER_MODE=true` (o `NEXT_PUBLIC_SINGLE_USER_MODE=true`), ambas funciones **omiten NextAuth** y devuelven el id de un usuario por defecto creado on-demand (`src/lib/single-user.ts` → `getOrCreateSingleUserId`, con caché en memoria y email `owner@lifetracker.local`).
- `src/lib/single-user-client.ts`: helper *client-safe* (`isSingleUserModeClient()`) que sólo lee `NEXT_PUBLIC_SINGLE_USER_MODE`; se usa en componentes cliente (p. ej. ocultar el botón de logout) para no importar Prisma en el bundle del navegador.

**Regla de oro:** cualquier lectura/escritura de datos pasa por `getUserId()` y filtra por ese `userId`. Las mutaciones verifican propiedad con `where: { id, userId }` (o `updateMany`/`deleteMany`).

## Estructura de rutas (App Router)

```
src/app/
├─ layout.tsx                 # Root: fuentes, <Providers> (SessionProvider)
├─ globals.css                # Estilos base + utilidades del design system
├─ not-found.tsx              # 404 (force-dynamic, sin dependencias de auth)
├─ (app)/                     # Grupo autenticado; layout llama getUserId()
│  ├─ layout.tsx              # Sidebar + Topbar + contenedor
│  ├─ page.tsx                # DASHBOARD
│  ├─ habits/page.tsx         # HÁBITOS (semanal/mensual) — ?view=week|month
│  ├─ finance/page.tsx        # FINANZAS Y PROYECTOS
│  ├─ loading.tsx, error.tsx  # y loading.tsx por subruta (skeletons)
├─ login/page.tsx             # force-dynamic
├─ register/page.tsx          # force-dynamic
├─ api/auth/[...nextauth]/route.ts   # handler NextAuth
└─ actions/                   # Server Actions
   ├─ habits.ts               # toggleHabitLog, createHabit, deleteHabit
   ├─ finance.ts              # createProject, updateProjectAllocation, deleteProject,
   │                          #   createExpense, deleteExpense, setMonthlyIncome
   └─ auth.ts                 # registerUser
```

> Nota: `/login`, `/register` y `/not-found` usan `export const dynamic = "force-dynamic"` para evitar el prerender estático (que fallaba con NextAuth por falta de `NEXTAUTH_URL` en build time → `TypeError: Invalid URL`).

## Lógica de negocio (funciones puras, testeables)

### Fechas — `src/lib/dates.ts`
- `toDayKey(date)` / `todayKey()`: fecha → `"YYYY-MM-DD"`.
- `weekDayKeys(ref)`: 7 claves de la semana (lunes→domingo, ISO).
- `monthDayKeys(ref)`: todas las claves del mes.
- Helpers de etiquetas (`shortWeekdayLabel`, `dayOfMonth`, `monthLabel`).

### Hábitos — `src/lib/habits-logic.ts`
- `Period = "week" | "month"`.
- `computeHabitRate(habit, period)`: **Tasa = (días completados en el periodo / días totales del periodo) × 100** (redondeada). Devuelve además `completionByDay`.
- `computeHabitRates(habits, period)`: aplica lo anterior a todos.
- `computeHabitKpis(rates)`:
  - `globalRate` = promedio de todas las tasas.
  - `best` = hábito con **mayor** tasa.
  - `worst` = hábito con **menor** tasa.
- `habitsForToday(habits)`: lista de hábitos con flag `completedToday` (usa `todayKey()`).

### Finanzas — `src/lib/finance-logic.ts`
- `computeFinanceSummary(input)`:
  - `totalFixedExpenses` = suma de gastos fijos.
  - `totalAllocated` = suma de `allocatedAmount` de proyectos.
  - **`availableBalance` = monthlyIncome − totalFixedExpenses − totalAllocated`**.
- `computeProjectProgress(project)`: **progreso = (allocatedAmount / targetAmount) × 100** (cap a 100); también `remaining`.
- `formatCurrency(value, opts)`: `Intl.NumberFormat`.

### Validación — `src/lib/validators.ts`
Esquemas Zod: `createHabitSchema`, `toggleHabitLogSchema`, `createProjectSchema`, `createExpenseSchema`, `setIncomeSchema`, `registerSchema`. Se usan con `.safeParse()` dentro de cada Server Action; los errores vuelven como `fieldErrors`.

## Flujo de datos (lecturas y escrituras)

**Lecturas (render):**
1. Un Server Component (p. ej. `(app)/page.tsx`) llama `getUserId()`.
2. Llama funciones de `src/lib/data.ts` (`getHabitsWithLogs`, `getHabitsForToday`, `getFinanceData`) que consultan Prisma **filtrando por `userId`** y convierten `Decimal → number`.
3. Pasa esos datos a las funciones puras de lógica (`compute*`) para derivar métricas.
4. Renderiza. Las páginas usan `export const dynamic = "force-dynamic"` (siempre datos frescos).

**Escrituras (mutaciones):**
1. Un componente cliente (p. ej. `HabitCheckbox`) llama una **Server Action**.
2. La acción: `getUserId()` → `zodSchema.safeParse(input)` → verifica propiedad → escribe en Prisma → `revalidatePath("/")` y rutas afectadas → devuelve `ActionResult` (`{ ok: true }` o `{ ok: false, error, fieldErrors }`).
3. La UI hace **mutación optimista** (actualiza al instante; revierte si `ok` es `false`).

`ActionResult<T>` está en `src/lib/action-result.ts`.

## Componentes clave (`src/components/`)

- **Sidebar / Topbar**: navegación (Dashboard, Hábitos, Finanzas). El logout se oculta en modo usuario único.
- **HabitCheckbox**: toggle con `useState` + `useTransition` (optimista). Variantes `row` (listas) y `cell` (grilla semanal/mensual). Llama `toggleHabitLog`.
- **AddHabitButton**: modal para crear hábito (nombre + ícono). En la página de hábitos sólo se muestra en la vista **semanal**.
- **AddProjectButton**: modal Nuevo Proyecto (nombre, targetAmount, allocatedAmount, tag) → `createProject`.
- **FinanceModals**: `AddExpenseButton` (gasto fijo) y `SetIncomeButton` (ingreso mensual, upsert).
- **Modal, Icon, Skeleton, Providers**: primitivos de UI.

## Pantallas (comportamiento funcional)

- **Dashboard (`/`)**: KPIs (tasa global semanal, balance disponible, gastos fijos, fondo de proyectos), lista de "Hábitos de Hoy" (toggle instantáneo) y gráfico de distribución financiera del mes.
- **Hábitos (`/habits?view=week|month`)**: grilla hábitos × días con checkboxes; KPIs de Tasa Global, Mejor Hábito y Por Mejorar; crear hábito sólo en vista semanal.
- **Finanzas (`/finance`)**: tarjetas de resumen (incluye balance disponible, en rojo si es negativo), lista de proyectos con barra de progreso y "faltan $X", lista de gastos fijos; modales para ingreso, gasto y proyecto.

## Variables de entorno

| Variable | Uso |
|----------|-----|
| `DATABASE_URL` | Conexión Postgres (Neon). Runtime usa la *pooled*; migraciones la *directa* (sin `-pooler`). |
| `SINGLE_USER_MODE` | `"true"` → servidor omite NextAuth y usa usuario por defecto. |
| `NEXT_PUBLIC_SINGLE_USER_MODE` | `"true"` → cliente oculta UI de login/logout. Debe coincidir con la anterior. |
| `NEXTAUTH_SECRET` / `NEXTAUTH_URL` | Sólo en modo con login. **Obligatorias en producción si NO se usa el modo usuario único** (si faltan → error `NO_SECRET`). |

## Invariantes y decisiones de diseño (para no romper)

1. **Aislamiento por `userId`** en toda consulta/mutación. Nunca consultar sin filtrar por usuario.
2. `HabitLog.date` es **string `YYYY-MM-DD`**, no `Date`. Usar helpers de `dates.ts`.
3. Unicidad `HabitLog(habitId, date)` → usar `upsert` para el toggle.
4. `Decimal` de Prisma **se convierte a `number`** en `data.ts` antes de la UI.
5. Páginas con datos de usuario o auth → **`force-dynamic`** (evita fallos de prerender).
6. La lógica de negocio vive en `src/lib/*-logic.ts` como **funciones puras** (fáciles de testear); las Server Actions sólo orquestan (auth + validar + persistir + revalidar).
7. En componentes cliente, importar `single-user-client.ts` (no `single-user.ts`) para no arrastrar Prisma al navegador.
