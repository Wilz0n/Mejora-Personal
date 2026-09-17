import { QUICK_CSS_STYLE_ID } from "@/lib/constants/default-css";

/**
 * Inyecta el tema personalizado (QuickCSS) del usuario **desde la base de datos**.
 *
 * Es un Server Component: recibe `quickCss` (ya leído de la BD en el layout) y
 * renderiza un <style id="custom-lifetracker-css"> directamente en el HTML del
 * servidor. Ventajas frente al enfoque anterior (localStorage):
 *  - El tema se aplica igual en TODOS los dispositivos del usuario (móvil,
 *    desktop, etc.), porque vive en su cuenta, no en el navegador.
 *  - Sin FOUC: el <style> ya viene en el HTML inicial, antes de hidratar.
 *  - Sin manipular el DOM en cliente → no interfiere con la reconciliación de
 *    React (no repite el bug de `removeChild`).
 *
 * Si `quickCss` es null/vacío, no renderiza nada (tema por defecto "Nocturne").
 */
export function QuickCssStyle({ quickCss }: { quickCss: string | null }) {
  if (!quickCss || !quickCss.trim()) return null;
  return (
    <style id={QUICK_CSS_STYLE_ID} dangerouslySetInnerHTML={{ __html: quickCss }} />
  );
}
