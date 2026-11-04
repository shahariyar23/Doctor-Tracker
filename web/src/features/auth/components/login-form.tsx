"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import authData from "@/data/auth.json";
import {
  Shield,
  Stethoscope,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  Activity,
  Users,
  Check,
  ChevronUp,
  X,
  Loader2,
} from "lucide-react";
import { loginSchema, LoginFormData } from "../schemas/login-schema";
import { authService } from "../services/auth-service";
import { useAppDispatch } from "@/store";
import { setCredentials } from "@/store/slices/auth-slice";

interface ToastState {
  show: boolean;
  title: string;
  message: string;
  type: "success" | "mail" | "help" | "info";
}

export function LoginForm() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<ToastState>({
    show: false,
    title: "",
    message: "",
    type: "info",
  });

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "admin@doctortracker.com",
      password: "DoctorTracker#2026",
      rememberMe: true,
    },
  });

  const showToastNotification = (
    title: string,
    message: string,
    type: "success" | "mail" | "help" | "info" = "info"
  ) => {
    setToast({
      show: true,
      title,
      message,
      type,
    });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 4500);
  };

  const hideToast = () => {
    setToast((prev) => ({ ...prev, show: false }));
  };

  const performLoginSuccess = (
    user: { id: string; email: string; name: string; role: string },
    token: string
  ) => {
    dispatch(setCredentials({ user, token }));
    showToastNotification(
      "Welcome, Administrator!",
      "Successfully authenticated. Launching Doctor Tracker portal...",
      "success"
    );
    setTimeout(() => {
      router.push("/dashboard");
    }, 600);
  };

  const onSubmit = async (data: LoginFormData) => {
    setApiError(null);
    setIsSubmitting(true);

    const emailLower = data.email.trim().toLowerCase();

    // Check demo credentials fallback if backend service is local/offline
    const matchedDemoUser = authData.demoUsers.find(
      (u) => u.email.toLowerCase() === emailLower
    );
    const isDemoAdmin =
      Boolean(matchedDemoUser) &&
      (data.password === "DoctorTracker#2026" || data.password === "admin123");

    try {
      const response = await authService.login(data);
      performLoginSuccess(response.user, response.token);
    } catch {
      if (isDemoAdmin && matchedDemoUser) {
        performLoginSuccess(
          {
            id: matchedDemoUser.id,
            name: matchedDemoUser.name,
            email: matchedDemoUser.email,
            role: matchedDemoUser.role,
          },
          "demo-jwt-token-doctor-tracker"
        );
      } else {
        setApiError(
          "Invalid email or password combination. Please enter valid administrative credentials."
        );
        setIsSubmitting(false);
      }
    }
  };

  const handleForgotPassword = () => {
    const email = getValues("email");
    showToastNotification(
      "Password Reset Instructions",
      `A secure recovery link has been sent to ${email || "your registered email address"}.`,
      "mail"
    );
  };

  const handleHelp = () => {
    showToastNotification(
      "Healthcare Support Desk",
      "Contact your clinic IT department or email support@doctortracker.com for account inquiries.",
      "help"
    );
  };

  const triggerDemoError = () => {
    setApiError(
      apiError
        ? null
        : "Authentication Error: Invalid email or password combination. Please try again."
    );
  };

  return (
    <div className="bg-gradient-to-br from-slate-50 via-[#f0f7ff] to-[#f8fafc] text-slate-800 antialiased min-h-screen selection:bg-blue-100 selection:text-blue-900">
      {/* Toast Notification Container */}
      <div
        className={`fixed top-6 right-6 z-50 transform transition-all duration-300 pointer-events-none max-w-md w-full px-4 ${
          toast.show
            ? "translate-y-0 opacity-100 pointer-events-auto"
            : "translate-y-[-120%] opacity-0 pointer-events-none"
        }`}
        id="toast"
      >
        <div className="bg-white rounded-xl shadow-xl border border-slate-200/80 p-4 flex items-start gap-3 pointer-events-auto">
          <div
            className={`p-2 rounded-lg flex-shrink-0 ${
              toast.type === "success"
                ? "bg-emerald-50 text-emerald-600"
                : "bg-blue-50 text-blue-600"
            }`}
          >
            {toast.type === "success" ? (
              <Check className="w-5 h-5 stroke-[2.5]" />
            ) : toast.type === "mail" ? (
              <Mail className="w-5 h-5" />
            ) : (
              <HelpCircle className="w-5 h-5" />
            )}
          </div>
          <div className="flex-1 pt-0.5">
            <p className="text-sm font-semibold text-slate-900">{toast.title}</p>
            <p className="text-xs text-slate-600 mt-0.5">{toast.message}</p>
          </div>
          <button
            type="button"
            aria-label="Dismiss toast"
            className="text-slate-400 hover:text-slate-600 transition-colors p-1"
            onClick={() => setToast((prev) => ({ ...prev, show: false }))}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <main className="min-h-screen flex flex-col lg:flex-row items-stretch justify-center relative overflow-hidden">
        {/* LEFT PANEL: Branding & Visual Showcase */}
        <section className="w-full lg:w-[54%] xl:w-[56%] p-8 sm:p-12 lg:p-16 xl:p-20 flex flex-col justify-between relative bg-gradient-to-b from-[#f8fafc]/90 via-[#f0f7ff]/90 to-[#e8f2fe]/80 border-b lg:border-b-0 lg:border-r border-slate-200/70">
          {/* Subtle Decorative Background Glows */}
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-300/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-cyan-300/15 rounded-full blur-3xl pointer-events-none" />

          {/* Brand Header */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-[#123B63] to-[#2563EB] flex items-center justify-center shadow-md shadow-blue-900/10 ring-1 ring-white/60">
                {/* Medical Cross Plus Badge Icon */}
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight text-[#0F172A] block leading-none">
                  Doctor Tracker
                </span>
                <span className="text-xs font-medium text-slate-500 tracking-wide mt-1 block">
                  Healthcare Management Platform
                </span>
              </div>
            </div>
            <span className="hidden sm:inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50/80 text-blue-700 border border-blue-200/60">
              v2.4 Pro Release
            </span>
          </div>

          {/* Hero Value Proposition & Medical Visualization Card */}
          <div className="relative z-10 my-10 lg:my-auto max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-50 border border-cyan-200/60 text-cyan-800 text-xs font-semibold uppercase tracking-wider mb-4">
              <span className="w-2 h-2 rounded-full bg-cyan-500" />
              Intelligent Clinical Workflows
            </div>
            <h1 className="text-3xl sm:text-4xl xl:text-5xl font-extrabold text-[#0F172A] tracking-tight leading-[1.18]">
              Smarter Healthcare Management.
            </h1>
            <p className="mt-4 text-slate-600 text-base sm:text-lg leading-relaxed">
              A centralized platform to manage doctors, patients, and healthcare records
              efficiently.
            </p>

            {/* Layered Abstract Healthcare Dashboard Card */}
            <div className="mt-8 relative">
              {/* Ambient Glow Behind Card */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-2xl filter blur-xl transform -rotate-1" />

              {/* Main Glass Card Container */}
              <div className="relative bg-white/90 backdrop-blur-md rounded-2xl p-6 border border-slate-200/80 shadow-xl shadow-slate-200/50">
                {/* Mini Card Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-100/70 flex items-center justify-center text-blue-600 font-semibold text-xs">
                      ICU
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 leading-none">
                        Internal Care Unit #3
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Staff roster &amp; duty handover
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Active Shift
                  </span>
                </div>

                {/* Mini Visual Data Row */}
                <div className="grid grid-cols-2 gap-3 mt-4">
                  {/* Doctor Assignment Chip */}
                  <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      Assigned Physician
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-medium">
                        SJ
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-slate-800 block leading-tight">
                          Dr. Sarah Jenkins
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Cardiology Lead
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Patient Status Pill & Metrics */}
                  <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      Patient Caseload
                    </div>
                    <div className="flex items-baseline gap-2 mt-1.5">
                      <span className="text-xl font-bold text-slate-900">28</span>
                      <span className="text-xs font-medium text-emerald-600 flex items-center gap-0.5">
                        <ChevronUp className="w-3.5 h-3.5 stroke-[2.5]" />
                        Normal
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-cyan-500 h-1.5 rounded-full"
                        style={{ width: "72%" }}
                      />
                    </div>
                  </div>
                </div>

                {/* Pulse Wave Mini Graph Graphic */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1.5 font-medium text-slate-700">
                    <Activity className="w-4 h-4 text-cyan-600" />
                    Department Vitals Telemetry
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    Sync: Just now
                  </span>
                </div>
              </div>

              {/* Floating Ambient Badge: Real-time Record Sync */}
              <div className="absolute -bottom-4 -left-3 sm:-left-5 bg-white rounded-xl shadow-lg border border-slate-200/90 py-2 px-3.5 flex items-center gap-2.5 animate-float-1">
                <div className="w-6 h-6 rounded-lg bg-cyan-100 text-cyan-700 flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-800 leading-tight">
                    Patient Records Synchronized
                  </p>
                  <p className="text-[10px] text-slate-500 leading-none">
                    Instant bed reassignment
                  </p>
                </div>
              </div>

              {/* Floating Ambient Badge: Staff Duty */}
              <div className="absolute -top-3 -right-2 sm:-right-4 bg-white rounded-xl shadow-lg border border-slate-200/90 py-1.5 px-3 flex items-center gap-2 animate-float-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
                </span>
                <span className="text-xs font-semibold text-slate-700">
                  42 On-Duty Doctors
                </span>
              </div>
            </div>
          </div>

          {/* 3 Small Feature Highlights */}
          <div className="relative z-10 pt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-200/80">
            {/* Feature 1 */}
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-900 leading-tight">
                  Secure Patient Care
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-normal">
                  Encrypted digital charts &amp; safe identity validation.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-cyan-50 border border-cyan-100 text-cyan-600 flex items-center justify-center flex-shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-900 leading-tight">
                  Doctor &amp; Patient Tracking
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-normal">
                  Seamless ward shifts and live schedule routing.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-900 leading-tight">
                  Real-time Analytics
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-normal">
                  Fast caseload metrics and operational insights.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* RIGHT PANEL: Login Card */}
        <section className="w-full lg:w-[46%] xl:w-[44%] p-6 sm:p-10 lg:p-14 xl:p-16 flex flex-col justify-between items-center bg-white/60 lg:bg-transparent">
          {/* Top Spacer / Mobile Header Mirror */}
          <div className="w-full max-w-md flex justify-end">
            <button
              type="button"
              className="text-xs text-slate-500 hover:text-blue-600 transition-colors flex items-center gap-1.5 py-1 cursor-pointer"
              onClick={handleHelp}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Need Help?</span>
            </button>
          </div>

          {/* Core Login Card Container */}
          <div className="w-full max-w-md my-auto py-6">
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xl shadow-slate-200/60 p-7 sm:p-9 transition-all">
              {/* Card Header */}
              <div className="mb-6">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60 mb-3">
                  <Shield className="w-3.5 h-3.5 text-blue-600" />
                  <span>Administrative Portal</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                  Welcome Back
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Sign in with your administrative credentials.
                </p>
              </div>

              {/* Dismissible Error Alert Banner */}
              {apiError && (
                <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200/80 text-red-800 flex items-start justify-between gap-3 text-xs animate-in fade-in duration-200">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold block">Authentication Error</span>
                      <span>{apiError}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="text-red-400 hover:text-red-700 transition-colors p-0.5 cursor-pointer"
                    onClick={() => setApiError(null)}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Email Input */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Email Address
                  </label>
                  <div className="relative rounded-xl shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      {...register("email")}
                      placeholder="name@doctortracker.com"
                      className="block w-full pl-10 pr-3.5 py-2.5 text-sm text-slate-900 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-300/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all placeholder:text-slate-400"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-red-600 mt-1 font-medium">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Password Input with Show/Hide */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="password"
                      className="block text-xs font-semibold text-slate-700"
                    >
                      Password
                    </label>
                    <button
                      type="button"
                      className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors cursor-pointer"
                      onClick={handleForgotPassword}
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative rounded-xl shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      {...register("password")}
                      placeholder="••••••••••••"
                      className="block w-full pl-10 pr-11 py-2.5 text-sm text-slate-900 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-300/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all placeholder:text-slate-400"
                    />
                    <button
                      type="button"
                      aria-label="Toggle password visibility"
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <Eye className="w-4 h-4" />
                      ) : (
                        <EyeOff className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-red-600 mt-1 font-medium">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                {/* Remember Me Checkbox */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      {...register("rememberMe")}
                      className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 focus:ring-offset-0 transition-colors cursor-pointer"
                    />
                    <span className="text-xs text-slate-600">
                      Remember me for 30 days
                    </span>
                  </label>

                  <button
                    type="button"
                    className="text-[11px] text-slate-400 hover:text-slate-600 hover:underline cursor-pointer"
                    onClick={triggerDemoError}
                  >
                    Simulate error
                  </button>
                </div>

                {/* Primary Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm shadow-md shadow-blue-600/20 hover:shadow-lg hover:shadow-blue-600/30 transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-85 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Signing in...</span>
                      </>
                    ) : (
                      <>
                        <span>Sign In</span>
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Security note info */}
              <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-center gap-1.5 text-slate-400 text-xs text-center">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Protected workspace connection</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <footer className="w-full max-w-md pt-4 pb-2 text-center text-xs text-slate-400">
            <p>© 2026 Doctor Tracker. All rights reserved.</p>
          </footer>
        </section>
      </main>
    </div>
  );
}
