"use client";

import { useEffect } from "react";

/** Ruta del favicon por defecto (hoja del logo). */
const DEFAULT_FAVICON = "/favicon.svg";

/**
 * Ajusta dinámicamente el favicon (icono de la pestaña del navegador).
 *
 * - Si el usuario tiene `appIcon`, lo usa como favicon.
 * - Si no, restaura el favicon por defecto del proyecto (la hoja).
 *
 * Reemplaza (o crea) el <link rel="icon"> en el <head>. Se ejecuta en cliente
 * porque el valor proviene de la base de datos del usuario autenticado.
 */
export function FaviconSetter({ appIcon }: { appIcon: string | null }) {
  useEffect(() => {
    const head = document.head;
    // Quita los <link rel="icon"> previos para evitar duplicados/inconsistencias.
    const prev = head.querySelectorAll<HTMLLinkElement>(
      'link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]',
    );
    prev.forEach((l) => l.remove());

    const link = document.createElement("link");
    link.rel = "icon";
    if (appIcon) {
      // Deriva el type del Data URL (image/avif, image/png, …) si está disponible.
      const match = /^data:(image\/[a-z0-9.+-]+)/i.exec(appIcon);
      if (match) link.type = match[1];
      link.href = appIcon;
    } else {
      link.type = "image/svg+xml";
      link.href = DEFAULT_FAVICON;
    }
    head.appendChild(link);
  }, [appIcon]);

  return null;
}
