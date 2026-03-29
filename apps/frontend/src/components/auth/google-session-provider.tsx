"use client";

import { SessionProvider } from "next-auth/react";

export function GoogleSessionProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider basePath="/api/next-auth">{children}</SessionProvider>;
}
