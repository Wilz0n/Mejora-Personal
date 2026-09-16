import {
  QUICK_CSS_STORAGE_KEY,
  QUICK_CSS_STYLE_ID,
} from "@/lib/constants/default-css";

/**
 * Helpers client-side para el sistema QuickCSS.
 *
 * Centralizan la lectura/escritura en `localStorage` y la manipulación del
 * <style id="custom-lifetracker-css"> del <head>, de forma que el editor y
 * cualquier otro consumidor apliquen los cambios de manera consistente y en
 * tiempo real (sin recargar la página).
 */

/** Devuelve el CSS guardado por el usuario, o `null` si no hay ninguno. */
export function readQuickCSS(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(QUICK_CSS_STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * Inyecta (o actualiza) el <style> con el CSS dado en el <head>.
 * Si `css` está vacío, elimina el <style>.
 */
export function applyQuickCSSToDom(css: string): void {
  if (typeof document === "undefined") return;
  const existing = document.getElementById(QUICK_CSS_STYLE_ID);
  if (!css.trim()) {
    existing?.remove();
    return;
  }
  let el = existing as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement("style");
    el.id = QUICK_CSS_STYLE_ID;
    document.head.appendChild(el);
  }
  el.textContent = css;
}

/** Guarda el CSS en `localStorage` y lo aplica al DOM inmediatamente. */
export function saveAndApplyQuickCSS(css: string): void {
  try {
    window.localStorage.setItem(QUICK_CSS_STORAGE_KEY, css);
  } catch {
    /* ignore quota / privacy-mode errors */
  }
  applyQuickCSSToDom(css);
}

/** Borra el CSS personalizado (vuelve al diseño por defecto "Nocturne"). */
export function resetQuickCSS(): void {
  try {
    window.localStorage.removeItem(QUICK_CSS_STORAGE_KEY);
  } catch {
    /* ignore */
  }
  document.getElementById(QUICK_CSS_STYLE_ID)?.remove();
}
