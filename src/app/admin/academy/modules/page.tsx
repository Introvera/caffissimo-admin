"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  BookOpen,
  Video,
  HelpCircle,
  MoreVertical,
  Pencil,
  PowerOff,
  Power,
  Loader2,
  GraduationCap,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { trainingApi } from "@/lib/training-api";
import { useAppSelector } from "@/stores/store";
import { canAccessAllBranches } from "@/lib/rbac";
import {
  UserRole,
  TrainingModuleType,
  type TrainingModuleSummaryResponse,
  type CreateTrainingModuleRequest,
  type UpdateTrainingModuleRequest,
} from "@/types";
import { toast } from "sonner";

const defaultCreateForm: CreateTrainingModuleRequest = {
  moduleType: TrainingModuleType.Internal,
  title: "",
  description: "",
  isActive: true,
};

export default function AcademyModulesPage() {
  const router = useRouter();

  // Branch scoping selectors
  const currentRole = useAppSelector(
    (state) => state.ui.currentRole || state.auth.user?.role || UserRole.Cashier
  );
  const selectedBranchId = useAppSelector((state) => state.ui.selectedBranchId);
  const assignedBranchId = useAppSelector(
    (state) => state.ui.assignedBranchId || state.auth.user?.branchId
  );
  const isSuperAdmin = canAccessAllBranches(currentRole);
  const effectiveBranchId = isSuperAdmin ? selectedBranchId : assignedBranchId;

  const [modules, setModules] = useState<TrainingModuleSummaryResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateTrainingModuleRequest>(defaultCreateForm);
  const [isCreating, setIsCreating] = useState(false);

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<TrainingModuleSummaryResponse | null>(null);
  const [editForm, setEditForm] = useState<UpdateTrainingModuleRequest>({
    title: "",
    description: "",
    isActive: true,
  });
  const [isSaving, setIsSaving] = useState(false);

  const loadModules = async () => {
    setIsLoading(true);
    try {
      const data = await trainingApi.getActiveModules();
      setModules(data);
    } catch {
      toast.error("Failed to load training modules");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadModules();
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return modules;
    const q = search.toLowerCase();
    return modules.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        m.description?.toLowerCase().includes(q)
    );
  }, [modules, search]);

  const handleCreate = async () => {
    if (!createForm.title.trim()) {
      toast.error("Title is required");
      return;
    }
    setIsCreating(true);
    try {
      await trainingApi.createModule({
        ...createForm,
        branchId: (effectiveBranchId && effectiveBranchId !== "all") ? effectiveBranchId : undefined,
        description: createForm.description || undefined,
      });
      toast.success("Module created successfully");
      setCreateOpen(false);
      setCreateForm(defaultCreateForm);
      await loadModules();
    } catch (e: any) {
      toast.error(e?.message || "Failed to create module");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (moduleId: string) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this module? This action cannot be undone."
      )
    ) {
      return;
    }
    try {
      await trainingApi.deleteModule(moduleId);
      toast.success("Module deleted successfully");
      await loadModules();
    } catch (e: any) {
      toast.error(e?.message || "Failed to delete module");
    }
  };

  const openEdit = (mod: TrainingModuleSummaryResponse) => {
    setEditTarget(mod);
    setEditForm({
      title: mod.title,
      description: mod.description || "",
      isActive: mod.isActive,
    });
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editTarget || !editForm.title.trim()) {
      toast.error("Title is required");
      return;
    }
    setIsSaving(true);
    try {
      await trainingApi.updateModule(editTarget.trainingModuleId, {
        ...editForm,
        description: editForm.description || undefined,
      });
      toast.success("Module updated");
      setEditOpen(false);
      setEditTarget(null);
      await loadModules();
    } catch (e: any) {
      toast.error(e?.message || "Failed to update module");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (mod: TrainingModuleSummaryResponse) => {
    try {
      await trainingApi.updateModule(mod.trainingModuleId, {
        title: mod.title,
        description: mod.description,
        isActive: !mod.isActive,
      });
      toast.success(mod.isActive ? "Module deactivated" : "Module activated");
      await loadModules();
    } catch (e: any) {
      toast.error(e?.message || "Failed to update module");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Academy Modules"
        description="Create and manage training modules for your team"
        actions={
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button id="create-module-btn">
                <Plus className="h-4 w-4 mr-2" />
                New Module
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px]">
              <DialogHeader>
                <DialogTitle>Create Training Module</DialogTitle>
                <DialogDescription>
                  A module can contain videos and a quiz for employees to complete.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="create-title">Title *</Label>
                  <Input
                    id="create-title"
                    placeholder="e.g. Barista Fundamentals"
                    value={createForm.title}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, title: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-type">Module Type</Label>
                  <Select
                    value={createForm.moduleType}
                    onValueChange={(val) =>
                      setCreateForm({
                        ...createForm,
                        moduleType: val as TrainingModuleType,
                      })
                    }
                  >
                    <SelectTrigger id="create-type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={TrainingModuleType.Internal}>
                        Internal (Videos & Quiz)
                      </SelectItem>
                      <SelectItem value={TrainingModuleType.External}>
                        External (Course Link & Certificate Upload)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-description">Description</Label>
                  <Textarea
                    id="create-description"
                    placeholder="Briefly describe what this module covers..."
                    rows={3}
                    value={createForm.description}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, description: e.target.value })
                    }
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="text-sm font-medium">Active</p>
                    <p className="text-xs text-muted-foreground">
                      Make this module visible to employees immediately
                    </p>
                  </div>
                  <Switch
                    id="create-active"
                    checked={createForm.isActive}
                    onCheckedChange={(v) =>
                      setCreateForm({ ...createForm, isActive: v })
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={isCreating} id="confirm-create-module">
                  {isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Module"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Search bar */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          id="academy-search"
          placeholder="Search modules..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-9"
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16">
            <EmptyState
              icon={GraduationCap}
              title={search ? "No modules found" : "No training modules yet"}
              description={
                search
                  ? "Try a different search term"
                  : "Create your first module to start training your team"
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((mod) => (
            <ModuleCard
              key={mod.trainingModuleId}
              module={mod}
              onView={() =>
                router.push(`/admin/academy/modules/${mod.trainingModuleId}`)
              }
              onEdit={() => openEdit(mod)}
              onToggleActive={() => handleToggleActive(mod)}
              onDelete={() => handleDelete(mod.trainingModuleId)}
            />
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Edit Module</DialogTitle>
            <DialogDescription>Update the module details below.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title *</Label>
              <Input
                id="edit-title"
                value={editForm.title}
                onChange={(e) =>
                  setEditForm({ ...editForm, title: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                rows={3}
                value={editForm.description}
                onChange={(e) =>
                  setEditForm({ ...editForm, description: e.target.value })
                }
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium">Active</p>
                <p className="text-xs text-muted-foreground">
                  Whether employees can see and take this module
                </p>
              </div>
              <Switch
                id="edit-active"
                checked={editForm.isActive}
                onCheckedChange={(v) =>
                  setEditForm({ ...editForm, isActive: v })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={isSaving} id="confirm-edit-module">
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Module Card ────────────────────────────────────────────────────────────

function ModuleCard({
  module,
  onView,
  onEdit,
  onToggleActive,
  onDelete,
}: {
  module: TrainingModuleSummaryResponse;
  onView: () => void;
  onEdit: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
}) {
  return (
    <Card
      className="group relative flex flex-col cursor-pointer transition-shadow hover:shadow-md"
      onClick={onView}
    >
      {/* Top accent bar */}
      <div
        className={`h-1 w-full rounded-t-xl ${
          !module.isActive
            ? "bg-border"
            : module.moduleType === TrainingModuleType.External
            ? "bg-gradient-to-r from-indigo-500 to-purple-400"
            : "bg-gradient-to-r from-emerald-500 to-teal-400"
        }`}
      />

      <CardHeader className="pb-3 pt-4 px-4">
        <div className="flex items-start justify-between gap-2">
          {/* Icon + Title */}
          <div className="flex items-start gap-3 min-w-0">
            <div
              className={`shrink-0 flex h-9 w-9 items-center justify-center rounded-lg ${
                module.isActive
                  ? module.moduleType === TrainingModuleType.External
                    ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                    : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              <BookOpen className="h-4.5 w-4.5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-sm text-foreground leading-snug line-clamp-2">
                {module.title}
              </h3>
              {module.description && (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                  {module.description}
                </p>
              )}
            </div>
          </div>

          {/* Actions dropdown — stop propagation so card click doesn't fire */}
          <div onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                  id={`module-actions-${module.trainingModuleId}`}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit Details
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onToggleActive}>
                  {module.isActive ? (
                    <>
                      <PowerOff className="h-4 w-4 mr-2" />
                      Deactivate
                    </>
                  ) : (
                    <>
                      <Power className="h-4 w-4 mr-2" />
                      Activate
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={onDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Module
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4 mt-auto">
        <div className="flex items-center justify-between">
          {/* Stats */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {module.moduleType === TrainingModuleType.External ? (
              <span className="flex items-center gap-1">
                <ExternalLink className="h-3.5 w-3.5" />
                {module.externalCourseCount} course{module.externalCourseCount !== 1 ? "s" : ""}
              </span>
            ) : (
              <>
                <span className="flex items-center gap-1">
                  <Video className="h-3.5 w-3.5" />
                  {module.videoCount} video{module.videoCount !== 1 ? "s" : ""}
                </span>
                <span className="flex items-center gap-1">
                  <HelpCircle className="h-3.5 w-3.5" />
                  {module.questionCount} Q
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {/* Module Type badge */}
            <Badge
              variant="outline"
              className={`text-[10px] px-1.5 py-0 border-0 ${
                module.moduleType === TrainingModuleType.External
                  ? "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300"
                  : "bg-blue-500/10 text-blue-700 dark:text-blue-300"
              }`}
            >
              {module.moduleType}
            </Badge>

            {/* Status badge */}
            <Badge
              variant={module.isActive ? "default" : "secondary"}
              className={`text-[10px] px-1.5 py-0 ${
                module.isActive
                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-0"
                  : ""
              }`}
            >
              {module.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
