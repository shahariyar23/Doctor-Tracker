"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Loader2,
  Stethoscope,
  User,
  Hospital,
  Phone,
  ArrowRight,
  AlertCircle,
  X,
} from "lucide-react";
import { useGlobalSearch } from "@/hooks/use-global-search";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SearchDoctorResult, SearchPatientResult } from "@/types/search";

interface GlobalSearchProps {
  className?: string;
  onSelectResult?: () => void;
}

export function GlobalSearch({ className, onSelectResult }: GlobalSearchProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    data,
    isLoading,
    isError,
    error,
    debouncedTerm,
    isQueryValid,
    refetch,
  } = useGlobalSearch(searchTerm, 5);

  const doctors = data?.doctors || [];
  const patients = data?.patients || [];
  const totalResults = doctors.length + patients.length;

  // Flatten items for keyboard navigation: doctors first, then patients
  const allResults: (
    | { type: "doctor"; item: SearchDoctorResult }
    | { type: "patient"; item: SearchPatientResult }
  )[] = [
    ...doctors.map((d) => ({ type: "doctor" as const, item: d })),
    ...patients.map((p) => ({ type: "patient" as const, item: p })),
  ];

  // Global keyboard shortcut Command+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Handle clicking outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectDoctor = (doctor: SearchDoctorResult) => {
    setIsOpen(false);
    setSearchTerm("");
    setActiveIndex(-1);
    onSelectResult?.();
    router.push(`/doctors/${doctor.id}`);
  };

  const handleSelectPatient = (patient: SearchPatientResult) => {
    setIsOpen(false);
    setSearchTerm("");
    setActiveIndex(-1);
    onSelectResult?.();
    // Directs to patients directory; query param ?search= can focus or highlight the record
    router.push(`/patients?search=${encodeURIComponent(patient.name)}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        setIsOpen(true);
        return;
      }
    }

    if (e.key === "Escape") {
      setIsOpen(false);
      setActiveIndex(-1);
      return;
    }

    if (allResults.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev < allResults.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : allResults.length - 1));
    } else if (e.key === "Enter" && activeIndex >= 0 && activeIndex < allResults.length) {
      e.preventDefault();
      const selection = allResults[activeIndex];
      if (selection.type === "doctor") {
        handleSelectDoctor(selection.item);
      } else {
        handleSelectPatient(selection.item);
      }
    }
  };

  const isDebouncing = searchTerm.trim() !== debouncedTerm && searchTerm.trim().length >= 2;

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      {/* Search Input Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls="global-search-results"
          aria-autocomplete="list"
          aria-haspopup="listbox"
          placeholder="Search doctors, patients... (⌘K)"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (!isOpen) setIsOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className="pl-9 pr-8 h-9 text-xs bg-muted/50 focus:bg-background border-border/80 focus:border-primary transition-colors"
        />

        {/* Clear or Loading Indicator */}
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center">
          {isLoading || isDebouncing ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
          ) : searchTerm ? (
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setActiveIndex(-1);
                inputRef.current?.focus();
              }}
              className="text-muted-foreground hover:text-foreground cursor-pointer"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Dropdown Menu Results */}
      {isOpen && searchTerm.trim().length > 0 && (
        <div
          id="global-search-results"
          role="listbox"
          className="absolute left-0 right-0 top-full mt-1.5 max-h-[460px] overflow-y-auto rounded-xl border border-border bg-card/95 backdrop-blur-md p-1.5 shadow-xl z-50 animate-in fade-in slide-in-from-top-1 duration-150"
        >
          {/* Query Too Short */}
          {!isQueryValid && (
            <div className="p-3 text-center text-xs text-muted-foreground">
              Please enter at least 2 characters to search.
            </div>
          )}

          {/* Loading State */}
          {isQueryValid && (isLoading || isDebouncing) && (
            <div className="flex items-center justify-center gap-2 p-6 text-xs text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span>Searching clinical registry...</span>
            </div>
          )}

          {/* Error State */}
          {isQueryValid && !isLoading && !isDebouncing && isError && (
            <div className="p-4 text-center space-y-2">
              <div className="flex items-center justify-center gap-1.5 text-xs text-destructive font-medium">
                <AlertCircle className="h-4 w-4" />
                <span>Failed to complete search</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {(error as Error)?.message || "A network or server error occurred."}
              </p>
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={() => refetch()}
                className="text-xs h-7 px-2"
              >
                Retry Search
              </Button>
            </div>
          )}

          {/* No Results Found */}
          {isQueryValid &&
            !isLoading &&
            !isDebouncing &&
            !isError &&
            totalResults === 0 && (
              <div className="p-6 text-center text-xs text-muted-foreground space-y-1">
                <p className="font-semibold text-foreground">
                  No matching doctors or patients found.
                </p>
                <p className="text-[11px]">
                  Try searching with a different physician name, specialty, or patient phone number.
                </p>
              </div>
            )}

          {/* Found Results */}
          {isQueryValid && !isLoading && !isDebouncing && !isError && totalResults > 0 && (
            <div className="space-y-3 p-1">
              {/* Doctors Group */}
              {doctors.length > 0 && (
                <div>
                  <div className="flex items-center justify-between px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border/50">
                    <span className="flex items-center gap-1.5">
                      <Stethoscope className="h-3.5 w-3.5 text-primary" />
                      Doctors ({doctors.length})
                    </span>
                  </div>
                  <div className="mt-1 space-y-1">
                    {doctors.map((doctor, idx) => {
                      const itemIndex = idx; // index in allResults
                      const isActive = activeIndex === itemIndex;

                      return (
                        <div
                          key={doctor.id}
                          role="option"
                          aria-selected={isActive}
                          onClick={() => handleSelectDoctor(doctor)}
                          onMouseEnter={() => setActiveIndex(itemIndex)}
                          className={cn(
                            "flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-colors text-left",
                            isActive
                              ? "bg-teal-50 dark:bg-teal-950/40 text-primary border border-teal-200/60"
                              : "hover:bg-muted/50 text-foreground"
                          )}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-300 font-semibold text-xs">
                              {doctor.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold truncate leading-tight">
                                {doctor.name}
                              </p>
                              <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1.5 mt-0.5">
                                <span>{doctor.specialization}</span>
                                <span>•</span>
                                <span className="flex items-center gap-1 truncate">
                                  <Hospital className="h-3 w-3 shrink-0" />
                                  {doctor.hospital}
                                </span>
                              </p>
                            </div>
                          </div>
                          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0 ml-2" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Patients Group */}
              {patients.length > 0 && (
                <div>
                  <div className="flex items-center justify-between px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border/50">
                    <span className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-primary" />
                      Patients ({patients.length})
                    </span>
                  </div>
                  <div className="mt-1 space-y-1">
                    {patients.map((patient, idx) => {
                      const itemIndex = doctors.length + idx;
                      const isActive = activeIndex === itemIndex;

                      return (
                        <div
                          key={patient.id}
                          role="option"
                          aria-selected={isActive}
                          onClick={() => handleSelectPatient(patient)}
                          onMouseEnter={() => setActiveIndex(itemIndex)}
                          className={cn(
                            "flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-colors text-left",
                            isActive
                              ? "bg-teal-50 dark:bg-teal-950/40 text-primary border border-teal-200/60"
                              : "hover:bg-muted/50 text-foreground"
                          )}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300 font-semibold text-xs">
                              {patient.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-xs font-semibold truncate leading-tight">
                                  {patient.name}
                                </p>
                                <Badge
                                  variant="secondary"
                                  className="text-[10px] px-1.5 py-0 font-medium"
                                >
                                  {patient.condition}
                                </Badge>
                              </div>
                              <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1.5 mt-0.5">
                                {patient.phone ? (
                                  <span className="flex items-center gap-1">
                                    <Phone className="h-3 w-3 shrink-0" />
                                    {patient.phone}
                                  </span>
                                ) : (
                                  <span>No phone</span>
                                )}
                                <span>•</span>
                                <span className="truncate">
                                  Dr:{" "}
                                  {patient.assignedDoctor?.name || (
                                    <span className="text-amber-600 font-medium">
                                      Unassigned
                                    </span>
                                  )}
                                </span>
                              </p>
                            </div>
                          </div>
                          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0 ml-2" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

