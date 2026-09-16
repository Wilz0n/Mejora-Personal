import { QUICK_CSS_STORAGE_KEY, QUICK_CSS_STYLE_ID } from "@/lib/constants/default-css";

/**
 * Inyección del CSS personalizado (QuickCSS) SIN destellos (FOUC).
 *
 * Se renderiza dentro del <head> del layout root. Es un Server Component que
 * emite un <script> **inline y bloqueante** (sin defer/async): el navegador lo
 * ejecuta antes de pintar el <body>, por lo que el <style> con el tema del
 * usuario ya está presente en el primer frame. Así el tema persiste entre
 * páginas sin que se vea primero el diseño por defecto.
 *
 * El script lee `localStorage`, y si hay CSS guardado, crea/actualiza un
 * <style id="custom-lifetracker-css"> en el <head>.
 *
 * Nota sobre `dangerouslySetInnerHTML`: es la única forma soportada por React
 * para incrustar un script inline que debe correr en el arranque. El contenido
 * es 100% estático (constantes del proyecto), no interpola datos del usuario,
 * por lo que no introduce una superficie de inyección.
 */
export function QuickCSSInjector() {
  const script = `
(function () {
  try {
    var css = window.localStorage.getItem(${JSON.stringify(QUICK_CSS_STORAGE_KEY)});
    if (!css) return;
    var id = ${JSON.stringify(QUICK_CSS_STYLE_ID)};
    var el = document.getElementById(id);
    if (!el) {
      el = document.createElement("style");
      el.id = id;
      document.head.appendChild(el);
    }
    el.textContent = css;
  } catch (e) {}
})();
`.trim();

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
