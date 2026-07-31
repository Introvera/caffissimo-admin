import { baseApi } from "./baseApi";
import { 
  Topping, 
  ToppingCategory, 
  ProductTopping, 
  BranchTopping, 
  PagedResult, 
  PaginationParams 
} from "@/types";

export const toppingApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Topping Categories
    getToppingCategories: builder.query<PagedResult<ToppingCategory>, PaginationParams | void>({
      query: (params) => ({
        url: "/api/topping-categories",
        params: params || undefined,
      }),
      providesTags: ["ToppingCategory"],
    }),
    getToppingCategoryById: builder.query<ToppingCategory, string>({
      query: (id) => `/api/topping-categories/${id}`,
      providesTags: (result, error, id) => [{ type: "ToppingCategory", id }],
    }),
    createToppingCategory: builder.mutation<ToppingCategory, Partial<ToppingCategory>>({
      query: (data) => ({
        url: "/api/topping-categories",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["ToppingCategory"],
    }),
    updateToppingCategory: builder.mutation<ToppingCategory, { id: string; data: Partial<ToppingCategory> }>({
      query: ({ id, data }) => ({
        url: `/api/topping-categories/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["ToppingCategory"],
    }),
    deleteToppingCategory: builder.mutation<void, string>({
      query: (id) => ({
        url: `/api/topping-categories/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["ToppingCategory"],
    }),

    // Toppings
    getToppings: builder.query<PagedResult<Topping>, PaginationParams | void>({
      query: (params) => ({
        url: "/api/toppings",
        params: params || undefined,
      }),
      providesTags: ["Topping"],
    }),
    getToppingById: builder.query<Topping, string>({
      query: (id) => `/api/toppings/${id}`,
      providesTags: (result, error, id) => [{ type: "Topping", id }],
    }),
    createTopping: builder.mutation<Topping, Partial<Topping>>({
      query: (data) => ({
        url: "/api/toppings",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Topping"],
    }),
    updateTopping: builder.mutation<Topping, { id: string; data: Partial<Topping> }>({
      query: ({ id, data }) => ({
        url: `/api/toppings/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Topping"],
    }),
    deleteTopping: builder.mutation<void, string>({
      query: (id) => ({
        url: `/api/toppings/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Topping"],
    }),
    
    // Product Toppings
    getProductToppings: builder.query<ProductTopping[], string>({
      query: (productId) => `/api/product-toppings/by-product/${productId}`,
      providesTags: ["ProductTopping"],
    }),
    createProductTopping: builder.mutation<ProductTopping, Partial<ProductTopping>>({
      query: (data) => ({
        url: "/api/product-toppings",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["ProductTopping"],
    }),
    deleteProductTopping: builder.mutation<void, string>({
      query: (id) => ({
        url: `/api/product-toppings/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["ProductTopping"],
    }),

    // Branch Toppings
    getBranchToppings: builder.query<BranchTopping[], string>({
      query: (branchId) => `/api/branch-toppings/by-branch/${branchId}`,
      providesTags: ["BranchTopping"],
    }),
    getBranchToppingsList: builder.query<PagedResult<BranchTopping>, { toppingId?: string; branchId?: string; pageSize?: number } | void>({
      query: (params) => ({
        url: "/api/branch-toppings",
        params: params || undefined,
      }),
      providesTags: ["BranchTopping"],
    }),
    createBranchTopping: builder.mutation<BranchTopping, Partial<BranchTopping>>({
      query: (data) => ({
        url: "/api/branch-toppings",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["BranchTopping"],
    }),
    updateBranchTopping: builder.mutation<BranchTopping, { id: string; data: Partial<BranchTopping> }>({
      query: ({ id, data }) => ({
        url: `/api/branch-toppings/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["BranchTopping"],
    }),
    deleteBranchTopping: builder.mutation<void, string>({
      query: (id) => ({
        url: `/api/branch-toppings/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["BranchTopping"],
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetToppingCategoriesQuery,
  useGetToppingCategoryByIdQuery,
  useCreateToppingCategoryMutation,
  useUpdateToppingCategoryMutation,
  useDeleteToppingCategoryMutation,
  useGetToppingsQuery,
  useGetToppingByIdQuery,
  useCreateToppingMutation,
  useUpdateToppingMutation,
  useDeleteToppingMutation,
  useGetProductToppingsQuery,
  useCreateProductToppingMutation,
  useDeleteProductToppingMutation,
  useGetBranchToppingsQuery,
  useGetBranchToppingsListQuery,
  useCreateBranchToppingMutation,
  useUpdateBranchToppingMutation,
  useDeleteBranchToppingMutation,
} = toppingApi;
