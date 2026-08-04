import { baseApi } from "./baseApi";
import {
  AttendanceRecordResponse,
  AttendanceQueryParams,
  PosSessionResponse,
  PagedResult,
} from "@/types";

export const attendanceApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAttendanceRecords: builder.query<PagedResult<AttendanceRecordResponse>, AttendanceQueryParams | void>({
      query: (params) => ({
        url: "/api/attendance",
        params: params || undefined,
      }),
      providesTags: ["Attendance"],
    }),

    startAttendanceSession: builder.mutation<PosSessionResponse, { branchId: string }>({
      query: (data) => ({
        url: "/api/attendance/sessions",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Attendance"],
    }),

    logoutAttendanceSession: builder.mutation<PosSessionResponse, { sessionId: string; endReason?: "Manual" | "Idle" }>({
      query: ({ sessionId, endReason }) => ({
        url: `/api/attendance/sessions/${sessionId}/logout`,
        method: "PATCH",
        body: { endReason: endReason || "Manual" },
      }),
      invalidatesTags: ["Attendance"],
    }),
  }),
});

export const {
  useGetAttendanceRecordsQuery,
  useStartAttendanceSessionMutation,
  useLogoutAttendanceSessionMutation,
} = attendanceApi;
