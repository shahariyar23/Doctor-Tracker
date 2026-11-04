"use client";

import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { ConditionDistributionItem } from "../types";
import { cn } from "@/lib/utils";

interface ConditionDonutChartProps {
  data: ConditionDistributionItem[];
  className?: string;
}

const CONDITION_COLORS: Record<string, string> = {
  Critical: "#dc2626", // Red-600
  "Under Treatment": "#f59e0b", // Amber-500
  Stable: "#0d9488", // Teal-600
  Recovering: "#059669", // Emerald-600 (Healthcare mint/green)
};

export function ConditionDonutChart({ data, className }: ConditionDonutChartProps) {
  const total = data.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <div
      className={cn(
        "flex flex-col justify-between rounded-xl border border-border/80 bg-card p-5 shadow-xs",
        className
      )}
    >
      <div className="pb-2">
        <h2 className="text-base font-semibold text-foreground">
          Condition Status
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Patient distribution by clinical condition
        </p>
      </div>

      <div className="relative flex flex-col items-center justify-center py-2">
        {total === 0 ? (
          <div className="flex h-44 items-center justify-center text-xs text-muted-foreground">
            No patient conditions recorded.
          </div>
        ) : (
          <>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      borderColor: "#e2e8f0",
                      borderRadius: "0.5rem",
                      fontSize: "12px",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={68}
                    paddingAngle={3}
                    dataKey="count"
                    nameKey="condition"
                  >
                    {data.map((entry) => (
                      <Cell
                        key={entry.condition}
                        fill={CONDITION_COLORS[entry.condition] || "#64748b"}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend Breakdown */}
            <div className="grid grid-cols-2 gap-2 w-full pt-3 border-t border-border/60">
              {data.map((item) => {
                const color = CONDITION_COLORS[item.condition] || "#64748b";
                return (
                  <div
                    key={item.condition}
                    className="flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-muted-foreground truncate text-[11px]">
                        {item.condition}
                      </span>
                    </div>
                    <span className="font-semibold text-foreground text-[11px]">
                      {item.count}
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

