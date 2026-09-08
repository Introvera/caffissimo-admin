"use client";

import { useState, useMemo } from "react";
import { format, parseISO } from "date-fns";
import {
  Calendar,
  Plus,
  Trash2,
  Sparkles,
  Search,
  PartyPopper,
  Heart,
  Egg,
  Skull,
  Gift,
  HelpCircle,
  RefreshCw,
  Image as ImageIcon,
} from "lucide-react";
import { TbDotsVertical, TbEdit } from "react-icons/tb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useGetSpecialDaysQuery,
  useGetSpecialDayCategoriesQuery,
  useCreateSpecialDayMutation,
  useUpdateSpecialDayMutation,
  useDeleteSpecialDayMutation,
} from "@/stores/api/specialDayApi";
import { ImageUploader } from "@/components/ui/image-uploader";
import { useAppSelector } from "@/stores/store";
import { canManageSpecialDays } from "@/lib/rbac";
import { SpecialDayCategory, CreateSpecialDayRequest, UpdateSpecialDayRequest } from "@/types";
import { toast } from "sonner";
import { motion } from "framer-motion";

const CATEGORY_CONFIG: Record<
  SpecialDayCategory,
  {
    icon: React.ElementType;
    label: string;
  }
> = {
  newyear: {
    icon: PartyPopper,
    label: "New Year",
  },
  valentines: {
    icon: Heart,
    label: "Valentine's Day",
  },
  easter: {
    icon: Egg,
    label: "Easter",
  },
  halloween: {
    icon: Skull,
    label: "Halloween",
  },
  christmas: {
    icon: Gift,
    label: "Christmas",
  },
  other: {
    icon: Sparkles,
    label: "Special Day",
  },
};

export default function SpecialDaysPage() {
  const currentRole = useAppSelector((state) => state.auth.user?.role);
  const isManager = canManageSpecialDays(currentRole);

  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterActive, setFilterActive] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  // Dialog States
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSpecialDayId, setEditingSpecialDayId] = useState<string | null>(null);

  // Form States
  const [category, setCategory] = useState<SpecialDayCategory>("newyear");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [backgroundImage, setBackgroundImage] = useState("");
  const [backgroundImageFile, setBackgroundImageFile] = useState<File | null>(null);
  const [mobileBackgroundImage, setMobileBackgroundImage] = useState("");
  const [mobileBackgroundImageFile, setMobileBackgroundImageFile] = useState<File | null>(null);
  const [isActive, setIsActive] = useState(true);

  const PAGE_SIZE = 9;

  // API Calls
  const { data, isLoading } = useGetSpecialDaysQuery({
    page,
    pageSize: PAGE_SIZE,
    isActive: filterActive === "active" ? true : filterActive === "inactive" ? false : undefined,
    category: filterCategory !== "all" ? filterCategory : undefined,
    sortBy: "startdate",
    sortDescending: false,
  });

  const { data: backendCategories } = useGetSpecialDayCategoriesQuery();

  const [createSpecialDay, { isLoading: isCreating }] = useCreateSpecialDayMutation();
  const [updateSpecialDay, { isLoading: isUpdating }] = useUpdateSpecialDayMutation();
  const [deleteSpecialDay] = useDeleteSpecialDayMutation();

  const specialDays = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;

  // Search filter
  const filteredSpecialDays = useMemo(() => {
    if (!searchTerm.trim()) return specialDays;
    const query = searchTerm.toLowerCase();
    return specialDays.filter((day) => {
      const config = CATEGORY_CONFIG[day.category as SpecialDayCategory] || CATEGORY_CONFIG.other;
      return (
        config.label.toLowerCase().includes(query) ||
        day.category.toLowerCase().includes(query)
      );
    });
  }, [specialDays, searchTerm]);

  // Open creation modal
  const handleOpenCreate = () => {
    setEditingSpecialDayId(null);
    setCategory("newyear");
    setStartDate("");
    setEndDate("");
    setBackgroundImage("");
    setBackgroundImageFile(null);
    setMobileBackgroundImage("");
    setMobileBackgroundImageFile(null);
    setIsActive(true);
    setDialogOpen(true);
  };

  // Open edit modal
  const handleOpenEdit = (day: any) => {
    setEditingSpecialDayId(day.specialDayId);
    setCategory(day.category as SpecialDayCategory);
    setStartDate(format(parseISO(day.startDate), "yyyy-MM-dd'T'HH:mm"));
    setEndDate(format(parseISO(day.endDate), "yyyy-MM-dd'T'HH:mm"));
    setBackgroundImage(day.backgroundImage);
    setBackgroundImageFile(null);
    setMobileBackgroundImage(day.mobileBackgroundImage || "");
    setMobileBackgroundImageFile(null);
    setIsActive(day.isActive);
    setDialogOpen(true);
  };

  // Save changes
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!startDate || !endDate) {
      toast.error("Please fill in both start and end dates.");
      return;
    }

    if (new Date(endDate) <= new Date(startDate)) {
      toast.error("End date must be after the start date.");
      return;
    }

    if (!backgroundImage.trim() && !backgroundImageFile) {
      toast.error("Background image is required.");
      return;
    }

    try {
      if (backgroundImage.trim()) {
        const url = new URL(backgroundImage);
        if (url.protocol !== "http:" && url.protocol !== "https:") {
          throw new Error();
        }
      }
    } catch {
      toast.error("Please enter a valid HTTP/HTTPS background image URL.");
      return;
    }

    try {
      if (editingSpecialDayId) {
        const payload: UpdateSpecialDayRequest = {
          category,
          startDate: new Date(startDate).toISOString(),
          endDate: new Date(endDate).toISOString(),
          backgroundImage,
          backgroundImageFile,
          mobileBackgroundImage,
          mobileBackgroundImageFile,
          isActive,
        };
        await updateSpecialDay({ id: editingSpecialDayId, data: payload }).unwrap();
        toast.success("Special day updated successfully!");
      } else {
        const payload: CreateSpecialDayRequest = {
          category,
          startDate: new Date(startDate).toISOString(),
          endDate: new Date(endDate).toISOString(),
          backgroundImage,
          backgroundImageFile,
          mobileBackgroundImage,
          mobileBackgroundImageFile,
          isActive,
        };
        await createSpecialDay(payload).unwrap();
        toast.success("New special day created successfully!");
      }
      setDialogOpen(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.data?.message || "Failed to save special day");
    }
  };

  // Toggle active status
  const handleToggleActive = async (day: any, currentActive: boolean) => {
    if (!isManager) return;
    try {
      const payload: UpdateSpecialDayRequest = {
        category: day.category,
        startDate: day.startDate,
        endDate: day.endDate,
        backgroundImage: day.backgroundImage,
        isActive: !currentActive,
      };
      await updateSpecialDay({ id: day.specialDayId, data: payload }).unwrap();
      toast.success(`Special day is now ${!currentActive ? "Active" : "Inactive"}`);
    } catch (err: any) {
      toast.error("Failed to update status");
    }
  };

  const [specialDayToDelete, setSpecialDayToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Delete event
  const handleConfirmDelete = async () => {
    if (!specialDayToDelete) return;
    setIsDeleting(true);
    try {
      await deleteSpecialDay(specialDayToDelete.id).unwrap();
      toast.success("Special day deleted successfully!");
      setSpecialDayToDelete(null);
    } catch (err: any) {
      toast.error("Failed to delete special day");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Special Days"
        description="Themed periods and seasonal overlays for catalog branding"
        actions={
          isManager ? (
            <Button onClick={handleOpenCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Create Special Day
            </Button>
          ) : undefined
        }
      />

      {/* Filter Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search special days..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="pl-9 bg-white dark:bg-[#141414] rounded-lg border-border/80"
          />
        </div>

        <div className="flex items-center gap-2.5">
          {/* Active status filter */}
          <Select value={filterActive} onValueChange={(val) => { setFilterActive(val); setPage(1); }}>
            <SelectTrigger className="w-auto h-9 gap-1.5 rounded-lg border-border/80 bg-white dark:bg-[#141414] px-3.5 text-body font-medium shadow-none">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active Only</SelectItem>
              <SelectItem value="inactive">Inactive Only</SelectItem>
            </SelectContent>
          </Select>

          {/* Category filter */}
          <Select value={filterCategory} onValueChange={(val) => { setFilterCategory(val); setPage(1); }}>
            <SelectTrigger className="w-auto h-9 gap-1.5 rounded-lg border-border/80 bg-white dark:bg-[#141414] px-3.5 text-body font-medium shadow-none">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {backendCategories?.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              )) || (
                Object.entries(CATEGORY_CONFIG).map(([key, value]) => (
                  <SelectItem key={key} value={key}>
                    {value.label}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Content Grid */}
      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-[240px] w-full rounded-xl" />
          ))}
        </div>
      ) : filteredSpecialDays.length === 0 ? (
        <Card className="border border-dashed border-border/80 bg-muted/10">
          <CardContent className="py-16">
            <EmptyState
              icon={Calendar}
              title="No special days found"
              description={
                searchTerm || filterCategory !== "all" || filterActive !== "all"
                  ? "Try changing your search or filter criteria"
                  : "Seasonal branding periods and themed holiday events will be displayed here."
              }
              action={
                isManager ? (
                  <Button onClick={handleOpenCreate}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Special Day
                  </Button>
                ) : undefined
              }
            />
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredSpecialDays.map((day, index: number) => {
              const categoryKey = (day.category as string).toLowerCase() as SpecialDayCategory;
              const config = CATEGORY_CONFIG[categoryKey] || CATEGORY_CONFIG.other;
              const CategoryIcon = config.icon;
              const isExpired = new Date(day.endDate) < new Date();

              return (
                <motion.div
                  key={day.specialDayId}
                  className="h-full"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="h-full flex flex-col overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <CategoryIcon className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <CardTitle className="text-h3 leading-normal">
                                {config.label}
                              </CardTitle>
                              <Badge variant={day.isActive && !isExpired ? "success" : "secondary"}>
                                {isExpired ? "Expired" : day.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
                            >
                              <TbDotsVertical className="h-5 w-5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44 bg-white dark:bg-[#141414] border shadow-md rounded-lg">
                            <DropdownMenuItem onClick={() => handleOpenEdit(day)} className="cursor-pointer">
                              <TbEdit className="h-4 w-4 mr-2" />
                              Edit Special Day
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                setSpecialDayToDelete({
                                  id: day.specialDayId,
                                  name: config.label,
                                })
                              }
                              className="text-destructive focus:text-destructive cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Special Day
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>

                    <CardContent className="flex-1 flex flex-col space-y-4">
                      <div className="flex-1 pt-2">
                        <div className="grid grid-cols-2 gap-x-4 gap-y-3.5">
                          {/* Start Date */}
                          <div className="space-y-1">
                            <span className="text-body text-slate-500 dark:text-slate-400">Start Date</span>
                            <p className="text-body text-foreground break-words leading-normal">
                              {format(parseISO(day.startDate), "MMM dd, yyyy")}
                            </p>
                          </div>

                          {/* End Date */}
                          <div className="space-y-1">
                            <span className="text-body text-slate-500 dark:text-slate-400">End Date</span>
                            <p className="text-body text-foreground break-words leading-normal">
                              {format(parseISO(day.endDate), "MMM dd, yyyy")}
                            </p>
                          </div>

                          {/* Start Time */}
                          <div className="space-y-1">
                            <span className="text-body text-slate-500 dark:text-slate-400">Start Time</span>
                            <p className="text-body text-foreground break-words leading-normal">
                              {format(parseISO(day.startDate), "h:mm a")}
                            </p>
                          </div>

                          {/* End Time */}
                          <div className="space-y-1">
                            <span className="text-body text-slate-500 dark:text-slate-400">End Time</span>
                            <p className="text-body text-foreground break-words leading-normal">
                              {format(parseISO(day.endDate), "h:mm a")}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-auto">
                        {isManager && (
                          <div className="flex items-center justify-between border-t border-border/50 pt-3">
                            <span className="text-body font-semibold text-muted-foreground">Active Status</span>
                            <div className="flex items-center gap-2">
                              <span className="text-caption font-medium text-foreground">
                                {day.isActive ? "Active" : "Inactive"}
                              </span>
                              <Switch
                                checked={day.isActive}
                                disabled={isUpdating}
                                onCheckedChange={() => handleToggleActive(day, day.isActive)}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                Previous
              </Button>
              <span className="text-caption text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      {/* Creation / Editing Modal Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              {editingSpecialDayId ? "Edit Special Day" : "Create Special Day"}
            </DialogTitle>
            <DialogDescription>
              Configure seasonal overlay and app graphics for custom holiday branding.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-6 py-2">
            {/* Category Select */}
            <div className="space-y-1.5">
              <Label htmlFor="modalCategory">Branding Theme Category *</Label>
              <Select
                value={category}
                onValueChange={(val: SpecialDayCategory) => setCategory(val)}
              >
                <SelectTrigger id="modalCategory">
                  <SelectValue placeholder="Select themed category" />
                </SelectTrigger>
                <SelectContent>
                  {backendCategories?.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  )) || (
                    Object.entries(CATEGORY_CONFIG).map(([key, value]) => (
                      <SelectItem key={key} value={key}>
                        {value.label}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Date Range Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="modalStartDate">Start Date & Time *</Label>
                <DateTimePicker
                  id="modalStartDate"
                  value={startDate}
                  onChange={setStartDate}
                  placeholder="Select start date & time"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="modalEndDate">End Date & Time *</Label>
                <DateTimePicker
                  id="modalEndDate"
                  value={endDate}
                  onChange={setEndDate}
                  placeholder="Select end date & time"
                />
              </div>
            </div>

            {/* Symmetrical Image Uploaders */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Desktop Background Image Upload */}
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1">
                  <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
                  Desktop Background Image *
                </Label>
                <ImageUploader
                  value={backgroundImageFile || backgroundImage || null}
                  onChange={(val) => {
                    if (val instanceof File) {
                      setBackgroundImageFile(val);
                      setBackgroundImage("https://temporary-placeholder.com/uploaded-image.png");
                    } else if (typeof val === "string") {
                      setBackgroundImage(val);
                      setBackgroundImageFile(null);
                    } else {
                      setBackgroundImageFile(null);
                      setBackgroundImage("");
                    }
                  }}
                  accept="image/*"
                  maxSizeMB={5}
                  helperText="Supports PNG, JPG, JPEG, GIF up to 5MB"
                />
              </div>

              {/* Mobile Background Image Upload */}
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1">
                  <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
                  Mobile Background Image (Optional)
                </Label>
                <ImageUploader
                  value={mobileBackgroundImageFile || mobileBackgroundImage || null}
                  onChange={(val) => {
                    if (val instanceof File) {
                      setMobileBackgroundImageFile(val);
                      setMobileBackgroundImage("https://temporary-placeholder.com/uploaded-mobile-image.png");
                    } else if (typeof val === "string") {
                      setMobileBackgroundImage(val);
                      setMobileBackgroundImageFile(null);
                    } else {
                      setMobileBackgroundImageFile(null);
                      setMobileBackgroundImage("");
                    }
                  }}
                  accept="image/*"
                  maxSizeMB={5}
                  helperText="Supports PNG, JPG, JPEG, GIF up to 5MB"
                />
              </div>
            </div>

            {/* Active Status Switch */}
            <div className="flex items-center justify-between border-t dark:border-zinc-800 pt-4">
              <div className="space-y-0.5">
                <Label htmlFor="modalActive">Active Immediately</Label>
                <p className="text-detail text-muted-foreground">
                  Seasonal branding will render on customer apps when active.
                </p>
              </div>
              <Switch id="modalActive" checked={isActive} onCheckedChange={setIsActive} />
            </div>

            <DialogFooter className="pt-4 border-t dark:border-zinc-800">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={isCreating || isUpdating}>
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating || isUpdating}>
                {isCreating || isUpdating ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Saving...
                  </span>
                ) : editingSpecialDayId ? (
                  "Save Changes"
                ) : (
                  "Create Special Day"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!specialDayToDelete}
        onOpenChange={(open) => {
          if (!open) setSpecialDayToDelete(null);
        }}
        title="Delete Special Day"
        description={`Are you sure you want to delete the special day "${specialDayToDelete?.name || ""}"? This action cannot be undone.`}
        confirmText="Delete Special Day"
        variant="destructive"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
