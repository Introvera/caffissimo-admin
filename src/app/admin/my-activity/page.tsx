"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight, FileSearch, TriangleAlert } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { LogDetailDialog } from "@/components/activity-logs/log-detail-dialog";
import { useAppSelector } from "@/stores/store";
import { useGetOwnActivityLogsQuery } from "@/stores/api/activityLogApi";
import {
  CATEGORY_LABELS,
  CATEGORY_STYLES,
  OUTCOME_LABELS,
  describeActivity,
  outcomeStyle,
} from "@/lib/activity-actions";
import { cn, formatDateTime } from "@/lib/utils";
import type { ActivityLog } from "@/types/activity-log";

const PAGE_SIZE = 25;

/**
 * Your own history.
 *
 * Open to every signed-in role, including the ones with no access to the admin log at all — you can
 * always see what you yourself did. The server forces the filter to the caller regardless of role,
 * so this page means the same thing for a cashier and for a super admin.
 */
export default function MyActivityPage() {
  const { dateRange } = useAppSelector((state) => state.ui);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<ActivityLog | null>(null);

  const queryParams = useMemo(
    () => ({
      from: dateRange.from ? format(dateRange.from, "yyyy-MM-dd'T'00:00:00.000'Z'") : undefined,
      to: dateRange.to ? format(dateRange.to, "yyyy-MM-dd'T'23:59:59.999'Z'") : undefined,
      page,
      pageSize: PAGE_SIZE,
    }),
    [dateRange, page],
  );

  const { data, isLoading, isFetching, isError } = useGetOwnActivityLogsQuery(queryParams);

  const logs = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const loading = isLoading || isFetching;

  return (
    <div className="space-y-6">
      <PageHeader title="My Activity" description="A record of what you have done" />

      <Card className="p-6 space-y-4 bg-white dark:bg-[#141414] border border-border shadow-none rounded-xl">
        <div className="overflow-hidden rounded-lg">
          {loading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          ) : isError ? (
            <div className="p-12">
              <EmptyState
                icon={TriangleAlert}
                title="Could not load your activity"
                description="The activity log could not be reached. Try again shortly."
              />
            </div>
          ) : logs.length === 0 ? (
            <div className="p-12">
              <EmptyState
                icon={FileSearch}
                title="Nothing recorded yet"
                description="Nothing of yours was recorded in the selected date range."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[170px]">When</TableHead>
                    <TableHead>What you did</TableHead>
                    <TableHead className="w-[130px]">Category</TableHead>
                    <TableHead className="w-[120px]">Outcome</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow
                      key={log.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelected(log)}
                    >
                      <TableCell className="text-body text-muted-foreground">
                        {formatDateTime(log.occurredAt)}
                      </TableCell>
                      <TableCell className="text-body">{describeActivity(log)}</TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "text-chip px-2.5 py-1 rounded-md border",
                            CATEGORY_STYLES[log.category],
                          )}
                        >
                          {CATEGORY_LABELS[log.category]}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "text-chip px-2.5 py-1 rounded-md border",
                            outcomeStyle(log.outcome),
                          )}
                        >
                          {OUTCOME_LABELS[log.outcome]}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {!loading && !isError && logs.length > 0 && (
          <div className="flex items-center justify-between pt-1">
            <p className="text-body text-muted-foreground">
              Showing{" "}
              <span className="font-medium text-foreground">{(page - 1) * PAGE_SIZE + 1}</span> to{" "}
              <span className="font-medium text-foreground">
                {Math.min(page * PAGE_SIZE, totalCount)}
              </span>{" "}
              of <span className="font-medium text-foreground">{totalCount}</span> events
            </p>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setPage((p) => p - 1)}
                disabled={page <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      <LogDetailDialog log={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
