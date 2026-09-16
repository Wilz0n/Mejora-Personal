# 🎨 Personalización — QuickCSS, Icono de la App y Colapso de la Barra Lateral

> Documento de referencia de las funciones de **personalización de la interfaz** de LifeTracker: editor QuickCSS (temas), icono de la app (favicon + logo) y el colapso animado de la barra lateral en Desktop. Cubre qué hace cada pieza, dónde vive el código y cómo extenderla.

---

## 1. Resumen

| Función | Qué permite | Persistencia |
|---------|-------------|--------------|
| **QuickCSS** | Re-tematizar toda la app (colores, fondo, fuentes, glass, efectos) editando CSS o pegando un tema | **Base de datos** (`User.quickCss`, por usuario → se sincroniza a todos sus dispositivos) |
| **Icono de la App** | Cambiar el favicon (pestaña) y el logo de la barra lateral | Base de datos (`User.appIcon`, por usuario) |
| **Colapso de la barra lateral** | Ocultar/mostrar la barra lateral con animación (solo Desktop) | Estado en memoria (no persiste) |

Todo se gestiona desde **Ajustes** (`/settings`).

---

## 2. QuickCSS (editor de temas tipo Vencord)

### 2.1 Qué es
Un editor de código donde el usuario escribe CSS que sobreescribe el diseño por defecto ("Nocturne"). El tema se **persiste en la base de datos** (`User.quickCss`), por lo que se aplica **igual en todos los dispositivos** del usuario (desktop, móvil, etc.). La plantilla precargada expone variables `--lt-*` y reglas conectadas a las clases reales del design system, de modo que editar valores re-tematiza la app de forma coherente. Pensado para editar a mano **o** pegar un tema generado por una IA.

### 2.2 Archivos
| Archivo | Rol |
|---------|-----|
| `prisma/schema.prisma` | Campo `User.quickCss String? @db.Text` (tema persistido; `null` = por defecto) |
| `src/lib/validators.ts` | `updateQuickCssSchema` (`quickCss` string, máx. 200 KB) |
| `src/app/actions/settings.ts` | Server Actions `setQuickCss` (guardar; vacío → `null`) y `clearQuickCss` (restablecer → `null`) |
| `src/lib/db/data.ts` | `getUserProfile` devuelve `quickCss` |
| `src/lib/constants/default-css.ts` | Plantilla `DEFAULT_QUICK_CSS`, `QUICK_CSS_STYLE_ID` (server), `QUICK_CSS_PREVIEW_STYLE_ID` (preview del editor) |
| `src/lib/quick-css.ts` | Helpers de **vista previa en vivo** del editor: `applyQuickCssPreview`, `clearQuickCssPreview` (nodo propio, NO tocan el de React) |
| `src/components/comun/QuickCssStyle.tsx` | Server Component que inyecta el `<style>` del tema **desde la BD** (sin FOUC) |
| `src/components/settings/QuickCSSEditor.tsx` | Tarjeta + editor (overlay grande vía React Portal) |

### 2.3 Cómo funciona la inyección (sin FOUC) y la persistencia
- El tema vive en `User.quickCss`. En `src/app/(app)/layout.tsx` (server) se lee vía `getUserProfile` y se pasa a **`QuickCssStyle`**, que renderiza `<style id="custom-lifetracker-css">` directamente en el HTML del servidor → **sin FOUC** y **en cualquier dispositivo** (no depende del navegador local).
- **Vista previa en vivo:** mientras el usuario edita, el editor aplica los cambios con `applyQuickCssPreview`, que crea/actualiza un `<style id="quickcss-live-preview">` **propio** (nodo que React NO controla). Al Guardar/Restablecer/cerrar, ese preview se elimina y manda el `<style>` server-side.
- ⚠️ **Importante (bug histórico):** NO usar `<script>` crudo ni manipular nodos `<link>`/`<style>` que renderiza React. Hacerlo provocó `Cannot read properties of null (reading 'removeChild')` al navegar (React perdía la referencia del nodo). Por eso el tema se inyecta server-side y el preview usa un nodo separado propio del cliente.

### 2.4 Estructura de la plantilla `DEFAULT_QUICK_CSS`
Organizada por secciones comentadas:
- `0. VARIABLES BASE` — el 90% del tema (paleta, **fondo**, glass, tipografía, glow).
- `1. Fondo y layout` · `2. Tipografía` · `3. Paneles/glass` · `4. Botones/acentos` · `5. Navegación` · `6. Estados y gráficos`.
- `7. Ajustes por página` — hooks opcionales `[data-page="dashboard|habitos|finanzas"]`.
- `8. Recetas` — temas de ejemplo comentados (Cyberpunk, Matrix, OLED) listos para descomentar.

**Variables de fondo (100% por código, sin imágenes):**
- `--lt-background` — color plano.
- `--lt-bg-image` — cualquier `background-image` CSS (gradientes, `repeating-linear-gradient` para scanlines, capas múltiples).
- `--lt-bg-size`, `--lt-bg-attachment` — tamaño y comportamiento (fixed por defecto).
- `--lt-nav-bg` — fondo de barra lateral / topbar / bottom-nav.

Para que el fondo cubra toda la pantalla, los contenedores del área principal (`.bg-background`, `.bg-surface`) se ponen **transparentes** y el fondo vive en `html, body`.

### 2.5 Acciones del editor
- **Guardar y Aplicar** → `setQuickCss` (persiste en BD; `router.refresh()` para que el `<style>` server-side refleje lo guardado). Muestra estado "Guardando…"/"Aplicado".
- **Copiar** → copia todo el CSS al portapapeles (para llevarlo a una IA).
- **Restablecer** → `clearQuickCss`: **BORRA el registro en la BD (`null`)** para no acumular contenido innecesario ni malgastar almacenamiento; vuelve al tema Nocturne.

### 2.6 Responsive (móvil)
- Overlay a **pantalla completa** en móvil (`w-full h-full`), panel centrado grande en Desktop (`sm:max-w-6xl sm:h-[92vh]`).
- Altura en **`100dvh`** para respetar el teclado virtual (no tapa editor ni botones).
- Header compacto (subtítulo oculto en móvil), gutter/padding reducidos, textarea con `WebkitTextSizeAdjust: 100%` (evita auto-zoom iOS) y `touchAction: pan-x pan-y`.
- Footer: botones apilados/anchos en móvil, en fila en Desktop.

### 2.7 Notas
- Los overrides usan `!important` a nivel global (como Vencord): un tema agresivo también restiliza el propio editor y el modo activo. Es el comportamiento esperado; "Restablecer" siempre vuelve a Nocturne.
- El editor NO reutiliza `comun/ui/Modal` (fijado a `max-w-md`); usa su propio overlay, también con **React Portal** por el `backdrop-filter` de `.glass-panel`.

---

## 3. Icono de la App (favicon + logo de la barra lateral)

### 3.1 Qué es
Un icono personalizado que el usuario sube (`.png`/`.avif`/`.webp`/`.jpg`) y que se usa en **dos lugares**:
1. **Favicon** — el icono de la pestaña del navegador.
2. **Logo de la barra lateral** — el icono junto a "LifeTracker / Productive Mindset".

Persistente en la base de datos (por usuario, multi-dispositivo).

### 3.2 Modelo de datos
- Campo nuevo **`User.appIcon String? @db.Text`** (Data URL comprimido o `null` = icono por defecto).

### 3.3 Archivos
| Archivo | Rol |
|---------|-----|
| `prisma/schema.prisma` | Campo `User.appIcon` |
| `src/lib/validators.ts` | `updateAppIconSchema` (máx. ~120 KB; acepta `data:image/(avif\|webp\|png\|jpe?g)` o URL http) |
| `src/app/actions/settings.ts` | Server Action `setAppIcon` (`getUserId → parse → prisma.user.update → revalidatePath("/","layout")`) |
| `src/lib/db/data.ts` | `getUserProfile` devuelve `appIcon` |
| `src/components/settings/botones/AppIconButton.tsx` | Subida + compresión + Guardar/Restablecer |
| `src/components/comun/FaviconSetter.tsx` | Aplica el favicon en runtime |
| `public/favicon.svg` | Favicon por defecto (la hoja del logo) |

### 3.4 Flujo
1. En Ajustes → sección **"Identidad e Icono"**, bajo "Editar Perfil", el botón **"Icono de la App"** abre un modal.
2. El usuario sube una imagen; se **comprime en el navegador** a 64×64 (AVIF → WebP → PNG, conservando transparencia; se evita JPEG a propósito) y se obtiene un Data URL pequeño.
3. "Guardar" llama a `setAppIcon`, que persiste `appIcon` y revalida el layout.
4. El layout `(app)/layout.tsx` lee `profile.appIcon` y lo pasa a `Sidebar` (logo) y a `FaviconSetter` (favicon).

### 3.5 Favicon por defecto y restablecer
- Por defecto (sin `appIcon`), el favicon es **`public/favicon.svg`** (hoja), declarado en `metadata.icons.icon` del layout root.
- `FaviconSetter` (cliente): si hay `appIcon` lo usa; si no, **restaura** `/favicon.svg`. Quita los `<link rel="icon">` previos para evitar duplicados.
- En el modal, el botón **"Restablecer"** (junto a "Subir icono") vacía la selección (la vista previa vuelve a la hoja `eco`); al **Guardar** se persiste `null` y todo vuelve al icono por defecto.

---

## 4. Colapso animado de la barra lateral (solo Desktop)

### 4.1 Qué es
En Desktop, el **logo/icono** de la barra lateral funciona como botón: al pulsarlo, la barra se **desliza fuera** por la izquierda (animación) y el contenido se expande; al pulsar de nuevo vuelve a desplegarse. El icono **no cambia** (no es un icono hamburguesa distinto). En **móvil no aplica** (se usa la bottom-nav).

### 4.2 Archivos (`src/components/animacion/`)
| Archivo | Rol |
|---------|-----|
| `SidebarCollapseContext.tsx` | `SidebarCollapseProvider` + hook `useSidebarCollapse` (`collapsed`, `toggle`, `setCollapsed`) |
| `MainContent.tsx` | Contenedor `<main>` que anima el margen (`md:ml-60` ↔ `md:ml-0`, `transition-[margin] 300ms`) |
| `SidebarReopenButton.tsx` | Botón flotante (Desktop) que reaparece arriba-izquierda cuando está colapsada, con el **mismo icono/appIcon**, para reabrir |

### 4.3 Cómo funciona
- El estado vive en `SidebarCollapseProvider`, que envuelve el layout autenticado en `(app)/layout.tsx`.
- `Sidebar` consume `collapsed` y aplica `-translate-x-full` (oculta) o `translate-x-0` (visible) con `transition-transform`. Su logo llama a `toggle`.
- Como el logo se va con la barra al ocultarse, `SidebarReopenButton` deja el mismo icono fijo en la esquina (fade-in) para reabrir.
- `MainContent` ajusta el margen izquierdo según `collapsed`, animando la expansión/contracción del contenido.
- Todo el comportamiento es `md:` en adelante; en móvil el margen base ya es 0 y la barra está oculta.

---

## 5. Dónde vive en la UI (Ajustes)

- **Sección "Identidad e Icono"** (antes "Identidad"): avatar/nombre/email + "Editar Perfil" + **"Icono de la App"** + "Cerrar sesión".
- **Sección "Preferencias de la Aplicación"**: Moneda, Zona Horaria y **Personalización** (tarjeta que abre el editor QuickCSS). *La antigua fila "Tema de la Interfaz" (Claro/Oscuro) fue retirada; el diseño por defecto es Oscuro (Nocturne).*

---

## 6. Iconos locales de navegación (contexto relacionado)

Los iconos de los 6 items de navegación (Dashboard, Hábitos, Finanzas, Proyectos, Ajustes, Soporte) y "Cerrar sesión" usan **`lucide-react`** (SVG empaquetados, sin depender de la fuente Material Symbols externa). Ver `src/components/comun/ui/NavIcon.tsx` (mapa `NavIconKey → LucideIcon`). El resto de iconos de la app siguen usando Material Symbols.

---

## 7. Invariantes a respetar

1. QuickCSS y el icono de la app son **capas separadas**; ninguno depende del otro.
2. El QuickCSS se persiste en la **BD** (`User.quickCss`) y se inyecta **server-side sin FOUC** (`QuickCssStyle`). La vista previa del editor usa un `<style>` propio (`quickcss-live-preview`); nunca manipular el `<style>`/`<link>` que controla React (causa el bug `removeChild`).
3. **Restablecer BORRA el registro en la BD** (`null`), no guarda cadena vacía ni basura.
4. Nombres de variables `--lt-*` y selectores de la plantilla son el "contrato" con la IA: si se renombran, romper temas guardados.
5. El colapso de la barra lateral es **solo Desktop** (`md:`); no debe afectar la navegación móvil.
6. La subida de imágenes (avatar e icono) **comprime en el navegador** antes de persistir; no subir imágenes crudas a la BD.
7. `FaviconSetter` gestiona **solo su propio nodo** (`app-favicon-custom`); el favicon por defecto es un `<link id="app-favicon">` estático en el layout. Nunca borrar nodos de React.
