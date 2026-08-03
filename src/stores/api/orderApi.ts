import { baseApi } from "./baseApi";
import {
  OrderResponse,
  OrderSummaryResponse,
  CreateOrderRequest,
  UpdateOrderRequest,
  PagedResult,
  OrderListParams,
} from "@/types";

export const orderApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // GET /api/orders  (paged, filterable)
    getOrders: builder.query<PagedResult<OrderSummaryResponse>, OrderListParams | void>({
      query: (params) => ({
        url: "/api/orders",
        params: params || undefined,
      }),
      providesTags: ["Order"],
    }),

    // GET /api/orders/{id}
    getOrderById: builder.query<OrderResponse, string>({
      query: (id) => `/api/orders/${id}`,
      providesTags: (result, error, id) => [{ type: "Order", id }],
    }),

    // POST /api/orders
    createOrder: builder.mutation<OrderResponse, CreateOrderRequest>({
      query: (data) => ({
        url: "/api/orders",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Order"],
    }),

    // PUT /api/orders/{id}  — full update including status change
    updateOrder: builder.mutation<OrderResponse, { id: string; data: UpdateOrderRequest }>({
      query: ({ id, data }) => ({
        url: `/api/orders/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Order", id }, "Order"],
    }),

    // DELETE /api/orders/{id}
    deleteOrder: builder.mutation<void, string>({
      query: (id) => ({
        url: `/api/orders/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Order"],
    }),
  }),
});

export const {
  useGetOrdersQuery,
  useLazyGetOrdersQuery,
  useGetOrderByIdQuery,
  useCreateOrderMutation,
  useUpdateOrderMutation,
  useDeleteOrderMutation,
} = orderApi;

