"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { setAppIcon } from "@/app/actions/settings";
import { Modal } from "@/components/comun/ui/Modal";
import { Icon } from "@/components/comun/ui/Icon";

/** Tamaño del icono tras redimensionar (px). Cuadrado, ideal para favicon/logo. */
const ICON_SIZE = 64;
/** Tope del archivo de ENTRADA (antes de comprimir). */
const MAX_INPUT_BYTES = 8 * 1024 * 1024; // 8 MB
/** Tope del resultado COMPRIMIDO (base64) que se guarda en BD. */
const MAX_OUTPUT_CHARS = 120_000;

/**
 * Redimensiona la imagen a un cuadrado de ICON_SIZE y la comprime en el
 * navegador (AVIF → WebP → PNG). Conserva transparencia (por eso PNG como
 * fallback en vez de JPEG). Devuelve un Data URL pequeño.
 */
async function compressIconToDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const sx = (bitmap.width - side) / 2;
  const sy = (bitmap.height - side) / 2;

  const canvas = document.createElement("canvas");
  canvas.width = ICON_SIZE;
  canvas.height = ICON_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo procesar la imagen.");
  ctx.clearRect(0, 0, ICON_SIZE, ICON_SIZE);
  ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, ICON_SIZE, ICON_SIZE);
  bitmap.close?.();

  // Formatos que preservan transparencia (evitamos JPEG a propósito).
  const candidates: { type: string; quality: number }[] = [
    { type: "image/avif", quality: 0.7 },
    { type: "image/webp", quality: 0.85 },
  ];
  for (const { type, quality } of candidates) {
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, type, quality),
    );
    if (blob && blob.type === type) return await blobToDataUrl(blob);
  }
  const png = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/png"),
  );
  if (!png) throw new Error("No se pudo comprimir la imagen.");
  return await blobToDataUrl(png);
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("No se pudo leer la imagen."));
    reader.readAsDataURL(blob);
  });
}

/**
 * Botón "Icono de la App": sube un .png/.avif (o .webp/.jpg) que se usa como
 * favicon (pestaña del navegador) y como logo de la barra lateral. Persistente
 * por usuario en la base de datos.
 */
export function AppIconButton({ appIcon: initial }: { appIcon: string | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [icon, setIcon] = useState(initial ?? "");
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError("El archivo debe ser una imagen (.png, .avif, .webp o .jpg).");
      return;
    }
    if (file.size > MAX_INPUT_BYTES) {
      setError("La imagen es muy grande (máx. 8 MB).");
      return;
    }
    setProcessing(true);
    try {
      const dataUrl = await compressIconToDataUrl(file);
      if (dataUrl.length > MAX_OUTPUT_CHARS) {
        setError("No se pudo optimizar el icono lo suficiente. Prueba otro.");
        return;
      }
      setIcon(dataUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al procesar la imagen.");
    } finally {
      setProcessing(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await setAppIcon({ appIcon: icon });
      if (!res.ok) {
        setError(res.fieldErrors?.appIcon?.[0] ?? res.error);
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full bg-surface-variant hover:bg-surface-container-high border border-outline-variant text-on-surface font-body-md py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        <Icon name="image" className="text-[18px]" />
        Icono de la App
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Icono de la App">
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-body-sm text-on-surface-variant">
            Este icono aparece en la{" "}
            <span className="text-on-surface font-medium">pestaña del navegador</span>{" "}
            (favicon) y como{" "}
            <span className="text-on-surface font-medium">logo de la barra lateral</span>.
          </p>

          <div>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-primary/15 border border-outline-variant flex items-center justify-center shrink-0">
                {icon ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={icon}
                    alt="Vista previa del icono"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <Icon name="eco" className="text-primary text-[28px]" filled />
                )}
              </div>
              <div className="flex flex-col gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/avif,image/png,image/webp,image/jpeg"
                  onChange={handleFile}
                  className="hidden"
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={processing}
                    className="flex items-center gap-2 text-sm border border-outline-variant text-on-surface-variant px-3 py-2 rounded-lg hover:bg-surface-variant transition-colors disabled:opacity-60"
                  >
                    <Icon name="upload" className="text-[18px]" />
                    {processing ? "Optimizando..." : "Subir icono"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIcon("")}
                    disabled={processing || icon === ""}
                    className="flex items-center gap-2 text-sm border border-outline-variant text-on-surface-variant px-3 py-2 rounded-lg hover:bg-surface-variant transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Icon name="restart_alt" className="text-[18px]" />
                    Restablecer
                  </button>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-on-surface-variant mt-2">
              Se optimiza automáticamente a {ICON_SIZE}×{ICON_SIZE}px. Formatos:
              PNG o AVIF (recomendados, conservan transparencia), WebP o JPG.
            </p>
          </div>

          {error && <p className="text-error text-body-sm">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex-1 py-2.5 rounded-xl border border-outline-variant text-on-surface-variant hover:bg-surface-variant transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending || processing}
              className="flex-1 py-2.5 rounded-xl bg-primary text-on-primary font-medium hover:bg-primary-fixed-dim transition-colors disabled:opacity-60"
            >
              {isPending ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
