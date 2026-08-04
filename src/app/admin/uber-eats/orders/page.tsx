"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/stores/store";
import { useGetBranchesQuery } from "@/stores/api/branchApi";
import { useGetUberOrdersQuery } from "@/stores/api/uberApi";
import { canAccessAdmin, canAccessAllBranches } from "@/lib/rbac";
import { PageHeader } from "@/components/shared/page-header";
import { KPICard } from "@/components/shared/kpi-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ShoppingBag,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Package,
  AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";
import { UserRole } from "@/types";

const ORDER_TABS = [
  { key: "all", label: "All", icon: Package },
  { key: "CREATED", label: "New", icon: Clock },
  { key: "ACCEPTED", label: "Accepted", icon: CheckCircle2 },
  { key: "DENIED", label: "Denied", icon: XCircle },
  { key: "CANCELED", label: "Cancelled", icon: XCircle },
  { key: "FINISHED", label: "Completed", icon: CheckCircle2 },
];

function stateVariant(state: string | null): "default" | "secondary" | "destructive" | "outline" {
  switch (state?.toUpperCase()) {
    case "CREATED": return "default";
    case "ACCEPTED": return "secondary";
    case "DENIED": return "destructive";
    case "CANCELED": return "destructive";
    case "FINISHED": return "outline";
    default: return "outline";
  }
}

function formatMoney(amount: number, currency: string = "USD"): string {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

function formatOptionalDate(date: string | null): string {
  if (!date) return "-";
  try {
    return format(new Date(date), "MMM d, h:mm a");
  } catch {
    return date;
  }
}

function getDeadlineInfo(deadlineAt: string | null): { text: string; urgent: boolean; expired: boolean } | null {
  if (!deadlineAt) return null;
  const deadline = new Date(deadlineAt);
  const now = new Date();
  const diffMs = deadline.getTime() - now.getTime();

  if (diffMs <= 0) return { text: "Expired", urgent: true, expired: true };
  const diffMin = Math.floor(diffMs / 60000);
  const diffSec = Math.floor((diffMs % 60000) / 1000);

  return {
    text: diffMin > 0 ? `${diffMin}m ${diffSec}s` : `${diffSec}s`,
    urgent: diffMin < 3,
    expired: false,
  };
}

export default function UberEatsOrdersPage() {
  const router = useRouter();
  const currentRole = useAppSelector((state) => state.auth.user?.role) || UserRole.Cashier;
  const assignedBranchId = useAppSelector((state) => state.auth.user?.branchId) || null;
  const persistedSelectedBranchId = useAppSelector((state) => state.ui.selectedBranchId);

  const canUseAllBranches = canAccessAllBranches(currentRole);

  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [page, setPage] = useState(1);
  const [, setTick] = useState(0);

  const { data: branchesData } = useGetBranchesQuery({
    page: 1,
    pageSize: 100,
  });

  const branchOptions = useMemo(() => {
    const branches = branchesData?.items ?? [];
    if (canUseAllBranches) return branches;
    if (!assignedBranchId) return [];
    return branches.filter((branch) => branch.branchId === assignedBranchId);
  }, [assignedBranchId, branchesData?.items, canUseAllBranches]);

  useEffect(() => {
    if (branchOptions.length === 0) return;
    if (selectedBranchId && branchOptions.some((b) => b.branchId === selectedBranchId)) return;

    const preferred = persistedSelectedBranchId
      && branchOptions.some((b) => b.branchId === persistedSelectedBranchId)
      ? persistedSelectedBranchId
      : assignedBranchId
        && branchOptions.some((b) => b.branchId === assignedBranchId)
        ? assignedBranchId
        : branchOptions[0]?.branchId;

    if (preferred) setSelectedBranchId(preferred);
  }, [branchOptions, selectedBranchId, persistedSelectedBranchId, assignedBranchId]);

  const { data: ordersData, isLoading: ordersLoading, refetch } = useGetUberOrdersQuery(
    {
      branchId: selectedBranchId || undefined,
      status: activeTab === "all" ? undefined : activeTab,
      page,
      pageSize: 15,
    },
    { pollingInterval: 30000, skip: !selectedBranchId }
  );

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!canAccessAdmin(currentRole)) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          You do not have permission to access this page.
        </CardContent>
      </Card>
    );
  }

  const orders = ordersData?.items ?? [];
  const totalCount = ordersData?.totalCount ?? 0;
  const newCount = orders.filter((o) => o.currentState === "CREATED").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Uber Eats Orders"
        description="Monitor incoming Uber Eats orders"
        actions={
          <div className="flex items-center gap-3">
            <Select
              value={selectedBranchId}
              onValueChange={(v) => { setSelectedBranchId(v); setPage(1); }}
            >
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Select branch" />
              </SelectTrigger>
              <SelectContent>
                {branchOptions.map((b) => (
                  <SelectItem key={b.branchId} value={b.branchId}>
                    {b.branchName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={ordersLoading}>
              <RefreshCw className={`h-4 w-4 mr-1 ${ordersLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard title="Total Orders" value={totalCount} icon={Package} isLoading={ordersLoading} />
        <KPICard title="New (Pending)" value={newCount} icon={Clock} isLoading={ordersLoading} />
        <KPICard
          title="Page"
          value={`${page} / ${Math.max(1, Math.ceil(totalCount / 15))}`}
          icon={ShoppingBag}
          isLoading={ordersLoading}
        />
        <KPICard title="Auto-refresh" value="30s" icon={RefreshCw} />
      </div>

      <div className="flex gap-2 flex-wrap">
        {ORDER_TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <Button
              key={tab.key}
              variant={activeTab === tab.key ? "default" : "outline"}
              size="sm"
              onClick={() => { setActiveTab(tab.key); setPage(1); }}
            >
              <Icon className="h-4 w-4 mr-1" />
              {tab.label}
            </Button>
          );
        })}
      </div>

      {ordersLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="No orders found"
          description={activeTab === "all" ? "No Uber Eats orders yet." : `No ${activeTab.toLowerCase()} orders.`}
        />
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const deadline = order.currentState === "CREATED"
              ? getDeadlineInfo(order.acceptDeadlineAt)
              : null;

            return (
              <Card
                key={order.uberOrderStagingId}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => router.push(`/admin/uber-eats/orders/${order.uberOrderStagingId}`)}
              >
                <CardContent className="py-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold text-lg">
                            #{order.displayId ?? order.uberOrderId.slice(0, 5).toUpperCase()}
                          </span>
                          <Badge variant={stateVariant(order.currentState)}>
                            {order.orderStatus ?? order.currentState ?? "Unknown"}
                          </Badge>
                          {order.promotionSummary && (
                            <Badge variant="outline" className="text-xs">
                              Promo
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1 flex items-center gap-3 flex-wrap">
                          <span>{order.customerName ?? "Unknown customer"}</span>
                          <span>{order.itemCount} item{order.itemCount !== 1 ? "s" : ""}</span>
                          <span>{order.fulfillmentType ?? order.orderType ?? ""}</span>
                          <span>{formatOptionalDate(order.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      {deadline && !deadline.expired && (
                        <div className={`text-sm font-mono ${deadline.urgent ? "text-destructive font-semibold" : "text-muted-foreground"}`}>
                          <Clock className="h-3 w-3 inline mr-1" />
                          {deadline.text}
                        </div>
                      )}
                      {deadline?.expired && (
                        <div className="text-sm text-destructive font-semibold">
                          <AlertTriangle className="h-3 w-3 inline mr-1" />
                          Expired
                        </div>
                      )}
                      <span className="font-semibold text-lg">
                        {formatMoney(order.totalAmount, order.currencyCode)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {totalCount > 15 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground self-center">
            Page {page} of {Math.ceil(totalCount / 15)}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= Math.ceil(totalCount / 15)}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
