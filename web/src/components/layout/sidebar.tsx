"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronsLeft,
  ChevronsRight,
  LogOut,
  Cross,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store";
import { toggleSidebar, setMobileSidebarOpen } from "@/store/slices/ui-slice";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { NAV_ITEMS } from "./nav-config";

export function Sidebar() {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const { logout, user } = useAuth();
  const collapsed = useAppSelector((state) => state.ui.sidebarCollapsed);
  const mobileOpen = useAppSelector((state) => state.ui.mobileSidebarOpen);

  // Close mobile sidebar on route change
  React.useEffect(() => {
    dispatch(setMobileSidebarOpen(false));
  }, [pathname, dispatch]);

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Close navigation backdrop"
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs transition-opacity cursor-pointer lg:hidden"
          onClick={() => dispatch(setMobileSidebarOpen(false))}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === "Escape") {
              dispatch(setMobileSidebarOpen(false));
            }
          }}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col justify-between border-r border-border bg-card transition-transform duration-300 ease-in-out lg:z-40 lg:translate-x-0",
          collapsed ? "lg:w-18" : "lg:w-64",
          "w-64",
          mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Brand Header */}
        <div className="flex flex-col">
          <div className="flex h-16 items-center justify-between border-b border-border px-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 overflow-hidden cursor-pointer group"
              onClick={() => dispatch(setMobileSidebarOpen(false))}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                <Cross className="h-5 w-5 rotate-45 stroke-[2.5]" />
              </div>
              <div className={cn("flex flex-col", collapsed && "lg:hidden")}>
                <span className="font-bold text-foreground leading-tight tracking-tight text-base">
                  Doctor Tracker
                </span>
                <span className="text-[11px] text-muted-foreground font-medium">
                  Clinical Portal
                </span>
              </div>
            </Link>

            {/* Mobile close button */}
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => dispatch(setMobileSidebarOpen(false))}
              className="lg:hidden text-muted-foreground hover:text-foreground"
              aria-label="Close menu"
            >
              <ChevronsLeft className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation Section */}
          <div className="px-3 py-4">
            <p
              className={cn(
                "px-3 pb-2 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase",
                collapsed && "lg:hidden"
              )}
            >
              Main Menu
            </p>
            <nav className="flex flex-col gap-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href || pathname.startsWith(`${item.href}/`);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => dispatch(setMobileSidebarOpen(false))}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors cursor-pointer",
                      isActive
                        ? "bg-accent text-accent-foreground shadow-xs font-semibold"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      collapsed && "lg:justify-center lg:px-2"
                    )}
                    title={collapsed ? item.title : undefined}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0",
                        isActive ? "text-primary" : "text-muted-foreground"
                      )}
                    />
                    <span className={cn(collapsed && "lg:hidden")}>
                      {item.title}
                    </span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Footer / User Profile & Collapse Toggle */}
        <div className="border-t border-border p-3 flex flex-col gap-2 bg-muted/30">
          {user && (
            <div
              className={cn(
                "flex items-center gap-3 px-2 py-1.5 rounded-lg bg-card border border-border/60",
                collapsed && "lg:hidden"
              )}
            >
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
              collapsed && "lg:flex-col lg:gap-2"
            )}
          >
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => dispatch(toggleSidebar())}
              className="hidden lg:flex items-center gap-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
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
              onClick={async () => {
                dispatch(setMobileSidebarOpen(false));
                await logout();
              }}
              className="flex items-center gap-2 text-xs font-medium text-destructive hover:bg-destructive/10 hover:text-destructive w-full lg:w-auto justify-center lg:justify-start"
              title="Log out"
            >
              <LogOut className="h-4 w-4" />
              <span className={cn(collapsed && "lg:hidden")}>Log out</span>
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}

