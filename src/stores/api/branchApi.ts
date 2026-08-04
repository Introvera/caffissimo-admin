import { baseApi } from "./baseApi";
import { Branch, BranchForSale, PagedResult, PaginationParams } from "@/types";
import { toFormData } from "@/lib/formData";

// POST/PUT /api/branches are [FromForm] on the backend (they accept BranchImageFile),
// so the payload must be multipart/form-data, not JSON.
// The image stays in branchImageUrl rather than being posted as BranchImageFile:
// uploading requires working CloudflareR2 credentials, which dev config lacks.
const branchFormData = (payload: Partial<Branch>) =>
  toFormData(payload as Record<string, unknown>);

export const branchApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ─── Admin Branch CRUD ────────────────────────────────────────────────
    getBranches: builder.query<PagedResult<Branch>, PaginationParams | void>({
      query: (params) => ({
        url: "/api/branches",
        params: params || undefined,
      }),
      providesTags: ["Branch"],
    }),
    getBranchById: builder.query<Branch, string>({
      query: (id) => `/api/branches/${id}`,
      providesTags: (result, error, id) => [{ type: "Branch", id }],
    }),
    createBranch: builder.mutation<Branch, Partial<Branch>>({
      query: (newBranch) => ({
        url: "/api/branches",
        method: "POST",
        body: branchFormData(newBranch),
      }),
      invalidatesTags: ["Branch", { type: "UberMenu" as const, id: "LIST" }],
    }),
    updateBranch: builder.mutation<Branch, { id: string; data: Partial<Branch> }>({
      query: ({ id, data }) => ({
        url: `/api/branches/${id}`,
        method: "PUT",
        body: branchFormData(data),
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Branch", id }, "Branch", { type: "UberMenu" as const, id: "LIST" }],
    }),
    deleteBranch: builder.mutation<void, string>({
      query: (id) => ({
        url: `/api/branches/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Branch"],
    }),

    // ─── Customer-facing (for-sale) ────────────────────────────────────────
    // Anonymous endpoints used by the storefront/mobile app
    getBranchesForSale: builder.query<PagedResult<BranchForSale>, PaginationParams | void>({
      query: (params) => ({
        url: "/api/branches/for-sale",
        params: params || undefined,
      }),
      providesTags: ["Branch"],
    }),
    getBranchForSaleById: builder.query<BranchForSale, string>({
      query: (id) => `/api/branches/for-sale/${id}`,
      providesTags: (result, error, id) => [{ type: "Branch", id }],
    }),

    // ─── Lookups ───────────────────────────────────────────────────────────
    getBranchesLookup: builder.query<{ branchId: string; branchName: string }[], void>({
      query: () => "/api/branches/lookup",
      providesTags: ["Branch"],
    }),
  }),
});

export const {
  useGetBranchesQuery,
  useGetBranchByIdQuery,
  useCreateBranchMutation,
  useUpdateBranchMutation,
  useDeleteBranchMutation,
  useGetBranchesForSaleQuery,
  useGetBranchForSaleByIdQuery,
  useGetBranchesLookupQuery,
} = branchApi;

