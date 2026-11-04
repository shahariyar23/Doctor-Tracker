"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Stethoscope,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Loader2,
  Activity,
  Users,
  ShieldCheck,
  TrendingUp,
  Clock,
  Sparkles,
  BarChart3,
  CalendarCheck2,
} from "lucide-react";
import { loginSchema, LoginFormData } from "../schemas/login-schema";
import { useAuth } from "../hooks/use-auth";
import { getErrorMessage } from "@/lib/api-client";

export function LoginForm() {
  const { login, isLoggingIn } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "admin@doctortracker.com",
      password: "AdminPassword#2026",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setApiError(null);
    try {
      await login({
        email: data.email,
        password: data.password,
      });
    } catch (err) {
      setApiError(getErrorMessage(err));
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-[#f8fafc] text-slate-900 selection:bg-teal-100 selection:text-teal-900">
      {/* ========================================================= */}
      {/* LEFT COLUMN: Clean, High-Precision Admin Login Panel     */}
      {/* Proportions: ~44-48% on large screens (w-full lg:w-[46%])  */}
      {/* ========================================================= */}
      <section
        aria-label="Administrative Authentication"
        className="flex w-full lg:w-[46%] xl:w-[44%] flex-col justify-between p-6 sm:p-10 lg:p-12 xl:p-16 bg-[#fbfcfd] border-r border-slate-200/70 z-10 shrink-0"
      >
        {/* Top Header / Branding */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-600 to-emerald-700 text-white shadow-md shadow-teal-700/15 ring-1 ring-teal-600/30">
              <Stethoscope className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold tracking-tight text-slate-900">
                  Doctor Tracker
                </span>
                <span className="inline-flex items-center rounded-md border border-teal-200/80 bg-teal-50 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-teal-800 uppercase">
                  Admin
                </span>
              </div>
              <p className="text-[12px] font-medium text-slate-500">
                Healthcare Resource & Patient Administration
              </p>
            </div>
          </div>
        </header>

        {/* Center Content: Login Form Card */}
        <main className="my-auto py-8 sm:py-12 w-full max-w-[420px] mx-auto">
          {/* Welcome Heading */}
          <div className="mb-8 space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Welcome Back
            </h1>
            <p className="text-sm leading-relaxed text-slate-500">
              Sign in to your administrative workspace to manage doctors, patients, and clinical operations.
            </p>
          </div>

          {/* Error Banner */}
          {apiError && (
            <div
              role="alert"
              aria-live="assertive"
              className="mb-6 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50/80 p-3.5 text-xs text-rose-800 shadow-xs animate-in fade-in slide-in-from-top-2 duration-200"
            >
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" aria-hidden="true" />
              <div className="flex-1 leading-relaxed">
                <span className="font-semibold text-rose-900">Authentication Failed: </span>
                <span>{apiError}</span>
              </div>
            </div>
          )}

          {/* Form */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="space-y-5"
          >
            {/* Email Field */}
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-xs font-semibold tracking-wide text-slate-700"
              >
                Email Address
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Mail className="h-4 w-4" aria-hidden="true" />
                </div>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  disabled={isLoggingIn}
                  aria-invalid={errors.email ? "true" : "false"}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  {...register("email")}
                  className={`h-11 w-full rounded-xl border bg-white pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 transition-all outline-none focus:ring-3 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 ${
                    errors.email
                      ? "border-rose-300 focus:border-rose-500 focus:ring-rose-100"
                      : "border-slate-200 hover:border-slate-300 focus:border-teal-600 focus:ring-teal-100/70"
                  }`}
                  placeholder="admin@doctortracker.com"
                />
              </div>
              {errors.email && (
                <p
                  id="email-error"
                  role="alert"
                  className="flex items-center gap-1.5 text-xs font-medium text-rose-600 mt-1"
                >
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>{errors.email.message}</span>
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="block text-xs font-semibold tracking-wide text-slate-700"
              >
                Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Lock className="h-4 w-4" aria-hidden="true" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  disabled={isLoggingIn}
                  aria-invalid={errors.password ? "true" : "false"}
                  aria-describedby={errors.password ? "password-error" : undefined}
                  {...register("password")}
                  className={`h-11 w-full rounded-xl border bg-white pl-10 pr-11 text-sm text-slate-900 placeholder:text-slate-400 transition-all outline-none focus:ring-3 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 ${
                    errors.password
                      ? "border-rose-300 focus:border-rose-500 focus:ring-rose-100"
                      : "border-slate-200 hover:border-slate-300 focus:border-teal-600 focus:ring-teal-100/70"
                  }`}
                  placeholder="••••••••••••"
                />
                <button
                  type="button"
                  disabled={isLoggingIn}
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 focus-visible:outline-none focus-visible:text-slate-700 transition-colors cursor-pointer disabled:cursor-not-allowed"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p
                  id="password-error"
                  role="alert"
                  className="flex items-center gap-1.5 text-xs font-medium text-rose-600 mt-1"
                >
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>{errors.password.message}</span>
                </p>
              )}
            </div>

            {/* Security Notice / Session Integrity */}
            <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-500">
              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" aria-hidden="true" />
              <span>HTTP-only encrypted session token authorization</span>
            </div>

            {/* Primary Login Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoggingIn}
                className="group w-full h-11 flex items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 active:bg-teal-900 shadow-sm shadow-teal-900/10 transition-all outline-none focus-visible:ring-3 focus-visible:ring-teal-500/30 disabled:opacity-65 disabled:cursor-not-allowed cursor-pointer"
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-white" aria-hidden="true" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Dashboard</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                  </>
                )}
              </button>
            </div>
          </form>
        </main>

        {/* Footer */}
        <footer className="pt-6 border-t border-slate-200/60 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <span>Doctor Tracker v1.0 • Clinical Administration</span>
          <p>© 2026 Doctor Tracker. All rights reserved.</p>
        </footer>
      </section>

      {/* ========================================================= */}
      {/* RIGHT COLUMN: Premium Healthcare Visual Dashboard Panel   */}
      {/* Proportions: ~52-56% (flex-1 lg:flex hidden)              */}
      {/* Concept: Deep navy & teal backdrop, ambient radial glow, */}
      {/* realistic high-fidelity clinical administration mockups.   */}
      {/* ========================================================= */}
      <section
        aria-label="Clinical Management Highlights"
        className="hidden lg:flex flex-1 relative flex-col justify-between overflow-hidden bg-slate-950 p-10 xl:p-14 select-none"
      >
        {/* Subtle Ambient Radial Lighting Effects */}
        <div
          className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-teal-500/15 blur-3xl pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute top-1/2 left-1/4 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-slate-800/40 blur-3xl pointer-events-none"
          aria-hidden="true"
        />

        {/* Background Grid Pattern (Subtle Architectural Lines) */}
        <div
          className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none"
          aria-hidden="true"
        />

        {/* Top Header Badge */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-950/60 px-3.5 py-1 text-xs font-medium text-teal-300 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-teal-400" aria-hidden="true" />
            <span>Clinical Intelligence Platform</span>
          </div>
          <div className="text-[11px] font-mono tracking-wider text-slate-400 uppercase">
            Phase 11 Production System
          </div>
        </div>

        {/* Central Composition: Premium Dashboard Preview Card Stack */}
        <div className="relative z-10 my-auto py-8 xl:py-10 flex flex-col items-center justify-center">
          {/* Main Floating Dashboard Preview Container */}
          <div className="w-full max-w-xl rounded-2xl border border-slate-700/60 bg-slate-900/85 p-6 shadow-2xl shadow-black/60 backdrop-blur-xl">
            {/* Window Chrome / Status Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
                <span className="ml-2 text-xs font-medium text-slate-400">
                  clinical-admin.doctortracker.local
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-teal-400 bg-teal-950/70 border border-teal-800/60 px-2.5 py-0.5 rounded-full font-mono">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Active Database Node
              </div>
            </div>

            {/* Key Metric Gauges Row */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              {/* Metric 1 */}
              <div className="rounded-xl border border-slate-800/80 bg-slate-950/50 p-3.5">
                <div className="flex items-center justify-between text-slate-400 mb-1.5">
                  <span className="text-[11px] font-medium">Physician Rosters</span>
                  <Activity className="h-3.5 w-3.5 text-teal-400" />
                </div>
                <div className="text-xl font-bold text-white tracking-tight">Active Coverage</div>
                <div className="mt-1 flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                  <TrendingUp className="h-3 w-3" />
                  <span>3 Shifts Scheduled</span>
                </div>
              </div>

              {/* Metric 2 */}
              <div className="rounded-xl border border-slate-800/80 bg-slate-950/50 p-3.5">
                <div className="flex items-center justify-between text-slate-400 mb-1.5">
                  <span className="text-[11px] font-medium">Patient Intake</span>
                  <Users className="h-3.5 w-3.5 text-emerald-400" />
                </div>
                <div className="text-xl font-bold text-white tracking-tight">Referral Matrix</div>
                <div className="mt-1 flex items-center gap-1 text-[11px] text-teal-400 font-medium">
                  <span>Balanced Distribution</span>
                </div>
              </div>

              {/* Metric 3 */}
              <div className="rounded-xl border border-slate-800/80 bg-slate-950/50 p-3.5">
                <div className="flex items-center justify-between text-slate-400 mb-1.5">
                  <span className="text-[11px] font-medium">Data Integrity</span>
                  <ShieldCheck className="h-3.5 w-3.5 text-teal-300" />
                </div>
                <div className="text-xl font-bold text-white tracking-tight">Protected</div>
                <div className="mt-1 flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                  <span>Zero Orphan Records</span>
                </div>
              </div>
            </div>

            {/* Simulated Clinical Workload & Allocation Panel */}
            <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200">Department Workload Distribution</span>
                <span className="text-slate-400 text-[11px]">Real-time Specialization Tracking</span>
              </div>

              {/* Bar 1: Cardiology */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-300">
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className="h-2 w-2 rounded-full bg-teal-400" />
                    Cardiology
                  </span>
                  <span className="font-mono text-slate-400">88% Capacity</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-400 w-[88%]" />
                </div>
              </div>

              {/* Bar 2: Neurology */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-300">
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    Neurology
                  </span>
                  <span className="font-mono text-slate-400">72% Capacity</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-400 w-[72%]" />
                </div>
              </div>

              {/* Bar 3: Pediatrics */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-300">
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className="h-2 w-2 rounded-full bg-cyan-400" />
                    Pediatrics
                  </span>
                  <span className="font-mono text-slate-400">54% Capacity</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-400 w-[54%]" />
                </div>
              </div>
            </div>

            {/* Bottom Quick Status Strip */}
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <CalendarCheck2 className="h-3.5 w-3.5 text-teal-400" />
                Continuous Administrative Auditing
              </span>
              <span className="font-mono text-slate-400">v1.0 API /api/v1</span>
            </div>
          </div>
        </div>

        {/* Bottom Supporting Content & Feature Highlights */}
        <div className="relative z-10 space-y-5">
          <div className="space-y-1.5">
            <h2 className="text-xl xl:text-2xl font-bold tracking-tight text-white">
              Better Clinical Operations. Smarter Patient Management.
            </h2>
            <p className="text-xs xl:text-sm text-slate-400 leading-relaxed max-w-xl">
              Manage medical professionals, organize patient allocations, and gain meaningful insights from one secure administration workspace.
            </p>
          </div>

          {/* 3 Pillars / Feature Highlights */}
          <div className="grid grid-cols-3 gap-4 pt-2 border-t border-slate-800/80">
            <div className="flex items-start gap-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-teal-950 border border-teal-800/70 text-teal-300">
                <Activity className="h-3.5 w-3.5" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-slate-200">Doctor Management</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Specializations & shifts</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-teal-950 border border-teal-800/70 text-teal-300">
                <Users className="h-3.5 w-3.5" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-slate-200">Patient Allocation</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Assigned physician care</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-teal-950 border border-teal-800/70 text-teal-300">
                <BarChart3 className="h-3.5 w-3.5" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-slate-200">Clinical Analytics</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Intake trends & capacity</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
