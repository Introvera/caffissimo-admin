"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff, Plus, X, Globe, Phone, Mail, FileText, Image as ImageIcon, ExternalLink, Upload, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { LocationInput } from "@/components/ui/location-input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { canCreateBranch, isSuperAdmin } from "@/lib/rbac";
import { useAppSelector } from "@/stores/store";
import { useCreateBranchMutation } from "@/stores/api/branchApi";
import { UserRole, BranchPurpose } from "@/types";
import { toast } from "sonner";
import { ImageUploader } from "@/components/ui/image-uploader";
import { EditBar } from "@/components/shared/edit-bar";

const DAYS = [
  { key: "monday", label: "Monday", index: 1 },
  { key: "tuesday", label: "Tuesday", index: 2 },
  { key: "wednesday", label: "Wednesday", index: 3 },
  { key: "thursday", label: "Thursday", index: 4 },
  { key: "friday", label: "Friday", index: 5 },
  { key: "saturday", label: "Saturday", index: 6 },
  { key: "sunday", label: "Sunday", index: 0 },
] as const;

const defaultOpeningHours: Record<string, { open: string; close: string; closed?: boolean }> = {
  monday: { open: "06:00", close: "20:00" },
  tuesday: { open: "06:00", close: "20:00" },
  wednesday: { open: "06:00", close: "20:00" },
  thursday: { open: "06:00", close: "20:00" },
  friday: { open: "06:00", close: "21:00" },
  saturday: { open: "07:00", close: "21:00" },
  sunday: { open: "07:00", close: "18:00" },
};

export default function NewBranchPage() {
  const router = useRouter();
  const currentRole = useAppSelector((state) => state.auth.user?.role) || UserRole.Cashier;
  const [createBranch, { isLoading: isCreating }] = useCreateBranchMutation();

  // Root branch fields
  const [name, setName] = useState("");
  const [purpose, setPurpose] = useState<BranchPurpose>(BranchPurpose.Operational);
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);
  const [locationInputType, setLocationInputType] = useState<"Address" | "Coordinates">("Address");
  
  // Contacts
  const [phone, setPhone] = useState("");
  const [phoneAlt, setPhoneAlt] = useState("");
  const [email, setEmail] = useState("");
  const [emailAlt, setEmailAlt] = useState("");
  
  const [isOpen, setIsOpen] = useState(true);
  const [isActive, setIsActive] = useState(true);
  // Detailed Uber Eats Connection States
  const [uberUrl, setUberUrl] = useState("");
  const [uberExternalStoreId, setUberExternalStoreId] = useState("");
  const [uberClientId, setUberClientId] = useState("");
  const [uberClientSecret, setUberClientSecret] = useState("");
  const [uberWebhookSecret, setUberWebhookSecret] = useState("");
  const [uberWebhookConnectionKey, setUberWebhookConnectionKey] = useState("");
  const [uberEnvironment, setUberEnvironment] = useState<number>(0); // 0 = Sandbox, 1 = Production
  const [uberAutoAccept] = useState(true);
  const [showUberAdvanced, setShowUberAdvanced] = useState(false);
  const [showUberApiKey, setShowUberApiKey] = useState(false);

  // Detailed DoorDash Connection States
  const [ddUrl, setDdUrl] = useState("");
  const [ddExternalStoreId, setDdExternalStoreId] = useState("");
  const [ddClientId, setDdClientId] = useState("");
  const [ddClientSecret, setDdClientSecret] = useState("");
  const [ddWebhookSecret, setDdWebhookSecret] = useState("");
  const [ddWebhookConnectionKey, setDdWebhookConnectionKey] = useState("");
  const [ddEnvironment, setDdEnvironment] = useState<number>(0); // 0 = Sandbox, 1 = Production
  const [ddAutoAccept] = useState(true);
  const [showDdAdvanced, setShowDdAdvanced] = useState(false);
  const [showDoorApiKey, setShowDoorApiKey] = useState(false);

  const [openingHours, setOpeningHours] = useState<Record<string, { open: string; close: string; closed?: boolean }>>(
    () => ({ ...defaultOpeningHours })
  );

  // Listed for sale sub-fields
  const [listingDescription, setListingDescription] = useState("");
  const [includedPackageDescription, setIncludedPackageDescription] = useState("");
  const [inquiryPhone, setInquiryPhone] = useState("");
  const [highlights, setHighlights] = useState<string[]>([]);
  const [newHighlight, setNewHighlight] = useState("");

  const canCreate = canCreateBranch(currentRole);
  const isSuper = isSuperAdmin(currentRole);

  const updateHours = (
    day: string,
    field: "open" | "close" | "closed",
    value: string | boolean
  ) => {
    setOpeningHours((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        ...(field === "closed" ? { closed: !value } : { [field]: value }),
      },
    }));
  };

  const handleLocationSelect = (formattedAddress: string, lat?: number, lng?: number) => {
    setAddress(formattedAddress);
    if (lat !== undefined && lng !== undefined) {
      setLatitude(lat);
      setLongitude(lng);
      toast.info(`Coordinates loaded: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    }
  };

  const addHighlight = () => {
    if (newHighlight.trim() && !highlights.includes(newHighlight.trim())) {
      setHighlights([...highlights, newHighlight.trim()]);
      setNewHighlight("");
    }
  };

  const removeHighlight = (index: number) => {
    setHighlights(highlights.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formattedOpeningHours = DAYS.map((d) => {
        const hours = openingHours[d.key] || defaultOpeningHours[d.key];
        const isClosed = hours?.closed ?? false;
        return {
          dayOfWeek: d.index,
          openAt: isClosed ? "09:00" : hours.open,
          closeAt: isClosed ? "17:00" : hours.close,
          isClosed,
        };
      });

      const payload: any = {
        branchName: name,
        purpose,
        branchDescription: description || undefined,
        branchImageFile: imageFile || undefined,
        branchAddress: address,
        latitude: latitude || undefined,
        longitude: longitude || undefined,
        branchPhoneNumber: phone,
        branchPhoneNumberAlt: phoneAlt || undefined,
        branchEmail: email,
        branchEmailAlt: emailAlt || undefined,
        isOpen,
        isActive,
        openingHours: purpose === BranchPurpose.ListedForSale ? [] : formattedOpeningHours,
      };

      if (purpose === BranchPurpose.Operational) {
        payload.platformConnections = [
          {
            platformCode: 0,
            storeUrl: uberUrl.trim() || undefined,
            externalStoreId: uberExternalStoreId.trim() || undefined,
            clientId: uberClientId.trim() || undefined,
            clientSecret: uberClientSecret.trim() || undefined,
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
            clientSecret: ddClientSecret.trim() || undefined,
            webhookSecret: ddWebhookSecret.trim() || undefined,
            webhookConnectionKey: ddWebhookConnectionKey.trim() || undefined,
            environment: ddEnvironment,
            autoAcceptOrders: ddAutoAccept,
          }
        ].filter(conn => conn.storeUrl || conn.clientId || conn.externalStoreId);

        // Map flat properties as fallback support
        payload.uberEatsUrl = uberUrl.trim() || undefined;
        payload.doorDashUrl = ddUrl.trim() || undefined;
        payload.uberEatsApiKey = uberClientSecret.trim() || undefined;
        payload.doorDashApiKey = ddClientSecret.trim() || undefined;
      }

      if (purpose === BranchPurpose.ListedForSale) {
        payload.saleListing = {
          listingDescription: listingDescription.trim(),
          includedPackageDescription: includedPackageDescription.trim(),
          inquiryPhone: inquiryPhone || undefined,
          highlights,
        };
      }

      await createBranch(payload).unwrap();
      toast.success("Branch created successfully!");
      router.push("/admin/branches");
    } catch (err: any) {
      console.error("Failed to create branch:", err);
      toast.error(err?.data?.message || "Failed to create branch. Please try again.");
    }
  };

  if (!canCreate) {
    return (
      <div className="space-y-6">
        <PageHeader title="Create Branch" description="You don't have permission to create branches." />
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Link href="/admin/branches">
              <Button variant="outline">Back to Branches</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/branches">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <PageHeader
          title="Create Branch"
          description="Add a new coffee shop location or public sale listing"
        />
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-transparent border-b border-border rounded-none h-auto p-0 gap-0 w-full justify-start">
          <TabsTrigger
            value="overview"
            className="relative rounded-none bg-transparent border-0 shadow-none px-4 pb-3 pt-2 text-body font-medium text-muted-foreground transition-colors hover:text-foreground data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:rounded-t-full after:bg-transparent data-[state=active]:after:bg-primary"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="products"
            disabled
            className="relative rounded-none bg-transparent border-0 shadow-none px-4 pb-3 pt-2 text-body font-medium text-muted-foreground/40 transition-colors cursor-not-allowed after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:rounded-t-full after:bg-transparent"
          >
            Products
          </TabsTrigger>
          <TabsTrigger
            value="uber-menus"
            disabled
            className="relative rounded-none bg-transparent border-0 shadow-none px-4 pb-3 pt-2 text-body font-medium text-muted-foreground/40 transition-colors cursor-not-allowed after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:rounded-t-full after:bg-transparent"
          >
            Uber Menus
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="m-0">
      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3">
        {/* Left Column (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Core Config */}
          <Card className="border border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="text-h3 flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" /> Core Configuration
              </CardTitle>
              <CardDescription>Configure name, purpose, and visual branding</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Branch Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Downtown Caffissimo"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="purpose">Branch Purpose</Label>
                  <Select
                    value={purpose.toString()}
                    onValueChange={(val) => setPurpose(parseInt(val) as BranchPurpose)}
                  >
                    <SelectTrigger id="purpose">
                      <SelectValue placeholder="Select purpose" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={BranchPurpose.Operational.toString()}>Operational Cafe Shop</SelectItem>
                      <SelectItem value={BranchPurpose.ListedForSale.toString()}>Public Listed For Sale</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Write a brief overview of this coffee shop location..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Branch Cover Image</Label>
                <ImageUploader
                  value={imageFile}
                  onChange={(val) => setImageFile(val as File | null)}
                  accept="image/*"
                  maxSizeMB={5}
                  helperText="Supports PNG, JPG, JPEG, GIF up to 5MB"
                />
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card className="border border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="text-h3 flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" /> Location
              </CardTitle>
              <CardDescription>Specify the branch location by address or exact coordinates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3 items-end">
                <div className="space-y-2 flex-shrink-0">
                  <Label htmlFor="locationInputType">Location Type</Label>
                  <Select
                    value={locationInputType}
                    onValueChange={(val) => setLocationInputType(val as "Address" | "Coordinates")}
                  >
                    <SelectTrigger id="locationInputType" className="w-[160px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Address">Address</SelectItem>
                      <SelectItem value="Coordinates">Coordinates</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {locationInputType === "Address" && (
                  <div className="space-y-2 flex-1">
                    <Label>Address</Label>
                    <LocationInput
                      value={address}
                      onChange={setAddress}
                      onSelect={handleLocationSelect}
                      placeholder="Type location address..."
                    />
                  </div>
                )}

                {locationInputType === "Coordinates" && (
                  <div className="flex gap-3 flex-1">
                    <div className="space-y-2 flex-1">
                      <Label htmlFor="latitude">Latitude</Label>
                      <Input
                        id="latitude"
                        type="number"
                        step="any"
                        placeholder="e.g. -31.9505"
                        value={latitude !== undefined ? latitude : ""}
                        onChange={(e) => setLatitude(e.target.value ? parseFloat(e.target.value) : undefined)}
                      />
                    </div>
                    <div className="space-y-2 flex-1">
                      <Label htmlFor="longitude">Longitude</Label>
                      <Input
                        id="longitude"
                        type="number"
                        step="any"
                        placeholder="e.g. 115.8605"
                        value={longitude !== undefined ? longitude : ""}
                        onChange={(e) => setLongitude(e.target.value ? parseFloat(e.target.value) : undefined)}
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Marketing / Listed for Sale Sub-Form (Conditional) */}
          {purpose === BranchPurpose.ListedForSale && (
            <Card className="border border-border/60 shadow-sm transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-h3 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" /> Listing Details
                </CardTitle>
                <CardDescription>Setup details visible on the public listings board</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="listingDescription">Sale Listing Description</Label>
                  <Textarea
                    id="listingDescription"
                    placeholder="Describe the opportunity, commercial capacity, lease terms, and location perks..."
                    value={listingDescription}
                    onChange={(e) => setListingDescription(e.target.value)}
                    required={purpose === BranchPurpose.ListedForSale}
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="includedPackageDescription">What's Included in Package</Label>
                  <Textarea
                    id="includedPackageDescription"
                    placeholder="e.g., Espresso machinery, POS systems, full inventory, furniture and operational lease contract transfer..."
                    value={includedPackageDescription}
                    onChange={(e) => setIncludedPackageDescription(e.target.value)}
                    required={purpose === BranchPurpose.ListedForSale}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="inquiryPhone">Inquiry Direct Line (Optional)</Label>
                  <Input
                    id="inquiryPhone"
                    type="tel"
                    placeholder="Leave empty to use primary branch phone"
                    value={inquiryPhone}
                    onChange={(e) => setInquiryPhone(e.target.value)}
                  />
                </div>

                <div className="space-y-3 pt-2">
                  <Label>Storefront Card Bullet Highlights</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g. Modern Drive-Thru facility"
                      value={newHighlight}
                      onChange={(e) => setNewHighlight(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addHighlight())}
                    />
                    <Button type="button" variant="secondary" onClick={addHighlight}>
                      <Plus className="h-4 w-4 mr-1" /> Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {highlights.length === 0 ? (
                      <span className="text-body text-muted-foreground italic">No highlights added yet. Add a few key bullet items.</span>
                    ) : (
                      highlights.map((hl, index) => (
                        <Badge key={index} variant="secondary" className="px-3 py-1 flex items-center gap-1 text-caption">
                          {hl}
                          <button type="button" onClick={() => removeHighlight(index)} className="hover:text-destructive">
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Operating Hours (Operational Only) */}
          {purpose === BranchPurpose.Operational && (
            <Card className="border border-border/60 shadow-sm transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-h3">Operating Hours</CardTitle>
                <CardDescription>Set the opening hours for each day</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {DAYS.map(({ key, label }) => {
                    const hours = openingHours[key] ?? defaultOpeningHours[key];
                    const closed = hours?.closed ?? false;
                    return (
                      <div key={key} className="flex items-center gap-4 border-b pb-3 last:border-0 last:pb-0">
                        <span className="w-24 text-body font-medium">{label}</span>
                        <div className="flex items-center gap-2 flex-1">
                          <Input
                            type="time"
                            value={hours?.open ?? "06:00"}
                            onChange={(e) => updateHours(key, "open", e.target.value)}
                            disabled={closed}
                            className="w-28"
                          />
                          <span className="text-muted-foreground">to</span>
                          <Input
                            type="time"
                            value={hours?.close ?? "20:00"}
                            onChange={(e) => updateHours(key, "close", e.target.value)}
                            disabled={closed}
                            className="w-28"
                          />
                          <div className="flex items-center gap-2 ml-4">
                            <Switch
                              checked={!closed}
                              onCheckedChange={(checked) => updateHours(key, "closed", checked)}
                            />
                            <span className="text-body text-muted-foreground">Open</span>
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
          {purpose === BranchPurpose.Operational && isSuper && (
            <Card className="border border-border/60 shadow-sm transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-h3">Platform Connections</CardTitle>
                <CardDescription>Configure delivery partner storefront links and API credentials</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Uber Eats Section */}
                <div className="space-y-4 rounded-lg border p-4 bg-muted/20">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-body">Uber Eats Integration</span>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="uberUrl">Storefront URL</Label>
                    <div className="flex gap-2">
                      <Input
                        id="uberUrl"
                        value={uberUrl}
                        onChange={(e) => setUberUrl(e.target.value)}
                        placeholder="https://ubereats.com/store/..."
                        className="flex-1 bg-background"
                      />
                      {uberUrl && (
                        <a href={uberUrl} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="icon" type="button">
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
                      className="text-caption text-primary font-medium hover:underline flex items-center gap-1"
                    >
                      {showUberAdvanced ? "Hide Advanced Credentials" : "Show Advanced Credentials & API Keys"}
                    </button>
                  </div>

                  {showUberAdvanced && (
                    <div className="space-y-4 pt-3 border-t mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2 md:col-span-2">
                        <p className="text-caption text-muted-foreground">
                          Configure OAuth and Webhook parameters for Uber Eats.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="uberClientId">Client ID</Label>
                        <Input
                          id="uberClientId"
                          value={uberClientId}
                          onChange={(e) => setUberClientId(e.target.value)}
                          placeholder="Enter Client ID"
                          className="bg-background"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="uberClientSecret">Client Secret</Label>
                        <div className="relative">
                          <Input
                            id="uberClientSecret"
                            type={showUberApiKey ? "text" : "password"}
                            autoComplete="off"
                            value={uberClientSecret}
                            onChange={(e) => setUberClientSecret(e.target.value)}
                            placeholder="Enter Client Secret"
                            className="pr-10 bg-background"
                          />
                          <button
                            type="button"
                            onClick={() => setShowUberApiKey(!showUberApiKey)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showUberApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="uberExternalStoreId">External Store ID</Label>
                        <Input
                          id="uberExternalStoreId"
                          value={uberExternalStoreId}
                          onChange={(e) => setUberExternalStoreId(e.target.value)}
                          placeholder="e.g. uber-store-123"
                          className="bg-background"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="uberWebhookSecret">Webhook Secret</Label>
                        <Input
                          id="uberWebhookSecret"
                          value={uberWebhookSecret}
                          onChange={(e) => setUberWebhookSecret(e.target.value)}
                          placeholder="Enter Webhook Secret"
                          className="bg-background"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="uberWebhookConnectionKey">Webhook Connection Key (System Reference)</Label>
                        <Input
                          id="uberWebhookConnectionKey"
                          value={uberWebhookConnectionKey}
                          onChange={(e) => setUberWebhookConnectionKey(e.target.value)}
                          placeholder="Auto-generated or custom key"
                          className="bg-background"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="uberEnvironment">Environment</Label>
                        <select
                          id="uberEnvironment"
                          value={uberEnvironment}
                          onChange={(e) => setUberEnvironment(parseInt(e.target.value))}
                          className="w-full h-10 px-3 border rounded-md bg-background text-body"
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
                    <span className="font-semibold text-body">DoorDash Integration</span>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="ddUrl">Storefront URL</Label>
                    <div className="flex gap-2">
                      <Input
                        id="ddUrl"
                        value={ddUrl}
                        onChange={(e) => setDdUrl(e.target.value)}
                        placeholder="https://doordash.com/store/..."
                        className="flex-1 bg-background"
                      />
                      {ddUrl && (
                        <a href={ddUrl} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="icon" type="button">
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
                      className="text-caption text-primary font-medium hover:underline flex items-center gap-1"
                    >
                      {showDdAdvanced ? "Hide Advanced Credentials" : "Show Advanced Credentials & API Keys"}
                    </button>
                  </div>

                  {showDdAdvanced && (
                    <div className="space-y-4 pt-3 border-t mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2 md:col-span-2">
                        <p className="text-caption text-muted-foreground">
                          Configure OAuth and Webhook parameters for DoorDash.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ddClientId">Client ID</Label>
                        <Input
                          id="ddClientId"
                          value={ddClientId}
                          onChange={(e) => setDdClientId(e.target.value)}
                          placeholder="Enter Client ID"
                          className="bg-background"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ddClientSecret">Client Secret</Label>
                        <div className="relative">
                          <Input
                            id="ddClientSecret"
                            type={showDoorApiKey ? "text" : "password"}
                            autoComplete="off"
                            value={ddClientSecret}
                            onChange={(e) => setDdClientSecret(e.target.value)}
                            placeholder="Enter Client Secret"
                            className="pr-10 bg-background"
                          />
                          <button
                            type="button"
                            onClick={() => setShowDoorApiKey(!showDoorApiKey)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showDoorApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ddExternalStoreId">External Store ID</Label>
                        <Input
                          id="ddExternalStoreId"
                          value={ddExternalStoreId}
                          onChange={(e) => setDdExternalStoreId(e.target.value)}
                          placeholder="e.g. doordash-store-456"
                          className="bg-background"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ddWebhookSecret">Webhook Secret</Label>
                        <Input
                          id="ddWebhookSecret"
                          value={ddWebhookSecret}
                          onChange={(e) => setDdWebhookSecret(e.target.value)}
                          placeholder="Enter Webhook Secret"
                          className="bg-background"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ddWebhookConnectionKey">Webhook Connection Key (System Reference)</Label>
                        <Input
                          id="ddWebhookConnectionKey"
                          value={ddWebhookConnectionKey}
                          onChange={(e) => setDdWebhookConnectionKey(e.target.value)}
                          placeholder="Auto-generated or custom key"
                          className="bg-background"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ddEnvironment">Environment</Label>
                        <select
                          id="ddEnvironment"
                          value={ddEnvironment}
                          onChange={(e) => setDdEnvironment(parseInt(e.target.value))}
                          className="w-full h-10 px-3 border rounded-md bg-background text-body"
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

        {/* Right Sidebar Column (1/3 width) */}
        <div className="space-y-6">
          {/* Contact Info Card */}
          <Card className="border border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="text-h3 flex items-center gap-2">
                <Phone className="h-5 w-5 text-primary" /> Contact Details
              </CardTitle>
              <CardDescription>Primary and alternative customer support channels</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Primary Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(555) 000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phoneAlt">Alternative Phone (Optional)</Label>
                <Input
                  id="phoneAlt"
                  type="tel"
                  placeholder="e.g. (555) 999-9999"
                  value={phoneAlt}
                  onChange={(e) => setPhoneAlt(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Primary Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="branch@caffissimo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emailAlt">Alternative Email (Optional)</Label>
                <Input
                  id="emailAlt"
                  type="email"
                  placeholder="e.g. support@caffissimo.com"
                  value={emailAlt}
                  onChange={(e) => setEmailAlt(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Global Controls */}
          <Card className="border border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="text-h3">Publish Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-body font-semibold">Open Status</Label>
                  <p className="text-caption text-muted-foreground">Show as active on storefront</p>
                </div>
                <Switch checked={isOpen} onCheckedChange={setIsOpen} />
              </div>
              <div className="flex items-center justify-between border-t pt-4">
                <div>
                  <Label className="text-body font-semibold">Active Status</Label>
                  <p className="text-caption text-muted-foreground">System level active status</p>
                </div>
                <Switch checked={isActive} onCheckedChange={setIsActive} />
              </div>
            </CardContent>
          </Card>

        </div>
      <EditBar
        isVisible={true}
        saveButtonType="submit"
        onCancel={() => router.push("/admin/branches")}
        label="New branch"
        saveLabel={isCreating ? "Creating..." : "Create Branch"}
        cancelLabel="Cancel"
        isSaving={isCreating}
      />
      </form>
        </TabsContent>
      </Tabs>
    </div>
  );
}