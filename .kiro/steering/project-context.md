# LifeTracker — Contexto del Proyecto

Este proyecto es **LifeTracker**, una app web de hábitos + finanzas personales.

## Documentación obligatoria

Antes de responder cualquier pregunta sobre el proyecto o hacer cambios en el código, **lee primero** el archivo de contexto para IA:

- **`docs/AI_CONTEXT.md`** — Arquitectura completa, modelos de datos, lógica de negocio, flujo de datos, componentes, pantallas e invariantes de diseño.

Para tareas de desarrollo que requieran más detalle operativo:

- **`docs/DEV_GUIDE.md`** — Guía para desarrolladores: estructura de código, convenciones, flujo de ramas, recetas de cambios comunes, seguridad.

Para entender cómo funciona la app desde la perspectiva del usuario:

- **`USER_GUIDE.md`** — Manual de uso: qué hace cada pantalla, métricas, flujos.

## Reglas clave (resumen rápido)

1. **Aislamiento por `userId`** en toda consulta/mutación (multi-tenancy).
2. `HabitLog.date` es **string `"YYYY-MM-DD"`** — usar helpers de `src/lib/dates.ts`.
3. Lógica de negocio en `src/lib/*-logic.ts` como **funciones puras**.
4. Server Actions: `getUserId()` → Zod parse → verificar propiedad → Prisma → `revalidatePath`.
5. Modales siempre con `src/components/comun/Modal.tsx` (React Portal).
6. En componentes cliente, importar `single-user-client.ts` (no `single-user.ts`).
7. Ramas: feature → dev → main. Nunca push directo a main.
8. Documentar cambios en: `USER_GUIDE.md` (usuario), `docs/AI_CONTEXT.md` (IA), `docs/DEV_GUIDE.md` (dev).

## Stack

Next.js 14 (App Router) · TypeScript · Prisma + PostgreSQL (Neon) · Tailwind CSS · NextAuth (opcional) · Zod · Material Symbols · Vercel.

## Idioma

Rutas, textos de UI y documentación están en **español**. Responde en español salvo que se pida otro idioma.
