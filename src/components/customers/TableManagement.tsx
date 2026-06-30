"use client";

import { useState, useEffect } from "react";
import { Search, Plus, Edit2, Trash2, CheckCircle, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { useGetTables, useCreateTable, useUpdateTable, useDeleteTable } from "@/hooks/useTable";
import { Table, TableStatus } from "@/types/table";
import AddTableModal from "./AddTableModal";

export default function TableManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: tables = [], isLoading } = useGetTables(debouncedSearch);
  const createMutation = useCreateTable();
  const updateMutation = useUpdateTable();
  const deleteMutation = useDeleteTable();

  const handleSaveTable = async (data: { table_name: string; status: TableStatus }) => {
    try {
      if (selectedTable) {
        await updateMutation.mutateAsync({ id: selectedTable.id, data });
        toast.success("Table updated successfully");
      } else {
        await createMutation.mutateAsync(data);
        toast.success("Table created successfully");
      }
      setIsAddModalOpen(false);
      setSelectedTable(null);
    } catch (error) {
      toast.error("Failed to save table");
    }
  };

  const handleDeleteTable = async (id: number) => {
    if (confirm("Are you sure you want to delete this table?")) {
      try {
        await deleteMutation.mutateAsync(id);
        toast.success("Table deleted successfully");
      } catch (error) {
        toast.error("Failed to delete table");
      }
    }
  };

  const handleToggleStatus = async (table: Table, status: TableStatus) => {
    try {
      await updateMutation.mutateAsync({ id: table.id, data: { status } });
      toast.success(`Table marked as ${status}`);
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const getStatusColor = (status: TableStatus) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-700";
      case "unavailable":
        return "bg-red-100 text-red-700";
      case "reserved":
        return "bg-orange-100 text-orange-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[20px] font-bold text-[#1D293D]">Table Management</h2>
          <p className="text-[14px] text-[#62748E]">Manage your restaurant tables and their availability.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:min-w-[300px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#90A1B9]" />
            <input
              type="text"
              placeholder="Search by table name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-11 w-full text-[#1D293D] rounded-xl border border-[#E2E8F0] bg-white pl-10 pr-4 text-[14px] outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
          </div>
          <button
            onClick={() => {
              setSelectedTable(null);
              setIsAddModalOpen(true);
            }}
            className="flex h-11 items-center gap-2 rounded-xl bg-[#EA580C] cursor-pointer px-5 text-[14px] font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            Add Table
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {tables.map((table) => (
            <div
              key={table.id}
              className="group relative overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm transition-all hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F8FAFC] text-[18px] font-bold text-[#1D293D]">
                  {table.table_name.match(/\d+/) ? table.table_name.match(/\d+/)?.[0] : table.table_name.substring(0, 2)}
                </div>
                <span className={`rounded-full px-3 py-1 text-[12px] font-bold capitalize ${getStatusColor(table.status)}`}>
                  {table.status}
                </span>
              </div>

              <div className="mt-4">
                <h3 className="text-[16px] font-bold text-[#1D293D]">{table.table_name}</h3>
                <p className="text-[12px] text-[#90A1B9]">ID: #{table.id}</p>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-[#F1F5F9] pt-4">
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedTable(table);
                      setIsAddModalOpen(true);
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-[#62748E] hover:bg-[#F8FAFC] hover:text-[#1D293D]"
                    title="Edit"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteTable(table.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-[#62748E] hover:bg-red-50 hover:text-red-600"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex gap-2">
                  {table.status !== "available" && (
                    <button
                      onClick={() => handleToggleStatus(table, "available")}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50 text-green-600 hover:bg-green-100"
                      title="Mark as Available"
                    >
                      <CheckCircle className="h-4 w-4" />
                    </button>
                  )}
                  {table.status !== "reserved" && (
                    <button
                      onClick={() => handleToggleStatus(table, "reserved")}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 text-orange-600 hover:bg-orange-100"
                      title="Mark as Reserved"
                    >
                      <Clock className="h-4 w-4" />
                    </button>
                  )}
                  {table.status !== "unavailable" && (
                    <button
                      onClick={() => handleToggleStatus(table, "unavailable")}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
                      title="Mark as Unavailable"
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {tables.length === 0 && (
            <div className="col-span-full flex h-64 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#E2E8F0] bg-[#F8FAFC] text-[#90A1B9]">
              <Plus className="mb-2 h-10 w-10 opacity-20" />
              <p>No tables found.</p>
            </div>
          )}
        </div>
      )}

      {isAddModalOpen && (
        <AddTableModal
          onClose={() => {
            setIsAddModalOpen(false);
            setSelectedTable(null);
          }}
          onSave={handleSaveTable}
          initialData={selectedTable}
        />
      )}
    </div>
  );
}
