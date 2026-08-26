"use client";

import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { registerUser } from "@/app/actions/auth";

export function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await registerUser({ name, email, password });
      if (!res.ok) {
        setError(
          res.fieldErrors?.email?.[0] ??
            res.fieldErrors?.password?.[0] ??
            res.fieldErrors?.name?.[0] ??
            res.error,
        );
        return;
      }
      // Auto-login tras registro
      const login = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (login?.error) {
        router.push("/login");
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
        <label className={labelClass}>Nombre</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
          placeholder="Tu nombre"
          required
        />
      </div>
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
          placeholder="Mínimo 6 caracteres"
          required
        />
      </div>
      {error && <p className="text-error text-body-sm">{error}</p>}
      <button
        type="submit"
        disabled={isPending}
        className="w-full py-2.5 rounded-xl bg-primary text-on-primary font-medium hover:bg-primary-fixed-dim transition-colors disabled:opacity-60"
      >
        {isPending ? "Creando cuenta..." : "Crear cuenta"}
      </button>
      <p className="text-body-sm text-on-surface-variant text-center">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="text-primary hover:underline">
          Inicia sesión
        </Link>
      </p>
    </form>
  );
}
