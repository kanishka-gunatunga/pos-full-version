"use client";

import { useAuth } from "@/contexts/AuthContext";
import DrawerContent from "./DrawerContent";
import ManagerDrawerContent from "./ManagerDrawerContent";

export default function DrawerPage() {
  const { isManagerOrAdmin } = useAuth();
  return isManagerOrAdmin ? <ManagerDrawerContent /> : <DrawerContent />;
}
