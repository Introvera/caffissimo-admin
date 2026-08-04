"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  ExternalLink,
  Eye,
  EyeOff,
  Loader2,
  Globe,
  Phone,
  Mail,
  FileText,
  Plus,
  X,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { useAppSelector } from "@/stores/store";
import {
  useGetBranchByIdQuery,
  useUpdateBranchMutation,
} from "@/stores/api/branchApi";
import { canManageBranch, isSuperAdmin } from "@/lib/rbac";
import { UserRole, Branch, BranchPurpose, PlatformEnvironment } from "@/types";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductsTab } from "./tabs/products-tab";
import { UberMenusTab } from "./tabs/uber-menus-tab";
import { LocationInput } from "@/components/ui/location-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface BranchDetailPageProps {
  params: Promise<{ id: string }>;
}

const DAYS = [
  { index: 1, label: "Monday" },
  { index: 2, label: "Tuesday" },
  { index: 3, label: "Wednesday" },
  { index: 4, label: "Thursday" },
  { index: 5, label: "Friday" },
  { index: 6, label: "Saturday" },
  { index: 0, label: "Sunday" },
];

export default function BranchDetailPage({ params }: BranchDetailPageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const uiRole = useAppSelector((state) => state.ui.currentRole);
  const authRole = useAppSelector((state) => state.auth.user?.role);
  const currentRole = uiRole || authRole || UserRole.Cashier;

  const { data: branch, isLoading } = useGetBranchByIdQuery(resolvedParams.id);
  const canEdit = canManageBranch(currentRole);
  const isSuper = isSuperAdmin(currentRole);

  const [updateBranch, { isLoading: isUpdating }] = useUpdateBranchMutation();
  const [formData, setFormData] = useState<Partial<Branch>>({});
  const [showUberApiKey, setShowUberApiKey] = useState(false);
  const [showDoorApiKey, setShowDoorApiKey] = useState(false);
  const [newHighlight, setNewHighlight] = useState("");
  const [locationInputType, setLocationInputType] = useState<"Address" | "Coordinates">("Address");

  // Detailed Uber Eats Connection States
  const [uberUrl, setUberUrl] = useState("");
  const [uberExternalStoreId, setUberExternalStoreId] = useState("");
  const [uberClientId, setUberClientId] = useState("");
  const [uberClientSecret, setUberClientSecret] = useState("");
  const [uberWebhookSecret, setUberWebhookSecret] = useState("");
  const [uberWebhookConnectionKey, setUberWebhookConnectionKey] = useState("");
  const [uberEnvironment, setUberEnvironment] = useState<number>(0); // 0 = Sandbox, 1 = Production
  const [uberAutoAccept, setUberAutoAccept] = useState(true);
  const [showUberAdvanced, setShowUberAdvanced] = useState(false);

  // Detailed DoorDash Connection States
  const [ddUrl, setDdUrl] = useState("");
  const [ddExternalStoreId, setDdExternalStoreId] = useState("");
  const [ddClientId, setDdClientId] = useState("");
  const [ddClientSecret, setDdClientSecret] = useState("");
  const [ddWebhookSecret, setDdWebhookSecret] = useState("");
  const [ddWebhookConnectionKey, setDdWebhookConnectionKey] = useState("");
  const [ddEnvironment, setDdEnvironment] = useState<number>(0); // 0 = Sandbox, 1 = Production
  const [ddAutoAccept, setDdAutoAccept] = useState(true);
  const [showDdAdvanced, setShowDdAdvanced] = useState(false);

  // Update local form data when branch data loads
  useEffect(() => {
    if (branch) {
      setFormData(branch);

      const uberConn = branch.platformConnections?.find(
        (pc) => pc.platformCode === "UberEats" || (pc.platformCode as any) === 0,
      );
      if (uberConn) {
        setUberUrl(uberConn.storeUrl || "");
        setUberExternalStoreId(uberConn.externalStoreId || "");
        setUberClientId(uberConn.clientId || "");
        setUberClientSecret(uberConn.isConfigured ? "••••••••" : "");
        setUberWebhookSecret(uberConn.webhookSecret || "");
        setUberWebhookConnectionKey(uberConn.webhookConnectionKey || "");
        setUberEnvironment(
          uberConn.environment === PlatformEnvironment.Production ||
            (uberConn.environment as any) === "Production" ||
            (uberConn.environment as any) === 1
            ? 1
            : 0,
        );
        setUberAutoAccept(uberConn.autoAcceptOrders ?? true);
      } else {
        setUberUrl(branch.uberEatsUrl || "");
      }

      const ddConn = branch.platformConnections?.find(
        (pc) => pc.platformCode === "DoorDash" || (pc.platformCode as any) === 1,
      );
      if (ddConn) {
        setDdUrl(ddConn.storeUrl || "");
        setDdExternalStoreId(ddConn.externalStoreId || "");
        setDdClientId(ddConn.clientId || "");
        setDdClientSecret(ddConn.isConfigured ? "••••••••" : "");
        setDdWebhookSecret(ddConn.webhookSecret || "");
        setDdWebhookConnectionKey(ddConn.webhookConnectionKey || "");
        setDdEnvironment(
          ddConn.environment === PlatformEnvironment.Production ||
            (ddConn.environment as any) === "Production" ||
            (ddConn.environment as any) === 1
            ? 1
            : 0,
        );
        setDdAutoAccept(ddConn.autoAcceptOrders ?? true);
      } else {
        setDdUrl(branch.doorDashUrl || "");
      }
    }
  }, [branch]);

  const handleSave = async () => {
    try {
      // Map listing details if ListedForSale
      const payload: any = { ...formData };
      if (
        payload.purpose === BranchPurpose.ListedForSale &&
        !payload.saleListing
      ) {
        payload.saleListing = {
          branchSaleListingId: "",
          branchId: resolvedParams.id,
          listingDescription: "",
          includedPackageDescription: "",
          highlights: [],
        };
      }

      if (payload.purpose === BranchPurpose.Operational) {
        payload.platformConnections = [
          {
            platformCode: 0,
            storeUrl: uberUrl.trim() || undefined,
            externalStoreId: uberExternalStoreId.trim() || undefined,
            clientId: uberClientId.trim() || undefined,
            clientSecret:
              uberClientSecret === "••••••••"
                ? undefined
                : uberClientSecret.trim() || undefined,
            webhookSecret: uberWebhookSecret.trim() || undefined,
            webhookConnectionKey: uberWebhookConnectionKey.trim() || undefined,
            environment: uberEnvironment,
            autoAcceptOrders: uberAutoAccept,
          },
          {
            platformCode: 1,
            storeUrl: ddUrl.trim() || undefined,
            externalStoreId: ddExternalStoreId.trim() || undefined,
            clientId: ddClientId.trim() || undefined,
            clientSecret:
              ddClientSecret === "••••••••"
                ? undefined
                : ddClientSecret.trim() || undefined,
            webhookSecret: ddWebhookSecret.trim() || undefined,
            webhookConnectionKey: ddWebhookConnectionKey.trim() || undefined,
            environment: ddEnvironment,
            autoAcceptOrders: ddAutoAccept,
          },
        ].filter(
          (conn) => conn.storeUrl || conn.clientId || conn.externalStoreId,
        );

        // Map legacy flat properties for fallback support
        payload.uberEatsUrl = uberUrl.trim() || undefined;
        payload.doorDashUrl = ddUrl.trim() || undefined;
        if (uberClientSecret && uberClientSecret !== "••••••••") {
          payload.uberEatsApiKey = uberClientSecret.trim();
        }
        if (ddClientSecret && ddClientSecret !== "••••••••") {
          payload.doorDashApiKey = ddClientSecret.trim();
        }
      }

      await updateBranch({ id: resolvedParams.id, data: payload }).unwrap();
      toast.success("Branch updated successfully");
    } catch (error: any) {
      console.error("Update failed:", error);
      toast.error(error?.data?.message || "Failed to update branch");
    }
  };

  const handleHoursChange = (dayIndex: number, field: string, value: any) => {
    const hours = [...(formData.openingHours || [])];
    const index = hours.findIndex((h) => h.dayOfWeek === dayIndex);

    if (index > -1) {
      hours[index] = { ...hours[index], [field]: value };
    } else {
      hours.push({
        dayOfWeek: dayIndex,
        openAt: "09:00",
        closeAt: "17:00",
        isActive: true,
        isClosed: false,
        [field]: value,
      } as any);
    }

    setFormData({ ...formData, openingHours: hours });
  };

  const handleLocationSelect = (
    formattedAddress: string,
    lat?: number,
    lng?: number,
  ) => {
    setFormData((prev) => ({
      ...prev,
      branchAddress: formattedAddress,
      latitude: lat !== undefined ? lat : prev.latitude,
      longitude: lng !== undefined ? lng : prev.longitude,
    }));
    if (lat !== undefined && lng !== undefined) {
      toast.info(`Updated coordinates: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    }
  };

  const handleListingChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      saleListing: {
        ...((prev.saleListing || {
          branchSaleListingId: "",
          branchId: resolvedParams.id,
          listingDescription: "",
          includedPackageDescription: "",
          highlights: [],
        }) as any),
        [field]: value,
      },
    }));
  };

  const addHighlight = () => {
    if (newHighlight.trim()) {
      const currentHighlights = formData.saleListing?.highlights || [];
      if (!currentHighlights.includes(newHighlight.trim())) {
        handleListingChange("highlights", [
          ...currentHighlights,
          newHighlight.trim(),
        ]);
        setNewHighlight("");
      }
    }
  };

  const removeHighlight = (index: number) => {
    const currentHighlights = formData.saleListing?.highlights || [];
    handleListingChange(
      "highlights",
      currentHighlights.filter((_, i) => i !== index),
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-10 w-64" />
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-[300px] w-full rounded-xl" />
            <Skeleton className="h-[400px] w-full rounded-xl" />
          </div>
          <Skeleton className="h-[200px] w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!branch) {
    return (
      <div className="space-y-6">
        <PageHeader title="Branch Not Found" />
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              The branch you&apos;re looking for doesn&apos;t exist.
            </p>
            <Button
              onClick={() => router.push("/admin/branches")}
              className="mt-4"
            >
              Back to Branches
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentBranch = { ...branch, ...formData };
  const isListedForSale = currentBranch.purpose === BranchPurpose.ListedForSale;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader
          title={currentBranch.branchName}
          description="Manage branch settings, marketing listings, and delivery platforms"
        />
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-transparent border-b border-border rounded-none h-auto p-0 gap-0 w-full justify-start">
          <TabsTrigger
            value="overview"
            className="relative rounded-none bg-transparent border-0 shadow-none px-4 pb-3 pt-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:rounded-t-full after:bg-transparent data-[state=active]:after:bg-primary"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="products"
            className="relative rounded-none bg-transparent border-0 shadow-none px-4 pb-3 pt-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:rounded-t-full after:bg-transparent data-[state=active]:after:bg-primary"
          >
            Products
          </TabsTrigger>
          <TabsTrigger
            value="uber-menus"
            className="relative rounded-none bg-transparent border-0 shadow-none px-4 pb-3 pt-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:rounded-t-full after:bg-transparent data-[state=active]:after:bg-primary"
          >
            Uber Menus
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="m-0">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Core Information */}
              <Card className="border border-border/60 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    Branch Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Branch Name</Label>
                      <Input
                        value={currentBranch.branchName || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            branchName: e.target.value,
                          })
                        }
                        disabled={!isSuper}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Branch Purpose</Label>
                      <Select
                        value={(
                          currentBranch.purpose ?? BranchPurpose.Operational
                        ).toString()}
                        onValueChange={(val) =>
                          setFormData({
                            ...formData,
                            purpose: parseInt(val) as BranchPurpose,
                          })
                        }
                        disabled={!isSuper}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select purpose" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem
                            value={BranchPurpose.Operational.toString()}
                          >
                            Operational Cafe Shop
                          </SelectItem>
                          <SelectItem
                            value={BranchPurpose.ListedForSale.toString()}
                          >
                            Public Listed For Sale
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Branch Description</Label>
                    <Textarea
                      placeholder="Write a brief overview of this coffee shop location..."
                      value={currentBranch.branchDescription || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          branchDescription: e.target.value,
                        })
                      }
                      disabled={!canEdit}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Branch Cover Image URL</Label>
                    <div className="flex gap-3 items-center">
                      <Input
                        placeholder="https://images.unsplash.com/... or image path"
                        value={currentBranch.branchImageUrl || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            branchImageUrl: e.target.value,
                          })
                        }
                        disabled={!canEdit}
                        className="flex-1"
                      />
                      {currentBranch.branchImageUrl && (
                        <div className="h-10 w-10 relative rounded-md border overflow-hidden flex-shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={currentBranch.branchImageUrl}
                            alt="Branch Thumbnail"
                            className="h-full w-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Location</Label>
                    <div className="flex gap-3 items-end">
                      <div className="space-y-2 flex-shrink-0">
                        <Label htmlFor="locationInputTypeMgr" className="text-xs text-muted-foreground">Location Type</Label>
                        <Select
                          value={locationInputType}
                          onValueChange={(val) => setLocationInputType(val as "Address" | "Coordinates")}
                          disabled={!isSuper}
                        >
                          <SelectTrigger id="locationInputTypeMgr" className="w-[160px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Address">Address</SelectItem>
                            <SelectItem value="Coordinates">Coordinates</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {locationInputType === "Address" && (
                        <div className="flex-1">
                          <LocationInput
                            value={currentBranch.branchAddress || ""}
                            onChange={(val) =>
                              setFormData({ ...formData, branchAddress: val })
                            }
                            onSelect={handleLocationSelect}
                            disabled={!isSuper}
                          />
                        </div>
                      )}

                      {locationInputType === "Coordinates" && (
                        <div className="flex gap-3 flex-1">
                          <div className="space-y-2 flex-1">
                            <Label htmlFor="mgrLatitude" className="text-xs text-muted-foreground">Latitude</Label>
                            <Input
                              id="mgrLatitude"
                              type="number"
                              step="any"
                              placeholder="e.g. -31.9505"
                              value={currentBranch.latitude ?? ""}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  latitude: e.target.value ? parseFloat(e.target.value) : undefined,
                                })
                              }
                              disabled={!isSuper}
                            />
                          </div>
                          <div className="space-y-2 flex-1">
                            <Label htmlFor="mgrLongitude" className="text-xs text-muted-foreground">Longitude</Label>
                            <Input
                              id="mgrLongitude"
                              type="number"
                              step="any"
                              placeholder="e.g. 115.8605"
                              value={currentBranch.longitude ?? ""}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  longitude: e.target.value ? parseFloat(e.target.value) : undefined,
                                })
                              }
                              disabled={!isSuper}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contacts */}
              <Card className="border border-border/60 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    Contact Channels
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Primary Phone</Label>
                      <Input
                        value={currentBranch.branchPhoneNumber || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            branchPhoneNumber: e.target.value,
                          })
                        }
                        disabled={!canEdit}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Secondary Phone (Optional)</Label>
                      <Input
                        value={currentBranch.branchPhoneNumberAlt || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            branchPhoneNumberAlt: e.target.value,
                          })
                        }
                        disabled={!canEdit}
                        placeholder="e.g. (555) 999-9999"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Primary Email</Label>
                      <Input
                        value={currentBranch.branchEmail || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            branchEmail: e.target.value,
                          })
                        }
                        disabled={!canEdit}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Secondary Email (Optional)</Label>
                      <Input
                        value={currentBranch.branchEmailAlt || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            branchEmailAlt: e.target.value,
                          })
                        }
                        disabled={!canEdit}
                        placeholder="e.g. support@caffissimo.com"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Listed for Sale Sub-Form (Conditional) */}
              {isListedForSale && (
                <Card className="border border-border/60 shadow-sm transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" /> Listing
                      Details
                    </CardTitle>
                    <CardDescription>
                      Setup details visible on the public listings board
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="listingDescription">
                        Sale Listing Description
                      </Label>
                      <Textarea
                        id="listingDescription"
                        placeholder="Describe the opportunity, commercial capacity, lease terms, and location perks..."
                        value={
                          currentBranch.saleListing?.listingDescription || ""
                        }
                        onChange={(e) =>
                          handleListingChange(
                            "listingDescription",
                            e.target.value,
                          )
                        }
                        disabled={!canEdit}
                        rows={4}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="includedPackageDescription">
                        What's Included in Package
                      </Label>
                      <Textarea
                        id="includedPackageDescription"
                        placeholder="e.g., Espresso machinery, POS systems, full inventory, furniture..."
                        value={
                          currentBranch.saleListing
                            ?.includedPackageDescription || ""
                        }
                        onChange={(e) =>
                          handleListingChange(
                            "includedPackageDescription",
                            e.target.value,
                          )
                        }
                        disabled={!canEdit}
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="inquiryPhone">
                        Inquiry Direct Line (Optional)
                      </Label>
                      <Input
                        id="inquiryPhone"
                        type="tel"
                        placeholder="Leave empty to use primary branch phone"
                        value={currentBranch.saleListing?.inquiryPhone || ""}
                        onChange={(e) =>
                          handleListingChange("inquiryPhone", e.target.value)
                        }
                        disabled={!canEdit}
                      />
                    </div>

                    <div className="space-y-3 pt-2">
                      <Label>Storefront Card Bullet Highlights</Label>
                      {canEdit && (
                        <div className="flex gap-2">
                          <Input
                            placeholder="e.g. Drive-thru window facility"
                            value={newHighlight}
                            onChange={(e) => setNewHighlight(e.target.value)}
                            onKeyDown={(e) =>
                              e.key === "Enter" &&
                              (e.preventDefault(), addHighlight())
                            }
                          />
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={addHighlight}
                          >
                            <Plus className="h-4 w-4 mr-1" /> Add
                          </Button>
                        </div>
                      )}
                      <div className="flex flex-wrap gap-2 pt-2">
                        {!currentBranch.saleListing?.highlights ||
                        currentBranch.saleListing.highlights.length === 0 ? (
                          <span className="text-sm text-muted-foreground italic">
                            No highlights added yet. Add a few key bullet items.
                          </span>
                        ) : (
                          currentBranch.saleListing.highlights.map(
                            (hl, index) => (
                              <Badge
                                key={index}
                                variant="secondary"
                                className="px-3 py-1 flex items-center gap-1 text-xs"
                              >
                                {hl}
                                {canEdit && (
                                  <button
                                    type="button"
                                    onClick={() => removeHighlight(index)}
                                    className="hover:text-destructive"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                )}
                              </Badge>
                            ),
                          )
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Operating Hours (Operational Only) */}
              {!isListedForSale && (
                <Card className="border border-border/60 shadow-sm transition-all duration-300">
                  <CardHeader>
                    <CardTitle>Operating Hours</CardTitle>
                    <CardDescription>
                      Set the opening hours for each day
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {DAYS.map(({ index, label }) => {
                        const hours = currentBranch.openingHours?.find(
                          (h) => h.dayOfWeek === index,
                        );
                        const isOpen =
                          hours && !hours.isClosed && hours.isActive;
                        return (
                          <div
                            key={index}
                            className="flex items-center gap-4 border-b pb-3 last:border-0 last:pb-0"
                          >
                            <span className="w-24 text-sm font-medium">
                              {label}
                            </span>
                            <div className="flex items-center gap-2 flex-1">
                              <Input
                                type="time"
                                value={hours?.openAt || ""}
                                onChange={(e) =>
                                  handleHoursChange(
                                    index,
                                    "openAt",
                                    e.target.value,
                                  )
                                }
                                disabled={!isSuper || !isOpen}
                                className="w-28"
                              />
                              <span className="text-muted-foreground">to</span>
                              <Input
                                type="time"
                                value={hours?.closeAt || ""}
                                onChange={(e) =>
                                  handleHoursChange(
                                    index,
                                    "closeAt",
                                    e.target.value,
                                  )
                                }
                                disabled={!isSuper || !isOpen}
                                className="w-28"
                              />
                              <div className="flex items-center gap-2 ml-4">
                                <Switch
                                  checked={isOpen ?? false}
                                  onCheckedChange={(v) =>
                                    handleHoursChange(index, "isActive", v)
                                  }
                                  disabled={!isSuper}
                                />
                                <span className="text-sm text-muted-foreground">
                                  Open
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Platform Connections (Operational Only) */}
              {!isListedForSale && (
                <Card className="border border-border/60 shadow-sm transition-all duration-300">
                  <CardHeader>
                    <CardTitle>Platform Connections</CardTitle>
                    <CardDescription>
                      Configure delivery partner storefront links and API
                      credentials
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Uber Eats Section */}
                    <div className="space-y-4 rounded-lg border p-4 bg-muted/20">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm">
                          Uber Eats Integration
                        </span>
                      </div>

                      <div className="space-y-2">
                        <Label>Storefront URL</Label>
                        <div className="flex gap-2">
                          <Input
                            value={uberUrl}
                            onChange={(e) => setUberUrl(e.target.value)}
                            placeholder="https://ubereats.com/store/..."
                            disabled={!isSuper}
                            className="flex-1 bg-background"
                          />
                          {uberUrl && (
                            <a
                              href={uberUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Button variant="outline" size="icon">
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => setShowUberAdvanced(!showUberAdvanced)}
                          className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
                        >
                          {showUberAdvanced
                            ? "Hide Advanced Credentials"
                            : "Show Advanced Credentials & API Keys"}
                        </button>
                      </div>

                      {showUberAdvanced && (
                        <div className="space-y-4 pt-3 border-t mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2 md:col-span-2">
                            <p className="text-xs text-muted-foreground">
                              Configure OAuth and Webhook parameters for Uber
                              Eats.
                            </p>
                          </div>
                          <div className="space-y-2">
                            <Label>Client ID</Label>
                            <Input
                              value={uberClientId}
                              onChange={(e) => setUberClientId(e.target.value)}
                              placeholder="Enter Client ID"
                              disabled={!isSuper}
                              className="bg-background"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Client Secret</Label>
                            <div className="relative">
                              <Input
                                type={showUberApiKey ? "text" : "password"}
                                autoComplete="off"
                                value={uberClientSecret}
                                onChange={(e) =>
                                  setUberClientSecret(e.target.value)
                                }
                                placeholder="Enter Client Secret"
                                disabled={!isSuper}
                                className="pr-10 bg-background"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  setShowUberApiKey(!showUberApiKey)
                                }
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                              >
                                {showUberApiKey ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>External Store ID</Label>
                            <Input
                              value={uberExternalStoreId}
                              onChange={(e) =>
                                setUberExternalStoreId(e.target.value)
                              }
                              placeholder="e.g. uber-store-123"
                              disabled={!isSuper}
                              className="bg-background"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Webhook Secret</Label>
                            <Input
                              value={uberWebhookSecret}
                              onChange={(e) =>
                                setUberWebhookSecret(e.target.value)
                              }
                              placeholder="Enter Webhook Secret"
                              disabled={!isSuper}
                              className="bg-background"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>
                              Webhook Connection Key (System Reference)
                            </Label>
                            <Input
                              value={uberWebhookConnectionKey}
                              onChange={(e) =>
                                setUberWebhookConnectionKey(e.target.value)
                              }
                              placeholder="Auto-generated or custom key"
                              disabled={!isSuper}
                              className="bg-background"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Environment</Label>
                            <select
                              value={uberEnvironment}
                              onChange={(e) =>
                                setUberEnvironment(parseInt(e.target.value))
                              }
                              disabled={!isSuper}
                              className="w-full h-10 px-3 border rounded-md bg-background text-sm"
                            >
                              <option value={0}>Sandbox (Testing)</option>
                              <option value={1}>Production (Live)</option>
                            </select>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* DoorDash Section */}
                    <div className="space-y-4 rounded-lg border p-4 bg-muted/20">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm">
                          DoorDash Integration
                        </span>
                      </div>

                      <div className="space-y-2">
                        <Label>Storefront URL</Label>
                        <div className="flex gap-2">
                          <Input
                            value={ddUrl}
                            onChange={(e) => setDdUrl(e.target.value)}
                            placeholder="https://doordash.com/store/..."
                            disabled={!isSuper}
                            className="flex-1 bg-background"
                          />
                          {ddUrl && (
                            <a
                              href={ddUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Button variant="outline" size="icon">
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => setShowDdAdvanced(!showDdAdvanced)}
                          className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
                        >
                          {showDdAdvanced
                            ? "Hide Advanced Credentials"
                            : "Show Advanced Credentials & API Keys"}
                        </button>
                      </div>

                      {showDdAdvanced && (
                        <div className="space-y-4 pt-3 border-t mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2 md:col-span-2">
                            <p className="text-xs text-muted-foreground">
                              Configure OAuth and Webhook parameters for
                              DoorDash.
                            </p>
                          </div>
                          <div className="space-y-2">
                            <Label>Client ID</Label>
                            <Input
                              value={ddClientId}
                              onChange={(e) => setDdClientId(e.target.value)}
                              placeholder="Enter Client ID"
                              disabled={!isSuper}
                              className="bg-background"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Client Secret</Label>
                            <div className="relative">
                              <Input
                                type={showDoorApiKey ? "text" : "password"}
                                autoComplete="off"
                                value={ddClientSecret}
                                onChange={(e) =>
                                  setDdClientSecret(e.target.value)
                                }
                                placeholder="Enter Client Secret"
                                disabled={!isSuper}
                                className="pr-10 bg-background"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  setShowDoorApiKey(!showDoorApiKey)
                                }
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                              >
                                {showDoorApiKey ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>External Store ID</Label>
                            <Input
                              value={ddExternalStoreId}
                              onChange={(e) =>
                                setDdExternalStoreId(e.target.value)
                              }
                              placeholder="e.g. doordash-store-456"
                              disabled={!isSuper}
                              className="bg-background"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Webhook Secret</Label>
                            <Input
                              value={ddWebhookSecret}
                              onChange={(e) =>
                                setDdWebhookSecret(e.target.value)
                              }
                              placeholder="Enter Webhook Secret"
                              disabled={!isSuper}
                              className="bg-background"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>
                              Webhook Connection Key (System Reference)
                            </Label>
                            <Input
                              value={ddWebhookConnectionKey}
                              onChange={(e) =>
                                setDdWebhookConnectionKey(e.target.value)
                              }
                              placeholder="Auto-generated or custom key"
                              disabled={!isSuper}
                              className="bg-background"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Environment</Label>
                            <select
                              value={ddEnvironment}
                              onChange={(e) =>
                                setDdEnvironment(parseInt(e.target.value))
                              }
                              disabled={!isSuper}
                              className="w-full h-10 px-3 border rounded-md bg-background text-sm"
                            >
                              <option value={0}>Sandbox (Testing)</option>
                              <option value={1}>Production (Live)</option>
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Status */}
              <Card className="border border-border/60 shadow-sm">
                <CardHeader>
                  <CardTitle>Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Branch Open</Label>
                      <p className="text-sm text-muted-foreground">
                        Toggle to open or close the branch
                      </p>
                    </div>
                    <Switch
                      checked={currentBranch.isOpen}
                      onCheckedChange={(v) =>
                        setFormData({ ...formData, isOpen: v })
                      }
                      disabled={!canEdit}
                    />
                  </div>
                  <div className="flex items-center justify-between border-t pt-4">
                    <div>
                      <Label>Active Status</Label>
                      <p className="text-sm text-muted-foreground">
                        Toggle system-wide active status for this branch
                      </p>
                    </div>
                    <Switch
                      checked={currentBranch.isActive ?? true}
                      onCheckedChange={(v) =>
                        setFormData({ ...formData, isActive: v })
                      }
                      disabled={!isSuper}
                    />
                  </div>
                </CardContent>
              </Card>

              {canEdit && (
                <Button
                  className="w-full"
                  onClick={handleSave}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Changes
                </Button>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="products" className="m-0">
          <ProductsTab branchId={branch.branchId} canEdit={isSuper} />
        </TabsContent>

        <TabsContent value="uber-menus" className="m-0">
          <UberMenusTab branchId={branch.branchId} canEdit={isSuper} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
