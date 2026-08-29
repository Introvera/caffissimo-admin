"use client";

import { useState, useMemo } from "react";
import {
  Search,
  Download,
  Calendar,
  DoorOpen,
  DoorClosed,
  LogIn,
  LogOut,
  Monitor,
} from "lucide-react";
import { format, parseISO, isWithinInterval, startOfDay } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { useAppSelector } from "@/stores/store";
import { canViewAttendance, canAccessAllBranches } from "@/lib/rbac";
import { useGetBranchesQuery } from "@/stores/api/branchApi";
import { useGetAttendanceRecordsQuery } from "@/stores/api/attendanceApi";
import { formatDate } from "@/lib/utils";
import { UserRole, AttendanceRecordResponse } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";

const PAGE_TITLE = "POS Login / Logout Report";
const PAGE_DESCRIPTION = "First login and last logout times per day. Inactive cashiers are auto-logged out after 10 minutes.";

export default function POSLoginReportPage() {
  const { currentRole: uiRole, selectedBranchId, assignedBranchId, dateRange } = useAppSelector((state) => state.ui);
  const authRole = useAppSelector((state) => state.auth.user?.role) || UserRole.Cashier;
  const currentRole = uiRole || authRole;
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecordResponse | null>(null);

  const effectiveBranchId = selectedBranchId || assignedBranchId;
  const canView = canViewAttendance(authRole);

  const { data: branchesData, isLoading: branchesLoading } = useGetBranchesQuery({ pageSize: 100 });
  const branches = branchesData?.items || [];

  const { data: attendanceData, isLoading: attendanceLoading } = useGetAttendanceRecordsQuery({
    branchId: effectiveBranchId || undefined,
    startDate: dateRange.from ? format(dateRange.from, "yyyy-MM-dd") : undefined,
    endDate: dateRange.to ? format(dateRange.to, "yyyy-MM-dd") : undefined,
    page: 1,
    pageSize: 100,
  }, {
    skip: !canView
  });

  const records = attendanceData?.items || [];

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      const matchesSearch =
        !searchQuery ||
        record.userDisplayName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [records, searchQuery]);

  const groupedByDate = useMemo(() => {
    const groups: Record<string, AttendanceRecordResponse[]> = {};
    filteredRecords.forEach((record) => {
      if (!groups[record.date]) groups[record.date] = [];
      groups[record.date].push(record);
    });
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [filteredRecords]);

  const getBranchName = (branchId: string) => {
    return branches.find((b) => b.branchId === branchId)?.branchName.replace("Caffissimo", "").trim() || "Unknown";
  };

  const formatTime = (isoString?: string | null) => {
    if (!isoString) return "—";
    try {
      return format(parseISO(isoString), "hh:mm a");
    } catch {
      return isoString;
    }
  };

  if (!canView) {
    return (
      <div className="space-y-6">
        <PageHeader title={PAGE_TITLE} />
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={Monitor}
              title="Access Denied"
              description="You don't have permission to view this report"
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  const isLoading = branchesLoading || attendanceLoading;

  return (
    <div className="space-y-6">
      <PageHeader
        title={PAGE_TITLE}
        description={PAGE_DESCRIPTION}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 w-[280px] h-9"
              />
            </div>
            <Button variant="outline" size="sm" className="h-9">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        }
      />

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : groupedByDate.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={Monitor}
              title="No login records"
              description="POS login and logout data will appear here"
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {groupedByDate.map(([date, dateRecords]) => (
            <Card key={date} className="p-6 space-y-4 bg-white dark:bg-[#141414] border border-border shadow-none rounded-xl">
              <h3 className="text-body font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {formatDate(date)}
              </h3>
              <div className="overflow-hidden rounded-lg">
                <Table className="table-fixed">
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-0">
                      <TableHead className="w-auto">Employee</TableHead>
                      {canAccessAllBranches(currentRole) && <TableHead className="w-auto">Branch</TableHead>}
                      <TableHead className="w-[120px]">First login</TableHead>
                      <TableHead className="w-[120px]">Last logout</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dateRecords.map((record) => (
                      <TableRow
                        key={record.attendanceId}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => setSelectedRecord(record)}
                      >
                        <TableCell className="font-medium">
                          {record.userDisplayName}
                        </TableCell>
                        {canAccessAllBranches(currentRole) && (
                          <TableCell>{getBranchName(record.branchId)}</TableCell>
                        )}
                        <TableCell className="whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5">
                            <DoorOpen className="h-4 w-4 text-muted-foreground shrink-0" />
                            {formatTime(record.firstLogin)}
                          </span>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5">
                            <DoorClosed className="h-4 w-4 text-muted-foreground shrink-0" />
                            {formatTime(record.lastLogout)}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal: all login/logout sessions for the selected row */}
      <Dialog open={!!selectedRecord} onOpenChange={() => setSelectedRecord(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Session details</DialogTitle>
            <p className="text-body text-muted-foreground">
              {selectedRecord && (
                <>
                  {selectedRecord.userDisplayName} — {formatDate(selectedRecord.date)}
                </>
              )}
            </p>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-3 pt-2">
              <p className="text-caption text-muted-foreground">
                All login and logout times for this day. System auto-logs out after 10 min of no activity.
              </p>
              <div className="rounded-lg border divide-y">
                {selectedRecord.sessions.map((session, i) => {
                  const isFirst = i === 0;
                  const isLast = i === selectedRecord.sessions.length - 1;
                  const LoginIcon = isFirst ? DoorOpen : LogIn;
                  const LogoutIcon = isLast ? DoorClosed : LogOut;
                  return (
                    <div
                      key={session.posSessionId}
                      className="flex items-center justify-between px-4 py-3 text-body"
                    >
                      <span className="inline-flex items-center gap-2">
                        <LoginIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        {formatTime(session.loginAt)}
                      </span>
                      <span className="text-muted-foreground">→</span>
                      <span className="inline-flex items-center gap-2">
                        <LogoutIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        {formatTime(session.logoutAt)}
                        {session.endReason === "Idle" && (
                          <span className="text-caption text-amber-600 dark:text-amber-400">
                            (auto)
                          </span>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

