import { createApi, fetchBaseQuery, BaseQueryFn, FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query/react";
import Cookies from "js-cookie";
import { logout } from "../slices/authSlice";

const rawBaseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_URL,
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
    "Attendance",
    "FridgeReport",
  ],
  endpoints: () => ({}),
});
