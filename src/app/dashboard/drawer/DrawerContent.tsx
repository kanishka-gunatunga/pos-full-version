"use client";

import { useState, useEffect } from "react";
import { Wallet, ArrowUpCircle, Clock, Lock, Pencil, Loader2 } from "lucide-react";
import * as sessionService from "@/services/sessionService";
import { useDrawerSession } from "@/contexts/DrawerSessionContext";
import { useAuth } from "@/contexts/AuthContext";
import DashboardPageHeader from "@/components/dashboard/DashboardPageHeader";
import StartDrawerModal from "@/components/drawer/StartDrawerModal";
import CreateDrawerSessionModal from "@/components/drawer/CreateDrawerSessionModal";
import EditInitialAmountModal from "@/components/drawer/EditInitialAmountModal";
import ProcessCashOutModal from "@/components/drawer/ProcessCashOutModal";
import CloseDrawerSessionModal from "@/components/drawer/CloseDrawerSessionModal";
import CloseTheDrawerModal from "@/components/drawer/CloseTheDrawerModal";
import DrawerCashIcon from "@/components/icons/DrawerCashIcon";
import CashSalesIcon from "@/components/icons/CashSalesIcon";

function formatRs(n: number) {
  return `Rs.${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

interface PreviousSessionSummary {
  closedAt: string;
  closedBy: string;
  closingAmount: number;
}

interface CashOutEntry {
  dateTime: string;
  by: string;
  amount: number;
}

export default function DrawerContent() {
  const { user } = useAuth();
  const drawerSession = useDrawerSession();
  if (!drawerSession) throw new Error("DrawerContent must be used within DrawerSessionProvider");

  const {
    hasDrawerStarted,
    hasActiveSession,
    sessionData,
    setHasDrawerStarted,
    setHasActiveSession,
    setSessionData,
    isSessionLoading,
  } = drawerSession;

  const [isStartModalOpen, setIsStartModalOpen] = useState(false);
  const [isCreateSessionModalOpen, setIsCreateSessionModalOpen] = useState(false);
  const [isEditAmountModalOpen, setIsEditAmountModalOpen] = useState(false);
  const [isCashOutModalOpen, setIsCashOutModalOpen] = useState(false);
  const [isCloseSessionModalOpen, setIsCloseSessionModalOpen] = useState(false);
  const [isCloseDrawerModalOpen, setIsCloseDrawerModalOpen] = useState(false);
  const [previousSessions, setPreviousSessions] = useState<PreviousSessionSummary[]>([]);
  const [activeSessionDetail, setActiveSessionDetail] = useState<sessionService.ActiveSessionDetail | null>(null);
  const [cashOutLedger, setCashOutLedger] = useState<sessionService.CashOutLedgerRow[]>([]);

  useEffect(() => {
    sessionService
      .getSessionHistory()
      .then((list) => {
        if (!list || list.length === 0) {
          setPreviousSessions([]);
          return;
        }
        // Sort by closedAt/endTime descending and keep only the most recent closed session
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

  useEffect(() => {
    if (!hasActiveSession) {
      queueMicrotask(() => {
        setActiveSessionDetail(null);
        setCashOutLedger([]);
      });
      return;
    }

    let cancelled = false;
    const fallbackName = user?.name ?? "Current user";

    const fetchActive = async () => {
      try {
        const session = await sessionService.getCurrentSession();
        if (!cancelled) {
          setActiveSessionDetail(sessionService.parseActiveSessionDetail(session));
          setCashOutLedger(sessionService.extractCashOutLedgerFromSession(session, fallbackName));
        }
      } catch {
        if (!cancelled) {
          setActiveSessionDetail(null);
          setCashOutLedger([]);
        }
      }
    };

    void fetchActive();

    const handleFocus = () => {
      void fetchActive();
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") void fetchActive();
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [hasActiveSession, user?.name]);

  const cashOutHistory: CashOutEntry[] = cashOutLedger.map((e) => ({
    dateTime: e.dateTime,
    by: e.by,
    amount: e.amount,
  }));

  const expectedBalance =
    activeSessionDetail?.currentBalance ?? sessionData?.initialAmount ?? 0;
  const cashSales = activeSessionDetail?.cashSalesAmount ?? 0;
  const cashOuts = activeSessionDetail?.cashOutsAmount ?? 0;

  const handleStartDrawer = async (openingAmount: number, managerPasscode: string) => {
    await sessionService.startSession({ startBalance: openingAmount, passcode: managerPasscode });
    const now = new Date();
    const startedAt = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
    setSessionData({ initialAmount: openingAmount, startedAt });
    setHasDrawerStarted(true);
    setHasActiveSession(true);
  };

  const handleCreateSession = async (openingAmount: number) => {
    await sessionService.startSession({ startBalance: openingAmount });
    const now = new Date();
    const startedAt = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
    setSessionData({ initialAmount: openingAmount, startedAt });
    setHasActiveSession(true);
  };

  const handleEditInitialAmount = async (newAmount: number, reason: string, passcode: string) => {
    const current = sessionData?.initialAmount ?? 0;
    await sessionService.adjustInitialAmount({ currentAmount: current, newAmount, reason, passcode });
    setSessionData((prev) => (prev ? { ...prev, initialAmount: newAmount } : null));
  };

  const handleCashOut = async (amount: number, reason: string, passcode: string) => {
    const fallbackName = user?.name ?? "Current user";
    const result = await sessionService.cashAction({ type: "remove", amount, description: reason, passcode });
    if (result.session) {
      setActiveSessionDetail(sessionService.parseActiveSessionDetail(result.session));
      setCashOutLedger(sessionService.extractCashOutLedgerFromSession(result.session, fallbackName));
      return;
    }
    try {
      const session = await sessionService.getCurrentSession();
      setActiveSessionDetail(sessionService.parseActiveSessionDetail(session));
      setCashOutLedger(sessionService.extractCashOutLedgerFromSession(session, fallbackName));
    } catch {
      setActiveSessionDetail(null);
      setCashOutLedger([]);
    }
  };

  const handleCloseSession = async (actualBalance: number, passcode: string) => {
    await sessionService.closeSession({ passcode, actualBalance });
    setHasActiveSession(false);
    setSessionData(null);
  };

  const handleCloseTheDrawer = async (amount: number, passcode: string) => {
    await sessionService.closeSession({ passcode, actualBalance: amount });
    setHasDrawerStarted(false);
    setHasActiveSession(false);
    setSessionData(null);
  };

  if (isSessionLoading) {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#F8FAFC]">
        <DashboardPageHeader />
        <div className="flex flex-1 items-center justify-center p-8">
          <div className="flex flex-col items-center gap-3 text-[#62748E]">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="font-['Inter'] text-sm">Loading drawer session…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#F8FAFC]">
      <DashboardPageHeader />
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div>
          <h1 className="mb-6 font-bold text-[#1D293D] font-['Inter'] text-[clamp(1.5rem,4vw,1.875rem)] leading-[1.2] sm:mb-8">
            Drawer Management
          </h1>

          {hasActiveSession ? (
            /* Active Session - Full dashboard layout */
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {/* Expected Balance */}
                <div
                  className="rounded-2xl border border-[#00D492] p-5 font-['Inter'] shadow-[0px_4px_6px_-4px_#0000001A,0px_10px_15px_-3px_#0000001A]"
                  style={{ background: "linear-gradient(135deg, #00BC7D 0%, #009966 100%)" }}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 sm:h-14 sm:w-14">
                    <Wallet className="h-6 w-6 text-white sm:h-7 sm:w-7" />
                  </div>
                  <div className="scrollbar-subtle mt-3 min-w-0 overflow-x-auto">
                    <p className="whitespace-nowrap font-['Inter'] text-[clamp(1.5rem,3vw,1.875rem)] font-bold leading-9 text-white">
                      {formatRs(expectedBalance)}
                    </p>
                  </div>
                  <p className="mt-1 font-['Inter'] text-sm font-medium leading-5 text-[#D0FAE5]">
                    Expected Balance
                  </p>
                </div>
                {/* Cash Sales */}
                <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-[0px_1px_2px_-1px_#0000001A,0px_1px_3px_0px_#0000001A]">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F3E8FF] sm:h-14 sm:w-14">
                    <CashSalesIcon className="h-6 w-6 sm:h-7 sm:w-7" />
                  </div>
                  <div className="scrollbar-subtle mt-3 min-w-0 overflow-x-auto">
                    <p className="whitespace-nowrap font-['Inter'] text-[clamp(1.5rem,3vw,1.875rem)] font-bold leading-9 text-[#1D293D]">
                      {formatRs(cashSales)}
                    </p>
                  </div>
                  <p className="mt-1 font-['Inter'] text-sm font-medium leading-5 text-[#62748E]">
                    Cash Sales
                  </p>
                </div>
                {/* Cash Outs */}
                <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-[0px_1px_2px_-1px_#0000001A,0px_1px_3px_0px_#0000001A]">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFEDD4] sm:h-14 sm:w-14">
                    <ArrowUpCircle className="h-6 w-6 text-[#EA580C] sm:h-7 sm:w-7" />
                  </div>
                  <div className="scrollbar-subtle mt-3 min-w-0 overflow-x-auto">
                    <p className="whitespace-nowrap font-['Inter'] text-[clamp(1.5rem,3vw,1.875rem)] font-bold leading-9 text-[#1D293D]">
                      {formatRs(cashOuts)}
                    </p>
                  </div>
                  <p className="mt-1 font-['Inter'] text-sm font-medium leading-5 text-[#62748E]">
                    Cash Outs
                  </p>
                </div>
              </div>

              {/* Session Details, Quick Actions, Cash Out History */}
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div className="flex flex-col gap-6 rounded-[24px] border border-[#E2E8F0] bg-white p-[25px] shadow-[0px_1px_2px_-1px_#0000001A,0px_1px_3px_0px_#0000001A]">
                  <div className="flex items-center gap-2 font-['Inter']">
                    <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#DBEAFE]">
                      <Clock className="h-5 w-5 text-[#155DFC]" />
                    </div>
                    <h3 className="font-bold leading-[28px] text-[#1D293D] font-['Inter'] text-[18px]">
                      Session Details
                    </h3>
                  </div>
                  <div className="space-y-3 font-['Inter']">
                    <div className="flex h-14 w-full max-w-[399px] items-center justify-between rounded-2xl bg-[#F8FAFC] px-4">
                      <span className="font-['Inter'] text-sm font-normal leading-5 text-[#62748E]">
                        Session Started
                      </span>
                      <span className="font-['Inter'] text-base font-bold leading-6 text-[#1D293D]">
                        {sessionData?.startedAt ?? "—"}
                      </span>
                    </div>
                    <div className="flex h-14 w-full max-w-[399px] items-center justify-between gap-2 rounded-2xl bg-[#F8FAFC] px-4">
                      <span className="shrink-0 font-['Inter'] text-sm font-normal leading-5 text-[#62748E]">
                        Initial Amount
                      </span>
                      <div className="flex min-w-0 flex-1 items-center justify-end gap-1.5">
                        <div className="scrollbar-subtle overflow-x-auto text-right">
                          <span className="whitespace-nowrap font-['Inter'] text-base font-bold leading-6 text-[#1D293D]">
                            {sessionData ? formatRs(sessionData.initialAmount) : "—"}
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
                        <path
                          d="M16.6667 10.8331C16.6667 14.9997 13.75 17.0831 10.2834 18.2914C10.1018 18.3529 9.90466 18.35 9.72504 18.2831C6.25004 17.0831 3.33337 14.9997 3.33337 10.8331V4.99972C3.33337 4.77871 3.42117 4.56675 3.57745 4.41047C3.73373 4.25419 3.94569 4.16639 4.16671 4.16639C5.83337 4.16639 7.91671 3.16639 9.36671 1.89972C9.54325 1.74889 9.76784 1.66602 10 1.66602C10.2322 1.66602 10.4568 1.74889 10.6334 1.89972C12.0917 3.17472 14.1667 4.16639 15.8334 4.16639C16.0544 4.16639 16.2663 4.25419 16.4226 4.41047C16.5789 4.56675 16.6667 4.77871 16.6667 4.99972V10.8331Z"
                          stroke="#F54900"
                          strokeWidth="1.66667"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M7.5 9.99967L9.16667 11.6663L12.5 8.33301"
                          stroke="#F54900"
                          strokeWidth="1.66667"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <h3 className="font-bold leading-[28px] text-[#1D293D] font-['Inter'] text-[18px]">
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
                          <g clipPath="url(#clip0_cash_out)">
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
                            <clipPath id="clip0_cash_out">
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
                      >
                        <g clipPath="url(#clip0_cashout_history)">
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
                          <clipPath id="clip0_cashout_history">
                            <rect width="20" height="20" fill="white" />
                          </clipPath>
                        </defs>
                      </svg>
                    </div>
                    <h3 className="font-bold leading-[28px] text-[#1D293D] font-['Inter'] text-[18px]">
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
            </div>
          ) : (
            <div className="rounded-[24px] mx-auto w-full max-w-2xl border-2 border-[#CAD5E2] bg-white p-6 shadow-sm sm:p-8">
              {!hasDrawerStarted ? (
                /* Step 1: Start the Drawer (first-time setup) */
                <div className="flex flex-col items-center text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F1F5F9] sm:h-20 sm:w-20 md:h-24 md:w-24">
                    <DrawerCashIcon className="h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9" />
                  </div>
                  <h2 className="mt-4 font-bold text-[#1D293D] font-['Inter'] text-[clamp(1.125rem,2.5vw,1.5rem)] leading-[1.33] sm:mt-5">
                    Start the Drawer for Today!
                  </h2>
                  <p className="mt-2 text-[#62748E] font-['Inter'] text-[clamp(0.875rem,1.5vw,1rem)] leading-6">
                    You need to start the drawer first
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsStartModalOpen(true)}
                    className="mt-6 w-full max-w-[280px] rounded-2xl bg-[#EA580C] py-3.5 font-bold text-white font-['Inter'] text-[clamp(0.875rem,1.5vw,1rem)] shadow-[0px_8px_10px_-6px_#EA580C4D,0px_20px_25px_-5px_#EA580C4D] transition-all hover:bg-[#DC4C04] active:scale-[0.98] sm:py-4"
                  >
                    Start The Drawer
                  </button>
                </div>
              ) : (
                /* Step 2: No Active Session - create drawer session */
                <div className="flex flex-col items-center text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F1F5F9] sm:h-20 sm:w-20 md:h-24 md:w-24">
                    <DrawerCashIcon className="h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9" />
                  </div>
                  <h2 className="mt-4 font-bold text-[#1D293D] font-['Inter'] text-[clamp(1.125rem,2.5vw,1.5rem)] leading-[1.33] sm:mt-5">
                    No Active Drawer Session
                  </h2>
                  <p className="mt-2 text-[#62748E] font-['Inter'] text-[clamp(0.875rem,1.5vw,1rem)] leading-6">
                    You need to create a drawer session before you can start processing cash orders.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsCreateSessionModalOpen(true)}
                    className="mt-6 w-full max-w-[280px] rounded-2xl bg-[#EA580C] py-3.5 font-bold text-white font-['Inter'] text-[clamp(0.875rem,1.5vw,1rem)] shadow-[0px_8px_10px_-6px_#EA580C4D,0px_20px_25px_-5px_#EA580C4D] transition-all hover:bg-[#DC4C04] active:scale-[0.98] sm:py-4"
                  >
                    Create New Session
                  </button>
                </div>
              )}

              {/* Previous Sessions - only show when not in active session state */}
              {!hasActiveSession && previousSessions.length > 0 && (
                <div className="mt-8 border-t border-[#E2E8F0] pt-6 sm:mt-10 sm:pt-8">
                  <h3 className="font-bold text-[#1D293D] font-['Inter'] text-[clamp(0.9375rem,1.5vw,1.125rem)] leading-[1.56]">
                    Previous Sessions
                  </h3>
                  <div className="mt-3 space-y-3">
                    {previousSessions.map((session, i) => (
                      <div
                        key={i}
                        className="flex flex-col gap-1 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:py-4"
                      >
                        <div>
                          <p className="font-bold text-[#1D293D] font-['Inter'] text-[clamp(0.875rem,1.5vw,1rem)] leading-6">
                            {session.closedAt}
                          </p>
                          <p className="text-[#62748E] font-['Inter'] text-[clamp(0.75rem,1.25vw,0.875rem)] leading-5">
                            Closed by {session.closedBy}
                          </p>
                        </div>
                        <div className="scrollbar-subtle min-w-0 overflow-x-auto sm:text-right">
                          <p className="whitespace-nowrap font-bold text-[#1D293D] font-['Inter'] text-[clamp(0.9375rem,1.5vw,1.125rem)] leading-[1.56]">
                            {formatRs(session.closingAmount)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

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
