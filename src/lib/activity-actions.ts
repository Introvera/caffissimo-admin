import type {
  ActivityCategory,
  ActivityLog,
  ActivityOutcome,
  ActivitySeverity,
  ActivitySourceApp,
} from "@/types/activity-log";

/**
 * How a log row becomes a sentence.
 *
 * The point of the whole feature is that someone can read what happened without decoding it. A row
 * rendered as `product.price.updated | {"Price":{"before":5.5,"after":6}}` is technically complete
 * and practically useless; this turns it into "Ruwan Perera changed Flat White price from $5.50 to
 * $6.00".
 *
 * Keys here match Caffissimo.Application.Activity.ActivityActions on the server. An action with no
 * entry still renders — it falls back to a humanised form of the key — so a new server action never
 * produces a blank row, only a plainer one.
 */

export interface ActionDefinition {
  /** Short label for the badge. */
  label: string;

  /**
   * Builds the sentence. Receives the row so it can name the entity and quote the diff.
   * Returning null falls back to the label.
   */
  describe?: (log: ActivityLog) => string | null;
}

/** Formats a diff value for display. Currency-aware because most numeric diffs here are prices. */
const value = (raw: unknown, currency = false): string => {
  if (raw === null || raw === undefined) return "—";
  if (typeof raw === "boolean") return raw ? "yes" : "no";

  if (typeof raw === "number") {
    return currency
      ? new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(raw)
      : String(raw);
  }

  return String(raw);
};

/** "from X to Y" for a named field, or null when that field did not change. */
const delta = (log: ActivityLog, field: string, currency = false): string | null => {
  const change = log.changes?.[field];
  if (!change) return null;

  return `from ${value(change.before, currency)} to ${value(change.after, currency)}`;
};

const entity = (log: ActivityLog): string =>
  log.entitySummary || log.entityType || "record";

export const ACTION_DEFINITIONS: Record<string, ActionDefinition> = {
  // Auth
  "auth.login.succeeded": { label: "Signed in" },
  "auth.login.failed": {
    label: "Failed sign-in",
    describe: (log) => {
      const attempted = log.metadata?.attemptedIdentifier;
      return attempted ? `Failed sign-in attempt for ${attempted}` : "Failed sign-in attempt";
    },
  },
  "auth.logout.succeeded": { label: "Signed out" },
  "auth.pin.rejected": { label: "PIN rejected" },
  "auth.supervisor_pin.rejected": { label: "Supervisor PIN rejected" },
  "auth.request.unauthenticated": { label: "Unauthenticated request" },

  // Security
  "security.permission.denied": {
    label: "Permission denied",
    describe: (log) => `Was refused access to ${log.path || "a restricted action"}`,
  },
  "security.branch_mismatch.reported": { label: "Branch mismatch" },
  "security.rate_limit.exceeded": { label: "Rate limited" },

  // Users
  "user.created": { label: "User created", describe: (log) => `Created the account ${entity(log)}` },
  "user.updated": { label: "User updated", describe: (log) => `Updated ${entity(log)}` },
  "user.role.changed": {
    label: "Role changed",
    describe: (log) => {
      const change = delta(log, "Role");
      return change ? `Changed ${entity(log)}'s role ${change}` : `Changed ${entity(log)}'s role`;
    },
  },
  "user.deactivated": { label: "User deactivated", describe: (log) => `Deactivated ${entity(log)}` },
  "user.deleted": { label: "User deleted", describe: (log) => `Deleted the account ${entity(log)}` },
  "user.password.reset": {
    label: "Password reset",
    describe: (log) => `Reset the password for ${entity(log)}`,
  },

  // Branch
  "branch.created": { label: "Branch created", describe: (log) => `Created ${entity(log)}` },
  "branch.updated": { label: "Branch updated", describe: (log) => `Updated ${entity(log)}` },
  "branch.deleted": { label: "Branch deleted", describe: (log) => `Deleted ${entity(log)}` },

  // Catalog and pricing
  "product.created": { label: "Product created", describe: (log) => `Added ${entity(log)}` },
  "product.updated": { label: "Product updated", describe: (log) => `Updated ${entity(log)}` },
  "product.deleted": { label: "Product deleted", describe: (log) => `Removed ${entity(log)}` },
  "product.price.updated": {
    label: "Price changed",
    describe: (log) => {
      const change = delta(log, "Price", true);
      return change ? `Changed ${entity(log)} price ${change}` : `Changed ${entity(log)} price`;
    },
  },
  "branch_product.price.updated": {
    label: "Price changed",
    describe: (log) => {
      const change = delta(log, "Price", true);
      return change ? `Changed ${entity(log)} price ${change}` : `Changed ${entity(log)} price`;
    },
  },
  "topping.updated": { label: "Topping updated", describe: (log) => `Updated ${entity(log)}` },
  "category.updated": { label: "Category updated", describe: (log) => `Updated ${entity(log)}` },

  // Offers
  "offer.created": { label: "Offer created", describe: (log) => `Created the offer ${entity(log)}` },
  "offer.updated": { label: "Offer updated", describe: (log) => `Updated the offer ${entity(log)}` },
  "offer.deleted": { label: "Offer deleted", describe: (log) => `Deleted the offer ${entity(log)}` },

  // Orders
  "order.placed": {
    label: "Order placed",
    describe: (log) => `Placed order ${entity(log)}`,
  },
  "order.status.changed": {
    label: "Order status changed",
    describe: (log) => {
      const change = delta(log, "OrderStatus");
      return change ? `Moved order ${entity(log)} ${change}` : `Changed order ${entity(log)} status`;
    },
  },
  "order.cancelled": {
    label: "Order cancelled",
    describe: (log) => {
      const reason = log.metadata?.reason;
      const base = `Cancelled order ${entity(log)}`;
      return reason ? `${base} — ${reason}` : base;
    },
  },
  "order.updated": { label: "Order updated", describe: (log) => `Updated order ${entity(log)}` },
  "order.cart.cleared": { label: "Cart cleared" },
  "order.cart.line_removed": { label: "Cart line removed" },

  // Payments
  "payment.authorised": { label: "Payment authorised" },
  "payment.captured": { label: "Payment captured" },
  "payment.failed": { label: "Payment failed" },
  "payment.refund.issued": { label: "Refund issued", describe: (log) => `Refunded ${entity(log)}` },
  "payment.merchant_account.updated": { label: "Merchant account updated" },

  // Loyalty
  "loyalty.points.adjusted": { label: "Points adjusted" },
  "loyalty.reward.redeemed": { label: "Reward redeemed" },

  // Operations
  "fridge.reading.recorded": { label: "Fridge reading" },
  "attendance.recorded": { label: "Attendance recorded" },
  "training.attempt.submitted": { label: "Training attempt" },
  "training.content.updated": { label: "Training updated" },

  // Settings and integration
  "settings.updated": { label: "Settings updated" },
  "integration.sync.ran": { label: "Integration sync" },
  "integration.webhook.received": { label: "Webhook received" },

  // Audited reads
  "data_access.report.viewed": { label: "Report viewed" },
  "data_access.user_list.viewed": { label: "User list viewed" },
  "data_access.customer.viewed": { label: "Customer viewed" },
  "data_access.payment.viewed": { label: "Payment viewed" },
  "data_access.activity_log.viewed": { label: "Activity log viewed" },
  "data_access.export.performed": { label: "Data exported" },
};

/**
 * Turns an unmapped key into something readable — "order.cart.cleared" becomes "Order cart
 * cleared". Keeps a new server action legible before anyone adds it above.
 */
const humanise = (action: string): string => {
  const words = action.replace(/[._]/g, " ").trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
};

export const actionLabel = (action: string): string =>
  ACTION_DEFINITIONS[action]?.label ?? humanise(action);

/**
 * The one-line summary shown on each row.
 *
 * Reads as a sentence about a person: actor first, then what they did, then where. The parts that
 * are unknown are omitted rather than rendered as "unknown".
 */
export const describeActivity = (log: ActivityLog): string => {
  const definition = ACTION_DEFINITIONS[log.action];
  const body = definition?.describe?.(log) ?? definition?.label ?? humanise(log.action);

  const actor = log.actorName?.trim();
  const sentence = actor ? `${actor} · ${body}` : body;

  return log.branchName ? `${sentence} · ${log.branchName}` : sentence;
};

/** Tailwind classes for the category chip, following the app's chip standard. */
export const CATEGORY_STYLES: Record<ActivityCategory, string> = {
  Auth: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800",
  UserManagement:
    "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950 dark:text-violet-300 dark:border-violet-900",
  Branch:
    "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950 dark:text-cyan-300 dark:border-cyan-900",
  Catalog:
    "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-900",
  Pricing:
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-900",
  Order:
    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-900",
  Payment:
    "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-900",
  Loyalty:
    "bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950 dark:text-pink-300 dark:border-pink-900",
  Offer:
    "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200 dark:bg-fuchsia-950 dark:text-fuchsia-300 dark:border-fuchsia-900",
  Fridge:
    "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-900",
  Attendance:
    "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950 dark:text-teal-300 dark:border-teal-900",
  Training:
    "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-900",
  Settings:
    "bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-300 dark:border-zinc-800",
  Integration:
    "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-900",
  Security:
    "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-900",
  DataAccess:
    "bg-stone-100 text-stone-700 border-stone-200 dark:bg-stone-900 dark:text-stone-300 dark:border-stone-800",
};

export const CATEGORY_LABELS: Record<ActivityCategory, string> = {
  Auth: "Sign-in",
  UserManagement: "Users",
  Branch: "Branches",
  Catalog: "Catalog",
  Pricing: "Pricing",
  Order: "Orders",
  Payment: "Payments",
  Loyalty: "Loyalty",
  Offer: "Offers",
  Fridge: "Fridge",
  Attendance: "Attendance",
  Training: "Training",
  Settings: "Settings",
  Integration: "Integrations",
  Security: "Security",
  DataAccess: "Data access",
};

export const SOURCE_APP_LABELS: Record<ActivitySourceApp, string> = {
  AdminPortal: "Admin portal",
  Ecommerce: "Online store",
  Pos: "POS",
  PublicApi: "API",
  System: "System",
  Integration: "Integration",
};

export const OUTCOME_LABELS: Record<ActivityOutcome, string> = {
  Success: "Succeeded",
  Failure: "Failed",
  Denied: "Denied",
};

export const SEVERITY_LABELS: Record<ActivitySeverity, string> = {
  Info: "Info",
  Warning: "Warning",
  Critical: "Critical",
};

/**
 * Uses the app's existing status utility classes so a failure here looks like a failure everywhere
 * else, rather than inventing a second visual language for the same idea.
 */
export const outcomeStyle = (outcome: ActivityOutcome): string => {
  if (outcome === "Denied") return "status-error";
  if (outcome === "Failure") return "status-warning";
  return "status-success";
};
