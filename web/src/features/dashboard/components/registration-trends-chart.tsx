"use client";

import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { RegistrationTrendItem } from "../types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface RegistrationTrendsChartProps {
  data: RegistrationTrendItem[];
  period: "7d" | "30d" | "90d";
  onPeriodChange: (period: "7d" | "30d" | "90d") => void;
  className?: string;
}

export function RegistrationTrendsChart({
  data,
  period,
  onPeriodChange,
  className,
}: RegistrationTrendsChartProps) {
  return (
    <div
      className={cn(
        "flex flex-col justify-between rounded-xl border border-border/80 bg-card p-5 shadow-xs",
        className
      )}
    >
      {/* Header with period toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            Patient Registration Trends
          </h2>
          <p className="text-xs text-muted-foreground">
            New patient registrations logged over time
          </p>
        </div>

        <div className="flex items-center rounded-lg bg-muted p-0.5 self-start sm:self-auto">
          {(["7d", "30d", "90d"] as const).map((p) => (
            <Button
              key={p}
              type="button"
              variant={period === p ? "default" : "ghost"}
              size="xs"
              onClick={() => onPeriodChange(p)}
              className={cn(
                "uppercase text-xs",
                period === p ? "shadow-xs" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {p}
            </Button>
          ))}
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-64 w-full pt-2">
        {data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            No registration trend data available for this timeframe.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="regGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#e2e8f0"
              />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "#64748b" }}
                dy={8}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "#64748b" }}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  borderColor: "#e2e8f0",
                  borderRadius: "0.5rem",
                  fontSize: "12px",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                }}
                labelStyle={{ fontWeight: 600, color: "#0f172a" }}
              />
              <Area
                type="monotone"
                dataKey="count"
                name="Registrations"
                stroke="#2563eb"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#regGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

