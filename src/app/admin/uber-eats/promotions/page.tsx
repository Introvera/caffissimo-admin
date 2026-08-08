"use client";

import { useState, useMemo } from "react";
import { useAppSelector } from "@/stores/store";
import { useGetBranchesQuery } from "@/stores/api/branchApi";
import {
  useGetUberPromotionsQuery,
  useCreateUberPromotionMutation,
  useDeleteUberPromotionMutation,
  useGetBranchProductsForUberQuery,
} from "@/stores/api/uberApi";
import { canAccessAllBranches } from "@/lib/rbac";
import type { UserRole, CreateUberPromotionRequest, UberPromotionResponse, MenuItemDiscountInput } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tag, Plus, Trash2, RefreshCw, Percent, DollarSign, Truck, Gift, ShoppingBag } from "lucide-react";
import { toast } from "sonner";

const PROMO_TYPES = [
  { value: "PERCENT_OFF", label: "Percentage Off", icon: Percent },
  { value: "FLAT_OFF", label: "Flat Discount", icon: DollarSign },
  { value: "FREE_DELIVERY", label: "Free Delivery", icon: Truck },
  { value: "BOGO", label: "Buy One Get One", icon: Tag },
  { value: "FREE_ITEM", label: "Free Item (min spend)", icon: Gift },
  { value: "MENU_ITEM_DISCOUNT", label: "Menu Item Discount", icon: ShoppingBag },
];

const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

// Item-based offers need the menu item external ids (sent to Uber as item_external_id / free_item_id).
const ITEM_TYPES = new Set(["BOGO", "FREE_ITEM", "MENU_ITEM_DISCOUNT"]);

function promoTypeLabel(type: string): string {
  const t = type.toUpperCase().replace(/_/g, "");
  const map: Record<string, string> = {
    PERCENTOFF: "Percentage Off",
    FLATOFF: "Flat Discount",
    FREEDELIVERY: "Free Delivery",
    BOGO: "Buy One Get One",
    FREEITEMMINBASKET: "Free Item",
    MENUITEMDISCOUNT: "Menu Item Discount",
  };
  return map[t] ?? type;
}

function formatMoney(amount: number | null | undefined, currency = "USD"): string {
  if (amount == null) return "-";
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

type BudgetMode = "unlimited" | "capped" | "periodic";

interface FormState {
  promoType: string;
  title: string;
  discountPercentage?: number;
  discountAmount?: number;
  maxDiscountAmount?: number;
  minOrderAmount?: number;
  startDate?: string;
  endDate?: string;
  userGroup: string;
  budgetMode: BudgetMode;
  budgetAmount?: number;
  // item selections
  targetItems: string[];
  freeItem: string;
  menuRows: MenuItemDiscountInput[];
  // customization
  happyHour: boolean;
  uberOne: boolean;
  scheduleDays: string[];
  scheduleStart: string; // "HH:MM"
  scheduleEnd: string;
}

const emptyForm: FormState = {
  promoType: "PERCENT_OFF",
  title: "",
  userGroup: "ALL_CUSTOMERS",
  budgetMode: "unlimited",
  targetItems: [],
  freeItem: "",
  menuRows: [],
  happyHour: false,
  uberOne: false,
  scheduleDays: [],
  scheduleStart: "",
  scheduleEnd: "",
};

export default function UberPromotionsPage() {
  const currentRole = useAppSelector((state) => state.auth.user?.role) as UserRole | undefined;
  const assignedBranchId = useAppSelector((state) => state.auth.user?.branchId) || null;
  const canUseAllBranches = currentRole ? canAccessAllBranches(currentRole) : false;
  const { data: branchesData } = useGetBranchesQuery(undefined);
  const branchOptions = useMemo(() => branchesData?.items ?? [], [branchesData?.items]);

  const [selectedBranchId, setSelectedBranchId] = useState("");
  const branchId = selectedBranchId || assignedBranchId || "";

  const { data, isLoading, isFetching, refetch, error: fetchError } = useGetUberPromotionsQuery(
    { branchId },
    { skip: !branchId }
  );
  const apiNotAvailable = !!(fetchError && "status" in fetchError && (fetchError.status === 409 || fetchError.status === 404));
  const [createPromotion, { isLoading: isCreating }] = useCreateUberPromotionMutation();
  const [deletePromotion] = useDeleteUberPromotionMutation();

  const [showCreate, setShowCreate] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const set = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));

  const needsItems = ITEM_TYPES.has(form.promoType);
  const { data: productsData } = useGetBranchProductsForUberQuery(
    { branchId, pageSize: 200 } as any,
    { skip: !branchId || !showCreate || !needsItems }
  );
  const products = productsData?.items ?? [];

  const promotions = data?.promotions ?? [];

  const buildRequest = (): CreateUberPromotionRequest | string => {
    const req: CreateUberPromotionRequest = {
      promoType: form.promoType,
      title: form.title || undefined,
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined,
      userGroup: form.userGroup || undefined,
      minOrderAmount: form.minOrderAmount,
    };

    switch (form.promoType) {
      case "PERCENT_OFF":
        if (!form.discountPercentage) return "Enter a discount percentage.";
        req.discountPercentage = form.discountPercentage;
        req.maxDiscountAmount = form.maxDiscountAmount;
        break;
      case "FLAT_OFF":
        if (!form.discountAmount) return "Enter a discount amount.";
        req.discountAmount = form.discountAmount;
        break;
      case "FREE_DELIVERY":
        break;
      case "BOGO":
        if (form.targetItems.length === 0) return "Select at least one item for BOGO.";
        req.targetItemExternalIds = form.targetItems;
        break;
      case "FREE_ITEM":
        if (!form.freeItem) return "Select the free item.";
        req.freeItemExternalId = form.freeItem;
        break;
      case "MENU_ITEM_DISCOUNT":
        if (form.menuRows.length === 0) return "Add at least one item discount.";
        req.menuItemDiscounts = form.menuRows.filter((r) => r.itemExternalId && r.percentValue > 0);
        if (req.menuItemDiscounts.length === 0) return "Add at least one valid item discount.";
        break;
    }

    // budget
    if (form.budgetMode === "unlimited") {
      req.unlimitedBudget = true;
    } else if (form.budgetMode === "capped") {
      req.unlimitedBudget = false;
      req.budgetAmount = form.budgetAmount;
    } else {
      req.budgetPeriod = "WEEKLY";
      req.periodicBudgetAmount = form.budgetAmount;
    }

    // customization
    if (form.happyHour && form.promoType === "PERCENT_OFF") req.marketingExperienceType = "HAPPY_HOUR";
    if (form.uberOne) req.engagementCampaignType = "UBER_ONE_OFFERS";
    if (form.scheduleDays.length > 0 && form.scheduleStart && form.scheduleEnd) {
      const [sh, sm] = form.scheduleStart.split(":").map(Number);
      const [eh, em] = form.scheduleEnd.split(":").map(Number);
      req.customSchedule = [
        {
          hours: [{ startHour: sh, startMinute: sm || 0, endHour: eh, endMinute: em || 0 }],
          daysOfWeek: form.scheduleDays,
        },
      ];
    }

    return req;
  };

  const handleCreate = async () => {
    if (!branchId) return;
    const req = buildRequest();
    if (typeof req === "string") {
      toast.error(req);
      return;
    }
    try {
      await createPromotion({ branchId, data: req }).unwrap();
      toast.success("Promotion created on Uber Eats");
      setShowCreate(false);
      setShowAdvanced(false);
      setForm(emptyForm);
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to create promotion");
    }
  };

  const handleDelete = async (promotionId: string) => {
    if (!branchId || !promotionId) return;
    if (!confirm("Revoke this promotion on Uber Eats?")) return;
    try {
      await deletePromotion({ branchId, promotionId }).unwrap();
      toast.success("Promotion revoked");
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to revoke promotion");
    }
  };

  const toggleArr = (arr: string[], val: string) =>
    arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Uber Eats Promotions</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create and manage promotions on your Uber Eats store
          </p>
        </div>
        <div className="flex gap-2 items-center">
          {canUseAllBranches && branchOptions.length > 0 && (
            <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select branch" />
              </SelectTrigger>
              <SelectContent>
                {branchOptions.map((b: any) => (
                  <SelectItem key={b.branchId} value={b.branchId}>
                    {b.branchName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching || !branchId}>
            <RefreshCw className={`h-4 w-4 mr-1 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setShowCreate(true)} disabled={!branchId || apiNotAvailable}>
            <Plus className="h-4 w-4 mr-1" />
            Create Promotion
          </Button>
        </div>
      </div>

      {!branchId ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Tag className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="font-medium">Select a branch</p>
            <p className="text-sm text-muted-foreground mt-1">
              Choose a branch from the dropdown above to manage its Uber Eats promotions
            </p>
          </CardContent>
        </Card>
      ) : apiNotAvailable ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Tag className="h-10 w-10 mx-auto text-yellow-500 mb-3" />
            <p className="font-medium">Promotions API Not Available</p>
            <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
              The Uber Eats Promotions API requires separate approval from Uber.
              Contact your Uber partner manager to enable promotions access for your account.
            </p>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : promotions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Tag className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="font-medium">No promotions</p>
            <p className="text-sm text-muted-foreground mt-1">
              Create a promotion to attract more customers on Uber Eats
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {promotions.map((promo, idx) => (
            <PromotionCard
              key={promo.promotionId ?? idx}
              promo={promo}
              onDelete={() => promo.promotionId && handleDelete(promo.promotionId)}
            />
          ))}
        </div>
      )}

      {/* Create Promotion Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Uber Promotion</DialogTitle>
            <DialogDescription>
              This will create a promotion directly on your Uber Eats store.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Promotion Type</Label>
              <Select value={form.promoType} onValueChange={(v) => set({ promoType: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROMO_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Title (optional, internal)</Label>
              <Input
                value={form.title}
                onChange={(e) => set({ title: e.target.value })}
                placeholder="e.g. Weekend Special"
              />
            </div>

            {/* Per-type fields */}
            {form.promoType === "PERCENT_OFF" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Discount %</Label>
                  <Input type="number" min={1} max={100} value={form.discountPercentage ?? ""}
                    onChange={(e) => set({ discountPercentage: e.target.value ? Number(e.target.value) : undefined })}
                    placeholder="20" />
                </div>
                <div>
                  <Label>Max Discount (optional)</Label>
                  <Input type="number" min={0} step={0.01} value={form.maxDiscountAmount ?? ""}
                    onChange={(e) => set({ maxDiscountAmount: e.target.value ? Number(e.target.value) : undefined })}
                    placeholder="e.g. 5.00" />
                </div>
              </div>
            )}

            {form.promoType === "FLAT_OFF" && (
              <div>
                <Label>Discount Amount</Label>
                <Input type="number" min={0} step={0.01} value={form.discountAmount ?? ""}
                  onChange={(e) => set({ discountAmount: e.target.value ? Number(e.target.value) : undefined })}
                  placeholder="e.g. 5.00" />
              </div>
            )}

            {form.promoType === "BOGO" && (
              <div>
                <Label>Eligible items (Buy one / get one)</Label>
                <ItemCheckboxList
                  products={products}
                  selected={form.targetItems}
                  onToggle={(id) => set({ targetItems: toggleArr(form.targetItems, id) })}
                />
              </div>
            )}

            {form.promoType === "FREE_ITEM" && (
              <div>
                <Label>Free item</Label>
                <Select value={form.freeItem} onValueChange={(v) => set({ freeItem: v })}>
                  <SelectTrigger><SelectValue placeholder="Select item" /></SelectTrigger>
                  <SelectContent>
                    {products.map((p: any) => (
                      <SelectItem key={p.branchProductId} value={p.branchProductId}>{p.productName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {form.promoType === "MENU_ITEM_DISCOUNT" && (
              <div className="space-y-2">
                <Label>Item discounts (% off per item)</Label>
                {form.menuRows.map((row, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <Select
                      value={row.itemExternalId}
                      onValueChange={(v) => {
                        const rows = [...form.menuRows]; rows[i] = { ...rows[i], itemExternalId: v }; set({ menuRows: rows });
                      }}
                    >
                      <SelectTrigger className="flex-1"><SelectValue placeholder="Item" /></SelectTrigger>
                      <SelectContent>
                        {products.map((p: any) => (
                          <SelectItem key={p.branchProductId} value={p.branchProductId}>{p.productName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input type="number" min={1} max={100} className="w-24" placeholder="% off"
                      value={row.percentValue || ""}
                      onChange={(e) => {
                        const rows = [...form.menuRows]; rows[i] = { ...rows[i], percentValue: Number(e.target.value) }; set({ menuRows: rows });
                      }} />
                    <Button variant="ghost" size="icon" onClick={() => set({ menuRows: form.menuRows.filter((_, j) => j !== i) })}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => set({ menuRows: [...form.menuRows, { itemExternalId: "", percentValue: 0 }] })}>
                  <Plus className="h-4 w-4 mr-1" /> Add item
                </Button>
              </div>
            )}

            {form.promoType !== "FREE_DELIVERY" && form.promoType !== "MENU_ITEM_DISCOUNT" && (
              <div>
                <Label>Minimum Order Amount (optional)</Label>
                <Input type="number" min={0} step={0.01} value={form.minOrderAmount ?? ""}
                  onChange={(e) => set({ minOrderAmount: e.target.value ? Number(e.target.value) : undefined })}
                  placeholder="e.g. 15.00" />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Start Date</Label>
                <Input type="datetime-local" value={form.startDate ?? ""}
                  onChange={(e) => set({ startDate: e.target.value || undefined })} />
              </div>
              <div>
                <Label>End Date</Label>
                <Input type="datetime-local" value={form.endDate ?? ""}
                  onChange={(e) => set({ endDate: e.target.value || undefined })} />
              </div>
            </div>

            {/* Advanced */}
            <button type="button" className="text-sm text-primary underline hover:text-primary/80 transition-colors" onClick={() => setShowAdvanced((s) => !s)}>
              {showAdvanced ? "Hide advanced options" : "Advanced options (budget, audience, schedule)"}
            </button>

            {showAdvanced && (
              <div className="space-y-4 border-t pt-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Audience</Label>
                    <Select value={form.userGroup} onValueChange={(v) => set({ userGroup: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL_CUSTOMERS">All customers</SelectItem>
                        <SelectItem value="FIRST_TIME_CUSTOMER">First-time customers</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Budget</Label>
                    <Select value={form.budgetMode} onValueChange={(v) => set({ budgetMode: v as BudgetMode })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unlimited">Unlimited</SelectItem>
                        <SelectItem value="capped">Capped (total)</SelectItem>
                        <SelectItem value="periodic">Weekly cap</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {form.budgetMode !== "unlimited" && (
                  <div>
                    <Label>{form.budgetMode === "periodic" ? "Weekly budget amount" : "Total budget amount"}</Label>
                    <Input type="number" min={0} step={0.01} value={form.budgetAmount ?? ""}
                      onChange={(e) => set({ budgetAmount: e.target.value ? Number(e.target.value) : undefined })}
                      placeholder="e.g. 100.00" />
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  {form.promoType === "PERCENT_OFF" && (
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={form.happyHour} onChange={(e) => set({ happyHour: e.target.checked })} />
                      Happy Hour experience (2–5 PM, percent-off only)
                    </label>
                  )}
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={form.uberOne} onChange={(e) => set({ uberOne: e.target.checked })} />
                    Uber One members only
                  </label>
                </div>

                <div>
                  <Label>Custom schedule (optional)</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {DAYS.map((d) => (
                      <button key={d} type="button"
                        onClick={() => set({ scheduleDays: toggleArr(form.scheduleDays, d) })}
                        className={`px-2 py-1 rounded text-xs border transition-colors ${form.scheduleDays.includes(d) ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-background hover:bg-muted"}`}>
                        {d.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <div>
                      <Label className="text-xs">From</Label>
                      <Input type="time" value={form.scheduleStart} onChange={(e) => set({ scheduleStart: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-xs">To</Label>
                      <Input type="time" value={form.scheduleEnd} onChange={(e) => set({ scheduleEnd: e.target.value })} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={isCreating}>
              {isCreating ? "Creating..." : "Create Promotion"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ItemCheckboxList({
  products,
  selected,
  onToggle,
}: {
  products: any[];
  selected: string[];
  onToggle: (id: string) => void;
}) {
  if (products.length === 0)
    return <p className="text-xs text-muted-foreground">No branch products found.</p>;
  return (
    <div className="max-h-40 overflow-y-auto border rounded p-2 space-y-1 mt-1">
      {products.map((p) => (
        <label key={p.branchProductId} className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={selected.includes(p.branchProductId)}
            onChange={() => onToggle(p.branchProductId)}
          />
          {p.productName}
        </label>
      ))}
    </div>
  );
}

function PromotionCard({
  promo,
  onDelete,
}: {
  promo: UberPromotionResponse;
  onDelete: () => void;
}) {
  const pct = promo.percentValue ?? promo.discountPercentage;
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-sm flex items-center gap-2">
              <Badge>{promoTypeLabel(promo.promoType)}</Badge>
              {promo.status && (
                <Badge variant={promo.status.toUpperCase() === "ACTIVE" ? "default" : "secondary"}>
                  {promo.status}
                </Badge>
              )}
            </CardTitle>
            {promo.title && <CardDescription>{promo.title}</CardDescription>}
          </div>
          <Button variant="ghost" size="icon" onClick={onDelete} className="h-8 w-8">
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {pct != null && pct > 0 && (
          <Row label="Discount" value={`${pct}% off`} />
        )}
        {promo.discountAmount != null && promo.discountAmount > 0 && (
          <Row label="Discount" value={formatMoney(promo.discountAmount)} />
        )}
        {promo.maxDiscountAmount != null && promo.maxDiscountAmount > 0 && (
          <Row label="Max discount" value={formatMoney(promo.maxDiscountAmount)} />
        )}
        {promo.minOrderAmount != null && promo.minOrderAmount > 0 && (
          <Row label="Min Order" value={formatMoney(promo.minOrderAmount)} />
        )}
        {promo.freeItemIds && promo.freeItemIds.length > 0 && (
          <Row label="Free items" value={String(promo.freeItemIds.length)} />
        )}
        {promo.targetItemIds && promo.targetItemIds.length > 0 && (
          <Row label="BOGO items" value={String(promo.targetItemIds.length)} />
        )}
        {promo.startDate && <Row label="Start" value={new Date(promo.startDate).toLocaleDateString()} />}
        {promo.endDate && <Row label="End" value={new Date(promo.endDate).toLocaleDateString()} />}
        {promo.promotionId && (
          <div className="pt-1 border-t">
            <span className="font-mono text-xs text-muted-foreground truncate block">
              ID: {promo.promotionId}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
