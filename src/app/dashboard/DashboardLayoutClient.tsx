"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import ManagerAdminSidebar from "@/components/dashboard/ManagerAdminSidebar";
import MobileHeader from "@/components/dashboard/MobileHeader";
import CalculatorWindow from "@/components/calculator/CalculatorWindow";
import { CalculatorProvider, useCalculator } from "@/contexts/CalculatorContext";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { useAuth } from "@/contexts/AuthContext";
import { DrawerSessionProvider } from "@/contexts/DrawerSessionContext";
import { ROUTES } from "@/lib/constants";

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { isOpen, close } = useCalculator();
  const { user, isManagerOrAdmin } = useAuth();

  if (!user) return null;

  const content = (
    <div className="flex h-screen overflow-hidden bg-white">
      {isManagerOrAdmin ? <ManagerAdminSidebar /> : <DashboardSidebar />}
      <div className="flex min-w-0 flex-1 flex-col md:ml-24 min-[1920px]:ml-28 min-[2560px]:ml-32">
        <MobileHeader />
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</main>
      </div>
      {isOpen && <CalculatorWindow onClose={close} />}
    </div>
  );

  return <DrawerSessionProvider>{content}</DrawerSessionProvider>;
}

export default function DashboardLayoutClient({ children }: { children: React.ReactNode }) {
  const { user, isReady } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    if (isReady && user === null && pathname?.startsWith("/dashboard")) {
      window.location.href = ROUTES.HOME;
    }
  }, [user, isReady, pathname]);

  if (!isReady || user === null) {
    return null;
  }

  return (
    <SidebarProvider>
      <CalculatorProvider>
        <DashboardContent>{children}</DashboardContent>
      </CalculatorProvider>
    </SidebarProvider>
  );
}
