import { baseApi } from "./baseApi";
import { Product, Category, BranchForSale, PagedResult, PaginationParams } from "@/types";

export const productApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ─── Products ────────────────────────────────────────────────────────
    getProducts: builder.query<PagedResult<Product>, PaginationParams | void>({
      query: (params) => ({
        url: "/api/products",
        params: params || undefined,
      }),
      providesTags: ["Product"],
    }),
    getProductById: builder.query<Product, string>({
      query: (id) => `/api/products/${id}`,
      providesTags: (result, error, id) => [{ type: "Product", id }],
    }),
    createProduct: builder.mutation<Product, Partial<Product>>({
      query: (newProduct) => ({
        url: "/api/products",
        method: "POST",
        body: newProduct,
      }),
      invalidatesTags: ["Product"],
    }),
    updateProduct: builder.mutation<Product, { id: string; data: Partial<Product> }>({
      query: ({ id, data }) => ({
        url: `/api/products/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Product", id }, "Product"],
    }),
    deleteProduct: builder.mutation<void, string>({
      query: (id) => ({
        url: `/api/products/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Product"],
    }),

    // ─── Product Categories ───────────────────────────────────────────────
    getCategories: builder.query<PagedResult<Category>, PaginationParams | void>({
      query: (params) => ({
        url: "/api/product-categories",
        params: params || undefined,
      }),
      providesTags: ["Category"],
    }),
    getCategoryById: builder.query<Category, string>({
      query: (id) => `/api/product-categories/${id}`,
      providesTags: (result, error, id) => [{ type: "Category", id }],
    }),
    createCategory: builder.mutation<Category, Partial<Category>>({
      query: (data) => ({
        url: "/api/product-categories",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Category"],
    }),
    updateCategory: builder.mutation<Category, { id: string; data: Partial<Category> }>({
      query: ({ id, data }) => ({
        url: `/api/product-categories/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Category", id }, "Category"],
    }),
    deleteCategory: builder.mutation<void, string>({
      query: (id) => ({
        url: `/api/product-categories/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Category"],
    }),

    // ─── Lookups ───────────────────────────────────────────────────────────
    getProductsLookup: builder.query<{ productId: string; productName: string }[], { productCategoryId?: string; isActive?: boolean } | void>({
      query: (params) => ({
        url: "/api/products/lookup",
        params: params || undefined,
      }),
      providesTags: ["Product"],
    }),
  }),
});

export const {
  useGetProductsQuery,
  useGetProductByIdQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useGetCategoriesQuery,
  useGetCategoryByIdQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useGetProductsLookupQuery,
} = productApi;

