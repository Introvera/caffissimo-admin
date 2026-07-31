"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useGetUberOrderByIdQuery } from "@/stores/api/uberApi";
import { useAppSelector } from "@/stores/store";
import { canAccessAdmin } from "@/lib/rbac";
import { Badge } from "@/components/ui/badge";
import { UserRole } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  ShoppingBag,
  User,
  Truck,
  Tag,
  Clock,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { format } from "date-fns";
import type { UberOrderStagingPromotion } from "@/types";

function formatMoney(amount: number, currency: string = "USD"): string {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

function formatDate(date: string | null): string {
  if (!date) return "-";
  try {
    return format(new Date(date), "MMM d, yyyy h:mm:ss a");
  } catch {
    return date;
  }
}

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

function promoTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    FLATOFF: "Flat Discount",
    PERCENTOFF: "Percentage Off",
    FREEITEM_MINBASKET: "Free Item (Min Basket)",
    CATEGORY_DISCOUNT: "Category Discount",
    BOGO: "Buy One Get One",
    FREEDELIVERY: "Free Delivery",
    MENU_ITEM_DISCOUNT: "Menu Item Discount",
  };
  return labels[type.toUpperCase()] ?? type;
}

function promoTypeBadgeVariant(type: string): "default" | "secondary" | "outline" | "destructive" {
  switch (type.toUpperCase()) {
    case "PERCENTOFF": return "default";
    case "FLATOFF": return "default";
    case "BOGO": return "secondary";
    case "FREEDELIVERY": return "outline";
    case "FREEITEM_MINBASKET": return "secondary";
    default: return "outline";
  }
}

function PromotionCard({ promo, currency }: { promo: UberOrderStagingPromotion; currency: string }) {
  const hasPercentage = promo.discountPercentage > 0;
  const hasValue = promo.discountValue > 0;
  const hasFreeDelivery = promo.deliveryFeeValue > 0;

  return (
    <Card className="border-dashed">
      <CardContent className="py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-muted-foreground" />
            <Badge variant={promoTypeBadgeVariant(promo.promoType)}>
              {promoTypeLabel(promo.promoType)}
            </Badge>
            {hasPercentage && (
              <span className="text-sm font-medium">{promo.discountPercentage}%</span>
            )}
          </div>
          <div className="text-right">
            {hasValue && (
              <span className="font-semibold text-destructive">
                -{formatMoney(promo.discountValue, currency)}
              </span>
            )}
            {hasFreeDelivery && !hasValue && (
              <span className="font-semibold text-destructive">
                -{formatMoney(promo.deliveryFeeValue, currency)} delivery
              </span>
            )}
          </div>
        </div>
        <div className="mt-1 text-xs text-muted-foreground flex gap-4">
          {promo.uberFundedAmount > 0 && (
            <span>Uber funded: {formatMoney(promo.uberFundedAmount, currency)}</span>
          )}
          {promo.merchantFundedAmount > 0 && (
            <span>Merchant funded: {formatMoney(promo.merchantFundedAmount, currency)}</span>
          )}
          {promo.uberFundedAmount === 0 && promo.merchantFundedAmount === 0 && (
            <span>Funding details not available</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function UberEatsOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const currentRole = useAppSelector((state) => state.auth.user?.role) || UserRole.Cashier;

  const { data: order, isLoading, refetch } = useGetUberOrderByIdQuery(id, {
    pollingInterval: 15000,
  });

  if (!canAccessAdmin(currentRole)) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          You do not have permission to access this page.
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Order not found.
          </CardContent>
        </Card>
      </div>
    );
  }

  const currency = order.currencyCode ?? "USD";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push("/admin/uber-eats/orders")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Orders
          </Button>
          <h1 className="text-2xl font-bold font-mono">
            #{order.displayId ?? order.uberOrderId.slice(0, 5).toUpperCase()}
          </h1>
          <Badge variant={stateVariant(order.currentState)}>
            {order.orderStatus ?? order.currentState ?? "Unknown"}
          </Badge>
          <Badge variant="outline">Uber Eats</Badge>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-1" />
          Refresh
        </Button>
      </div>

      {/* Order Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-1">
              <ShoppingBag className="h-4 w-4" /> Order Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Type</span><span>{order.fulfillmentType ?? order.orderType ?? "-"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Brand</span><span>{order.brand ?? "UBER_EATS"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Placed</span><span>{formatDate(order.createdAt)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Est. Ready</span><span>{formatDate(order.estimatedReadyTime)}</span></div>
            {order.acceptDeadlineAt && order.currentState === "CREATED" && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Accept Deadline</span>
                <span className="text-destructive font-medium">{formatDate(order.acceptDeadlineAt)}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-1">
              <User className="h-4 w-4" /> Customer
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Name</span>
              <span>{[order.eaterFirstName, order.eaterLastName].filter(Boolean).join(" ") || order.customerName || "-"}</span>
            </div>
            <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span>{order.eaterPhone ?? "-"}</span></div>
            {order.specialInstructions && (
              <div className="mt-2 p-2 bg-muted rounded text-xs">
                <span className="font-medium">Note: </span>{order.specialInstructions}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-1">
              <Truck className="h-4 w-4" /> Delivery
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Status</span><span>{order.deliveryState ?? "-"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Driver</span><span>{order.deliveryDriverName ?? "-"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Est. Pickup</span><span>{formatDate(order.estimatedPickupTime)}</span></div>
          </CardContent>
        </Card>
      </div>

      {/* Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Order Items ({order.items.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {order.items.map((item) => (
              <div key={item.uberOrderStagingItemId}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium">
                      {item.quantity}x {item.title}
                    </div>
                    {item.modifiers.length > 0 && (
                      <div className="ml-4 mt-1 space-y-0.5">
                        {item.modifiers.map((mod) => (
                          <div key={mod.uberOrderStagingItemModifierId} className="text-sm text-muted-foreground flex justify-between gap-8">
                            <span>+ {mod.title} {mod.quantity > 1 ? `x${mod.quantity}` : ""}</span>
                            {mod.totalPrice > 0 && <span>{formatMoney(mod.totalPrice, currency)}</span>}
                          </div>
                        ))}
                      </div>
                    )}
                    {item.specialInstructions && (
                      <div className="ml-4 mt-1 text-xs text-muted-foreground italic">
                        &quot;{item.specialInstructions}&quot;
                      </div>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-medium">{formatMoney(item.totalPrice, currency)}</div>
                    {item.quantity > 1 && (
                      <div className="text-xs text-muted-foreground">{formatMoney(item.unitPrice, currency)} each</div>
                    )}
                  </div>
                </div>
                <Separator className="mt-3" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Promotions - Each type displayed separately */}
      {(order.promotions.length > 0 || order.discountTotal > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Promotions Applied
              {order.promotionCount > 0 && (
                <Badge variant="outline">{order.promotionCount}</Badge>
              )}
            </CardTitle>
            {order.promotionSummary && (
              <CardDescription>{order.promotionSummary}</CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            {order.promotions.length > 0 ? (
              order.promotions.map((promo) => (
                <PromotionCard key={promo.uberOrderStagingPromotionId} promo={promo} currency={currency} />
              ))
            ) : (
              order.discountTotal > 0 && (
                <Card className="border-dashed">
                  <CardContent className="py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm">Promotion details not available</span>
                      </div>
                      <span className="font-semibold text-destructive">
                        -{formatMoney(order.discountTotal, currency)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Aggregate discount from Uber. Detailed breakdown may require Uber API authorization.
                    </p>
                  </CardContent>
                </Card>
              )
            )}
          </CardContent>
        </Card>
      )}

      {/* Financial Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payment Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm max-w-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatMoney(order.subtotalAmount, currency)}</span></div>
            {order.discountTotal > 0 && (
              <div className="flex justify-between text-destructive">
                <span>Discount</span>
                <span>-{formatMoney(order.discountTotal, currency)}</span>
              </div>
            )}
            {order.taxTotal > 0 && (
              <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span>{formatMoney(order.taxTotal, currency)}</span></div>
            )}
            {order.deliveryFee > 0 && (
              <div className="flex justify-between"><span className="text-muted-foreground">Delivery Fee</span><span>{formatMoney(order.deliveryFee, currency)}</span></div>
            )}
            {order.feeTotal > 0 && (
              <div className="flex justify-between"><span className="text-muted-foreground">Fees</span><span>{formatMoney(order.feeTotal, currency)}</span></div>
            )}
            {order.tipTotal > 0 && (
              <div className="flex justify-between"><span className="text-muted-foreground">Tip</span><span>{formatMoney(order.tipTotal, currency)}</span></div>
            )}
            <Separator />
            <div className="flex justify-between font-semibold text-base">
              <span>Total</span>
              <span>{formatMoney(order.totalAmount, currency)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1 text-sm max-w-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Received</span><span>{formatDate(order.receivedAt)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Fetched</span><span>{formatDate(order.fetchedAt)}</span></div>
            {order.acceptedAt && <div className="flex justify-between"><span className="text-muted-foreground">Accepted</span><span>{formatDate(order.acceptedAt)}</span></div>}
            {order.deniedAt && <div className="flex justify-between"><span className="text-muted-foreground">Denied</span><span>{formatDate(order.deniedAt)}</span></div>}
            {order.denyReasonCode && <div className="flex justify-between"><span className="text-muted-foreground">Deny Reason</span><span>{order.denyReasonCode}</span></div>}
            {order.lastSyncError && (
              <div className="mt-2 p-2 bg-destructive/10 rounded text-xs text-destructive">
                {order.lastSyncError}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
