# 👤 Guía del Usuario — Cómo tener tu propia LifeTracker

Esta guía es para **cualquier persona**, sin conocimientos técnicos. Te explica, en orden y con palabras simples, cómo tener tu propia copia de **LifeTracker** funcionando en internet y guardando tus datos.

Vas a usar tres servicios **gratuitos**:

1. **GitHub** → guarda el código de la app.
2. **Neon** → es la base de datos (donde se guardan tus hábitos y finanzas).
3. **Vercel** → publica la app en internet con su propia dirección web.

> ⏱️ Tiempo estimado: 15–20 minutos. No necesitas instalar nada en tu computadora si sigues el camino "en línea".

---

## 🗺️ El mapa: cómo se conecta todo

```
   TÚ  ──▶  Vercel (la app en internet)  ──▶  Neon (tu base de datos)
                 ▲
                 │ toma el código de
                 │
             GitHub (el código)
```

- **GitHub** guarda el código.
- **Vercel** lee ese código y lo publica como página web.
- **Neon** guarda tu información y Vercel se conecta a ella.

---

## 1️⃣ Crear tu cuenta de GitHub y copiar el proyecto

1. Entra a **https://github.com/signup** y crea una cuenta (o inicia sesión si ya tienes).
2. Ve al proyecto original de LifeTracker.
3. Haz clic en el botón **Fork** (arriba a la derecha). Esto crea **tu propia copia** del proyecto en tu cuenta.

> 💡 "Fork" = copia personal. Así tienes el código en tu cuenta sin afectar el original.

---

## 2️⃣ Crear tu base de datos gratis en Neon

Aquí es donde se guardan tus datos. **Este paso es obligatorio.**

1. Entra a **https://neon.tech** y haz clic en **Sign Up**. Regístrate con **GitHub** o **Google** (lo más rápido).
2. Haz clic en **Create Project**:
   - **Name:** `lifetracker` (o el que quieras).
   - **Region:** la más cercana a ti.
3. Haz clic en **Create**.
4. Se abrirá **"Connect to your database"** (o usa el botón **Connect**):
   - Deja activado **Connection pooling** ✅.
   - Copia la **Connection string** con **Copy snippet**.

La cadena se ve así (**ejemplo**, la tuya tendrá otros valores):

```
postgresql://neondb_owner:TU_PASSWORD@ep-nombre-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require
```

> 💾 Guárdala en un bloc de notas. La necesitarás en el paso 4.
> 🔐 Trátala como una contraseña: no la compartas con nadie.

---

## 3️⃣ Publicar la app en Vercel

1. Entra a **https://vercel.com/signup** e inicia sesión **con tu cuenta de GitHub**.
2. Haz clic en **Add New… → Project**.
3. Busca tu copia del repositorio (`lifetracker`) y haz clic en **Import**.
4. Vercel detecta que es una app Next.js automáticamente. **No cambies** la configuración de build.
5. **Antes de hacer Deploy**, ve a la sección **Environment Variables** (variables de entorno) y agrega las del paso 4.

---

## 4️⃣ Conectar la base de datos (variables de entorno) — ¡el paso clave!

En Vercel, en **Environment Variables**, agrega estas **tres** variables (botón **Add**). Marca que apliquen a **todos los entornos** (Production, Preview, Development):

| Nombre (Key) | Valor (Value) |
|--------------|---------------|
| `DATABASE_URL` | La connection string que copiaste de Neon en el paso 2 |
| `SINGLE_USER_MODE` | `true` |
| `NEXT_PUBLIC_SINGLE_USER_MODE` | `true` |

> ✅ Con `SINGLE_USER_MODE` en `true`, la app **no te pedirá usuario ni contraseña**: entras directo. Perfecto para uso personal.

> ⚠️ **No agregues `NEXTAUTH_SECRET`** en este modo; no se usa. (Sólo haría falta si quisieras activar inicio de sesión con cuentas, que no es tu caso.)

Ahora sí, haz clic en **Deploy** y espera a que termine (verás el estado **Ready** en verde).

---

## 5️⃣ Las tablas se crean solas ✨ (no tienes que hacer nada)

Antes, este paso requería que un desarrollador ejecutara un comando para crear las "tablas" de la base de datos. **Ya no es necesario.**

Cuando haces **Deploy** en Vercel (paso anterior), el proyecto **detecta tu base de datos de Neon** (la variable `DATABASE_URL` que agregaste) y **crea todas las tablas automáticamente** antes de publicar la app. La app arranca **limpia y lista para usar**.

> ✅ En resumen: si agregaste bien las 3 variables del paso 4 y le diste **Deploy**, no tienes que hacer nada más aquí. Pasa al paso 6 para verificar.
>
> ℹ️ ¿Y si cambias algo en la base de datos más adelante? No te preocupes: cada vez que Vercel vuelve a desplegar, sincroniza las tablas solo, **sin borrar tus datos**.

---

## 6️⃣ Verificar que todo funciona

1. En Vercel, copia la dirección de tu app (algo como `https://tuapp.vercel.app`).
2. Ábrela en el navegador.
3. Deberías ver el **Dashboard** directamente (sin login).
4. Marca un hábito o crea un proyecto, recarga la página: **si sigue ahí, está guardando correctamente.** 🎉

---

## ❓ Si algo sale mal

| Lo que ves | Qué significa | Qué hacer |
|------------|---------------|-----------|
| Pantalla en blanco o "Application error" | Faltan variables o la base de datos no está conectada | Revisa que las 3 variables del paso 4 estén bien escritas y vuelve a desplegar |
| Te pide iniciar sesión | Falta `SINGLE_USER_MODE=true` | Agrégala (y `NEXT_PUBLIC_SINGLE_USER_MODE=true`) y vuelve a desplegar |
| Marco un hábito y al recargar desaparece | La base de datos no se conectó al desplegar | Verifica que `DATABASE_URL` esté bien escrita en Vercel y **vuelve a desplegar** (las tablas se crean solas en el deploy) |

> 🔁 **Muy importante:** cada vez que cambies una variable en Vercel, tienes que **volver a desplegar** (Deployments → ⋯ → **Redeploy**). Vercel no aplica los cambios automáticamente.

---

## 📚 ¿Quieres saber más?

- **Cómo usar la app día a día** (hábitos, finanzas, métricas) → `USER_GUIDE.md`
- **Guía técnica detallada de instalación** → `DEPLOYMENT.md`
- **Para desarrolladores** → `docs/DEV_GUIDE.md`
