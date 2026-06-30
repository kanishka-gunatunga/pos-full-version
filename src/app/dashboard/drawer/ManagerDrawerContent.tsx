"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import * as sessionService from "@/services/sessionService";
import type { AllHistorySession } from "@/services/sessionService";
import {
  Wallet,
  ArrowUpCircle,
  Clock,
  Lock,
  Pencil,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
} from "lucide-react";
import DashboardPageHeader from "@/components/dashboard/DashboardPageHeader";
import EditInitialAmountModal from "@/components/drawer/EditInitialAmountModal";
import ProcessCashOutModal from "@/components/drawer/ProcessCashOutModal";
import CloseDrawerSessionModal from "@/components/drawer/CloseDrawerSessionModal";
import CloseTheDrawerModal from "@/components/drawer/CloseTheDrawerModal";
import StartDrawerModal from "@/components/drawer/StartDrawerModal";
import CreateDrawerSessionModal from "@/components/drawer/CreateDrawerSessionModal";
import CashSalesIcon from "@/components/icons/CashSalesIcon";
import DrawerCashIcon from "@/components/icons/DrawerCashIcon";
import { useDrawerSession } from "@/contexts/DrawerSessionContext";
import { useAuth } from "@/contexts/AuthContext";

function formatRs(n: number) {
  return `Rs.${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

interface CashierSession {
  id: string;
  cashierName: string;
  sessionTime: string;
  drawerBalance: number;
  cashSales: number;
  cashSalesOrders: number;
  cashOuts: number;
  cashOutsTimes: number;
  outstanding: number;
  expectedBalance: number;
  actualBalance: number | null;
  isActive: boolean;
}

interface SessionHistoryRow {
  id: number;
  cashierId?: number;
  closedAtRaw: string | null;
  cashier: string;
  date: string;
  startTime: string;
  endTime: string;
  initial: number;
  cashSales: number;
  cashSalesOrders: number;
  cashOuts: number;
  cashOutsTimes: number;
  expected: number;
  actual: number;
  difference: number | null;
  closedBy: string;
}

interface CashOutEntry {
  dateTime: string;
  by: string;
  amount: number;
}

export default function ManagerDrawerContent() {
  const { user } = useAuth();
  const drawerSession = useDrawerSession();
  if (!drawerSession)
    throw new Error("ManagerDrawerContent must be used within DrawerSessionProvider");
  const {
    hasDrawerStarted,
    hasActiveSession,
    sessionData,
    setHasDrawerStarted,
    setHasActiveSession,
    setSessionData,
    refreshSession,
  } = drawerSession;
  const [isStartModalOpen, setIsStartModalOpen] = useState(false);
  const [isCreateSessionModalOpen, setIsCreateSessionModalOpen] = useState(false);
  const [isEditAmountModalOpen, setIsEditAmountModalOpen] = useState(false);
  const [isCashOutModalOpen, setIsCashOutModalOpen] = useState(false);
  const [isCloseSessionModalOpen, setIsCloseSessionModalOpen] = useState(false);
  const [isCloseDrawerModalOpen, setIsCloseDrawerModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [cashierFilter, setCashierFilter] = useState("all");
  const [discrepancyFilter, setDiscrepancyFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [historyRows, setHistoryRows] = useState<SessionHistoryRow[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [activeSessionDetail, setActiveSessionDetail] = useState<sessionService.ActiveSessionDetail | null>(null);
  const [activeCashOutLedger, setActiveCashOutLedger] = useState<sessionService.CashOutLedgerRow[]>([]);

  /** Map GET /api/sessions/all-history item to table row. Uses backend's camelCase shape. */
  const mapAllHistoryToRow = useCallback((item: AllHistorySession): SessionHistoryRow => {
    const rawEnd = item.endTime ?? item.date;
    const endDate = rawEnd ? new Date(rawEnd) : null;
    const startDate = item.startTime ? new Date(item.startTime) : null;
    const date = endDate
      ? endDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      : "";
    const startTime = startDate
      ? startDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })
      : "";
    const endTime = endDate
      ? endDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })
      : "";
    const cashSales = item.cashSales?.amount ?? 0;
    const cashSalesOrders = item.cashSales?.count ?? 0;
    const cashOuts = item.cashOuts?.amount ?? 0;
    const cashOutsTimes = item.cashOuts?.count ?? 0;
    const diff =
      item.expected === 0 && item.actual === 0 ? null : Number((item.actual - item.expected).toFixed(2));
    return {
      id: item.id,
      cashierId: item.cashierId,
      closedAtRaw: rawEnd,
      cashier: item.cashierName,
      date,
      startTime,
      endTime,
      initial: item.initial,
      cashSales,
      cashSalesOrders,
      cashOuts,
      cashOutsTimes,
      expected: item.expected,
      actual: item.actual,
      difference: diff,
      closedBy: item.closedBy,
    };
  }, []);

  const fetchSessionHistory = useCallback(async () => {
    setIsHistoryLoading(true);
    setHistoryError(null);
    try {
      const items = await sessionService.getAllSessionHistory({
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
      });
      setHistoryRows(items.map(mapAllHistoryToRow));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load session history.";
      setHistoryError(message);
      setHistoryRows([]);
    } finally {
      setIsHistoryLoading(false);
    }
  }, [fromDate, toDate, mapAllHistoryToRow]);

  useEffect(() => {
    fetchSessionHistory();
  }, [fetchSessionHistory]);

  const uniqueCashiers = useMemo(
    () => [...new Set(historyRows.map((r) => r.cashier).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [historyRows]
  );

  const fetchActiveSessionDetail = useCallback(async () => {
    try {
      const session = await sessionService.getCurrentSession();
      if (!session) {
        setActiveSessionDetail(null);
        setActiveCashOutLedger([]);
        return;
      }
      setActiveSessionDetail(sessionService.parseActiveSessionDetail(session));
      setActiveCashOutLedger(
        sessionService.extractCashOutLedgerFromSession(session, user?.name ?? "Current user")
      );
    } catch {
      setActiveSessionDetail(null);
      setActiveCashOutLedger([]);
    }
  }, [user?.name]);

  useEffect(() => {
    if (!hasActiveSession) {
      setActiveSessionDetail(null);
      setActiveCashOutLedger([]);
      return;
    }
    void fetchActiveSessionDetail();
    const sync = async () => {
      try {
        await refreshSession();
      } catch {
        /* ignore */
      }
      await fetchActiveSessionDetail();
    };
    const onFocus = () => {
      void sync();
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") void sync();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [hasActiveSession, fetchActiveSessionDetail, refreshSession]);

  const filteredRows = historyRows.filter((row) => {
    const matchesSearch =
      !searchQuery.trim() ||
      row.cashier.toLowerCase().includes(searchQuery.trim().toLowerCase());

    const matchesCashier =
      cashierFilter === "all" ||
      row.cashier.toLowerCase() === cashierFilter.toLowerCase();

    const matchesDiscrepancy =
      discrepancyFilter === "all"
        ? true
        : discrepancyFilter === "balanced"
          ? row.difference === null || Math.abs(row.difference) < 0.01
          : discrepancyFilter === "overage"
            ? (row.difference ?? 0) > 0.01
            : (row.difference ?? 0) < -0.01;

    const rowDate = row.closedAtRaw ? new Date(row.closedAtRaw) : null;
    const matchesFrom =
      !fromDate || !rowDate || rowDate >= new Date(fromDate + "T00:00:00");
    const matchesTo =
      !toDate || !rowDate || rowDate <= new Date(toDate + "T23:59:59");

    return (
      matchesSearch && matchesCashier && matchesDiscrepancy && matchesFrom && matchesTo
    );
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todaysSessions: CashierSession[] = filteredRows
    .filter((row) => {
      if (!row.closedAtRaw) return false;
      const d = new Date(row.closedAtRaw);
      d.setHours(0, 0, 0, 0);
      return d.getTime() === today.getTime();
    })
    .map((row, index) => ({
      id: String(index),
      cashierName: row.cashier,
      sessionTime:
        row.startTime && row.endTime ? `${row.startTime} - ${row.endTime}` : "",
      drawerBalance: row.initial,
      cashSales: row.cashSales,
      cashSalesOrders: row.cashSalesOrders,
      cashOuts: row.cashOuts,
      cashOutsTimes: row.cashOutsTimes,
      outstanding: row.difference ?? 0,
      expectedBalance: row.expected,
      actualBalance: row.actual,
      isActive: false,
    }));

  // Active session (current user): show as first card with "Present", ACTIVE badge, "Session hasn't ended".
  // Drawer Balance = opening/initial amount; cash sales/outs and expected balance from live API when available.
  const activeSessionCard: CashierSession | null =
    hasActiveSession && sessionData
      ? {
          id: "active",
          cashierName: user?.name ?? "Current user",
          sessionTime: `${activeSessionDetail?.startedAt ?? sessionData.startedAt} - Present`,
          drawerBalance: activeSessionDetail?.initialAmount ?? sessionData.initialAmount,
          cashSales: activeSessionDetail?.cashSalesAmount ?? 0,
          cashSalesOrders: activeSessionDetail?.cashSalesCount ?? 0,
          cashOuts: activeSessionDetail?.cashOutsAmount ?? 0,
          cashOutsTimes: activeSessionDetail?.cashOutsCount ?? 0,
          outstanding: 0,
          expectedBalance:
            activeSessionDetail != null
              ? activeSessionDetail.currentBalance
              : sessionData.initialAmount,
          actualBalance: null,
          isActive: true,
        }
      : null;

  // When showing active session card, don't duplicate it from history (backend may sometimes return open session in history).
  const closedTodaySessions =
    activeSessionCard && user?.name
      ? todaysSessions.filter(
          (s) => !(s.cashierName === user.name && s.sessionTime.startsWith(sessionData?.startedAt ?? "")
          )
        )
      : todaysSessions;
  const sessionsToDisplay: CashierSession[] = activeSessionCard
    ? [activeSessionCard, ...closedTodaySessions]
    : todaysSessions;

  const totalExpectedBalance = sessionsToDisplay.reduce((sum, s) => {
    if (s.isActive) {
      return sum + (Number.isFinite(s.expectedBalance) ? s.expectedBalance : 0);
    }
    return sum + (s.actualBalance ?? 0);
  }, 0);
  const totalCashSales = sessionsToDisplay.reduce(
    (sum, s) => sum + (Number.isFinite(s.cashSales) ? s.cashSales : 0),
    0
  );
  const totalCashOuts = sessionsToDisplay.reduce(
    (sum, s) => sum + (Number.isFinite(s.cashOuts) ? s.cashOuts : 0),
    0
  );

  const cashOutHistory = useMemo((): CashOutEntry[] => {
    return activeCashOutLedger.map((e) => ({
      dateTime: e.dateTime,
      by: e.by,
      amount: e.amount,
    }));
  }, [activeCashOutLedger]);

  const [previousSessions, setPreviousSessions] = useState<{
    closedAt: string;
    closedBy: string;
    closingAmount: number;
  }[]>([]);
  useEffect(() => {
    sessionService
      .getSessionHistory()
      .then((list) => {
        if (!list || list.length === 0) {
          setPreviousSessions([]);
          return;
        }
        // Sort by closed time descending and keep only the most recent closed session
        const sorted = [...list].sort((a, b) => {
          const aTimeRaw = (a.closedAt ?? a.endTime) ?? "";
          const bTimeRaw = (b.closedAt ?? b.endTime) ?? "";
          const aTime = aTimeRaw ? new Date(aTimeRaw).getTime() : 0;
          const bTime = bTimeRaw ? new Date(bTimeRaw).getTime() : 0;
          return bTime - aTime;
        });
        const latest = sorted[0] ? [sessionService.mapHistoryItemToSummary(sorted[0])] : [];
        setPreviousSessions(latest);
      })
      .catch(() => {});
  }, []);

  const expectedBalance =
    activeSessionDetail?.currentBalance ?? sessionData?.initialAmount ?? 0;
  const cashSales = activeSessionDetail?.cashSalesAmount ?? 0;
  const cashOuts = activeSessionDetail?.cashOutsAmount ?? 0;
  const activeSessionsCount = sessionsToDisplay.length;

  const handleStartDrawer = async (openingAmount: number, managerPasscode: string) => {
    await sessionService.startSession({ startBalance: openingAmount, passcode: managerPasscode });
    const now = new Date();
    const startedAt = now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    setSessionData({ initialAmount: openingAmount, startedAt });
    setHasDrawerStarted(true);
    setHasActiveSession(true);
  };

  const handleCreateSession = async (openingAmount: number) => {
    await sessionService.startSession({ startBalance: openingAmount });
    const now = new Date();
    const startedAt = now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    setSessionData({ initialAmount: openingAmount, startedAt });
    setHasActiveSession(true);
  };

  const handleEditInitialAmount = async (newAmount: number, reason: string, passcode: string) => {
    if (!sessionData) return;
    await sessionService.adjustInitialAmount({
      currentAmount: sessionData.initialAmount,
      newAmount,
      reason,
      passcode,
    });
    setSessionData({ ...sessionData, initialAmount: newAmount });
  };

  const handleCashOut = async (amount: number, reason: string, passcode: string) => {
    const fallback = user?.name ?? "Current user";
    const result = await sessionService.cashAction({ type: "remove", amount, description: reason, passcode });
    if (result.session) {
      setActiveSessionDetail(sessionService.parseActiveSessionDetail(result.session));
      setActiveCashOutLedger(
        sessionService.extractCashOutLedgerFromSession(result.session, fallback)
      );
    } else {
      fetchActiveSessionDetail().catch(() => {});
    }
    fetchSessionHistory().catch(() => {});
  };

  const handleCloseSession = async (actualBalance: number, passcode: string) => {
    await sessionService.closeSession({ passcode, actualBalance });
    setHasActiveSession(false);
    setSessionData(null);
    fetchSessionHistory().catch(() => {});
  };

  const handleCloseTheDrawer = async (amount: number, passcode: string) => {
    await sessionService.closeSession({ passcode, actualBalance: amount });
    setHasDrawerStarted(false);
    setHasActiveSession(false);
    setSessionData(null);
    fetchSessionHistory().catch(() => {});
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#F8FAFC]">
      <DashboardPageHeader />
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <h1 className="mb-6 font-['Inter'] text-[clamp(1.5rem,4vw,1.875rem)] font-bold leading-[1.2] text-[#1D293D] sm:mb-8">
          Drawer Management
        </h1>

        {/* Summary Cards */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div
            className="rounded-2xl border border-[#00D492] p-5 font-['Inter'] shadow-[0px_4px_6px_-4px_#0000001A,0px_10px_15px_-3px_#0000001A]"
            style={{ background: "linear-gradient(135deg, #00BC7D 0%, #009966 100%)" }}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 sm:h-14 sm:w-14">
              <Wallet className="h-6 w-6 text-white sm:h-7 sm:w-7" />
            </div>
            <div className="scrollbar-subtle mt-3 min-w-0 overflow-x-auto">
              <p className="whitespace-nowrap font-['Inter'] text-[clamp(1.5rem,3vw,1.875rem)] font-bold leading-9 text-white">
                {formatRs(totalExpectedBalance)}
              </p>
            </div>
            <p className="mt-1 font-['Inter'] text-sm font-medium leading-5 text-[#D0FAE5]">
              Total Expected Balance
            </p>
          </div>
          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-[0px_1px_2px_-1px_#0000001A,0px_1px_3px_0px_#0000001A]">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F3E8FF] sm:h-14 sm:w-14">
              <CashSalesIcon className="h-6 w-6 sm:h-7 sm:w-7" />
            </div>
            <div className="scrollbar-subtle mt-3 min-w-0 overflow-x-auto">
              <p className="whitespace-nowrap font-['Inter'] text-[clamp(1.5rem,3vw,1.875rem)] font-bold leading-9 text-[#1D293D]">
                {formatRs(totalCashSales)}
              </p>
            </div>
            <p className="mt-1 font-['Inter'] text-sm font-medium leading-5 text-[#62748E]">
              Total Cash Sales
            </p>
          </div>
          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-[0px_1px_2px_-1px_#0000001A,0px_1px_3px_0px_#0000001A]">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFEDD4] sm:h-14 sm:w-14">
              <ArrowUpCircle className="h-6 w-6 text-[#EA580C] sm:h-7 sm:w-7" />
            </div>
            <div className="scrollbar-subtle mt-3 min-w-0 overflow-x-auto">
              <p className="whitespace-nowrap font-['Inter'] text-[clamp(1.5rem,3vw,1.875rem)] font-bold leading-9 text-[#1D293D]">
                {formatRs(totalCashOuts)}
              </p>
            </div>
            <p className="mt-1 font-['Inter'] text-sm font-medium leading-5 text-[#62748E]">
              Total Cash Outs
            </p>
          </div>
        </div>

        {/* Today's Cashier Sessions */}
        <div className="mb-10 flex flex-col gap-6 rounded-[24px] border border-[#E2E8F0] bg-white p-[25px] shadow-[0px_1px_2px_-1px_#0000001A,0px_1px_3px_0px_#0000001A]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-[#DBEAFE]">
                <Users className="h-6 w-6 text-[#155DFC]" />
              </div>
              <div className="flex flex-col">
                <h2 className="font-['Inter'] text-2xl font-bold leading-8 text-[#1D293D]">
                  Today&apos;s Cashier Sessions
                </h2>
                <p className="font-['Inter'] text-sm font-normal leading-5 text-[#62748E]">
                  View and manage all active drawer sessions
                </p>
              </div>
            </div>
            <span className="rounded-[14px] bg-[#DBEAFE] px-3.5 py-2 font-['Inter'] text-sm font-bold text-[#155DFC]">
              {activeSessionsCount}
            </span>
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {sessionsToDisplay.map((session) => (
              <div
                key={session.id}
                className="flex flex-col gap-4 rounded-2xl border-2 border-[#E2E8F0] bg-[#F8FAFC] p-[22px] shadow-[0px_1px_2px_-1px_#0000001A,0px_1px_3px_0px_#0000001A]"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-['Inter'] text-lg font-bold leading-7 text-[#1D293D]">
                      {session.cashierName}
                    </h3>
                    <p className="mt-0.5 font-['Inter'] text-xs font-normal leading-4 text-[#62748E]">
                      {session.sessionTime}
                    </p>
                  </div>
                  {session.isActive && (
                    <span className="flex items-center gap-1.5 rounded-full px-2.5 py-1 font-['Inter'] text-xs font-bold leading-4 text-[#009966]">
                      <span className="h-2 w-2 rounded-full bg-[#00BC7D] opacity-65" />
                      ACTIVE
                    </span>
                  )}
                </div>
                <div className="flex h-[54px] items-center justify-between gap-2 rounded-[14px] border border-[#E2E8F0] bg-white px-3">
                  <span className="shrink-0 font-['Inter'] text-xs font-normal leading-4 text-[#62748E]">
                    Drawer Balance
                  </span>
                  <div className="scrollbar-subtle min-w-0 flex-1 overflow-x-auto text-right">
                    <span className="whitespace-nowrap font-['Inter'] text-lg font-bold leading-7 text-[#1D293D]">
                      {formatRs(session.drawerBalance)}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <div className="flex min-w-0 flex-col gap-0.5 rounded-[14px] border border-[#E9D4FF] bg-[#FAF5FF] px-3 py-2">
                    <span className="min-w-0 break-words font-['Inter'] text-xs font-normal leading-4 text-[#9810FA]">
                      Cash Sales
                    </span>
                    <div className="scrollbar-subtle overflow-x-auto">
                      <span className="whitespace-nowrap font-['Inter'] text-base font-bold leading-6 text-[#59168B]">
                        {formatRs(session.cashSales)}
                      </span>
                    </div>
                    <span className="min-w-0 break-words font-['Inter'] text-xs font-normal leading-4 text-[#AD46FF]">
                      {session.cashSalesOrders} orders
                    </span>
                  </div>
                  <div className="flex min-w-0 flex-col gap-0.5 rounded-[14px]  border border-[#FFD6A8] bg-[#FFF7ED] px-3 py-2">
                    <span className="min-w-0 break-words font-['Inter'] text-xs font-normal leading-4 text-[#F54900]">
                      Cash Outs
                    </span>
                    <div className="scrollbar-subtle overflow-x-auto ">
                      <span className="whitespace-nowrap font-['Inter'] text-base font-bold leading-6 text-[#7E2A0C]">
                        {formatRs(session.cashOuts)}
                      </span>
                    </div>
                    <span className="min-w-0 break-words font-['Inter'] text-xs font-normal leading-4 text-[#FF6900]">
                      {session.cashOutsTimes} times
                    </span>
                  </div>
                  <div className="flex min-w-0 flex-col gap-0.5 rounded-[14px] border border-[#FFA8A8] bg-[#FFEDED] px-3 py-2">
                    <span className="min-w-0 break-words font-['Inter'] text-xs font-normal leading-4 text-[#F50000]">
                      Outstanding
                    </span>
                    <div className="scrollbar-subtle overflow-x-auto">
                      <span className="whitespace-nowrap font-['Inter'] text-base font-bold leading-6 text-[#FF1212]">
                        {formatRs(session.outstanding)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex h-[50px] items-center justify-between gap-2 rounded-[14px] border border-[#BEDBFF] bg-[#EFF6FF] p-[13px]">
                    <span className="shrink-0 font-['Inter'] text-xs font-normal leading-5 text-[#155DFC]">
                      Expected Balance
                    </span>
                    <div className="scrollbar-subtle min-w-0 overflow-x-auto text-right">
                      <span className="whitespace-nowrap font-['Inter'] text-base font-bold leading-6 text-[#1C398E]">
                        {formatRs(session.expectedBalance)}
                      </span>
                    </div>
                  </div>
                  <div
                    className={`flex h-[50px] items-center justify-between gap-2 rounded-[14px] border p-[13px] ${
                      session.isActive
                        ? "border-[#A9A9A9] bg-[#F0F0F0]"
                        : session.actualBalance === session.expectedBalance
                          ? "border-[#9ADE9E] bg-[#F0FFEF]"
                          : "border-[#FFC6BE] bg-[#FFF0EF]"
                    }`}
                  >
                    <span
                      className={`shrink-0 font-['Inter'] text-xs font-normal leading-4 ${
                        session.isActive
                          ? "text-[#848484]"
                          : session.actualBalance === session.expectedBalance
                            ? "text-[#299D36]"
                            : "text-[#9D2929]"
                      }`}
                    >
                      Actual Balance
                    </span>
                    <div className="scrollbar-subtle min-w-0 overflow-x-auto text-right">
                      <span
                        className={`whitespace-nowrap font-['Inter'] text-base font-bold leading-6 ${
                          session.isActive
                            ? "text-[#7E7E7E]"
                            : session.actualBalance === session.expectedBalance
                              ? "text-[#1C8E24]"
                              : "text-[#8E1C1E]"
                        }`}
                      >
                        {session.isActive
                          ? "Session hasn't ended"
                          : formatRs(session.actualBalance ?? 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Session History */}
        <div className="mb-10 flex flex-col gap-6 rounded-[24px] border border-[#E2E8F0] bg-white p-[25px] shadow-[0px_1px_2px_-1px_#0000001A,0px_1px_3px_0px_#0000001A]">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-[#F1F5F9]">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-[#45556C]"
                >
                  <path
                    d="M8 2V6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M16 2V6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M19 4H5C3.89543 4 3 4.89543 3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6C21 4.89543 20.1046 4 19 4Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M3 10H21"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div className="flex flex-col min-w-0">
                <h2 className="font-['Inter'] text-2xl font-bold leading-8 text-[#1D293D]">
                  Session History
                </h2>
                <p className="font-['Inter'] text-sm font-normal leading-5 text-[#62748E]">
                  View all closed drawer sessions
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {historyRows.length >= sessionService.ALL_HISTORY_CAP && (
                <span className="hidden font-['Inter'] text-xs text-[#62748E] sm:inline">
                  Latest {sessionService.ALL_HISTORY_CAP} sessions
                </span>
              )}
              <button
                type="button"
                onClick={fetchSessionHistory}
                disabled={isHistoryLoading}
                title="Refresh session history"
                className="flex h-10 w-10 items-center justify-center rounded-[12px] border border-[#E2E8F0] bg-white text-[#45556C] transition-colors hover:bg-[#F1F5F9] hover:text-[#1D293D] disabled:opacity-50"
              >
                <RefreshCw
                  className={`h-5 w-5 ${isHistoryLoading ? "animate-spin" : ""}`}
                  aria-hidden
                />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 rounded-[16px] border border-[#E2E8F0] bg-[#F8FAFC] px-[25px] pt-[25px] pb-[15px] sm:grid-cols-2 lg:grid-cols-5">
            <div className="flex min-w-0 flex-col gap-1.5">
              <label className="font-['Inter'] text-xs font-bold uppercase leading-4 text-[#45556C]">
                Search
              </label>
              <input
                type="text"
                placeholder="Cashier name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-[44px] w-full min-w-0 rounded-[14px] border-2 border-[#E2E8F0] bg-white px-4 py-[10px] font-['Inter'] text-sm text-[#1D293D] placeholder:text-[#90A1B9] outline-none focus:border-[#EA580C]"
              />
            </div>
            <div className="flex min-w-0 flex-col gap-1.5">
              <label className="font-['Inter'] text-xs font-bold uppercase leading-4 text-[#45556C]">
                Cashier
              </label>
              <select
                value={cashierFilter}
                onChange={(e) => setCashierFilter(e.target.value)}
                className="h-[44px] w-full min-w-0 appearance-none rounded-[14px] border-2 border-[#E2E8F0] bg-white bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2390A1B9%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:20px_20px] bg-[right_12px_center] bg-no-repeat pl-4 pr-12 font-['Inter'] text-sm text-[#1D293D] outline-none focus:border-[#EA580C]"
              >
                <option value="all">All Cashiers</option>
                {uniqueCashiers.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex min-w-0 flex-col gap-1.5">
              <label className="font-['Inter'] text-xs font-bold uppercase leading-4 text-[#45556C]">
                Discrepancy
              </label>
              <select
                value={discrepancyFilter}
                onChange={(e) => setDiscrepancyFilter(e.target.value)}
                className="h-[44px] w-full min-w-0 appearance-none rounded-[14px] border-2 border-[#E2E8F0] bg-white bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2390A1B9%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:20px_20px] bg-[right_12px_center] bg-no-repeat pl-4 pr-12 font-['Inter'] text-sm text-[#1D293D] outline-none focus:border-[#EA580C]"
              >
                <option value="all">All Types</option>
                <option value="balanced">Balanced</option>
                <option value="overage">Overage</option>
                <option value="shortage">Shortage</option>
              </select>
              <span className="font-['Inter'] text-[10.44px] font-normal leading-[100%] text-[#0A0A0A]">
                Balanced/Overage/Shortage
              </span>
            </div>
            <div className="flex min-w-0 flex-col gap-1.5">
              <label className="font-['Inter'] text-xs font-bold uppercase leading-4 text-[#45556C]">
                From Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="h-[44px] w-full min-w-0 rounded-[14px] border-2 border-[#E2E8F0] bg-white px-4 py-[10px] pr-10 font-['Inter'] text-sm text-[#1D293D] outline-none focus:border-[#EA580C] [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-3 [&::-webkit-calendar-picker-indicator]:h-4 [&::-webkit-calendar-picker-indicator]:w-4 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0"
                />
                <Calendar className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#90A1B9]" />
              </div>
            </div>
            <div className="flex min-w-0 flex-col gap-1.5">
              <label className="font-['Inter'] text-xs font-bold uppercase leading-4 text-[#45556C]">
                To Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="h-[44px] w-full min-w-0 rounded-[14px] border-2 border-[#E2E8F0] bg-white px-4 py-[10px] pr-10 font-['Inter'] text-sm text-[#1D293D] outline-none focus:border-[#EA580C] [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-3 [&::-webkit-calendar-picker-indicator]:h-4 [&::-webkit-calendar-picker-indicator]:w-4 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0"
                />
                <Calendar className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#90A1B9]" />
              </div>
            </div>
          </div>
          {historyError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-['Inter'] text-sm text-red-700 flex items-center justify-between gap-3">
              <span>{historyError}</span>
              <button
                type="button"
                onClick={fetchSessionHistory}
                className="shrink-0 rounded-lg bg-red-100 px-3 py-1.5 font-['Inter'] text-sm font-bold text-red-800 hover:bg-red-200"
              >
                Retry
              </button>
            </div>
          )}
          {isHistoryLoading && historyRows.length === 0 ? (
            <div className="flex min-h-[200px] items-center justify-center rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] font-['Inter'] text-sm text-[#62748E]">
              Loading session history…
            </div>
          ) : (
          <div className="scrollbar-subtle max-h-[500px] overflow-y-auto overflow-x-hidden">
            <table className="w-full table-fixed font-['Inter']">
              <thead className="sticky top-0 z-10 border-b-2 border-[#E2E8F0] bg-[#F8FAFC] shadow-[0_1px_0_0_#E2E8F0]">
                <tr className="h-12 bg-[#F8FAFC]">
                  <th className="w-[10%] px-3 py-2.5 text-left font-['Inter'] text-sm font-bold leading-5 text-[#45556C]">
                    Cashier
                  </th>
                  <th className="w-[8%] px-3 py-2.5 text-left font-['Inter'] text-sm font-bold leading-5 text-[#45556C]">
                    Date
                  </th>
                  <th className="w-[7%] px-3 py-2.5 text-left font-['Inter'] text-sm font-bold leading-5 text-[#45556C]">
                    Start Time
                  </th>
                  <th className="w-[7%] px-3 py-2.5 text-left font-['Inter'] text-sm font-bold leading-5 text-[#45556C]">
                    End Time
                  </th>
                  <th className="w-[8%] px-3 py-2.5 text-left font-['Inter'] text-sm font-bold leading-5 text-[#45556C]">
                    Initial
                  </th>
                  <th className="w-[10%] px-3 py-2.5 text-left font-['Inter'] text-sm font-bold leading-5 text-[#45556C]">
                    Cash Sales
                  </th>
                  <th className="w-[8%] px-3 py-2.5 text-left font-['Inter'] text-sm font-bold leading-5 text-[#45556C]">
                    Cash Outs
                  </th>
                  <th className="w-[8%] px-3 py-2.5 text-left font-['Inter'] text-sm font-bold leading-5 text-[#45556C]">
                    Expected
                  </th>
                  <th className="w-[8%] px-3 py-2.5 text-left font-['Inter'] text-sm font-bold leading-5 text-[#45556C]">
                    Actual
                  </th>
                  <th className="w-[10%] px-3 py-2.5 text-left font-['Inter'] text-sm font-bold leading-5 text-[#45556C]">
                    Difference
                  </th>
                  <th className="w-[14%] px-3 py-2.5 text-left font-['Inter'] text-sm font-bold leading-5 text-[#45556C]">
                    Closed By
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row: SessionHistoryRow) => (
                  <tr key={row.id} className="border-b border-[#F1F5F9] bg-white">
                    <td className="min-w-0 overflow-hidden px-3 py-2.5 font-['Inter'] text-sm font-bold leading-5 text-[#1D293D]">
                      <span className="block truncate" title={row.cashier}>
                        {row.cashier}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 font-['Inter'] text-sm font-normal leading-5 text-[#45556C]">
                      {row.date}
                    </td>
                    <td className="px-3 py-2.5 font-['Inter'] text-sm font-normal leading-5 text-[#45556C]">
                      {row.startTime}
                    </td>
                    <td className="px-3 py-2.5 font-['Inter'] text-sm font-normal leading-5 text-[#45556C]">
                      {row.endTime}
                    </td>
                    <td className="min-w-0 px-3 py-2.5 text-right">
                      <div className="scrollbar-subtle ml-auto max-w-full overflow-x-auto">
                        <span className="whitespace-nowrap font-['Inter'] text-sm font-bold leading-5 text-[#314158]">
                          {formatRs(row.initial)}
                        </span>
                      </div>
                    </td>
                    <td className="min-w-0 px-3 py-2.5 text-right">
                      <div className="scrollbar-subtle ml-auto max-w-full overflow-x-auto">
                        <span className="whitespace-nowrap font-['Inter'] text-sm font-bold leading-5 text-[#8200DB]">
                          {formatRs(row.cashSales)}
                        </span>
                      </div>
                      <p className="mt-0.5 font-['Inter'] text-xs font-normal leading-4 text-[#AD46FF]">
                        {row.cashSalesOrders} orders
                      </p>
                    </td>
                    <td className="min-w-0 px-3 py-2.5 text-right">
                      <div className="scrollbar-subtle ml-auto max-w-full overflow-x-auto">
                        <span className="whitespace-nowrap font-['Inter'] text-sm font-bold leading-5 text-[#EA580C]">
                          {formatRs(row.cashOuts)}
                        </span>
                      </div>
                      <p className="mt-0.5 font-['Inter'] text-xs font-normal leading-4 text-[#62748E]">
                        {row.cashOutsTimes} times
                      </p>
                    </td>
                    <td className="min-w-0 px-3 py-2.5 text-right">
                      <div className="scrollbar-subtle ml-auto max-w-full overflow-x-auto">
                        <span className="whitespace-nowrap font-['Inter'] text-sm font-bold leading-5 text-[#1447E6]">
                          {formatRs(row.expected)}
                        </span>
                      </div>
                    </td>
                    <td className="min-w-0 px-3 py-2.5 text-right">
                      <div className="scrollbar-subtle ml-auto max-w-full overflow-x-auto">
                        <span className="whitespace-nowrap font-['Inter'] text-sm font-bold leading-5 text-[#007A55]">
                          {formatRs(row.actual)}
                        </span>
                      </div>
                    </td>
                    <td className="min-w-0 px-3 py-2.5">
                      {row.difference === null ||
                      (typeof row.difference === "number" && Math.abs(row.difference) < 0.01) ? (
                        <span className="inline-flex h-[30px] items-center gap-1.5 rounded-[10px] border border-[#A4F4CF] bg-[#D0FAE5] px-2.5 py-1">
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 14 14"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className="shrink-0 text-[#007A55]"
                            aria-hidden
                          >
                            <path
                              d="M11.6668 3.5L5.25016 9.91667L2.3335 7"
                              stroke="currentColor"
                              strokeWidth="1.75"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          <span className="font-['Inter'] text-sm font-bold leading-5 text-[#007A55]">
                            Balanced
                          </span>
                        </span>
                      ) : row.difference > 0 ? (
                        <div className="badge-amount-scroll scrollbar-subtle max-w-full overflow-x-auto">
                          <span className="inline-flex min-w-0 items-center gap-1.5 rounded-[10px] border border-[#BEDBFF] bg-[#DBEAFE] px-2 py-1">
                            <TrendingUp className="h-3 w-3 shrink-0 text-[#1447E6]" />
                            <span className="whitespace-nowrap font-['Inter'] text-sm font-bold leading-5 text-[#1447E6]">
                              Rs.+{row.difference.toFixed(2)}
                            </span>
                          </span>
                        </div>
                      ) : (
                        <div className="badge-amount-scroll scrollbar-subtle max-w-full overflow-x-auto">
                          <span className="inline-flex min-w-0 items-center gap-1.5 rounded-[10px] border border-[#FFC9C9] bg-[#FFE2E2] px-2 py-1">
                            <TrendingDown className="h-3 w-3 shrink-0 text-[#C10007]" />
                            <span className="whitespace-nowrap font-['Inter'] text-sm font-bold leading-5 text-[#C10007]">
                              Rs.{row.difference.toFixed(2)}
                            </span>
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="min-w-0 overflow-hidden px-3 py-2.5 font-['Inter'] text-sm font-normal leading-5 text-[#45556C]">
                      <span className="block truncate" title={row.closedBy}>
                        {row.closedBy}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </div>

        {/* Manager's own session - active session or no-session guidance */}
        {hasActiveSession ? (
          <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="flex flex-col gap-6 rounded-[24px] border border-[#E2E8F0] bg-white p-[25px] shadow-[0px_1px_2px_-1px_#0000001A,0px_1px_3px_0px_#0000001A]">
              <div className="flex items-center gap-2 font-['Inter']">
                <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#DBEAFE]">
                  <Clock className="h-5 w-5 text-[#155DFC]" />
                </div>
                <h3 className="font-['Inter'] text-[18px] font-bold leading-[28px] text-[#1D293D]">
                  Session Details
                </h3>
              </div>
              <div className="space-y-3 font-['Inter']">
                <div className="flex h-14 w-full max-w-[399px] items-center justify-between rounded-2xl bg-[#F8FAFC] px-4">
                  <span className="font-['Inter'] text-sm font-normal leading-5 text-[#62748E]">
                    Session Started
                  </span>
                  <span className="font-['Inter'] text-base font-bold leading-6 text-[#1D293D]">
                    {sessionData?.startedAt ?? activeSessionDetail?.startedAt ?? "—"}
                  </span>
                </div>
                <div className="flex h-14 w-full max-w-[399px] items-center justify-between gap-2 rounded-2xl bg-[#F8FAFC] px-4">
                  <span className="shrink-0 font-['Inter'] text-sm font-normal leading-5 text-[#62748E]">
                    Initial Amount
                  </span>
                  <div className="flex min-w-0 flex-1 items-center justify-end gap-1.5">
                    <div className="scrollbar-subtle overflow-x-auto text-right">
                      <span className="whitespace-nowrap font-['Inter'] text-base font-bold leading-6 text-[#1D293D]">
                        {sessionData
                          ? formatRs(sessionData.initialAmount)
                          : activeSessionDetail
                            ? formatRs(activeSessionDetail.initialAmount)
                            : "—"}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsEditAmountModalOpen(true)}
                      className="shrink-0 rounded p-1 text-[#90A1B9] hover:bg-[#F8FAFC] hover:text-[#45556C]"
                      aria-label="Edit initial amount"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="flex h-[58px] w-full max-w-[399px] items-center justify-between rounded-2xl border border-[#A4F4CF] bg-[#ECFDF5] px-4">
                  <span className="font-['Inter'] text-sm font-bold leading-5 text-[#007A55]">
                    Status
                  </span>
                  <span className="flex items-center gap-1.5 font-['Inter'] text-base font-bold leading-6 text-[#007A55]">
                    <span className="h-2 w-2 rounded-full bg-[#00BC7D] opacity-50" />
                    Active
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-6 rounded-[24px] border border-[#E2E8F0] bg-white p-[25px] shadow-[0px_1px_2px_-1px_#0000001A,0px_1px_3px_0px_#0000001A]">
              <div className="flex items-center gap-2 font-['Inter']">
                <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#FFEDD4]">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <g clipPath="url(#clip0_mgr_cashout)">
                      <path
                        d="M9.99996 18.3337C14.6023 18.3337 18.3333 14.6027 18.3333 10.0003C18.3333 5.39795 14.6023 1.66699 9.99996 1.66699C5.39759 1.66699 1.66663 5.39795 1.66663 10.0003C1.66663 14.6027 5.39759 18.3337 9.99996 18.3337Z"
                        stroke="#F54900"
                        strokeWidth="1.66667"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M13.3333 10.0003L9.99996 6.66699L6.66663 10.0003"
                        stroke="#F54900"
                        strokeWidth="1.66667"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M10 13.3337V6.66699"
                        stroke="#F54900"
                        strokeWidth="1.66667"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </g>
                    <defs>
                      <clipPath id="clip0_mgr_cashout">
                        <rect width="20" height="20" fill="white" />
                      </clipPath>
                    </defs>
                  </svg>
                </div>
                <h3 className="font-['Inter'] text-[18px] font-bold leading-[28px] text-[#1D293D]">
                  Quick Actions
                </h3>
              </div>
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setIsCashOutModalOpen(true)}
                  className="flex h-[60px] w-full max-w-[399px] items-center justify-between rounded-2xl border-2 border-[#FFD6A8] bg-[#FFF7ED] px-4 transition-all duration-300 ease-out hover:opacity-90"
                >
                  <span className="flex items-center gap-2">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <g clipPath="url(#clip0_mgr_cash_out)">
                        <path
                          d="M9.99996 18.3337C14.6023 18.3337 18.3333 14.6027 18.3333 10.0003C18.3333 5.39795 14.6023 1.66699 9.99996 1.66699C5.39759 1.66699 1.66663 5.39795 1.66663 10.0003C1.66663 14.6027 5.39759 18.3337 9.99996 18.3337Z"
                          stroke="#F54900"
                          strokeWidth="1.66667"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M13.3333 10.0003L9.99996 6.66699L6.66663 10.0003"
                          stroke="#F54900"
                          strokeWidth="1.66667"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M10 13.3337V6.66699"
                          stroke="#F54900"
                          strokeWidth="1.66667"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </g>
                      <defs>
                        <clipPath id="clip0_mgr_cash_out">
                          <rect width="20" height="20" fill="white" />
                        </clipPath>
                      </defs>
                    </svg>
                    <span className="font-['Inter'] text-base font-bold leading-6 text-center text-[#CA3500]">
                      Cash Out
                    </span>
                  </span>
                  <Lock className="h-4 w-4 text-[#FF8904]" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsCloseSessionModalOpen(true)}
                  className="flex h-[60px] w-full max-w-[399px] items-center justify-between rounded-2xl border-2 border-[#FFC9C9] bg-[#FEF2F2] px-4 transition-all duration-300 ease-out hover:opacity-90"
                >
                  <span className="flex items-center gap-2">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M7.5 17.5H4.16667C3.72464 17.5 3.30072 17.3244 2.98816 17.0118C2.67559 16.6993 2.5 16.2754 2.5 15.8333V4.16667C2.5 3.72464 2.67559 3.30072 2.98816 2.98816C3.30072 2.67559 3.72464 2.5 4.16667 2.5H7.5"
                        stroke="#E7000B"
                        strokeWidth="1.66667"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M13.3334 14.1663L17.5 9.99967L13.3334 5.83301"
                        stroke="#E7000B"
                        strokeWidth="1.66667"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M17.5 10H7.5"
                        stroke="#E7000B"
                        strokeWidth="1.66667"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span className="font-['Inter'] text-base font-bold leading-6 text-center text-[#C10007]">
                      Close Session
                    </span>
                  </span>
                  <Lock className="h-4 w-4 text-[#FF6467]" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsCloseDrawerModalOpen(true)}
                  className="flex h-[60px] w-full max-w-[399px] items-center justify-between rounded-2xl border-2 border-[#FFC9EF] bg-[#FEF2FC] px-4 transition-all duration-300 ease-out hover:opacity-90"
                >
                  <span className="flex items-center gap-2">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M22 6.5C22 7.95869 21.4205 9.35764 20.3891 10.3891C19.3576 11.4205 17.9587 12 16.5 12C15.0413 12 13.6424 11.4205 12.6109 10.3891C11.5795 9.35764 11 7.95869 11 6.5C11 5.04131 11.5795 3.64236 12.6109 2.61091C13.6424 1.57946 15.0413 1 16.5 1C17.9587 1 19.3576 1.57946 20.3891 2.61091C21.4205 3.64236 22 5.04131 22 6.5ZM14.854 4.146C14.7601 4.05211 14.6328 3.99937 14.5 3.99937C14.3672 3.99937 14.2399 4.05211 14.146 4.146C14.0521 4.23989 13.9994 4.36722 13.9994 4.5C13.9994 4.63278 14.0521 4.76011 14.146 4.854L15.793 6.5L14.146 8.146C14.0521 8.23989 13.9994 8.36722 13.9994 8.5C13.9994 8.63278 14.0521 8.76011 14.146 8.854C14.2399 8.94789 14.3672 9.00063 14.5 9.00063C14.6328 9.00063 14.7601 8.94789 14.854 8.854L16.5 7.207L18.146 8.854C18.2399 8.94789 18.3672 9.00063 18.5 9.00063C18.6328 9.00063 18.7601 8.94789 18.854 8.854C18.9479 8.76011 19.0006 8.63278 19.0006 8.5C19.0006 8.36722 18.9479 8.23989 18.854 8.146L17.207 6.5L18.854 4.854C18.9479 4.76011 19.0006 4.63278 19.0006 4.5C19.0006 4.36722 18.9479 4.23989 18.854 4.146C18.7601 4.05211 18.6328 3.99937 18.5 3.99937C18.3672 3.99937 18.2399 4.05211 18.146 4.146L16.5 5.793L14.854 4.146ZM21 11.19C20.5539 11.6189 20.0488 11.9819 19.5 12.268V14H14.942C14.8511 13.9997 14.7609 14.0175 14.6769 14.0521C14.5928 14.0868 14.5164 14.1378 14.4521 14.2021C14.3878 14.2664 14.3368 14.3428 14.3021 14.4269C14.2675 14.5109 14.2497 14.6011 14.25 14.692V14.75C14.25 15.3467 14.0129 15.919 13.591 16.341C13.169 16.7629 12.5967 17 12 17C11.4033 17 10.831 16.7629 10.409 16.341C9.98705 15.919 9.75 15.3467 9.75 14.75V14.692C9.75026 14.6011 9.73255 14.5109 9.69786 14.4269C9.66318 14.3428 9.61222 14.2664 9.54791 14.2021C9.4836 14.1378 9.40721 14.0868 9.32313 14.0521C9.23905 14.0175 9.14895 13.9997 9.058 14H4.5V9.5H10.732C10.4849 9.02489 10.2975 8.52108 10.174 8H4.5V7.25C4.5 6.284 5.284 5.5 6.25 5.5H10.076C10.156 4.98489 10.2977 4.48127 10.498 4H6.25C5.38805 4 4.5614 4.34241 3.9519 4.9519C3.34241 5.5614 3 6.38805 3 7.25V18.75C3 19.1768 3.08406 19.5994 3.24739 19.9937C3.41072 20.388 3.65011 20.7463 3.9519 21.0481C4.25369 21.3499 4.61197 21.5893 5.00628 21.7526C5.40059 21.9159 5.8232 22 6.25 22H17.75C18.1768 22 18.5994 21.9159 18.9937 21.7526C19.388 21.5893 19.7463 21.3499 20.0481 21.0481C20.3499 20.7463 20.5893 20.388 20.7526 19.9937C20.9159 19.5994 21 19.1768 21 18.75V11.19ZM19.5 15.5V18.75C19.5 19.2141 19.3156 19.6592 18.9874 19.9874C18.6592 20.3156 18.2141 20.5 17.75 20.5H6.25C5.78587 20.5 5.34075 20.3156 5.01256 19.9874C4.68437 19.6592 4.5 19.2141 4.5 18.75V15.5H8.325C8.49812 16.3469 8.95843 17.108 9.62807 17.6546C10.2977 18.2012 11.1356 18.4998 12 18.4998C12.8644 18.4998 13.7023 18.2012 14.3719 17.6546C15.0416 17.108 15.5019 16.3469 15.675 15.5H19.5Z"
                        fill="#C10091"
                      />
                    </svg>
                    <span className="font-['Inter'] text-base font-bold leading-6 text-center text-[#C10091]">
                      Close Drawer
                    </span>
                  </span>
                  <Lock className="h-4 w-4 text-[#FF64EA]" />
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-6 rounded-[24px] border border-[#E2E8F0] bg-white p-[25px] shadow-[0px_1px_2px_-1px_#0000001A,0px_1px_3px_0px_#0000001A]">
              <div className="flex items-center gap-2 font-['Inter']">
                <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#F1F5F9]">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden
                  >
                    <g clipPath="url(#clip0_mgr_cashout_hist)">
                      <path
                        d="M18.3334 14.1663L11.25 7.08301L7.08335 11.2497L1.66669 5.83301"
                        stroke="#45556C"
                        strokeWidth="1.66667"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M13.3333 14.167H18.3333V9.16699"
                        stroke="#45556C"
                        strokeWidth="1.66667"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </g>
                    <defs>
                      <clipPath id="clip0_mgr_cashout_hist">
                        <rect width="20" height="20" fill="white" />
                      </clipPath>
                    </defs>
                  </svg>
                </div>
                <h3 className="font-['Inter'] text-[18px] font-bold leading-[28px] text-[#1D293D]">
                  Cash Out History
                </h3>
              </div>
              <div className="space-y-3">
                {cashOutHistory.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-[#E2E8F0] bg-[#F8FAFC] px-4 py-6 text-center font-['Inter'] text-sm text-[#62748E]">
                    No cash outs in this session yet.
                  </p>
                ) : (
                  cashOutHistory.map((entry, i) => (
                    <div
                      key={`${entry.dateTime}-${entry.amount}-${i}`}
                      className="flex min-h-[78px] w-full max-w-[399px] items-center justify-between gap-2 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="font-['Inter'] text-base font-bold leading-6 text-[#1D293D]">
                          {entry.dateTime}
                        </p>
                        <p className="font-['Inter'] text-sm font-normal leading-5 text-[#62748E]">
                          Cash Out by {entry.by}
                        </p>
                      </div>
                      <div className="scrollbar-subtle min-w-0 shrink-0 overflow-x-auto text-right">
                        <p className="whitespace-nowrap font-['Inter'] text-[18px] font-bold leading-[28px] text-[#1D293D]">
                          {formatRs(entry.amount)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : (
          /* No active session - guide user to create one */
          <div className="mt-8 w-full rounded-[24px] border-2 border-[#E2E8F0] bg-white p-4 shadow-[0px_1px_2px_-1px_#0000001A,0px_1px_3px_0px_#0000001A]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              {!hasDrawerStarted ? (
                <div className="flex flex-1 items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#F1F5F9]">
                    <DrawerCashIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="font-['Inter'] text-base font-bold leading-5 text-[#1D293D]">
                      Start the Drawer for Today!
                    </h2>
                    <p className="mt-0.5 font-['Inter'] text-sm text-[#62748E]">
                      You need to start the drawer first
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsStartModalOpen(true)}
                    className="shrink-0 rounded-xl bg-[#EA580C] px-5 py-2.5 font-['Inter'] text-sm font-bold text-white shadow-[0px_8px_10px_-6px_#EA580C4D] transition-all hover:bg-[#DC4C04] active:scale-[0.98] sm:ml-auto"
                  >
                    Start The Drawer
                  </button>
                </div>
              ) : (
                <div className="flex flex-1 items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#F1F5F9]">
                    <DrawerCashIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="font-['Inter'] text-base font-bold leading-5 text-[#1D293D]">
                      No Active Drawer Session
                    </h2>
                    <p className="mt-0.5 font-['Inter'] text-sm text-[#62748E]">
                      Create a session to start processing cash orders.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCreateSessionModalOpen(true)}
                    className="shrink-0 rounded-xl bg-[#EA580C] px-5 py-2.5 font-['Inter'] text-sm font-bold text-white shadow-[0px_8px_10px_-6px_#EA580C4D] transition-all hover:bg-[#DC4C04] active:scale-[0.98] sm:ml-auto"
                  >
                    Create New Session
                  </button>
                </div>
              )}
              {previousSessions.length > 0 && (
                <div className="flex shrink-0 flex-col gap-2 border-t border-[#E2E8F0] pt-4 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-4">
                  <h3 className="font-['Inter'] text-xs font-bold text-[#62748E]">
                    Previous Sessions
                  </h3>
                  {previousSessions.map((session, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between gap-3 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-['Inter'] text-xs font-bold text-[#1D293D]">
                          {session.closedAt}
                        </p>
                        <p className="font-['Inter'] text-[11px] text-[#62748E]">
                          by {session.closedBy}
                        </p>
                      </div>
                      <span className="shrink-0 font-['Inter'] text-xs font-bold text-[#1D293D]">
                        {formatRs(session.closingAmount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {isStartModalOpen && (
        <StartDrawerModal onClose={() => setIsStartModalOpen(false)} onStart={handleStartDrawer} />
      )}
      {isCreateSessionModalOpen && (
        <CreateDrawerSessionModal
          onClose={() => setIsCreateSessionModalOpen(false)}
          onCreate={handleCreateSession}
        />
      )}
      <EditInitialAmountModal
        isOpen={isEditAmountModalOpen}
        onClose={() => setIsEditAmountModalOpen(false)}
        initialAmount={sessionData?.initialAmount ?? 0}
        onVerify={handleEditInitialAmount}
      />
      <ProcessCashOutModal
        isOpen={isCashOutModalOpen}
        onClose={() => setIsCashOutModalOpen(false)}
        onVerify={handleCashOut}
      />
      <CloseDrawerSessionModal
        isOpen={isCloseSessionModalOpen}
        onClose={() => setIsCloseSessionModalOpen(false)}
        expectedBalance={expectedBalance}
        initialAmount={sessionData?.initialAmount ?? 0}
        cashSales={cashSales}
        cashOuts={cashOuts}
        onVerify={handleCloseSession}
      />
      <CloseTheDrawerModal
        isOpen={isCloseDrawerModalOpen}
        onClose={() => setIsCloseDrawerModalOpen(false)}
        initialDrawerAmount={expectedBalance}
        onConfirm={handleCloseTheDrawer}
      />
    </div>
  );
}
