"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Download,
  FileText,
  TrendingUp,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { parseISO, format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/shared/page-header";
import { useAppSelector } from "@/stores/store";
import { canAccessAdmin } from "@/lib/rbac";
import { useGetBranchesQuery } from "@/stores/api/branchApi";
import { useGetSalesReportQuery } from "@/stores/api/analyticsApi";
import { UserRole } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";

export default function ReportsPage() {
  const { dateRange, selectedBranchId, currentRole: uiRole } = useAppSelector((state) => state.ui);
  const authRole = useAppSelector((state) => state.auth.user?.role) || UserRole.Cashier;
  const currentRole = uiRole || authRole;
  const showBranchComparison = canAccessAdmin(currentRole) && currentRole !== UserRole.BranchOwner && currentRole !== UserRole.BranchAdmin;
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [dailyPage, setDailyPage] = useState(0);
  const DAILY_PAGE_SIZE = 10;

  // Dynamic branches from API
  const { data: branchesData, isLoading: isLoadingBranches, refetch: refetchBranches } = useGetBranchesQuery({ pageSize: 100 });
  const branches = branchesData?.items ?? [];

  // Fetch sales report from API
  const { data: reportData, isLoading: isLoadingReport, refetch: refetchSalesReport } = useGetSalesReportQuery({
    orderDateFrom: dateRange.from ? format(dateRange.from, "yyyy-MM-dd'T'00:00:00.000'Z'") : "",
    orderDateTo: dateRange.to ? format(dateRange.to, "yyyy-MM-dd'T'23:59:59.999'Z'") : "",
    branchId: selectedBranchId || undefined,
  }, {
    skip: !dateRange.from || !dateRange.to
  });

  // Reset daily pagination when filters change
  useEffect(() => {
    setDailyPage(0);
  }, [dateRange, selectedBranchId, sourceFilter]);

  // Daily summary data
  const dailySummary = useMemo(() => {
    if (!reportData?.dailySummary) return [];
    return reportData.dailySummary.map((item) => {
      const parsedDate = parseISO(item.date);
      const isPos = sourceFilter === "all" || sourceFilter === "pos";
      const isDineIn = sourceFilter === "all" || sourceFilter === "dineIn";
      const isTakeaway = sourceFilter === "all" || sourceFilter === "takeaway";
      const isDelivery = sourceFilter === "all" || sourceFilter === "delivery";

      const posVal = isPos ? (item.pos || 0) : 0;
      const dineInVal = isDineIn ? (item.dineIn || 0) : 0;
      const takeawayVal = isTakeaway ? (item.takeaway || 0) : 0;
      const deliveryVal = isDelivery ? (item.delivery || 0) : 0;

      return {
        date: format(parsedDate, "MMM d"),
        fullDate: item.date,
        POS: posVal,
        "Dine In": dineInVal,
        "Take Away": takeawayVal,
        "Delivery": deliveryVal,
        total: posVal + dineInVal + takeawayVal + deliveryVal,
        orders: item.orders || 0,
      };
    });
  }, [reportData, sourceFilter]);

  // Branch comparison data
  const branchComparison = useMemo(() => {
    if (!reportData?.branchComparison) return [];
    return reportData.branchComparison.map((item) => {
      return {
        name: item.branchName.replace("Caffissimo", "").trim(),
        branchId: item.branchId,
        totalSales: item.totalSales || 0,
        orders: item.orders || 0,
        avgOrder: item.avgOrder || 0,
      };
    });
  }, [reportData]);

  // Totals
  const totals = useMemo(() => {
    if (!reportData) {
      return { total: 0, orders: 0, avg: 0 };
    }
    return {
      total: reportData.totalSales || 0,
      orders: reportData.totalOrders || 0,
      avg: reportData.averageOrderValue || 0,
    };
  }, [reportData]);

  const showSkeleton = isLoadingBranches || isLoadingReport;

  if (showSkeleton) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Sales Reports"
          description="Analyze sales performance across branches and sources"
        />
        
        {/* Summary Cards Skeleton */}
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-6 w-32" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Chart Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-48 mb-2" />
            <Skeleton className="h-4 w-72" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[350px] w-full rounded-lg" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales Reports"
        description="Analyze sales performance across branches and sources"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="pos">POS</SelectItem>
                <SelectItem value="dineIn">Dine In</SelectItem>
                <SelectItem value="takeaway">Take Away</SelectItem>
                <SelectItem value="delivery">Delivery</SelectItem>
              </SelectContent>
            </Select>
            <div className="h-6 w-px bg-border hidden sm:block" />
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-muted-foreground hover:text-foreground shrink-0"
              onClick={() => { refetchBranches(); refetchSalesReport(); }}
              title="Refresh report data"
              disabled={isLoadingBranches || isLoadingReport}
            >
              <RefreshCw className={`h-4 w-4 ${(isLoadingBranches || isLoadingReport) ? "animate-spin" : ""}`} />
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="outline" size="sm">
              <FileText className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
          </div>
        }
      />

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-primary/10 p-3">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-body text-muted-foreground">Total Sales</p>
                <p className="text-h2 font-bold">{formatCurrency(totals.total)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-primary/10 p-3">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-body text-muted-foreground">Total Orders</p>
                <p className="text-h2 font-bold">{totals.orders}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-primary/10 p-3">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-body text-muted-foreground">Avg Order Value</p>
                <p className="text-h2 font-bold">{formatCurrency(totals.avg)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="daily" className="space-y-4">
        <TabsList>
          <TabsTrigger value="daily">Daily Summary</TabsTrigger>
          {showBranchComparison && (
            <TabsTrigger value="branches">Branch Comparison</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="daily" className="space-y-4">
          {/* Daily Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Sales by Source</CardTitle>
              <CardDescription>Daily breakdown by order source</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailySummary}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                    <XAxis dataKey="date" className="text-caption" />
                    <YAxis tickFormatter={(v) => `$${v}`} className="text-caption" />
                    <Tooltip
                      formatter={(value) => formatCurrency(Number(value))}
                      contentStyle={{
                        backgroundColor: "hsl(var(--popover))",
                        color: "hsl(var(--popover-foreground))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "var(--radius-lg)",
                      }}
                      labelStyle={{ color: "hsl(var(--muted-foreground))" }}
                    />
                    <Legend />
                    <Bar dataKey="POS" fill="#D97706" stackId="a" />
                    <Bar dataKey="Dine In" fill="#8C8C8C" stackId="a" />
                    <Bar dataKey="Take Away" fill="#ADADAD" stackId="a" />
                    <Bar dataKey="Delivery" fill="#C7C7C7" stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Daily Table */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Totals</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">POS</TableHead>
                    <TableHead className="text-right">Dine In</TableHead>
                    <TableHead className="text-right">Take Away</TableHead>
                    <TableHead className="text-right">Delivery</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Orders</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dailySummary
                    .slice(dailyPage * DAILY_PAGE_SIZE, (dailyPage + 1) * DAILY_PAGE_SIZE)
                    .map((day) => (
                      <TableRow key={day.fullDate}>
                        <TableCell className="font-medium">{day.date}</TableCell>
                        <TableCell className="text-right">{formatCurrency(day.POS)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(day["Dine In"])}</TableCell>
                        <TableCell className="text-right">{formatCurrency(day["Take Away"])}</TableCell>
                        <TableCell className="text-right">{formatCurrency(day.Delivery)}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(day.total)}</TableCell>
                        <TableCell className="text-right">{day.orders}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
              {dailySummary.length > DAILY_PAGE_SIZE && (
                <div className="flex items-center justify-between border-t pt-4 mt-4">
                  <p className="text-body text-muted-foreground">
                    Showing {dailyPage * DAILY_PAGE_SIZE + 1}–{Math.min((dailyPage + 1) * DAILY_PAGE_SIZE, dailySummary.length)} of {dailySummary.length} days
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDailyPage((p) => p - 1)}
                      disabled={dailyPage === 0}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDailyPage((p) => p + 1)}
                      disabled={(dailyPage + 1) * DAILY_PAGE_SIZE >= dailySummary.length}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {showBranchComparison && (
          <TabsContent value="branches" className="space-y-4">
            {/* Branch Comparison Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Branch Performance</CardTitle>
                <CardDescription>Revenue comparison across branches</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={branchComparison} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                      <XAxis type="number" tickFormatter={(v) => `$${v}`} className="text-caption" />
                      <YAxis type="category" dataKey="name" width={100} className="text-caption" />
                      <Tooltip
                        formatter={(value) => formatCurrency(Number(value))}
                        contentStyle={{
                          backgroundColor: "#232323",
                          color: "#FFFFFF",
                          border: "none",
                          borderRadius: "var(--radius)",
                        }}
                        labelStyle={{ color: "#9B9B9B" }}
                      />
                      <Bar dataKey="totalSales" fill="#D97706" radius={4} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Branch Ranking Table */}
            <Card>
              <CardHeader>
                <CardTitle>Branch Ranking</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rank</TableHead>
                      <TableHead>Branch</TableHead>
                      <TableHead className="text-right">Total Sales</TableHead>
                      <TableHead className="text-right">Orders</TableHead>
                      <TableHead className="text-right">Avg Order</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {branchComparison.map((branch, index) => (
                      <TableRow key={branch.branchId}>
                        <TableCell>
                          <span className={index === 0 ? "text-primary font-bold" : ""}>
                            #{index + 1}
                          </span>
                        </TableCell>
                        <TableCell className="font-medium">{branch.name}</TableCell>
                        <TableCell className="text-right">{formatCurrency(branch.totalSales)}</TableCell>
                        <TableCell className="text-right">{branch.orders}</TableCell>
                        <TableCell className="text-right">{formatCurrency(branch.avgOrder)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

