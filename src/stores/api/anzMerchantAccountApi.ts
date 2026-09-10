import { baseApi } from "./baseApi";
import {
  AnzMerchantAccountResponse,
  UpsertAnzMerchantAccountRequest,
} from "@/types";

export const anzMerchantAccountApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // GET /api/admin/anz-merchant-accounts
    getAnzMerchantAccounts: builder.query<AnzMerchantAccountResponse[], void>({
      query: () => "/api/admin/anz-merchant-accounts",
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ anzMerchantAccountId }) => ({
                type: "AnzMerchantAccount" as const,
                id: anzMerchantAccountId,
              })),
              { type: "AnzMerchantAccount" as const, id: "LIST" },
            ]
          : [{ type: "AnzMerchantAccount" as const, id: "LIST" }],
    }),

    // POST /api/admin/anz-merchant-accounts
    createAnzMerchantAccount: builder.mutation<
      AnzMerchantAccountResponse,
      UpsertAnzMerchantAccountRequest
    >({
      query: (data) => ({
        url: "/api/admin/anz-merchant-accounts",
        method: "POST",
        body: data,
      }),
      invalidatesTags: [{ type: "AnzMerchantAccount", id: "LIST" }],
    }),

    // PUT /api/admin/anz-merchant-accounts/{id}
    updateAnzMerchantAccount: builder.mutation<
      AnzMerchantAccountResponse,
      { id: string; data: UpsertAnzMerchantAccountRequest }
    >({
      query: ({ id, data }) => ({
        url: `/api/admin/anz-merchant-accounts/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "AnzMerchantAccount", id },
        { type: "AnzMerchantAccount", id: "LIST" },
      ],
    }),

    // POST /api/admin/anz-merchant-accounts/{id}/activate
    activateAnzMerchantAccount: builder.mutation<AnzMerchantAccountResponse, string>({
      query: (id) => ({
        url: `/api/admin/anz-merchant-accounts/${id}/activate`,
        method: "POST",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "AnzMerchantAccount", id },
        { type: "AnzMerchantAccount", id: "LIST" },
      ],
    }),

    // POST /api/admin/anz-merchant-accounts/{id}/deactivate
    deactivateAnzMerchantAccount: builder.mutation<AnzMerchantAccountResponse, string>({
      query: (id) => ({
        url: `/api/admin/anz-merchant-accounts/${id}/deactivate`,
        method: "POST",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "AnzMerchantAccount", id },
        { type: "AnzMerchantAccount", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetAnzMerchantAccountsQuery,
  useCreateAnzMerchantAccountMutation,
  useUpdateAnzMerchantAccountMutation,
  useActivateAnzMerchantAccountMutation,
  useDeactivateAnzMerchantAccountMutation,
} = anzMerchantAccountApi;
