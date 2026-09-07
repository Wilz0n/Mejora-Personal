"use client";

import { useState } from "react";
import Link from "next/link";
import { Modal } from "@/components/comun/ui/Modal";
import { Icon } from "@/components/comun/ui/Icon";

/**
 * Popup informativo que se muestra en la página de Hábitos cuando el usuario
 * alcanza el 7º mes de uso (ver `isArchiveDue` / `ARCHIVE_THRESHOLD_MONTHS`).
 *
 * Explica el flujo de archivado: exportar el progreso desde Ajustes y luego
 * reiniciar el ciclo (sin usar "Purgar Datos") para seguir usando la app con la
 * base de datos ligera. También menciona que los datos exportados pueden
 * reimportarse después en la página de análisis para revisar las mejoras.
 *
 * Se auto-abre al montar cuando `tenureMonths >= 7`. El usuario puede cerrarlo
 * (es informativo); el aviso persistente y el botón de reinicio viven en Ajustes.
 */
export function ArchiveNoticeModal({ tenureMonths }: { tenureMonths: number }) {
  const [open, setOpen] = useState(true);

  return (
    <Modal
      open={open}
      onClose={() => setOpen(false)}
      title="Ya llevas 7 meses de uso 🎉"
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/10 border border-primary/30">
          <Icon name="archive" className="text-primary mt-0.5" />
          <p className="text-body-sm text-on-surface-variant">
            Llevas{" "}
            <span className="text-on-surface font-medium">
              {tenureMonths} meses
            </span>{" "}
            registrando tu progreso. Para mantener la app rápida y ligera, la
            base de datos conserva alrededor de{" "}
            <span className="text-on-surface font-medium">6 meses</span> de
            datos. Es un buen momento para archivar tu progreso y empezar un
            nuevo ciclo.
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-body-sm font-medium text-on-surface">
            Sigue estos pasos:
          </p>
          <ol className="space-y-2 text-body-sm text-on-surface-variant">
            <li className="flex gap-2">
              <span className="text-primary font-bold">1.</span>
              <span>
                Ve a{" "}
                <span className="text-on-surface font-medium">Ajustes</span> y
                usa <span className="text-on-surface font-medium">Exportar</span>{" "}
                (JSON o CSV) para descargar tu progreso.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary font-bold">2.</span>
              <span>
                Una vez guardado el archivo, pulsa{" "}
                <span className="text-on-surface font-medium">
                  Reiniciar ciclo
                </span>{" "}
                en Ajustes. Se liberarán de nuevo todas las opciones (sin usar
                &quot;Purgar Datos&quot;).
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary font-bold">3.</span>
              <span>
                Cuando quieras, puedes{" "}
                <span className="text-on-surface font-medium">
                  volver a importar
                </span>{" "}
                ese archivo en la página de análisis para revisar tus mejoras de
                estos meses.
              </span>
            </li>
          </ol>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex-1 py-2.5 rounded-xl border border-outline-variant text-on-surface-variant hover:bg-surface-variant transition-colors"
          >
            Entendido
          </button>
          <Link
            href="/settings"
            className="flex-1 py-2.5 rounded-xl bg-primary text-on-primary font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <Icon name="settings" className="text-[18px]" />
            Ir a Ajustes
          </Link>
        </div>
      </div>
    </Modal>
  );
}
