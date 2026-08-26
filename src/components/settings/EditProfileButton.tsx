"use client";

import { useState, useTransition, useRef } from "react";
import { updateProfile } from "@/app/actions/settings";
import { Modal } from "@/components/comun/Modal";
import { Icon } from "@/components/comun/Icon";

const inputClass =
  "w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-2.5 text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all";
const labelClass =
  "block text-label-caps font-label-caps text-on-surface-variant uppercase mb-2";

/** Tamaño del avatar tras redimensionar (px). */
const AVATAR_SIZE = 128;
/** Tope del archivo de ENTRADA (antes de comprimir). */
const MAX_INPUT_BYTES = 8 * 1024 * 1024; // 8 MB
/** Tope del resultado COMPRIMIDO que se guarda en BD. */
const MAX_OUTPUT_BYTES = 40 * 1024; // 40 KB

/**
 * Redimensiona la imagen a un cuadrado de AVATAR_SIZE y la comprime en el
 * navegador. Intenta AVIF (más ligero) → WebP → JPEG, según soporte del
 * navegador. Devuelve un Data URL pequeño (normalmente 5–15 KB).
 */
async function compressToDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);

  // Recorte cuadrado centrado (cover).
  const side = Math.min(bitmap.width, bitmap.height);
  const sx = (bitmap.width - side) / 2;
  const sy = (bitmap.height - side) / 2;

  const canvas = document.createElement("canvas");
  canvas.width = AVATAR_SIZE;
  canvas.height = AVATAR_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo procesar la imagen.");
  ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, AVATAR_SIZE, AVATAR_SIZE);
  bitmap.close?.();

  // Orden de formatos por ligereza; el navegador elige el primero soportado.
  const candidates: { type: string; quality: number }[] = [
    { type: "image/avif", quality: 0.6 },
    { type: "image/webp", quality: 0.7 },
    { type: "image/jpeg", quality: 0.8 },
  ];

  for (const { type, quality } of candidates) {
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, type, quality),
    );
    // Si el navegador no soporta el tipo, toBlob puede devolver otro tipo o null.
    if (blob && blob.type === type) {
      return await blobToDataUrl(blob);
    }
  }
  // Fallback: PNG (siempre soportado).
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

/** Botón "Editar Perfil": edita el nombre y permite subir un avatar (comprimido). */
export function EditProfileButton({
  name: initialName,
  image: initialImage,
}: {
  name: string;
  image: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(initialName);
  const [image, setImage] = useState(initialImage ?? "");
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    if (!file.type.startsWith("image/")) {
      setError("El archivo debe ser una imagen.");
      return;
    }
    if (file.size > MAX_INPUT_BYTES) {
      setError("La imagen es muy grande (máx. 8 MB).");
      return;
    }

    setProcessing(true);
    try {
      const dataUrl = await compressToDataUrl(file);
      if (dataUrl.length > MAX_OUTPUT_BYTES * 1.37) {
        // Muy raro tras comprimir; avisa por si acaso.
        setError("No se pudo optimizar la imagen lo suficiente. Prueba otra.");
        return;
      }
      setImage(dataUrl);
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
      const res = await updateProfile({ name, image });
      if (!res.ok) {
        setError(
          res.fieldErrors?.name?.[0] ?? res.fieldErrors?.image?.[0] ?? res.error,
        );
        return;
      }
      setOpen(false);
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full bg-surface-variant hover:bg-surface-container-high border border-outline-variant text-on-surface font-body-md py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        <Icon name="manage_accounts" className="text-[18px]" />
        Editar Perfil
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Editar Perfil">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Avatar: subida + compresión con vista previa */}
          <div>
            <label className={labelClass}>Foto de perfil</label>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-primary-container flex items-center justify-center text-on-primary-container border border-outline-variant shrink-0">
                {image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={image}
                    alt="Vista previa"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Icon name="person" className="text-[28px]" filled />
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
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={processing}
                  className="flex items-center gap-2 text-sm border border-outline-variant text-on-surface-variant px-3 py-2 rounded-lg hover:bg-surface-variant transition-colors disabled:opacity-60"
                >
                  <Icon name="upload" className="text-[18px]" />
                  {processing ? "Optimizando..." : "Subir imagen"}
                </button>
                {image && (
                  <button
                    type="button"
                    onClick={() => setImage("")}
                    className="text-xs text-error hover:underline text-left"
                  >
                    Quitar imagen
                  </button>
                )}
              </div>
            </div>
            <p className="text-[11px] text-on-surface-variant mt-2">
              Se optimiza automáticamente a {AVATAR_SIZE}×{AVATAR_SIZE}px.
              Formatos: AVIF (recomendado, más ligero), PNG, WebP o JPG.
            </p>
          </div>

          <div>
            <label className={labelClass}>Nombre</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre"
              className={inputClass}
            />
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
