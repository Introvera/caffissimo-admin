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
  Upload,
  Trash2,
  Image as ImageIcon,
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
import { ImageUploader } from "@/components/ui/image-uploader";

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
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [newImagePreview, setNewImagePreview] = useState<string>("");
  const [imageDeleted, setImageDeleted] = useState(false);
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
      setNewImageFile(null);
      setNewImagePreview("");
      setImageDeleted(false);
      setIsEditingMode(false);

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
      const isListed = currentBranch.purpose === BranchPurpose.ListedForSale || (currentBranch.purpose as any) === "ListedForSale";
      const cleanOpeningHours = currentBranch.openingHours?.map((oh) => {
        let dayOfWeekVal = oh.dayOfWeek;
        if (typeof dayOfWeekVal === "string") {
          const match = DAYS.find(
            (d) => d.label.toLowerCase() === (dayOfWeekVal as any).toLowerCase()
          );
          if (match !== undefined) {
            dayOfWeekVal = match.index;
          }
        }
        return {
          dayOfWeek: dayOfWeekVal,
          openAt: oh.isClosed ? "09:00" : (oh.openAt ? oh.openAt.substring(0, 5) : "09:00"),
          closeAt: oh.isClosed ? "17:00" : (oh.closeAt ? oh.closeAt.substring(0, 5) : "17:00"),
          isClosed: oh.isClosed ?? false,
        };
      });

      const payload: any = {
        purpose: isListed ? BranchPurpose.ListedForSale : BranchPurpose.Operational,
        branchName: currentBranch.branchName,
        branchDescription: currentBranch.branchDescription || undefined,
        ...(imageDeleted && !newImageFile
          ? { branchImageUrl: "" }
          : newImageFile
          ? { branchImageFile: newImageFile }
          : { branchImageUrl: currentBranch.branchImageUrl || undefined }),
        branchFacebookUrl: undefined,
        branchInstagramUrl: undefined,
        branchAddress: currentBranch.branchAddress,
        latitude: currentBranch.latitude !== undefined && currentBranch.latitude !== null ? Number(currentBranch.latitude) : undefined,
        longitude: currentBranch.longitude !== undefined && currentBranch.longitude !== null ? Number(currentBranch.longitude) : undefined,
        branchPhoneNumber: currentBranch.branchPhoneNumber,
        branchPhoneNumberAlt: currentBranch.branchPhoneNumberAlt || undefined,
        branchEmail: currentBranch.branchEmail || undefined,
        branchEmailAlt: currentBranch.branchEmailAlt || undefined,
        isOpen: currentBranch.isOpen,
        openingHours: isListed ? [] : cleanOpeningHours,
      };

      if (!isListed) {
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
          payload.branchUberApiKey = uberClientSecret.trim();
        }
        if (ddClientSecret && ddClientSecret !== "••••••••") {
          payload.branchDoorDashApiKey = ddClientSecret.trim();
        }
      } else {
        payload.saleListing = {
          listingDescription: currentBranch.saleListing?.listingDescription || "",
          includedPackageDescription: currentBranch.saleListing?.includedPackageDescription || "",
          inquiryPhone: currentBranch.saleListing?.inquiryPhone || undefined,
          highlights: currentBranch.saleListing?.highlights || [],
        };
      }

      await updateBranch({ id: resolvedParams.id, data: payload }).unwrap();
      toast.custom((t) => (
        <div className="flex gap-3 bg-transparent text-zinc-900 dark:text-zinc-50 w-full relative font-sans">
          <div className="flex-shrink-0 text-emerald-500 pt-0.5">
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l5-5z" clipRule="evenodd" />
            </svg>
          </div>
          
          <div className="flex-grow pr-6">
            <h4 className="font-semibold text-body leading-tight text-zinc-950 dark:text-zinc-50">
              &ldquo;{currentBranch.branchName}&rdquo; details updated
            </h4>
            <p className="text-caption text-zinc-500 dark:text-zinc-400 mt-1 leading-snug">
              Details have been successfully updated.
            </p>
            
            <div className="flex gap-3 mt-3">
              <button
                type="button"
                onClick={() => {
                  setIsEditingMode(false);
                  toast.dismiss(t);
                }}
                className="text-caption font-semibold text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors bg-transparent border-none cursor-pointer p-0"
              >
                View branch
              </button>
            </div>
          </div>
          
          <button
            type="button"
            onClick={() => toast.dismiss(t)}
            className="absolute right-3 top-3 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors border-none bg-transparent cursor-pointer p-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ));
      setIsEditingMode(false);
    } catch (error: any) {
      console.error("Update failed:", error);
      toast.error(error?.data?.message || "Failed to update branch");
    }
  };

  const handleDiscard = () => {
    if (branch) {
      setFormData(branch);
      setNewImageFile(null);
      setNewImagePreview("");
      setImageDeleted(false);

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
        setUberExternalStoreId("");
        setUberClientId("");
        setUberClientSecret("");
        setUberWebhookSecret("");
        setUberWebhookConnectionKey("");
        setUberEnvironment(0);
        setUberAutoAccept(true);
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
        setDdExternalStoreId("");
        setDdClientId("");
        setDdClientSecret("");
        setDdWebhookSecret("");
        setDdWebhookConnectionKey("");
        setDdEnvironment(0);
        setDdAutoAccept(true);
      }
    }
    setIsEditingMode(false);
    toast.info("Changes discarded.");
  };

  const getChangesCount = () => {
    let count = 0;
    if (!branch) return 0;

    if (formData.branchName !== undefined && formData.branchName !== branch.branchName) count++;
    if (formData.purpose !== undefined && formData.purpose !== branch.purpose) count++;

    const hasStringChanged = (val1: string | null | undefined, val2: string | null | undefined) => {
      return (val1 || "") !== (val2 || "");
    };

    if (formData.branchDescription !== undefined && hasStringChanged(formData.branchDescription, branch.branchDescription)) count++;
    if (formData.branchAddress !== undefined && hasStringChanged(formData.branchAddress, branch.branchAddress)) count++;
    if (formData.latitude !== undefined && formData.latitude !== branch.latitude) count++;
    if (formData.longitude !== undefined && formData.longitude !== branch.longitude) count++;
    if (formData.branchPhoneNumber !== undefined && hasStringChanged(formData.branchPhoneNumber, branch.branchPhoneNumber)) count++;
    if (formData.branchPhoneNumberAlt !== undefined && hasStringChanged(formData.branchPhoneNumberAlt, branch.branchPhoneNumberAlt)) count++;
    if (formData.branchEmail !== undefined && hasStringChanged(formData.branchEmail, branch.branchEmail)) count++;
    if (formData.branchEmailAlt !== undefined && hasStringChanged(formData.branchEmailAlt, branch.branchEmailAlt)) count++;

    if (formData.isOpen !== undefined && formData.isOpen !== branch.isOpen) count++;
    if (formData.isActive !== undefined && formData.isActive !== branch.isActive) count++;

    if (newImageFile !== null) count++;
    if (imageDeleted) count++;

    const origUber = branch.platformConnections?.find(
      (pc) => pc.platformCode === "UberEats" || (pc.platformCode as any) === 0
    );
    if (uberUrl !== (origUber?.storeUrl || "")) count++;
    if (uberExternalStoreId !== (origUber?.externalStoreId || "")) count++;
    if (uberClientId !== (origUber?.clientId || "")) count++;
    if (uberClientSecret !== "" && uberClientSecret !== (origUber?.isConfigured ? "••••••••" : "")) count++;
    if (uberWebhookSecret !== (origUber?.webhookSecret || "")) count++;
    if (uberWebhookConnectionKey !== (origUber?.webhookConnectionKey || "")) count++;
    const origUberEnv = origUber ? (origUber.environment === PlatformEnvironment.Production || (origUber.environment as any) === "Production" || (origUber.environment as any) === 1 ? 1 : 0) : 0;
    if (uberEnvironment !== origUberEnv) count++;
    if (uberAutoAccept !== (origUber?.autoAcceptOrders ?? true)) count++;

    const origDd = branch.platformConnections?.find(
      (pc) => pc.platformCode === "DoorDash" || (pc.platformCode as any) === 1
    );
    if (ddUrl !== (origDd?.storeUrl || "")) count++;
    if (ddExternalStoreId !== (origDd?.externalStoreId || "")) count++;
    if (ddClientId !== (origDd?.clientId || "")) count++;
    if (ddClientSecret !== "" && ddClientSecret !== (origDd?.isConfigured ? "••••••••" : "")) count++;
    if (ddWebhookSecret !== (origDd?.webhookSecret || "")) count++;
    if (ddWebhookConnectionKey !== (origDd?.webhookConnectionKey || "")) count++;
    const origDdEnv = origDd ? (origDd.environment === PlatformEnvironment.Production || (origDd.environment as any) === "Production" || (origDd.environment as any) === 1 ? 1 : 0) : 0;
    if (ddEnvironment !== origDdEnv) count++;
    if (ddAutoAccept !== (origDd?.autoAcceptOrders ?? true)) count++;

    if (formData.openingHours && branch.openingHours) {
      DAYS.forEach(({ index }) => {
        const origH = branch.openingHours?.find((h) => {
          const hDay = h.dayOfWeek as any;
          if (typeof hDay === "string") {
            const dayConfig = DAYS.find((d) => d.label.toLowerCase() === hDay.toLowerCase());
            return dayConfig?.index === index;
          }
          return hDay === index;
        });
        const currentH = formData.openingHours?.find((h) => {
          const hDay = h.dayOfWeek as any;
          if (typeof hDay === "string") {
            const dayConfig = DAYS.find((d) => d.label.toLowerCase() === hDay.toLowerCase());
            return dayConfig?.index === index;
          }
          return hDay === index;
        });

        const origOpen = origH?.isClosed ? "" : (origH?.openAt ? origH.openAt.substring(0, 5) : "");
        const currentOpen = currentH?.isClosed ? "" : (currentH?.openAt ? currentH.openAt.substring(0, 5) : "");
        const origClose = origH?.isClosed ? "" : (origH?.closeAt ? origH.closeAt.substring(0, 5) : "");
        const currentClose = currentH?.isClosed ? "" : (currentH?.closeAt ? currentH.closeAt.substring(0, 5) : "");
        const origClosed = origH?.isClosed ?? false;
        const currentClosed = currentH?.isClosed ?? false;

        if (origOpen !== currentOpen || origClose !== currentClose || origClosed !== currentClosed) {
          count++;
        }
      });
    }

    if (formData.saleListing) {
      if (hasStringChanged(formData.saleListing.listingDescription, branch.saleListing?.listingDescription)) count++;
      if (hasStringChanged(formData.saleListing.includedPackageDescription, branch.saleListing?.includedPackageDescription)) count++;
      if (hasStringChanged(formData.saleListing.inquiryPhone, branch.saleListing?.inquiryPhone)) count++;

      const origHighlights = branch.saleListing?.highlights || [];
      const currentHighlights = formData.saleListing.highlights || [];
      if (origHighlights.length !== currentHighlights.length || origHighlights.some((h, i) => h !== currentHighlights[i])) {
        count++;
      }
    }

    return count;
  };

  const handleHoursChange = (dayIndex: number, field: string, value: any) => {
    const hours = [...(formData.openingHours || [])];
    const index = hours.findIndex((h) => {
      const hDay = h.dayOfWeek as any;
      if (typeof hDay === "string") {
        const dayConfig = DAYS.find(
          (d) => d.label.toLowerCase() === hDay.toLowerCase()
        );
        return dayConfig?.index === dayIndex;
      }
      return hDay === dayIndex;
    });

    const updatedHours = index > -1 ? { ...hours[index] } : {
      dayOfWeek: dayIndex,
      openAt: "09:00",
      closeAt: "17:00",
      isActive: true,
      isClosed: false,
    };

    if (field === "isActive") {
      updatedHours.isActive = value;
      updatedHours.isClosed = !value;
    } else {
      (updatedHours as any)[field] = value;
    }

    if (index > -1) {
      hours[index] = updatedHours as any;
    } else {
      hours.push(updatedHours as any);
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
  const isListedForSale = currentBranch.purpose === BranchPurpose.ListedForSale || (currentBranch.purpose as any) === "ListedForSale";
  const activeImagePreview = newImagePreview || (!imageDeleted ? currentBranch.branchImageUrl : "");
  const changesCount = getChangesCount();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 w-full">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader
          className="flex-1"
          title={currentBranch.branchName}
          description="Manage branch settings, marketing listings, and delivery platforms"
          actions={
            canEdit && !isEditingMode ? (
              <Button onClick={() => setIsEditingMode(true)}>
                <TbEdit className="h-4 w-4 mr-2" />
                Edit Branch
              </Button>
            ) : null
          }
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
            className="relative rounded-none bg-transparent border-0 shadow-none px-4 pb-3 pt-2 text-body font-medium text-muted-foreground transition-colors hover:text-foreground data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:rounded-t-full after:bg-transparent data-[state=active]:after:bg-primary"
          >
            Products
          </TabsTrigger>
          <TabsTrigger
            value="uber-menus"
            className="relative rounded-none bg-transparent border-0 shadow-none px-4 pb-3 pt-2 text-body font-medium text-muted-foreground transition-colors hover:text-foreground data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:rounded-t-full after:bg-transparent data-[state=active]:after:bg-primary"
          >
            Uber Menus
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="m-0">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Core Information */}
              <Card>
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
                        disabled={!isSuper || !isEditingMode}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Branch Purpose</Label>
                      <Select
                        value={isListedForSale ? "1" : "0"}
                        onValueChange={(val) =>
                          setFormData({
                            ...formData,
                            purpose: parseInt(val) as BranchPurpose,
                          })
                        }
                        disabled={!isSuper || !isEditingMode}
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
                      disabled={!canEdit || !isEditingMode}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Branch Cover Image</Label>
                    {!isEditingMode ? (
                      activeImagePreview ? (
                        <div className="relative rounded-md border border-border overflow-hidden h-48 w-full max-w-md bg-muted/30">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={activeImagePreview}
                            alt="Branch Cover"
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="border border-dashed border-border rounded-md p-6 flex flex-col items-center justify-center gap-2 w-full max-w-md bg-muted/50 opacity-60">
                          <span className="text-caption text-muted-foreground font-semibold">No Image Uploaded</span>
                        </div>
                      )
                    ) : (
                      <ImageUploader
                        value={newImageFile || (!imageDeleted ? currentBranch.branchImageUrl : null)}
                        onChange={(val) => {
                          if (val instanceof File) {
                            setNewImageFile(val);
                            setNewImagePreview(URL.createObjectURL(val));
                            setImageDeleted(false);
                          } else {
                            setNewImageFile(null);
                            setNewImagePreview("");
                            setImageDeleted(true);
                          }
                        }}
                        disabled={!canEdit}
                        accept="image/*"
                        maxSizeMB={5}
                        helperText="Supports PNG, JPG, JPEG, GIF up to 5MB"
                        className="max-w-md"
                      />
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Location</Label>
                    <div className="flex gap-3 items-end">
                      <div className="space-y-2 flex-shrink-0">
                        <Label htmlFor="locationInputTypeMgr" className="text-caption text-muted-foreground">Location Type</Label>
                        <Select
                          value={locationInputType}
                          onValueChange={(val) => setLocationInputType(val as "Address" | "Coordinates")}
                          disabled={!isSuper || !isEditingMode}
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
                            disabled={!isSuper || !isEditingMode}
                          />
                        </div>
                      )}

                      {locationInputType === "Coordinates" && (
                        <div className="flex gap-3 flex-1">
                          <div className="space-y-2 flex-1">
                            <Label htmlFor="mgrLatitude" className="text-caption text-muted-foreground">Latitude</Label>
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
                              disabled={!isSuper || !isEditingMode}
                            />
                          </div>
                          <div className="space-y-2 flex-1">
                            <Label htmlFor="mgrLongitude" className="text-caption text-muted-foreground">Longitude</Label>
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
                              disabled={!isSuper || !isEditingMode}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contacts */}
              <Card>
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
                        disabled={!canEdit || !isEditingMode}
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
                        disabled={!canEdit || !isEditingMode}
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
                        disabled={!canEdit || !isEditingMode}
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
                        disabled={!canEdit || !isEditingMode}
                        placeholder="e.g. support@caffissimo.com"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Listed for Sale Sub-Form (Conditional) */}
              {isListedForSale && (
                <Card className="transition-all duration-300">
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
                        disabled={!canEdit || !isEditingMode}
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
                        disabled={!canEdit || !isEditingMode}
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
                        disabled={!canEdit || !isEditingMode}
                      />
                    </div>

                    <div className="space-y-3 pt-2">
                      <Label>Storefront Card Bullet Highlights</Label>
                      {(canEdit && isEditingMode) && (
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
                          <span className="text-body text-muted-foreground italic">
                            No highlights added yet. Add a few key bullet items.
                          </span>
                        ) : (
                          currentBranch.saleListing.highlights.map(
                            (hl, index) => (
                              <Badge
                                key={index}
                                variant="secondary"
                                className="px-3 py-1 flex items-center gap-1 text-caption"
                              >
                                {hl}
                                {(canEdit && isEditingMode) && (
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
                <Card className="transition-all duration-300">
                  <CardHeader>
                    <CardTitle>Operating Hours</CardTitle>
                    <CardDescription>
                      Set the opening hours for each day
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {DAYS.map(({ index, label }) => {
                        const hours = currentBranch.openingHours?.find((h) => {
                          const hDay = h.dayOfWeek as any;
                          if (typeof hDay === "string") {
                            const dayConfig = DAYS.find(
                              (d) => d.label.toLowerCase() === hDay.toLowerCase()
                            );
                            return dayConfig?.index === index;
                          }
                          return hDay === index;
                        });
                        const isOpen =
                          hours && !hours.isClosed && hours.isActive;
                        return (
                          <div
                            key={index}
                            className="flex items-center gap-4 border-b pb-3 last:border-0 last:pb-0"
                          >
                            <span className="w-24 text-body font-medium">
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
                                disabled={!isSuper || !isOpen || !isEditingMode}
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
                                disabled={!isSuper || !isOpen || !isEditingMode}
                                className="w-28"
                              />
                              <div className="flex items-center gap-2 ml-4">
                                <Switch
                                  checked={isOpen ?? false}
                                  onCheckedChange={(v) =>
                                    handleHoursChange(index, "isActive", v)
                                  }
                                  disabled={!isSuper || !isEditingMode}
                                />
                                <span className="text-body text-muted-foreground">
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
              {!isListedForSale && isSuper && (
                <Card className="transition-all duration-300">
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
                        <span className="font-semibold text-body">
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
                            disabled={!isSuper || !isEditingMode}
                            className="flex-1 bg-white dark:bg-[#141414]"
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
                          className="text-caption text-primary font-medium hover:underline flex items-center gap-1"
                        >
                          {showUberAdvanced
                            ? "Hide Advanced Credentials"
                            : "Show Advanced Credentials & API Keys"}
                        </button>
                      </div>

                      {showUberAdvanced && (
                        <div className="space-y-4 pt-3 border-t mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2 md:col-span-2">
                            <p className="text-caption text-muted-foreground">
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
                              disabled={!isSuper || !isEditingMode}
                              className="bg-white dark:bg-[#141414]"
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
                                disabled={!isSuper || !isEditingMode}
                                className="pr-10 bg-white dark:bg-[#141414]"
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
                              disabled={!isSuper || !isEditingMode}
                              className="bg-white dark:bg-[#141414]"
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
                              disabled={!isSuper || !isEditingMode}
                              className="bg-white dark:bg-[#141414]"
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
                              disabled={!isSuper || !isEditingMode}
                              className="bg-white dark:bg-[#141414]"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Environment</Label>
                            <select
                              value={uberEnvironment}
                              onChange={(e) =>
                                setUberEnvironment(parseInt(e.target.value))
                              }
                              disabled={!isSuper || !isEditingMode}
                              className="w-full h-10 px-3 border rounded-md bg-white dark:bg-[#141414] text-body"
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
                        <span className="font-semibold text-body">
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
                            disabled={!isSuper || !isEditingMode}
                            className="flex-1 bg-white dark:bg-[#141414]"
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
                          className="text-caption text-primary font-medium hover:underline flex items-center gap-1"
                        >
                          {showDdAdvanced
                            ? "Hide Advanced Credentials"
                            : "Show Advanced Credentials & API Keys"}
                        </button>
                      </div>

                      {showDdAdvanced && (
                        <div className="space-y-4 pt-3 border-t mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2 md:col-span-2">
                            <p className="text-caption text-muted-foreground">
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
                              disabled={!isSuper || !isEditingMode}
                              className="bg-white dark:bg-[#141414]"
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
                                disabled={!isSuper || !isEditingMode}
                                className="pr-10 bg-white dark:bg-[#141414]"
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
                              disabled={!isSuper || !isEditingMode}
                              className="bg-white dark:bg-[#141414]"
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
                              disabled={!isSuper || !isEditingMode}
                              className="bg-white dark:bg-[#141414]"
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
                              disabled={!isSuper || !isEditingMode}
                              className="bg-white dark:bg-[#141414]"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Environment</Label>
                            <select
                              value={ddEnvironment}
                              onChange={(e) =>
                                setDdEnvironment(parseInt(e.target.value))
                              }
                              disabled={!isSuper || !isEditingMode}
                              className="w-full h-10 px-3 border rounded-md bg-white dark:bg-[#141414] text-body"
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
              <Card>
                <CardHeader>
                  <CardTitle>Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Branch Open</Label>
                      <p className="text-body text-muted-foreground">
                        Toggle to open or close the branch
                      </p>
                    </div>
                    <Switch
                      checked={currentBranch.isOpen}
                      onCheckedChange={(v) =>
                        setFormData({ ...formData, isOpen: v })
                      }
                      disabled={!canEdit || !isEditingMode}
                    />
                  </div>
                  <div className="flex items-center justify-between border-t pt-4">
                    <div>
                      <Label>Active Status</Label>
                      <p className="text-body text-muted-foreground">
                        Toggle system-wide active status for this branch
                      </p>
                    </div>
                    <Switch
                      checked={currentBranch.isActive ?? true}
                      onCheckedChange={(v) =>
                        setFormData({ ...formData, isActive: v })
                      }
                      disabled={!isSuper || !isEditingMode}
                    />
                  </div>
                </CardContent>
              </Card>
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
    </div>
  );
}
