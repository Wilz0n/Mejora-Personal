/**
 * Constantes del sistema QuickCSS (personalización de temas tipo Vencord).
 *
 * - `QUICK_CSS_STORAGE_KEY`: clave en `localStorage` donde se guarda el CSS
 *   personalizado del usuario.
 * - `QUICK_CSS_STYLE_ID`: id del <style> inyectado en <head> con el CSS custom.
 * - `DEFAULT_QUICK_CSS`: plantilla comentada precargada en el editor. Expone las
 *   variables clave del design system "Nocturne" para que el usuario (o una IA)
 *   pueda re-tematizar la app sin tocar el código fuente.
 *
 * Estas variables NO se usan en `globals.css` por defecto; la plantilla las
 * declara en `:root` para que, al aplicarse, sobreescriban los valores mediante
 * reglas CSS concretas (ver el bloque "APLICACIÓN" al final de la plantilla).
 */

/** Clave de `localStorage` para el CSS personalizado. */
export const QUICK_CSS_STORAGE_KEY = "lifetracker:quick-css";

/** Id del tag <style> inyectado en el <head>. */
export const QUICK_CSS_STYLE_ID = "custom-lifetracker-css";

/**
 * Plantilla inicial precargada en el editor QuickCSS.
 *
 * Está organizada por secciones globales (variables, tipografía, fondos, glass,
 * botones, navegación, estados, gráficos y efectos) y termina con hooks
 * opcionales por página (`[data-page="..."]`). Incluye recetas de tema
 * comentadas (Cyberpunk, Matrix, OLED) listas para activar.
 */
export const DEFAULT_QUICK_CSS = `/**
 * =========================================================
 * CUSTOMIZACIÓN DE LIFETRACKER (QUICK CSS)
 * =========================================================
 *
 * INSTRUCCIONES:
 * 1. Edita las VARIABLES de la sección 0 para un cambio rápido de tema
 *    (colores, FONDO, fuentes, glass, bordes). Afecta a TODA la app.
 * 2. FONDO: cambia --lt-background (color plano) y/o --lt-bg-image para
 *    gradientes o patrones CSS (sin imágenes). También --lt-nav-bg controla
 *    el fondo de la barra lateral / topbar. Ver ejemplos en la sección 0.
 * 3. Al final hay RECETAS de ejemplo: descoméntalas y ajústalas si te sirven
 *    de punto de partida (son opcionales).
 * 4. O COPIA TODO ESTE BLOQUE Y PÉGALO EN TU IA (ChatGPT/Claude/Gemini) con:
 *    "Aplica el estilo que te describo a continuación a este CSS: [DESCRIBE
 *     AQUÍ EL TEMA QUE QUIERAS, con tus propias palabras]. Modifica los valores
 *     pero MANTÉN el nombre de las variables y los selectores. Puedes cambiar el
 *     FONDO con --lt-bg-image (gradientes CSS), y añadir animaciones, glows y
 *     fuentes de Google Fonts."
 * 5. Pega el resultado aquí y pulsa "Guardar y Aplicar".
 *
 * TIP: puedes importar fuentes al inicio, p. ej.:
 *   @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&display=swap');
 *   y luego usar  --font-body: 'Orbitron', sans-serif;
 */

/* =========================================================
 * 0. VARIABLES BASE  (el 90% de tu tema vive aquí)
 * ========================================================= */
:root {
  /* -- Paleta principal -- */
  --lt-background: #131315;      /* Fondo general de la app */
  --lt-surface: #1c1b1d;         /* Fondo de tarjetas/paneles opacos */
  --lt-primary: #c0c1ff;         /* Acento principal (botones, activos, gráficos) */
  --lt-on-primary: #1000a9;      /* Texto sobre el color de acento */
  --lt-text-main: #e5e1e4;       /* Texto principal */
  --lt-text-muted: #c7c4d7;      /* Texto secundario / subtítulos */

  /* -- Fondo avanzado (100% por código, SIN imágenes) --
   * --lt-bg-image acepta cualquier valor CSS de 'background-image':
   * gradientes, patrones con gradientes repetidos, capas múltiples, etc.
   * Déjalo en 'none' para un fondo de color plano (--lt-background).
   * Ejemplos (descomenta uno o pégalo en las RECETAS):
   *   linear-gradient(135deg, #0d0525 0%, #05010d 100%)
   *   radial-gradient(circle at 20% 10%, #1a0b3d 0%, #05010d 60%)
   *   repeating-linear-gradient(0deg, transparent 0 3px, rgba(0,255,65,0.04) 3px 4px)  (scanlines)
   */
  --lt-bg-image: none;           /* Imagen/gradiente CSS del fondo general */
  --lt-bg-size: auto;            /* Tamaño del fondo (ej: cover, 40px 40px) */
  --lt-bg-attachment: fixed;     /* fixed = no scrollea con el contenido */
  --lt-nav-bg: var(--lt-surface); /* Fondo de la barra lateral / topbar / bottom-nav */

  /* -- Estados -- */
  --lt-success: #83ffb7;         /* Hábito completado / pago pagado */
  --lt-danger:  #ffb4ab;         /* Balance negativo / alertas */
  --lt-tertiary:#ffb783;         /* Acento secundario (metas, destacados) */

  /* -- Paneles / efecto glass -- */
  --lt-glass-bg: rgba(28, 27, 29, 0.5);        /* Fondo tarjetas .glass-panel */
  --lt-glass-border: #464554;                  /* Borde de tarjetas */
  --lt-glass-blur: 12px;                        /* Intensidad del desenfoque */
  --lt-radius: 0.75rem;                         /* Redondeo de esquinas */

  /* -- Tipografía -- */
  --lt-font-body: var(--font-inter), system-ui, sans-serif;  /* Cuerpo de texto */
  --lt-font-mono: var(--font-jetbrains-mono), monospace;     /* Números/etiquetas */
  --lt-letter-spacing: normal;   /* Espaciado entre letras (ej: 0.02em) */

  /* -- Efectos -- */
  --lt-glow: none;               /* Sombra/resplandor de acento (ver RECETAS) */
}

/* =========================================================
 * 1. FONDO Y LAYOUT GENERAL
 * ========================================================= */
html,
body {
  background-color: var(--lt-background) !important;
  background-image: var(--lt-bg-image) !important;
  background-size: var(--lt-bg-size) !important;
  background-attachment: var(--lt-bg-attachment) !important;
  color: var(--lt-text-main) !important;
  font-family: var(--lt-font-body) !important;
  letter-spacing: var(--lt-letter-spacing);
}
/* Contenedores de fondo (área principal). Se ponen transparentes para dejar
 * ver el fondo del body; así --lt-bg-image cubre TODA la pantalla. */
.bg-background,
.bg-surface,
.bg-surface-dim { background-color: transparent !important; }

/* Barra lateral, topbar y bottom-nav móvil: usan --lt-nav-bg (por defecto igual
 * que las tarjetas). Ponlo en 'transparent' si quieres que el fondo se vea a
 * través de la navegación. */
nav.fixed,
header.sticky,
nav.md\\:hidden.fixed {
  background-color: var(--lt-nav-bg) !important;
}

/* =========================================================
 * 2. TIPOGRAFÍA Y TEXTO
 * ========================================================= */
.text-on-surface,
.text-on-background { color: var(--lt-text-main) !important; }
.text-on-surface-variant { color: var(--lt-text-muted) !important; }
/* Fuente monoespaciada (KPIs, etiquetas en mayúsculas, números) */
.font-label-caps { font-family: var(--lt-font-mono) !important; }

/* =========================================================
 * 3. PANELES / TARJETAS (glassmorphism)
 * ========================================================= */
.glass-panel {
  background-color: var(--lt-glass-bg) !important;
  border-color: var(--lt-glass-border) !important;
  border-radius: var(--lt-radius) !important;
  backdrop-filter: blur(var(--lt-glass-blur)) !important;
  box-shadow: var(--lt-glow);
}
.bg-surface-container,
.bg-surface-container-low,
.bg-surface-container-lowest,
.bg-surface-container-high,
.bg-surface-variant { background-color: var(--lt-surface) !important; }
.border-surface-variant,
.border-outline-variant { border-color: var(--lt-glass-border) !important; }

/* =========================================================
 * 4. BOTONES Y ACENTOS
 * ========================================================= */
.bg-primary { background-color: var(--lt-primary) !important; }
.text-primary { color: var(--lt-primary) !important; }
.border-primary { border-color: var(--lt-primary) !important; }
.text-on-primary { color: var(--lt-on-primary) !important; }
.bg-primary-container { background-color: var(--lt-primary) !important; }
/* Acento secundario / metas */
.text-tertiary { color: var(--lt-tertiary) !important; }
.bg-tertiary { background-color: var(--lt-tertiary) !important; }

/* =========================================================
 * 5. NAVEGACIÓN (Sidebar / Topbar / bottom-nav móvil)
 *    Los items activos usan el color de acento; los inactivos, texto apagado.
 * ========================================================= */
/* Ejemplo: resaltar el item activo del menú
[aria-current="page"] {
  color: var(--lt-primary) !important;
  background-color: color-mix(in srgb, var(--lt-primary) 15%, transparent) !important;
}
*/

/* =========================================================
 * 6. ESTADOS (éxito / peligro) Y GRÁFICOS
 * ========================================================= */
.text-error { color: var(--lt-danger) !important; }
.text-success { color: var(--lt-success) !important; }
.chart-bar-income  { background-color: var(--lt-primary) !important; }
.chart-bar-fixed   { background-color: var(--lt-glass-border) !important; }
.chart-bar-savings { background-color: var(--lt-tertiary) !important; }

/* =========================================================
 * 7. AJUSTES POR PÁGINA (opcional / avanzado)
 *    Cada página expone data-page. Descomenta para afinar SOLO esa página
 *    sin tocar el resto. Rutas de finanzas (/finanzas, /mes, /historial)
 *    comparten data-page="finanzas".
 * ========================================================= */
/* --- HOME / DASHBOARD --- */
/* [data-page="dashboard"] .glass-panel { border-color: var(--lt-primary) !important; } */

/* --- HÁBITOS --- */
/* [data-page="habitos"] .glass-panel { } */

/* --- FINANZAS (incluye /finanzas/mes y /finanzas/historial) --- */
/* [data-page="finanzas"] .glass-panel { } */

/* =========================================================
 * 8. RECETAS DE TEMA (descomenta UNA y ajústala)
 * ========================================================= */

/* ---------- CYBERPUNK NEÓN ----------
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&display=swap');
:root {
  --lt-background: #05010d;
  --lt-bg-image: radial-gradient(circle at 15% 10%, #1a0b3d 0%, #05010d 55%), linear-gradient(160deg, #0d0525 0%, #05010d 100%);
  --lt-nav-bg: rgba(13, 5, 37, 0.85);
  --lt-surface: #0d0525;
  --lt-primary: #00f0ff;
  --lt-on-primary: #05010d;
  --lt-text-main: #f5e6ff;
  --lt-text-muted: #b48bff;
  --lt-success: #39ff14;
  --lt-danger: #ff2965;
  --lt-tertiary: #ff00e5;
  --lt-glass-bg: rgba(20, 5, 45, 0.6);
  --lt-glass-border: #00f0ff;
  --lt-glass-blur: 8px;
  --lt-radius: 0.25rem;
  --lt-font-body: 'Orbitron', sans-serif;
  --lt-letter-spacing: 0.03em;
  --lt-glow: 0 0 12px rgba(0, 240, 255, 0.45), inset 0 0 8px rgba(255, 0, 229, 0.15);
}
.bg-primary { box-shadow: 0 0 16px var(--lt-primary); }
.text-primary { text-shadow: 0 0 8px var(--lt-primary); }
*/

/* ---------- MATRIX (terminal verde) ----------
@import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');
:root {
  --lt-background: #000000;
  --lt-bg-image: repeating-linear-gradient(0deg, transparent 0 3px, rgba(0,255,65,0.045) 3px 4px), radial-gradient(circle at 50% 0%, #041504 0%, #000000 60%);
  --lt-bg-size: 100% 4px, auto;
  --lt-nav-bg: rgba(3, 11, 3, 0.9);
  --lt-surface: #030b03;
  --lt-primary: #00ff41;
  --lt-on-primary: #000000;
  --lt-text-main: #00ff41;
  --lt-text-muted: #00a828;
  --lt-success: #00ff41;
  --lt-danger: #ff5555;
  --lt-tertiary: #7dff9b;
  --lt-glass-bg: rgba(0, 20, 0, 0.55);
  --lt-glass-border: #00ff41;
  --lt-glass-blur: 4px;
  --lt-radius: 0;
  --lt-font-body: 'Share Tech Mono', monospace;
  --lt-glow: 0 0 10px rgba(0, 255, 65, 0.35);
}
.text-on-surface, .text-on-surface-variant { text-shadow: 0 0 6px rgba(0,255,65,0.4); }
*/

/* ---------- OLED BLACK (mínimo, ahorro de batería) ----------
:root {
  --lt-background: #000000;
  --lt-surface: #0a0a0a;
  --lt-primary: #ffffff;
  --lt-on-primary: #000000;
  --lt-text-main: #f2f2f2;
  --lt-text-muted: #8a8a8a;
  --lt-glass-bg: rgba(10, 10, 10, 0.8);
  --lt-glass-border: #222222;
  --lt-glass-blur: 0px;
  --lt-radius: 0.5rem;
  --lt-glow: none;
}
*/
`;



