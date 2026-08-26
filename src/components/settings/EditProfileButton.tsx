"use client";

import { useState, useTransition } from "react";
import { updateProfile } from "@/app/actions/settings";
import { Modal } from "@/components/comun/Modal";
import { Icon } from "@/components/comun/Icon";

const inputClass =
  "w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-2.5 text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all";
const labelClass =
  "block text-label-caps font-label-caps text-on-surface-variant uppercase mb-2";

/** Botón "Editar Perfil" con modal para actualizar nombre y avatar (URL). */
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
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await updateProfile({ name, image });
      if (!res.ok) {
        setError(
          res.fieldErrors?.name?.[0] ??
            res.fieldErrors?.image?.[0] ??
            res.error,
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
          <div>
            <label className={labelClass}>Nombre</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              placeholder="Tu nombre"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Avatar (URL, opcional)</label>
            <input
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="https://..."
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
              disabled={isPending}
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
