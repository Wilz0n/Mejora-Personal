import { PrismaAdapter } from "@auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

/**
 * Resuelve el secret de NextAuth de forma segura:
 * - Si NEXTAUTH_SECRET está definido, se usa (caso normal en modo con login).
 * - Si NO está definido:
 *   · En modo usuario único, NextAuth no se usa realmente, así que un valor
 *     placeholder es aceptable (nunca se firman/verifican sesiones reales).
 *   · En modo con login en PRODUCCIÓN, es un error de configuración crítico:
 *     lanzamos para NO firmar JWT con un secreto público conocido (que
 *     permitiría forjar sesiones y suplantar usuarios).
 */
function resolveSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET;
  if (secret && secret.trim().length > 0) return secret;

  const singleUser =
    process.env.SINGLE_USER_MODE === "true" ||
    process.env.NEXT_PUBLIC_SINGLE_USER_MODE === "true";

  if (singleUser) {
    // NextAuth no se usa en modo usuario único; placeholder inofensivo.
    return "single-user-mode-unused-secret";
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "NEXTAUTH_SECRET no está definido. Es obligatorio en producción con login. " +
        "Genera uno con: openssl rand -base64 32",
    );
  }

  // Solo en desarrollo local con login: placeholder para no bloquear el dev.
  return "lifetracker-dev-only-secret";
}

// NextAuth v4 internamente lee NEXTAUTH_URL para construir URLs de callback.
// Si la variable está definida pero vacía (o no existe), hace `new URL("")`
// que lanza TypeError: Invalid URL. Esto pasa en Vercel cuando tienes la
// variable configurada sin valor o en modo usuario único donde no la necesitas.
// Fijamos un placeholder válido si falta, para que NextAuth no crashee al
// inicializarse (aunque en single-user mode no se use realmente).
if (!process.env.NEXTAUTH_URL || process.env.NEXTAUTH_URL.trim() === "") {
  process.env.NEXTAUTH_URL = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as NextAuthOptions["adapter"],
  session: { strategy: "jwt" },
  secret: resolveSecret(),
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        });

        // Comparación en tiempo (casi) constante: si el usuario no existe o no
        // tiene hash, igual ejecutamos un bcrypt.compare contra un hash dummy
        // para no revelar por tiempo de respuesta si el email existe.
        const DUMMY_HASH =
          "$2a$10$CwTycUXWue0Thq9StjUM0uJ8.G8kZ0lU5f5PqR6Xw3aFhZ0oQ7q1a";
        const hash = user?.passwordHash ?? DUMMY_HASH;
        const valid = await bcrypt.compare(credentials.password, hash);

        if (!user || !user.passwordHash || !valid) return null;

        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
};

export function auth() {
  return getServerSession(authOptions);
}
