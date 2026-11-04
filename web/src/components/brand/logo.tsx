import React from "react";
import { Stethoscope } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LogoProps {
  /**
   * Layout variant:
   * - "full": Icon + Brand Title + Subtitle (+ optional badge)
   * - "compact": Icon + Brand Title (+ optional badge)
   * - "icon-only": Only the official icon badge
   */
  variant?: "full" | "compact" | "icon-only";
  /**
   * Sizing variant
   */
  size?: "sm" | "md" | "lg";
  /**
   * Whether to show the ADMIN badge
   */
  showBadge?: boolean;
  /**
   * Custom badge label (defaults to "Admin")
   */
  badgeText?: string;
  /**
   * Theme mode for the logo text (dark for dark backgrounds like hero/auth panel, default for light/card backgrounds)
   */
  colorScheme?: "default" | "light" | "on-dark";
  /**
   * Custom className for root wrapper
   */
  className?: string;
}

export function Logo({
  variant = "full",
  size = "md",
  showBadge = false,
  badgeText = "Admin",
  colorScheme = "default",
  className,
}: LogoProps) {
  // Size-specific styling mappings
  const iconContainerSizes = {
    sm: "h-7 w-7 rounded-lg",
    md: "h-9 w-9 rounded-xl",
    lg: "h-11 w-11 rounded-2xl",
  };

  const iconSizes = {
    sm: "h-3.5 w-3.5",
    md: "h-4.5 w-4.5",
    lg: "h-5.5 w-5.5",
  };

  const titleSizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  const subtitleSizes = {
    sm: "text-[10px]",
    md: "text-[11px]",
    lg: "text-xs",
  };

  // Text color schemes
  const titleColor =
    colorScheme === "on-dark"
      ? "text-white"
      : "text-foreground";

  const subtitleColor =
    colorScheme === "on-dark"
      ? "text-slate-400"
      : "text-muted-foreground";

  return (
    <div className={cn("inline-flex items-center gap-2.5 select-none", className)}>
      {/* Official Doctor Tracker Brand Icon Badge */}
      <div
        className={cn(
          "flex shrink-0 items-center justify-center bg-gradient-to-br from-teal-600 to-emerald-700 text-white shadow-sm ring-1 ring-teal-600/30",
          iconContainerSizes[size]
        )}
        aria-hidden="true"
      >
        <Stethoscope className={cn(iconSizes[size], "stroke-[2.2]")} />
      </div>

      {/* Brand Typography (Hidden for icon-only) */}
      {variant !== "icon-only" && (
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "font-bold tracking-tight leading-tight truncate",
                titleSizes[size],
                titleColor
              )}
            >
              Doctor Tracker
            </span>

            {showBadge && (
              <span
                className={cn(
                  "inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase shrink-0",
                  colorScheme === "on-dark"
                    ? "border-teal-500/40 bg-teal-950/80 text-teal-300"
                    : "border-teal-200 bg-teal-50 text-teal-800 dark:border-teal-900/60 dark:bg-teal-950/40 dark:text-teal-300"
                )}
              >
                {badgeText}
              </span>
            )}
          </div>

          {variant === "full" && (
            <span
              className={cn(
                "font-medium tracking-tight truncate leading-tight mt-0.5",
                subtitleSizes[size],
                subtitleColor
              )}
            >
              Healthcare Resource & Patient Administration
            </span>
          )}
        </div>
      )}
    </div>
  );
}
