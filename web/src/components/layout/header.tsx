"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { Search, Menu, X } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store";
import { toggleMobileSidebar } from "@/store/slices/ui-slice";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { GlobalSearch } from "./global-search";

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
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  const routeInfo = ROUTE_TITLES[pathname] || {
    title: "Doctor Tracker",
    subtitle: "Clinical administrative portal",
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border bg-card/90 px-3 sm:px-6 backdrop-blur-md">
      {/* Mobile Full-Width Search Overlay */}
      {isMobileSearchOpen ? (
        <div className="flex items-center gap-2 w-full md:hidden">
          <GlobalSearch
            className="flex-1"
            onSelectResult={() => setIsMobileSearchOpen(false)}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileSearchOpen(false)}
            aria-label="Close search"
            className="shrink-0 text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      ) : (
        <>
          {/* Left: Mobile trigger & Page Title */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => dispatch(toggleMobileSidebar())}
              className="lg:hidden shrink-0 text-muted-foreground hover:text-foreground"
              aria-label="Toggle navigation menu"
            >
              <Menu className="h-5 w-5" />
            </Button>

            <div className="flex flex-col min-w-0">
              <h1 className="text-sm sm:text-lg font-bold tracking-tight text-foreground truncate">
                {routeInfo.title}
              </h1>
              <p className="hidden text-xs text-muted-foreground sm:block truncate">
                {routeInfo.subtitle}
              </p>
            </div>
          </div>

          {/* Right: Search, Notifications, Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Mobile Search Toggle Button */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileSearchOpen(true)}
              className="md:hidden text-muted-foreground hover:text-foreground"
              aria-label="Open search"
            >
              <Search className="h-4 w-4" />
            </Button>

            {/* Desktop Global Search Component */}
            <div className="relative hidden md:block w-64 lg:w-80">
              <GlobalSearch />
            </div>

            {/* User Avatar */}
            <div className="flex items-center gap-2 pl-2 border-l border-border">
              <Avatar className="h-8 w-8 ring-1 ring-primary/20">
                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                  {user?.name ? user.name.slice(0, 2).toUpperCase() : "AD"}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </>
      )}
    </header>
  );
}
