import Link from "next/link";

export const dynamic = "force-dynamic";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background text-center p-4">
      <h1 className="text-headline-lg font-headline-lg text-primary">404</h1>
      <p className="text-body-md text-on-surface-variant">
        La página que buscas no existe.
      </p>
      <Link
        href="/"
        className="px-5 py-2.5 rounded-xl bg-primary text-on-primary font-medium hover:bg-primary-fixed-dim transition-colors"
      >
        Volver al inicio
      </Link>
    </div>
  );
}
