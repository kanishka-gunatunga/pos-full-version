"use client";

import StartDrawerModal from "./StartDrawerModal";
import CreateDrawerSessionModal from "./CreateDrawerSessionModal";

interface DrawerSessionRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  hasDrawerStarted: boolean;
  hasActiveSession: boolean;
  onStartDrawer: (openingAmount: number, managerPasscode: string) => void | Promise<void>;
  onCreateSession: (openingAmount: number) => void | Promise<void>;
}

export default function DrawerSessionRequiredModal({
  isOpen,
  onClose,
  hasDrawerStarted,
  hasActiveSession,
  onStartDrawer,
  onCreateSession,
}: DrawerSessionRequiredModalProps) {
  if (!isOpen) return null;

  if (!hasDrawerStarted) {
    return (
      <StartDrawerModal
        onClose={onClose}
        onStart={async (amount, passcode) => {
          await onStartDrawer(amount, passcode);
        }}
        closeOnSuccess={false}
      />
    );
  }

  if (!hasActiveSession) {
    return (
      <CreateDrawerSessionModal
        onClose={onClose}
        onCreate={async (amount) => {
          await onCreateSession(amount);
        }}
      />
    );
  }

  return null;
}
