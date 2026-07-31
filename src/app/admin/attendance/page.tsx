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
import { parseISO, isWithinInterval, startOfDay } from "date-fns";
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
import { posDayRecords, branches } from "@/data/seed";
import { formatDate } from "@/lib/utils";
import { POSDayRecord, UserRole } from "@/types";

const PAGE_TITLE = "POS Login / Logout Report";
const PAGE_DESCRIPTION = "First login and last logout times per day. Inactive cashiers are auto-logged out after 10 minutes.";

export default function POSLoginReportPage() {
  const { currentRole: uiRole, selectedBranchId, assignedBranchId, dateRange } = useAppSelector((state) => state.ui);
  const authRole = useAppSelector((state) => state.auth.user?.role) || UserRole.Cashier;
  const currentRole = uiRole || authRole;
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<POSDayRecord | null>(null);

  const effectiveBranchId = selectedBranchId || assignedBranchId;
  const canView = canViewAttendance(authRole);

  const filteredRecords = useMemo(() => {
    return posDayRecords.filter((record) => {
      const recordDate = parseISO(record.date);
      const inDateRange = isWithinInterval(recordDate, {
        start: startOfDay(dateRange.from),
        end: dateRange.to,
      });
      const inBranch = !effectiveBranchId || record.branchId === effectiveBranchId;
      const matchesSearch =
        !searchQuery ||
        record.userName.toLowerCase().includes(searchQuery.toLowerCase());
      return inDateRange && inBranch && matchesSearch;
    });
  }, [dateRange, effectiveBranchId, searchQuery]);

  const groupedByDate = useMemo(() => {
    const groups: Record<string, POSDayRecord[]> = {};
    filteredRecords.forEach((record) => {
      if (!groups[record.date]) groups[record.date] = [];
      groups[record.date].push(record);
    });
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [filteredRecords]);

  const getBranchName = (branchId: string) => {
    return branches.find((b) => b.branchId === branchId)?.branchName.replace("Caffissimo", "").trim() || "Unknown";
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
                className="pl-8 w-[200px] h-9"
              />
            </div>
            <Button variant="outline" size="sm" className="h-9">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        }
      />

      {groupedByDate.length === 0 ? (
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
          {groupedByDate.map(([date, records]) => (
            <div key={date}>
              <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {formatDate(date)}
              </h3>
              <Table className="table-fixed">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-auto">Employee</TableHead>
                    {canAccessAllBranches(currentRole) && <TableHead className="w-auto">Branch</TableHead>}
                    <TableHead className="w-[120px]">First login</TableHead>
                    <TableHead className="w-[120px]">Last logout</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((record) => (
                    <TableRow
                      key={record.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedRecord(record)}
                    >
                      <TableCell className="font-medium">
                        {record.userName}
                      </TableCell>
                      {canAccessAllBranches(currentRole) && (
                        <TableCell>{getBranchName(record.branchId)}</TableCell>
                      )}
                      <TableCell className="whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5">
                          <DoorOpen className="h-4 w-4 text-muted-foreground shrink-0" />
                          {record.firstLogin}
                        </span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5">
                          <DoorClosed className="h-4 w-4 text-muted-foreground shrink-0" />
                          {record.lastLogout}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ))}
        </div>
      )}

      {/* Modal: all login/logout sessions for the selected row */}
      <Dialog open={!!selectedRecord} onOpenChange={() => setSelectedRecord(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Session details</DialogTitle>
            <p className="text-sm text-muted-foreground">
              {selectedRecord && (
                <>
                  {selectedRecord.userName} — {formatDate(selectedRecord.date)}
                </>
              )}
            </p>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-3 pt-2">
              <p className="text-xs text-muted-foreground">
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
                      key={i}
                      className="flex items-center justify-between px-4 py-3 text-sm"
                    >
                      <span className="inline-flex items-center gap-2">
                        <LoginIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        {session.loginAt}
                      </span>
                      <span className="text-muted-foreground">→</span>
                      <span className="inline-flex items-center gap-2">
                        <LogoutIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        {session.logoutAt}
                        {session.autoLogout && (
                          <span className="text-xs text-amber-600 dark:text-amber-400">
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
