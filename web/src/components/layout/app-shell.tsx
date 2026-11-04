"use client";

import React, { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { MobileBottomNav } from "./mobile-bottom-nav";
import { useAppSelector } from "@/store";
import { cn } from "@/lib/utils";

const emptySubscribe = () => () => {};

function useIsMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAppSelector((state) => state.auth);
  const collapsed = useAppSelector((state) => state.ui.sidebarCollapsed);
  const isMounted = useIsMounted();

  useEffect(() => {
    if (isMounted && !isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isMounted, isAuthenticated, isLoading, router]);

  if (!isMounted || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-xs font-medium text-muted-foreground">
            Verifying clinical authorization...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div
        className={cn(
          "flex flex-1 flex-col transition-all duration-300 ease-in-out",
          collapsed ? "lg:pl-18" : "lg:pl-64"
        )}
      >
        <Header />
        <main className="flex-1 p-3 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto pb-20 lg:pb-8">
          {children}
        </main>
        <MobileBottomNav />
      </div>
    </div>
  );
}
