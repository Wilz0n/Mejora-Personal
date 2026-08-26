"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/components/comun/Icon";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  const [mounted, setMounted] = useState(false);

  // Necesario para usar portales solo en cliente (evita mismatch de SSR).
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  // Se renderiza en document.body vía portal para NO quedar atrapado por
  // ancestros con backdrop-filter/transform (p. ej. las tarjetas .glass-panel),
  // que romperían el posicionamiento fixed. Así el modal se centra respecto
  // al viewport completo.
  return createPortal(
    <div
      className="fixed inset-0 z-[100] overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Contenedor centrado; permite scroll si el modal es más alto que la ventana */}
      <div className="relative flex min-h-full items-center justify-center p-4">
        <div
          className="relative w-full max-w-md rounded-2xl bg-surface-container border border-outline-variant p-6 shadow-[0px_20px_50px_rgba(0,0,0,0.5)]"
          style={{ animation: "modalIn 0.15s ease-out" }}
        >
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-headline-md font-headline-md text-on-surface">
              {title}
            </h3>
            <button
              onClick={onClose}
              className="text-on-surface-variant hover:text-primary transition-colors"
              aria-label="Cerrar"
            >
              <Icon name="close" />
            </button>
          </div>
          {children}
        </div>
      </div>
      <style>{`@keyframes modalIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>,
    document.body,
  );
}
