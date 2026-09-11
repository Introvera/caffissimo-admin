"use client";

import { useState } from "react";
import { History } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { LogDetailDialog } from "./log-detail-dialog";
import { useGetActivityLogsForEntityQuery } from "@/stores/api/activityLogApi";
import {
  CATEGORY_STYLES,
  CATEGORY_LABELS,
  describeActivity,
} from "@/lib/activity-actions";
import { cn, formatDateTime } from "@/lib/utils";
import type { ActivityLog } from "@/types/activity-log";

/**
 * History for one record, meant to be dropped into a detail page as a "History" tab.
 *
 * Sharing the detail dialog with the main log page rather than rendering its own is deliberate: a
 * row should look and behave the same wherever it is shown, and a second renderer would drift.
 *
 * Rows are filtered by the same server-side rules as everywhere else, so this shows an empty
 * timeline rather than an error when the viewer is not cleared for the record's category.
 */
interface EntityActivityTimelineProps {
  entityType: string;
  entityId: string;
  className?: string;
}

export function EntityActivityTimeline({
  entityType,
  entityId,
  className,
}: EntityActivityTimelineProps) {
  const [selected, setSelected] = useState<ActivityLog | null>(null);

  const { data, isLoading, isError } = useGetActivityLogsForEntityQuery(
    { entityType, entityId },
    { skip: !entityId },
  );

  const logs = data ?? [];

  if (isLoading) {
    return (
      <div className={cn("space-y-2", className)}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (isError || logs.length === 0) {
    return (
      <div className={cn("py-10", className)}>
        <EmptyState
          icon={History}
          title="No history recorded"
          description={
            isError
              ? "The activity log could not be reached."
              : "Nothing has been recorded against this record yet."
          }
        />
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <ol className="relative space-y-0">
        {logs.map((log, index) => (
          <li key={log.id} className="relative flex gap-3 pb-4">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                  log.outcome === "Success" ? "bg-primary" : "bg-destructive",
                )}
              />
              {/* The connector stops at the last entry so the line reads as a thread between
                  events rather than trailing into nothing. */}
              {index < logs.length - 1 && <span className="mt-1 w-px flex-1 bg-border" />}
            </div>

            <button
              type="button"
              className="flex-1 rounded-lg px-2 py-1 text-left hover:bg-muted/50"
              onClick={() => setSelected(log)}
            >
              <p className="text-body">{describeActivity(log)}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="text-caption text-muted-foreground">
                  {formatDateTime(log.occurredAt)}
                </span>
                <span
                  className={cn(
                    "text-chip px-2.5 py-1 rounded-md border",
                    CATEGORY_STYLES[log.category],
                  )}
                >
                  {CATEGORY_LABELS[log.category]}
                </span>
              </div>
            </button>
          </li>
        ))}
      </ol>

      <LogDetailDialog log={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
