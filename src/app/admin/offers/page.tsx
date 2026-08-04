"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import {
  Plus,
  Tag,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Edit,
  Trash2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { useAppSelector } from "@/stores/store";
import { useGetOffersQuery, useDeleteOfferMutation } from "@/stores/api/offerApi";
import { canManageOffers } from "@/lib/rbac";
import { OfferType } from "@/types";
import { formatCurrency, cn } from "@/lib/utils";
import { toast } from "sonner";

const OFFER_TYPE_LABELS: Record<OfferType, string> = {
  AmountOff: "Flat Discount",
  PercentageOff: "Percentage Discount",
  FixedPrice: "Fixed Price Override",
  BuyXGetY: "Buy X Get Y",
};

const OFFER_TYPE_COLORS: Record<OfferType, string> = {
  AmountOff: "bg-blue-500/10 text-blue-500 dark:bg-blue-500/15 dark:text-blue-300",
  PercentageOff: "bg-purple-500/10 text-purple-500 dark:bg-purple-500/15 dark:text-purple-300",
  FixedPrice: "bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/15 dark:text-emerald-300",
  BuyXGetY: "bg-amber-500/10 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300",
};

export default function OffersPage() {
  const currentRole = useAppSelector((state) => state.auth.user?.role);
  const [page, setPage] = useState(1);
  const router = useRouter();

  const PAGE_SIZE = 10;
  const { data, isLoading } = useGetOffersQuery({ page, pageSize: PAGE_SIZE });
  const [deleteOffer] = useDeleteOfferMutation();

  const canManage = canManageOffers(currentRole);
  const offers = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the offer "${name}"?`)) {
      return;
    }
    try {
      await deleteOffer(id).unwrap();
      toast.success("Offer deleted successfully");
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete offer");
    }
  };

  const getOfferDiscountLabel = (offer: any) => {
    if (offer.offerType === "BuyXGetY") {
      return `Buy ${offer.buyAmount} Get ${offer.getAmount}`;
    }
    const item = offer.offerItems?.[0];
    if (!item) return "";
    if (offer.offerType === "PercentageOff" && item.percentageValue) {
      return `${item.percentageValue}% Off`;
    }
    if (offer.offerType === "AmountOff" && item.amountValue) {
      return `${formatCurrency(item.amountValue)} Off`;
    }
    if (offer.offerType === "FixedPrice" && item.fixedPriceValue !== undefined && item.fixedPriceValue !== null) {
      return `${formatCurrency(item.fixedPriceValue)} Fixed`;
    }
    return "";
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Offers"
        description="Manage promotional offers and discounts"
        actions={
          canManage ? (
            <Button size="sm" onClick={() => router.push("/admin/offers/new")}>
              <Plus className="h-4 w-4 mr-2" />
              New Offer
            </Button>
          ) : undefined
        }
      />

      {/* Offer Grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      ) : offers.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={Tag}
              title="No offers yet"
              description="Create your first promotional offer to get started"
              action={
                canManage ? (
                  <Button onClick={() => router.push("/admin/offers/new")}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Offer
                  </Button>
                ) : undefined
              }
            />
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {offers.map((offer) => {
              const isExpired = new Date(offer.endDateTime) < new Date();
              const discountLabel = getOfferDiscountLabel(offer);
              return (
                <Card key={offer.offerId} className="flex flex-col hover:shadow-md transition-shadow">
                  <CardContent className="p-5 flex flex-col gap-3 flex-1">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{offer.offerName}</p>
                        {offer.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                            {offer.description}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-[10px] font-semibold border-transparent shadow-none px-2.5 py-0.5 rounded-full",
                            OFFER_TYPE_COLORS[offer.offerType as OfferType]
                          )}
                        >
                          {OFFER_TYPE_LABELS[offer.offerType as OfferType] || offer.offerType}
                        </Badge>
                        <Badge
                          variant={offer.isActive && !isExpired ? "success" : "secondary"}
                          className="text-[10px]"
                        >
                          {isExpired ? "Expired" : offer.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>

                    {/* Value indicator */}
                    {discountLabel && (
                      <div className="flex items-center gap-1 text-xs font-semibold text-primary bg-primary/5 dark:bg-primary/10 w-fit px-2 py-1 rounded-md">
                        <span>{discountLabel}</span>
                      </div>
                    )}

                    {/* Dates */}
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-auto">
                      <Calendar className="h-3.5 w-3.5 shrink-0" />
                      <span>
                        {format(parseISO(offer.startDateTime), "MMM d")}
                        {" – "}
                        {format(parseISO(offer.endDateTime), "MMM d, yyyy")}
                      </span>
                    </div>

                    {/* Branches info */}
                    {offer.offerBranches && offer.offerBranches.length > 0 && (
                      <p className="text-xs text-muted-foreground border-t pt-2 mt-1">
                        Applied to <span className="font-medium text-foreground">{offer.offerBranches.length} branch{offer.offerBranches.length !== 1 ? "es" : ""}</span>
                      </p>
                    )}

                    {/* Admin Actions */}
                    {canManage && (
                      <div className="flex items-center justify-end gap-2 border-t pt-3 mt-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-muted-foreground hover:text-foreground"
                          onClick={() => router.push(`/admin/offers/edit/${offer.offerId}`)}
                        >
                          <Edit className="h-4 w-4 mr-1.5" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(offer.offerId, offer.offerName)}
                        >
                          <Trash2 className="h-4 w-4 mr-1.5" />
                          Delete
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button
                variant="outline" size="sm" className="h-8 w-8 p-0"
                onClick={() => setPage((p) => p - 1)}
                disabled={page <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline" size="sm" className="h-8 w-8 p-0"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

