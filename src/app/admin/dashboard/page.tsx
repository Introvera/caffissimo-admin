"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Package,
  Clock,
  ChevronRight,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { format, parseISO, eachDayOfInterval } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { KPICard } from "@/components/shared/kpi-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { useAppSelector } from "@/stores/store";
import { useGetOrdersQuery } from "@/stores/api/orderApi";
import { useGetBranchesQuery } from "@/stores/api/branchApi";
import { formatCurrency } from "@/lib/utils";
import { OrderSummaryResponse, OrderType } from "@/types";

const TYPE_COLORS: Record<string, string> = {
  DineIn: "#D97706",
  TakeAway: "#8C8C8C",
  Delivery: "#ADADAD",
  Online: "#C7C7C7",
};

const TYPE_LABELS: Record<string, string> = {
  DineIn: "Dine In",
  TakeAway: "Take Away",
  Delivery: "Delivery",
  Online: "Online",
};

export default function DashboardPage() {
  const { dateRange, selectedBranchId } = useAppSelector((state) => state.ui);

  // Fetch a large page of orders for the selected date range + branch
  const { data: ordersData, isLoading: ordersLoading } = useGetOrdersQuery({
    page: 1,
    pageSize: 10,
    branchId: selectedBranchId || undefined,
    orderDateFrom: dateRange.from ? format(dateRange.from, "yyyy-MM-dd'T'00:00:00.000'Z'") : undefined,
    orderDateTo: dateRange.to ? format(dateRange.to, "yyyy-MM-dd'T'23:59:59.999'Z'") : undefined,
    sortDescending: true,
  });

  // Also fetch recent orders (no date filter) for the activity feed
  const { data: recentData, isLoading: recentLoading } = useGetOrdersQuery({
    page: 1,
    pageSize: 10,
    branchId: selectedBranchId || undefined,
    sortDescending: true,
  });

  const { data: branchesData } = useGetBranchesQuery();

  const orders = ordersData?.items ?? [];
  const recentOrders = recentData?.items ?? [];
  const loading = ordersLoading || recentLoading;

  // ── KPIs ────────────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const active = orders.filter((o) => o.orderStatus !== "Cancelled");
    const cancelled = orders.filter((o) => o.orderStatus === "Cancelled");
    const totalSales = active.reduce((s, o) => s + (o.grandTotal || 0), 0);
    const orderCount = active.length;
    const avgOrderValue = orderCount > 0 ? totalSales / orderCount : 0;

    const byType: Record<string, number> = {};
    active.forEach((o) => {
      if (o.orderType) {
        byType[o.orderType] = (byType[o.orderType] ?? 0) + (o.grandTotal || 0);
      }
    });

    return { totalSales, orderCount, cancelledCount: cancelled.length, avgOrderValue, byType };
  }, [orders]);

  // ── Sales Trend ──────────────────────────────────────────────────────────
  const salesTrendData = useMemo(() => {
    if (!dateRange.from || !dateRange.to) return [];
    const days = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
    return days.map((day) => {
      const dayStr = format(day, "yyyy-MM-dd");
      const dayOrders = orders.filter(
        (o) => o.orderDate && format(parseISO(o.orderDate), "yyyy-MM-dd") === dayStr && o.orderStatus !== "Cancelled"
      );
      const byType: Record<string, number> = {};
        dayOrders.forEach((o) => {
          if (o.orderType) {
            byType[o.orderType] = (byType[o.orderType] ?? 0) + (o.grandTotal || 0);
          }
        });
        return {
          date: format(day, "MMM d"),
          total: dayOrders.reduce((s, o) => s + (o.grandTotal || 0), 0),
          ...byType,
        };
    });
  }, [dateRange, orders]);

  // ── Sales by Type (pie) ──────────────────────────────────────────────────
  const salesByType = useMemo(() =>
    Object.entries(kpis.byType)
      .map(([type, value]) => ({ name: TYPE_LABELS[type] ?? type, value, color: TYPE_COLORS[type] ?? "#888" }))
      .filter((s) => s.value > 0),
    [kpis.byType]
  );

  // ── Branch name helper ───────────────────────────────────────────────────
  const getBranchName = (branchId: string) => {
    return branchesData?.items.find((b) => b.branchId === branchId)?.branchName ?? branchId;
  };

  const tooltipStyle = {
    contentStyle: {
      backgroundColor: "hsl(var(--popover))",
      color: "hsl(var(--popover-foreground))",
      border: "1px solid hsl(var(--border))",
      borderRadius: "var(--radius-lg)",
      boxShadow: "var(--shadow-lg)",
      padding: "8px 12px",
    },
    labelStyle: { color: "hsl(var(--muted-foreground))" },
    itemStyle: { color: "hsl(var(--popover-foreground))" },
    wrapperStyle: { zIndex: 9999 },
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={
          selectedBranchId
            ? `${getBranchName(selectedBranchId)} Overview`
            : "Franchise Overview"
        }
      />

      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <Skeleton className="lg:col-span-2 h-[360px] rounded-xl" />
            <Skeleton className="h-[360px] rounded-xl" />
          </div>
        </div>
      ) : (
        <>
          {/* ── Top Row: KPIs + Sales by Type ─────────────────────────────── */}
          <div className="grid gap-4 lg:grid-cols-3 lg:grid-rows-[auto_1fr]">
            {/* KPI Cards */}
            <div className="lg:col-span-2 grid grid-cols-2 lg:grid-cols-4 gap-3 items-stretch">
              <KPICard
                title="Total Sales"
                value={kpis.totalSales}
                isCurrency
                icon={DollarSign}
                featured
              />
              <KPICard
                title="Orders"
                value={kpis.orderCount}
                icon={ShoppingCart}
                subtitle={`${kpis.cancelledCount} cancelled`}
              />
              <KPICard
                title="Avg Order"
                value={kpis.avgOrderValue}
                isCurrency
                icon={TrendingUp}
              />
              <KPICard
                title="Total Count"
                value={ordersData?.totalCount ?? 0}
                icon={Package}
              />
            </div>

            {/* Sales by Type (pie) — spans 2 rows */}
            <Card className="lg:row-span-2 flex flex-col">
              <CardHeader>
                <CardTitle>Sales by Type</CardTitle>
                <CardDescription>Revenue by order type</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="flex-1 min-h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={salesByType}
                        cx="50%" cy="50%"
                        innerRadius={60} outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {salesByType.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => formatCurrency(Number(value))}
                        {...tooltipStyle}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 space-y-2">
                  {salesByType.map((source) => (
                    <div key={source.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: source.color }} />
                        <span>{source.name}</span>
                      </div>
                      <span className="font-medium">{formatCurrency(source.value)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Sales Trend */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Sales Trend</CardTitle>
                <CardDescription>Daily total sales</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={salesTrendData}>
                      <defs>
                        <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#D97706" stopOpacity={0.25} />
                          <stop offset="100%" stopColor="#D97706" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                      <XAxis dataKey="date" className="text-xs" />
                      <YAxis className="text-xs" tickFormatter={(v) => `$${v}`} />
                      <Tooltip
                        formatter={(value) => formatCurrency(Number(value))}
                        {...tooltipStyle}
                      />
                      <Area
                        type="monotone"
                        dataKey="total"
                        stroke="#D97706"
                        strokeWidth={2}
                        fill="url(#salesGradient)"
                        dot={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ── Bottom Row: Recent Orders ────────────────────────────────── */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>Latest orders across all branches</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3">Order</th>
                      <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Type</th>
                      <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Status</th>
                      <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {recentOrders.map((order) => (
                      <tr
                        key={order.orderId}
                        className="hover:bg-muted/50 transition-colors"
                      >
                        <td className="px-6 py-3">
                          <Link href={`/admin/orders/${order.orderId}`} className="flex items-center gap-3">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
                              <Clock className="h-3.5 w-3.5 text-primary" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{order.orderNumber || "No Number"}</p>
                              <p className="text-xs text-muted-foreground">
                                {order.orderDate ? format(parseISO(order.orderDate), "MMM d, h:mm a") : "Unknown Date"}
                              </p>
                            </div>
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          <Link href={`/admin/orders/${order.orderId}`} className="text-xs text-muted-foreground whitespace-nowrap">
                            {order.orderType ? (TYPE_LABELS[order.orderType] ?? order.orderType) : "Unknown Type"}
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          <Link href={`/admin/orders/${order.orderId}`}>
                            <StatusBadge status={order.orderStatus} />
                          </Link>
                        </td>
                        <td className="px-6 py-3 text-right">
                          <Link href={`/admin/orders/${order.orderId}`} className="text-sm font-medium tabular-nums whitespace-nowrap">
                            {formatCurrency(order.grandTotal)}
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
