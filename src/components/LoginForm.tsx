"use client";

import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (res?.error) {
        setError("Email o contraseña incorrectos.");
        return;
      }
      router.push("/");
      router.refresh();
    });
  }

  const inputClass =
    "w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-2.5 text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all";
  const labelClass =
    "block text-label-caps font-label-caps text-on-surface-variant uppercase mb-2";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className={labelClass}>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
          placeholder="tu@email.com"
          required
        />
      </div>
      <div>
        <label className={labelClass}>Contraseña</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
          placeholder="••••••••"
          required
        />
      </div>
      {error && <p className="text-error text-body-sm">{error}</p>}
      <button
        type="submit"
        disabled={isPending}
        className="w-full py-2.5 rounded-xl bg-primary text-on-primary font-medium hover:bg-primary-fixed-dim transition-colors disabled:opacity-60"
      >
        {isPending ? "Ingresando..." : "Iniciar sesión"}
      </button>
      <p className="text-body-sm text-on-surface-variant text-center">
        ¿No tienes cuenta?{" "}
        <Link href="/register" className="text-primary hover:underline">
          Regístrate
        </Link>
      </p>
    </form>
  );
}
