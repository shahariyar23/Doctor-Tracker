"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Stethoscope, Users, ArrowRightLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDoctors } from "@/features/doctors/hooks/use-doctors";
import { usePatients } from "@/features/patients/hooks/use-patients";
import { MobileQuickReassignModal } from "@/features/dashboard/components/mobile-quick-reassign-modal";

export function MobileBottomNav() {
  const pathname = usePathname();
  const [reassignModalOpen, setReassignModalOpen] = useState(false);

  const { data: doctorsData } = useDoctors({ limit: 50 });
  const { data: patientsData } = usePatients({ limit: 50 });

  const doctors = doctorsData?.doctors || [];
  const patients = patientsData?.patients || [];

  const navItems = [
    {
      title: "Overview",
      href: "/dashboard",
      icon: LayoutGrid,
      isActive: pathname === "/dashboard" || pathname === "/",
    },
    {
      title: "Doctors",
      href: "/doctors",
      icon: Stethoscope,
      isActive: pathname.startsWith("/doctors"),
    },
    {
      title: "Patients",
      href: "/patients",
      icon: Users,
      isActive: pathname.startsWith("/patients"),
    },
  ];

  return (
    <>
      <nav
        aria-label="Mobile Bottom Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t border-border shadow-[0_-2px_12px_rgba(0,0,0,0.06)] lg:hidden pb-safe"
      >
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.title}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center min-w-[56px] py-1 transition-colors text-xs font-medium",
                  item.isActive
                    ? "text-primary font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className={cn("h-5 w-5", item.isActive && "stroke-[2.5]")} />
                <span className="text-[11px] mt-1 tracking-tight">{item.title}</span>
              </Link>
            );
          })}

          {/* Quick Reassign Action */}
          <button
            type="button"
            onClick={() => setReassignModalOpen(true)}
            className="flex flex-col items-center justify-center min-w-[56px] py-1 transition-colors text-xs font-medium text-muted-foreground hover:text-primary active:scale-95"
            aria-label="Quick Reassign Patient Load"
          >
            <div className="relative">
              <ArrowRightLeft className="h-5 w-5 text-primary" />
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
            </div>
            <span className="text-[11px] mt-1 tracking-tight text-foreground font-medium">
              Reassign
            </span>
          </button>
        </div>
      </nav>

      {/* Quick Reassign Modal for Mobile */}
      <MobileQuickReassignModal
        isOpen={reassignModalOpen}
        onClose={() => setReassignModalOpen(false)}
        doctors={doctors}
        patients={patients}
      />
    </>
  );
}
