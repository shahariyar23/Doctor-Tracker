import React, { Suspense } from "react";
import { requireAuth } from "@/lib/server/auth";
import { AppShell } from "@/components/layout/app-shell";
import type { User } from "@/types/auth";

async function AuthGuard({ children }: { children: (admin: User) => React.ReactNode }) {
  const admin = await requireAuth();
  return <>{children(admin)}</>;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-xs font-medium text-muted-foreground">
              Verifying clinical authorization...
            </p>
          </div>
        </div>
      }
    >
      <AuthGuard>
        {(admin) => <AppShell initialUser={admin}>{children}</AppShell>}
      </AuthGuard>
    </Suspense>
  );
}
