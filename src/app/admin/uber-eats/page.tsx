"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit,
  Eye,
  Loader2,
  Package,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Tags,
  Trash2,
  XCircle,
} from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { KPICard } from "@/components/shared/kpi-card";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { canAccessAdmin, canAccessAllBranches } from "@/lib/rbac";
import { cn, formatDateTime } from "@/lib/utils";
import { useGetBranchesQuery } from "@/stores/api/branchApi";
import {
  useCreateUberMenuMutation,
  useDeleteUberMenuMutation,
  useGetBranchProductsForUberQuery,
  useGetUberMenuByIdQuery,
  useGetUberMenusQuery,
  useSyncUberMenuMutation,
  useUpdateUberMenuMutation,
} from "@/stores/api/uberApi";
import { setSelectedBranchId as setGlobalSelectedBranchId } from "@/stores/slices/uiSlice";
import { useAppDispatch, useAppSelector } from "@/stores/store";
import {
  BranchProductCatalogItem,
  UberDayOfWeek,
  UberMenu,
  UberMenuSummary,
  UberMenuType,
  UserRole,
} from "@/types";

type Notice = {
  kind: "success" | "error";
  title: string;
  message: string;
};

type MenuFormState = {
  localMenuCode: string;
  menuName: string;
  description: string;
  currencyCode: string;
  menuType: UberMenuType;
  isActive: boolean;
  branchProductIds: string[];
  serviceAvailabilities: Array<{
    dayOfWeek: UberDayOfWeek;
    openAt: string;
    closeAt: string;
  }>;
};

const DAYS: UberDayOfWeek[] = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const DEFAULT_AVAILABILITY = DAYS.map((dayOfWeek) => ({
  dayOfWeek,
  openAt: "08:00",
  closeAt: "20:00",
}));

const EMPTY_MENU_FORM: MenuFormState = {
  localMenuCode: "",
  menuName: "",
  description: "",
  currencyCode: "AUD",
  menuType: "Delivery",
  isActive: true,
  branchProductIds: [],
  serviceAvailabilities: DEFAULT_AVAILABILITY,
};

const MENU_TYPES: Array<{ value: UberMenuType; label: string }> = [
  { value: "Delivery", label: "Delivery" },
  { value: "PickUp", label: "Pick up" },
  { value: "DineIn", label: "Dine in" },
];

function getApiErrorMessage(error: unknown) {
  const candidate = error as {
    data?: { message?: string } | string;
    error?: string;
  };

  if (typeof candidate.data === "string") return candidate.data;
  if (candidate.data?.message) return candidate.data.message;
  if (candidate.error) return candidate.error;
  if (error instanceof Error) return error.message;
  return "Request failed.";
}

function formatOptionalDate(value?: string) {
  if (!value) return "Never";
  return formatDateTime(value);
}

function formatMoney(value?: number, currencyCode = "AUD") {
  if (value === undefined || value === null) return "-";

  try {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: currencyCode || "AUD",
    }).format(value);
  } catch {
    return `${currencyCode} ${value.toFixed(2)}`;
  }
}

function productPrice(product: BranchProductCatalogItem) {
  const prices = product.variants
    .filter((variant) => variant.isActive !== false && variant.isAvailable)
    .map((variant) => variant.price);

  if (prices.length === 0) return "-";
  return formatMoney(Math.min(...prices));
}

function statusVariant(status?: string) {
  if (status === "Success") return "success" as const;
  if (status === "Pending") return "warning" as const;
  if (status === "Failed") return "destructive" as const;
  return "secondary" as const;
}

function statusIcon(status?: string) {
  if (status === "Success") return CheckCircle2;
  if (status === "Failed") return XCircle;
  if (status === "Pending") return Clock;
  return AlertTriangle;
}

function mapMenuDetailToForm(menu: UberMenu): MenuFormState {
  return {
    localMenuCode: menu.localMenuCode ?? "",
    menuName: menu.menuName,
    description: menu.description ?? "",
    currencyCode: menu.currencyCode ?? "AUD",
    menuType: menu.menuType,
    isActive: menu.isActive,
    branchProductIds: menu.items
      .map((item) => item.branchProductId)
      .filter((id): id is string => Boolean(id)),
    serviceAvailabilities:
      menu.serviceAvailabilities.length > 0
        ? menu.serviceAvailabilities.map((availability) => ({
            dayOfWeek: availability.dayOfWeek,
            openAt: availability.openAt,
            closeAt: availability.closeAt,
          }))
        : DEFAULT_AVAILABILITY,
  };
}

function ActionButton({
  children,
  disabled,
  loading,
  onClick,
  variant = "outline",
}: {
  children: ReactNode;
  disabled?: boolean;
  loading?: boolean;
  onClick: () => void;
  variant?: "default" | "outline" | "ghost" | "destructive";
}) {
  return (
    <Button
      type="button"
      variant={variant}
      size="sm"
      disabled={disabled || loading}
      onClick={onClick}
      className="h-8"
    >
      {loading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
      {children}
    </Button>
  );
}

export default function UberEatsPage() {
  const dispatch = useAppDispatch();
  const currentRole =
    useAppSelector((state) => state.auth.user?.role) || UserRole.Cashier;
  const assignedBranchId =
    useAppSelector((state) => state.auth.user?.branchId) || null;
  const persistedSelectedBranchId = useAppSelector(
    (state) => state.ui.selectedBranchId,
  );

  const canUseUberTools = canAccessAdmin(currentRole);
  const canUseAllBranches = canAccessAllBranches(currentRole);

  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [menuPage, setMenuPage] = useState(1);
  const [menuSearch, setMenuSearch] = useState("");
  const [branchProductSearch, setBranchProductSearch] = useState("");
  const [menuActiveFilter, setMenuActiveFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [notice, setNotice] = useState<Notice | null>(null);
  const [menuDialogOpen, setMenuDialogOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<UberMenuSummary | null>(null);
  const [viewingMenu, setViewingMenu] = useState<UberMenuSummary | null>(null);
  const [viewMenuDialogOpen, setViewMenuDialogOpen] = useState(false);
  const [menuForm, setMenuForm] = useState<MenuFormState>(EMPTY_MENU_FORM);
  const [workingActionId, setWorkingActionId] = useState<string | null>(null);

  const { data: branchesData, isLoading: branchesLoading } = useGetBranchesQuery({
    page: 1,
    pageSize: 100,
  });

  const branchOptions = useMemo(() => {
    const branches = branchesData?.items ?? [];
    if (canUseAllBranches) return branches;
    if (!assignedBranchId) return [];
    return branches.filter((branch) => branch.branchId === assignedBranchId);
  }, [assignedBranchId, branchesData?.items, canUseAllBranches]);

  useEffect(() => {
    if (branchOptions.length === 0) return;
    if (
      selectedBranchId &&
      branchOptions.some((branch) => branch.branchId === selectedBranchId)
    ) {
      return;
    }

    const persistedBranch = branchOptions.find(
      (branch) => branch.branchId === persistedSelectedBranchId,
    );
    const assignedBranch = assignedBranchId
      ? branchOptions.find((branch) => branch.branchId === assignedBranchId)
      : undefined;
    const nextBranchId =
      (!canUseAllBranches && assignedBranch?.branchId) ||
      persistedBranch?.branchId ||
      branchOptions[0].branchId;

    setSelectedBranchId(nextBranchId);
    dispatch(setGlobalSelectedBranchId(nextBranchId));
  }, [
    assignedBranchId,
    branchOptions,
    canUseAllBranches,
    dispatch,
    persistedSelectedBranchId,
    selectedBranchId,
  ]);

  const selectedBranch = branchOptions.find(
    (branch) => branch.branchId === selectedBranchId,
  );

  const { data: menusData, isFetching: menusFetching } = useGetUberMenusQuery(
    {
      page: menuPage,
      pageSize: 8,
      branchId: selectedBranchId,
      search: menuSearch || undefined,
      isActive:
        menuActiveFilter === "all" ? undefined : menuActiveFilter === "active",
    },
    { skip: !selectedBranchId || !canUseUberTools },
  );

  const { data: branchProductsData, isFetching: branchProductsFetching } =
    useGetBranchProductsForUberQuery(
      {
        page: 1,
        pageSize: 100,
        branchId: selectedBranchId,
        search: branchProductSearch || undefined,
        isActive: true,
        isAvailable: true,
      },
      { skip: !selectedBranchId || !canUseUberTools },
    );

  const { data: editingMenuDetail, isFetching: editingMenuFetching } =
    useGetUberMenuByIdQuery(
      editingMenu
        ? { id: editingMenu.uberMenuId, branchId: editingMenu.branchId }
        : { id: "", branchId: "" },
      { skip: !editingMenu || !menuDialogOpen },
    );

  const { data: viewingMenuDetail, isFetching: viewingMenuFetching } =
    useGetUberMenuByIdQuery(
      viewingMenu
        ? { id: viewingMenu.uberMenuId, branchId: viewingMenu.branchId }
        : { id: "", branchId: "" },
      { skip: !viewingMenu || !viewMenuDialogOpen },
    );

  const [createUberMenu, { isLoading: creatingMenu }] =
    useCreateUberMenuMutation();
  const [updateUberMenu, { isLoading: updatingMenu }] =
    useUpdateUberMenuMutation();
  const [deleteUberMenu] = useDeleteUberMenuMutation();
  const [syncUberMenu] = useSyncUberMenuMutation();

  const menus = menusData?.items ?? [];
  const branchProducts = branchProductsData?.items ?? [];
  const selectedProductIds = useMemo(
    () => new Set(menuForm.branchProductIds),
    [menuForm.branchProductIds],
  );
  const syncedMenuCount = menus.filter(
    (menu) => menu.lastSyncStatus === "Success",
  ).length;
  const failedMenuCount = menus.filter(
    (menu) => menu.lastSyncStatus === "Failed",
  ).length;

  useEffect(() => {
    if (!editingMenuDetail || !menuDialogOpen) return;
    setMenuForm(mapMenuDetailToForm(editingMenuDetail));
  }, [editingMenuDetail, menuDialogOpen]);

  const updateSelectedBranch = (branchId: string) => {
    setSelectedBranchId(branchId);
    setMenuPage(1);
    dispatch(setGlobalSelectedBranchId(branchId));
  };

  const openCreateMenuDialog = () => {
    setEditingMenu(null);
    setMenuForm({
      ...EMPTY_MENU_FORM,
      branchProductIds: [],
      serviceAvailabilities: DEFAULT_AVAILABILITY,
    });
    setMenuDialogOpen(true);
  };

  const openEditMenuDialog = (menu: UberMenuSummary) => {
    setEditingMenu(menu);
    setMenuForm({
      ...EMPTY_MENU_FORM,
      localMenuCode: menu.localMenuCode ?? "",
      menuName: menu.menuName,
      menuType: menu.menuType,
      isActive: menu.isActive,
    });
    setMenuDialogOpen(true);
  };

  const openViewMenuDialog = (menu: UberMenuSummary) => {
    setViewingMenu(menu);
    setViewMenuDialogOpen(true);
  };

  const toggleBranchProduct = (branchProductId: string, checked: boolean) => {
    setMenuForm((current) => {
      const currentIds = new Set(current.branchProductIds);
      if (checked) {
        currentIds.add(branchProductId);
      } else {
        currentIds.delete(branchProductId);
      }

      return { ...current, branchProductIds: Array.from(currentIds) };
    });
  };

  const toggleAvailability = (dayOfWeek: UberDayOfWeek, enabled: boolean) => {
    setMenuForm((current) => {
      if (enabled) {
        const existing = current.serviceAvailabilities.find(
          (item) => item.dayOfWeek === dayOfWeek,
        );
        if (existing) return current;
        return {
          ...current,
          serviceAvailabilities: [
            ...current.serviceAvailabilities,
            { dayOfWeek, openAt: "08:00", closeAt: "20:00" },
          ],
        };
      }

      return {
        ...current,
        serviceAvailabilities: current.serviceAvailabilities.filter(
          (item) => item.dayOfWeek !== dayOfWeek,
        ),
      };
    });
  };

  const updateAvailabilityTime = (
    dayOfWeek: UberDayOfWeek,
    field: "openAt" | "closeAt",
    value: string,
  ) => {
    setMenuForm((current) => ({
      ...current,
      serviceAvailabilities: current.serviceAvailabilities.map((item) =>
        item.dayOfWeek === dayOfWeek ? { ...item, [field]: value } : item,
      ),
    }));
  };

  const validateMenuForm = () => {
    if (!selectedBranchId) return "Select a branch.";
    if (!menuForm.menuName.trim()) return "Menu name is required.";
    if (menuForm.branchProductIds.length === 0) {
      return "Select at least one branch product.";
    }
    if (menuForm.serviceAvailabilities.length === 0) {
      return "Select at least one service day.";
    }
    if (
      menuForm.serviceAvailabilities.some((item) => item.closeAt <= item.openAt)
    ) {
      return "Each service day must close after it opens.";
    }
    return null;
  };

  const handleSaveMenu = async () => {
    const validation = validateMenuForm();
    if (validation) {
      setNotice({
        kind: "error",
        title: "Check the menu",
        message: validation,
      });
      return;
    }

    const sharedPayload = {
      localMenuCode: menuForm.localMenuCode.trim() || undefined,
      menuName: menuForm.menuName.trim(),
      description: menuForm.description.trim() || undefined,
      currencyCode: menuForm.currencyCode.trim().toUpperCase() || "AUD",
      menuType: menuForm.menuType,
      branchProductIds: menuForm.branchProductIds,
      itemCustomizations: [],
      serviceAvailabilities: menuForm.serviceAvailabilities,
    };

    try {
      if (editingMenu) {
        await updateUberMenu({
          id: editingMenu.uberMenuId,
          data: {
            ...sharedPayload,
            branchId: editingMenu.branchId,
            isActive: menuForm.isActive,
          },
        }).unwrap();
      } else {
        await createUberMenu({
          ...sharedPayload,
          branchId: selectedBranchId,
          platformCode: "UberEats",
        }).unwrap();
      }

      setMenuDialogOpen(false);
      setEditingMenu(null);
      setNotice({
        kind: "success",
        title: editingMenu ? "Menu updated" : "Menu created",
        message: "Uber Eats menu configuration was saved.",
      });
    } catch (error) {
      setNotice({
        kind: "error",
        title: "Menu save failed",
        message: getApiErrorMessage(error),
      });
    }
  };

  const handleMenuSync = async (menu: UberMenuSummary) => {
    setWorkingActionId(`menu-sync-${menu.uberMenuId}`);
    try {
      const result = await syncUberMenu({
        id: menu.uberMenuId,
        branchId: menu.branchId,
      }).unwrap();
      setNotice({
        kind: result.syncStatus === "Success" ? "success" : "error",
        title: result.syncStatus === "Success" ? "Menu synced" : "Sync failed",
        message: result.message,
      });
    } catch (error) {
      setNotice({
        kind: "error",
        title: "Sync failed",
        message: getApiErrorMessage(error),
      });
    } finally {
      setWorkingActionId(null);
    }
  };

  const handleMenuDelete = async (menu: UberMenuSummary) => {
    const confirmed = window.confirm(`Delete ${menu.menuName}?`);
    if (!confirmed) return;

    setWorkingActionId(`menu-delete-${menu.uberMenuId}`);
    try {
      await deleteUberMenu({
        id: menu.uberMenuId,
        branchId: menu.branchId,
      }).unwrap();
      setNotice({
        kind: "success",
        title: "Menu deleted",
        message: menu.menuName,
      });
    } catch (error) {
      setNotice({
        kind: "error",
        title: "Delete failed",
        message: getApiErrorMessage(error),
      });
    } finally {
      setWorkingActionId(null);
    }
  };

  if (!canUseUberTools) {
    return (
      <div className="space-y-6">
        <PageHeader title="Uber Eats" />
        <Card>
          <CardContent className="p-10">
            <EmptyState
              icon={AlertTriangle}
              title="Access denied"
              description="You don't have permission to view Uber Eats management"
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Uber Eats"
        description="Menu catalog sync for Uber Eats stores"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline">
              <Link href="/admin/uber-eats/orders">
                <Clock className="mr-2 h-4 w-4" />
                Orders
              </Link>
            </Button>
            <Select
              value={selectedBranchId}
              onValueChange={updateSelectedBranch}
              disabled={branchesLoading || branchOptions.length === 0}
            >
              <SelectTrigger className="h-9 w-[220px]">
                <SelectValue placeholder="Select branch" />
              </SelectTrigger>
              <SelectContent>
                {branchOptions.map((branch) => (
                  <SelectItem key={branch.branchId} value={branch.branchId}>
                    {branch.branchName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={openCreateMenuDialog} disabled={!selectedBranchId}>
              <Plus className="mr-2 h-4 w-4" />
              Menu
            </Button>
          </div>
        }
      />

      {notice ? (
        <div
          className={cn(
            "flex items-start justify-between gap-3 rounded-lg border px-4 py-3 text-sm",
            notice.kind === "success"
              ? "border-[#10b981]/30 bg-[#10b981]/8 text-[#0d9668] dark:text-[#5cd5c8]"
              : "border-destructive/30 bg-destructive/8 text-destructive",
          )}
        >
          <div>
            <p className="font-medium">{notice.title}</p>
            <p className="mt-0.5 opacity-80">{notice.message}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2"
            onClick={() => setNotice(null)}
          >
            Dismiss
          </Button>
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-3">
        <KPICard
          title="Menus"
          value={menusData?.totalCount ?? 0}
          subtitle={selectedBranch?.branchName}
          icon={Package}
          isLoading={menusFetching && !menusData}
        />
        <KPICard
          title="Synced Menus"
          value={syncedMenuCount}
          subtitle={`${failedMenuCount} failed`}
          icon={CheckCircle2}
          isLoading={menusFetching && !menusData}
        />
        <KPICard
          title="Catalog Items"
          value={branchProductsData?.totalCount ?? 0}
          subtitle="Active available products"
          icon={Tags}
          isLoading={branchProductsFetching && !branchProductsData}
        />
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-3 pb-3">
          <div>
            <CardTitle className="text-base">Local Menus</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              Manage menu payloads that sync to Uber Eats.
            </p>
          </div>
          <Badge variant="uber">Uber Eats</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Select
              value={menuActiveFilter}
              onValueChange={(value) => {
                setMenuActiveFilter(value as "all" | "active" | "inactive");
                setMenuPage(1);
              }}
            >
              <SelectTrigger className="h-9 w-[145px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All menus</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative w-full sm:w-[260px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={menuSearch}
                onChange={(event) => {
                  setMenuSearch(event.target.value);
                  setMenuPage(1);
                }}
                placeholder="Search menus"
                className="h-9 pl-9"
              />
            </div>
          </div>

          <div className="rounded-lg border">
            {menusFetching && !menusData ? (
              <div className="space-y-2 p-4">
                {[1, 2, 3, 4].map((item) => (
                  <Skeleton key={item} className="h-14 w-full" />
                ))}
              </div>
            ) : menus.length === 0 ? (
              <div className="p-10">
                <EmptyState
                  icon={Package}
                  title="No Uber menus"
                  description="Create a menu mapping for this branch"
                  action={
                    <Button onClick={openCreateMenuDialog}>
                      <Plus className="mr-2 h-4 w-4" />
                      Menu
                    </Button>
                  }
                />
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Menu</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Sync</TableHead>
                        <TableHead>External ID</TableHead>
                        <TableHead>Active</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {menus.map((menu) => {
                        const StatusIcon = statusIcon(menu.lastSyncStatus);
                        return (
                          <TableRow key={menu.uberMenuId}>
                            <TableCell>
                              <div className="space-y-1">
                                <p className="font-medium">{menu.menuName}</p>
                                <p className="text-xs text-muted-foreground">
                                  {menu.localMenuCode || "No local code"}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">{menu.menuType}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Badge variant={statusVariant(menu.lastSyncStatus)}>
                                  <StatusIcon className="mr-1 h-3 w-3" />
                                  {menu.lastSyncStatus || "Not synced"}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {formatOptionalDate(menu.lastSyncedAt)}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {menu.externalMenuId || "-"}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={menu.isActive ? "success" : "secondary"}
                              >
                                {menu.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex justify-end gap-2">
                                <ActionButton
                                  variant="ghost"
                                  onClick={() => openViewMenuDialog(menu)}
                                >
                                  <Eye className="mr-1.5 h-3.5 w-3.5" />
                                  View
                                </ActionButton>
                                <ActionButton
                                  onClick={() => openEditMenuDialog(menu)}
                                >
                                  <Edit className="mr-1.5 h-3.5 w-3.5" />
                                  Edit
                                </ActionButton>
                                <ActionButton
                                  loading={
                                    workingActionId ===
                                    `menu-sync-${menu.uberMenuId}`
                                  }
                                  onClick={() => handleMenuSync(menu)}
                                >
                                  <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                                  Sync
                                </ActionButton>
                                <ActionButton
                                  variant="ghost"
                                  loading={
                                    workingActionId ===
                                    `menu-delete-${menu.uberMenuId}`
                                  }
                                  onClick={() => handleMenuDelete(menu)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </ActionButton>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
                <div className="flex items-center justify-between border-t px-4 py-3">
                  <p className="text-sm text-muted-foreground">
                    {menusData?.totalCount ?? 0} menus
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      disabled={menuPage <= 1}
                      onClick={() => setMenuPage((page) => page - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm">
                      {menuPage} / {menusData?.totalPages || 1}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      disabled={menuPage >= (menusData?.totalPages || 1)}
                      onClick={() => setMenuPage((page) => page + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={menuDialogOpen}
        onOpenChange={(open) => {
          setMenuDialogOpen(open);
          if (!open) setEditingMenu(null);
        }}
      >
        <DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingMenu ? "Edit Uber Eats Menu" : "Create Uber Eats Menu"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            {editingMenuFetching ? (
              <div className="space-y-3">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-48 w-full" />
              </div>
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Menu Name</Label>
                    <Input
                      value={menuForm.menuName}
                      onChange={(event) =>
                        setMenuForm((current) => ({
                          ...current,
                          menuName: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Local Menu Code</Label>
                    <Input
                      value={menuForm.localMenuCode}
                      onChange={(event) =>
                        setMenuForm((current) => ({
                          ...current,
                          localMenuCode: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Menu Type</Label>
                    <Select
                      value={menuForm.menuType}
                      onValueChange={(value) =>
                        setMenuForm((current) => ({
                          ...current,
                          menuType: value as UberMenuType,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MENU_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Currency Code</Label>
                    <Input
                      value={menuForm.currencyCode}
                      maxLength={10}
                      onChange={(event) =>
                        setMenuForm((current) => ({
                          ...current,
                          currencyCode: event.target.value.toUpperCase(),
                        }))
                      }
                    />
                  </div>
                  {editingMenu ? (
                    <div className="space-y-2">
                      <Label>Active</Label>
                      <Select
                        value={menuForm.isActive ? "true" : "false"}
                        onValueChange={(value) =>
                          setMenuForm((current) => ({
                            ...current,
                            isActive: value === "true",
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Active</SelectItem>
                          <SelectItem value="false">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ) : null}
                  <div className="space-y-2 md:col-span-2">
                    <Label>Description</Label>
                    <Textarea
                      value={menuForm.description}
                      onChange={(event) =>
                        setMenuForm((current) => ({
                          ...current,
                          description: event.target.value,
                        }))
                      }
                      rows={3}
                    />
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
                  <div className="rounded-lg border">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b p-3">
                      <div>
                        <p className="font-medium">Branch Products</p>
                        <p className="text-xs text-muted-foreground">
                          {menuForm.branchProductIds.length} selected
                        </p>
                      </div>
                      <div className="relative w-full sm:w-[240px]">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          value={branchProductSearch}
                          onChange={(event) =>
                            setBranchProductSearch(event.target.value)
                          }
                          placeholder="Search products"
                          className="h-9 pl-9"
                        />
                      </div>
                    </div>
                    <div className="max-h-[360px] overflow-y-auto p-2">
                      {branchProductsFetching ? (
                        <div className="space-y-2 p-2">
                          {[1, 2, 3, 4].map((item) => (
                            <Skeleton key={item} className="h-12 w-full" />
                          ))}
                        </div>
                      ) : branchProducts.length === 0 ? (
                        <div className="p-8">
                          <EmptyState
                            icon={Package}
                            title="No branch products"
                            description="No active available products found"
                          />
                        </div>
                      ) : (
                        branchProducts.map((product) => (
                          <label
                            key={product.branchProductId}
                            className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-accent"
                          >
                            <Checkbox
                              checked={selectedProductIds.has(
                                product.branchProductId,
                              )}
                              onCheckedChange={(checked) =>
                                toggleBranchProduct(
                                  product.branchProductId,
                                  checked === true,
                                )
                              }
                            />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium">
                                {product.productName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {product.variants.length} variants |{" "}
                                {productPrice(product)}
                              </p>
                            </div>
                            <Badge
                              variant={product.isAvailable ? "success" : "secondary"}
                            >
                              {product.isAvailable ? "Available" : "Hidden"}
                            </Badge>
                          </label>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="rounded-lg border">
                    <div className="border-b p-3">
                      <p className="font-medium">Service Hours</p>
                      <p className="text-xs text-muted-foreground">
                        {menuForm.serviceAvailabilities.length} days
                      </p>
                    </div>
                    <div className="space-y-2 p-3">
                      {DAYS.map((day) => {
                        const availability = menuForm.serviceAvailabilities.find(
                          (item) => item.dayOfWeek === day,
                        );
                        const enabled = Boolean(availability);

                        return (
                          <div
                            key={day}
                            className="grid grid-cols-[92px_1fr_1fr] items-center gap-2"
                          >
                            <label className="flex items-center gap-2 text-sm">
                              <Checkbox
                                checked={enabled}
                                onCheckedChange={(checked) =>
                                  toggleAvailability(day, checked === true)
                                }
                              />
                              {day.slice(0, 3)}
                            </label>
                            <Input
                              type="time"
                              value={availability?.openAt ?? "08:00"}
                              disabled={!enabled}
                              onChange={(event) =>
                                updateAvailabilityTime(
                                  day,
                                  "openAt",
                                  event.target.value,
                                )
                              }
                            />
                            <Input
                              type="time"
                              value={availability?.closeAt ?? "20:00"}
                              disabled={!enabled}
                              onChange={(event) =>
                                updateAvailabilityTime(
                                  day,
                                  "closeAt",
                                  event.target.value,
                                )
                              }
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setMenuDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveMenu}
              disabled={creatingMenu || updatingMenu || editingMenuFetching}
            >
              {creatingMenu || updatingMenu ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Settings className="mr-2 h-4 w-4" />
              )}
              {editingMenu ? "Save Menu" : "Create Menu"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={viewMenuDialogOpen}
        onOpenChange={(open) => {
          setViewMenuDialogOpen(open);
          if (!open) setViewingMenu(null);
        }}
      >
        <DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewingMenu?.menuName || "Menu"}</DialogTitle>
          </DialogHeader>

          {viewingMenuFetching || !viewingMenuDetail ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : (
            <div className="space-y-5">
              <div className="grid gap-3 md:grid-cols-4">
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Type</p>
                  <p className="mt-1 font-medium">{viewingMenuDetail.menuType}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Items</p>
                  <p className="mt-1 font-medium">
                    {viewingMenuDetail.items.length}
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Categories</p>
                  <p className="mt-1 font-medium">
                    {viewingMenuDetail.categories.length}
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Modifiers</p>
                  <p className="mt-1 font-medium">
                    {viewingMenuDetail.modifierGroups.reduce(
                      (count, group) => count + group.modifiers.length,
                      0,
                    )}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
                <div className="space-y-4">
                  <div className="rounded-lg border">
                    <div className="flex flex-wrap items-start justify-between gap-3 border-b p-3">
                      <div>
                        <p className="font-medium">Menu Items</p>
                        <p className="text-xs text-muted-foreground">
                          {viewingMenuDetail.localMenuCode || "No local code"}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant={statusVariant(viewingMenuDetail.lastSyncStatus)}>
                          {viewingMenuDetail.lastSyncStatus || "Not synced"}
                        </Badge>
                        <Badge
                          variant={
                            viewingMenuDetail.isActive ? "success" : "secondary"
                          }
                        >
                          {viewingMenuDetail.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                    {viewingMenuDetail.items.length === 0 ? (
                      <div className="p-8">
                        <EmptyState
                          icon={Package}
                          title="No items"
                          description="This menu has no mapped products"
                        />
                      </div>
                    ) : (
                      <div className="max-h-[420px] overflow-y-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Item</TableHead>
                              <TableHead>Price</TableHead>
                              <TableHead>Reference</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {viewingMenuDetail.items.map((item) => (
                              <TableRow key={item.uberMenuItemId}>
                                <TableCell>
                                  <div>
                                    <p className="font-medium">
                                      {item.displayName}
                                    </p>
                                    <p className="max-w-[360px] truncate text-xs text-muted-foreground">
                                      {item.description || item.branchProductId}
                                    </p>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {formatMoney(
                                    item.price,
                                    viewingMenuDetail.currencyCode,
                                  )}
                                </TableCell>
                                <TableCell className="font-mono text-xs">
                                  {item.externalReferenceId || "-"}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>

                  <div className="rounded-lg border">
                    <div className="border-b p-3">
                      <p className="font-medium">Modifier Groups</p>
                    </div>
                    {viewingMenuDetail.modifierGroups.length === 0 ? (
                      <div className="p-6 text-sm text-muted-foreground">
                        No modifiers
                      </div>
                    ) : (
                      <div className="grid gap-3 p-3 md:grid-cols-2">
                        {viewingMenuDetail.modifierGroups.map((group) => (
                          <div
                            key={group.uberMenuModifierGroupId}
                            className="rounded-lg border p-3"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="font-medium">{group.displayName}</p>
                                <p className="text-xs text-muted-foreground">
                                  {group.minSelections}-{group.maxSelections}{" "}
                                  selections
                                </p>
                              </div>
                              <Badge
                                variant={group.isRequired ? "warning" : "secondary"}
                              >
                                {group.isRequired ? "Required" : "Optional"}
                              </Badge>
                            </div>
                            <div className="mt-3 space-y-2">
                              {group.modifiers.map((modifier) => (
                                <div
                                  key={modifier.uberMenuModifierId}
                                  className="flex items-center justify-between gap-3 text-sm"
                                >
                                  <span className="truncate">
                                    {modifier.displayName}
                                  </span>
                                  <span className="font-medium">
                                    {formatMoney(
                                      modifier.price,
                                      viewingMenuDetail.currencyCode,
                                    )}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-lg border">
                    <div className="border-b p-3">
                      <p className="font-medium">Service Hours</p>
                    </div>
                    <div className="space-y-2 p-3">
                      {viewingMenuDetail.serviceAvailabilities.map(
                        (availability) => (
                          <div
                            key={`${availability.dayOfWeek}-${availability.openAt}-${availability.closeAt}`}
                            className="flex items-center justify-between gap-3 rounded-md bg-muted/40 px-3 py-2 text-sm"
                          >
                            <span>{availability.dayOfWeek}</span>
                            <span className="font-medium">
                              {availability.openAt} - {availability.closeAt}
                            </span>
                          </div>
                        ),
                      )}
                    </div>
                  </div>

                  <div className="rounded-lg border">
                    <div className="border-b p-3">
                      <p className="font-medium">Categories</p>
                    </div>
                    <div className="flex flex-wrap gap-2 p-3">
                      {viewingMenuDetail.categories.length === 0 ? (
                        <span className="text-sm text-muted-foreground">
                          No categories
                        </span>
                      ) : (
                        viewingMenuDetail.categories.map((category) => (
                          <Badge
                            key={category.uberMenuCategoryId}
                            variant="secondary"
                          >
                            {category.displayName}
                          </Badge>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
