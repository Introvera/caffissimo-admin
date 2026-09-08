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
  Trash2,
  Search,
  Filter,
  MoreVertical,
  Eye,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppSelector } from "@/stores/store";
import { useGetOffersQuery, useDeleteOfferMutation } from "@/stores/api/offerApi";
import { canManageOffers } from "@/lib/rbac";
import { OfferType, OfferSummaryResponse } from "@/types";
import { formatCurrency, cn } from "@/lib/utils";
import { toast } from "sonner";

const OFFER_TYPE_LABELS: Record<OfferType, string> = {
  SpendThresholdDiscount: "Spend & Save",
  BuyXGetY: "Buy X Get Y",
  BundleFixedPrice: "Combo / Bundle",
  ScheduledFixedPrice: "Happy Hour",
  FreeUpgrade: "Free Upgrade",
  LoyaltyStamp: "Loyalty Stamp",
  SpendThresholdGift: "Spend & Gift",
  AddOnUpsell: "Add-On Upsell",
};

const OFFER_TYPE_COLORS: Record<OfferType, string> = {
  SpendThresholdDiscount: "bg-muted text-muted-foreground",
  BuyXGetY: "bg-muted text-muted-foreground",
  BundleFixedPrice: "bg-muted text-muted-foreground",
  ScheduledFixedPrice: "bg-muted text-muted-foreground",
  FreeUpgrade: "bg-muted text-muted-foreground",
  LoyaltyStamp: "bg-muted text-muted-foreground",
  SpendThresholdGift: "bg-muted text-muted-foreground",
  AddOnUpsell: "bg-muted text-muted-foreground",
};

export default function OffersPage() {
  const currentRole = useAppSelector((state) => state.auth.user?.role);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [filterActive, setFilterActive] = useState<string>("all");
  const router = useRouter();

  const PAGE_SIZE = 12;
  const { data, isLoading } = useGetOffersQuery({
    page,
    pageSize: PAGE_SIZE,
    search: search.trim() || undefined,
    offerType: selectedType !== "all" ? (selectedType as OfferType) : undefined,
    isActive: filterActive === "all" ? undefined : filterActive === "active",
  });
  const [deleteOffer] = useDeleteOfferMutation();
  const [offerToDelete, setOfferToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const canManage = canManageOffers(currentRole);
  const offers = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;

  const handleConfirmDelete = async () => {
    if (!offerToDelete) return;
    setIsDeleting(true);
    try {
      await deleteOffer(offerToDelete.id).unwrap();
      toast.success("Offer deleted successfully");
      setOfferToDelete(null);
    } catch (err: any) {
      toast.error(err?.data?.message || err?.message || "Failed to delete offer");
    } finally {
      setIsDeleting(false);
    }
  };

  const getOfferDiscountLabel = (offer: OfferSummaryResponse) => {
    switch (offer.offerType) {
      case "SpendThresholdDiscount":
        if (offer.discountPercent) {
          return offer.minSpendAmount
            ? `Spend > ${formatCurrency(offer.minSpendAmount)}: ${offer.discountPercent}% Off`
            : `${offer.discountPercent}% Off`;
        }
        if (offer.discountAmount) {
          return offer.minSpendAmount
            ? `Spend > ${formatCurrency(offer.minSpendAmount)}: ${formatCurrency(offer.discountAmount)} Off`
            : `${formatCurrency(offer.discountAmount)} Off`;
        }
        return "Spend & Save";
      case "BuyXGetY":
        return `Buy ${offer.buyQuantity ?? 1} Get ${offer.getQuantity ?? 1}`;
      case "BundleFixedPrice":
        return offer.bundlePrice !== undefined && offer.bundlePrice !== null
          ? `Bundle: ${formatCurrency(offer.bundlePrice)}`
          : "Bundle Deal";
      case "ScheduledFixedPrice":
        return offer.fixedPrice !== undefined && offer.fixedPrice !== null
          ? `Special: ${formatCurrency(offer.fixedPrice)}`
          : "Happy Hour";
      case "FreeUpgrade":
        return "Free Size Upgrade";
      case "LoyaltyStamp":
        return `Buy ${offer.stampsRequired ?? 9} Get 1 Free`;
      case "SpendThresholdGift":
        return offer.minSpendAmount
          ? `Spend > ${formatCurrency(offer.minSpendAmount)}: Free Gift`
          : "Free Gift Deal";
      case "AddOnUpsell":
        return offer.addOnPrice !== undefined && offer.addOnPrice !== null
          ? `Add-On for ${formatCurrency(offer.addOnPrice)}`
          : "Add-On Deal";
      default:
        return "";
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Offers & Promotions"
        description="Manage promotional campaigns, Happy Hour deals, bundles, and loyalty programs"
        actions={
          canManage ? (
            <Button size="sm" onClick={() => router.push("/admin/offers/new")}>
              <Plus className="h-4 w-4 mr-2" />
              New Offer
            </Button>
          ) : undefined
        }
      />

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search offers by name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9 w-[260px] sm:w-[320px] h-9 bg-white dark:bg-[#141414] rounded-lg border-border/80"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Active status filter */}
          <Select
            value={filterActive}
            onValueChange={(val) => {
              setFilterActive(val);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-auto min-w-[130px] h-9 gap-1.5 rounded-lg border-border/80 bg-white dark:bg-[#141414] px-3.5 text-body font-medium shadow-none">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active Only</SelectItem>
              <SelectItem value="inactive">Inactive Only</SelectItem>
            </SelectContent>
          </Select>

          {/* Offer Type filter */}
          <Select
            value={selectedType}
            onValueChange={(val) => {
              setSelectedType(val);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-auto min-w-[160px] h-9 gap-1.5 rounded-lg border-border/80 bg-white dark:bg-[#141414] px-3.5 text-body font-medium shadow-none">
              <SelectValue placeholder="Offer Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Offer Types</SelectItem>
              {Object.entries(OFFER_TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

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
              title="No offers found"
              description={
                search || selectedType !== "all"
                  ? "Try changing your search or filter criteria"
                  : "Create your first promotional offer to get started"
              }
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
              const offerTypeKey = offer.offerType as OfferType;
              const typeLabel = OFFER_TYPE_LABELS[offerTypeKey] || offer.offerType;
              const typeColor =
                OFFER_TYPE_COLORS[offerTypeKey] ||
                "bg-muted text-muted-foreground";

              return (
                <Card
                  key={offer.offerId}
                  onClick={() => router.push(`/admin/offers/${offer.offerId}`)}
                  className="flex flex-col hover:border-primary/40 hover:shadow-sm transition-all cursor-pointer"
                >
                  <CardContent className="p-5 flex flex-col gap-3 flex-1">
                    {/* Header: Title, Description & Action Menu */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-body truncate">{offer.offerName}</p>
                        {offer.description && (
                          <p className="text-caption text-muted-foreground mt-0.5 line-clamp-2">
                            {offer.description}
                          </p>
                        )}
                      </div>
                      {canManage && (
                        <div onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0 -mr-1 -mt-1"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                className="cursor-pointer"
                                onClick={() => router.push(`/admin/offers/${offer.offerId}`)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive cursor-pointer"
                                onClick={() => setOfferToDelete({ id: offer.offerId, name: offer.offerName })}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Offer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      )}
                    </div>

                    {/* Chips: Offer Type (Gray) and Active/Status */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge
                        variant="secondary"
                        className="text-detail font-medium border-transparent shadow-none px-2 py-0.5 rounded-md bg-muted text-muted-foreground"
                      >
                        {typeLabel}
                      </Badge>
                      <Badge
                        variant={offer.isActive && !isExpired ? "success" : "secondary"}
                        className="text-detail font-medium px-2 py-0.5 rounded-md"
                      >
                        {isExpired ? "Expired" : offer.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>

                    {/* Value indicator with primary accent color */}
                    {discountLabel && (
                      <div className="flex items-center gap-1 text-caption font-semibold text-primary bg-primary/5 dark:bg-primary/10 w-fit px-2.5 py-1 rounded-md">
                        <span>{discountLabel}</span>
                      </div>
                    )}

                    {/* Dates */}
                    <div className="flex items-center gap-1.5 text-caption text-muted-foreground mt-auto">
                      <Calendar className="h-3.5 w-3.5 shrink-0" />
                      <span>
                        {format(parseISO(offer.startDateTime), "MMM d")}
                        {" – "}
                        {format(parseISO(offer.endDateTime), "MMM d, yyyy")}
                      </span>
                    </div>

                    {/* Branches info */}
                    {offer.offerBranches && (
                      <p className="text-caption text-muted-foreground border-t pt-2 mt-1">
                        {offer.offerBranches.length === 0 ? (
                          <span className="text-primary font-medium">Valid at all branches</span>
                        ) : (
                          <>
                            Applied to{" "}
                            <span className="font-medium text-foreground">
                              {offer.offerBranches.length} branch{offer.offerBranches.length !== 1 ? "es" : ""}
                            </span>
                          </>
                        )}
                      </p>
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
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setPage((p) => p - 1)}
                disabled={page <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-body text-muted-foreground">
                Page {page} of {totalPages}
              </span>
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
          )}
        </>
      )}

      <ConfirmDialog
        open={!!offerToDelete}
        onOpenChange={(open) => {
          if (!open) setOfferToDelete(null);
        }}
        title="Delete Offer"
        description={`Are you sure you want to delete the offer "${offerToDelete?.name || ""}"? This action cannot be undone.`}
        confirmText="Delete Offer"
        variant="destructive"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}


