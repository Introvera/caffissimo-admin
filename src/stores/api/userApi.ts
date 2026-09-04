import { baseApi } from "./baseApi";
import {
  AppUser,
  CreateFirebaseUserRequest,
  CreateCustomerFirebaseUserRequest,
  UpdateUserRoleRequest,
  ResetUserPasswordRequest,
  UpdateUserRoleResponse,
  PagedResult,
} from "@/types";

export interface UserQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  role?: string;
  excludeRole?: string;
  branchId?: string;
  isActive?: boolean;
  sortBy?: string;
  sortDescending?: boolean;
}

export const userApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // GET /api/firebaseuser
    getUsers: builder.query<PagedResult<AppUser>, UserQueryParams | void>({
      query: (params) => ({
        url: "/api/firebaseuser",
        params: params || undefined,
      }),
      providesTags: ["User"],
    }),

    // GET /api/firebaseuser/current-user
    getCurrentUser: builder.query<AppUser, void>({
      query: () => "/api/firebaseuser/current-user",
      providesTags: ["User"],
    }),

    // GET /api/firebaseuser/{id}
    getUserById: builder.query<AppUser, string>({
      query: (id) => `/api/firebaseuser/${id}`,
      providesTags: ["User"],
    }),

    // POST /api/firebaseuser  — create staff user (with role)
    createUser: builder.mutation<AppUser, CreateFirebaseUserRequest>({
      query: (data) => ({
        url: "/api/firebaseuser",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["User"],
    }),

    // POST /api/firebaseuser/customer  — create customer account
    createCustomerUser: builder.mutation<AppUser, CreateCustomerFirebaseUserRequest>({
      query: (data) => ({
        url: "/api/firebaseuser/customer",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["User"],
    }),

    // PUT /api/firebaseuser/{id}/role
    updateUserRole: builder.mutation<UpdateUserRoleResponse, { id: string; data: UpdateUserRoleRequest }>({
      query: ({ id, data }) => ({
        url: `/api/firebaseuser/${id}/role`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["User"],
    }),

    // POST /api/firebaseuser/{id}/reset-password
    resetUserPassword: builder.mutation<void, { id: string; data: ResetUserPasswordRequest }>({
      query: ({ id, data }) => ({
        url: `/api/firebaseuser/${id}/reset-password`,
        method: "POST",
        body: data,
      }),
    }),

    // DELETE /api/firebaseuser/{id}
    deleteUser: builder.mutation<void, string>({
      query: (id) => ({
        url: `/api/firebaseuser/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["User"],
    }),
  }),
});

export const {
  useGetUsersQuery,
  useGetCurrentUserQuery,
  useGetUserByIdQuery,
  useCreateUserMutation,
  useCreateCustomerUserMutation,
  useUpdateUserRoleMutation,
  useResetUserPasswordMutation,
  useDeleteUserMutation,
} = userApi;
