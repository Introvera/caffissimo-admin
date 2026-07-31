import { baseApi } from "./baseApi";
import {
  SpecialDayResponse,
  SpecialDayCategoryOption,
  CreateSpecialDayRequest,
  UpdateSpecialDayRequest,
  PagedResult,
} from "@/types";

export interface SpecialDayListParams {
  page?: number;
  pageSize?: number;
  isActive?: boolean;
  category?: string;
  validAsOf?: string;
  startDateFrom?: string;
  startDateTo?: string;
  sortBy?: string;
  sortDescending?: boolean;
}

export const specialDayApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSpecialDays: builder.query<PagedResult<SpecialDayResponse>, SpecialDayListParams | void>({
      query: (params) => ({
        url: "/api/special-days",
        params: params || undefined,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ specialDayId }) => ({ type: "SpecialDay" as const, id: specialDayId })),
              { type: "SpecialDay", id: "LIST" },
            ]
          : [{ type: "SpecialDay", id: "LIST" }],
    }),

    getSpecialDayCategories: builder.query<SpecialDayCategoryOption[], void>({
      query: () => "/api/special-days/categories",
    }),

    createSpecialDay: builder.mutation<SpecialDayResponse, CreateSpecialDayRequest>({
      query: (data) => ({
        url: "/api/special-days",
        method: "POST",
        body: data,
      }),
      invalidatesTags: [{ type: "SpecialDay", id: "LIST" }],
    }),

    updateSpecialDay: builder.mutation<SpecialDayResponse, { id: string; data: UpdateSpecialDayRequest }>({
      query: ({ id, data }) => ({
        url: `/api/special-days/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "SpecialDay", id },
        { type: "SpecialDay", id: "LIST" },
      ],
    }),

    deleteSpecialDay: builder.mutation<void, string>({
      query: (id) => ({
        url: `/api/special-days/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "SpecialDay", id },
        { type: "SpecialDay", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetSpecialDaysQuery,
  useGetSpecialDayCategoriesQuery,
  useCreateSpecialDayMutation,
  useUpdateSpecialDayMutation,
  useDeleteSpecialDayMutation,
} = specialDayApi;
