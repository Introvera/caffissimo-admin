import { createApi, fetchBaseQuery, BaseQueryFn, FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query/react";
import Cookies from "js-cookie";
import { logout } from "../slices/authSlice";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error(
    "NEXT_PUBLIC_API_URL is not set. It is inlined at build time, so it must be present when the app is built.",
  );
}

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_URL,
  prepareHeaders: (headers) => {
    const token = Cookies.get("auth_token");
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

const baseQuery: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const result = await rawBaseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    api.dispatch(logout());
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery,
  tagTypes: [
    "Product", "Category",
    "Branch", "BranchProduct",
    "Order", "OrderItem",
    "Topping", "ToppingCategory", "ProductTopping", "BranchTopping", "BranchProductVariant",
    "Offer",
    "User",
    "UberMenu",
    "SpecialDay",
  ],
  endpoints: () => ({}),
});
