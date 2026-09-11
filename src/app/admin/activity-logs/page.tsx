"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  FileSearch,
  Radio,
  Search,
  TriangleAlert,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  useGetActivityLogFacetsQuery,
  useGetActivityLogsQuery,
} from "@/stores/api/activityLogApi";
import { canViewActivityLogs } from "@/lib/rbac";
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
import { UserRole } from "@/types";
import type {
  ActivityCategory,
  ActivityLog,
  ActivityOutcome,
  ActivitySourceApp,
} from "@/types/activity-log";

const PAGE_SIZE = 25;

/**
 * Platform tabs. "All" first because the common question is "what happened", not "what happened
 * in the POS" — the split matters once you already have a suspicion.
 */
const PLATFORM_TABS: { value: string; label: string }[] = [
  { value: "all", label: "All" },
  { value: "AdminPortal", label: "Admin portal" },
  { value: "Ecommerce", label: "Online store" },
  { value: "Pos", label: "POS" },
  { value: "System", label: "System" },
];

export default function ActivityLogsPage() {
  const { selectedBranchId, dateRange } = useAppSelector((state) => state.ui);
  const uiRole = useAppSelector((state) => state.ui.currentRole);
  const authRole = useAppSelector((state) => state.auth.user?.role);

  // Gating reads the authenticated role, not the dev-mode override. The override exists to preview
  // layouts, and letting it widen what is requested would be misleading — the server would refuse
  // anyway, and the user would see an error rather than a preview.
  const role = (authRole || uiRole || UserRole.Cashier) as UserRole;
  const canView = canViewActivityLogs(role);

  const [platform, setPlatform] = useState<string>("all");
  const [category, setCategory] = useState<string>("all");
  const [outcome, setOutcome] = useState<string>("all");
  const [action, setAction] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [live, setLive] = useState(false);
  const [selected, setSelected] = useState<ActivityLog | null>(null);
  const [correlationId, setCorrelationId] = useState<string | null>(null);

  // Matches the one debounce already in this app. Without it every keystroke is a query against
  // the largest table in the system.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [platform, category, outcome, action, debouncedSearch, selectedBranchId, correlationId, dateRange]);

  const range = useMemo(
    () => ({
      from: dateRange.from ? format(dateRange.from, "yyyy-MM-dd'T'00:00:00.000'Z'") : undefined,
      to: dateRange.to ? format(dateRange.to, "yyyy-MM-dd'T'23:59:59.999'Z'") : undefined,
    }),
    [dateRange],
  );

  const queryParams = useMemo(
    () => ({
      ...range,
      sourceApp: platform !== "all" ? (platform as ActivitySourceApp) : undefined,
      category: category !== "all" ? (category as ActivityCategory) : undefined,
      outcome: outcome !== "all" ? (outcome as ActivityOutcome) : undefined,
      action: action !== "all" ? action : undefined,
      branchId: selectedBranchId || undefined,
      correlationId: correlationId || undefined,
      search: debouncedSearch || undefined,
      page,
      pageSize: PAGE_SIZE,
    }),
    [range, platform, category, outcome, action, selectedBranchId, correlationId, debouncedSearch, page],
  );

  const { data, isLoading, isFetching, isError, error } = useGetActivityLogsQuery(queryParams, {
    skip: !canView,
    pollingInterval: live ? 15000 : 0,
  });

  // Filter options come from what this viewer can actually see, so the dropdowns never offer a
  // category they are not cleared for or an action with no matching rows.
  const { data: facets } = useGetActivityLogFacetsQuery(range, { skip: !canView });

  const logs = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const countIsExact = data?.countIsExact ?? true;
  const loading = isLoading || isFetching;

  const hasFilters =
    platform !== "all" ||
    category !== "all" ||
    outcome !== "all" ||
    action !== "all" ||
    !!debouncedSearch ||
    !!correlationId;

  const criticalCount = logs.filter((log) => log.severity === "Critical").length;

  if (!canView) {
    return (
      <div className="space-y-6">
        <PageHeader title="Activity Logs" />
        <Card className="p-6 bg-white dark:bg-[#141414] border border-border shadow-none rounded-xl">
          <div className="p-12">
            <EmptyState
              icon={FileSearch}
              title="Not available for your role"
              description="You can review your own activity from the My Activity page."
            />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Activity Logs"
        description="Everything that happened across the admin portal, online store and POS"
      />

      {criticalCount > 0 && (
        // Pinned rather than left to be found by scrolling. A critical row is one someone needs to
        // see today, and the table sorts by time, not by how much it matters.
        <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3">
          <TriangleAlert className="h-4 w-4 shrink-0 text-destructive" />
          <p className="text-body text-destructive">
            {criticalCount} critical {criticalCount === 1 ? "event" : "events"} on this page.
          </p>
        </div>
      )}

      <Card className="p-6 space-y-4 bg-white dark:bg-[#141414] border border-border shadow-none rounded-xl">
        <Tabs value={platform} onValueChange={setPlatform}>
          <TabsList>
            {PLATFORM_TABS.filter(
              (tab) =>
                tab.value === "all" ||
                !facets?.sourceApps.length ||
                facets.sourceApps.includes(tab.value as ActivitySourceApp),
            ).map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {correlationId && (
          <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/40 px-4 py-2.5">
            <p className="text-body text-muted-foreground">
              Showing every event from one request.
            </p>
            <Button variant="outline" size="sm" className="h-8" onClick={() => setCorrelationId(null)}>
              Clear
            </Button>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by person, record or action..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-[320px] h-9 bg-white dark:bg-[#141414] rounded-lg"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-auto h-9 gap-1.5 rounded-lg border-border/80 bg-white dark:bg-[#141414] px-3.5 text-body font-medium shadow-none">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {(facets?.categories ?? []).map((value) => (
                  <SelectItem key={value} value={value}>
                    {CATEGORY_LABELS[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={action} onValueChange={setAction}>
              <SelectTrigger className="w-auto h-9 gap-1.5 rounded-lg border-border/80 bg-white dark:bg-[#141414] px-3.5 text-body font-medium shadow-none">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All actions</SelectItem>
                {(facets?.actions ?? []).map((value) => (
                  <SelectItem key={value} value={value}>
                    {actionLabel(value)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={outcome} onValueChange={setOutcome}>
              <SelectTrigger className="w-auto h-9 gap-1.5 rounded-lg border-border/80 bg-white dark:bg-[#141414] px-3.5 text-body font-medium shadow-none">
                <SelectValue placeholder="Outcome" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any outcome</SelectItem>
                <SelectItem value="Success">Succeeded</SelectItem>
                <SelectItem value="Failure">Failed</SelectItem>
                <SelectItem value="Denied">Denied</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant={live ? "default" : "outline"}
              size="sm"
              className="h-9 gap-1.5"
              onClick={() => setLive((on) => !on)}
            >
              <Radio className="h-3.5 w-3.5" />
              {live ? "Live" : "Paused"}
            </Button>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg">
          {loading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          ) : isError ? (
            // Every other list page in this app renders nothing on failure, which looks identical
            // to "no results". For an audit trail that difference matters: an empty log and an
            // unreachable log are very different answers.
            <div className="p-12">
              <EmptyState
                icon={TriangleAlert}
                title="Could not load activity"
                description={
                  (error as { data?: { message?: string } })?.data?.message ||
                  "The activity log could not be reached. Try again shortly."
                }
              />
            </div>
          ) : logs.length === 0 ? (
            <div className="p-12">
              <EmptyState
                icon={FileSearch}
                title="No activity found"
                description={
                  hasFilters
                    ? "No activity matches your current filters."
                    : "Nothing was recorded for the selected date range and branch."
                }
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[170px]">When</TableHead>
                    <TableHead>What happened</TableHead>
                    <TableHead className="w-[130px]">Category</TableHead>
                    <TableHead className="w-[120px]">Outcome</TableHead>
                    {platform === "all" && <TableHead className="w-[120px]">Source</TableHead>}
                    {platform === "Pos" && <TableHead className="w-[140px]">Till</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow
                      key={log.id}
                      className={cn(
                        "cursor-pointer hover:bg-muted/50",
                        log.severity === "Critical" && "bg-destructive/5",
                      )}
                      onClick={() => setSelected(log)}
                    >
                      <TableCell className="text-body text-muted-foreground">
                        {formatDateTime(log.occurredAt)}
                        {log.wasDelayed && (
                          <span className="ml-1.5 text-chip px-2.5 py-1 rounded-md border status-warning">
                            delayed
                          </span>
                        )}
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

                      {platform === "all" && (
                        <TableCell className="text-body text-muted-foreground">
                          {SOURCE_APP_LABELS[log.sourceApp]}
                        </TableCell>
                      )}

                      {platform === "Pos" && (
                        <TableCell className="text-body text-muted-foreground">
                          {log.deviceLabel || log.deviceId || "—"}
                        </TableCell>
                      )}
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
              of{" "}
              <span className="font-medium text-foreground">
                {/* The server caps the count, so past the cap this is a floor and printing it as a
                    total would simply be wrong. */}
                {countIsExact ? totalCount : `${totalCount.toLocaleString()}+`}
              </span>{" "}
              events
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

              {countIsExact ? (
                Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const pageNum =
                    totalPages <= 5
                      ? i + 1
                      : page <= 3
                        ? i + 1
                        : page > totalPages - 3
                          ? totalPages - 4 + i
                          : page - 2 + i;
                  return (
                    <Button
                      key={pageNum}
                      variant={page === pageNum ? "default" : "outline"}
                      size="sm"
                      className={cn(
                        "h-8 w-8 p-0 text-caption font-medium",
                        page === pageNum &&
                          "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground",
                      )}
                      onClick={() => setPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })
              ) : (
                // Numbered pages imply a known total. Past the cap there isn't one, so the control
                // becomes a plain position indicator instead of a set of buttons that lie.
                <span className="px-2 text-caption font-medium text-muted-foreground">
                  Page {page}
                </span>
              )}

              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setPage((p) => p + 1)}
                disabled={countIsExact ? page >= totalPages : !data?.hasMore}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      <LogDetailDialog
        log={selected}
        onClose={() => setSelected(null)}
        onShowRequest={(id) => {
          setCorrelationId(id);
          setSelected(null);
        }}
      />
    </div>
  );
}
