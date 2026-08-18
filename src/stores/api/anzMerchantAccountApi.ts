import { baseApi } from "./baseApi";
import {
  AnzMerchantAccount,
  UpsertAnzMerchantAccountRequest,
} from "@/types";

/**
 * ANZ Worldline merchant accounts. SuperAdmin only — the backend enforces it too,
 * so the UI gate is convenience, not the control.
 *
 * Note there is no "get one" endpoint and no way to read a secret back. The list
 * returns identifiers plus whether each secret exists and where it is held; the
 * values only ever travel upward.
 */
export const anzMerchantAccountApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAnzMerchantAccounts: builder.query<AnzMerchantAccount[], void>({
      query: () => "/api/admin/anz-merchant-accounts",
      providesTags: ["AnzMerchantAccount"],
    }),

    createAnzMerchantAccount: builder.mutation<
      AnzMerchantAccount,
      UpsertAnzMerchantAccountRequest
    >({
      query: (body) => ({
        url: "/api/admin/anz-merchant-accounts",
        method: "POST",
        body,
      }),
      invalidatesTags: ["AnzMerchantAccount"],
    }),

    updateAnzMerchantAccount: builder.mutation<
      AnzMerchantAccount,
      { id: string; body: UpsertAnzMerchantAccountRequest }
    >({
      query: ({ id, body }) => ({
        url: `/api/admin/anz-merchant-accounts/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["AnzMerchantAccount"],
    }),

    /**
     * Kill switch. Takes effect on the next payment and the next webhook — both
     * payment-path lookups filter on IsActive — with no deploy or restart.
     */
    setAnzMerchantAccountActive: builder.mutation<
      AnzMerchantAccount,
      { id: string; isActive: boolean }
    >({
      query: ({ id, isActive }) => ({
        url: `/api/admin/anz-merchant-accounts/${id}/${isActive ? "activate" : "deactivate"}`,
        method: "POST",
      }),
      invalidatesTags: ["AnzMerchantAccount"],
    }),
  }),
});

export const {
  useGetAnzMerchantAccountsQuery,
  useCreateAnzMerchantAccountMutation,
  useUpdateAnzMerchantAccountMutation,
  useSetAnzMerchantAccountActiveMutation,
} = anzMerchantAccountApi;
