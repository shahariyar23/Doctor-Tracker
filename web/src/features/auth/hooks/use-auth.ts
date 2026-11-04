"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authService } from "../services/auth-service";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  setAuthenticatedUser,
  clearAuthentication,
  setAuthLoading,
} from "@/store/slices/auth-slice";
import type { LoginCredentials } from "../types";

export const AUTH_QUERY_KEY = ["auth", "me"];

export function useAuth() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, isLoading } = useAppSelector((state) => state.auth);

  /**
   * Session verification query on app load
   */
  const sessionQuery = useQuery({
    queryKey: AUTH_QUERY_KEY,
    queryFn: async () => {
      try {
        const currentUser = await authService.getMe();
        dispatch(setAuthenticatedUser(currentUser));
        return currentUser;
      } catch {
        dispatch(clearAuthentication());
        return null;
      }
    },
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  /**
   * Login Mutation
   */
  const loginMutation = useMutation({
    mutationFn: (credentials: LoginCredentials) => authService.login(credentials),
    onSuccess: (authenticatedUser) => {
      dispatch(setAuthenticatedUser(authenticatedUser));
      queryClient.setQueryData(AUTH_QUERY_KEY, authenticatedUser);
      router.push("/dashboard");
    },
  });

  /**
   * Logout Mutation
   */
  const logoutMutation = useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      dispatch(clearAuthentication());
      queryClient.clear();
      router.push("/login");
    },
    onError: () => {
      // Even if network fails, clear local client state
      dispatch(clearAuthentication());
      queryClient.clear();
      router.push("/login");
    },
  });

  return {
    user,
    isAuthenticated,
    isLoading: isLoading || sessionQuery.isLoading,
    login: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,
    logout: logoutMutation.mutateAsync,
    isLoggingOut: logoutMutation.isPending,
  };
}

