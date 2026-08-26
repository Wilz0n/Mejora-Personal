"use client";

import { SessionProvider } from "next-auth/react";
import { isSingleUserModeClient } from "@/lib/single-user-client";

export function Providers({ children }: { children: React.ReactNode }) {
  // En Modo Usuario Único no hay login: NO montamos SessionProvider para evitar
  // que el cliente haga fetch a /api/auth/session (que fallaría con NO_SECRET
  // e Invalid URL si no hay NEXTAUTH_SECRET/URL configurados).
  if (isSingleUserModeClient()) {
    return <>{children}</>;
  }
  return <SessionProvider>{children}</SessionProvider>;
}
