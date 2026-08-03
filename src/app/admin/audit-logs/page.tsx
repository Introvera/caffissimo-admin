"use client";

import { useState, useMemo } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  FileSearch,
  Clock,
  User,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
  Header,
} from "@tanstack/react-table";
import { parseISO, isWithinInterval, startOfDay } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { useAppSelector } from "@/stores/store";
import { canViewAuditLogs } from "@/lib/rbac";
import { auditLogs, branches } from "@/data/seed";
import { formatDateTime } from "@/lib/utils";
import { AuditLog, AuditAction, UserRole } from "@/types";

const actionLabels: Record<AuditAction, string> = {
  price_change: "Price Changed",
  offer_change: "Offer Modified",
  order_cancelled: "Order Cancelled",
  user_created: "User Created",
  user_updated: "User Updated",
  branch_updated: "Branch Updated",
  product_created: "Product Created",
  product_updated: "Product Updated",
  stock_report: "Stock Report",
  attendance_updated: "Attendance Updated",
  settings_updated: "Settings Updated",
};

const actionBadgeVariants: Record<AuditAction, "default" | "secondary" | "destructive" | "outline"> = {
  price_change: "secondary",
  offer_change: "secondary",
  order_cancelled: "destructive",
  user_created: "default",
  user_updated: "outline",
  branch_updated: "outline",
  product_created: "default",
  product_updated: "outline",
  stock_report: "secondary",
  attendance_updated: "outline",
  settings_updated: "secondary",
};

const columnHelper = createColumnHelper<AuditLog>();

function SortIcon({ header }: { header: Header<AuditLog, unknown> }) {
  if (!header.column.getCanSort()) return null;
  const sorted = header.column.getIsSorted();
  if (sorted === "asc") return <ArrowUp className="h-3.5 w-3.5 ml-1" />;
  if (sorted === "desc") return <ArrowDown className="h-3.5 w-3.5 ml-1" />;
  return <ArrowUpDown className="h-3.5 w-3.5 ml-1 opacity-40" />;
}

function formatDetails(details: Record<string, unknown>) {
  return Object.entries(details)
    .map(([key, value]) => `${key}: ${value}`)
    .join(", ");
}

export default function AuditLogsPage() {
  const { currentRole: uiRole, selectedBranchId, dateRange } = useAppSelector((state) => state.ui);
  const authRole = useAppSelector((state) => state.auth.user?.role) || UserRole.Cashier;
  const currentRole = uiRole || authRole;
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");

  const canView = canViewAuditLogs(currentRole);

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const logDate = parseISO(log.createdAt);
      const inDateRange = isWithinInterval(logDate, {
        start: startOfDay(dateRange.from),
        end: dateRange.to,
      });
      const inBranch = !selectedBranchId || log.branchId === selectedBranchId;
      const matchesSearch =
        !globalFilter ||
        log.userName.toLowerCase().includes(globalFilter.toLowerCase()) ||
        log.entityType.toLowerCase().includes(globalFilter.toLowerCase());
      const matchesAction = actionFilter === "all" || log.action === actionFilter;
      return inDateRange && inBranch && matchesSearch && matchesAction;
    });
  }, [dateRange, selectedBranchId, globalFilter, actionFilter]);

  const getBranchName = (branchId?: string) => {
    if (!branchId) return "-";
    return branches.find((b) => b.branchId === branchId)?.branchName.replace("Caffissimo", "").trim() || "Unknown";
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor("createdAt", {
        header: "Timestamp",
        cell: (info) => (
          <span className="text-sm text-muted-foreground inline-flex items-center gap-2">
            <Clock className="h-3 w-3" />
            {formatDateTime(info.getValue())}
          </span>
        ),
      }),
      columnHelper.accessor("action", {
        header: "Action",
        enableSorting: false,
        cell: (info) => (
          <Badge variant={actionBadgeVariants[info.getValue()]}>
            {actionLabels[info.getValue()]}
          </Badge>
        ),
      }),
      columnHelper.accessor("userName", {
        header: "User",
        enableSorting: false,
        cell: (info) => (
          <span className="inline-flex items-center gap-2 text-sm text-foreground">
            <User className="h-3 w-3 text-muted-foreground" />
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor((row) => `${row.entityType} ${row.entityId}`, {
        id: "entity",
        header: "Entity",
        enableSorting: false,
        cell: (info) => (
          <span className="text-sm text-foreground">
            {info.row.original.entityType}
            <span className="text-muted-foreground"> #{info.row.original.entityId.split("-").pop()}</span>
          </span>
        ),
      }),
      columnHelper.accessor("branchId", {
        header: "Branch",
        enableSorting: false,
        cell: (info) => (
          <span className="text-sm text-foreground">
            {getBranchName(info.getValue())}
          </span>
        ),
      }),
      columnHelper.accessor("details", {
        header: "Details",
        enableSorting: false,
        cell: (info) => (
          <span className="text-xs text-muted-foreground truncate block max-w-[200px]">
            {formatDetails(info.getValue())}
          </span>
        ),
      }),
    ],
    []
  );

  const table = useReactTable({
    data: filteredLogs,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      pagination: { pageSize: 10 },
    },
  });

  const pageIndex = table.getState().pagination.pageIndex;
  const pageSize = table.getState().pagination.pageSize;
  const totalRows = table.getFilteredRowModel().rows.length;

  if (!canView) {
    return (
      <div className="space-y-6">
        <PageHeader title="Audit Logs" />
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={FileSearch}
              title="Access Denied"
              description="You don't have permission to view audit logs"
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Logs"
        description="Track all system changes and activities"
      />

      {/* Filter Bar - same layout as Orders */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-auto h-9 gap-1.5 rounded-lg border-border/80 bg-background px-3.5 text-sm font-medium shadow-none">
              <SelectValue placeholder="Action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              {Object.entries(actionLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search logs..."
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-9 w-[220px] h-9 bg-background rounded-lg"
          />
        </div>
      </div>

      <div>
        <div className="p-0">
          {filteredLogs.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={FileSearch}
                title="No logs found"
                description="Try adjusting your search or filters"
              />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow
                      key={headerGroup.id}
                      className="hover:bg-transparent border-b border-border/60"
                    >
                      {headerGroup.headers.map((header) => (
                        <TableHead
                          key={header.id}
                          className={
                            header.column.getCanSort()
                              ? "cursor-pointer select-none"
                              : ""
                          }
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          <span className="inline-flex items-center">
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                            <SortIcon header={header} />
                          </span>
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination - same as Orders */}
              <div className="flex items-center justify-between border-t border-border/60 px-6 py-4">
                <p className="text-sm text-muted-foreground">
                  Showing{" "}
                  <span className="font-medium text-foreground">
                    {pageIndex * pageSize + 1}
                  </span>
                  {" "}to{" "}
                  <span className="font-medium text-foreground">
                    {Math.min((pageIndex + 1) * pageSize, totalRows)}
                  </span>
                  {" "}of{" "}
                  <span className="font-medium text-foreground">{totalRows}</span>
                  {" "}logs
                </p>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {Array.from({ length: Math.min(table.getPageCount(), 5) }, (_, i) => {
                    let pageNum: number;
                    const totalPages = table.getPageCount();
                    if (totalPages <= 5) {
                      pageNum = i;
                    } else if (pageIndex < 3) {
                      pageNum = i;
                    } else if (pageIndex > totalPages - 4) {
                      pageNum = totalPages - 5 + i;
                    } else {
                      pageNum = pageIndex - 2 + i;
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={pageIndex === pageNum ? "default" : "outline"}
                        size="sm"
                        className="h-8 w-8 p-0 text-xs"
                        onClick={() => table.setPageIndex(pageNum)}
                      >
                        {pageNum + 1}
                      </Button>
                    );
                  })}
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
