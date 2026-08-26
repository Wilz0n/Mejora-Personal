# LifeTracker

App de mejora personal (hábitos + finanzas) construida con **Next.js 14 (App Router)**, **Prisma + PostgreSQL**, **NextAuth**, **Server Actions** y **Zod**. UI basada en el design system "Nocturne" (dark mode) de `stitch_zenith_personal_dashboard`.

## Deploy en 1-Clic

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/TU_USUARIO/lifetracker&env=DATABASE_URL,NEXTAUTH_SECRET,SINGLE_USER_MODE,NEXT_PUBLIC_SINGLE_USER_MODE&envDescription=Conexi%C3%B3n%20Postgres%20y%20modo%20de%20autenticaci%C3%B3n&project-name=lifetracker&repository-name=lifetracker)

> Reemplaza `TU_USUARIO` por tu usuario de GitHub tras subir el repo. Guía completa en **[DEPLOYMENT.md](./DEPLOYMENT.md)** · Manual de uso en **[USER_GUIDE.md](./USER_GUIDE.md)**.

## Modo Usuario Único (self-hosted personal)

Para uso personal sin lidiar con logins, activa el **Modo Usuario Único**: la app omite NextAuth y usa un único usuario creado automáticamente. Define estas variables (mismo valor en ambas):

```bash
SINGLE_USER_MODE="true"
NEXT_PUBLIC_SINGLE_USER_MODE="true"
```

Con el modo desactivado (`false`), la app funciona con registro/login normal vía NextAuth.

## Stack

- **Next.js App Router** (Server Components + Server Actions)
- **Prisma ORM** sobre PostgreSQL (compatible con Vercel Postgres / Neon)
- **NextAuth** (Credentials + Prisma Adapter, estrategia JWT)
- **Zod** para validación de formularios
- **Tailwind CSS** con tokens del design system

## Multi-tenancy

Todas las consultas se filtran por `userId` de la sesión activa (`getUserId()` en `src/lib/session.ts`). Las Server Actions verifican propiedad antes de mutar (`updateMany`/`deleteMany` con `where: { id, userId }`).

## Estructura

```
src/
├─ app/
│  ├─ (app)/              # Rutas autenticadas (layout con sidebar/topbar)
│  │  ├─ page.tsx         # Dashboard: KPIs, hábitos de hoy, distribución financiera
│  │  ├─ habits/          # Vista semanal/mensual + KPIs (mejor/por mejorar)
│  │  ├─ finance/         # Balances, proyectos (progreso), gastos
│  │  ├─ loading.tsx      # Skeletons
│  │  └─ error.tsx        # Manejo de errores
│  ├─ actions/            # Server Actions (habits, finance, auth) con Zod + revalidatePath
│  ├─ api/auth/[...nextauth]/route.ts
│  ├─ login/ · register/
├─ components/            # UI: Sidebar, Topbar, Modal, HabitCheckbox (optimista), modales
├─ lib/                   # prisma, auth, session, dates, habits-logic, finance-logic, validators, data
└─ types/                 # Augmentación de tipos NextAuth
```

## Lógica de negocio

- **Tasa de hábito** = (días completados en el periodo / días totales) × 100 — `computeHabitRate`.
- **Tasa global** = promedio de las tasas de todos los hábitos — `computeHabitKpis`.
- **Mejor / Por mejorar** = hábito con mayor / menor tasa del periodo.
- **Balance disponible** = ingreso mensual − gastos fijos − asignado a proyectos — `computeFinanceSummary`.
- **Progreso de meta** = (allocated / target) × 100 — `computeProjectProgress`.

## Puesta en marcha

1. Copia las variables de entorno:

   ```bash
   cp .env.example .env
   # Edita DATABASE_URL con tu conexión Postgres (Neon/Vercel) y define NEXTAUTH_SECRET
   ```

2. Instala dependencias y aplica el schema:

   ```bash
   npm install
   npm run db:push      # crea las tablas
   npm run db:seed      # (opcional) datos de demo -> demo@lifetracker.app / password123
   ```

3. Desarrollo:

   ```bash
   npm run dev
   ```

4. Producción:

   ```bash
   npm run build && npm start
   ```

## Notas de despliegue (Vercel + Neon)

- Define `DATABASE_URL`, `NEXTAUTH_SECRET` y `NEXTAUTH_URL` en las variables de entorno del proyecto.
- `npm run build` ejecuta `prisma generate` automáticamente.
- Ejecuta `prisma db push` (o migraciones) contra la base de datos de producción antes del primer deploy.
