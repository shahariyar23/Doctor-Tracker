"use client";

import React, { useState, useEffect } from "react";
import { Provider } from "react-redux";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { store, useAppDispatch } from "@/store";
import { initializeAuth } from "@/store/slices/auth-slice";

function AuthInitializer({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(initializeAuth());
  }, [dispatch]);

  return <>{children}</>;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 2, // 2 minutes
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <AuthInitializer>{children}</AuthInitializer>
      </QueryClientProvider>
    </Provider>
  );
}

