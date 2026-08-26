<div align="center">

# 🌙 LifeTracker

### Tu vida, en orden. Hábitos y finanzas personales en una sola app.

*Construye mejores hábitos, controla tu dinero y visualiza tu progreso — todo con un diseño oscuro, minimalista y enfocado.*

<br>

![Next.js](https://img.shields.io/badge/Next.js_14-000000?style=for-the-badge&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/Neon_Postgres-336791?style=for-the-badge&logo=postgresql&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)

<br>

**[🚀 Empezar](#-empieza-en-3-pasos)** · **[✨ Funciones](#-qué-puedes-hacer)** · **[📚 Documentación](#-documentación)** · **[🛠️ Stack](#️-stack-técnico)**

</div>

---

## ✨ ¿Qué puedes hacer?

<table>
<tr>
<td width="50%" valign="top">

### 🔁 Hábitos
- Seguimiento **semanal** y **mensual** (heatmap).
- Marca tus días con un clic (respuesta instantánea).
- **Tasa de cumplimiento** automática por hábito.
- Detecta tu **mejor hábito** y el que hay que **mejorar**.
- Crea y elimina hábitos fácilmente.

</td>
<td width="50%" valign="top">

### 💰 Finanzas
- **Balance disponible** calculado en tiempo real.
- **Ingreso** y **ahorro mensual** editables.
- **Gastos fijos** con categorías.
- **Proyectos/metas** con progreso y abono mensual (botón verde). Al 100% se marca **cumplido** y libera tu balance.
- Moneda **USD ($)** o **PEN (S/)**.

</td>
</tr>
<tr>
<td width="50%" valign="top">

### 📊 Dashboard
- Resumen de KPIs de un vistazo.
- Progreso de hábitos + distribución financiera.
- Saludo personalizado con tu nombre.

</td>
<td width="50%" valign="top">

### ⚙️ Ajustes y Perfil
- Sube tu **foto de perfil** (optimizada automáticamente).
- **Exporta** tus datos (JSON / CSV).
- Elige tu moneda por defecto.
- Purga tus datos cuando quieras.

</td>
</tr>
</table>

> 🔒 **Privado por diseño:** cada usuario solo ve y modifica sus propios datos (aislamiento por `userId` en todas las consultas).

---

## 🚀 Empieza en 3 pasos

Vas a usar **tres servicios gratuitos**. Si ya tienes cuenta en alguno, solo inicia sesión; si no, créala con los enlaces de abajo.

| Paso | Servicio | ¿Para qué? | Crear cuenta / Iniciar sesión |
|:---:|---|---|---|
| **1** | **GitHub** | Guarda el código (haz un *fork* del proyecto) | 🔗 [Crear cuenta](https://github.com/signup) · [Iniciar sesión](https://github.com/login) |
| **2** | **Neon** | Tu base de datos Postgres (donde se guardan tus datos) | 🔗 [Crear cuenta](https://neon.tech) · [Iniciar sesión](https://console.neon.tech) |
| **3** | **Vercel** | Publica la app en internet (conéctalo con tu GitHub) | 🔗 [Crear cuenta](https://vercel.com/signup) · [Iniciar sesión](https://vercel.com/login) |

**El flujo es simple:** *Fork en GitHub → Importar en Vercel → Conectar Neon (`DATABASE_URL`) → ¡Listo!*

✨ **Despliegue automático:** en cuanto conectas la base de datos, el proyecto **crea las tablas solo** durante el deploy — sin comandos manuales.

<div align="center">

### 👉 Sigue la guía paso a paso según tu perfil:

**[📘 Guía para Usuario (no técnico)](./docs/GUIA_USUARIO.md)** &nbsp;·&nbsp; **[📗 Guía Técnica de Despliegue](./DEPLOYMENT.md)**

</div>

---

## 🖥️ Modo Usuario Único (recomendado para uso personal)

Para uso personal **sin login**, activa el Modo Usuario Único: la app entra directo al Dashboard y usa un único usuario automático. Define estas variables en Vercel:

```bash
SINGLE_USER_MODE="true"
NEXT_PUBLIC_SINGLE_USER_MODE="true"
```

Con el modo desactivado (`false`), la app funciona con registro/login normal.

---

## 📚 Documentación

| Documento | Para quién | Contenido |
|-----------|-----------|-----------|
| 📘 **[docs/GUIA_USUARIO.md](./docs/GUIA_USUARIO.md)** | Usuario final (no técnico) | Cómo descargar y conectar todo: GitHub, Neon, Vercel y variables |
| 📖 **[USER_GUIDE.md](./USER_GUIDE.md)** | Usuario final | Cómo usar la app día a día (hábitos, finanzas, ajustes) |
| 📗 **[DEPLOYMENT.md](./DEPLOYMENT.md)** | Técnico | Instalación local y despliegue en Vercel paso a paso |
| 🛠️ **[docs/DEV_GUIDE.md](./docs/DEV_GUIDE.md)** | Desarrolladores | Qué instalar, cómo funciona y cómo trabajar sin afectar producción |
| 🤖 **[docs/AI_CONTEXT.md](./docs/AI_CONTEXT.md)** | Asistentes de IA / LLMs | Arquitectura, modelos, lógica y flujo de datos |

---

## 🛠️ Stack técnico

- **Next.js 14** (App Router · Server Components + Server Actions)
- **Prisma ORM** sobre **PostgreSQL** (Neon)
- **NextAuth** (Credentials + Prisma Adapter, JWT) — opcional con Modo Usuario Único
- **Zod** para validación · **Tailwind CSS** (design system "Nocturne", dark mode)

### 🗂️ Estructura

```
src/
├─ app/
│  ├─ (app)/              # Rutas autenticadas (layout con sidebar/topbar)
│  │  ├─ page.tsx         # Dashboard
│  │  ├─ habitos/         # Hábitos (semanal + mensual)
│  │  ├─ finanzas/        # Balance, ahorro, gastos, proyectos
│  │  ├─ proyectos/       # (en construcción)
│  │  ├─ settings/        # Ajustes y perfil
│  │  └─ support/         # (en construcción)
│  ├─ actions/            # Server Actions (habits, finance, settings, auth) con Zod
│  ├─ api/export/         # Exportación de datos (JSON/CSV)
│  └─ login/ · register/
├─ components/            # UI por dominio: comun/ habitos/ finanzas/ settings/ auth/
├─ lib/                   # prisma, auth, session, dates, *-logic, validators, data
└─ types/
scripts/                  # setup, deploy (auto), dev-verify, db-sync
```

### 🔢 Lógica de negocio

| Métrica | Fórmula |
|---|---|
| **Tasa de hábito** | (días completados ÷ días del periodo) × 100 |
| **Tasa global** | promedio de las tasas de todos los hábitos |
| **Balance disponible** | ingreso − ahorro − gastos fijos − proyectos **activos** |
| **Progreso de meta** | (asignado ÷ meta) × 100 |

---

## ⚡ Puesta en marcha (local)

```bash
# 1. Clona e instala
git clone https://github.com/TU_USUARIO/Mejora-Personal.git
cd Mejora-Personal

# 2. Configuración guiada (crea .env.local, instala, crea tablas)
npm run setup

# 3. Arranca
npm run dev        # http://localhost:3000
```

> 💡 ¿Sin cuenta de base de datos a mano? Usa `npm run dev:verify` para levantar una **BD interna temporal** (requiere Docker) y probar todo de punta a punta.

---

<div align="center">

Hecho con 🌙 y enfoque. &nbsp;·&nbsp; **[Empieza ahora](#-empieza-en-3-pasos)**

</div>
