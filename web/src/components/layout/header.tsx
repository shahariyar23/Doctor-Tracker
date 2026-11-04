"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Search, Bell, Menu } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store";
import { toggleSidebar } from "@/store/slices/ui-slice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const ROUTE_TITLES: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": {
    title: "Admin Overview Dashboard",
    subtitle: "Healthcare analytics, doctor workload, and patient distribution",
  },
  "/doctors": {
    title: "Doctor Directory & Management",
    subtitle: "Manage physicians, clinical specialties, and patient caseloads",
  },
  "/patients": {
    title: "Patient Directory & Management",
    subtitle: "Track patients, conditions, and doctor assignments",
  },
};

export function Header() {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Mac: Command + K (metaKey), Windows: Windows key + K (metaKey) or Ctrl + K (ctrlKey)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const routeInfo = ROUTE_TITLES[pathname] || {
    title: "Doctor Tracker",
    subtitle: "Clinical administrative portal",
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border bg-card/90 px-4 sm:px-6 backdrop-blur-md">
      {/* Left: Mobile trigger & Page Title */}
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => dispatch(toggleSidebar())}
          className="lg:hidden text-muted-foreground hover:text-foreground"
          aria-label="Toggle navigation menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="flex flex-col">
          <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
            {routeInfo.title}
          </h1>
          <p className="hidden text-xs text-muted-foreground sm:block">
            {routeInfo.subtitle}
          </p>
        </div>
      </div>

      {/* Right: Search, Notifications, Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Search Input */}
        <div className="relative hidden md:block w-64 lg:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
          <Input
            ref={searchInputRef}
            type="text"
            placeholder="Search doctors, patients... (⌘K)"
            className="pl-9 h-9 text-xs bg-muted/50 focus:bg-background"
          />
        </div>

        {/* Notifications Button */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="relative text-muted-foreground hover:text-foreground"
          aria-label="View notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary ring-2 ring-card" />
        </Button>

        {/* User Avatar */}
        <div className="flex items-center gap-2 pl-2 border-l border-border">
          <Avatar className="h-8 w-8 ring-1 ring-primary/20">
            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : "AD"}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
