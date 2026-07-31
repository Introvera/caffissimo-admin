"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import {
  ArrowLeft,
  AlertTriangle,
  Package,
  Store,
  CircleCheck,
  CircleDot,
  Circle,
  ChevronDown,
  Trash2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge } from "@/components/shared/status-badge";
import { useAppSelector } from "@/stores/store";
import { useGetBranchByIdQuery } from "@/stores/api/branchApi";
import { useGetOrderByIdQuery, useUpdateOrderMutation, useDeleteOrderMutation } from "@/stores/api/orderApi";
import { canCancelOrders } from "@/lib/rbac";
import { formatCurrency } from "@/lib/utils";
import { OrderStatus, OrderType, PaymentType, UserRole } from "@/types";

// Status steps in order
const STATUS_STEPS: OrderStatus[] = ["Pending", "Confirmed", "Preparing", "Ready", "Completed"];

function getStatusIndex(status: OrderStatus) {
  if (status === "Cancelled") return -1;
  return STATUS_STEPS.indexOf(status);
}

const ORDER_TYPE_LABELS: Record<OrderType, string> = {
  DineIn: "Dine In",
  TakeAway: "Take Away",
  Delivery: "Delivery",
  Online: "Online",
};

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function OrderDetailPage({ params }: OrderDetailPageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { currentRole: uiRole } = useAppSelector((state) => state.ui);
  const authRole = useAppSelector((state) => state.auth.user?.role) || UserRole.Cashier;
  const currentRole = uiRole || authRole;
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const { data: order, isLoading, isError } = useGetOrderByIdQuery(resolvedParams.id);
  const { data: branch } = useGetBranchByIdQuery(order?.branchId ?? "", {
    skip: !order?.branchId,
  });
  const [updateOrder, { isLoading: isUpdating }] = useUpdateOrderMutation();
  const [deleteOrder, { isLoading: isDeleting }] = useDeleteOrderMutation();

  const canCancel = canCancelOrders(currentRole);

  const handleStatusChange = async (newStatus: OrderStatus) => {
    if (!order) return;
    try {
      await updateOrder({
        id: order.orderId,
        data: {
          orderNumber: order.orderNumber,
          orderDate: order.orderDate,
          branchId: order.branchId,
          paymentType: order.paymentType,
          orderType: order.orderType,
          subTotal: order.subTotal,
          discountTotal: order.discountTotal,
          grandTotal: order.grandTotal,
          appliedOfferId: order.appliedOfferId,
          appliedOfferNameSnapshot: order.appliedOfferNameSnapshot,
          orderStatus: newStatus,
          items: order.items.map((item) => ({
            branchProductVariantId: item.branchProductVariantId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subTotal: item.subTotal,
            discountAmount: item.discountAmount,
            lineTotal: item.lineTotal,
            appliedOfferId: item.appliedOfferId,
            appliedOfferNameSnapshot: item.appliedOfferNameSnapshot,
            selectedToppings: item.toppings.map((t) => ({
              branchToppingId: t.branchToppingId,
              quantity: t.quantity,
              unitPrice: t.unitPrice,
            })),
          })),
        },
      }).unwrap();
    } catch {}
  };

  const handleDelete = async () => {
    if (!order) return;
    try {
      await deleteOrder(order.orderId).unwrap();
      router.push("/admin/orders");
    } catch {}
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-[120px] w-full rounded-xl" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Skeleton className="h-[400px] w-full rounded-xl" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-[180px] w-full rounded-xl" />
            <Skeleton className="h-[120px] w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  // ── Not Found ─────────────────────────────────────────────────────────────
  if (isError || !order) {
    return (
      <div className="text-center py-20">
        <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Order Not Found</h2>
        <p className="text-muted-foreground mb-6">
          The order you&apos;re looking for doesn&apos;t exist or has been deleted.
        </p>
        <Button asChild>
          <Link href="/admin/orders">Back to Orders</Link>
        </Button>
      </div>
    );
  }

  const currentStepIndex = getStatusIndex(order.orderStatus);
  const isCancelled = order.orderStatus === "Cancelled";
  const isCompleted = order.orderStatus === "Completed";

  // Statuses the user can transition to from the current state
  const availableStatuses: OrderStatus[] = STATUS_STEPS.filter(
    (s) => STATUS_STEPS.indexOf(s) > currentStepIndex
  );
  if (canCancel && !isCancelled && !isCompleted) {
    availableStatuses.push("Cancelled");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-semibold">{order.orderNumber}</h1>
              <span className="text-sm text-muted-foreground px-2 py-0.5 rounded-md bg-muted">
                {ORDER_TYPE_LABELS[order.orderType] ?? order.orderType}
              </span>
              <StatusBadge status={order.orderStatus} />
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {format(parseISO(order.orderDate), "EEEE, MMMM d, yyyy 'at' h:mm a")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Status transition dropdown */}
          {availableStatuses.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={isUpdating}>
                  Update Status
                  <ChevronDown className="h-3.5 w-3.5 ml-1.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {availableStatuses.map((s) => (
                  <DropdownMenuItem
                    key={s}
                    onClick={() => handleStatusChange(s)}
                    className={s === "Cancelled" ? "text-destructive" : ""}
                  >
                    Mark as {s}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Delete order */}
          {canCancel && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this order?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete order {order.orderNumber}. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={handleDelete}
                    disabled={isDeleting}
                  >
                    {isDeleting ? "Deleting…" : "Delete Order"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* Order Progress */}
      {!isCancelled && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              {STATUS_STEPS.map((step, index) => {
                const isCompleted = index <= currentStepIndex;
                const isCurrent = index === currentStepIndex;
                const isLast = index === STATUS_STEPS.length - 1;

                return (
                  <div key={step} className="flex items-center flex-1 last:flex-none">
                    <div className="flex flex-col items-center gap-1.5">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
                        isCurrent
                          ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                          : isCompleted
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {isCompleted ? (
                          <CircleCheck className="h-4 w-4" />
                        ) : isCurrent ? (
                          <CircleDot className="h-4 w-4" />
                        ) : (
                          <Circle className="h-4 w-4" />
                        )}
                      </div>
                      <span className={`text-xs font-medium ${
                        isCompleted || isCurrent ? "text-foreground" : "text-muted-foreground"
                      }`}>
                        {step}
                      </span>
                    </div>
                    {!isLast && (
                      <div className={`flex-1 h-0.5 mx-3 rounded-full mb-6 ${
                        index < currentStepIndex ? "bg-primary" : "bg-muted"
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {isCancelled && (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="font-medium text-destructive">Order Cancelled</p>
                <p className="text-sm text-destructive/70">This order has been cancelled.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column — Items */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-0">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border/60">
                <h3 className="font-semibold">Order Items</h3>
                <span className="text-xs text-muted-foreground bg-muted rounded-full px-2.5 py-1">
                  {order.items.length} {order.items.length === 1 ? "item" : "items"}
                </span>
              </div>

              <div className="px-6">
                <div className="grid grid-cols-[1fr_auto_auto] gap-x-6 py-3 text-xs text-muted-foreground border-b border-border/40">
                  <span>Product</span>
                  <span>Qty</span>
                  <span className="text-right">Price</span>
                </div>
                {order.items.map((item, index) => (
                  <div
                    key={item.orderItemId}
                    className="grid grid-cols-[1fr_auto_auto] gap-x-6 items-center py-3.5 border-b border-border/40 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/50 text-xs font-medium text-muted-foreground">
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-sm font-medium flex items-center gap-1.5">
                          {item.productName}
                          {item.sizeName && (
                            <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-sm font-normal">
                              {item.sizeName}
                            </span>
                          )}
                        </p>
                        {item.toppings.length > 0 && (
                          <div className="mt-1 flex flex-col gap-0.5 mb-1.5">
                            {item.toppings.map((t) => (
                              <span key={t.orderItemToppingId} className="text-[11px] text-muted-foreground flex items-center gap-1">
                                <span className="text-[8px]">▶</span>
                                {t.quantity > 1 ? `${t.quantity}x ` : ""}{t.toppingNameSnapshot}
                                {t.unitPrice > 0 && <span className="opacity-70">(+{formatCurrency(t.unitPrice)})</span>}
                              </span>
                            ))}
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-1 border-t border-border/40 pt-1 w-max">
                          {formatCurrency(item.unitPrice)} base price
                        </p>
                      </div>
                    </div>
                    <span className="text-sm tabular-nums w-8 text-center">{item.quantity}</span>
                    <span className="text-sm font-medium tabular-nums text-right">{formatCurrency(item.lineTotal)}</span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="px-6 py-4 bg-muted/30 rounded-b-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="tabular-nums">{formatCurrency(order.subTotal)}</span>
                </div>
                {order.discountTotal > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-emerald-600">Discount</span>
                    <span className="text-emerald-600 tabular-nums">-{formatCurrency(order.discountTotal)}</span>
                  </div>
                )}
                {order.appliedOfferNameSnapshot && (
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Offer applied</span>
                    <span>{order.appliedOfferNameSnapshot}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-border/60">
                  <span className="font-semibold">Total</span>
                  <span className="font-bold text-lg tabular-nums">{formatCurrency(order.grandTotal)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column — Details */}
        <div className="space-y-6">
          <Card>
            <CardContent className="p-0">
              <div className="px-5 py-4 border-b border-border/60">
                <h3 className="font-semibold text-sm">Details</h3>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Type</span>
                  <span className="text-sm font-medium">
                    {ORDER_TYPE_LABELS[order.orderType] ?? order.orderType}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <StatusBadge status={order.orderStatus} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Payment</span>
                  <span className="text-sm font-medium">{order.paymentType}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {branch && (
            <Card>
              <CardContent className="p-0">
                <div className="px-5 py-4 border-b border-border/60">
                  <h3 className="font-semibold text-sm">Branch</h3>
                </div>
                <div className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted shrink-0">
                      <Store className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{branch.branchName}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                        {branch.branchAddress}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
