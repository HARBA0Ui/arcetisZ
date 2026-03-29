"use client";

import { ProtectedAdmin } from "@/backoffice/components/common/protected-admin";
import { AdminShell } from "@/backoffice/components/layout/admin-shell";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedAdmin>
      <AdminShell>{children}</AdminShell>
    </ProtectedAdmin>
  );
}
