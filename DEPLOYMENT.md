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

> ✅ **Orden recomendado:** primero el **Paso 0** (crear la base de datos en Neon), luego el **Paso A** (instalación local) y finalmente el **Paso B** (publicar en Vercel).

---

## 🐘 PASO 0 — Crear tu base de datos gratuita en Neon (¡hazlo primero!)

**Antes de ejecutar el script de instalación o desplegar, necesitas una base de datos.** Esta es la parte donde se guardan tus hábitos y finanzas. Neon ofrece Postgres gratis y es la opción recomendada.

1. Entra a **https://neon.tech** y haz clic en **Sign Up**. Puedes registrarte con tu cuenta de **GitHub** o **Google** (lo más rápido).
2. Una vez dentro, haz clic en **Create Project** (Crear proyecto).
   - **Name:** ponle un nombre, por ejemplo `lifetracker`.
   - **Postgres version:** deja la que viene por defecto.
   - **Region:** elige la más cercana a ti (ej. *US East (Ohio)*).
3. Haz clic en **Create** y espera unos segundos a que se cree.
4. Se abrirá una ventana **"Connect to your database"** (o ve al botón **Connect** arriba a la izquierda).
   - Deja activado **Connection pooling** ✅.
   - Verás la **Connection string**. Cópiala con el botón **Copy snippet**.

Esa cadena tiene esta forma (**ejemplo**, la tuya tendrá otros valores):

```
postgresql://neondb_owner:npg_ejemplo123ABC@ep-nombre-aleatorio-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

> 💾 **Guarda esa cadena en un lugar seguro.** Es tu `DATABASE_URL` y la usarás tanto para el script de instalación local como para Vercel.
>
> 🔧 No te preocupes por el parámetro `channel_binding=require`: el script de instalación lo limpia automáticamente porque a veces da problemas con Prisma.
>
> 🔐 **Seguridad:** trata esa cadena como una contraseña. Si alguna vez se filtra, en Neon puedes regenerarla con el botón **Reset password** de esa misma pantalla.

> 💡 Alternativa: también puedes usar **Supabase** (https://supabase.com → New Project → Settings → Database → Connection string → URI) o **Vercel Storage → Postgres**. Cualquier Postgres funciona.

---

## 🖥️ PASO A — Instalación Local (en tu computadora)

Usa esto para probar la app antes de publicarla. Tienes dos caminos: el **automático** (recomendado) y el **manual**.

### ⚡ Opción rápida — Script automatizado (recomendado)

Después de clonar el repositorio, un solo comando lo configura todo: crea `.env.local`, instala dependencias, crea las tablas en tu base de datos y opcionalmente carga datos de ejemplo.

```bash
git clone https://github.com/TU_USUARIO/lifetracker.git
cd lifetracker
npm run setup
```

El asistente te pedirá:

1. **Tu `DATABASE_URL`** → pega la connection string que copiaste de Neon en el Paso 0.
2. **Modo de uso** → responde **S** (Sí) para *Modo Usuario Único* (entras sin login, ideal para uso personal).
3. **Datos de ejemplo** → opcional, para ver la app con hábitos y finanzas de muestra.

Cuando termine, verás **"¡Listo! 🎉"**. Inicia la app con:

```bash
npm run dev
```

Y abre **http://localhost:3000** 🎉

> 🤖 **Uso avanzado / automatización** (sin preguntas interactivas):
> ```bash
> DATABASE_URL="postgresql://...tu-cadena-de-neon..." SINGLE_USER_MODE=true SEED=false npm run setup -- --yes
> ```
> Útil para scripts o para configurar la app en varias máquinas rápidamente.

---

### 🔧 Opción manual (paso a paso)

Si prefieres hacerlo a mano o entender qué ocurre por dentro:

#### 1. Clonar el repositorio

```bash
git clone https://github.com/TU_USUARIO/lifetracker.git
cd lifetracker
```

#### 2. Instalar dependencias

```bash
npm install
```

Esto instala todo y ejecuta automáticamente `prisma generate` (gracias al script `postinstall`).

#### 3. Crear el archivo de variables de entorno

Copia la plantilla y crea tu archivo local `.env.local`:

```bash
cp .env.example .env.local
```

Abre `.env.local` con tu editor y complétalo. Tienes **dos formas** de configurarlo:

##### Opción 1 — Modo Usuario Único (recomendado para uso personal) ✅

No pide login: la app crea y usa un único usuario automáticamente.

```bash
DATABASE_URL="postgresql://usuario:password@host/basedatos?sslmode=require"

# Activa el modo personal (ambas variables con el mismo valor)
SINGLE_USER_MODE="true"
NEXT_PUBLIC_SINGLE_USER_MODE="true"
```

##### Opción 2 — Con Login (multiusuario, vía NextAuth)

```bash
DATABASE_URL="postgresql://usuario:password@host/basedatos?sslmode=require"

NEXTAUTH_SECRET="pega-aqui-el-secreto-que-generaste"
NEXTAUTH_URL="http://localhost:3000"

SINGLE_USER_MODE="false"
NEXT_PUBLIC_SINGLE_USER_MODE="false"
```

> ---
> ⚠️ **IMPORTANTE — Generar `NEXTAUTH_SECRET` (obligatorio para modo con login)**
>
> `NEXTAUTH_SECRET` es una clave secreta que la app usa para firmar las sesiones de los usuarios. **Sin ella, el build falla y la app no arranca.** No tiene relación con la base de datos — es independiente de Neon.
>
> **Cómo generarlo:**
>
> Abre tu terminal y ejecuta:
> ```bash
> openssl rand -base64 32
> ```
>
> Te dará algo como: `K7x3pQ9mZ2bN8vF1...` — copia ese valor completo y pégalo como valor de `NEXTAUTH_SECRET`.
>
> **¿No tienes `openssl`?** (Windows sin Git Bash): usa cualquier cadena larga y aleatoria de al menos 32 caracteres. También puedes generar uno online en https://generate-secret.vercel.app/32
>
> **Notas:**
> - Este secreto **no expira**. Úsalo indefinidamente.
> - Si lo cambias, todos los usuarios tendrán que iniciar sesión de nuevo.
> - **Guárdalo en un lugar seguro** — si lo pierdes, genera uno nuevo y redespliega.
> - En **desarrollo local**, el script `npm run setup` lo genera automáticamente por ti.
> ---

> 📌 La `DATABASE_URL` es la que copiaste de Neon en el **Paso 0**. Puedes quitarle el `&channel_binding=require` del final para evitar problemas con Prisma.

#### 4. Sincronizar la base de datos (crear las tablas)

```bash
npx prisma db push
```

Esto crea todas las tablas (`User`, `Habit`, `HabitLog`, `FinancialSummary`, `FixedExpense`, `ProjectGoal`, etc.) en tu base de datos.

#### 5. (Opcional) Cargar datos de prueba

```bash
npm run db:seed
```

Crea un usuario de demostración con hábitos y finanzas de ejemplo:

- **Email:** `demo@lifetracker.app`
- **Contraseña:** `password123`

#### 6. Iniciar el servidor local

```bash
npm run dev
```

Abre tu navegador en **http://localhost:3000** 🎉

- Si activaste el **Modo Usuario Único**, entrarás directo al Dashboard.
- Si usaste la opción con login, ve a `/register` para crear tu cuenta o `/login` para entrar con el usuario demo.

---

## ☁️ PASO B — Despliegue en Producción (Vercel)

Publica tu app en internet, gratis y accesible desde cualquier dispositivo.

> ⚡ **Despliegue automático (resumen).** El proyecto está configurado para que, una vez conectes GitHub → Vercel → Neon, **todo el resto ocurra solo**:
> 1. **Copia/forkea** el repo a tu GitHub.
> 2. **Importa** el repo en Vercel.
> 3. **Conecta Neon** (integración de Neon en Vercel, o pega `DATABASE_URL` en las variables de entorno).
> 4. Vercel despliega y el script `scripts/deploy.mjs` **crea las tablas automáticamente** y compila la app.
>
> No necesitas correr `prisma db push` ni comandos manuales: en cuanto Vercel detecta la conexión a Neon (`DATABASE_URL`), el deploy deja la app **lista y funcionando**, con arranque limpio.

### B.1 — Tener lista la base de datos

Si seguiste el **Paso 0**, ya tienes tu base de datos en Neon y tu `DATABASE_URL` guardada. Úsala tal cual en el paso B.4.

> 💡 Si aún no la creaste, vuelve al **[Paso 0](#-paso-0--crear-tu-base-de-datos-gratuita-en-neon-hazlo-primero)**. También sirven **Supabase** (Project Settings → Database → Connection string → URI) o **Vercel Storage → Postgres**.
>
> ✅ **Producción sin pasos manuales:** las tablas se crean **automáticamente** durante el despliegue (lo hace `scripts/deploy.mjs` en cuanto detecta tu `DATABASE_URL`). No tienes que ejecutar `prisma db push` a mano. Ver **Paso B.5**.

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
3. Vercel detecta Next.js automáticamente. **No cambies** el Build Command (ya está configurado en `vercel.json` como `node scripts/deploy.mjs`, que se encarga de crear las tablas y compilar automáticamente).

### B.4 — Configurar Variables de Entorno en Vercel

En la pantalla de importación (o luego en **Project → Settings → Environment Variables**), agrega:

| Variable | Valor | ¿Cuándo? |
|----------|-------|----------|
| `DATABASE_URL` | La URL **pooled** de Neon del paso 0 (termina en `?sslmode=require`) | Siempre |
| `SINGLE_USER_MODE` | `true` | Si quieres uso personal sin login |
| `NEXT_PUBLIC_SINGLE_USER_MODE` | `true` | Igual que la anterior |
| `NEXTAUTH_SECRET` | Cadena aleatoria (ver abajo cómo generarla) | ⚠️ **Obligatoria** si usas login |
| `NEXTAUTH_URL` | La URL de tu app (ej. `https://tuapp.vercel.app`) | ⚠️ **Obligatoria** si usas login |

> Marca cada variable para los entornos **Production, Preview y Development** (o "All Environments").

> ✅ **Para uso personal (recomendado)**, define únicamente estas tres:
> ```
> DATABASE_URL = postgresql://...pooler...neon.tech/neondb?sslmode=require
> SINGLE_USER_MODE = true
> NEXT_PUBLIC_SINGLE_USER_MODE = true
> ```
> Con `SINGLE_USER_MODE=true` la app **omite NextAuth**, así que **NO necesitas** `NEXTAUTH_SECRET` ni `NEXTAUTH_URL`.

> ---
> ⚠️ **¿Vas a usar login? Lee esto primero:**
>
> Si pusiste `SINGLE_USER_MODE=false`, la app activa el sistema de registro/login y **necesitas obligatoriamente** agregar `NEXTAUTH_SECRET`. Sin este valor, **el deploy fallará** con el error:
>
> ```
> Error: NEXTAUTH_SECRET no está definido. Es obligatorio en producción con login.
> ```
>
> **Cómo obtener tu `NEXTAUTH_SECRET`:**
> 1. Abre una terminal en tu computadora.
> 2. Ejecuta: `openssl rand -base64 32`
> 3. Copia el resultado (ej: `K7x3pQ9mZ2bN8vF1wR5...`).
> 4. En Vercel → Environment Variables → agrega `NEXTAUTH_SECRET` con ese valor. Tipo: **Secret**.
>
> **¿Qué es esto?** Es una "llave" que la app usa para proteger las sesiones de los usuarios. No tiene relación con la base de datos de Neon — son cosas separadas.
>
> **¿No tienes `openssl`?** Genera uno aquí: https://generate-secret.vercel.app/32
> ---

> ⚠️ **Error común:** si ves en los logs `[next-auth][error][NO_SECRET] Please define a secret in production` (error 500 al abrir la app), significa que la app está intentando usar login pero falta el secret. La causa casi siempre es que **falta `SINGLE_USER_MODE=true`**. Agrégala (junto con `NEXT_PUBLIC_SINGLE_USER_MODE=true`) y vuelve a desplegar.

Haz clic en **Deploy** y espera a que termine el build.

### B.5 — Creación automática de las tablas (¡sin pasos manuales!) ✨

**Ya no necesitas ejecutar `prisma db push` a mano.** El build de Vercel corre `node scripts/deploy.mjs`, que hace todo automáticamente:

1. Genera el cliente Prisma.
2. **Detecta tu `DATABASE_URL`** (la de Neon que configuraste en B.4) y **crea/sincroniza las tablas** en la base de datos automáticamente (`prisma db push`, usando la conexión directa sin `-pooler`).
3. Compila la app (`next build`).

Es **idempotente y no destructivo**: en cada despliegue vuelve a sincronizar el esquema sin borrar tus datos. La app **arranca limpia** (sin datos de demostración).

> 🔄 En resumen: en cuanto **Neon está conectado a Vercel** (existe `DATABASE_URL`), el primer deploy deja **todo listo solo** — tablas creadas y app publicada. No hay que correr comandos manuales.
>
> ℹ️ Si haces un *preview deploy* sin `DATABASE_URL`, el script omite la creación de tablas para no fallar el build y solo compila.

### B.6 — Redesplegar tras cambiar variables (¡importante!)

Vercel **no aplica** las variables de entorno nuevas a un deploy que ya existe. Cada vez que agregues o cambies una variable, debes redesplegar:

1. Ve a **Deployments** (barra lateral).
2. En el deployment más reciente, haz clic en **⋯** (tres puntos) → **Redeploy**.
3. Confirma y espera a que el estado quede en **Ready** (verde).

### B.7 — ¡Listo!

Abre la URL que te dio Vercel (ej. `https://tuapp.vercel.app`). Con el modo usuario único activo, entrarás **directo al Dashboard** y todo lo que registres se guardará en tu base de datos. 🌐

> 🔐 **Seguridad:** si en algún momento tu `DATABASE_URL` (con la contraseña) quedó expuesta, rótala en Neon con **Reset password** y actualiza la variable en Vercel.

---

## 🔧 Solución de problemas

| Problema | Causa probable | Solución |
|----------|----------------|----------|
| `Environment variable not found: DATABASE_URL` | Falta la variable en Vercel | Agrégala en **Settings → Environment Variables** y vuelve a desplegar |
| `NEXTAUTH_SECRET no está definido` (falla el build) | Tienes `SINGLE_USER_MODE=false` pero no agregaste el secret | Genera uno con `openssl rand -base64 32`, agrégalo como `NEXTAUTH_SECRET` en Vercel y redespliega. Ver [sección B.4](#b4--configurar-variables-de-entorno-en-vercel) |
| Las páginas cargan pero no guardan datos | El deploy no pudo crear las tablas (¿faltaba `DATABASE_URL` al desplegar?) | Verifica que `DATABASE_URL` esté en Vercel y vuelve a desplegar (**Deployments → Redeploy**); el script `deploy.mjs` crea las tablas solo |
| Me pide login y no quiero | Modo usuario único desactivado | Pon `SINGLE_USER_MODE=true` y `NEXT_PUBLIC_SINGLE_USER_MODE=true` y redepliega |
| Error de conexión SSL a la BD | Falta `sslmode=require` | Añádelo al final de la `DATABASE_URL` |
| Cambié variables y no aplican | Vercel cachea el build | Ve a **Deployments → Redeploy** |

---

## 📁 Scripts útiles

| Comando | Qué hace |
|---------|----------|
| `npm run setup` | **Configuración guiada**: crea `.env.local`, instala deps, crea tablas y (opcional) datos demo |
| `npm run dev` | Servidor de desarrollo (localhost:3000) |
| `npm run dev:verify` | **Verificación local del desarrollador**: levanta una BD interna efímera (Docker), crea las tablas y compila la app de punta a punta. Flags: `SEED=true`, `KEEP_DB=true`, `DEV_DB_PORT=5433` |
| `npm run build` | Compila para producción (`prisma generate && next build`) |
| `npm run deploy` | **Despliegue automático** (lo usa Vercel): genera cliente + crea/sincroniza tablas si hay `DATABASE_URL` + compila. Arranque limpio, sin seed |
| `npm start` | Inicia la app ya compilada |
| `npm run db:push` | Crea/actualiza las tablas en la BD |
| `npm run db:seed` | Carga datos de demostración |

---

Para aprender a **usar** la aplicación, consulta **[USER_GUIDE.md](./USER_GUIDE.md)**.
