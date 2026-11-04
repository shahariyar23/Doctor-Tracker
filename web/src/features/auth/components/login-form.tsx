"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Cross,
  Eye,
  EyeOff,
  Lock,
  Mail,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Activity,
  Users,
} from "lucide-react";
import { loginSchema, LoginFormData } from "../schemas/login-schema";
import { authService } from "../services/auth-service";
import { useAppDispatch } from "@/store";
import { setCredentials } from "@/store/slices/auth-slice";

export function LoginForm() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setApiError(null);
    setIsSubmitting(true);

    try {
      const response = await authService.login(data);
      dispatch(setCredentials({ user: response.user, token: response.token }));
      router.push("/dashboard");
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Authentication failed. Please verify your credentials and ensure the backend server is running.";
      setApiError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col lg:flex-row items-stretch justify-center bg-slate-50">
      {/* Left Branding Showcase (Clinical Precision Theme) */}
      <section className="relative hidden w-full lg:flex lg:w-[52%] flex-col justify-between p-12 lg:p-16 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-cyan-600/15 blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-500/25 ring-1 ring-white/20">
            <Cross className="h-6 w-6 rotate-45 stroke-[2.5]" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight block leading-tight">
              Doctor Tracker
            </span>
            <span className="text-xs text-blue-200/80 font-medium tracking-wide">
              Healthcare Administration Platform
            </span>
          </div>
        </div>

        {/* Center Clinical Value Props */}
        <div className="relative z-10 my-auto py-12 max-w-xl">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/20 mb-6">
            <ShieldCheck className="h-4 w-4" /> Secure Administrative Portal
          </span>
          <h2 className="text-3xl lg:text-4xl font-bold tracking-tight text-white leading-tight mb-4">
            Clinical Precision & Doctor Management.
          </h2>
          <p className="text-sm lg:text-base text-slate-300 leading-relaxed mb-8">
            Manage physician rosters, monitor patient caseload capacities, and
            track health records with high-performance real-time analytics.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <Activity className="h-5 w-5 text-blue-400 mb-2" />
              <h3 className="text-sm font-semibold text-white">Caseload Optimization</h3>
              <p className="text-xs text-slate-400 mt-1">
                Monitor doctor capacity and patient allocation in real-time.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <Users className="h-5 w-5 text-cyan-400 mb-2" />
              <h3 className="text-sm font-semibold text-white">Patient Roster</h3>
              <p className="text-xs text-slate-400 mt-1">
                Securely manage medical conditions and attending assignments.
              </p>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 text-xs text-slate-400 flex items-center justify-between">
          <span>Enterprise Healthcare v2.4</span>
          <span>Compliant Administrative System</span>
        </div>
      </section>

      {/* Right Authentication Card */}
      <section className="flex flex-1 flex-col justify-center px-6 py-12 sm:px-12 lg:px-16 xl:px-20 bg-background">
        <div className="mx-auto w-full max-w-md">
          {/* Mobile Brand Header */}
          <div className="flex items-center gap-3 lg:hidden mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
              <Cross className="h-5 w-5 rotate-45 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight block">
                Doctor Tracker
              </span>
              <span className="text-xs text-muted-foreground font-medium">
                Clinical Portal
              </span>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Administrator Sign In
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Sign in with your administrative credentials to access the portal.
            </p>
          </div>

          {/* Error Banner */}
          {apiError && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-destructive">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <div className="text-xs font-medium leading-relaxed">
                {apiError}
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="admin@doctortracker.com"
                  {...register("email")}
                  className="h-10 w-full rounded-lg border border-input bg-card pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-colors"
                />
              </div>
              {errors.email && (
                <p className="text-xs font-medium text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  {...register("password")}
                  className="h-10 w-full rounded-lg border border-input bg-card pl-9 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs font-medium text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  {...register("rememberMe")}
                  className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
                />
                <span className="text-xs font-medium text-muted-foreground">
                  Remember this device
                </span>
              </label>
            </div>

            {/* Submit CTA */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-10 rounded-lg bg-primary text-primary-foreground font-semibold text-sm shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  <span>Verifying credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}

