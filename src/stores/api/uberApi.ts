import { baseApi } from "./baseApi";
import {
  BranchProductCatalogItem,
  CreateUberMenuRequest,
  PagedResult,
  PaginationParams,
  PlatformCode,
  UpdateUberMenuRequest,
  UberMenu,
  UberMenuSummary,
  UberMenuSyncResponse,
  UberOrderWebhookReceiveResponse,
  UberOrderStagingSummary,
  UberOrderStagingDetail,
  UberOrderActionResult,
} from "@/types";

interface UberMenuListParams extends PaginationParams {
  branchId?: string;
  platformCode?: PlatformCode;
  isActive?: boolean;
}

interface BranchProductListParams extends PaginationParams {
  branchId?: string;
  productId?: string;
  isAvailable?: boolean;
  isActive?: boolean;
  sortBy?: string;
  sortDescending?: boolean;
}

interface SendUberOrderWebhookEventRequest {
  payload: Record<string, unknown>;
  connectionKey?: string;
}

interface UberOrderListParams extends PaginationParams {
  branchId?: string;
  status?: string;
  search?: string;
}

export const uberApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUberMenus: builder.query<PagedResult<UberMenuSummary>, UberMenuListParams | void>({
      query: (params) => ({
        url: "/api/uber-menus",
        params: {
          platformCode: "UberEats",
          ...(params ?? {}),
        },
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map((item) => ({
                type: "UberMenu" as const,
                id: item.uberMenuId,
              })),
              { type: "UberMenu" as const, id: "LIST" },
            ]
          : [{ type: "UberMenu" as const, id: "LIST" }],
    }),
    getUberMenuById: builder.query<UberMenu, { id: string; branchId: string }>({
      query: ({ id, branchId }) => ({
        url: `/api/uber-menus/${id}`,
        params: { branchId },
      }),
      providesTags: (result, error, arg) => [
        { type: "UberMenu" as const, id: arg.id },
      ],
    }),
    createUberMenu: builder.mutation<UberMenu, CreateUberMenuRequest>({
      query: (body) => ({
        url: "/api/uber-menus",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "UberMenu" as const, id: "LIST" }],
    }),
    updateUberMenu: builder.mutation<
      UberMenu,
      { id: string; data: UpdateUberMenuRequest }
    >({
      query: ({ id, data }) => ({
        url: `/api/uber-menus/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, arg) => [
        { type: "UberMenu" as const, id: arg.id },
        { type: "UberMenu" as const, id: "LIST" },
      ],
    }),
    deleteUberMenu: builder.mutation<void, { id: string; branchId: string }>({
      query: ({ id, branchId }) => ({
        url: `/api/uber-menus/${id}`,
        method: "DELETE",
        params: { branchId },
      }),
      invalidatesTags: (result, error, arg) => [
        { type: "UberMenu" as const, id: arg.id },
        { type: "UberMenu" as const, id: "LIST" },
      ],
    }),
    syncUberMenu: builder.mutation<
      UberMenuSyncResponse,
      { id: string; branchId: string }
    >({
      query: ({ id, branchId }) => ({
        url: `/api/uber-menus/${id}/sync`,
        method: "POST",
        params: { branchId },
      }),
      invalidatesTags: (result, error, arg) => [
        { type: "UberMenu" as const, id: arg.id },
        { type: "UberMenu" as const, id: "LIST" },
      ],
    }),

    getBranchProductsForUber: builder.query<
      PagedResult<BranchProductCatalogItem>,
      BranchProductListParams | void
    >({
      query: (params) => ({
        url: "/api/branch-products",
        params: params ?? undefined,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map((item) => ({
                type: "BranchProduct" as const,
                id: item.branchProductId,
              })),
              { type: "BranchProduct" as const, id: "LIST" },
            ]
          : [{ type: "BranchProduct" as const, id: "LIST" }],
    }),
    sendUberOrderWebhookEvent: builder.mutation<
      UberOrderWebhookReceiveResponse,
      SendUberOrderWebhookEventRequest
    >({
      query: ({ payload, connectionKey }) => ({
        url: "/api/uber-eats/webhooks/orders",
        method: "POST",
        params: connectionKey ? { connectionKey } : undefined,
        body: payload,
      }),
    }),

    getUberOrders: builder.query<
      PagedResult<UberOrderStagingSummary>,
      UberOrderListParams | void
    >({
      query: (params) => ({
        url: "/api/uber-orders",
        params: params ?? undefined,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map((item) => ({
                type: "UberOrder" as const,
                id: item.uberOrderStagingId,
              })),
              { type: "UberOrder" as const, id: "LIST" },
            ]
          : [{ type: "UberOrder" as const, id: "LIST" }],
    }),

    getUberOrderById: builder.query<UberOrderStagingDetail, string>({
      query: (id) => `/api/uber-orders/${id}`,
      providesTags: (result, error, id) => [
        { type: "UberOrder" as const, id },
      ],
    }),

    acceptUberOrder: builder.mutation<
      UberOrderActionResult,
      { id: string; reason?: string; pickupTime?: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/api/uber-orders/${id}/accept`,
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, arg) => [
        { type: "UberOrder" as const, id: arg.id },
        { type: "UberOrder" as const, id: "LIST" },
      ],
    }),

    denyUberOrder: builder.mutation<
      UberOrderActionResult,
      { id: string; reasonCode: string; explanation?: string; outOfStockItems?: string[] }
    >({
      query: ({ id, ...body }) => ({
        url: `/api/uber-orders/${id}/deny`,
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, arg) => [
        { type: "UberOrder" as const, id: arg.id },
        { type: "UberOrder" as const, id: "LIST" },
      ],
    }),

    cancelUberOrder: builder.mutation<
      UberOrderActionResult,
      { id: string; reason: string; details?: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/api/uber-orders/${id}/cancel`,
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, arg) => [
        { type: "UberOrder" as const, id: arg.id },
        { type: "UberOrder" as const, id: "LIST" },
      ],
    }),
  }),
});

export type {
  BranchProductListParams,
  UberMenuListParams,
};

export const {
  useCreateUberMenuMutation,
  useDeleteUberMenuMutation,
  useGetBranchProductsForUberQuery,
  useGetUberMenuByIdQuery,
  useGetUberMenusQuery,
  useSendUberOrderWebhookEventMutation,
  useSyncUberMenuMutation,
  useUpdateUberMenuMutation,
  useGetUberOrdersQuery,
  useGetUberOrderByIdQuery,
  useAcceptUberOrderMutation,
  useDenyUberOrderMutation,
  useCancelUberOrderMutation,
} = uberApi;
