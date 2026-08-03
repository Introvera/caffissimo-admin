"use client";

import { useState } from "react";
import {
  Package,
  Plus,
  Search,
  Trash2,
  CheckCircle2,
  XCircle,
  MoreVertical,
  Loader2,
  ChevronLeft,
  ChevronRight,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import {
  useGetBranchProductsQuery,
  useUpdateBranchProductMutation,
  useDeleteBranchProductMutation,
  useCreateBranchProductMutation,
} from "@/stores/api/branchProductApi";
import { useGetProductsQuery } from "@/stores/api/productApi";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

interface ProductsTabProps {
  branchId: string;
  canEdit: boolean;
}

export function ProductsTab({ branchId, canEdit }: ProductsTabProps) {
  const [search, setSearch] = useState("");
  const [globalSearch, setGlobalSearch] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const { data, isLoading, isFetching } = useGetBranchProductsQuery({
    branchId,
    page,
    pageSize: PAGE_SIZE,
  });

  const { data: globalProducts, isLoading: productsLoading } = useGetProductsQuery({
    pageSize: 100,
    search: globalSearch || undefined,
  });

  const [updateBranchProduct, { isLoading: isUpdating }] = useUpdateBranchProductMutation();
  const [deleteBranchProduct, { isLoading: isDeleting }] = useDeleteBranchProductMutation();
  const [createBranchProduct, { isLoading: isCreating }] = useCreateBranchProductMutation();

  const products = data?.items || [];
  
  const filteredProducts = products.filter((p) =>
    p.productName.toLowerCase().includes(search.toLowerCase())
  );

  const handleToggleAvailability = async (productId: string, currentStatus: boolean) => {
    const product = products.find((p) => p.branchProductId === productId);
    if (!product) return;

    try {
      await updateBranchProduct({
        id: productId,
        data: {
          isAvailable: !currentStatus,
        },
      }).unwrap();
      toast.success(`Product ${!currentStatus ? "enabled" : "disabled"}`);
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to update status");
    }
  };

  const handleDelete = async (productId: string) => {
    if (!confirm("Are you sure you want to remove this product from the branch?")) return;

    try {
      await deleteBranchProduct(productId).unwrap();
      toast.success("Product removed from branch");
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to remove product");
    }
  };

  const handleAddProduct = async () => {
    if (!selectedProductId) return;
    
    const globalProduct = globalProducts?.items.find(p => p.productId === selectedProductId);
    if (!globalProduct) return;

    const mappedVariants =
      globalProduct.variants && globalProduct.variants.length > 0
        ? globalProduct.variants.map((v: any) => ({
            sizeName: v.sizeName || v.variantName || "Standard",
            price: v.productPrice ?? v.price ?? globalProduct.productPrice ?? 0,
            isAvailable: true,
          }))
        : [
            {
              sizeName: "Standard",
              price: globalProduct.productPrice ?? 0,
              isAvailable: true,
            },
          ];

    try {
      await createBranchProduct({
        branchId,
        productId: selectedProductId,
        isAvailable: true,
        variants: mappedVariants,
      }).unwrap();
      toast.success("Product added to branch");
      setAddDialogOpen(false);
      setSelectedProductId(null);
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to add product");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search branch products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 bg-background rounded-lg"
          />
        </div>
        
        {canEdit && (
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Product to Branch</DialogTitle>
                <DialogDescription>
                  Select a global product to make it available in this branch.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search global products..."
                    value={globalSearch}
                    onChange={(e) => setGlobalSearch(e.target.value)}
                    className="pl-9 h-9 bg-background rounded-lg"
                  />
                </div>
                {productsLoading ? (
                  <div className="py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>
                ) : (
                  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                    {globalProducts?.items
                      .filter(gp => !products.some(bp => bp.productId === gp.productId))
                      .map((product) => (
                        <div
                          key={product.productId}
                          onClick={() => setSelectedProductId(product.productId)}
                          className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                            selectedProductId === product.productId
                              ? "bg-primary/5 border-primary"
                              : "hover:bg-muted border-border"
                          }`}
                        >
                          <div>
                            <p className="text-sm font-medium">{product.productName}</p>
                            <p className="text-xs text-muted-foreground">
                              {product.variants?.length || 0} variant(s)
                            </p>
                          </div>
                          {selectedProductId === product.productId && (
                            <CheckCircle2 className="h-4 w-4 text-primary" />
                          )}
                        </div>
                      ))}
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddProduct} disabled={!selectedProductId || isCreating}>
                  {isCreating ? "Adding..." : "Add to Branch"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {filteredProducts.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={Package}
              title="No products found"
              description={search ? "No products match your search" : "No products have been added to this branch yet"}
              action={
                canEdit && !search ? (
                  <Button onClick={() => setAddDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Product
                  </Button>
                ) : undefined
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="border rounded-lg bg-background overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Product</TableHead>
                  <TableHead>Variants & Prices</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.branchProductId}>
                    <TableCell className="align-top py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                          {product.overridePosImage?.[0] || product.posImage?.[0] ? (
                            <img src={product.overridePosImage?.[0] || product.posImage?.[0]} alt={product.productName} className="object-cover h-full w-full" />
                          ) : (
                            <Package className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{product.productName}</p>
                          <p className="text-xs text-muted-foreground">ID: {product.productId.slice(0, 8)}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="align-top py-4">
                      <div className="space-y-1.5">
                        {product.variants?.map((variant) => (
                          <div key={variant.branchProductVariantId} className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground">{variant.sizeName || variant.variantName || "Standard"}:</span>
                            <span className="font-medium">{formatCurrency(variant.priceOverride ?? variant.price)}</span>
                            {!variant.isAvailable && (
                              <Badge variant="outline" className="text-[10px] h-4 px-1 py-0 border-destructive text-destructive">
                                Unavailable
                              </Badge>
                            )}
                          </div>
                        )) || (
                          <span className="text-sm text-muted-foreground italic">No variants</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="align-top py-4">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={product.isAvailable}
                          disabled={!canEdit || isUpdating}
                          onCheckedChange={() => handleToggleAvailability(product.branchProductId, product.isAvailable)}
                        />
                        <span className="text-sm font-medium">
                          {product.isAvailable ? "Available" : "Hidden"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right align-top py-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            className="text-destructive"
                            disabled={!canEdit || isDeleting}
                            onClick={() => handleDelete(product.branchProductId)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove from Branch
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button
                variant="outline" size="sm" className="h-8 w-8 p-0"
                onClick={() => setPage((p) => p - 1)}
                disabled={page <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {data.totalPages}
              </span>
              <Button
                variant="outline" size="sm" className="h-8 w-8 p-0"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= data.totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
