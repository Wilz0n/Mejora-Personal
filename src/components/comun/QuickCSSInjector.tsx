import Script from "next/script";
import { QUICK_CSS_STORAGE_KEY, QUICK_CSS_STYLE_ID } from "@/lib/constants/default-css";

/**
 * Inyección del CSS personalizado (QuickCSS) SIN destellos (FOUC).
 *
 * Usa `next/script` con `strategy="beforeInteractive"`: Next lo coloca en el
 * documento inicial y lo ejecuta antes de la hidratación, por lo que el
 * <style> con el tema del usuario ya está presente en el primer frame.
 *
 * IMPORTANTE: NO usar un `<script>` crudo con `dangerouslySetInnerHTML` dentro
 * del árbol de React del App Router. Aunque funciona en el render inicial,
 * durante la navegación del lado del cliente React intenta reconciliar ese nodo
 * y lanza una "client-side exception". `next/script` evita ese problema porque
 * Next gestiona el ciclo de vida del script fuera de la reconciliación normal.
 *
 * El contenido es 100% estático (constantes del proyecto); no interpola datos
 * del usuario, por lo que no introduce superficie de inyección.
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

  return (
    <Script id="lifetracker-quickcss" strategy="beforeInteractive">
      {script}
    </Script>
  );
}
