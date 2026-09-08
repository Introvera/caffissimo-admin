"use client";

import { use, useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format, parseISO, isValid } from "date-fns";
import {
  ArrowLeft,
  Tag,
  Calendar,
  Building2,
  Clock,
  Gift,
  ShoppingBag,
  Layers,
  Percent,
  Trash2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Store,
  Zap,
  Award,
  ArrowUpRight,
  Plus,
  X,
  Search,
  Check,
  Loader2,
} from "lucide-react";
import { TbEdit } from "react-icons/tb";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { TimePicker } from "@/components/ui/time-picker";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { CharacterCounter } from "@/components/ui/character-counter";
import { useAppSelector } from "@/stores/store";
import {
  useGetOfferByIdQuery,
  useUpdateOfferMutation,
  useDeleteOfferMutation,
} from "@/stores/api/offerApi";
import { useGetBranchesQuery } from "@/stores/api/branchApi";
import { useGetProductsQuery, useGetCategoriesQuery } from "@/stores/api/productApi";
import { canManageOffers } from "@/lib/rbac";
import {
  OfferType,
  CreateOfferRequest,
  CreateOfferItemRequest,
  OfferScheduleWindowRequest,
  Product,
} from "@/types";
import { formatCurrency, cn } from "@/lib/utils";
import { toast } from "sonner";

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const OFFER_TYPE_CONFIG: Record<
  OfferType,
  { label: string; description: string; icon: React.ComponentType<{ className?: string }> }
> = {
  SpendThresholdDiscount: {
    label: "Spend & Save",
    description: "Orders exceeding a minimum spend receive a percentage or fixed dollar discount.",
    icon: Percent,
  },
  BuyXGetY: {
    label: "Buy X Get Y",
    description: "Customers purchase a set quantity of qualifying items to receive reward items.",
    icon: ShoppingBag,
  },
  BundleFixedPrice: {
    label: "Combo / Bundle",
    description: "Multiple selected items purchased together for a single fixed bundle price.",
    icon: Layers,
  },
  ScheduledFixedPrice: {
    label: "Happy Hour",
    description: "Special fixed pricing active only during designated recurring days and time windows.",
    icon: Clock,
  },
  FreeUpgrade: {
    label: "Free Upgrade",
    description: "Qualifying products receive a complimentary size or variant upgrade.",
    icon: ArrowUpRight,
  },
  LoyaltyStamp: {
    label: "Loyalty Stamp",
    description: "Digital stamp card where customers earn stamps toward a free reward item.",
    icon: Award,
  },
  SpendThresholdGift: {
    label: "Spend & Gift",
    description: "Orders exceeding a minimum spend unlock a free complimentary gift product.",
    icon: Gift,
  },
  AddOnUpsell: {
    label: "Add-On Upsell",
    description: "Purchasing trigger items unlocks discounted add-on companion products.",
    icon: Zap,
  },
};

interface OfferViewPageProps {
  params: Promise<{ id: string }>;
}

export default function OfferViewPage({ params }: OfferViewPageProps) {
  const resolvedParams = use(params);
  const offerId = resolvedParams.id;
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEditMode = searchParams.get("edit") === "true";

  const currentRole = useAppSelector((state) => state.auth.user?.role);
  const canManage = canManageOffers(currentRole);

  const [isEditingMode, setIsEditingMode] = useState(initialEditMode);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Queries & Mutations
  const { data: offer, isLoading: isOfferLoading } = useGetOfferByIdQuery(offerId);
  const { data: branchesData, isLoading: isBranchesLoading } = useGetBranchesQuery();
  const { data: productsData, isLoading: isProductsLoading } = useGetProductsQuery({ pageSize: 200 });
  const { data: categoriesData } = useGetCategoriesQuery();

  const [updateOffer, { isLoading: isUpdating }] = useUpdateOfferMutation();
  const [deleteOffer, { isLoading: isDeleting }] = useDeleteOfferMutation();

  const branches = useMemo(() => branchesData?.items || [], [branchesData]);
  const products = useMemo(() => productsData?.items || [], [productsData]);
  const categories = useMemo(() => categoriesData?.items || [], [categoriesData]);

  // Form State
  const [offerName, setOfferName] = useState("");
  const [description, setDescription] = useState("");
  const [offerType, setOfferType] = useState<OfferType>("SpendThresholdDiscount");
  const [startDateTime, setStartDateTime] = useState("");
  const [endDateTime, setEndDateTime] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [priority, setPriority] = useState<number>(0);

  // Specific rule state
  const [minSpendAmount, setMinSpendAmount] = useState<number | undefined>(undefined);
  const [discountMode, setDiscountMode] = useState<"percent" | "amount">("percent");
  const [discountPercent, setDiscountPercent] = useState<number | undefined>(undefined);
  const [discountAmount, setDiscountAmount] = useState<number | undefined>(undefined);
  const [buyQuantity, setBuyQuantity] = useState<number | undefined>(undefined);
  const [getQuantity, setGetQuantity] = useState<number | undefined>(undefined);
  const [bundlePrice, setBundlePrice] = useState<number | undefined>(undefined);
  const [fixedPrice, setFixedPrice] = useState<number | undefined>(undefined);
  const [stampsRequired, setStampsRequired] = useState<number | undefined>(undefined);
  const [addOnPrice, setAddOnPrice] = useState<number | undefined>(undefined);

  // Schedule Windows
  const [scheduleWindows, setScheduleWindows] = useState<OfferScheduleWindowRequest[]>([]);

  // Branch Selection
  const [selectedBranchIds, setSelectedBranchIds] = useState<string[]>([]);

  // Item Targeting
  const [targetProductIds, setTargetProductIds] = useState<string[]>([]);
  const [buyProductIds, setBuyProductIds] = useState<string[]>([]);
  const [rewardProductIds, setRewardProductIds] = useState<string[]>([]);
  const [requiredProductIds, setRequiredProductIds] = useState<string[]>([]);
  const [giftProductIds, setGiftProductIds] = useState<string[]>([]);
  const [triggerProductIds, setTriggerProductIds] = useState<string[]>([]);
  const [addonOptionProductIds, setAddonOptionProductIds] = useState<string[]>([]);

  // Product Search terms
  const [productSearchText, setProductSearchText] = useState("");
  const [buySearchText, setBuySearchText] = useState("");
  const [rewardSearchText, setRewardSearchText] = useState("");

  // Sync server data into state
  const resetFormToOffer = (offerData: typeof offer) => {
    if (!offerData) return;
    setOfferName(offerData.offerName || "");
    setDescription(offerData.description || "");
    setOfferType(offerData.offerType);
    setStartDateTime(offerData.startDateTime ? offerData.startDateTime.substring(0, 16) : "");
    setEndDateTime(offerData.endDateTime ? offerData.endDateTime.substring(0, 16) : "");
    setIsActive(offerData.isActive);
    setPriority(offerData.priority ?? 0);

    setSelectedBranchIds(offerData.offerBranches?.map((ob) => ob.branchId) || []);

    setMinSpendAmount(offerData.minSpendAmount ?? undefined);
    if (offerData.discountPercent) {
      setDiscountMode("percent");
      setDiscountPercent(offerData.discountPercent);
      setDiscountAmount(undefined);
    } else if (offerData.discountAmount) {
      setDiscountMode("amount");
      setDiscountAmount(offerData.discountAmount);
      setDiscountPercent(undefined);
    } else {
      setDiscountPercent(undefined);
      setDiscountAmount(undefined);
    }
    setBuyQuantity(offerData.buyQuantity ?? undefined);
    setGetQuantity(offerData.getQuantity ?? undefined);
    setBundlePrice(offerData.bundlePrice ?? undefined);
    setFixedPrice(offerData.fixedPrice ?? undefined);
    setStampsRequired(offerData.stampsRequired ?? undefined);
    setAddOnPrice(offerData.addOnPrice ?? undefined);

    setScheduleWindows(
      offerData.scheduleWindows?.map((w) => ({
        dayOfWeek: w.dayOfWeek,
        startTime: w.startTime,
        endTime: w.endTime,
        isActive: w.isActive,
      })) || []
    );

    if (offerData.offerItems) {
      setTargetProductIds(
        offerData.offerItems.filter((oi) => oi.itemRole === "Target").map((oi) => oi.productId).filter(Boolean) as string[]
      );
      setBuyProductIds(
        offerData.offerItems.filter((oi) => oi.itemRole === "BuyItem").map((oi) => oi.productId).filter(Boolean) as string[]
      );
      setRewardProductIds(
        offerData.offerItems.filter((oi) => oi.itemRole === "RewardItem").map((oi) => oi.productId).filter(Boolean) as string[]
      );
      setRequiredProductIds(
        offerData.offerItems.filter((oi) => oi.itemRole === "RequiredItem").map((oi) => oi.productId).filter(Boolean) as string[]
      );
      setGiftProductIds(
        offerData.offerItems.filter((oi) => oi.itemRole === "GiftItem").map((oi) => oi.productId).filter(Boolean) as string[]
      );
      setTriggerProductIds(
        offerData.offerItems.filter((oi) => oi.itemRole === "Trigger").map((oi) => oi.productId).filter(Boolean) as string[]
      );
      setAddonOptionProductIds(
        offerData.offerItems.filter((oi) => oi.itemRole === "AddOnOption").map((oi) => oi.productId).filter(Boolean) as string[]
      );
    }
  };

  useEffect(() => {
    if (offer) {
      resetFormToOffer(offer);
    }
  }, [offer]);

  // Compute number of changes made
  const changesCount = useMemo(() => {
    if (!offer) return 0;
    let count = 0;

    if (offerName !== (offer.offerName || "")) count++;
    if (description !== (offer.description || "")) count++;
    if (isActive !== offer.isActive) count++;
    if (priority !== (offer.priority ?? 0)) count++;

    const origStart = offer.startDateTime ? offer.startDateTime.substring(0, 16) : "";
    const origEnd = offer.endDateTime ? offer.endDateTime.substring(0, 16) : "";
    if (startDateTime !== origStart) count++;
    if (endDateTime !== origEnd) count++;

    if ((minSpendAmount ?? undefined) !== (offer.minSpendAmount ?? undefined)) count++;
    if ((discountPercent ?? undefined) !== (offer.discountPercent ?? undefined)) count++;
    if ((discountAmount ?? undefined) !== (offer.discountAmount ?? undefined)) count++;
    if ((buyQuantity ?? undefined) !== (offer.buyQuantity ?? undefined)) count++;
    if ((getQuantity ?? undefined) !== (offer.getQuantity ?? undefined)) count++;
    if ((bundlePrice ?? undefined) !== (offer.bundlePrice ?? undefined)) count++;
    if ((fixedPrice ?? undefined) !== (offer.fixedPrice ?? undefined)) count++;
    if ((stampsRequired ?? undefined) !== (offer.stampsRequired ?? undefined)) count++;
    if ((addOnPrice ?? undefined) !== (offer.addOnPrice ?? undefined)) count++;

    // Branches comparison
    const origBranchIds = offer.offerBranches?.map((b) => b.branchId) || [];
    if (
      origBranchIds.length !== selectedBranchIds.length ||
      origBranchIds.some((id) => !selectedBranchIds.includes(id))
    ) {
      count++;
    }

    // Schedule windows comparison
    const origWindows = offer.scheduleWindows || [];
    if (origWindows.length !== scheduleWindows.length) {
      count++;
    }

    return count;
  }, [
    offer,
    offerName,
    description,
    isActive,
    priority,
    startDateTime,
    endDateTime,
    minSpendAmount,
    discountPercent,
    discountAmount,
    buyQuantity,
    getQuantity,
    bundlePrice,
    fixedPrice,
    stampsRequired,
    addOnPrice,
    selectedBranchIds,
    scheduleWindows,
  ]);

  const handleDiscard = () => {
    if (offer) {
      resetFormToOffer(offer);
    }
    setIsEditingMode(false);
    toast.info("Changes discarded.");
  };

  const handleSave = async () => {
    if (!offerName.trim()) {
      toast.error("Offer name is required");
      return;
    }
    if (!startDateTime || !endDateTime) {
      toast.error("Please select start and end date/time");
      return;
    }
    if (new Date(endDateTime) <= new Date(startDateTime)) {
      toast.error("End date must be after start date");
      return;
    }

    let itemsPayload: CreateOfferItemRequest[] = [];
    let schedulePayload: OfferScheduleWindowRequest[] | undefined = undefined;

    switch (offerType) {
      case "SpendThresholdDiscount": {
        if (!minSpendAmount || minSpendAmount <= 0) {
          toast.error("Minimum spend amount must be greater than 0");
          return;
        }
        if (discountMode === "percent") {
          if (!discountPercent || discountPercent <= 0 || discountPercent > 100) {
            toast.error("Please enter a discount percentage between 1 and 100");
            return;
          }
        } else {
          if (!discountAmount || discountAmount <= 0) {
            toast.error("Please enter a discount amount greater than 0");
            return;
          }
        }
        itemsPayload.push({
          itemRole: "Target",
          targetType: "Order",
        });
        break;
      }

      case "BuyXGetY": {
        if (!buyQuantity || buyQuantity <= 0) {
          toast.error("Buy quantity must be at least 1");
          return;
        }
        if (!getQuantity || getQuantity <= 0) {
          toast.error("Get quantity must be at least 1");
          return;
        }
        if (buyProductIds.length === 0) {
          toast.error("Select at least one product for customer to Buy");
          return;
        }
        if (rewardProductIds.length === 0) {
          toast.error("Select at least one reward product for customer to Get");
          return;
        }
        buyProductIds.forEach((pId) => {
          itemsPayload.push({
            itemRole: "BuyItem",
            targetType: "Product",
            productId: pId,
          });
        });
        rewardProductIds.forEach((pId) => {
          itemsPayload.push({
            itemRole: "RewardItem",
            targetType: "Product",
            productId: pId,
          });
        });
        break;
      }

      case "BundleFixedPrice": {
        if (bundlePrice === undefined || bundlePrice < 0) {
          toast.error("Please provide a valid bundle combo price");
          return;
        }
        if (requiredProductIds.length < 2) {
          toast.error("Bundle offers require at least 2 required products");
          return;
        }
        requiredProductIds.forEach((pId) => {
          itemsPayload.push({
            itemRole: "RequiredItem",
            targetType: "Product",
            productId: pId,
            quantity: 1,
          });
        });
        break;
      }

      case "ScheduledFixedPrice": {
        if (fixedPrice === undefined || fixedPrice < 0) {
          toast.error("Please provide a valid special fixed price");
          return;
        }
        if (targetProductIds.length === 0) {
          toast.error("Select at least one target product for the Happy Hour price");
          return;
        }
        if (scheduleWindows.length === 0) {
          toast.error("At least one schedule time window is required for Happy Hour");
          return;
        }
        for (const w of scheduleWindows) {
          if (!w.startTime || !w.endTime) {
            toast.error("Schedule window start and end times are required");
            return;
          }
          if (w.startTime >= w.endTime) {
            toast.error(`End time (${w.endTime}) must be after start time (${w.startTime}) on ${w.dayOfWeek}`);
            return;
          }
        }
        targetProductIds.forEach((pId) => {
          itemsPayload.push({
            itemRole: "Target",
            targetType: "Product",
            productId: pId,
          });
        });
        schedulePayload = scheduleWindows;
        break;
      }

      case "LoyaltyStamp": {
        if (!stampsRequired || stampsRequired <= 0) {
          toast.error("Please enter the number of stamps required (e.g. 9)");
          return;
        }
        if (targetProductIds.length === 0) {
          toast.error("Select at least one eligible product for the stamp card");
          return;
        }
        if (selectedBranchIds.length === 0) {
          toast.error("Loyalty Stamp offers must be assigned to at least one specific branch");
          return;
        }
        targetProductIds.forEach((pId) => {
          itemsPayload.push({
            itemRole: "Target",
            targetType: "Product",
            productId: pId,
          });
        });
        break;
      }

      case "SpendThresholdGift": {
        if (!minSpendAmount || minSpendAmount <= 0) {
          toast.error("Minimum spend amount must be greater than 0");
          return;
        }
        if (giftProductIds.length === 0) {
          toast.error("Select at least one free gift product");
          return;
        }
        giftProductIds.forEach((pId) => {
          itemsPayload.push({
            itemRole: "GiftItem",
            targetType: "Product",
            productId: pId,
            quantity: 1,
          });
        });
        break;
      }

      case "AddOnUpsell": {
        if (addOnPrice === undefined || addOnPrice < 0) {
          toast.error("Please enter a valid add-on price");
          return;
        }
        if (triggerProductIds.length === 0) {
          toast.error("Select at least one trigger product that unlocks the add-on");
          return;
        }
        if (addonOptionProductIds.length === 0) {
          toast.error("Select at least one add-on option item");
          return;
        }
        triggerProductIds.forEach((pId) => {
          itemsPayload.push({
            itemRole: "Trigger",
            targetType: "Product",
            productId: pId,
          });
        });
        addonOptionProductIds.forEach((pId) => {
          itemsPayload.push({
            itemRole: "AddOnOption",
            targetType: "Product",
            productId: pId,
          });
        });
        break;
      }

      case "FreeUpgrade": {
        if (buyProductIds.length === 0 || rewardProductIds.length === 0) {
          toast.error("Please select base items and upgrade reward items");
          return;
        }
        buyProductIds.forEach((pId) => {
          itemsPayload.push({
            itemRole: "BuyItem",
            targetType: "Product",
            productId: pId,
          });
        });
        rewardProductIds.forEach((pId) => {
          itemsPayload.push({
            itemRole: "RewardItem",
            targetType: "Product",
            productId: pId,
          });
        });
        break;
      }
    }

    try {
      const payload: CreateOfferRequest = {
        offerName: offerName.trim(),
        description: description.trim() || undefined,
        offerType,
        startDateTime: new Date(startDateTime).toISOString(),
        endDateTime: new Date(endDateTime).toISOString(),
        isActive,
        priority: Number(priority) || 0,
        minSpendAmount:
          offerType === "SpendThresholdDiscount" || offerType === "SpendThresholdGift"
            ? Number(minSpendAmount)
            : undefined,
        discountPercent:
          offerType === "SpendThresholdDiscount" && discountMode === "percent"
            ? Number(discountPercent)
            : undefined,
        discountAmount:
          offerType === "SpendThresholdDiscount" && discountMode === "amount"
            ? Number(discountAmount)
            : undefined,
        bundlePrice: offerType === "BundleFixedPrice" ? Number(bundlePrice) : undefined,
        fixedPrice: offerType === "ScheduledFixedPrice" ? Number(fixedPrice) : undefined,
        stampsRequired: offerType === "LoyaltyStamp" ? Number(stampsRequired) : undefined,
        buyQuantity: offerType === "BuyXGetY" ? Number(buyQuantity) : undefined,
        getQuantity: offerType === "BuyXGetY" ? Number(getQuantity) : undefined,
        addOnPrice: offerType === "AddOnUpsell" ? Number(addOnPrice) : undefined,
        branchIds: selectedBranchIds,
        items: itemsPayload,
        scheduleWindows: schedulePayload,
      };

      await updateOffer({ id: offerId, data: payload }).unwrap();
      toast.success(`"${offerName.trim()}" details updated successfully`);
      setIsEditingMode(false);
    } catch (err: any) {
      console.error("Update offer error:", err);
      toast.error(err?.data?.message || err?.message || "Failed to update offer");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteOffer(offerId).unwrap();
      toast.success("Offer deleted successfully");
      router.push("/admin/offers");
    } catch (err: any) {
      toast.error(err?.data?.message || err?.message || "Failed to delete offer");
    }
  };

  const formatDateTimeSafe = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      const parsed = parseISO(dateString);
      return isValid(parsed) ? format(parsed, "MMM d, yyyy 'at' h:mm a") : dateString;
    } catch {
      return dateString;
    }
  };

  const getProductById = (id?: string): Product | undefined => {
    if (!id) return undefined;
    return products.find((p) => p.productId === id);
  };

  const getGroupedProducts = (filterText: string) => {
    const term = filterText.toLowerCase();
    const filtered = products.filter((p) => {
      const nameMatch = p.productName ? p.productName.toLowerCase().includes(term) : false;
      const categoryMatch = p.productCategoryName ? p.productCategoryName.toLowerCase().includes(term) : false;
      return nameMatch || categoryMatch;
    });

    if (categories.length === 0) {
      return [
        {
          productCategoryId: "all",
          categoryName: "Products",
          isActive: true,
          items: filtered,
        },
      ].filter((g) => g.items.length > 0);
    }

    const grouped = categories
      .map((cat) => ({
        ...cat,
        items: filtered.filter((p) => p.productCategoryId === cat.productCategoryId),
      }))
      .filter((cat) => cat.items.length > 0);

    const categorizedProductIds = new Set(grouped.flatMap((g) => g.items.map((p) => p.productId)));
    const uncategorized = filtered.filter((p) => !categorizedProductIds.has(p.productId));

    if (uncategorized.length > 0) {
      grouped.push({
        productCategoryId: "uncategorized",
        categoryName: "Other Products",
        isActive: true,
        items: uncategorized,
      });
    }

    return grouped;
  };

  const toggleSelection = (
    id: string,
    state: string[],
    setState: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setState((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleBranch = (branchId: string) => {
    setSelectedBranchIds((prev) =>
      prev.includes(branchId) ? prev.filter((id) => id !== branchId) : [...prev, branchId]
    );
  };

  const selectAllBranches = () => {
    setSelectedBranchIds(branches.map((b) => b.branchId));
  };

  const deselectAllBranches = () => {
    setSelectedBranchIds([]);
  };

  const handleAddScheduleWindow = () => {
    setScheduleWindows((prev) => [
      ...prev,
      { dayOfWeek: "Monday", startTime: "12:00", endTime: "14:00", isActive: true },
    ]);
  };

  const handleUpdateScheduleWindow = (
    index: number,
    field: keyof OfferScheduleWindowRequest,
    val: any
  ) => {
    setScheduleWindows((prev) =>
      prev.map((w, i) => (i === index ? { ...w, [field]: val } : w))
    );
  };

  const handleDeleteScheduleWindow = (index: number) => {
    setScheduleWindows((prev) => prev.filter((_, i) => i !== index));
  };

  const renderProductPicker = (
    title: string,
    subtitle: string,
    selectedIds: string[],
    setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>,
    searchText: string,
    setSearchText: (v: string) => void
  ) => {
    const grouped = getGroupedProducts(searchText);
    return (
      <Card className="flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="text-body flex items-center justify-between">
            <span>{title}</span>
            <Badge variant="secondary">{selectedIds.length} selected</Badge>
          </CardTitle>
          <CardDescription className="text-caption">{subtitle}</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col min-h-[280px]">
          {isEditingMode && (
            <div className="relative mb-3">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                className="pl-8 h-8 text-caption bg-white dark:bg-[#141414]"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>
          )}
          <div className="flex-1 overflow-y-auto max-h-60 border rounded-lg p-2 space-y-3 bg-muted/20">
            {isProductsLoading ? (
              <p className="text-caption text-muted-foreground p-2">Loading products...</p>
            ) : !isEditingMode ? (
              selectedIds.length === 0 ? (
                <p className="text-caption text-muted-foreground p-2">No products selected.</p>
              ) : (
                <div className="space-y-1">
                  {selectedIds.map((id) => {
                    const prod = getProductById(id);
                    return (
                      <div
                        key={id}
                        className="px-2.5 py-1.5 rounded-md bg-card border text-caption flex items-center justify-between"
                      >
                        <span className="font-medium truncate">{prod?.productName || "Product " + id}</span>
                        {prod?.productPrice !== undefined && (
                          <span className="text-muted-foreground ml-2">{formatCurrency(prod.productPrice)}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )
            ) : grouped.length === 0 ? (
              <p className="text-caption text-muted-foreground p-2">No matching products found.</p>
            ) : (
              grouped.map((cat) => (
                <div key={cat.productCategoryId} className="space-y-1">
                  <p className="text-detail font-bold uppercase text-muted-foreground tracking-wider px-1">
                    {cat.categoryName}
                  </p>
                  <div className="space-y-0.5">
                    {cat.items.map((prod) => {
                      const selected = selectedIds.includes(prod.productId);
                      return (
                        <button
                          key={prod.productId}
                          type="button"
                          onClick={() => toggleSelection(prod.productId, selectedIds, setSelectedIds)}
                          className={`w-full text-left px-2 py-1.5 rounded-md text-caption border transition-colors flex items-center justify-between ${
                            selected
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-background hover:bg-muted border-border"
                          }`}
                        >
                          <span className="truncate">{prod.productName}</span>
                          {selected && <Check className="h-3 w-3 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isOfferLoading) {
    return (
      <div className="space-y-6 pb-16">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-9 rounded-md" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-56 w-full rounded-xl" />
            <Skeleton className="h-72 w-full rounded-xl" />
          </div>
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!offer) {
    return (
      <div className="space-y-6">
        <PageHeader title="Offer Not Found" />
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={Tag}
              title="Offer not found"
              description="The promotional offer you are looking for does not exist or has been removed."
              action={
                <Button onClick={() => router.push("/admin/offers")}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Offers
                </Button>
              }
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  const isExpired = new Date(offer.endDateTime) < new Date();
  const isUpcoming = new Date(offer.startDateTime) > new Date();
  const offerTypeInfo = OFFER_TYPE_CONFIG[offer.offerType] || {
    label: offer.offerType,
    description: "Custom promotional campaign",
    icon: Tag,
  };
  const TypeIcon = offerTypeInfo.icon;

  const isAllBranches = selectedBranchIds.length === 0;
  const assignedBranches = isAllBranches
    ? branches
    : branches.filter((b) => selectedBranchIds.includes(b.branchId));

  return (
    <div className="space-y-6 pb-24">
      {/* Page Header matching branch detail pattern */}
      <div className="flex items-center gap-4 w-full">
        <Button variant="ghost" size="icon" onClick={() => router.push("/admin/offers")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader
          className="flex-1"
          title={offerName || offer.offerName}
          description={
            isEditingMode
              ? "Update promotional campaign details, discounts, schedule windows, and branch assignments"
              : offer.description || offerTypeInfo.description
          }
          actions={
            canManage && !isEditingMode ? (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
                <Button size="sm" onClick={() => setIsEditingMode(true)}>
                  <TbEdit className="h-4 w-4 mr-2" />
                  Edit Offer
                </Button>
              </div>
            ) : null
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left 2 Columns: Main Offer Form & Rules */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. General Information Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>General Information</span>
                <Badge variant="secondary" className="font-semibold text-caption">
                  {offerTypeInfo.label}
                </Badge>
              </CardTitle>
              <CardDescription>
                Define the promotional campaign name, public description, and validity schedule
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="offerName">Offer Name *</Label>
                    {isEditingMode && <CharacterCounter current={offerName.length} max={200} />}
                  </div>
                  <Input
                    id="offerName"
                    maxLength={200}
                    placeholder="e.g., Spend $30 Get 10% Off"
                    value={offerName}
                    onChange={(e) => setOfferName(e.target.value)}
                    disabled={!isEditingMode}
                    className="bg-white dark:bg-[#141414]"
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="description">Public Description</Label>
                    {isEditingMode && <CharacterCounter current={description.length} max={2000} />}
                  </div>
                  <Textarea
                    id="description"
                    maxLength={2000}
                    placeholder="Explain this offer to cashiers and customers..."
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={!isEditingMode}
                    className="bg-white dark:bg-[#141414]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="startDateTime" className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    Start Date & Time *
                  </Label>
                  <DateTimePicker
                    id="startDateTime"
                    value={startDateTime}
                    onChange={setStartDateTime}
                    placeholder="Select start date & time"
                    disabled={!isEditingMode}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDateTime" className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    End Date & Time *
                  </Label>
                  <DateTimePicker
                    id="endDateTime"
                    value={endDateTime}
                    onChange={setEndDateTime}
                    placeholder="Select end date & time"
                    disabled={!isEditingMode}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 2. Offer Configuration & Rules Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Offer Configuration & Rules
              </CardTitle>
              <CardDescription>
                Configure the specific pricing, thresholds, and product requirements for this offer
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* SpendThresholdDiscount */}
              {offerType === "SpendThresholdDiscount" && (
                <div className="space-y-4 max-w-lg">
                  <div className="space-y-2">
                    <Label htmlFor="minSpend">Minimum Spend Amount ($) *</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                      <Input
                        id="minSpend"
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="e.g., 30.00"
                        className="pl-7 bg-white dark:bg-[#141414]"
                        value={minSpendAmount ?? ""}
                        onChange={(e) =>
                          setMinSpendAmount(e.target.value ? parseFloat(e.target.value) : undefined)
                        }
                        disabled={!isEditingMode}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Discount Applied *</Label>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant={discountMode === "percent" ? "default" : "outline"}
                        size="sm"
                        onClick={() => isEditingMode && setDiscountMode("percent")}
                        disabled={!isEditingMode}
                      >
                        Percentage (%)
                      </Button>
                      <Button
                        type="button"
                        variant={discountMode === "amount" ? "default" : "outline"}
                        size="sm"
                        onClick={() => isEditingMode && setDiscountMode("amount")}
                        disabled={!isEditingMode}
                      >
                        Fixed Amount ($)
                      </Button>
                    </div>
                  </div>

                  {discountMode === "percent" ? (
                    <div className="space-y-2">
                      <Label htmlFor="discountPct">Discount Percentage (%) *</Label>
                      <div className="relative">
                        <Input
                          id="discountPct"
                          type="number"
                          step="1"
                          min="1"
                          max="100"
                          placeholder="e.g., 10"
                          value={discountPercent ?? ""}
                          onChange={(e) =>
                            setDiscountPercent(e.target.value ? parseFloat(e.target.value) : undefined)
                          }
                          disabled={!isEditingMode}
                          className="bg-white dark:bg-[#141414]"
                        />
                        <span className="absolute right-3 top-2.5 text-muted-foreground">%</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="discountAmt">Discount Amount ($) *</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                        <Input
                          id="discountAmt"
                          type="number"
                          step="0.01"
                          min="0.01"
                          placeholder="e.g., 5.00"
                          className="pl-7 bg-white dark:bg-[#141414]"
                          value={discountAmount ?? ""}
                          onChange={(e) =>
                            setDiscountAmount(e.target.value ? parseFloat(e.target.value) : undefined)
                          }
                          disabled={!isEditingMode}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* BuyXGetY */}
              {offerType === "BuyXGetY" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4 max-w-sm">
                    <div className="space-y-2">
                      <Label htmlFor="buyQty">Buy Quantity (X) *</Label>
                      <Input
                        id="buyQty"
                        type="number"
                        min="1"
                        placeholder="1"
                        value={buyQuantity ?? ""}
                        onChange={(e) =>
                          setBuyQuantity(e.target.value ? parseInt(e.target.value) : undefined)
                        }
                        disabled={!isEditingMode}
                        className="bg-white dark:bg-[#141414]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="getQty">Get Quantity (Y) *</Label>
                      <Input
                        id="getQty"
                        type="number"
                        min="1"
                        placeholder="1"
                        value={getQuantity ?? ""}
                        onChange={(e) =>
                          setGetQuantity(e.target.value ? parseInt(e.target.value) : undefined)
                        }
                        disabled={!isEditingMode}
                        className="bg-white dark:bg-[#141414]"
                      />
                    </div>
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    {renderProductPicker(
                      "Products to BUY",
                      "Qualifying items customer must purchase",
                      buyProductIds,
                      setBuyProductIds,
                      buySearchText,
                      setBuySearchText
                    )}
                    {renderProductPicker(
                      "Products to GET",
                      "Reward items customer receives free/discounted",
                      rewardProductIds,
                      setRewardProductIds,
                      rewardSearchText,
                      setRewardSearchText
                    )}
                  </div>
                </div>
              )}

              {/* BundleFixedPrice */}
              {offerType === "BundleFixedPrice" && (
                <div className="space-y-6">
                  <div className="space-y-2 max-w-sm">
                    <Label htmlFor="bundlePrice">Bundle Total Price ($) *</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                      <Input
                        id="bundlePrice"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="e.g., 12.00"
                        className="pl-7 bg-white dark:bg-[#141414]"
                        value={bundlePrice ?? ""}
                        onChange={(e) =>
                          setBundlePrice(e.target.value ? parseFloat(e.target.value) : undefined)
                        }
                        disabled={!isEditingMode}
                      />
                    </div>
                  </div>

                  {renderProductPicker(
                    "Required Products in Combo",
                    "Select all items required to form this bundle (min 2)",
                    requiredProductIds,
                    setRequiredProductIds,
                    productSearchText,
                    setProductSearchText
                  )}
                </div>
              )}

              {/* ScheduledFixedPrice (Happy Hour) */}
              {offerType === "ScheduledFixedPrice" && (
                <div className="space-y-6">
                  <div className="space-y-2 max-w-sm">
                    <Label htmlFor="fixedPrice">Special Happy Hour Price ($) *</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                      <Input
                        id="fixedPrice"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="e.g., 3.50"
                        className="pl-7 bg-white dark:bg-[#141414]"
                        value={fixedPrice ?? ""}
                        onChange={(e) =>
                          setFixedPrice(e.target.value ? parseFloat(e.target.value) : undefined)
                        }
                        disabled={!isEditingMode}
                      />
                    </div>
                  </div>

                  {/* Schedule Windows Manager */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-body font-semibold">Recurring Schedule Windows *</Label>
                        <p className="text-caption text-muted-foreground">
                          Define the recurring days and time windows when this special price applies.
                        </p>
                      </div>
                      {isEditingMode && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleAddScheduleWindow}
                        >
                          <Plus className="h-4 w-4 mr-1" /> Add Window
                        </Button>
                      )}
                    </div>

                    <div className="space-y-2.5">
                      {scheduleWindows.length === 0 ? (
                        <p className="text-caption text-muted-foreground italic p-3 border rounded-lg">
                          No schedule windows added yet.
                        </p>
                      ) : (
                        scheduleWindows.map((w, index) => (
                          <div
                            key={index}
                            className="flex flex-wrap items-center gap-3 p-3 border rounded-lg bg-card"
                          >
                            <select
                              className="h-9 px-3 border rounded-md bg-white dark:bg-[#141414] text-body"
                              value={w.dayOfWeek}
                              onChange={(e) =>
                                handleUpdateScheduleWindow(index, "dayOfWeek", e.target.value)
                              }
                              disabled={!isEditingMode}
                            >
                              {DAYS_OF_WEEK.map((d) => (
                                <option key={d} value={d}>
                                  {d}
                                </option>
                              ))}
                            </select>

                            <div className="flex items-center gap-2">
                              <TimePicker
                                value={w.startTime}
                                onChange={(val) => handleUpdateScheduleWindow(index, "startTime", val)}
                                disabled={!isEditingMode}
                                className="w-32"
                              />
                              <span className="text-muted-foreground text-caption">to</span>
                              <TimePicker
                                value={w.endTime}
                                onChange={(val) => handleUpdateScheduleWindow(index, "endTime", val)}
                                disabled={!isEditingMode}
                                className="w-32"
                              />
                            </div>

                            {isEditingMode && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:bg-destructive/10 ml-auto"
                                onClick={() => handleDeleteScheduleWindow(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {renderProductPicker(
                    "Eligible Products",
                    "Products that qualify for this special price during the time windows",
                    targetProductIds,
                    setTargetProductIds,
                    productSearchText,
                    setProductSearchText
                  )}
                </div>
              )}

              {/* LoyaltyStamp */}
              {offerType === "LoyaltyStamp" && (
                <div className="space-y-6">
                  <div className="space-y-2 max-w-sm">
                    <Label htmlFor="stampsRequired">Stamps Required for Free Item *</Label>
                    <Input
                      id="stampsRequired"
                      type="number"
                      min="1"
                      placeholder="e.g., 9"
                      value={stampsRequired ?? ""}
                      onChange={(e) =>
                        setStampsRequired(e.target.value ? parseInt(e.target.value) : undefined)
                      }
                      disabled={!isEditingMode}
                      className="bg-white dark:bg-[#141414]"
                    />
                    <p className="text-caption text-muted-foreground">
                      Customer collects this many stamps to unlock 1 free item on their next purchase.
                    </p>
                  </div>

                  {renderProductPicker(
                    "Eligible Products for Stamp Card",
                    "Purchasing these products awards stamps and allows free item redemption",
                    targetProductIds,
                    setTargetProductIds,
                    productSearchText,
                    setProductSearchText
                  )}
                </div>
              )}

              {/* SpendThresholdGift */}
              {offerType === "SpendThresholdGift" && (
                <div className="space-y-6">
                  <div className="space-y-2 max-w-sm">
                    <Label htmlFor="giftMinSpend">Minimum Spend Amount ($) *</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                      <Input
                        id="giftMinSpend"
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="e.g., 40.00"
                        className="pl-7 bg-white dark:bg-[#141414]"
                        value={minSpendAmount ?? ""}
                        onChange={(e) =>
                          setMinSpendAmount(e.target.value ? parseFloat(e.target.value) : undefined)
                        }
                        disabled={!isEditingMode}
                      />
                    </div>
                  </div>

                  {renderProductPicker(
                    "Complimentary Gift Products",
                    "Select item(s) offered as a free gift when spend threshold is met",
                    giftProductIds,
                    setGiftProductIds,
                    productSearchText,
                    setProductSearchText
                  )}
                </div>
              )}

              {/* AddOnUpsell */}
              {offerType === "AddOnUpsell" && (
                <div className="space-y-6">
                  <div className="space-y-2 max-w-sm">
                    <Label htmlFor="addOnPrice">Special Add-On Price ($) *</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                      <Input
                        id="addOnPrice"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="e.g., 1.50"
                        className="pl-7 bg-white dark:bg-[#141414]"
                        value={addOnPrice ?? ""}
                        onChange={(e) =>
                          setAddOnPrice(e.target.value ? parseFloat(e.target.value) : undefined)
                        }
                        disabled={!isEditingMode}
                      />
                    </div>
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    {renderProductPicker(
                      "Trigger Products",
                      "Purchasing these triggers the add-on deal",
                      triggerProductIds,
                      setTriggerProductIds,
                      buySearchText,
                      setBuySearchText
                    )}
                    {renderProductPicker(
                      "Add-On Options",
                      "Items customer can add at the special add-on price",
                      addonOptionProductIds,
                      setAddonOptionProductIds,
                      rewardSearchText,
                      setRewardSearchText
                    )}
                  </div>
                </div>
              )}

              {/* FreeUpgrade */}
              {offerType === "FreeUpgrade" && (
                <div className="space-y-6">
                  <div className="grid gap-6 sm:grid-cols-2">
                    {renderProductPicker(
                      "Base Qualifying Products",
                      "Products customer purchases",
                      buyProductIds,
                      setBuyProductIds,
                      buySearchText,
                      setBuySearchText
                    )}
                    {renderProductPicker(
                      "Upgraded Reward Products",
                      "Upgraded items received at no extra cost",
                      rewardProductIds,
                      setRewardProductIds,
                      rewardSearchText,
                      setRewardSearchText
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right 1 Column: Status, Priority & Target Branches */}
        <div className="space-y-6">
          {/* Status & Priority Card */}
          <Card>
            <CardHeader>
              <CardTitle>Status & Priority</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Offer Active</Label>
                  <p className="text-caption text-muted-foreground">
                    Evaluate and apply offer during checkout
                  </p>
                </div>
                <Switch
                  checked={isActive}
                  onCheckedChange={setIsActive}
                  disabled={!isEditingMode}
                />
              </div>

              <div className="space-y-2 border-t pt-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="priority">Evaluation Priority</Label>
                  <Badge variant="outline" className="text-detail">
                    {priority > 0 ? "High Priority" : "Standard"}
                  </Badge>
                </div>
                <Input
                  id="priority"
                  type="number"
                  placeholder="0"
                  value={priority}
                  onChange={(e) => setPriority(parseInt(e.target.value) || 0)}
                  disabled={!isEditingMode}
                  className="bg-white dark:bg-[#141414]"
                />
                <p className="text-caption text-muted-foreground">
                  Higher priority offers evaluate before lower ones when multiple offers compete.
                </p>
              </div>

              <div className="border-t pt-4 space-y-1">
                <span className="text-detail text-muted-foreground block">Current System Status</span>
                <Badge
                  variant={
                    isExpired
                      ? "secondary"
                      : isUpcoming
                      ? "outline"
                      : isActive
                      ? "success"
                      : "secondary"
                  }
                  className="text-detail font-medium rounded-md px-2.5 py-1"
                >
                  {isExpired
                    ? "Expired Campaign"
                    : isUpcoming
                    ? "Scheduled Future Campaign"
                    : isActive
                    ? "Active & Live"
                    : "Disabled / Inactive"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Participating Branches Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-body font-semibold flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  Target Branches
                </span>
                <Badge variant={isAllBranches ? "secondary" : "outline"} className="text-caption">
                  {isAllBranches ? "All Branches" : `${selectedBranchIds.length} Selected`}
                </Badge>
              </CardTitle>
              <CardDescription>
                {isAllBranches
                  ? "This offer applies automatically across all active cafe locations."
                  : "This offer is restricted to specific designated branches."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {isBranchesLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : isEditingMode ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b pb-2">
                    <span className="text-caption font-medium text-muted-foreground">
                      {selectedBranchIds.length} of {branches.length} branches selected
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-caption"
                        onClick={selectAllBranches}
                      >
                        Select All
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-caption text-muted-foreground"
                        onClick={deselectAllBranches}
                      >
                        Clear All
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                    {branches.map((branch) => {
                      const isSelected = selectedBranchIds.includes(branch.branchId);
                      return (
                        <div
                          key={branch.branchId}
                          onClick={() => toggleBranch(branch.branchId)}
                          className={`p-3 rounded-lg border flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                            isSelected
                              ? "bg-primary/5 border-primary/40 dark:bg-primary/10"
                              : "bg-card hover:bg-muted/50 border-border"
                          }`}
                        >
                          <div className="space-y-0.5 min-w-0">
                            <p className="text-caption font-semibold truncate">{branch.branchName}</p>
                            {branch.branchAddress && (
                              <p className="text-detail text-muted-foreground truncate">{branch.branchAddress}</p>
                            )}
                          </div>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleBranch(branch.branchId)}
                            className="shrink-0"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                  {assignedBranches.map((branch) => (
                    <div
                      key={branch.branchId}
                      className="p-3 rounded-lg border bg-card flex items-start justify-between gap-2"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <p className="text-caption font-semibold truncate">{branch.branchName}</p>
                        {branch.branchAddress && (
                          <p className="text-detail text-muted-foreground truncate">{branch.branchAddress}</p>
                        )}
                        {branch.branchPhoneNumber && (
                          <p className="text-detail text-muted-foreground">{branch.branchPhoneNumber}</p>
                        )}
                      </div>
                      <Badge
                        variant={branch.isActive ? "success" : "secondary"}
                        className="text-detail shrink-0 py-0"
                      >
                        {branch.isActive ? "Open" : "Inactive"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Floating Save/Discard Bar matching Branch detail page */}
      {isEditingMode && changesCount > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-background/95 backdrop-blur border border-border shadow-2xl rounded-full px-6 py-3 flex items-center justify-between gap-8 max-w-xl w-[90%] animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="text-body font-semibold text-foreground">
              {changesCount} {changesCount === 1 ? "change" : "changes"} made
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleDiscard}
              className="rounded-full"
            >
              Discard
            </Button>
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handleSave}
              disabled={isUpdating}
              className="rounded-full px-4"
            >
              {isUpdating && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Save
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Delete Offer"
        description={`Are you sure you want to delete "${offer.offerName}"? This action cannot be undone and will permanently remove this promotional campaign.`}
        confirmText="Delete Offer"
        variant="destructive"
        isLoading={isDeleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
