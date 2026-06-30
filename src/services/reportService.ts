import axiosInstance from "@/lib/api/axiosInstance";

export interface GetReportParams {
  startDate: string;
  endDate: string;
  branch: string | number;
  reportTypePath: string;
  product?: string;
  export?: string;
  print?: boolean;
}

export const getSalesReport = async (params: Omit<GetReportParams, "reportTypePath">): Promise<any> => {
  const res = await axiosInstance.get("/reports/sales", { params });
  return res.data;
};

export const getOrdersReport = async (params: Omit<GetReportParams, "reportTypePath">): Promise<any> => {
  const res = await axiosInstance.get("/reports/orders", { params });
  return res.data;
};

export const getPaymentsReport = async (params: Omit<GetReportParams, "reportTypePath">): Promise<any> => {
  const res = await axiosInstance.get("/reports/payments", { params });
  return res.data;
};

export const getProductPerformanceReport = async (params: Omit<GetReportParams, "reportTypePath">): Promise<any> => {
  const res = await axiosInstance.get("/reports/product-performance", { params });
  return res.data;
};

export const getItemizedSalesReport = async (params: Omit<GetReportParams, "reportTypePath">): Promise<any> => {
  const res = await axiosInstance.get("/reports/itemized-sales", { params });
  return res.data;
};

export const getProductsReport = async (params: Omit<GetReportParams, "reportTypePath">): Promise<any> => {
  const res = await axiosInstance.get("/reports/products", { params });
  return res.data;
};
