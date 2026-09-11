/**
 * Reports an event the server cannot see for itself.
 *
 * Authentication happens against Firebase in the browser, so a wrong password never reaches our
 * API. Without this, "someone tried five bad passwords against the manager's account" leaves no
 * trace server-side at all.
 *
 * Deliberately not routed through apiClient: that wrapper redirects to the login page on a 401,
 * which is exactly where we already are, and it throws on failure. Neither is wanted here — this is
 * a best-effort report and must never interfere with what the user is doing.
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export type ClientReportableAction =
  | "auth.login.failed"
  | "auth.pin.rejected"
  | "auth.supervisor_pin.rejected";

interface ReportClientEventInput {
  action: ClientReportableAction;

  /**
   * The account the attempt was against. Recorded as context only — the server never attributes
   * the row to that user, since nobody has proved they are them.
   */
  attemptedIdentifier?: string;

  /** Provider error code, e.g. auth/wrong-password. */
  reason?: string;
}

export async function reportClientEvent({
  action,
  attemptedIdentifier,
  reason,
}: ReportClientEventInput): Promise<void> {
  if (!BASE_URL) return;

  try {
    await fetch(`${BASE_URL}/api/activity-logs/client-event`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Client-App": "AdminPortal",
      },
      body: JSON.stringify({
        action,
        outcome: "Failure",
        attemptedIdentifier,
        reason,
      }),
      // No credentials: the endpoint is anonymous by necessity, and sending a stale cookie would
      // only invite the server to attribute the attempt to whoever was signed in before.
      credentials: "omit",
    });
  } catch {
    // Swallowed on purpose. A failed sign-in is already a bad moment for the user; a network error
    // while reporting it must not become a second visible failure.
  }
}
