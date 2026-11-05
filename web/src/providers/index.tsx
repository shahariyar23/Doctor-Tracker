"use client";

import React, { useState, useEffect } from "react";
import { Provider } from "react-redux";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { store, useAppDispatch } from "@/store";
import { setAuthenticatedUser, clearAuthentication } from "@/store/slices/auth-slice";
import { authService } from "@/features/auth/services/auth-service";

function AuthInitializer({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();

  // Call /api/v1/auth/me only on the client side after mounting to rehydrate user state via HTTP-only cookie
  useEffect(() => {
    let isMounted = true;
    authService
      .getMe()
      .then((user) => {
        if (isMounted) dispatch(setAuthenticatedUser(user));
      })
      .catch(() => {
        if (isMounted) dispatch(clearAuthentication());
      });
    return () => {
      isMounted = false;
    };
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
