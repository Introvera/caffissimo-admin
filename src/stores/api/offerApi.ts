import { baseApi } from "./baseApi";
import {
  OfferResponse,
  OfferSummaryResponse,
  CreateOfferRequest,
  UpdateOfferRequest,
  PagedResult,
  OfferListParams,
  EvaluateOffersRequest,
  EvaluateOffersResponse,
  LoyaltyProgressResponse,
} from "@/types";

export const offerApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // GET /api/offers  (paged, anonymous)
    getOffers: builder.query<PagedResult<OfferSummaryResponse>, OfferListParams | void>({
      query: (params) => ({
        url: "/api/offers",
        params: params || undefined,
      }),
      providesTags: ["Offer"],
    }),

    // GET /api/offers/{id}  (anonymous)
    getOfferById: builder.query<OfferResponse, string>({
      query: (id) => `/api/offers/${id}`,
      providesTags: (result, error, id) => [{ type: "Offer", id }],
    }),

    // POST /api/offers  (auth required)
    createOffer: builder.mutation<OfferResponse, CreateOfferRequest>({
      query: (data) => ({
        url: "/api/offers",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Offer"],
    }),

    // PUT /api/offers/{id}  (auth required)
    updateOffer: builder.mutation<OfferResponse, { id: string; data: UpdateOfferRequest }>({
      query: ({ id, data }) => ({
        url: `/api/offers/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Offer", id }, "Offer"],
    }),

    // DELETE /api/offers/{id}  (auth required)
    deleteOffer: builder.mutation<void, string>({
      query: (id) => ({
        url: `/api/offers/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Offer"],
    }),

    // POST /api/offers/evaluate
    evaluateOffers: builder.mutation<EvaluateOffersResponse, EvaluateOffersRequest>({
      query: (data) => ({
        url: "/api/offers/evaluate",
        method: "POST",
        body: data,
      }),
    }),

    // GET /api/offers/loyalty/progress
    getLoyaltyProgress: builder.query<
      LoyaltyProgressResponse,
      { branchId: string; customerId?: string; offerId?: string }
    >({
      query: (params) => ({
        url: "/api/offers/loyalty/progress",
        params,
      }),
    }),
  }),
});

export const {
  useGetOffersQuery,
  useGetOfferByIdQuery,
  useCreateOfferMutation,
  useUpdateOfferMutation,
  useDeleteOfferMutation,
  useEvaluateOffersMutation,
  useGetLoyaltyProgressQuery,
} = offerApi;


