import { redirect } from "next/navigation";

/**
 * The audit log page moved to /admin/activity-logs when it stopped being a mock and started
 * covering all three platforms.
 *
 * Kept as a redirect rather than deleted: this path is in people's bookmarks and in the sidebar of
 * any tab open across the deploy.
 */
export default function AuditLogsRedirect() {
  redirect("/admin/activity-logs");
}
