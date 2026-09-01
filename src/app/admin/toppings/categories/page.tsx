"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, MoreVertical, Trash2, Layers } from "lucide-react";
import { TbEdit } from "react-icons/tb";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import {
  useGetToppingCategoriesQuery,
  useCreateToppingCategoryMutation,
  useUpdateToppingCategoryMutation,
  useDeleteToppingCategoryMutation,
} from "@/stores/api/toppingApi";
import { canManageProducts } from "@/lib/rbac";
import { useAppSelector } from "@/stores/store";
import { UserRole, ToppingCategory } from "@/types";
import { isSuperAdmin } from "@/lib/rbac";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { CharacterCounter } from "@/components/ui/character-counter";
import { toast } from "sonner";

export default function ToppingCategoriesPage() {
  const router = useRouter();
  const currentRole = useAppSelector((state) => state.auth.user?.role) || UserRole.Cashier;
  const isSuper = isSuperAdmin(currentRole as UserRole);
  const canEdit = isSuper;

  useEffect(() => {
    if (currentRole && !isSuper) {
      toast.error("You are not authorized to manage topping categories.");
      router.push("/admin/toppings");
    }
  }, [currentRole, isSuper, router]);

  const { data: categoriesData, isLoading } = useGetToppingCategoriesQuery();
  const categories = categoriesData?.items || [];
  
  // RTK Mutations
  const [createCategory, { isLoading: isCreating }] = useCreateToppingCategoryMutation();
  const [updateCategory, { isLoading: isUpdating }] = useUpdateToppingCategoryMutation();
  const [deleteCategory] = useDeleteToppingCategoryMutation();

  // Create Dialog States
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  // Edit Dialog States
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ToppingCategory | null>(null);
  const [editCategoryName, setEditCategoryName] = useState("");
  const [editCategoryActive, setEditCategoryActive] = useState(true);

  // Delete Dialog States
  const [categoryToDelete, setCategoryToDelete] = useState<ToppingCategory | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error("Category name is required");
      return;
    }

    try {
      await createCategory({
        categoryName: newCategoryName,
        isActive: true,
      }).unwrap();
      toast.success("Topping category created successfully");
      setCreateDialogOpen(false);
      setNewCategoryName("");
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to create topping category");
    }
  };

  const handleEditClick = (category: ToppingCategory) => {
    setSelectedCategory(category);
    setEditCategoryName(category.categoryName);
    setEditCategoryActive(category.isActive);
    setEditDialogOpen(true);
  };

  const handleUpdateCategory = async () => {
    if (!selectedCategory) return;
    if (!editCategoryName.trim()) {
      toast.error("Category name is required");
      return;
    }

    try {
      await updateCategory({
        id: selectedCategory.toppingCategoryId,
        data: {
          categoryName: editCategoryName,
          isActive: editCategoryActive,
        },
      }).unwrap();
      toast.success("Topping category updated successfully");
      setEditDialogOpen(false);
      setSelectedCategory(null);
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to update topping category");
    }
  };

  const handleConfirmDeleteCategory = async () => {
    if (!categoryToDelete) return;
    setIsDeleting(true);
    try {
      await deleteCategory(categoryToDelete.toppingCategoryId).unwrap();
      toast.success("Topping category deleted successfully");
      setCategoryToDelete(null);
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to delete topping category");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/toppings">
           <Button variant="ghost" size="icon">
             <ArrowLeft className="h-4 w-4" />
           </Button>
        </Link>
        <PageHeader
          className="flex-1"
          title="Topping Categories"
          description="Manage grouping for customizations"
          actions={
            isSuper && (
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            )
          }
        />
      </div>

      <Card className="p-6 space-y-4 bg-white dark:bg-[#141414] border border-border shadow-none rounded-xl">
        <div className="overflow-hidden rounded-lg">
          {isLoading ? (
            <div className="p-4 space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : categories.length === 0 ? (
            <div className="p-12">
              <EmptyState
                icon={Layers}
                title="No categories found"
                description="Click the Add Category button to create your first customization group."
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-0">
                  <TableHead>Category Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.toppingCategoryId}>
                    <TableCell className="font-semibold text-foreground">
                      {category.categoryName}
                    </TableCell>
                    <TableCell>
                      <Badge variant={category.isActive ? "success" : "secondary"}>
                        {category.isActive ? "Active" : "Archived"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {canEdit && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditClick(category)}>
                              <TbEdit className="h-4 w-4 mr-2" />
                              Edit Category
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setCategoryToDelete(category)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Category
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </Card>

      {/* Create Topping Category Modal */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Topping Category</DialogTitle>
            <DialogDescription>
              Create a new topping category to organize toppings in your customization menus.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="categoryName">Category Name</Label>
                <CharacterCounter current={newCategoryName.length} max={100} />
              </div>
              <Input
                id="categoryName"
                placeholder="e.g. Milk Options, Sweeteners"
                maxLength={100}
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleCreateCategory();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateCategory} disabled={isCreating}>
              {isCreating ? "Creating..." : "Create Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Topping Category Modal */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Topping Category</DialogTitle>
            <DialogDescription>
              Update the details and active status of this topping category.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="editCategoryName">Category Name</Label>
                <CharacterCounter current={editCategoryName.length} max={100} />
              </div>
              <Input
                id="editCategoryName"
                placeholder="e.g. Milk Options"
                maxLength={100}
                value={editCategoryName}
                onChange={(e) => setEditCategoryName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleUpdateCategory();
                  }
                }}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4 bg-background">
              <div className="space-y-0.5">
                <Label htmlFor="editCategoryActive" className="text-body">Active Status</Label>
                <p className="text-body text-muted-foreground">
                  Determine if this category is visible in product customizations.
                </p>
              </div>
              <Switch
                id="editCategoryActive"
                checked={editCategoryActive}
                onCheckedChange={setEditCategoryActive}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateCategory} disabled={isUpdating}>
              {isUpdating ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!categoryToDelete}
        onOpenChange={(open) => {
          if (!open) setCategoryToDelete(null);
        }}
        title="Delete Topping Category"
        description={`Are you sure you want to delete the topping category "${categoryToDelete?.categoryName || ""}"? This action cannot be undone.`}
        confirmText="Delete Category"
        variant="destructive"
        isLoading={isDeleting}
        onConfirm={handleConfirmDeleteCategory}
      />
    </div>
  );
}
