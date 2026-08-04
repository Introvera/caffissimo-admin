import { baseApi } from "./baseApi";
import {
  FridgeTemperatureReportResponse,
  FridgeTemperatureQueryParams,
  CreateFridgeTemperatureReportRequest,
  PagedResult,
} from "@/types";

export const fridgeApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getFridgeReports: builder.query<PagedResult<FridgeTemperatureReportResponse>, FridgeTemperatureQueryParams | void>({
      query: (params) => ({
        url: "/api/fridge-temperatures",
        params: params || undefined,
      }),
      providesTags: ["FridgeReport"],
    }),

    createFridgeReport: builder.mutation<FridgeTemperatureReportResponse, CreateFridgeTemperatureReportRequest>({
      query: (data) => ({
        url: "/api/fridge-temperatures",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["FridgeReport"],
    }),
  }),
});

export const {
  useGetFridgeReportsQuery,
  useCreateFridgeReportMutation,
} = fridgeApi;
