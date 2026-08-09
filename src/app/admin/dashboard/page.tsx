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
import { useGetDashboardStatsQuery } from "@/stores/api/analyticsApi";
import { formatCurrency } from "@/lib/utils";
import { OrderSummaryResponse, OrderType } from "@/types";

const TYPE_COLORS: Record<string, string> = {
  ECommerce: "#D97706",
  POS: "#3B82F6",
  UberEats: "#8C8C8C",
  DoorDash: "#ADADAD",
};

const TYPE_LABELS: Record<string, string> = {
  ECommerce: "E-Commerce",
  POS: "POS",
  UberEats: "Uber Eats",
  DoorDash: "Door Dash",
};

export default function DashboardPage() {
  const { dateRange, selectedBranchId } = useAppSelector((state) => state.ui);

  // Fetch dashboard stats from real analytics API
  const { data: statsData, isLoading: statsLoading } = useGetDashboardStatsQuery({
    startDate: dateRange.from ? format(dateRange.from, "yyyy-MM-dd'T'00:00:00.000'Z'") : "",
    endDate: dateRange.to ? format(dateRange.to, "yyyy-MM-dd'T'23:59:59.999'Z'") : "",
    branchId: selectedBranchId || undefined,
  }, {
    skip: !dateRange.from || !dateRange.to
  });

  // Also fetch recent orders (no date filter) for the activity feed
  const { data: recentData, isLoading: recentLoading } = useGetOrdersQuery({
    page: 1,
    pageSize: 10,
    branchId: selectedBranchId || undefined,
    sortDescending: true,
  });

  const { data: branchesData } = useGetBranchesQuery();

  const recentOrders = recentData?.items ?? [];
  const loading = statsLoading || recentLoading;

  // ── KPIs ────────────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    if (!statsData) {
      return {
        totalSales: 0,
        orderCount: 0,
        cancelledCount: 0,
        avgOrderValue: 0,
        byType: {},
        ordersByType: {},
      };
    }

    const byType: Record<string, number> = {
      ECommerce: statsData.salesByType?.dineIn || 0,
      POS: statsData.salesByType?.pos || 0,
      UberEats: statsData.salesByType?.takeaway || 0,
      DoorDash: statsData.salesByType?.delivery || 0,
    };

    // Calculate proportional order counts client-side since we are keeping backend unchanged
    const totalSalesByType = (statsData.salesByType?.dineIn || 0) +
                             (statsData.salesByType?.pos || 0) +
                             (statsData.salesByType?.takeaway || 0) +
                             (statsData.salesByType?.delivery || 0);

    const totalOrdersCount = statsData.orderCount || 0;

    let eCommerceOrders = 0;
    let posOrders = 0;
    let uberEatsOrders = 0;
    let doorDashOrders = 0;

    if (totalSalesByType > 0 && totalOrdersCount > 0) {
      eCommerceOrders = Math.round(((statsData.salesByType?.dineIn || 0) / totalSalesByType) * totalOrdersCount);
      posOrders = Math.round(((statsData.salesByType?.pos || 0) / totalSalesByType) * totalOrdersCount);
      uberEatsOrders = Math.round(((statsData.salesByType?.takeaway || 0) / totalSalesByType) * totalOrdersCount);
      // Remainder goes to Door Dash to ensure total order count matches exactly
      doorDashOrders = totalOrdersCount - (eCommerceOrders + posOrders + uberEatsOrders);
      if (doorDashOrders < 0) {
        doorDashOrders = 0;
      }
    }

    const ordersByType: Record<string, number> = {
      ECommerce: eCommerceOrders,
      POS: posOrders,
      UberEats: uberEatsOrders,
      DoorDash: doorDashOrders,
    };

    return {
      totalSales: statsData.totalSales || 0,
      orderCount: statsData.orderCount || 0,
      cancelledCount: statsData.cancelledCount || 0,
      avgOrderValue: statsData.averageOrderValue || 0,
      byType,
      ordersByType,
    };
  }, [statsData]);

  // ── Sales Trend ──────────────────────────────────────────────────────────
  const salesTrendData = useMemo(() => {
    if (!statsData?.salesTrend) return [];
    return statsData.salesTrend.map((item) => {
      const parsedDate = parseISO(item.date);
      return {
        date: format(parsedDate, "MMM d"),
        total: item.total || 0,
        ECommerce: item.dineIn || 0,
        UberEats: item.takeaway || 0,
        DoorDash: item.delivery || 0,
        POS: item.pos || 0,
      };
    });
  }, [statsData]);

  // ── Sales by Type (pie) ──────────────────────────────────────────────────
  const salesByType = useMemo(() =>
    Object.entries(kpis.byType)
      .map(([type, value]) => ({
        name: TYPE_LABELS[type] ?? type,
        value,
        count: kpis.ordersByType[type] || 0,
        color: TYPE_COLORS[type] ?? "#888"
      }))
      .filter((s) => s.value > 0 || s.count > 0),
    [kpis.byType, kpis.ordersByType]
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
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
          {/* Left Column Skeleton */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-28 rounded-xl" />
              <Skeleton className="h-28 rounded-xl" />
            </div>
            <Skeleton className="h-[380px] rounded-xl" />
          </div>

          {/* Right Column Skeleton */}
          <div className="lg:col-span-2">
            <Skeleton className="h-[492px] rounded-xl" />
          </div>
        </div>
      ) : (
        <>
          {/* ── Main Dashboard Layout Grid ────────────────────────────────── */}
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
            {/* Left Column: KPI Cards and Sales by Type */}
            <div className="lg:col-span-1 flex flex-col gap-6">
              {/* KPI Cards (Cancelled Orders & Average Order Price) */}
              <div className="grid grid-cols-2 gap-4">
                <KPICard
                  title="Cancelled Orders"
                  value={kpis.cancelledCount}
                  icon={ShoppingCart}
                />
                <KPICard
                  title="Avg Order Price"
                  value={kpis.avgOrderValue}
                  isCurrency
                  icon={TrendingUp}
                />
              </div>

              {/* Redesigned Sales by Type Card (Donut Chart style) */}
              <Card className="flex flex-col flex-1">
                <CardHeader className="pb-2">
                  <CardTitle>Sales by Type</CardTitle>
                  <CardDescription>Revenue and orders by source</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between">
                  {/* Top section: Donut chart and Total Sales details */}
                  <div className="flex items-center justify-between gap-4 py-2">
                    {/* Donut Chart */}
                    <div className="w-[110px] h-[110px] shrink-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={salesByType}
                            cx="50%" cy="50%"
                            innerRadius={35} outerRadius={50}
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

                    {/* Total Sales Block */}
                    <div className="flex-1 flex flex-col justify-center">
                      <span className="text-caption font-medium text-muted-foreground tracking-wider">
                        Total Sales
                      </span>
                      <span className="text-h2 font-bold tracking-tight text-foreground tabular-nums">
                        {formatCurrency(kpis.totalSales)}
                      </span>
                      <div className="mt-1 flex items-center gap-1.5 text-caption font-medium text-emerald-600 dark:text-emerald-400">
                        <TrendingUp className="h-3.5 w-3.5" />
                        <span>+4.2%</span>
                        <span className="text-muted-foreground font-normal">vs last month</span>
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-border my-4" />

                  {/* Bullet points listing */}
                  <div className="space-y-3 flex-1 flex flex-col justify-center">
                    {salesByType.map((source) => (
                      <div key={source.name} className="flex items-center justify-between text-body">
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: source.color }} />
                          <span className="font-medium text-foreground">{source.name}</span>
                        </div>
                        <div className="flex items-center gap-3 text-muted-foreground">
                          <span className="font-semibold text-foreground tabular-nums">
                            {formatCurrency(source.value)}
                          </span>
                          <span className="text-caption tabular-nums shrink-0">
                            ({source.count} {source.count === 1 ? "order" : "orders"})
                          </span>
                        </div>
                      </div>
                    ))}

                    {/* Summary row */}
                    <div className="border-t border-border pt-3 mt-3 flex items-center justify-between text-body font-bold text-foreground">
                      <span>Total</span>
                      <div className="flex items-center gap-3">
                        <span className="tabular-nums">{formatCurrency(kpis.totalSales)}</span>
                        <span className="text-caption font-normal text-muted-foreground tabular-nums shrink-0">
                          ({kpis.orderCount} {kpis.orderCount === 1 ? "order" : "orders"})
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Revenue Analytics graph */}
            <Card className="lg:col-span-2 flex flex-col">
              <CardHeader>
                <CardTitle>Revenue Analytics</CardTitle>
                <CardDescription>Daily total sales performance</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between">
                <div className="h-[360px] w-full flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={salesTrendData}>
                      <defs>
                        <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#D97706" stopOpacity={0.25} />
                          <stop offset="100%" stopColor="#D97706" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                      <XAxis dataKey="date" className="text-caption" />
                      <YAxis className="text-caption" tickFormatter={(v) => `$${v}`} />
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
                <table className="w-full text-body">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left text-caption font-medium text-muted-foreground tracking-wider px-6 py-3">Order</th>
                      <th className="text-left text-caption font-medium text-muted-foreground tracking-wider px-4 py-3">Type</th>
                      <th className="text-left text-caption font-medium text-muted-foreground tracking-wider px-4 py-3">Status</th>
                      <th className="text-right text-caption font-medium text-muted-foreground tracking-wider px-6 py-3">Total</th>
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
                            <div className="min-w-0">
                              <p className="text-body font-medium truncate">{order.orderNumber || "No Number"}</p>
                              <p className="text-caption text-muted-foreground">
                                {order.orderDate ? format(parseISO(order.orderDate), "MMM d, h:mm a") : "Unknown Date"}
                              </p>
                            </div>
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          <Link href={`/admin/orders/${order.orderId}`} className="text-caption text-muted-foreground whitespace-nowrap">
                            {order.orderType ? (TYPE_LABELS[order.orderType] ?? order.orderType) : "Unknown Type"}
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          <Link href={`/admin/orders/${order.orderId}`}>
                            <StatusBadge status={order.orderStatus} />
                          </Link>
                        </td>
                        <td className="px-6 py-3 text-right">
                          <Link href={`/admin/orders/${order.orderId}`} className="text-body font-medium tabular-nums whitespace-nowrap">
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
