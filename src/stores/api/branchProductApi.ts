import { baseApi } from "./baseApi";
import {
  BranchProductResponse,
  CreateBranchProductRequest,
  UpdateBranchProductRequest,
  PagedResult,
  PaginationParams,
} from "@/types";
import { toFormData } from "@/lib/formData";

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
        // POST/PUT /api/branch-products are [FromForm] on the backend.
        body: toFormData(data as unknown as Record<string, unknown>),
      }),
      invalidatesTags: ["BranchProduct"],
    }),

    // PUT /api/branch-products/{id}  — update availability / image overrides
    updateBranchProduct: builder.mutation<BranchProductResponse, { id: string; data: UpdateBranchProductRequest }>({
      query: ({ id, data }) => ({
        url: `/api/branch-products/${id}`,
        method: "PUT",
        body: toFormData(data as unknown as Record<string, unknown>),
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "BranchProduct", id }, "BranchProduct"],
    }),

    // DELETE /api/branch-products/{id}  — remove product from branch
    deleteBranchProduct: builder.mutation<void, string>({
      query: (id) => ({
        url: `/api/branch-products/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["BranchProduct"],
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
