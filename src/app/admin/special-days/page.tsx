"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import {
  Calendar,
  Plus,
  Trash2,
  Edit2,
  Sparkles,
  Filter,
  RefreshCw,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  PartyPopper,
  Heart,
  Egg,
  Skull,
  Gift,
  HelpCircle,
  MoreVertical,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
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

// Beautiful themed colors, gradients, and icons for each seasonal category
const THEME_CONFIG: Record<
  SpecialDayCategory,
  {
    gradient: string;
    border: string;
    text: string;
    accent: string;
    badge: string;
    icon: React.ElementType;
    label: string;
  }
> = {
  newyear: {
    gradient: "from-blue-600/80 to-amber-500/80 dark:from-blue-900/60 dark:to-amber-900/40",
    border: "border-amber-400/20 hover:border-amber-400/50",
    text: "text-amber-500 dark:text-amber-300",
    accent: "bg-amber-500/10 text-amber-500 dark:bg-amber-500/20",
    badge: "bg-blue-500 text-white",
    icon: PartyPopper,
    label: "New Year",
  },
  valentines: {
    gradient: "from-rose-500/80 to-pink-600/80 dark:from-rose-950/60 dark:to-pink-950/40",
    border: "border-rose-400/20 hover:border-rose-400/50",
    text: "text-rose-500 dark:text-rose-300",
    accent: "bg-rose-500/10 text-rose-500 dark:bg-rose-500/20",
    badge: "bg-rose-500 text-white",
    icon: Heart,
    label: "Valentine's Day",
  },
  easter: {
    gradient: "from-emerald-600/80 to-green-600/80 dark:from-emerald-950/60 dark:to-green-950/40",
    border: "border-emerald-400/20 hover:border-emerald-400/50",
    text: "text-emerald-600 dark:text-emerald-300",
    accent: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20",
    badge: "bg-emerald-500 text-white",
    icon: Egg,
    label: "Easter",
  },
  halloween: {
    gradient: "from-orange-500/80 to-purple-800/80 dark:from-orange-950/60 dark:to-purple-950/40",
    border: "border-orange-500/20 hover:border-orange-500/50",
    text: "text-orange-500 dark:text-orange-400",
    accent: "bg-orange-500/10 text-orange-500 dark:bg-orange-500/20",
    badge: "bg-orange-600 text-white",
    icon: Skull,
    label: "Halloween",
  },
  christmas: {
    gradient: "from-emerald-700/80 to-rose-700/80 dark:from-emerald-950/60 dark:to-rose-950/40",
    border: "border-emerald-400/20 hover:border-emerald-400/50",
    text: "text-emerald-500 dark:text-emerald-300",
    accent: "bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/20",
    badge: "bg-emerald-600 text-white",
    icon: Gift,
    label: "Christmas",
  },
  other: {
    gradient: "from-zinc-600/80 to-slate-700/80 dark:from-zinc-900/60 dark:to-slate-900/40",
    border: "border-zinc-400/20 hover:border-zinc-400/50",
    text: "text-zinc-500 dark:text-zinc-300",
    accent: "bg-zinc-500/10 text-zinc-500 dark:bg-zinc-500/20",
    badge: "bg-zinc-500 text-white",
    icon: HelpCircle,
    label: "Other",
  },
};

export default function SpecialDaysPage() {
  const currentRole = useAppSelector((state) => state.auth.user?.role);
  const isManager = canManageSpecialDays(currentRole);

  const [page, setPage] = useState(1);
  const [filterActive, setFilterActive] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  
  // Image loading failure tracking state
  const [failedImageIds, setFailedImageIds] = useState<Record<string, boolean>>({});

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
  const { data, isLoading, refetch } = useGetSpecialDaysQuery({
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
        // Clear failed image track on update so it re-attempts loading the new image URL
        setFailedImageIds(prev => ({ ...prev, [editingSpecialDayId]: false }));
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

  // Switch toggle status directly from the dashboard card header (aligned with branches page)
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

  // Delete event
  const handleDelete = async (id: string) => {
    if (!isManager) return;
    if (confirm("Are you sure you want to delete this special day branding event?")) {
      try {
        await deleteSpecialDay(id).unwrap();
        toast.success("Special day branding event deleted successfully!");
      } catch (err: any) {
        toast.error("Failed to delete special day");
      }
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Special Days"
        description="Themed periods and seasonal overlays for catalog branding"
        actions={
          isManager ? (
            <Button size="sm" onClick={handleOpenCreate}>
              <Plus className="h-4 w-4 mr-2" />
              New Special Day
            </Button>
          ) : undefined
        }
      />

      {/* Filter Bar - Perfectly aligned with toppings and branches pages */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Active status filter */}
          <Select value={filterActive} onValueChange={(val) => { setFilterActive(val); setPage(1); }}>
            <SelectTrigger className="w-auto h-9 gap-1.5 rounded-lg border-border/80 bg-background px-3.5 text-sm font-medium shadow-none">
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
            <SelectTrigger className="w-auto h-9 gap-1.5 rounded-lg border-border/80 bg-background px-3.5 text-sm font-medium shadow-none">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {backendCategories?.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              )) || (
                Object.entries(THEME_CONFIG).map(([key, value]) => (
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
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      ) : specialDays.length === 0 ? (
        <Card className="border border-dashed border-border/80 bg-muted/10">
          <CardContent className="py-16">
            <EmptyState
              icon={Calendar}
              title="No special days found"
              description="Seasonal branding periods, themed events, and holiday configurations will be displayed here."
              action={
                isManager ? (
                  <Button onClick={handleOpenCreate}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Special Day
                  </Button>
                ) : undefined
              }
            />
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {specialDays.map((day) => {
              const categoryKey = (day.category as string).toLowerCase() as SpecialDayCategory;
              const config = THEME_CONFIG[categoryKey] || THEME_CONFIG.other;
              const CategoryIcon = config.icon;
              const isExpired = new Date(day.endDate) < new Date();
              const hasImageFailed = failedImageIds[day.specialDayId];

              return (
                <motion.div
                  key={day.specialDayId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15 }}
                  className="h-full"
                >
                  <Card className={`relative overflow-hidden flex flex-col h-64 border rounded-xl bg-card transition-all duration-200 hover:shadow-sm ${config.border}`}>
                    
                    {/* Header Image / Gradient Block */}
                    <div className="relative h-28 overflow-hidden shrink-0 bg-muted">
                      
                      {/* Gradient Overlay */}
                      <div className={`absolute inset-0 bg-gradient-to-b ${config.gradient} mix-blend-multiply z-10 opacity-70`} />
                      
                      {/* Image Render - If failed, unmount to completely prevent repeated request flashing */}
                      {!hasImageFailed ? (
                        <img
                          src={day.backgroundImage}
                          alt={config.label}
                          className="absolute inset-0 w-full h-full object-cover"
                          onError={() => {
                            // Unmounts the image tag immediately and safely falls back to dynamic CSS gradients
                            setFailedImageIds(prev => ({ ...prev, [day.specialDayId]: true }));
                          }}
                        />
                      ) : (
                        // Gorgeous fallback design using the custom theme's gradient instead of broken images
                        <div className={`absolute inset-0 bg-gradient-to-tr ${config.gradient} opacity-80`} />
                      )}

                      {/* Header Thematic Overlay Details */}
                      <div className="absolute top-3.5 left-3.5 z-20 flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-white/20 backdrop-blur-md text-white border border-white/20">
                          <CategoryIcon className="h-4.5 w-4.5" />
                        </div>
                        <span className="text-sm font-bold text-white tracking-wide">
                          {config.label}
                        </span>
                      </div>

                      {/* Top-Right Badges & Actions */}
                      <div className="absolute top-3.5 right-3.5 z-20 flex items-center gap-1.5">
                        <Badge variant={day.isActive && !isExpired ? "default" : "secondary"} className={`text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full ${day.isActive && !isExpired ? config.badge : ""}`}>
                          {isExpired ? "Expired" : day.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>

                    {/* Description/Info Area */}
                    <CardContent className="p-4 flex-1 flex flex-col gap-3 justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center text-xs text-muted-foreground gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>Timeline</span>
                        </div>
                        <p className="text-sm font-medium tracking-tight leading-normal text-foreground">
                          {format(parseISO(day.startDate), "MMM dd, yyyy h:mm a")}
                          <span className="block text-xs font-normal text-muted-foreground mt-0.5">
                            to {format(parseISO(day.endDate), "MMM dd, yyyy h:mm a")}
                          </span>
                        </p>
                      </div>

                      {/* Status Toggle & Card Operations Menu (Perfectly aligned with branches & toppings page) */}
                      <div className="flex items-center justify-between border-t border-border/60 pt-3 mt-auto">
                        <div className="flex items-center gap-2">
                          {isManager && (
                            <Switch
                              checked={day.isActive}
                              disabled={isUpdating}
                              onCheckedChange={() => handleToggleActive(day, day.isActive)}
                              title={day.isActive ? "Toggle Inactive" : "Toggle Active"}
                            />
                          )}
                          <span className="text-xs text-muted-foreground font-medium">
                            {day.isActive ? "Active overlay" : "Inactive overlay"}
                          </span>
                        </div>

                        {/* Standard administrative dropdown actions */}
                        {isManager && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleOpenEdit(day)}>
                                <Edit2 className="h-4 w-4 mr-2" />
                                Edit Seasonal Event
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDelete(day.specialDayId)}>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Branding
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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
            <div className="flex items-center justify-center gap-2 pt-6">
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setPage((p) => p - 1)}
                disabled={page <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium text-muted-foreground">
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
            
            {/* Category Select (Full Width) */}
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
                    Object.entries(THEME_CONFIG).map(([key, value]) => (
                      <SelectItem key={key} value={key}>
                        {value.label}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Date Range Inputs (Side-by-Side) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="modalStartDate">Start Date & Time *</Label>
                <Input
                  id="modalStartDate"
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="modalEndDate">End Date & Time *</Label>
                <Input
                  id="modalEndDate"
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Middle Section: Symmetrical Image Uploaders side-by-side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Desktop Background Image Upload */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-1">
                    <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    Desktop Background Image *
                  </Label>
                </div>
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

            {/* Bottom Section: Active Status Switch */}
            <div className="flex items-center justify-between border-t dark:border-zinc-800 pt-4">
              <div className="space-y-0.5">
                <Label htmlFor="modalActive">Active Immediately</Label>
                <p className="text-[11px] text-muted-foreground">
                  Seasonal branding will render on the customer apps as soon as the start date kicks off.
                </p>
              </div>
              <Switch id="modalActive" checked={isActive} onCheckedChange={setIsActive} />
            </div>

            <DialogFooter className="pt-4 border-t dark:border-zinc-800">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={isCreating || isUpdating}>
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating || isUpdating} className="bg-primary hover:bg-primary/95 text-white font-semibold">
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
    </div>
  );
}
