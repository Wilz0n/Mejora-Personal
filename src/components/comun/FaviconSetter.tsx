"use client";

import { useEffect } from "react";

/**
 * Ajusta dinámicamente el favicon (icono de la pestaña) al icono personalizado
 * del usuario (`appIcon`), SIN interferir con el DOM que controla React.
 *
 * ⚠️ Historia del bug: una versión previa hacía
 * `document.head.querySelectorAll('link[rel=icon]').forEach(l => l.remove())`.
 * Eso eliminaba el <link rel="icon"> que React/Next renderiza (desde el layout
 * o `metadata`). Al navegar, React intentaba hacer `removeChild` de ese nodo ya
 * borrado → "Cannot read properties of null (reading 'removeChild')" y "The
 * host has been moved out of the DOM". Rompía en CADA navegación en producción.
 *
 * Solución: NO tocar los nodos de React. Este componente gestiona un ÚNICO
 * <link> propio con id `app-favicon-custom` (creado por él, no por React):
 *  - Si hay `appIcon`, crea/actualiza ese link con el icono del usuario. Como el
 *    navegador usa el ÚLTIMO <link rel="icon">, éste prevalece sobre el favicon
 *    por defecto (`#app-favicon`, estático en el layout).
 *  - Si no hay `appIcon`, elimina SOLO su propio nodo (nunca el de React),
 *    dejando visible el favicon por defecto.
 */
const CUSTOM_FAVICON_ID = "app-favicon-custom";

export function FaviconSetter({ appIcon }: { appIcon: string | null }) {
  useEffect(() => {
    const existing = document.getElementById(
      CUSTOM_FAVICON_ID,
    ) as HTMLLinkElement | null;

    if (!appIcon) {
      // Sin icono personalizado: quita solo NUESTRO nodo (si existe) y deja el
      // favicon por defecto que renderiza React (#app-favicon).
      existing?.remove();
      return;
    }

    const link = existing ?? document.createElement("link");
    link.id = CUSTOM_FAVICON_ID;
    link.rel = "icon";
    const match = /^data:(image\/[a-z0-9.+-]+)/i.exec(appIcon);
    link.type = match ? match[1] : "image/png";
    link.href = appIcon;
    if (!existing) document.head.appendChild(link);
  }, [appIcon]);

  return null;
}
