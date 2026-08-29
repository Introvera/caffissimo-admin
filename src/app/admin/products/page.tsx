"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Package,
  Eye,
  EyeOff,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MoreVertical,
  Trash2,
} from "lucide-react";
import { TbEdit } from "react-icons/tb";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
  Header,
  PaginationState,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppSelector } from "@/stores/store";
import { useGetProductsQuery, useGetCategoriesQuery, useUpdateProductMutation } from "@/stores/api/productApi";
import { useGetBranchProductsQuery, useCreateBranchProductMutation, useDeleteBranchProductMutation } from "@/stores/api/branchProductApi";
import { canManageProducts, isSuperAdmin } from "@/lib/rbac";
import { formatCurrency, cn } from "@/lib/utils";
import { Product, UserRole } from "@/types";
import { toast } from "sonner";

const columnHelper = createColumnHelper<Product>();

function SortIcon({ header }: { header: Header<Product, unknown> }) {
  if (!header.column.getCanSort()) return null;

  const sorted = header.column.getIsSorted();
  if (sorted === "asc") return <ArrowUp className="h-3.5 w-3.5 ml-1" />;
  if (sorted === "desc") return <ArrowDown className="h-3.5 w-3.5 ml-1" />;
  return <ArrowUpDown className="h-3.5 w-3.5 ml-1 opacity-40" />;
}

export default function ProductsPage() {
  const currentRole = useAppSelector((state) => state.auth.user?.role);
  const assignedBranchId = useAppSelector((state) => state.auth.user?.branchId);
  const [updateProduct] = useUpdateProductMutation();
  const [createBranchProduct] = useCreateBranchProductMutation();
  const [deleteBranchProduct] = useDeleteBranchProductMutation();
  
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const { data: categoriesData } = useGetCategoriesQuery();
  const categories = categoriesData?.items || [];

  const isSuper = isSuperAdmin(currentRole as UserRole);
  const isBranchManager = !isSuper && canManageProducts(currentRole);

  const [branchFilter, setBranchFilter] = useState<"all" | "branch">("all");

  const shouldShowAll = isSuper || (isBranchManager && branchFilter === "all");

  const { data: globalProductsData, isLoading: globalProductsLoading } = useGetProductsQuery({
    page: pagination.pageIndex + 1,
    pageSize: pagination.pageSize,
    search: globalFilter || undefined,
    productCategoryId: categoryFilter === "all" ? undefined : categoryFilter,
    branchId: isBranchManager ? assignedBranchId : undefined,
  }, {
    skip: !shouldShowAll
  });

  const { data: branchProductsData, isLoading: branchProductsLoading } = useGetBranchProductsQuery({
    page: pagination.pageIndex + 1,
    pageSize: pagination.pageSize,
    search: globalFilter || undefined,
    branchId: assignedBranchId || undefined,
  }, {
    skip: shouldShowAll || !assignedBranchId
  });

  const handleAddProduct = async (globalProduct: Product) => {
    try {
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

      await createBranchProduct({
        branchId: assignedBranchId!,
        productId: globalProduct.productId || (globalProduct as any).id,
        isAvailable: true,
        variants: mappedVariants,
      }).unwrap();
      toast.success("Product added to branch successfully");
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to add product to branch");
    }
  };

  const handleRemoveProductFromBranch = async (branchProductId: string) => {
    if (!confirm("Are you sure you want to remove this product from your branch?")) return;

    try {
      await deleteBranchProduct(branchProductId).unwrap();
      toast.success("Product removed from branch successfully");
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to remove product from branch");
    }
  };

  const productsLoading = shouldShowAll ? globalProductsLoading : branchProductsLoading;
  const productsData = shouldShowAll ? globalProductsData : branchProductsData;
  const products = (productsData?.items as unknown as Product[]) || [];
  const totalCount = productsData?.totalCount || 0;



  const columns = useMemo(
    () => {
      const baseColumns: any[] = [
        columnHelper.accessor("productName", {
          header: "Product",
          cell: (info) => {
            const original = info.row.original as any;
            const imageSrc = Array.isArray(original.posImage) 
              ? original.posImage[0] 
              : original.posImage;
            
            const targetId = original.productId || original.id;
            
            return (
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center overflow-hidden">
                  {imageSrc ? (
                    <img 
                      src={imageSrc} 
                      alt={info.getValue()} 
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Package className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <Link
                    href={`/admin/products/${targetId}`}
                    className="font-medium text-foreground hover:underline"
                  >
                    {info.getValue()}
                  </Link>
                  <p className="text-caption text-muted-foreground line-clamp-1">
                    {original.productDescription || ""}
                  </p>
                </div>
              </div>
            );
          },
        }),
        columnHelper.accessor("productCategoryName", {
          header: "Category",
          cell: (info) => <Badge variant="secondary">{info.getValue() || "No Category"}</Badge>,
        }),
      ];

      // Only show Price to Super Admins
      if (isSuperAdmin(currentRole as UserRole)) {
        baseColumns.push(
          columnHelper.accessor("productPrice", {
            header: "Price",
            cell: (info) => (
              <span className="font-medium text-foreground">
                {formatCurrency(info.getValue() || 0)}
              </span>
            ),
          })
        );
      }

      // If branch manager, show Branch Status in all products list view
      if (isBranchManager && branchFilter === "all") {
        baseColumns.push(
          columnHelper.display({
            id: "branchStatus",
            header: "Branch Status",
            cell: (info) => {
              const row = info.row.original;
              const isAssigned = !!row.branchAssignment?.isAssigned;
              return (
                <Badge variant={isAssigned ? "success" : "secondary"}>
                  {isAssigned ? "In Branch" : "Not in Branch"}
                </Badge>
              );
            }
          })
        );
      }

      // Status column
      baseColumns.push(
        columnHelper.accessor("isActive", {
          header: "Status",
          cell: (info) => {
            const original = info.row.original as any;
            const isAvail = original.isAvailable !== undefined ? original.isAvailable : original.isActive;
            return (
              <Badge variant={isAvail ? "success" : "secondary"}>
                {isAvail ? "Active" : "Archived"}
              </Badge>
            );
          },
        })
      );

      baseColumns.push(
        columnHelper.display({
          id: "actions",
          cell: (info) => {
            const row = info.row.original as any;
            const targetId = row.productId || row.id;
            
            if (isSuper) {
              return (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/admin/products/${targetId}`}>
                        <TbEdit className="h-4 w-4 mr-2" />
                        Edit Product
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              );
            }

            if (isBranchManager) {
              const isAssigned = branchFilter === "branch" ? true : !!row.branchAssignment?.isAssigned;
              const actualBpId = (branchFilter === "branch" ? row.branchProductId : row.branchAssignment?.branchProductId) || "";

              return (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/admin/products/${targetId}`}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Link>
                    </DropdownMenuItem>
                    {isAssigned ? (
                      <>
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/products/${targetId}`}>
                            <TbEdit className="h-4 w-4 mr-2" />
                            Edit Branch Pricing
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleRemoveProductFromBranch(actualBpId)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove from Branch
                        </DropdownMenuItem>
                      </>
                    ) : (
                      <DropdownMenuItem 
                        onClick={() => handleAddProduct(row)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add to Branch
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              );
            }

            return null;
          },
        })
      );

      return baseColumns;
    },
    [currentRole, branchFilter, isSuper, isBranchManager]
  );

  const table = useReactTable({
    data: products,
    columns,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: productsData?.totalPages || 1,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        description="Manage your product catalog and pricing"
        actions={
          isSuper && (
            <div className="flex gap-2">
              <Link href="/admin/products/categories">
                <Button variant="outline">
                  Manage Categories
                </Button>
              </Link>
              <Link href="/admin/products/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Product
                </Button>
              </Link>
            </div>
          )
        }
      />

      <Card className="p-6 space-y-4 bg-white dark:bg-[#141414] border border-border shadow-none rounded-xl">
        {/* Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={globalFilter}
              onChange={(e) => {
                setGlobalFilter(e.target.value);
                setPagination(prev => ({ ...prev, pageIndex: 0 }));
              }}
              className="pl-9 w-[320px] h-9 bg-white dark:bg-[#141414] rounded-lg"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Select value={categoryFilter} onValueChange={(val) => {
              setCategoryFilter(val);
              setPagination(prev => ({ ...prev, pageIndex: 0 }));
            }}>
              <SelectTrigger className="w-auto h-9 gap-1.5 rounded-lg border-border/80 bg-white dark:bg-[#141414] px-3.5 text-body font-medium shadow-none">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.productCategoryId} value={cat.productCategoryId}>
                    {cat.categoryName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {isBranchManager && (
              <Select value={branchFilter} onValueChange={(val: "all" | "branch") => {
                setBranchFilter(val);
                setPagination(prev => ({ ...prev, pageIndex: 0 }));
              }}>
                <SelectTrigger className="w-auto h-9 gap-1.5 rounded-lg border-border/80 bg-white dark:bg-[#141414] px-3.5 text-body font-medium shadow-none">
                  <SelectValue placeholder="Availability" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Products</SelectItem>
                  <SelectItem value="branch">My Branch Products</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {/* Table / State Container */}
        <div className="overflow-hidden rounded-lg">
          {productsLoading ? (
            <div className="space-y-2 p-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="p-12">
              <EmptyState
                icon={Package}
                title="No products found"
                description="Try adjusting your search or filters"
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id} className="hover:bg-transparent border-0">
                      {headerGroup.headers.map((header) => (
                        <TableHead
                          key={header.id}
                          className={
                            header.column.getCanSort()
                              ? "cursor-pointer select-none"
                              : ""
                          }
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          <span className="inline-flex items-center">
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                            <SortIcon header={header} />
                          </span>
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {!productsLoading && products.length > 0 && (
          <div className="flex items-center justify-between pt-1">
            <p className="text-body text-muted-foreground">
              Showing{" "}
              <span className="font-medium text-foreground">
                {pagination.pageIndex * pagination.pageSize + 1}
              </span>
              {" "}to{" "}
              <span className="font-medium text-foreground">
                {Math.min((pagination.pageIndex + 1) * pagination.pageSize, totalCount)}
              </span>
              {" "}of{" "}
              <span className="font-medium text-foreground">{totalCount}</span>
              {" "}products
            </p>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: Math.min(table.getPageCount(), 5) }, (_, i) => {
                let pageNum: number;
                const totalPages = table.getPageCount();
                const currentPage = pagination.pageIndex;

                if (totalPages <= 5) {
                  pageNum = i;
                } else if (currentPage < 3) {
                  pageNum = i;
                } else if (currentPage > totalPages - 4) {
                  pageNum = totalPages - 5 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    className={cn(
                      "h-8 w-8 p-0 text-caption font-medium",
                      currentPage === pageNum && "bg-primary text-white hover:bg-primary/90 hover:text-white"
                    )}
                    onClick={() => table.setPageIndex(pageNum)}
                  >
                    {pageNum + 1}
                  </Button>
                );
              })}
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
