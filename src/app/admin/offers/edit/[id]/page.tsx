"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Sparkles,
  Tag,
  Layers,
  Percent,
  Calendar,
  Building2,
  Check,
  Search,
  Plus,
  X,
  Compass,
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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { EditBar } from "@/components/shared/edit-bar";
import { useGetBranchesQuery } from "@/stores/api/branchApi";
import { useGetProductsQuery, useGetCategoriesQuery } from "@/stores/api/productApi";
import { useGetOfferByIdQuery, useUpdateOfferMutation } from "@/stores/api/offerApi";
import { CreateOfferRequest, CreateOfferItemRequest, OfferType } from "@/types";
import { toast } from "sonner";

interface EditOfferPageProps {
  params: Promise<{ id: string }>;
}

export default function EditOfferPage({ params }: EditOfferPageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const offerId = resolvedParams.id;

  const [apiSearchText, setApiSearchText] = useState("");

  // API hooks
  const { data: offer, isLoading: isLoadingOffer } = useGetOfferByIdQuery(offerId);
  const { data: branchesData, isLoading: isLoadingBranches } = useGetBranchesQuery();
  const { data: productsData, isLoading: isLoadingProducts } = useGetProductsQuery({
    pageSize: 100,
    search: apiSearchText || undefined,
  });
  const { data: categoriesData } = useGetCategoriesQuery();
  const [updateOffer, { isLoading: isUpdating }] = useUpdateOfferMutation();

  // Basic Form State
  const [offerName, setOfferName] = useState("");
  const [description, setDescription] = useState("");
  const [offerType, setOfferType] = useState<OfferType>("PercentageOff");
  const [startDateTime, setStartDateTime] = useState("");
  const [endDateTime, setEndDateTime] = useState("");
  const [isActive, setIsActive] = useState(true);

  // Type specific configurations
  const [discountValue, setDiscountValue] = useState<number | undefined>(undefined);
  const [buyAmount, setBuyAmount] = useState<number | undefined>(undefined);
  const [getAmount, setGetAmount] = useState<number | undefined>(undefined);

  // Targeting Scope
  const [targetScope, setTargetScope] = useState<"all" | "products">("all");
  const [selectedBranchIds, setSelectedBranchIds] = useState<string[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  // BOGO targeting
  const [buyProductIds, setBuyProductIds] = useState<string[]>([]);
  const [getProductIds, setGetProductIds] = useState<string[]>([]);

  // Search Filters for Products
  const [productSearchText, setProductSearchText] = useState("");
  const [buySearchText, setBuySearchText] = useState("");
  const [getSearchText, setGetSearchText] = useState("");

  // Populate state from fetched offer
  useEffect(() => {
    if (offer) {
      setOfferName(offer.offerName);
      setDescription(offer.description || "");
      setOfferType(offer.offerType);
      
      // Slice ISO string to match datetime-local input (yyyy-MM-ddThh:mm)
      if (offer.startDateTime) {
        setStartDateTime(offer.startDateTime.substring(0, 16));
      }
      if (offer.endDateTime) {
        setEndDateTime(offer.endDateTime.substring(0, 16));
      }
      setIsActive(offer.isActive);

      setSelectedBranchIds(offer.offerBranches?.map((ob) => ob.branchId) || []);

      if (offer.offerType === "PercentageOff") {
        const item = offer.offerItems?.[0];
        if (item) {
          setDiscountValue(item.percentageValue);
          if (item.targetType === "Product") {
            setTargetScope("products");
            setSelectedProductIds(offer.offerItems?.map((oi) => oi.productId).filter(Boolean) as string[]);
          } else {
            setTargetScope("all");
          }
        }
      } else if (offer.offerType === "AmountOff") {
        const item = offer.offerItems?.[0];
        if (item) {
          setDiscountValue(item.amountValue);
          if (item.targetType === "Product") {
            setTargetScope("products");
            setSelectedProductIds(offer.offerItems?.map((oi) => oi.productId).filter(Boolean) as string[]);
          } else {
            setTargetScope("all");
          }
        }
      } else if (offer.offerType === "FixedPrice") {
        const item = offer.offerItems?.[0];
        if (item) {
          setDiscountValue(item.fixedPriceValue);
          if (item.targetType === "Product") {
            setTargetScope("products");
            setSelectedProductIds(offer.offerItems?.map((oi) => oi.productId).filter(Boolean) as string[]);
          } else {
            setTargetScope("all");
          }
        }
      } else if (offer.offerType === "BuyXGetY") {
        setBuyAmount(offer.buyAmount);
        setGetAmount(offer.getAmount);
        setBuyProductIds(offer.offerItems?.filter((oi) => oi.itemRole === "BuyItem").map((oi) => oi.productId).filter(Boolean) as string[]);
        setGetProductIds(offer.offerItems?.filter((oi) => oi.itemRole === "RewardItem").map((oi) => oi.productId).filter(Boolean) as string[]);
      }
    }
  }, [offer]);

  // Debounce search inputs
  useEffect(() => {
    const activeSearch = offerType === "BuyXGetY"
      ? (buySearchText || getSearchText || "")
      : (productSearchText || "");

    const timer = setTimeout(() => {
      setApiSearchText(activeSearch);
    }, 450);

    return () => clearTimeout(timer);
  }, [buySearchText, getSearchText, productSearchText, offerType]);

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
      ].filter((group) => group.items.length > 0);
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
      toast.error("End date must be after the start date");
      return;
    }

    let itemsPayload: CreateOfferItemRequest[] = [];

    if (offerType === "PercentageOff") {
      if (discountValue === undefined || discountValue <= 0 || discountValue > 100) {
        toast.error("Please enter a valid discount percentage (1-100)");
        return;
      }

      if (targetScope === "all") {
        itemsPayload.push({
          itemRole: "Target",
          targetType: "Order",
          percentageValue: Number(discountValue),
        });
      } else {
        if (selectedProductIds.length === 0) {
          toast.error("Please select at least one product for this discount");
          return;
        }
        selectedProductIds.forEach((pId) => {
          itemsPayload.push({
            itemRole: "Target",
            targetType: "Product",
            productId: pId,
            percentageValue: Number(discountValue),
          });
        });
      }
    } else if (offerType === "AmountOff") {
      if (discountValue === undefined || discountValue <= 0) {
        toast.error("Please enter a valid flat discount amount");
        return;
      }

      if (targetScope === "all") {
        itemsPayload.push({
          itemRole: "Target",
          targetType: "Order",
          amountValue: Number(discountValue),
        });
      } else {
        if (selectedProductIds.length === 0) {
          toast.error("Please select at least one product for this discount");
          return;
        }
        selectedProductIds.forEach((pId) => {
          itemsPayload.push({
            itemRole: "Target",
            targetType: "Product",
            productId: pId,
            amountValue: Number(discountValue),
          });
        });
      }
    } else if (offerType === "FixedPrice") {
      if (discountValue === undefined || discountValue < 0) {
        toast.error("Please enter a valid fixed price");
        return;
      }

      if (targetScope === "all") {
        itemsPayload.push({
          itemRole: "Target",
          targetType: "Order",
          fixedPriceValue: Number(discountValue),
        });
      } else {
        if (selectedProductIds.length === 0) {
          toast.error("Please select at least one product for this discount");
          return;
        }
        selectedProductIds.forEach((pId) => {
          itemsPayload.push({
            itemRole: "Target",
            targetType: "Product",
            productId: pId,
            fixedPriceValue: Number(discountValue),
          });
        });
      }
    } else if (offerType === "BuyXGetY") {
      if (!buyAmount || buyAmount <= 0) {
        toast.error("Please specify a buy quantity");
        return;
      }
      if (!getAmount || getAmount <= 0) {
        toast.error("Please specify a reward/get quantity");
        return;
      }
      if (buyProductIds.length === 0) {
        toast.error("Please select at least one product to Buy");
        return;
      }
      if (getProductIds.length === 0) {
        toast.error("Please select at least one product to Get");
        return;
      }

      buyProductIds.forEach((pId) => {
        itemsPayload.push({
          itemRole: "BuyItem",
          targetType: "Product",
          productId: pId,
          quantity: Number(buyAmount),
        });
      });

      getProductIds.forEach((pId) => {
        itemsPayload.push({
          itemRole: "RewardItem",
          targetType: "Product",
          productId: pId,
          quantity: Number(getAmount),
        });
      });
    }

    try {
      const payload: CreateOfferRequest = {
        offerName,
        description: description.trim() || undefined,
        offerType,
        startDateTime: new Date(startDateTime).toISOString(),
        endDateTime: new Date(endDateTime).toISOString(),
        isActive,
        buyAmount: offerType === "BuyXGetY" ? Number(buyAmount) : undefined,
        getAmount: offerType === "BuyXGetY" ? Number(getAmount) : undefined,
        branchIds: selectedBranchIds,
        items: itemsPayload,
      };

      await updateOffer({ id: offerId, data: payload }).unwrap();
      toast.success("Offer updated successfully");
      router.push("/admin/offers");
    } catch (err: any) {
      console.error("Update offer error:", err);
      toast.error(err?.data?.message || "Failed to update offer");
    }
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

  const toggleProduct = (productId: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const toggleBuyProduct = (productId: string) => {
    setBuyProductIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const toggleGetProduct = (productId: string) => {
    setGetProductIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  if (isLoadingOffer) {
    return (
      <div className="space-y-6 pb-12">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-80 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
          <Skeleton className="h-[400px] w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader
          title="Edit Offer"
          description="Modify promotional campaign settings and targets"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Configurations */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Select Offer Type</CardTitle>
              <CardDescription>
                Choose the kind of promotion you want to build
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  {
                    type: "PercentageOff" as OfferType,
                    label: "Percentage Discount",
                    desc: "Apply a percentage off (e.g. 20% off) selected items or bills.",
                    icon: Percent,
                    color: "border-purple-500/20 text-purple-600 bg-purple-500/5 dark:bg-purple-500/10",
                    activeColor: "ring-2 ring-purple-500 border-purple-500",
                  },
                  {
                    type: "AmountOff" as OfferType,
                    label: "Flat Discount",
                    desc: "Apply a fixed dollar amount off (e.g. $5.00 off) items or bills.",
                    icon: Tag,
                    color: "border-blue-500/20 text-blue-600 bg-blue-500/5 dark:bg-blue-500/10",
                    activeColor: "ring-2 ring-blue-500 border-blue-500",
                  },
                  {
                    type: "FixedPrice" as OfferType,
                    label: "Fixed Price Override",
                    desc: "Set products to a fixed price override (e.g. any coffee for $2.50).",
                    icon: Sparkles,
                    color: "border-emerald-500/20 text-emerald-600 bg-emerald-500/5 dark:bg-emerald-500/10",
                    activeColor: "ring-2 ring-emerald-500 border-emerald-500",
                  },
                  {
                    type: "BuyXGetY" as OfferType,
                    label: "Buy X Get Y (BOGO)",
                    desc: "Quantity-based rewards (e.g. buy 2 coffees and get 1 free cake).",
                    icon: Layers,
                    color: "border-amber-500/20 text-amber-600 bg-amber-500/5 dark:bg-amber-500/10",
                    activeColor: "ring-2 ring-amber-500 border-amber-500",
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = offerType === item.type;
                  return (
                    <button
                      key={item.type}
                      type="button"
                      disabled // Offer types cannot be changed once created to avoid corrupting analytics
                      onClick={() => {
                        setOfferType(item.type);
                        setDiscountValue(undefined);
                        setBuyAmount(undefined);
                        setGetAmount(undefined);
                        if (item.type === "BuyXGetY") {
                          setTargetScope("products");
                        }
                      }}
                      className={`text-left p-4 rounded-xl border transition-all duration-200 group opacity-70 cursor-not-allowed ${
                        isSelected ? item.activeColor : "border-border"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2.5 rounded-lg border ${item.color}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="space-y-1">
                          <p className="font-semibold text-body flex items-center gap-1.5">
                            {item.label}
                            {isSelected && (
                              <Check className="h-3.5 w-3.5 text-foreground bg-primary text-primary-foreground rounded-full p-0.5" />
                            )}
                          </p>
                          <p className="text-caption text-muted-foreground leading-normal">
                            {item.desc}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Offer Information</CardTitle>
              <CardDescription>
                Define the name, description, and validity dates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="offerName">Offer Name *</Label>
                  <Input
                    id="offerName"
                    placeholder="e.g., Summer Coffee Carnival 20%"
                    value={offerName}
                    onChange={(e) => setOfferName(e.target.value)}
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Provide a description..."
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="startDateTime" className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    Start Date & Time *
                  </Label>
                  <Input
                    id="startDateTime"
                    type="datetime-local"
                    value={startDateTime}
                    onChange={(e) => setStartDateTime(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDateTime" className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    End Date & Time *
                  </Label>
                  <Input
                    id="endDateTime"
                    type="datetime-local"
                    value={endDateTime}
                    onChange={(e) => setEndDateTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between border-t pt-4">
                <div className="space-y-0.5">
                  <Label>Active Immediately</Label>
                  <p className="text-caption text-muted-foreground">
                    If enabled, the offer will be active immediately once start date is reached.
                  </p>
                </div>
                <Switch checked={isActive} onCheckedChange={setIsActive} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Offer Configuration</CardTitle>
              <CardDescription>
                Configure the discount calculations and rules
              </CardDescription>
            </CardHeader>
            <CardContent>
              {offerType === "PercentageOff" && (
                <div className="space-y-2 max-w-sm">
                  <Label htmlFor="pctValue">Discount Percentage (%) *</Label>
                  <div className="relative">
                    <Input
                      id="pctValue"
                      type="number"
                      min={1}
                      max={100}
                      placeholder="e.g. 20"
                      value={discountValue ?? ""}
                      onChange={(e) => setDiscountValue(Number(e.target.value) || undefined)}
                    />
                    <span className="absolute right-3 top-2.5 text-muted-foreground">%</span>
                  </div>
                </div>
              )}

              {offerType === "AmountOff" && (
                <div className="space-y-2 max-w-sm">
                  <Label htmlFor="amtValue">Discount Amount ($) *</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                    <Input
                      id="amtValue"
                      type="number"
                      step="0.01"
                      min={0.01}
                      className="pl-7"
                      placeholder="e.g. 5.00"
                      value={discountValue ?? ""}
                      onChange={(e) => setDiscountValue(Number(e.target.value) || undefined)}
                    />
                  </div>
                </div>
              )}

              {offerType === "FixedPrice" && (
                <div className="space-y-2 max-w-sm">
                  <Label htmlFor="fixedValue">Fixed Special Price ($) *</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                    <Input
                      id="fixedValue"
                      type="number"
                      step="0.01"
                      min={0.0}
                      className="pl-7"
                      placeholder="e.g. 2.50"
                      value={discountValue ?? ""}
                      onChange={(e) => setDiscountValue(Number(e.target.value) || undefined)}
                    />
                  </div>
                </div>
              )}

              {offerType === "BuyXGetY" && (
                <div className="grid gap-4 sm:grid-cols-2 max-w-lg">
                  <div className="space-y-2">
                    <Label htmlFor="buyAmount">Required Buy Quantity *</Label>
                    <Input
                      id="buyAmount"
                      type="number"
                      min={1}
                      placeholder="e.g. 2"
                      value={buyAmount ?? ""}
                      onChange={(e) => setBuyAmount(parseInt(e.target.value) || undefined)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="getAmount">Rewarded Get Quantity *</Label>
                    <Input
                      id="getAmount"
                      type="number"
                      min={1}
                      placeholder="e.g. 1"
                      value={getAmount ?? ""}
                      onChange={(e) => setGetAmount(parseInt(e.target.value) || undefined)}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {offerType === "BuyXGetY" && (
            <div className="grid gap-6 sm:grid-cols-2">
              <Card className="flex flex-col">
                <CardHeader>
                  <CardTitle className="text-body flex items-center justify-between">
                    <span>1. Products to BUY *</span>
                    <Badge variant="secondary">{buyProductIds.length} selected</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col min-h-[350px]">
                  <div className="relative mb-3">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search buy products..."
                      className="pl-8 h-9"
                      value={buySearchText}
                      onChange={(e) => setBuySearchText(e.target.value)}
                    />
                  </div>
                  <div className="flex-1 overflow-y-auto max-h-72 border rounded-lg p-2 space-y-3 bg-muted/20">
                    {isLoadingProducts ? (
                      <p className="text-caption text-muted-foreground p-2">Loading products...</p>
                    ) : getGroupedProducts(buySearchText).length === 0 ? (
                      <p className="text-caption text-muted-foreground p-2">No matching products found.</p>
                    ) : (
                      getGroupedProducts(buySearchText).map((cat) => (
                        <div key={cat.productCategoryId} className="space-y-1">
                          <p className="text-detail font-bold uppercase text-muted-foreground tracking-wider px-1">
                            {cat.categoryName}
                          </p>
                          <div className="space-y-0.5">
                            {cat.items.map((prod) => {
                              const selected = buyProductIds.includes(prod.productId);
                              return (
                                <button
                                  key={prod.productId}
                                  type="button"
                                  onClick={() => toggleBuyProduct(prod.productId)}
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

              <Card className="flex flex-col">
                <CardHeader>
                  <CardTitle className="text-body flex items-center justify-between">
                    <span>2. Products to GET *</span>
                    <Badge variant="secondary">{getProductIds.length} selected</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col min-h-[350px]">
                  <div className="relative mb-3">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search get products..."
                      className="pl-8 h-9"
                      value={getSearchText}
                      onChange={(e) => setGetSearchText(e.target.value)}
                    />
                  </div>
                  <div className="flex-1 overflow-y-auto max-h-72 border rounded-lg p-2 space-y-3 bg-muted/20">
                    {isLoadingProducts ? (
                      <p className="text-caption text-muted-foreground p-2">Loading products...</p>
                    ) : getGroupedProducts(getSearchText).length === 0 ? (
                      <p className="text-caption text-muted-foreground p-2">No matching products found.</p>
                    ) : (
                      getGroupedProducts(getSearchText).map((cat) => (
                        <div key={cat.productCategoryId} className="space-y-1">
                          <p className="text-detail font-bold uppercase text-muted-foreground tracking-wider px-1">
                            {cat.categoryName}
                          </p>
                          <div className="space-y-0.5">
                            {cat.items.map((prod) => {
                              const selected = getProductIds.includes(prod.productId);
                              return (
                                <button
                                  key={prod.productId}
                                  type="button"
                                  onClick={() => toggleGetProduct(prod.productId)}
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
            </div>
          )}
        </div>

        {/* Targeting & Eligibility */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-h3 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-muted-foreground" />
                Target Branches
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingBranches ? (
                <p className="text-body text-muted-foreground">Loading branches...</p>
              ) : branches.length === 0 ? (
                <p className="text-body text-muted-foreground">No branches found.</p>
              ) : (
                <>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={selectAllBranches}
                      className="text-caption h-7 px-2"
                    >
                      Select All
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={deselectAllBranches}
                      className="text-caption h-7 px-2"
                    >
                      Clear All
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {branches.map((b) => {
                      const selected = selectedBranchIds.includes(b.branchId);
                      return (
                        <button
                          key={b.branchId}
                          type="button"
                          onClick={() => toggleBranch(b.branchId)}
                          className={`px-3 py-1.5 rounded-lg text-caption border transition-colors flex items-center gap-1.5 font-medium ${
                            selected
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-background text-foreground border-border hover:bg-muted"
                          }`}
                        >
                          {selected && <Check className="h-3 w-3" />}
                          {b.branchName.replace("Caffissimo", "").trim()}
                        </button>
                      );
                    })}
                  </div>

                  {selectedBranchIds.length === 0 && (
                    <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 text-detail p-2.5 rounded-lg text-primary flex items-start gap-2">
                      <Compass className="h-4 w-4 shrink-0 mt-0.5" />
                      <p className="leading-snug">
                        <strong>Apply Globally:</strong> No branches selected. This offer will apply globally to all current and future branches.
                      </p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {offerType !== "BuyXGetY" && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-h3 flex items-center gap-2">
                  <Tag className="h-5 w-5 text-muted-foreground" />
                  Target Products
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2 p-1 border rounded-lg bg-muted/40">
                  <button
                    type="button"
                    onClick={() => {
                      setTargetScope("all");
                      setSelectedProductIds([]);
                    }}
                    className={`py-1.5 text-caption font-semibold rounded-md transition-all ${
                      targetScope === "all"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Whole Order
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetScope("products")}
                    className={`py-1.5 text-caption font-semibold rounded-md transition-all ${
                      targetScope === "products"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Specific Products
                  </button>
                </div>

                {targetScope === "all" ? (
                  <div className="bg-blue-500/5 border border-blue-500/20 text-caption p-3 rounded-lg text-blue-700 dark:text-blue-300">
                    <p className="leading-relaxed">
                      This offer will apply directly to the **entire bill (order-level)**.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search products..."
                        className="pl-8 h-9 text-caption"
                        value={productSearchText}
                        onChange={(e) => setProductSearchText(e.target.value)}
                      />
                    </div>

                    <div className="overflow-y-auto max-h-80 border rounded-lg p-2 space-y-3 bg-muted/10">
                      {isLoadingProducts ? (
                        <p className="text-caption text-muted-foreground p-1">Loading products...</p>
                      ) : getGroupedProducts(productSearchText).length === 0 ? (
                        <p className="text-caption text-muted-foreground p-1">No matching products found.</p>
                      ) : (
                        getGroupedProducts(productSearchText).map((cat) => (
                          <div key={cat.productCategoryId} className="space-y-1">
                            <p className="text-detail font-bold uppercase text-muted-foreground tracking-wider px-1">
                              {cat.categoryName}
                            </p>
                            <div className="space-y-0.5">
                              {cat.items.map((prod) => {
                                const selected = selectedProductIds.includes(prod.productId);
                                return (
                                  <button
                                    key={prod.productId}
                                    type="button"
                                    onClick={() => toggleProduct(prod.productId)}
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
                    {selectedProductIds.length > 0 && (
                      <p className="text-caption text-muted-foreground font-semibold text-right">
                        {selectedProductIds.length} product(s) selected
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <EditBar
        isVisible={true}
        onSave={handleUpdate}
        onCancel={() => router.back()}
        label="Editing offer"
        saveLabel="Save Changes"
        cancelLabel="Cancel"
        isSaving={isUpdating}
      />
    </div>
  );
}
