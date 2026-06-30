"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import MenuPageHeader from "@/components/menu/MenuPageHeader";
import MenuContent from "@/components/menu/MenuContent";
import OrderSidebar from "@/components/menu/OrderSidebar";
import {
  OrderProvider,
  useOrder,
  type PendingAddParams,
  type MenuOrderSurface,
} from "@/contexts/OrderContext";
import { useDrawerSession } from "@/contexts/DrawerSessionContext";
import { useAuth } from "@/contexts/AuthContext";
import DrawerSessionRequiredModal from "@/components/drawer/DrawerSessionRequiredModal";
import type { OrderItem } from "@/contexts/OrderContext";
import * as sessionService from "@/services/sessionService";

/** When session becomes active, replays any pending add-item calls that were blocked (e.g. no session). */
function PendingAddReplay({
  pendingAddRef,
  onReplayed,
}: {
  pendingAddRef: React.MutableRefObject<PendingAddParams[]>;
  onReplayed?: () => void;
}) {
  const order = useOrder();
  const drawerSession = useDrawerSession();
  const prevSession = useRef(drawerSession?.hasSession ?? false);

  useEffect(() => {
    const hasSession = drawerSession?.hasSession ?? false;
    if (hasSession && !prevSession.current && order?.addItem) {
      const pending = pendingAddRef.current;
      if (pending.length > 0) {
        pendingAddRef.current = [];
        for (const p of pending) {
          order.addItem(
            p.productId,
            p.name,
            p.price,
            p.details ?? "REGULAR",
            p.image,
            p.variant,
            p.addOnsList,
            p.variationId,
            p.variationOptionId,
            p.modifications
          );
        }
        onReplayed?.();
      }
    }
    prevSession.current = hasSession;
  }, [drawerSession?.hasSession, order?.addItem, pendingAddRef, onReplayed]);

  return null;
}

function ManagerMenuContent() {
  const drawerSession = useDrawerSession();
  if (!drawerSession) {
    throw new Error("ManagerMenuContent must be used within DrawerSessionProvider");
  }
  const {
    hasSession,
    hasDrawerStarted,
    hasActiveSession,
    setHasDrawerStarted,
    setHasActiveSession,
    setSessionData,
  } = drawerSession;
  const [showDrawerModal, setShowDrawerModal] = useState(false);
  const [editingOrderItem, setEditingOrderItem] = useState<OrderItem | null>(null);
  const pendingAddRef = useRef<PendingAddParams[]>([]);
  const menuSurfaceRef = useRef<MenuOrderSurface>("menu");

  const beforeAddItem = useCallback((pending?: PendingAddParams) => {
    if (hasSession) return true;
    if (pending) pendingAddRef.current = [...pendingAddRef.current, pending];
    setShowDrawerModal(true);
    return false;
  }, [hasSession]);

  const handleReplayed = useCallback(() => {
    setShowDrawerModal(false);
  }, []);

  const beforeAddOrder = useCallback(() => {
    if (hasSession) return true;
    setShowDrawerModal(true);
    return false;
  }, [hasSession]);

  const handleStartDrawer = useCallback(
    async (openingAmount: number, managerPasscode: string) => {
      await sessionService.startSession({ startBalance: openingAmount, passcode: managerPasscode });
      const now = new Date();
      const startedAt = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
      setSessionData({ initialAmount: openingAmount, startedAt });
      setHasDrawerStarted(true);
      setHasActiveSession(true);
    },
    [setHasDrawerStarted, setHasActiveSession, setSessionData]
  );

  const handleCreateSession = useCallback(
    async (openingAmount: number) => {
      await sessionService.startSession({ startBalance: openingAmount });
      const now = new Date();
      const startedAt = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
      setSessionData({ initialAmount: openingAmount, startedAt });
      setHasActiveSession(true);
    },
    [setSessionData, setHasActiveSession]
  );

  return (
    <>
      <OrderProvider
        beforeAddItem={beforeAddItem}
        beforeAddOrder={beforeAddOrder}
        menuSurfaceRef={menuSurfaceRef}
      >
        <PendingAddReplay pendingAddRef={pendingAddRef} onReplayed={handleReplayed} />
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <MenuPageHeader />
          <div className="flex min-h-0 flex-1 overflow-hidden pr-[320px] md:pr-[380px]">
            <div className="min-w-0 flex-1 overflow-y-auto pb-6">
              <MenuContent
                menuSurfaceRef={menuSurfaceRef}
                editingOrderItem={editingOrderItem}
                onCancelEdit={() => setEditingOrderItem(null)}
              />
            </div>
            <OrderSidebar onEditItem={(item) => setEditingOrderItem(item)} />
          </div>
        </div>
      </OrderProvider>
      <DrawerSessionRequiredModal
        isOpen={showDrawerModal}
        onClose={() => setShowDrawerModal(false)}
        hasDrawerStarted={hasDrawerStarted}
        hasActiveSession={hasActiveSession}
        onStartDrawer={handleStartDrawer}
        onCreateSession={handleCreateSession}
      />
    </>
  );
}

function CashierMenuContent() {
  const drawerSession = useDrawerSession();
  if (!drawerSession) throw new Error("CashierMenuContent must be used within DrawerSessionProvider");
  const { hasSession, hasDrawerStarted, hasActiveSession, setHasDrawerStarted, setHasActiveSession, setSessionData } = drawerSession;
  const [showDrawerModal, setShowDrawerModal] = useState(false);
  const [editingOrderItem, setEditingOrderItem] = useState<OrderItem | null>(null);
  const pendingAddRef = useRef<PendingAddParams[]>([]);
  const menuSurfaceRef = useRef<MenuOrderSurface>("menu");

  const beforeAddItem = useCallback((pending?: PendingAddParams) => {
    if (hasSession) return true;
    if (pending) pendingAddRef.current = [...pendingAddRef.current, pending];
    setShowDrawerModal(true);
    return false;
  }, [hasSession]);

  const beforeAddOrder = useCallback(() => {
    if (hasSession) return true;
    setShowDrawerModal(true);
    return false;
  }, [hasSession]);

  const handleReplayed = useCallback(() => {
    setShowDrawerModal(false);
  }, []);

  const handleStartDrawer = useCallback(
    async (openingAmount: number, managerPasscode: string) => {
      await sessionService.startSession({ startBalance: openingAmount, passcode: managerPasscode });
      const now = new Date();
      const startedAt = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
      setSessionData({ initialAmount: openingAmount, startedAt });
      setHasDrawerStarted(true);
      setHasActiveSession(true);
    },
    [setHasDrawerStarted, setHasActiveSession, setSessionData]
  );

  const handleCreateSession = useCallback(
    async (openingAmount: number) => {
      await sessionService.startSession({ startBalance: openingAmount });
      const now = new Date();
      const startedAt = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
      setSessionData({ initialAmount: openingAmount, startedAt });
      setHasActiveSession(true);
    },
    [setSessionData, setHasActiveSession]
  );

  return (
    <>
      <OrderProvider
        beforeAddItem={beforeAddItem}
        beforeAddOrder={beforeAddOrder}
        menuSurfaceRef={menuSurfaceRef}
      >
        <PendingAddReplay pendingAddRef={pendingAddRef} onReplayed={handleReplayed} />
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <MenuPageHeader />
          <div className="flex min-h-0 flex-1 overflow-hidden pr-[320px] md:pr-[380px]">
            <div className="min-w-0 flex-1 overflow-y-auto pb-6">
              <MenuContent
                menuSurfaceRef={menuSurfaceRef}
                editingOrderItem={editingOrderItem}
                onCancelEdit={() => setEditingOrderItem(null)}
              />
            </div>
            <OrderSidebar onEditItem={(item) => setEditingOrderItem(item)} />
          </div>
        </div>
      </OrderProvider>
      <DrawerSessionRequiredModal
        isOpen={showDrawerModal}
        onClose={() => setShowDrawerModal(false)}
        hasDrawerStarted={hasDrawerStarted}
        hasActiveSession={hasActiveSession}
        onStartDrawer={handleStartDrawer}
        onCreateSession={handleCreateSession}
      />
    </>
  );
}

export default function MenuPageContent() {
  const { isManagerOrAdmin } = useAuth();

  if (isManagerOrAdmin) {
    return <ManagerMenuContent />;
  }

  return <CashierMenuContent />;
}
