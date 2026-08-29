"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppSelector } from "@/stores/store";
import { useGetOrdersQuery } from "@/stores/api/orderApi";
import { formatCurrency, cn } from "@/lib/utils";
import { OrderStatus, OrderType, PaymentType } from "@/types";
import { MoreVertical } from "lucide-react";

const ORDER_TYPE_LABELS: Record<string, string> = {
  DineIn: "Dine In",
  TakeAway: "Take Away",
  Delivery: "Delivery",
  Online: "Online",
};

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All Status" },
  { value: "Pending", label: "Pending" },
  { value: "Confirmed", label: "Confirmed" },
  { value: "Preparing", label: "Preparing" },
  { value: "Ready", label: "Ready" },
  { value: "Completed", label: "Completed" },
  { value: "Cancelled", label: "Cancelled" },
];

const ORDER_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All Types" },
  { value: "DineIn", label: "Dine In" },
  { value: "TakeAway", label: "Take Away" },
  { value: "Delivery", label: "Delivery" },
  { value: "Online", label: "Online" },
];

const PAYMENT_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All Payments" },
  { value: "Cash", label: "Cash" },
  { value: "Card", label: "Card" },
  { value: "Online", label: "Online" },
  { value: "External", label: "External" },
];

export default function OrdersPage() {
  const { dateRange, selectedBranchId } = useAppSelector((state) => state.ui);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [orderTypeFilter, setOrderTypeFilter] = useState("all");
  const [sortDescending, setSortDescending] = useState(true);

  const PAGE_SIZE = 10;

  const queryParams = useMemo(
    () => ({
      page,
      pageSize: PAGE_SIZE,
      branchId: selectedBranchId || undefined,
      search: search || undefined,
      orderStatus:
        statusFilter !== "all" ? (statusFilter as OrderStatus) : undefined,
      orderType:
        orderTypeFilter !== "all" ? (orderTypeFilter as OrderType) : undefined,
      orderDateFrom: dateRange.from
        ? format(dateRange.from, "yyyy-MM-dd'T'00:00:00.000'Z'")
        : undefined,
      orderDateTo: dateRange.to
        ? format(dateRange.to, "yyyy-MM-dd'T'23:59:59.999'Z'")
        : undefined,
      sortDescending,
    }),
    [
      page,
      search,
      statusFilter,
      orderTypeFilter,
      selectedBranchId,
      dateRange,
      sortDescending,
    ],
  );

  const { data, isLoading, isFetching } = useGetOrdersQuery(queryParams);

  const orders = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const loading = isLoading || isFetching;

  // Reset to page 1 when filters change
  const handleFilterChange = (setter: (v: string) => void) => (v: string) => {
    setter(v);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orders"
        description="Manage orders from all branches"
      />

      <Card className="p-6 space-y-4 bg-white dark:bg-[#141414] border border-border shadow-none rounded-xl">
        {/* Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by order number..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9 w-[320px] h-9 bg-white dark:bg-[#141414] rounded-lg"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Select
              value={orderTypeFilter}
              onValueChange={handleFilterChange(setOrderTypeFilter)}
            >
              <SelectTrigger className="w-auto h-9 gap-1.5 rounded-lg border-border/80 bg-white dark:bg-[#141414] px-3.5 text-body font-medium shadow-none">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                {ORDER_TYPE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={statusFilter}
              onValueChange={handleFilterChange(setStatusFilter)}
            >
              <SelectTrigger className="w-auto h-9 gap-1.5 rounded-lg border-border/80 bg-white dark:bg-[#141414] px-3.5 text-body font-medium shadow-none">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-1.5"
              onClick={() => {
                setSortDescending((d) => !d);
                setPage(1);
              }}
            >
              {sortDescending ? (
                <ArrowDown className="h-3.5 w-3.5" />
              ) : (
                <ArrowUp className="h-3.5 w-3.5" />
              )}
              {sortDescending ? "Newest" : "Oldest"}
            </Button>
          </div>
        </div>

        {/* Table / State Container */}
        <div className="overflow-hidden rounded-lg">
          {loading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="p-12">
              <EmptyState
                icon={ShoppingCart}
                title="No orders found"
                description={
                  search || statusFilter !== "all" || orderTypeFilter !== "all"
                    ? "No orders match your current filters."
                    : "No orders found for the selected date range and branch."
                }
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-0">
                  <TableHead>Order</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.orderId}>
                    <TableCell>
                      <Link
                        href={`/admin/orders/${order.orderId}`}
                        className="font-medium text-foreground hover:underline"
                      >
                        {order.orderNumber}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <span className="text-body text-muted-foreground">
                        {order.orderType
                          ? (ORDER_TYPE_LABELS[order.orderType] ??
                            order.orderType)
                          : "Unknown"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={order.orderStatus} />
                    </TableCell>
                    <TableCell>
                      <span className="text-body text-muted-foreground capitalize">
                        {order.paymentType}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-body text-muted-foreground">
                        {order.orderDate
                          ? format(
                              parseISO(order.orderDate),
                              "MMM d, yyyy h:mm a",
                            )
                          : "Unknown Date"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-medium text-foreground">
                        {formatCurrency(order.grandTotal || 0)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/orders/${order.orderId}`}>
                              View
                            </Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Pagination */}
        {!loading && orders.length > 0 && (
          <div className="flex items-center justify-between pt-1">
            <p className="text-body text-muted-foreground">
              Showing{" "}
              <span className="font-medium text-foreground">
                {(page - 1) * PAGE_SIZE + 1}
              </span>{" "}
              to{" "}
              <span className="font-medium text-foreground">
                {Math.min(page * PAGE_SIZE, totalCount)}
              </span>{" "}
              of{" "}
              <span className="font-medium text-foreground">
                {totalCount}
              </span>{" "}
              orders
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
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
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
                      page === pageNum && "bg-primary text-white hover:bg-primary/90 hover:text-white"
                    )}
                    onClick={() => setPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
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
    </div>
  );
}
