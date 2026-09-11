import { baseApi } from "./baseApi";
import type {
  ActivityLog,
  ActivityLogFacets,
  ActivityLogPagedResponse,
  ActivityLogQueryParams,
} from "@/types/activity-log";

/**
 * Activity log reads.
 *
 * No mutations, and there is no endpoint to add: the log is append-only server-side. A log an
 * administrator can edit is not evidence of anything.
 */
export const activityLogApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * The admin list. The server filters by the caller's own clearance before anything else, so
     * these parameters only ever narrow what is already permitted.
     */
    getActivityLogs: builder.query<ActivityLogPagedResponse, ActivityLogQueryParams | void>({
      query: (params) => ({ url: "/api/activity-logs", params: params || undefined }),
      providesTags: ["ActivityLog"],
    }),

    /** The caller's own history. Available to every role, including those with no admin access. */
    getOwnActivityLogs: builder.query<ActivityLogPagedResponse, ActivityLogQueryParams | void>({
      query: (params) => ({ url: "/api/activity-logs/me", params: params || undefined }),
      providesTags: ["ActivityLog"],
    }),

    getActivityLogById: builder.query<ActivityLog, string>({
      query: (id) => ({ url: `/api/activity-logs/${id}` }),
      providesTags: (_result, _error, id) => [{ type: "ActivityLog" as const, id }],
    }),

    /**
     * Drives the filter dropdowns. Asked for separately rather than derived from the enums so the
     * UI never offers an option the viewer is not cleared to query.
     */
    getActivityLogFacets: builder.query<ActivityLogFacets, { from?: string; to?: string } | void>({
      query: (params) => ({ url: "/api/activity-logs/facets", params: params || undefined }),
      providesTags: ["ActivityLog"],
    }),

    /** Every row from one request, so a single action reads as one story. */
    getActivityLogsByCorrelation: builder.query<ActivityLog[], string>({
      query: (correlationId) => ({ url: `/api/activity-logs/correlation/${correlationId}` }),
      providesTags: ["ActivityLog"],
    }),

    /** History for one record, for a History tab on a detail page. */
    getActivityLogsForEntity: builder.query<
      ActivityLog[],
      { entityType: string; entityId: string }
    >({
      query: ({ entityType, entityId }) => ({
        url: `/api/activity-logs/entity/${entityType}/${encodeURIComponent(entityId)}`,
      }),
      providesTags: ["ActivityLog"],
    }),
  }),
});

export const {
  useGetActivityLogsQuery,
  useGetOwnActivityLogsQuery,
  useGetActivityLogByIdQuery,
  useGetActivityLogFacetsQuery,
  useGetActivityLogsByCorrelationQuery,
  useGetActivityLogsForEntityQuery,
} = activityLogApi;
