"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useQueries } from "@tanstack/react-query";
import DashboardPageHeader from "@/components/dashboard/DashboardPageHeader";
import ExtraFeeTabs from "@/components/extra-fee/ExtraFeeTabs";
import AddDeliveryFeeModal from "@/components/extra-fee/AddDeliveryFeeModal";
import AddServiceChargeModal from "@/components/extra-fee/AddServiceChargeModal";
import DeliveryFeeBranchSection from "@/components/extra-fee/DeliveryFeeBranchSection";
import ServiceChargeCard from "@/components/extra-fee/ServiceChargeCard";
import ConfirmModal from "@/components/ui/ConfirmModal";
import type {
  BranchOption,
  DeliveryFeeItem,
  ExtraFeeTabId,
  ServiceChargeItem,
} from "@/domains/extra-fee/types";
import { useAuth } from "@/contexts/AuthContext";
import { ROUTES } from "@/lib/constants";
import { useGetAllBranches } from "@/hooks/useBranch";
import {
  useCreateDeliveryCharge,
  useDeactivateDeliveryCharge,
  useDeliveryCharges,
  useUpdateDeliveryCharge,
} from "@/hooks/useDeliveryCharge";
import { toast } from "sonner";
import type { AxiosError } from "axios";
import { useUpsertServiceCharge } from "@/hooks/useServiceCharge";
import * as serviceChargeService from "@/services/serviceChargeService";

function normalizeBranchLocation(location: string | null | undefined): string {
  return location?.trim() || "Location not set";
}

export default function ExtraFeeContent() {
  const router = useRouter();
  const { isCashier } = useAuth();
  const { data: branches = [] } = useGetAllBranches("active");

  const [activeTab, setActiveTab] = useState<ExtraFeeTabId>("delivery");
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDeliveryModalOpen, setIsAddDeliveryModalOpen] = useState(false);
  const [isAddServiceModalOpen, setIsAddServiceModalOpen] = useState(false);
  const [editingDeliveryFee, setEditingDeliveryFee] = useState<DeliveryFeeItem | null>(null);
  const [editingServiceCharge, setEditingServiceCharge] = useState<ServiceChargeItem | null>(null);
  const [deliveryFeeToDelete, setDeliveryFeeToDelete] = useState<DeliveryFeeItem | null>(null);
  const [serviceChargeToDelete, setServiceChargeToDelete] = useState<ServiceChargeItem | null>(null);
  const { data: deliveryCharges = [], isLoading: deliveryChargesLoading } = useDeliveryCharges();
  const createDeliveryChargeMutation = useCreateDeliveryCharge();
  const updateDeliveryChargeMutation = useUpdateDeliveryCharge();
  const deactivateDeliveryChargeMutation = useDeactivateDeliveryCharge();
  const upsertServiceChargeMutation = useUpsertServiceCharge();

  useEffect(() => {
    if (isCashier) router.replace(ROUTES.DASHBOARD_MENU);
  }, [isCashier, router]);

  const branchOptions: BranchOption[] = useMemo(() => {
    if (branches.length > 0) {
      return branches.map((b) => ({
        id: b.id,
        name: b.name,
        location: normalizeBranchLocation(b.location),
      }));
    }
    return [];
  }, [branches]);

  const branchById = useMemo(() => {
    return new Map(branchOptions.map((b) => [b.id, b]));
  }, [branchOptions]);
  const serviceChargeQueries = useQueries({
    queries: branchOptions.map((branch) => ({
      queryKey: ["service-charge", "branch", branch.id],
      queryFn: () => serviceChargeService.getServiceCharge(branch.id),
      enabled: activeTab === "service",
      staleTime: 2 * 60 * 1000,
    })),
  });

  const deliveryFees = useMemo<DeliveryFeeItem[]>(() => {
    return deliveryCharges.flatMap((charge) => {
      const links = Array.isArray(charge.branches) ? charge.branches : [];
      return links.map((link) => {
        const branchId = link.branchId ?? link.branch?.id ?? 0;
        const branchMeta = branchById.get(branchId);
        const amountNumber = Number(charge.amount);
        return {
          id: charge.id,
          branchId,
          branchName: link.branch?.name ?? branchMeta?.name ?? `Branch ${branchId}`,
          branchLocation: normalizeBranchLocation(link.branch?.location ?? branchMeta?.location),
          zoneName: charge.title,
          price: Number.isFinite(amountNumber) ? amountNumber : 0,
          addedOn: charge.createdAt ?? charge.updatedAt ?? new Date().toISOString().slice(0, 10),
        };
      });
    });
  }, [deliveryCharges, branchById]);

  const filteredDeliveryFees = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return deliveryFees;
    return deliveryFees.filter(
      (fee) =>
        fee.zoneName.toLowerCase().includes(q) ||
        fee.branchName.toLowerCase().includes(q) ||
        fee.branchLocation.toLowerCase().includes(q)
    );
  }, [deliveryFees, searchTerm]);

  const deliveryGroups = useMemo(() => {
    const groups = new Map<
      string,
      { branchId: number; branchName: string; branchLocation: string; fees: DeliveryFeeItem[] }
    >();

    filteredDeliveryFees.forEach((fee) => {
      const branchMeta = branchById.get(fee.branchId);
      const branchName = branchMeta?.name ?? fee.branchName;
      const branchLocation = branchMeta?.location ?? fee.branchLocation;
      const key = `${fee.branchId}-${branchName}`;
      const existing = groups.get(key);
      if (existing) {
        existing.fees.push(fee);
      } else {
        groups.set(key, { branchId: fee.branchId, branchName, branchLocation, fees: [fee] });
      }
    });

    return Array.from(groups.values()).sort((a, b) => a.branchName.localeCompare(b.branchName));
  }, [filteredDeliveryFees, branchById]);

  const filteredServiceCharges = useMemo(() => {
    const serviceCharges = branchOptions.map((branch, index) => {
      const result = serviceChargeQueries[index]?.data;
      const percentageRaw = Number(result?.percentage ?? 0);
      const percentage = Number.isFinite(percentageRaw) ? percentageRaw : 0;
      const addedOn = result?.updated_at ?? result?.created_at ?? "";
      return {
        id: result?.id ?? branch.id,
        branchId: branch.id,
        title: branch.name,
        location: branch.location,
        rate: percentage,
        addedOn,
      } as ServiceChargeItem;
    });
    const configuredServiceCharges = serviceCharges.filter((item) => item.rate > 0);

    const q = searchTerm.trim().toLowerCase();
    if (!q) return configuredServiceCharges;
    return configuredServiceCharges.filter(
      (item) => item.title.toLowerCase().includes(q) || item.location.toLowerCase().includes(q)
    );
  }, [branchOptions, searchTerm, serviceChargeQueries]);
  const serviceChargesLoading =
    activeTab === "service" &&
    branchOptions.length > 0 &&
    serviceChargeQueries.some((query) => query.isLoading);

  const getApiErrorMessage = (error: unknown, fallback: string) => {
    const axiosError = error as AxiosError<{ message?: string }>;
    return axiosError?.response?.data?.message || fallback;
  };

  if (isCashier) return null;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#F8FAFC]">
      <DashboardPageHeader />
      <div className="flex-1 overflow-y-auto">
        <div className="bg-white border-b border-[#E2E8F0]">
          <div className="px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
            <div>
              <h1 className="font-['Inter'] text-[24px] font-bold leading-8 text-[#1D293D]">
                Additional Fees
              </h1>
              <p className="mt-1 font-['Inter'] text-[14px] leading-5 text-[#62748E]">
                Manage delivery fees and service charges for branches
              </p>
            </div>

            <div className="mt-6">
              <ExtraFeeTabs activeTab={activeTab} onTabChange={setActiveTab} />
            </div>
          </div>
        </div>

        <div className="space-y-6 p-4 sm:p-6 lg:p-8">
          <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative w-full flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#90A1B9]" />
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={
                  activeTab === "delivery" ? "Search delivery fees..." : "Search service charges..."
                }
                className="h-11 w-full rounded-[14px] border border-[#E2E8F0] bg-white py-2.5 pl-10 pr-4 font-['Inter'] text-sm text-[#1D293D] placeholder:text-[#90A1B9] focus:border-[#EA580C] focus:outline-none focus:ring-1 focus:ring-[#EA580C]"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                if (activeTab === "delivery") {
                  setEditingDeliveryFee(null);
                  setIsAddDeliveryModalOpen(true);
                } else {
                  setEditingServiceCharge(null);
                  setIsAddServiceModalOpen(true);
                }
              }}
              className="flex h-11 shrink-0 items-center gap-2 self-start rounded-[14px] bg-[#EA580C] px-4 font-['Inter'] text-sm font-bold text-white shadow-[0px_1px_2px_-1px_#0000001A,0px_1px_3px_0px_#0000001A] transition-opacity hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              {activeTab === "delivery" ? "Add Delivery Fee" : "Add Service Charge"}
            </button>
          </div>

          {activeTab === "delivery" ? (
            <div className="space-y-4">
              {deliveryChargesLoading ? (
                <div className="rounded-[14px] border border-[#E2E8F0] bg-white p-10 text-center">
                  <p className="font-['Inter'] text-base font-medium text-[#45556C]">
                    Loading delivery fees...
                  </p>
                </div>
              ) : deliveryGroups.length === 0 ? (
                <div className="rounded-[14px] border border-[#E2E8F0] bg-white p-10 text-center">
                  <p className="font-['Inter'] text-base font-medium text-[#45556C]">
                    No delivery fees found
                  </p>
                  <p className="mt-1 font-['Inter'] text-sm text-[#90A1B9]">
                    Try another search or add a new delivery fee.
                  </p>
                </div>
              ) : (
                deliveryGroups.map((group) => (
                  <DeliveryFeeBranchSection
                    key={`${group.branchId}-${group.branchName}`}
                    branchName={group.branchName}
                    branchLocation={group.branchLocation}
                    fees={group.fees}
                    onEdit={(fee) => {
                      setEditingDeliveryFee(fee);
                      setIsAddDeliveryModalOpen(true);
                    }}
                    onDelete={async (fee) => {
                      setDeliveryFeeToDelete(fee);
                    }}
                  />
                ))
              )}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {serviceChargesLoading && (
                <div className="col-span-full rounded-[14px] border border-[#E2E8F0] bg-white p-10 text-center">
                  <p className="font-['Inter'] text-base font-medium text-[#45556C]">
                    Loading service charges...
                  </p>
                </div>
              )}
              {!serviceChargesLoading &&
                filteredServiceCharges.map((item) => (
                  <ServiceChargeCard
                    key={item.id}
                    item={item}
                    onEdit={(selected) => {
                      setEditingServiceCharge(selected);
                      setIsAddServiceModalOpen(true);
                    }}
                    onDelete={(selected) => {
                      setServiceChargeToDelete(selected);
                    }}
                  />
                ))}
              {!serviceChargesLoading && filteredServiceCharges.length === 0 && (
                <div className="col-span-full rounded-[14px] border border-[#E2E8F0] bg-white p-10 text-center">
                  <p className="font-['Inter'] text-base font-medium text-[#45556C]">
                    No service charge records found
                  </p>
                  <p className="mt-1 font-['Inter'] text-sm text-[#90A1B9]">
                    Try another search query.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {isAddDeliveryModalOpen && (
        <AddDeliveryFeeModal
          isOpen={isAddDeliveryModalOpen}
          branches={branchOptions}
          editingFee={editingDeliveryFee}
          onClose={() => {
            setIsAddDeliveryModalOpen(false);
            setEditingDeliveryFee(null);
          }}
          onSubmit={({ branchId, feeName, price }) => {
            const branch = branchById.get(branchId);
            if (!branch) return;
            void (async () => {
              try {
                if (editingDeliveryFee) {
                  await updateDeliveryChargeMutation.mutateAsync({
                    id: editingDeliveryFee.id,
                    body: {
                      title: feeName,
                      amount: price,
                      branches: [branch.id],
                      branchId: branch.id,
                    },
                  });
                  toast.success("Delivery fee updated");
                  return;
                }

                await createDeliveryChargeMutation.mutateAsync({
                  title: feeName,
                  amount: price,
                  branches: [branch.id],
                  branchId: branch.id,
                });
                toast.success("Delivery fee created");
              } catch (error) {
                toast.error(getApiErrorMessage(error, "Failed to save delivery fee"));
              }
            })();
          }}
        />
      )}

      {isAddServiceModalOpen && (
        <AddServiceChargeModal
          isOpen={isAddServiceModalOpen}
          branches={branchOptions}
          initialCharge={editingServiceCharge}
          onClose={() => {
            setIsAddServiceModalOpen(false);
            setEditingServiceCharge(null);
          }}
          onSubmit={({ branchId, percentage, chargeId }) => {
            void (async () => {
              try {
                await upsertServiceChargeMutation.mutateAsync({
                  percentage,
                  branchId,
                });
                toast.success(chargeId ? "Service charge updated" : "Service charge saved");
              } catch (error) {
                toast.error(getApiErrorMessage(error, "Failed to save service charge"));
              }
            })();
          }}
        />
      )}

      <ConfirmModal
        isOpen={!!deliveryFeeToDelete}
        onClose={() => setDeliveryFeeToDelete(null)}
        onConfirm={async () => {
          if (!deliveryFeeToDelete) return;
          try {
            await deactivateDeliveryChargeMutation.mutateAsync(deliveryFeeToDelete.id);
            toast.success("Delivery fee deactivated");
          } catch (error) {
            toast.error(getApiErrorMessage(error, "Failed to deactivate delivery fee"));
          } finally {
            setDeliveryFeeToDelete(null);
          }
        }}
        title="Delete Delivery Fee"
        message={
          deliveryFeeToDelete
            ? `Are you sure you want to delete "${deliveryFeeToDelete.zoneName}"?`
            : ""
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
      />

      <ConfirmModal
        isOpen={!!serviceChargeToDelete}
        onClose={() => setServiceChargeToDelete(null)}
        onConfirm={async () => {
          if (!serviceChargeToDelete) return;
          try {
            await upsertServiceChargeMutation.mutateAsync({
              branchId: serviceChargeToDelete.branchId,
              percentage: 0,
            });
            toast.success("Service charge deleted");
          } catch (error) {
            toast.error(getApiErrorMessage(error, "Failed to delete service charge"));
          } finally {
            setServiceChargeToDelete(null);
          }
        }}
        title="Delete Service Charge"
        message={
          serviceChargeToDelete
            ? `Are you sure you want to delete service charge for "${serviceChargeToDelete.title}"?`
            : ""
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
      />
    </div>
  );
}
