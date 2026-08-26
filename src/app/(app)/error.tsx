"use client";

import { Icon } from "@/components/Icon";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center gap-4">
      <div className="w-14 h-14 rounded-2xl bg-error/10 flex items-center justify-center">
        <Icon name="error" className="text-error text-[32px]" />
      </div>
      <h2 className="text-headline-md font-headline-md text-on-surface">
        Algo salió mal
      </h2>
      <p className="text-body-md text-on-surface-variant max-w-sm">
        {error.message || "Ocurrió un error inesperado al cargar esta sección."}
      </p>
      <button
        onClick={reset}
        className="px-5 py-2.5 rounded-xl bg-primary text-on-primary font-medium hover:bg-primary-fixed-dim transition-colors"
      >
        Reintentar
      </button>
    </div>
  );
}
