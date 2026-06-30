"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AxiosError } from "axios";
import DashboardPageHeader from "@/components/dashboard/DashboardPageHeader";
import { Search, UserPlus } from "lucide-react";
import UserTable from "@/components/users/UserTable";
import AddUserModal from "@/components/users/AddUserModal";
import type { UserFormPayload } from "@/components/users/types";
import { ROUTES } from "@/lib/constants";
import { useAuth } from "@/contexts/AuthContext";
import {
  useGetUsers,
  useSearchUsers,
  useRegisterUser,
  useUpdateUser,
  useActivateUser,
  useDeactivateUser
} from "@/hooks/useUser";
import type { CreateUserData, UpdateUserData, User } from "@/types/user";
import { toast } from "sonner";

export default function UsersContent() {
  const router = useRouter();
  const { isCashier } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);


  const parsing = (() => {
    const term = debouncedSearchTerm.toLowerCase().trim();
    if (!term) return { name: "", role: "", status: "all" };

    const parts = term.split(/\s+/);
    let role = "";
    let status = "all";

    const roles = ["admin", "manager", "cashier", "kitchen"];
    const statuses = ["active", "inactive", "all"];

    const nameParts = parts.filter(part => {
      if (roles.includes(part)) {
        role = part;
        return false;
      }
      if (statuses.includes(part)) {
        status = part;
        return false;
      }
      return true;
    });

    return {
      name: nameParts.join(" "),
      role,
      status: status || "all"
    };
  })();

  const { data: allUsers = [], isLoading: isAllUsersLoading } = useGetUsers(parsing.status);
  const { data: searchResults = [], isLoading: isSearchLoading } = useSearchUsers(parsing);

  const hasNameQuery = parsing.name.trim().length > 0 || parsing.role.length > 0;
  const users = hasNameQuery ? searchResults : allUsers;
  const isUsersLoading = hasNameQuery ? isSearchLoading : isAllUsersLoading;

  const registerMutation = useRegisterUser();
  const updateMutation = useUpdateUser();
  const activateMutation = useActivateUser();
  const deactivateMutation = useDeactivateUser();

  const handleSaveUser = async (user: UserFormPayload) => {
    setSaveError(null);
    try {
      const basePayload: CreateUserData = {
        name: user.name,
        email: user.email || undefined,
        password: user.password || undefined,
        employeeId: user.employeeId,
        role: user.role,
        branchId: user.branchId || undefined,
        passcode: user.passcode || undefined,
      };

      if (selectedUser) {
        const { password, ...updatePayloadWithoutPassword } = basePayload;
        const updatePayload: UpdateUserData = password ? basePayload : updatePayloadWithoutPassword;
        await updateMutation.mutateAsync({ id: selectedUser.id, data: updatePayload });
        toast.success("User updated successfully");
      } else {
        await registerMutation.mutateAsync(basePayload);
        toast.success("User registered successfully");
      }

      setIsAddModalOpen(false);
      setSelectedUser(null);
    } catch (error) {
      console.error("Failed to save user:", error);
      const message =
        error instanceof AxiosError
          ? (error.response?.data as { message?: string })?.message
          : null;
      const finalMessage = message || "Failed to save user. Please try again.";
      setSaveError(finalMessage);
      toast.error(finalMessage);
    }
  };

  const handleEditUserClick = (user: User) => {
    setSelectedUser(user);
    setIsAddModalOpen(true);
  };

  const handleToggleStatus = async (user: User) => {
    try {
      if (user.status === "active") {
        await deactivateMutation.mutateAsync(user.id);
        toast.success("User deactivated successfully");
      } else {
        await activateMutation.mutateAsync(user.id);
        toast.success("User activated successfully");
      }
    } catch (error) {
      console.error("Failed to toggle status:", error);
      toast.error("Failed to update user status");
    }
  };

  useEffect(() => {
    if (isCashier) router.replace(ROUTES.DASHBOARD_MENU);
  }, [isCashier, router]);

  if (isCashier) return null;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-zinc-50/50">
      <DashboardPageHeader />
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="space-y-6">
          {saveError && (
            <div
              role="alert"
              className="rounded-xl border border-[#FFE6EB] bg-[#FFF1F2] px-4 py-3 text-sm font-medium text-[#EC003F]"
            >
              {saveError}
              <button
                type="button"
                onClick={() => setSaveError(null)}
                className="ml-2 underline focus:outline-none focus:ring-2 focus:ring-[#EC003F]/20"
              >
                Dismiss
              </button>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[24px] font-bold text-[#1D293D]">User Management</h1>
              <p className="mt-1 text-[14px] text-[#62748E]">
                Manage system access roles and permissions
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setSelectedUser(null);
                  setSaveError(null);
                  setIsAddModalOpen(true);
                }}
                className="flex h-11 items-center gap-2 rounded-xl bg-[#EA580C] cursor-pointer px-5 text-[14px] font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98]"
              >
                <UserPlus className="h-4 w-4" />
                Add New User
              </button>
            </div>
          </div>

          <div className="relative w-full">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#90A1B9]" />
              <input
                type="text"
                placeholder="Search users by name, role or status..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-14 w-full rounded-[20px] border border-[#E2E8F0] bg-white pl-12 pr-4 text-[14px] text-[#1D293D] outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/5"
              />
            </div>
          </div>

          <UserTable
            searchTerm={searchTerm}
            users={users}
            isLoading={isUsersLoading}
            onEdit={handleEditUserClick}
            onToggleStatus={handleToggleStatus}
          />
        </div>
      </div>

      {isAddModalOpen && (
        <AddUserModal
          onClose={() => {
            setIsAddModalOpen(false);
            setSelectedUser(null);
            setSaveError(null);
          }}
          onAdd={handleSaveUser}
          initialData={selectedUser}
        />
      )}

      {/* ConfirmModal removed for activation/deactivation as it's a toggle */}
    </div>
  );
}
