import { baseApi } from "./baseApi";
import { ProductProfile, UpsertProductProfileRequest } from "@/types";

/**
 * Product recommendation profiles.
 *
 * Separate from productApi because the product endpoints are [FromForm] multipart (images,
 * branch configs) while these are plain JSON, and because a profile is optional content
 * edited independently of the product itself.
 */
export const productProfileApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * The backend returns 204 when a product has no profile — absence is the normal case,
     * not an error. RTK Query surfaces that as `undefined` data rather than an error.
     */
    getProductProfile: builder.query<ProductProfile | null, string>({
      query: (productId) => `/api/products/${productId}/profile`,
      transformResponse: (response: ProductProfile | null) => response ?? null,
      providesTags: (result, error, productId) => [
        { type: "ProductProfile", id: productId },
      ],
    }),

    upsertProductProfile: builder.mutation<
      ProductProfile,
      { productId: string; data: UpsertProductProfileRequest }
    >({
      query: ({ productId, data }) => ({
        url: `/api/products/${productId}/profile`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { productId }) => [
        { type: "ProductProfile", id: productId },
        "ProductProfile",
      ],
    }),

    deleteProductProfile: builder.mutation<void, string>({
      query: (productId) => ({
        url: `/api/products/${productId}/profile`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, productId) => [
        { type: "ProductProfile", id: productId },
        "ProductProfile",
      ],
    }),

    /** Product ids that already have a profile — powers the coverage badge on the list. */
    getProfiledProductIds: builder.query<string[], void>({
      query: () => "/api/product-profiles/product-ids",
      providesTags: ["ProductProfile"],
    }),
  }),
});

export const {
  useGetProductProfileQuery,
  useUpsertProductProfileMutation,
  useDeleteProductProfileMutation,
  useGetProfiledProductIdsQuery,
} = productProfileApi;
