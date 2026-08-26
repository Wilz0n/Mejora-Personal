"use client";

import { useEffect } from "react";
import { Icon } from "@/components/Icon";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
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

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
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
      <style>{`@keyframes modalIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
}
