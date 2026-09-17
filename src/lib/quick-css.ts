import { QUICK_CSS_PREVIEW_STYLE_ID } from "@/lib/constants/default-css";

/**
 * Helpers client-side para la **vista previa en vivo** del editor QuickCSS.
 *
 * La fuente de verdad del tema es la base de datos (`User.quickCss`), que se
 * inyecta en el servidor (`QuickCssStyle` → `<style id="custom-lifetracker-css">`).
 * Estos helpers solo manejan un <style id="quickcss-live-preview"> **propio del
 * editor** para previsualizar cambios sin guardar; NUNCA tocan el nodo que
 * controla React (evita el bug de reconciliación `removeChild`).
 */

/** Aplica una vista previa del CSS en vivo (crea/actualiza el <style> propio). */
export function applyQuickCssPreview(css: string): void {
  if (typeof document === "undefined") return;
  const existing = document.getElementById(
    QUICK_CSS_PREVIEW_STYLE_ID,
  ) as HTMLStyleElement | null;

  if (!css.trim()) {
    existing?.remove();
    return;
  }
  const el = existing ?? document.createElement("style");
  if (!existing) {
    el.id = QUICK_CSS_PREVIEW_STYLE_ID;
    document.head.appendChild(el);
  }
  el.textContent = css;
}

/** Elimina la vista previa en vivo (deja el tema persistido de la BD). */
export function clearQuickCssPreview(): void {
  if (typeof document === "undefined") return;
  document.getElementById(QUICK_CSS_PREVIEW_STYLE_ID)?.remove();
}
