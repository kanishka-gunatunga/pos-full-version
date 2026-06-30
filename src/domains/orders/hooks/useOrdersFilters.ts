import { useState, useMemo, useEffect } from "react";
import type { OrderRow, OrderStatus, PaymentStatus } from "../types";
import { mapOrderToRow } from "../types";
import { useGetAllOrders, useSearchOrders, useFilterOrders } from "@/hooks/useOrder";
import type { OrderFilterParams, OrderSearchParams } from "@/types/order";

const DEFAULT_PAGE_SIZE = 25;

export function useOrdersFilters() {
  const [search, setSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState<OrderStatus | "All">("All");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<PaymentStatus | "All">("All");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [onlyMyOrders, setOnlyMyOrders] = useState(false);

  useEffect(() => {
    setPage(1);
  }, [search, orderStatusFilter, paymentStatusFilter, onlyMyOrders, pageSize]);

  const listQuery = useMemo(
    () => ({
      page,
      pageSize,
      placedByMe: onlyMyOrders,
    }),
    [page, pageSize, onlyMyOrders]
  );

  const isSearching = !!search.trim();
  const isFiltering = orderStatusFilter !== "All" || paymentStatusFilter !== "All";

  const { data: allPage, isLoading: isLoadingAll } = useGetAllOrders(
    listQuery,
    !isSearching && !isFiltering
  );

  const searchParams = useMemo<OrderSearchParams>(
    () => ({
      q: search.trim() || undefined,
      ...listQuery,
    }),
    [search, listQuery]
  );
  const { data: searchPage, isLoading: isLoadingSearch } = useSearchOrders(searchParams);

  const filterParams = useMemo<OrderFilterParams>(
    () => ({
      status: orderStatusFilter !== "All" ? orderStatusFilter : undefined,
      paymentStatus: paymentStatusFilter !== "All" ? paymentStatusFilter : undefined,
      ...listQuery,
    }),
    [orderStatusFilter, paymentStatusFilter, listQuery]
  );
  const { data: filteredPage, isLoading: isLoadingFilter } = useFilterOrders(filterParams);

  const activePage = isSearching ? searchPage : isFiltering ? filteredPage : allPage;
  const ordersData = activePage?.data ?? [];
  const listMeta = activePage?.meta;

  const filteredOrders = useMemo(() => ordersData.map(mapOrderToRow), [ordersData]);

  const isLoading = isLoadingAll || isLoadingSearch || isLoadingFilter;

  return {
    search,
    setSearch,
    orderStatusFilter,
    setOrderStatusFilter,
    paymentStatusFilter,
    setPaymentStatusFilter,
    page,
    setPage,
    pageSize,
    setPageSize,
    onlyMyOrders,
    setOnlyMyOrders,
    listMeta,
    filteredOrders,
    isLoading,
  };
}
