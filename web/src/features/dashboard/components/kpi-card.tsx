import React from "react";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
    positive?: boolean;
  };
  variant?: "default" | "warning" | "destructive" | "success";
  className?: string;
}

export function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = "default",
  className,
}: KpiCardProps) {
  const iconVariants = {
    default: "bg-primary/10 text-primary",
    warning: "bg-amber-500/10 text-amber-600",
    destructive: "bg-destructive/10 text-destructive",
    success: "bg-emerald-500/10 text-emerald-600",
  };

  return (
    <div
      className={cn(
        "flex flex-col justify-between rounded-xl border border-border/80 bg-card p-5 shadow-xs hover:shadow-md transition-shadow",
        className
      )}
    >
      <div className="flex items-center justify-between pb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </span>
        <div
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg",
            iconVariants[variant]
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {value}
          </span>
          {subtitle && (
            <span className="text-xs font-medium text-muted-foreground">
              {subtitle}
            </span>
          )}
        </div>

        {trend && (
          <div className="flex items-center gap-1.5 pt-1 text-xs">
            <span
              className={cn(
                "inline-flex items-center font-medium",
                trend.positive !== false
                  ? "text-emerald-600"
                  : "text-destructive"
              )}
            >
              {trend.positive !== false ? (
                <TrendingUp className="mr-0.5 h-3.5 w-3.5" />
              ) : (
                <TrendingDown className="mr-0.5 h-3.5 w-3.5" />
              )}
              {trend.value > 0 ? `+${trend.value}%` : `${trend.value}%`}
            </span>
            <span className="text-muted-foreground">{trend.label}</span>
          </div>
        )}
      </div>
    </div>
  );
}

