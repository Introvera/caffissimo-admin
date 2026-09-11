"use client";

import { Clock, Monitor, TriangleAlert, User } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChangeDiff, MetadataList } from "./change-diff";
import {
  CATEGORY_LABELS,
  CATEGORY_STYLES,
  OUTCOME_LABELS,
  SOURCE_APP_LABELS,
  actionLabel,
  describeActivity,
  outcomeStyle,
} from "@/lib/activity-actions";
import { cn, formatDateTime } from "@/lib/utils";
import type { ActivityLog } from "@/types/activity-log";

/**
 * The full story of one row.
 *
 * A centred dialog rather than a side drawer, matching the existing detail pattern on the
 * attendance page — the app has no drawer component and introducing one for this alone would put a
 * second interaction model in front of users for no gain.
 */

interface LogDetailDialogProps {
  log: ActivityLog | null;
  onClose: () => void;
  onShowRequest?: (correlationId: string) => void;
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-2.5">
      <span className="text-caption text-muted-foreground">{label}</span>
      <span className="text-body text-right break-all">{children}</span>
    </div>
  );
}

export function LogDetailDialog({ log, onClose, onShowRequest }: LogDetailDialogProps) {
  return (
    <Dialog open={!!log} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl">
        {log && (
          <>
            <DialogHeader>
              <DialogTitle className="pr-6">{actionLabel(log.action)}</DialogTitle>
              <p className="text-body text-muted-foreground">{describeActivity(log)}</p>
            </DialogHeader>

            <ScrollArea className="max-h-[65vh] pr-3">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      "text-chip px-2.5 py-1 rounded-md border",
                      CATEGORY_STYLES[log.category],
                    )}
                  >
                    {CATEGORY_LABELS[log.category]}
                  </span>
                  <span className={cn("text-chip px-2.5 py-1 rounded-md border", outcomeStyle(log.outcome))}>
                    {OUTCOME_LABELS[log.outcome]}
                  </span>
                  <span className="text-chip px-2.5 py-1 rounded-md border bg-muted/40 text-muted-foreground">
                    {SOURCE_APP_LABELS[log.sourceApp]}
                  </span>
                </div>

                {log.errorMessage && (
                  <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
                    <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                    <p className="text-body text-destructive">{log.errorMessage}</p>
                  </div>
                )}

                <section className="space-y-2">
                  <h3 className="flex items-center gap-1.5 text-caption font-medium text-muted-foreground">
                    <User className="h-3.5 w-3.5" />
                    Who
                  </h3>
                  <div className="rounded-lg border divide-y">
                    <Row label="Person">{log.actorName || "Not recorded"}</Row>
                    <Row label="Role">{log.actorRole || "—"}</Row>
                    <Row label="Branch">{log.branchName || "—"}</Row>
                    {log.pushedByUserId && (
                      // Only appears when a batch spanned a shift change, which is exactly when
                      // "who did it" and "whose session delivered it" need telling apart.
                      <Row label="Delivered by">{log.pushedByUserId}</Row>
                    )}
                  </div>
                </section>

                <section className="space-y-2">
                  <h3 className="flex items-center gap-1.5 text-caption font-medium text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    When
                  </h3>
                  <div className="rounded-lg border divide-y">
                    <Row label="Happened">{formatDateTime(log.occurredAt)}</Row>
                    {log.wasDelayed && (
                      <Row label="Reached server">
                        {formatDateTime(log.receivedAt)}
                        <span className="ml-2 text-chip px-2.5 py-1 rounded-md border status-warning">
                          delayed
                        </span>
                      </Row>
                    )}
                    {log.timestampAdjusted && (
                      // The device clock was outside the believable window and was clamped. Worth
                      // surfacing, because it means the time shown is the server's guess.
                      <Row label="Timestamp">Adjusted — the device clock was out of range</Row>
                    )}
                  </div>
                </section>

                {(log.entityType || log.entityId) && (
                  <section className="space-y-2">
                    <h3 className="text-caption font-medium text-muted-foreground">What</h3>
                    <div className="rounded-lg border divide-y">
                      <Row label="Record type">{log.entityType || "—"}</Row>
                      <Row label="Record">{log.entitySummary || log.entityId || "—"}</Row>
                    </div>
                  </section>
                )}

                <section className="space-y-2">
                  <h3 className="text-caption font-medium text-muted-foreground">Changes</h3>
                  <ChangeDiff changes={log.changes} />
                </section>

                {log.metadata && Object.keys(log.metadata).length > 0 && (
                  <section className="space-y-2">
                    <h3 className="text-caption font-medium text-muted-foreground">Details</h3>
                    <MetadataList metadata={log.metadata} />
                  </section>
                )}

                <section className="space-y-2">
                  <h3 className="flex items-center gap-1.5 text-caption font-medium text-muted-foreground">
                    <Monitor className="h-3.5 w-3.5" />
                    Technical
                  </h3>
                  <div className="rounded-lg border divide-y">
                    {log.httpMethod && (
                      <Row label="Request">
                        {log.httpMethod} {log.path}
                      </Row>
                    )}
                    {log.statusCode != null && <Row label="Response">{log.statusCode}</Row>}
                    {log.durationMs != null && <Row label="Took">{log.durationMs} ms</Row>}
                    {log.deviceLabel || log.deviceId ? (
                      <Row label="Device">{log.deviceLabel || log.deviceId}</Row>
                    ) : null}
                    {log.appVersion && <Row label="App version">{log.appVersion}</Row>}
                    {log.correlationId && (
                      <Row label="Request group">
                        {onShowRequest ? (
                          <button
                            type="button"
                            className="text-primary underline underline-offset-2"
                            onClick={() => onShowRequest(log.correlationId!)}
                          >
                            Show everything from this request
                          </button>
                        ) : (
                          log.correlationId
                        )}
                      </Row>
                    )}
                  </div>
                </section>
              </div>
            </ScrollArea>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
