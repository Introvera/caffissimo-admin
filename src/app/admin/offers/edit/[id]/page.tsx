"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Tag,
  Layers,
  Percent,
  Calendar,
  Building2,
  Check,
  Search,
  Plus,
  Trash2,
  Clock,
  Gift,
  ArrowUpRight,
  Award,
  Zap,
  ShoppingBag,
  Info,
} from "lucide-react";
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
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { TimePicker } from "@/components/ui/time-picker";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { EditBar } from "@/components/shared/edit-bar";
import { useAppSelector } from "@/stores/store";
import { isSuperAdmin } from "@/lib/rbac";
import { useGetBranchesQuery } from "@/stores/api/branchApi";
import { useGetProductsQuery, useGetCategoriesQuery } from "@/stores/api/productApi";
import { useGetOfferByIdQuery, useUpdateOfferMutation } from "@/stores/api/offerApi";
import {
  CreateOfferRequest,
  CreateOfferItemRequest,
  OfferScheduleWindowRequest,
  OfferType,
} from "@/types";
import { CharacterCounter } from "@/components/ui/character-counter";
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

interface EditOfferPageProps {
  params: Promise<{ id: string }>;
}

export default function EditOfferPage({ params }: EditOfferPageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const offerId = resolvedParams.id;
  const currentRole = useAppSelector((state) => state.auth.user?.role);
  const isSuper = isSuperAdmin(currentRole);

  useEffect(() => {
    if (currentRole && !isSuper) {
      toast.error("You are not authorized to edit offers.");
      router.push("/admin/offers");
    }
  }, [currentRole, isSuper, router]);

  const [apiSearchText, setApiSearchText] = useState("");

  // API hooks
  const { data: offer, isLoading: isLoadingOffer } = useGetOfferByIdQuery(offerId);
  const { data: branchesData, isLoading: isLoadingBranches } = useGetBranchesQuery();
  const { data: productsData, isLoading: isLoadingProducts } = useGetProductsQuery({
    pageSize: 150,
    search: apiSearchText || undefined,
  });
  const { data: categoriesData } = useGetCategoriesQuery();
  const [updateOffer, { isLoading: isUpdating }] = useUpdateOfferMutation();

  // Basic Form State
  const [offerName, setOfferName] = useState("");
  const [description, setDescription] = useState("");
  const [offerType, setOfferType] = useState<OfferType>("SpendThresholdDiscount");
  const [startDateTime, setStartDateTime] = useState("");
  const [endDateTime, setEndDateTime] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [priority, setPriority] = useState<number>(0);

  // Type specific scalar fields
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

  // Schedule Windows (for ScheduledFixedPrice)
  const [scheduleWindows, setScheduleWindows] = useState<OfferScheduleWindowRequest[]>([]);

  // Targeting: Branch Selections
  const [selectedBranchIds, setSelectedBranchIds] = useState<string[]>([]);

  // Item Targeting Selections
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

  // Populate state when offer loads
  useEffect(() => {
    if (offer) {
      setOfferName(offer.offerName || "");
      setDescription(offer.description || "");
      setOfferType(offer.offerType);
      if (offer.startDateTime) {
        setStartDateTime(offer.startDateTime.substring(0, 16));
      }
      if (offer.endDateTime) {
        setEndDateTime(offer.endDateTime.substring(0, 16));
      }
      setIsActive(offer.isActive);
      setPriority(offer.priority ?? 0);

      setSelectedBranchIds(offer.offerBranches?.map((ob) => ob.branchId) || []);

      setMinSpendAmount(offer.minSpendAmount ?? undefined);
      if (offer.discountPercent) {
        setDiscountMode("percent");
        setDiscountPercent(offer.discountPercent);
      } else if (offer.discountAmount) {
        setDiscountMode("amount");
        setDiscountAmount(offer.discountAmount);
      }
      setBuyQuantity(offer.buyQuantity ?? undefined);
      setGetQuantity(offer.getQuantity ?? undefined);
      setBundlePrice(offer.bundlePrice ?? undefined);
      setFixedPrice(offer.fixedPrice ?? undefined);
      setStampsRequired(offer.stampsRequired ?? undefined);
      setAddOnPrice(offer.addOnPrice ?? undefined);

      if (offer.scheduleWindows && offer.scheduleWindows.length > 0) {
        setScheduleWindows(
          offer.scheduleWindows.map((w) => ({
            dayOfWeek: w.dayOfWeek,
            startTime: w.startTime,
            endTime: w.endTime,
            isActive: w.isActive,
          }))
        );
      }

      if (offer.offerItems) {
        setTargetProductIds(
          offer.offerItems
            .filter((oi) => oi.itemRole === "Target")
            .map((oi) => oi.productId)
            .filter(Boolean) as string[]
        );
        setBuyProductIds(
          offer.offerItems
            .filter((oi) => oi.itemRole === "BuyItem")
            .map((oi) => oi.productId)
            .filter(Boolean) as string[]
        );
        setRewardProductIds(
          offer.offerItems
            .filter((oi) => oi.itemRole === "RewardItem")
            .map((oi) => oi.productId)
            .filter(Boolean) as string[]
        );
        setRequiredProductIds(
          offer.offerItems
            .filter((oi) => oi.itemRole === "RequiredItem")
            .map((oi) => oi.productId)
            .filter(Boolean) as string[]
        );
        setGiftProductIds(
          offer.offerItems
            .filter((oi) => oi.itemRole === "GiftItem")
            .map((oi) => oi.productId)
            .filter(Boolean) as string[]
        );
        setTriggerProductIds(
          offer.offerItems
            .filter((oi) => oi.itemRole === "Trigger")
            .map((oi) => oi.productId)
            .filter(Boolean) as string[]
        );
        setAddonOptionProductIds(
          offer.offerItems
            .filter((oi) => oi.itemRole === "AddOnOption")
            .map((oi) => oi.productId)
            .filter(Boolean) as string[]
        );
      }
    }
  }, [offer]);

  // Debounce search
  useEffect(() => {
    const activeSearch = buySearchText || rewardSearchText || productSearchText || "";
    const timer = setTimeout(() => {
      setApiSearchText(activeSearch);
    }, 450);
    return () => clearTimeout(timer);
  }, [buySearchText, rewardSearchText, productSearchText]);

  const branches = branchesData?.items || [];
  const products = productsData?.items || [];
  const categories = categoriesData?.items || [];

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

  const toggleSelection = (
    id: string,
    state: string[],
    setState: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setState((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleUpdate = async () => {
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
      toast.success("Offer updated successfully");
      router.push("/admin/offers");
    } catch (err: any) {
      console.error("Update offer error:", err);
      toast.error(err?.data?.message || err?.message || "Failed to update offer");
    }
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
        <CardContent className="flex-1 flex flex-col min-h-[300px]">
          <div className="relative mb-3">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              className="pl-8 h-8 text-caption"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
          <div className="flex-1 overflow-y-auto max-h-64 border rounded-lg p-2 space-y-3 bg-muted/20">
            {isLoadingProducts ? (
              <p className="text-caption text-muted-foreground p-2">Loading products...</p>
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

  if (isLoadingOffer) {
    return (
      <div className="space-y-6 pb-20">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-44 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
          <Skeleton className="h-80 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader
          title="Edit Offer & Promotion"
          description="Update promotion details, discounts, schedule windows, and branch assignments"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left 2 Columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Offer Type (Display Only on Edit) */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-body flex items-center justify-between">
                <span>Offer Type</span>
                <Badge variant="secondary" className="font-semibold text-caption">
                  {offerType}
                </Badge>
              </CardTitle>
              <CardDescription>
                Offer type cannot be altered once created to preserve historical transaction audit logs.
              </CardDescription>
            </CardHeader>
          </Card>

          {/* 2. General Information */}
          <Card>
            <CardHeader>
              <CardTitle>General Information</CardTitle>
              <CardDescription>
                Define the promotion name, public description, and campaign validity window
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="offerName">Offer Name *</Label>
                    <CharacterCounter current={offerName.length} max={200} />
                  </div>
                  <Input
                    id="offerName"
                    maxLength={200}
                    placeholder="e.g., Spend $30 Get 10% Off"
                    value={offerName}
                    onChange={(e) => setOfferName(e.target.value)}
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="description">Public Description</Label>
                    <CharacterCounter current={description.length} max={2000} />
                  </div>
                  <Textarea
                    id="description"
                    maxLength={2000}
                    placeholder="Explain this offer to cashiers and customers..."
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
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
                  />
                </div>
              </div>

              <div className="flex items-center justify-between border-t pt-4">
                <div className="space-y-0.5">
                  <Label>Active</Label>
                  <p className="text-caption text-muted-foreground">
                    If enabled, the offer evaluates and applies once within the valid date range.
                  </p>
                </div>
                <Switch checked={isActive} onCheckedChange={setIsActive} />
              </div>
            </CardContent>
          </Card>

          {/* 3. Offer Configuration & Rules */}
          <Card>
            <CardHeader>
              <CardTitle>Offer Configuration & Rules</CardTitle>
              <CardDescription>
                Configure the specific pricing, thresholds, and calculations for this offer
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {offerType === "SpendThresholdDiscount" && (
                <div className="space-y-4 max-w-lg">
                  <div className="space-y-2">
                    <Label htmlFor="minSpend">Minimum Spend Amount ($) *</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                      <Input
                        id="minSpend"
                        type="number"
                        step="0.50"
                        min={0.01}
                        className="pl-7"
                        placeholder="e.g. 30.00"
                        value={minSpendAmount ?? ""}
                        onChange={(e) => setMinSpendAmount(parseFloat(e.target.value) || undefined)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Discount Reward Type</Label>
                    <div className="grid grid-cols-2 gap-2 p-1 border rounded-lg bg-muted/30">
                      <button
                        type="button"
                        onClick={() => setDiscountMode("percent")}
                        className={`py-1.5 text-caption font-semibold rounded-md transition-all ${
                          discountMode === "percent"
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground"
                        }`}
                      >
                        Percentage Off (%)
                      </button>
                      <button
                        type="button"
                        onClick={() => setDiscountMode("amount")}
                        className={`py-1.5 text-caption font-semibold rounded-md transition-all ${
                          discountMode === "amount"
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground"
                        }`}
                      >
                        Flat Dollar Off ($)
                      </button>
                    </div>
                  </div>

                  {discountMode === "percent" ? (
                    <div className="space-y-2">
                      <Label htmlFor="discPercent">Discount Percentage (%) *</Label>
                      <div className="relative">
                        <Input
                          id="discPercent"
                          type="number"
                          min={1}
                          max={100}
                          placeholder="e.g. 10"
                          value={discountPercent ?? ""}
                          onChange={(e) => setDiscountPercent(parseFloat(e.target.value) || undefined)}
                        />
                        <span className="absolute right-3 top-2.5 text-muted-foreground">%</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="discAmount">Discount Amount ($) *</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                        <Input
                          id="discAmount"
                          type="number"
                          step="0.50"
                          min={0.01}
                          className="pl-7"
                          placeholder="e.g. 5.00"
                          value={discountAmount ?? ""}
                          onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || undefined)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {offerType === "BuyXGetY" && (
                <div className="grid gap-4 sm:grid-cols-2 max-w-lg">
                  <div className="space-y-2">
                    <Label htmlFor="buyQty">Required Buy Quantity *</Label>
                    <Input
                      id="buyQty"
                      type="number"
                      min={1}
                      placeholder="e.g. 1"
                      value={buyQuantity ?? ""}
                      onChange={(e) => setBuyQuantity(parseInt(e.target.value) || undefined)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="getQty">Reward Get Quantity *</Label>
                    <Input
                      id="getQty"
                      type="number"
                      min={1}
                      placeholder="e.g. 1"
                      value={getQuantity ?? ""}
                      onChange={(e) => setGetQuantity(parseInt(e.target.value) || undefined)}
                    />
                  </div>
                </div>
              )}

              {offerType === "BundleFixedPrice" && (
                <div className="space-y-2 max-w-sm">
                  <Label htmlFor="bundlePrice">Bundle Combo Total Price ($) *</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                    <Input
                      id="bundlePrice"
                      type="number"
                      step="0.10"
                      min={0}
                      className="pl-7"
                      placeholder="e.g. 12.90"
                      value={bundlePrice ?? ""}
                      onChange={(e) => setBundlePrice(parseFloat(e.target.value) || undefined)}
                    />
                  </div>
                </div>
              )}

              {offerType === "ScheduledFixedPrice" && (
                <div className="space-y-2 max-w-sm">
                  <Label htmlFor="fixedPrice">Special Happy Hour Price ($) *</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                    <Input
                      id="fixedPrice"
                      type="number"
                      step="0.10"
                      min={0}
                      className="pl-7"
                      placeholder="e.g. 3.50"
                      value={fixedPrice ?? ""}
                      onChange={(e) => setFixedPrice(parseFloat(e.target.value) || undefined)}
                    />
                  </div>
                </div>
              )}

              {offerType === "LoyaltyStamp" && (
                <div className="space-y-2 max-w-sm">
                  <Label htmlFor="stampsReq">Stamps Required for Reward *</Label>
                  <Input
                    id="stampsReq"
                    type="number"
                    min={1}
                    max={50}
                    placeholder="e.g. 9"
                    value={stampsRequired ?? ""}
                    onChange={(e) => setStampsRequired(parseInt(e.target.value) || undefined)}
                  />
                </div>
              )}

              {offerType === "SpendThresholdGift" && (
                <div className="space-y-2 max-w-sm">
                  <Label htmlFor="giftMinSpend">Minimum Spend Amount ($) *</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                    <Input
                      id="giftMinSpend"
                      type="number"
                      step="0.50"
                      min={0.01}
                      className="pl-7"
                      placeholder="e.g. 50.00"
                      value={minSpendAmount ?? ""}
                      onChange={(e) => setMinSpendAmount(parseFloat(e.target.value) || undefined)}
                    />
                  </div>
                </div>
              )}

              {offerType === "AddOnUpsell" && (
                <div className="space-y-2 max-w-sm">
                  <Label htmlFor="addOnPrice">Add-On Special Price ($) *</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                    <Input
                      id="addOnPrice"
                      type="number"
                      step="0.10"
                      min={0}
                      className="pl-7"
                      placeholder="e.g. 2.00"
                      value={addOnPrice ?? ""}
                      onChange={(e) => setAddOnPrice(parseFloat(e.target.value) || undefined)}
                    />
                  </div>
                </div>
              )}

              {offerType === "FreeUpgrade" && (
                <div className="bg-cyan-500/10 border border-cyan-500/20 text-caption p-3 rounded-lg text-cyan-800 dark:text-cyan-200">
                  <p className="leading-relaxed">
                    Select qualifying base products and the upgrade items below.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 4. Schedule Windows (Happy Hour) */}
          {offerType === "ScheduledFixedPrice" && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-emerald-600" />
                      Happy Hour Schedule Windows *
                    </CardTitle>
                    <CardDescription>
                      Specify active recurring days and time ranges (e.g., Mon-Fri 14:00 – 16:00)
                    </CardDescription>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddScheduleWindow}
                  >
                    <Plus className="h-4 w-4 mr-1.5" />
                    Add Window
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {scheduleWindows.length === 0 ? (
                  <p className="text-caption text-muted-foreground">
                    No schedule windows added yet. Click &quot;Add Window&quot; to configure active times.
                  </p>
                ) : (
                  scheduleWindows.map((win, idx) => (
                    <div
                      key={idx}
                      className="flex flex-wrap items-center gap-3 p-3 rounded-lg border bg-muted/20"
                    >
                      <div className="w-36">
                        <Label className="text-detail">Day of Week</Label>
                        <select
                          value={win.dayOfWeek}
                          onChange={(e) => handleUpdateScheduleWindow(idx, "dayOfWeek", e.target.value)}
                          className="w-full h-8 px-2 rounded-md border border-border bg-background text-caption mt-1"
                        >
                          {DAYS_OF_WEEK.map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="w-32">
                        <Label className="text-detail">Start Time</Label>
                        <TimePicker
                          className="mt-1"
                          value={win.startTime}
                          onChange={(val) => handleUpdateScheduleWindow(idx, "startTime", val)}
                        />
                      </div>

                      <div className="w-32">
                        <Label className="text-detail">End Time</Label>
                        <TimePicker
                          className="mt-1"
                          value={win.endTime}
                          onChange={(val) => handleUpdateScheduleWindow(idx, "endTime", val)}
                        />
                      </div>

                      <div className="flex items-center gap-1.5 mt-5">
                        <Switch
                          checked={win.isActive !== false}
                          onCheckedChange={(val) => handleUpdateScheduleWindow(idx, "isActive", val)}
                        />
                        <span className="text-detail text-muted-foreground">Active</span>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive ml-auto mt-5"
                        onClick={() => handleDeleteScheduleWindow(idx)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          )}

          {/* Product Pickers tailored to Offer Type */}
          {offerType === "BuyXGetY" && (
            <div className="grid gap-6 sm:grid-cols-2">
              {renderProductPicker(
                "Products to BUY *",
                "Items qualifying for the buy requirement",
                buyProductIds,
                setBuyProductIds,
                buySearchText,
                setBuySearchText
              )}
              {renderProductPicker(
                "Products to GET *",
                "Items awarded as the reward",
                rewardProductIds,
                setRewardProductIds,
                rewardSearchText,
                setRewardSearchText
              )}
            </div>
          )}

          {offerType === "BundleFixedPrice" && (
            <div>
              {renderProductPicker(
                "Required Bundle Products * (Min 2)",
                "Select all products required together for this combo deal",
                requiredProductIds,
                setRequiredProductIds,
                productSearchText,
                setProductSearchText
              )}
            </div>
          )}

          {(offerType === "ScheduledFixedPrice" || offerType === "LoyaltyStamp") && (
            <div>
              {renderProductPicker(
                "Qualifying Target Products *",
                "Select which products are eligible for this promotion",
                targetProductIds,
                setTargetProductIds,
                productSearchText,
                setProductSearchText
              )}
            </div>
          )}

          {offerType === "SpendThresholdGift" && (
            <div>
              {renderProductPicker(
                "Free Gift Products *",
                "Select the gift item(s) awarded when the spend threshold is met",
                giftProductIds,
                setGiftProductIds,
                productSearchText,
                setProductSearchText
              )}
            </div>
          )}

          {offerType === "AddOnUpsell" && (
            <div className="grid gap-6 sm:grid-cols-2">
              {renderProductPicker(
                "Trigger Products *",
                "Purchasing these unlocks the add-on price",
                triggerProductIds,
                setTriggerProductIds,
                buySearchText,
                setBuySearchText
              )}
              {renderProductPicker(
                "Add-On Option Items *",
                "Items available at the special add-on price",
                addonOptionProductIds,
                setAddonOptionProductIds,
                rewardSearchText,
                setRewardSearchText
              )}
            </div>
          )}

          {offerType === "FreeUpgrade" && (
            <div className="grid gap-6 sm:grid-cols-2">
              {renderProductPicker(
                "Base Items *",
                "Eligible items to purchase",
                buyProductIds,
                setBuyProductIds,
                buySearchText,
                setBuySearchText
              )}
              {renderProductPicker(
                "Free Upgrade Targets *",
                "Upgraded items awarded for free",
                rewardProductIds,
                setRewardProductIds,
                rewardSearchText,
                setRewardSearchText
              )}
            </div>
          )}
        </div>

        {/* Right 1 Column (Target Branches & Priority) */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-h3 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-muted-foreground" />
                Target Branches
              </CardTitle>
              <CardDescription>
                {offerType === "LoyaltyStamp"
                  ? "Loyalty Stamp cards require at least 1 specific branch."
                  : "Leave empty to apply globally across all branches."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoadingBranches ? (
                <p className="text-body text-muted-foreground">Loading branches...</p>
              ) : branches.length === 0 ? (
                <p className="text-body text-muted-foreground">No branches found.</p>
              ) : (
                <>
                  {/* Distinct Action Toolbar */}
                  <div className="flex items-center justify-between pb-2 border-b border-border/70">
                    <span className="text-caption text-muted-foreground font-medium">
                      {selectedBranchIds.length === 0
                        ? "0 selected (Applies globally)"
                        : `${selectedBranchIds.length} of ${branches.length} selected`}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={selectAllBranches}
                        className="h-7 px-2 text-caption text-primary hover:text-primary hover:bg-primary/10 font-medium"
                      >
                        Select All
                      </Button>
                      <span className="text-border">|</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={deselectAllBranches}
                        className="h-7 px-2 text-caption text-muted-foreground hover:text-destructive hover:bg-destructive/10 font-medium"
                      >
                        Clear All
                      </Button>
                    </div>
                  </div>

                  {/* Branch Checkbox List */}
                  <div className="space-y-1.5 max-h-[260px] overflow-y-auto pr-1">
                    {branches.map((b) => {
                      const selected = selectedBranchIds.includes(b.branchId);
                      return (
                        <div
                          key={b.branchId}
                          onClick={() => toggleBranch(b.branchId)}
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg border text-caption font-medium cursor-pointer transition-colors ${
                            selected
                              ? "bg-primary/5 dark:bg-primary/10 border-primary/40 text-foreground"
                              : "bg-white dark:bg-[#141414] border-border/80 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                          }`}
                        >
                          <Checkbox
                            checked={selected}
                            onCheckedChange={() => toggleBranch(b.branchId)}
                            onClick={(e) => e.stopPropagation()}
                            id={`edit-branch-cb-${b.branchId}`}
                          />
                          <label
                            htmlFor={`edit-branch-cb-${b.branchId}`}
                            className="cursor-pointer select-none flex-1 truncate"
                          >
                            {b.branchName.replace("Caffissimo", "").trim()}
                          </label>
                        </div>
                      );
                    })}
                  </div>

                  {selectedBranchIds.length === 0 && offerType !== "LoyaltyStamp" && (
                    <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 text-detail p-3 rounded-lg text-primary flex items-start gap-2">
                      <Info className="h-4 w-4 shrink-0 mt-0.5" />
                      <p className="leading-snug">
                        <strong>Apply Globally:</strong> No branch selected. This offer will apply globally to all current and future branches.
                      </p>
                    </div>
                  )}

                  {selectedBranchIds.length === 0 && offerType === "LoyaltyStamp" && (
                    <div className="bg-destructive/10 border border-destructive/20 text-detail p-3 rounded-lg text-destructive flex items-start gap-2">
                      <Info className="h-4 w-4 shrink-0 mt-0.5" />
                      <p className="leading-snug font-medium">
                        At least one branch must be selected for Loyalty Stamp programs.
                      </p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-body flex items-center gap-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
                Offer Priority
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                type="number"
                min={0}
                placeholder="0 (Default)"
                value={priority}
                onChange={(e) => setPriority(parseInt(e.target.value) || 0)}
              />
              <p className="text-detail text-muted-foreground mt-1.5">
                Higher priority offers evaluate first during checkout.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <EditBar
        isVisible={true}
        onSave={handleUpdate}
        onCancel={() => router.back()}
        label="Edit offer"
        saveLabel={isUpdating ? "Saving..." : "Save Changes"}
        cancelLabel="Cancel"
        isSaving={isUpdating}
      />
    </div>
  );
}
