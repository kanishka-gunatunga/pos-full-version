"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  ShoppingBag,
  CreditCard,
  Users,
  Calculator,
  LogOut,
  X,
  Package,
  UserCog,
  Activity,
  Truck,
  Tag,
  Square,
} from "lucide-react";
import OrdersIcon from "@/components/icons/OrdersIcon";
import BranchesIcon from "@/components/icons/BranchesIcon";
import DrawerIcon from "@/components/icons/DrawerIcon";
import ReportIcon from "@/components/icons/ReportIcon";
import ExtraFeeIcon from "@/components/icons/ExtraFeeIcon";
import GiftVoucherIcon from "@/components/icons/GiftVoucherIcon";
import { ROUTES } from "@/lib/constants";
import { getFirstName } from "@/lib/format";
import { useCalculator } from "@/contexts/CalculatorContext";
import { useSidebar } from "@/contexts/SidebarContext";
import { useAuth } from "@/contexts/AuthContext";
import { useDrawerSession } from "@/contexts/DrawerSessionContext";
import CloseDrawerBeforeLogoutModal from "@/components/drawer/CloseDrawerBeforeLogoutModal";
import * as sessionService from "@/services/sessionService";

const ORDER_STORAGE_KEY = "pos_orders";
const ACTIVE_ORDER_ID_KEY = "pos_active_order_id";

const navLinks = [
  { href: ROUTES.DASHBOARD, label: "Dashboard", icon: LayoutGrid },
  { href: ROUTES.DASHBOARD_MENU, label: "Menu", icon: ShoppingBag },
  { href: ROUTES.DASHBOARD_ORDERS, label: "Orders", icon: OrdersIcon },
  { href: ROUTES.DASHBOARD_PAYMENTS, label: "Payments", icon: CreditCard },
  { href: ROUTES.DASHBOARD_CUSTOMERS, label: "Customers", icon: Users },
  { href: ROUTES.DASHBOARD_TABLES, label: "Tables", icon: Square },
  { href: ROUTES.DASHBOARD_USERS, label: "Users", icon: UserCog },
  { href: ROUTES.DASHBOARD_BRANCHES, label: "Branches", icon: BranchesIcon },
  { href: ROUTES.DASHBOARD_VOUCHERS, label: "Vouchers", icon: GiftVoucherIcon },
  { href: ROUTES.DASHBOARD_PROMOTIONS, label: "Promotions", icon: Tag },
  { href: ROUTES.DASHBOARD_INVENTORY, label: "Inventory", icon: Package },
  { href: ROUTES.DASHBOARD_DRAWER, label: "Drawer", icon: DrawerIcon },
  { href: ROUTES.DASHBOARD_EXTRA_FEE, label: "Extra Fee", icon: ExtraFeeIcon },
  { href: ROUTES.DASHBOARD_SUPPLY, label: "Supply", icon: Truck },
  { href: ROUTES.DASHBOARD_REPORTS, label: "Report", icon: ReportIcon },
  { href: ROUTES.DASHBOARD_ACTIVITY, label: "Activity", icon: Activity },
] as const;

function NavLink({
  href,
  label,
  icon: Icon,
  isActive,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  isActive: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`flex flex-col items-center gap-1 py-2.5 min-[1920px]:gap-1.5 min-[1920px]:py-3 min-[2560px]:gap-2 min-[2560px]:py-3.5 transition-colors shrink-0 ${
        isActive ? "text-primary" : "text-[#90A1B9] hover:text-zinc-700"
      }`}
    >
      <div
        className={`flex items-center justify-center rounded-lg p-1.5 min-[1920px]:p-2 min-[2560px]:p-2.5 ${
          isActive ? "bg-primary-muted" : ""
        }`}
      >
        <Icon className="h-5 w-5 shrink-0 min-[1920px]:h-[22px] min-[1920px]:w-[22px] min-[2560px]:h-6 min-[2560px]:w-6" />
      </div>
      <span className="text-[9px] font-medium uppercase tracking-wider leading-tight min-[1920px]:text-[10px] min-[2560px]:text-[11px]">
        {label}
      </span>
    </Link>
  );
}

function CalculatorTab({ onToggle }: { onToggle?: () => void }) {
  const { isOpen, toggle } = useCalculator();

  const handleClick = () => {
    toggle();
    onToggle?.();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`flex flex-col items-center gap-1 py-2.5 min-[1920px]:gap-1.5 min-[1920px]:py-3 min-[2560px]:gap-2 min-[2560px]:py-3.5 transition-colors shrink-0 ${
        isOpen ? "text-primary" : "text-[#90A1B9] hover:text-zinc-700"
      }`}
    >
      <div
        className={`flex items-center justify-center rounded-lg p-1.5 min-[1920px]:p-2 min-[2560px]:p-2.5 ${
          isOpen ? "bg-primary-muted" : ""
        }`}
      >
        <Calculator className="h-5 w-5 shrink-0 min-[1920px]:h-[22px] min-[1920px]:w-[22px] min-[2560px]:h-6 min-[2560px]:w-6" />
      </div>
      <span className="text-[9px] font-medium uppercase tracking-wider leading-tight min-[1920px]:text-[10px] min-[2560px]:text-[11px]">
        Calculator
      </span>
    </button>
  );
}

export default function ManagerAdminSidebar() {
  const pathname = usePathname();
  const { isOpen, close } = useSidebar();
  const { user, logout } = useAuth();
  const drawerSession = useDrawerSession();
  const [isCloseDrawerModalOpen, setIsCloseDrawerModalOpen] = useState(false);

  const hasActiveSession = drawerSession?.hasActiveSession ?? false;
  const setHasActiveSession = drawerSession?.setHasActiveSession;
  const setSessionData = drawerSession?.setSessionData;
  const setHasDrawerStarted = drawerSession?.setHasDrawerStarted;

  const handleLogoutClick = () => {
    if (hasActiveSession) {
      setIsCloseDrawerModalOpen(true);
    } else {
      logout();
    }
  };

  const handleCloseSessionAndLogout = async (actualBalance: number, passcode: string) => {
    await sessionService.closeSession({ passcode, actualBalance });
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(ORDER_STORAGE_KEY);
      sessionStorage.removeItem(ACTIVE_ORDER_ID_KEY);
    }
    setHasActiveSession?.(false);
    setSessionData?.(null);
    setHasDrawerStarted?.(false);
    setIsCloseDrawerModalOpen(false);
    logout();
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity md:hidden ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={close}
        aria-hidden
      />

      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r border-[#E2E8F0] bg-[#F8FAFC] transition-transform md:w-24 md:translate-x-0 min-[1920px]:w-28 min-[2560px]:w-32 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-end border-b border-[#E2E8F0] bg-[#F8FAFC] p-2.5 md:hidden">
          <button
            type="button"
            onClick={close}
            className="rounded-lg p-2 text-[#90A1B9] transition-colors hover:bg-[#E2E8F0] hover:text-[#45556C]"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex min-h-0 flex-1 flex-col items-center gap-2 overflow-y-auto overflow-x-hidden pt-5 pb-2 min-[1920px]:gap-3 min-[1920px]:pt-6 min-[2560px]:gap-4 min-[2560px]:pt-7 [scrollbar-width:thin] [scrollbar-color:#E2E8F0_transparent]">
          {navLinks
            .filter((l) => l.label !== "Report" && l.label !== "Activity")
            .map(({ href, label, icon: Icon }) => {
              const isDashboard = label === "Dashboard";
              const isMenu = label === "Menu";
              const isDrawer = label === "Drawer";
              const isBranches = label === "Branches";
              const isInventory = label === "Inventory";
              const isSupply = label === "Supply";
              const isActive = isDashboard
                ? pathname === ROUTES.DASHBOARD
                : isMenu
                  ? pathname === ROUTES.DASHBOARD_MENU
                  : isDrawer
                    ? pathname === ROUTES.DASHBOARD_DRAWER
                    : isBranches
                      ? pathname === ROUTES.DASHBOARD_BRANCHES ||
                        pathname.startsWith(`${ROUTES.DASHBOARD_BRANCHES}/`)
                      : isInventory
                        ? pathname === ROUTES.DASHBOARD_INVENTORY ||
                          pathname.startsWith(`${ROUTES.DASHBOARD_INVENTORY}/`)
                        : isSupply
                          ? pathname === ROUTES.DASHBOARD_SUPPLY ||
                            pathname.startsWith(`${ROUTES.DASHBOARD_SUPPLY}/`)
                          : pathname === href || pathname.startsWith(`${href}/`);
              return (
                <NavLink
                  key={label}
                  href={href}
                  label={label}
                  icon={Icon}
                  isActive={isActive}
                  onNavigate={close}
                />
              );
            })}
          <CalculatorTab onToggle={close} />
          {navLinks
            .filter((l) => l.label === "Report" || l.label === "Activity")
            .map(({ href, label, icon: Icon }) => {
              const isActivity = label === "Activity";
              const isReports = label === "Report";
              const isActive = isActivity
                ? pathname === ROUTES.DASHBOARD_ACTIVITY ||
                  pathname.startsWith(`${ROUTES.DASHBOARD_ACTIVITY}/`)
                : pathname === ROUTES.DASHBOARD_REPORTS ||
                  pathname.startsWith(`${ROUTES.DASHBOARD_REPORTS}/`);
              return (
                <NavLink
                  key={label}
                  href={href}
                  label={label}
                  icon={Icon}
                  isActive={isActive}
                  onNavigate={close}
                />
              );
            })}
        </nav>

        <div className="shrink-0 flex flex-col items-center gap-4 pb-4 pt-2 border-t border-[#E2E8F0] min-[1920px]:gap-5 min-[1920px]:pb-5 min-[2560px]:gap-6 min-[2560px]:pb-5">
          <div className="flex flex-col items-center gap-1 min-[1920px]:gap-1.5 min-[2560px]:gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/profile.jpg"
              alt="Profile"
              width={40}
              height={40}
              className="h-10 w-10 rounded-xl border-2 border-[#E2E8F0] object-cover shadow-[0px_1px_2px_-1px_rgba(0,0,0,0.1),0px_1px_3px_0px_rgba(0,0,0,0.1)] min-[1920px]:h-11 min-[1920px]:w-11 min-[2560px]:h-12 min-[2560px]:w-12"
            />
            <span className="text-[9px] font-medium uppercase tracking-wider text-[#90A1B9] min-[1920px]:text-[10px] min-[2560px]:text-[11px]">
              {getFirstName(user?.name) || "User"}
            </span>
          </div>
          <button
            type="button"
            onClick={handleLogoutClick}
            className="flex flex-col items-center gap-1 text-[#90A1B9] transition-colors hover:text-zinc-700 min-[1920px]:gap-1.5 min-[2560px]:gap-2"
          >
            <LogOut className="h-4 w-4 min-[1920px]:h-5 min-[1920px]:w-5 min-[2560px]:h-[22px] min-[2560px]:w-[22px]" />
            <span className="text-[9px] font-medium uppercase tracking-wider min-[1920px]:text-[10px] min-[2560px]:text-[11px]">
              Logout
            </span>
          </button>
        </div>
      </aside>

      <CloseDrawerBeforeLogoutModal
        isOpen={isCloseDrawerModalOpen}
        onClose={() => setIsCloseDrawerModalOpen(false)}
        onCloseAndLogout={handleCloseSessionAndLogout}
      />
    </>
  );
}
