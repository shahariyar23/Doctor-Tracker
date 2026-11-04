"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Stethoscope,
  Users,
  ChevronsLeft,
  ChevronsRight,
  LogOut,
  Cross,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store";
import { toggleSidebar } from "@/store/slices/ui-slice";
import { logout } from "@/store/slices/auth-slice";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  {
    title: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Doctors",
    href: "/doctors",
    icon: Stethoscope,
  },
  {
    title: "Patients",
    href: "/patients",
    icon: Users,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const collapsed = useAppSelector((state) => state.ui.sidebarCollapsed);
  const user = useAppSelector((state) => state.auth.user);

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex flex-col justify-between border-r border-border bg-card transition-all duration-300 ease-in-out",
        collapsed ? "w-18" : "w-64"
      )}
    >
      {/* Brand Header */}
      <div className="flex flex-col">
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 overflow-hidden"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Cross className="h-5 w-5 rotate-45 stroke-[2.5]" />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="font-bold text-foreground leading-tight tracking-tight text-base">
                  Doctor Tracker
                </span>
                <span className="text-[11px] text-muted-foreground font-medium">
                  Clinical Portal
                </span>
              </div>
            )}
          </Link>
        </div>

        {/* Navigation Section */}
        <div className="px-3 py-4">
          {!collapsed && (
            <p className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
              Main Menu
            </p>
          )}
          <nav className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-accent text-accent-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    collapsed && "justify-center px-2"
                  )}
                  title={collapsed ? item.title : undefined}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )}
                  />
                  {!collapsed && <span>{item.title}</span>}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer / User Profile & Collapse Toggle */}
      <div className="border-t border-border p-3 flex flex-col gap-2 bg-muted/30">
        {!collapsed && user && (
          <div className="flex items-center gap-3 px-2 py-1.5 rounded-lg bg-card border border-border/60">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-xs">
              {user.name ? user.name.slice(0, 2).toUpperCase() : "AD"}
            </div>
            <div className="flex flex-col overflow-hidden text-xs">
              <span className="font-medium text-foreground truncate">
                {user.name || "Administrator"}
              </span>
              <span className="text-muted-foreground truncate text-[11px]">
                {user.email}
              </span>
            </div>
          </div>
        )}

        <div
          className={cn(
            "flex items-center justify-between",
            collapsed && "flex-col gap-2"
          )}
        >
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => dispatch(toggleSidebar())}
            className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronsRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronsLeft className="h-4 w-4" />
                <span>Collapse</span>
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => dispatch(logout())}
            className="flex items-center gap-2 text-xs font-medium text-destructive hover:bg-destructive/10 hover:text-destructive"
            title="Log out"
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span>Log out</span>}
          </Button>
        </div>
      </div>
    </aside>
  );
}

