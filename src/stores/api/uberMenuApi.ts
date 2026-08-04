import { baseApi } from "./baseApi";
import {
  UberMenu,
  UberMenuSummary,
  UberMenuSyncResponse,
  CreateUberMenuRequest,
  UpdateUberMenuRequest,
  PagedResult,
  PaginationParams,
} from "@/types";

export const uberMenuApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // GET /api/uber-menus  (paged)
    getUberMenus: builder.query<PagedResult<UberMenuSummary>, PaginationParams | void>({
      query: (params) => ({
        url: "/api/uber-menus",
        params: params || undefined,
      }),
      providesTags: ["UberMenu"],
    }),

    // GET /api/uber-menus/{id}?branchId={branchId}
    getUberMenuById: builder.query<UberMenu, { id: string; branchId: string }>({
      query: ({ id, branchId }) => ({
        url: `/api/uber-menus/${id}`,
        params: { branchId },
      }),
      providesTags: (result, error, { id }) => [{ type: "UberMenu", id }],
    }),

    // POST /api/uber-menus
    createUberMenu: builder.mutation<UberMenu, CreateUberMenuRequest>({
      query: (data) => ({
        url: "/api/uber-menus",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["UberMenu"],
    }),

    // PUT /api/uber-menus/{id}
    updateUberMenu: builder.mutation<UberMenu, { id: string; data: UpdateUberMenuRequest }>({
      query: ({ id, data }) => ({
        url: `/api/uber-menus/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "UberMenu", id }, "UberMenu"],
    }),

    // DELETE /api/uber-menus/{id}?branchId={branchId}
    deleteUberMenu: builder.mutation<void, { id: string; branchId: string }>({
      query: ({ id, branchId }) => ({
        url: `/api/uber-menus/${id}`,
        method: "DELETE",
        params: { branchId },
      }),
      invalidatesTags: ["UberMenu"],
    }),

    // POST /api/uber-menus/{id}/sync?branchId={branchId}
    syncUberMenu: builder.mutation<UberMenuSyncResponse, { id: string; branchId: string }>({
      query: ({ id, branchId }) => ({
        url: `/api/uber-menus/${id}/sync`,
        method: "POST",
        params: { branchId },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "UberMenu", id }],
    }),
  }),
});

export const {
  useGetUberMenusQuery,
  useGetUberMenuByIdQuery,
  useCreateUberMenuMutation,
  useUpdateUberMenuMutation,
  useDeleteUberMenuMutation,
  useSyncUberMenuMutation,
} = uberMenuApi;
