# 🚀 Guía de Despliegue — LifeTracker

Esta guía te lleva paso a paso, desde cero, para correr **LifeTracker** en tu computadora y luego publicarlo gratis en internet con **Vercel**. No necesitas experiencia previa: sólo sigue los pasos en orden.

---

## 📋 Requisitos previos

Antes de empezar, asegúrate de tener:

| Requisito | Para qué sirve | Enlace |
|-----------|----------------|--------|
| **Node.js 18+** | Ejecutar la app | https://nodejs.org (descarga la versión **LTS**) |
| **Cuenta de GitHub** | Guardar tu código | https://github.com/signup |
| **Cuenta de Vercel** | Publicar la app gratis | https://vercel.com/signup (entra con GitHub) |
| **Base de datos Postgres gratuita** | Guardar tus hábitos y finanzas | **Neon** https://neon.tech · o **Supabase** https://supabase.com |
| **Git** | Descargar/subir código | https://git-scm.com/downloads |

> 💡 Verifica que Node.js quedó instalado abriendo una terminal y escribiendo:
> ```bash
> node --version   # debe mostrar v18.x o superior
> npm --version
> ```

---

## 🖥️ PASO A — Despliegue Local (en tu computadora)

Usa esto para probar la app antes de publicarla.

### 1. Clonar el repositorio

```bash
git clone https://github.com/TU_USUARIO/lifetracker.git
cd lifetracker
```

> Si aún no está en GitHub, simplemente abre la carpeta del proyecto en tu terminal.

### 2. Instalar dependencias

```bash
npm install
```

Esto instala todo lo necesario y ejecuta automáticamente `prisma generate` (gracias al script `postinstall`).

### 3. Crear el archivo de variables de entorno

Copia la plantilla y crea tu archivo local `.env.local`:

```bash
cp .env.example .env.local
```

Abre `.env.local` con tu editor y complétalo. Tienes **dos formas** de configurarlo:

#### Opción 1 — Modo Usuario Único (recomendado para uso personal) ✅

No pide login: la app crea y usa un único usuario automáticamente.

```bash
DATABASE_URL="postgresql://usuario:password@host/basedatos?sslmode=require"

# Activa el modo personal (ambas variables con el mismo valor)
SINGLE_USER_MODE="true"
NEXT_PUBLIC_SINGLE_USER_MODE="true"
```

#### Opción 2 — Con Login (multiusuario, vía NextAuth)

```bash
DATABASE_URL="postgresql://usuario:password@host/basedatos?sslmode=require"

NEXTAUTH_SECRET="pega-aqui-un-secreto-aleatorio-largo"
NEXTAUTH_URL="http://localhost:3000"

SINGLE_USER_MODE="false"
NEXT_PUBLIC_SINGLE_USER_MODE="false"
```

> 🔐 Para generar `NEXTAUTH_SECRET` ejecuta:
> ```bash
> openssl rand -base64 32
> ```
> (En Windows sin `openssl`, usa cualquier cadena larga y aleatoria.)

> 📌 La `DATABASE_URL` la obtienes de Neon/Supabase (ver **Paso B.1**). También puedes usar un Postgres local si ya tienes uno instalado.

### 4. Sincronizar la base de datos (crear las tablas)

```bash
npx prisma db push
```

Esto crea todas las tablas (`User`, `Habit`, `HabitLog`, `FinancialSummary`, `FixedExpense`, `ProjectGoal`, etc.) en tu base de datos.

### 5. (Opcional) Cargar datos de prueba

```bash
npm run db:seed
```

Crea un usuario de demostración con hábitos y finanzas de ejemplo:

- **Email:** `demo@lifetracker.app`
- **Contraseña:** `password123`

### 6. Iniciar el servidor local

```bash
npm run dev
```

Abre tu navegador en **http://localhost:3000** 🎉

- Si activaste el **Modo Usuario Único**, entrarás directo al Dashboard.
- Si usaste la opción con login, ve a `/register` para crear tu cuenta o `/login` para entrar con el usuario demo.

---

## ☁️ PASO B — Despliegue en Producción (Vercel)

Publica tu app en internet, gratis y accesible desde cualquier dispositivo.

### B.1 — Crear la base de datos Postgres gratuita

Elige **una** opción:

#### Opción A: Neon (recomendado)

1. Entra a https://neon.tech e inicia sesión (puedes usar GitHub).
2. Haz clic en **Create Project** → dale un nombre (ej. `lifetracker`).
3. Cuando se cree, verás una sección **Connection string**.
4. Copia la URL que empieza con `postgresql://...`. Esa es tu **`DATABASE_URL`**.
   - Asegúrate de que termine en `?sslmode=require`.

#### Opción B: Vercel Storage (Postgres)

1. En el panel de Vercel ve a **Storage → Create Database → Postgres**.
2. Sigue el asistente; Vercel puede inyectar la `DATABASE_URL` automáticamente al proyecto.

#### Opción C: Supabase

1. Entra a https://supabase.com → **New Project**.
2. Ve a **Project Settings → Database → Connection string → URI**.
3. Copia la URL y reemplaza `[YOUR-PASSWORD]` por la contraseña que definiste.

> 💾 **Guarda esa `DATABASE_URL`**, la usarás en el paso B.4.

### B.2 — Subir el repositorio a tu GitHub

Si aún no está en GitHub:

```bash
git init
git add .
git commit -m "LifeTracker inicial"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/lifetracker.git
git push -u origin main
```

### B.3 — Importar el proyecto en Vercel

Tienes dos caminos:

**Camino rápido (botón 1-clic):** usa el botón *Deploy with Vercel* del `README.md` y Vercel te pedirá clonar el repo y las variables directamente.

**Camino manual:**
1. Entra a https://vercel.com/new
2. Selecciona **Import Git Repository** y elige tu repo `lifetracker`.
3. Vercel detecta Next.js automáticamente. **No cambies** el Build Command (ya está configurado en `vercel.json` como `prisma generate && next build`).

### B.4 — Configurar Variables de Entorno en Vercel

En la pantalla de importación (o luego en **Project → Settings → Environment Variables**), agrega:

| Variable | Valor | ¿Cuándo? |
|----------|-------|----------|
| `DATABASE_URL` | La URL de Neon/Supabase del paso B.1 | Siempre |
| `SINGLE_USER_MODE` | `true` | Si quieres uso personal sin login |
| `NEXT_PUBLIC_SINGLE_USER_MODE` | `true` | Igual que la anterior |
| `NEXTAUTH_SECRET` | Cadena aleatoria (`openssl rand -base64 32`) | Sólo si usas login |
| `NEXTAUTH_URL` | La URL de tu app (ej. `https://lifetracker.vercel.app`) | Sólo si usas login |

> ✅ **Para uso personal**, define únicamente `DATABASE_URL`, `SINGLE_USER_MODE=true` y `NEXT_PUBLIC_SINGLE_USER_MODE=true`.

Haz clic en **Deploy** y espera a que termine el build.

### B.5 — Crear las tablas en la base de datos de producción

La primera vez, la base de datos de producción está vacía. Crea las tablas apuntando `prisma db push` a tu `DATABASE_URL` de producción.

Desde tu computadora:

```bash
# Usa temporalmente la URL de producción
DATABASE_URL="postgresql://...tu-url-de-neon..." npx prisma db push
```

> En Windows (PowerShell):
> ```powershell
> $env:DATABASE_URL="postgresql://...tu-url-de-neon..."; npx prisma db push
> ```

Esto sincroniza el esquema con la base de producción. Sólo necesitas hacerlo la primera vez (o cuando cambie el esquema).

### B.6 — ¡Listo!

Abre la URL que te dio Vercel (ej. `https://lifetracker.vercel.app`). Tu app ya está en línea. 🌐

---

## 🔧 Solución de problemas

| Problema | Causa probable | Solución |
|----------|----------------|----------|
| `Environment variable not found: DATABASE_URL` | Falta la variable en Vercel | Agrégala en **Settings → Environment Variables** y vuelve a desplegar |
| Las páginas cargan pero no guardan datos | No corriste `prisma db push` en producción | Ejecuta el paso **B.5** |
| Me pide login y no quiero | Modo usuario único desactivado | Pon `SINGLE_USER_MODE=true` y `NEXT_PUBLIC_SINGLE_USER_MODE=true` y redepliega |
| Error de conexión SSL a la BD | Falta `sslmode=require` | Añádelo al final de la `DATABASE_URL` |
| Cambié variables y no aplican | Vercel cachea el build | Ve a **Deployments → Redeploy** |

---

## 📁 Scripts útiles

| Comando | Qué hace |
|---------|----------|
| `npm run dev` | Servidor de desarrollo (localhost:3000) |
| `npm run build` | Compila para producción (`prisma generate && next build`) |
| `npm start` | Inicia la app ya compilada |
| `npm run db:push` | Crea/actualiza las tablas en la BD |
| `npm run db:seed` | Carga datos de demostración |

---

Para aprender a **usar** la aplicación, consulta **[USER_GUIDE.md](./USER_GUIDE.md)**.
