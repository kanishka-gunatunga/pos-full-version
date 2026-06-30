"use client";

import { useState } from "react";
import { User as UserIcon, Mail, Key, Pencil, Power, PowerOff, Loader2 } from "lucide-react";
import type { User, UserRole } from "@/types/user";
import { useGetUserPasscode } from "@/hooks/useUser";

interface UserTableProps {
  searchTerm: string;
  users: User[];
  isLoading: boolean;
  onEdit: (user: User) => void;
  onToggleStatus: (user: User) => void;
}

function PasscodeCell({ user }: { user: User }) {
  const [isRevealed, setIsRevealed] = useState(false);
  const isPrivileged = user.role === "admin" || user.role === "manager";

  const { data, isLoading, isError } = useGetUserPasscode(
    isPrivileged && isRevealed ? user.id : undefined
  );

  const handleHold = () => {
    if (isPrivileged) setIsRevealed(true);
  };

  const handleRelease = () => {
    setIsRevealed(false);
  };

  if (!isPrivileged) {
    return <span className="text-[#90A1B9] italic text-[12px]">N/A</span>;
  }

  return (
    <div
      className="flex items-center gap-2 text-[14px] text-[#45556C] font-medium cursor-pointer select-none"
      onMouseDown={handleHold}
      onMouseUp={handleRelease}
      onMouseLeave={handleRelease}
      onTouchStart={handleHold}
      onTouchEnd={handleRelease}
    >
      <Key className="h-3.5 w-3.5 text-[#90A1B9]" />
      <span className="bg-[#F1F5F9] px-2 py-1 rounded-md text-[12px] font-bold min-w-[48px] text-center">
        {isLoading ? (
          <Loader2 className="h-3 w-3 animate-spin mx-auto" />
        ) : isRevealed && data?.passcode ? (
          data.passcode
        ) : isError ? (
          "Error"
        ) : (
          "******"
        )}
      </span>
    </div>
  );
}

export default function UserTable({ searchTerm, users = [], isLoading, onEdit, onToggleStatus }: UserTableProps) {
  const displayUsers = users || [];

  const getRoleBadgeStyle = (role: UserRole) => {
    switch (role) {
      case "admin":
        return "bg-[#F3E8FF] text-[#A855F7] uppercase";
      case "manager":
        return "bg-[#DBEAFE] text-[#3B82F6] uppercase";
      case "cashier":
        return "bg-[#F1F5F9] text-[#64748B] uppercase";
      case "kitchen":
        return "bg-[#ECFDF5] text-[#10B981] uppercase";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  return (
    <div className="overflow-hidden rounded-[20px] border border-[#E2E8F0] bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#F1F5F9] bg-[#F8FAFC]">
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-[#90A1B9]">
                USER
              </th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-[#90A1B9]">
                ROLE
              </th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-[#90A1B9]">
                CONTACT
              </th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-[#90A1B9]">
                SECURITY
              </th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-[#90A1B9]">
                STATUS
              </th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-[#90A1B9] text-right">
                ACTIONS
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F1F5F9]">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    <p className="text-[14px] font-medium text-[#62748E]">Loading users...</p>
                  </div>
                </td>
              </tr>
            ) : displayUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <p className="text-[14px] font-medium text-[#62748E]">
                    {searchTerm ? "No users match your search" : "No users found in the system"}
                  </p>
                </td>
              </tr>
            ) : (
              displayUsers.map((user) => (
                <tr
                  key={user.id}
                  className="group hover:bg-[#F8FAFC] transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center border border-[#F1F5F9] justify-center rounded-full bg-[#F8FAFC] text-[#90A1B9]">
                        <UserIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-[14px] font-bold text-[#314158]">{user.name}</p>
                        <p className="text-[10px] text-[#90A1B9]">ID: {user.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-extrabold ${getRoleBadgeStyle(
                        user.role
                      )}`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-[14px] text-[#45556C] font-semibold">
                      <Mail className="h-3.5 w-3.5 text-[#90A1B9]" />
                      {user.email || "N/A"}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <PasscodeCell user={user} />
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-extrabold uppercase ${user.status === "active"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                        }`}
                    >
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 text-[#90A1B9]">
                      <button
                        onClick={() => onEdit(user)}
                        className="flex h-8 w-8 items-center cursor-pointer justify-center rounded-xl border border-[#E2E8F0] hover:bg-white hover:text-primary transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => onToggleStatus(user)}
                        title={user.status === "active" ? "Deactivate User" : "Activate User"}
                        className={`flex h-8 w-8 items-center cursor-pointer justify-center rounded-xl border border-[#E2E8F0] transition-colors ${user.status === "active"
                          ? "hover:bg-red-50 hover:text-red-500"
                          : "hover:bg-green-50 hover:text-green-500"
                          }`}
                      >
                        {user.status === "active" ? (
                          <PowerOff className="h-3.5 w-3.5" />
                        ) : (
                          <Power className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
