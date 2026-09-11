/**
 * Activity log types.
 *
 * PascalCase string unions rather than the snake_case union the mocked audit page used, because
 * every real backend enum in this app crosses the wire as a PascalCase string — the API serialises
 * enums by name.
 */

export type ActivitySourceApp =
  | "PublicApi"
  | "AdminPortal"
  | "Ecommerce"
  | "Pos"
  | "System"
  | "Integration";

export type ActivityCategory =
  | "Auth"
  | "UserManagement"
  | "Branch"
  | "Catalog"
  | "Pricing"
  | "Order"
  | "Payment"
  | "Loyalty"
  | "Offer"
  | "Fridge"
  | "Attendance"
  | "Training"
  | "Settings"
  | "Integration"
  | "Security"
  | "DataAccess";

export type ActivityOutcome = "Success" | "Failure" | "Denied";

export type ActivitySeverity = "Info" | "Warning" | "Critical";

/** One before/after pair in a row's diff. Values are whatever the field held. */
export interface ActivityFieldChange {
  before: unknown;
  after: unknown;
}

export interface ActivityLog {
  id: string;

  /** When it happened. For an offline till this is the device clock. */
  occurredAt: string;

  /** When the server accepted it. Differs from occurredAt only for delayed events. */
  receivedAt: string;

  /** Set by the server when the two are far enough apart to be worth showing. */
  wasDelayed: boolean;

  sourceApp: ActivitySourceApp;
  category: ActivityCategory;
  outcome: ActivityOutcome;
  severity: ActivitySeverity;

  /** Stable dotted key, e.g. "product.price.updated". Drives how the row is rendered. */
  action: string;

  actorUserId?: string | null;
  actorName?: string | null;
  actorRole?: string | null;

  /** The actor's rank when the row was written, not their rank now. */
  actorRank: number;

  branchId?: string | null;
  branchName?: string | null;

  entityType?: string | null;
  entityId?: string | null;
  entitySummary?: string | null;

  changes?: Record<string, ActivityFieldChange> | null;
  metadata?: Record<string, unknown> | null;

  correlationId?: string | null;
  deviceId?: string | null;
  deviceLabel?: string | null;
  appVersion?: string | null;

  httpMethod?: string | null;
  path?: string | null;
  statusCode?: number | null;
  durationMs?: number | null;
  errorMessage?: string | null;

  timestampAdjusted: boolean;

  /** Present only when someone other than the actor delivered the event. */
  pushedByUserId?: string | null;
}

/**
 * The paged envelope, plus the two fields the house `PagedResult` cannot express.
 *
 * `totalCount` is capped server-side, so `totalPages` derived from it is a floor. Read
 * `countIsExact` before showing either as a total — the server will not stop you rendering a
 * wrong number.
 */
export interface ActivityLogPagedResponse {
  items: ActivityLog[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  countIsExact: boolean;
  hasMore: boolean;
}

/** Filter values actually present in what this viewer may see. */
export interface ActivityLogFacets {
  sourceApps: ActivitySourceApp[];
  categories: ActivityCategory[];
  actions: string[];
  branchIds: string[];

  /** False for roles limited to their own history — hide the page rather than show it empty. */
  canViewOthersActivity: boolean;

  /** Whether this viewer sees every branch, which decides if the branch filter is useful. */
  allBranches: boolean;
}

export interface ActivityLogQueryParams {
  from?: string;
  to?: string;
  sourceApp?: ActivitySourceApp;
  category?: ActivityCategory;
  outcome?: ActivityOutcome;
  minSeverity?: ActivitySeverity;
  action?: string;
  actorUserId?: string;
  branchId?: string;
  entityType?: string;
  entityId?: string;
  correlationId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}
