"use client";

import React, { useState, useEffect } from "react";
import { Provider } from "react-redux";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { store, useAppDispatch } from "@/store";
import { setAuthenticatedUser, clearAuthentication } from "@/store/slices/auth-slice";
import { authService } from "@/features/auth/services/auth-service";

function AuthInitializer({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();

  // Call /api/v1/auth/me once on startup to rehydrate user state via HTTP-only cookie
  useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      try {
        const user = await authService.getMe();
        dispatch(setAuthenticatedUser(user));
        return user;
      } catch {
        dispatch(clearAuthentication());
        return null;
      }
    },
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

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
