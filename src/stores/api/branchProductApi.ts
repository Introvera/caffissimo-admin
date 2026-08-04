import { baseApi } from "./baseApi";
import {
  BranchProductResponse,
  CreateBranchProductRequest,
  UpdateBranchProductRequest,
  PagedResult,
  PaginationParams,
} from "@/types";

export const branchProductApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // GET /api/branch-products  (paged, filter by branchId / productId)
    getBranchProducts: builder.query<PagedResult<BranchProductResponse>, PaginationParams | void>({
      query: (params) => ({
        url: "/api/branch-products",
        params: params || undefined,
      }),
      providesTags: ["BranchProduct"],
    }),

    // GET /api/branch-products/{id}
    getBranchProductById: builder.query<BranchProductResponse, string>({
      query: (id) => `/api/branch-products/${id}`,
      providesTags: (result, error, id) => [{ type: "BranchProduct", id }],
    }),

    // POST /api/branch-products  — assign product to branch with variants
    createBranchProduct: builder.mutation<BranchProductResponse, CreateBranchProductRequest>({
      query: (data) => ({
        url: "/api/branch-products",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["BranchProduct", "Product"],
    }),

    // PUT /api/branch-products/{id}  — update availability / image overrides
    updateBranchProduct: builder.mutation<BranchProductResponse, { id: string; data: UpdateBranchProductRequest }>({
      query: ({ id, data }) => ({
        url: `/api/branch-products/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "BranchProduct", id }, "BranchProduct"],
    }),

    // DELETE /api/branch-products/{id}  — remove product from branch
    deleteBranchProduct: builder.mutation<void, string>({
      query: (id) => ({
        url: `/api/branch-products/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["BranchProduct", "Product"],
    }),
  }),
});

export const {
  useGetBranchProductsQuery,
  useGetBranchProductByIdQuery,
  useCreateBranchProductMutation,
  useUpdateBranchProductMutation,
  useDeleteBranchProductMutation,
} = branchProductApi;
