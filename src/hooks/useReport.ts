import { useMutation } from "@tanstack/react-query";
import * as reportService from "@/services/reportService";
import type { GetReportParams } from "@/services/reportService";

export const useGenerateReport = () => {
  return useMutation({
    mutationFn: (params: GetReportParams) => {
      const { reportTypePath, ...queryParams } = params;
      switch (reportTypePath) {
        case "sales":
          return reportService.getSalesReport(queryParams);
        case "orders":
          return reportService.getOrdersReport(queryParams);
        case "payments":
          return reportService.getPaymentsReport(queryParams);
        case "product-performance":
          return reportService.getProductPerformanceReport(queryParams);
        case "products":
          return reportService.getProductsReport(queryParams);
        default:
          throw new Error(`Unsupported report type: ${reportTypePath}`);
      }
    },
  });
};
