import { baseApi } from "./baseApi";
import {
  DashboardStatsParams,
  DashboardStatsResponse,
  SalesReportParams,
  SalesReportResponse,
} from "@/types";

export const analyticsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardStats: builder.query<DashboardStatsResponse, DashboardStatsParams>({
      query: (params) => ({
        url: "/api/dashboard/stats",
        params: {
          startDate: params.startDate,
          endDate: params.endDate,
          branchId: params.branchId || undefined,
        },
      }),
      providesTags: ["Order"],
    }),

    getSalesReport: builder.query<SalesReportResponse, SalesReportParams>({
      query: (params) => ({
        url: "/api/reports/sales",
        params: {
          orderDateFrom: params.orderDateFrom,
          orderDateTo: params.orderDateTo,
          branchId: params.branchId || undefined,
        },
      }),
      providesTags: ["Order"],
    }),
  }),
});

export const {
  useGetDashboardStatsQuery,
  useGetSalesReportQuery,
} = analyticsApi;
