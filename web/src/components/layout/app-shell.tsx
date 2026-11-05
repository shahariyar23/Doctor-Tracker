"use client";

import React, { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { MobileBottomNav } from "./mobile-bottom-nav";
import { useAppDispatch, useAppSelector } from "@/store";
import { setAuthenticatedUser } from "@/store/slices/auth-slice";
import { setSidebarCollapsed } from "@/store/slices/ui-slice";
import { cn } from "@/lib/utils";
import type { User } from "@/types/auth";

const emptySubscribe = () => () => {};

function useIsMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

interface AppShellProps {
  children: React.ReactNode;
  initialUser?: User;
}

export function AppShell({ children, initialUser }: AppShellProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const reduxUser = useAppSelector((state) => state.auth.user);
  const { isAuthenticated, isLoading } = useAppSelector((state) => state.auth);
  const collapsed = useAppSelector((state) => state.ui.sidebarCollapsed);
  const isMounted = useIsMounted();

  // Deterministic user resolution for initial SSR and client hydration
  const user = initialUser ?? reduxUser;

  // If initialUser was passed from the Server Component layout, sync into Redux
  useEffect(() => {
    if (initialUser && !reduxUser) {
      dispatch(setAuthenticatedUser(initialUser));
    }
  }, [initialUser, reduxUser, dispatch]);

  // Restore persisted sidebar preference after hydration to avoid SSR/client markup divergence
  useEffect(() => {
    try {
      const saved = localStorage.getItem("doctor_tracker_sidebar_collapsed");
      if (saved !== null) {
        dispatch(setSidebarCollapsed(saved === "true"));
      }
    } catch {
      // Ignore localStorage access failures
    }
  }, [dispatch]);

  // Fallback client-side redirect if an explicit logout occurred in browser
  useEffect(() => {
    if (isMounted && !isLoading && !isAuthenticated && !user) {
      router.push("/login");
    }
  }, [isMounted, isAuthenticated, isLoading, user, router]);

  // If server-authenticated, render immediately without flashing a loader!
  return (
    <div className="flex min-h-screen w-full min-w-0 bg-background overflow-x-hidden">
      <Sidebar user={user} />
      <div
        className={cn(
          "flex flex-1 flex-col min-w-0 w-full transition-all duration-300 ease-in-out",
          collapsed ? "lg:pl-18" : "lg:pl-64"
        )}
      >
        <Header user={user} />
        <main className="flex-1 min-w-0 p-3 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto pb-20 lg:pb-8">
          {children}
        </main>
        <MobileBottomNav />
      </div>
    </div>
  );
}
