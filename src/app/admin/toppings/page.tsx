"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Coffee,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MoreVertical,
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
import { useGetToppingsQuery, useGetToppingCategoriesQuery } from "@/stores/api/toppingApi";
import { canManageBaseCatalog, isSuperAdmin } from "@/lib/rbac";
import { formatCurrency, cn } from "@/lib/utils";
import { Topping, UserRole } from "@/types";

const columnHelper = createColumnHelper<Topping>();

function SortIcon({ header }: { header: Header<Topping, unknown> }) {
  if (!header.column.getCanSort()) return null;

  const sorted = header.column.getIsSorted();
  if (sorted === "asc") return <ArrowUp className="h-3.5 w-3.5 ml-1" />;
  if (sorted === "desc") return <ArrowDown className="h-3.5 w-3.5 ml-1" />;
  return <ArrowUpDown className="h-3.5 w-3.5 ml-1 opacity-40" />;
}

export default function ToppingsPage() {
  const currentRole = useAppSelector((state) => state.auth.user?.role);
  
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const { data: categoriesData } = useGetToppingCategoriesQuery();
  const categories = categoriesData?.items || [];

  const { data: toppingsData, isLoading: toppingsLoading } = useGetToppingsQuery({
    page: pagination.pageIndex + 1,
    pageSize: pagination.pageSize,
    search: globalFilter || undefined,
    // Add logic in backend/frontend to filter by category if needed
  });

  const toppings = toppingsData?.items || [];
  const filteredToppings = useMemo(() => {
    let filtered = toppings;
    if (categoryFilter !== "all") {
      filtered = filtered.filter(t => t.toppingCategoryId === categoryFilter);
    }
    return filtered;
  }, [toppings, categoryFilter]);

  const totalCount = toppingsData?.totalCount || 0; // Not perfectly accurate with client side filtering but acceptable for now

  const columns = useMemo(
    () => [
      columnHelper.accessor("toppingName", {
        header: "Topping",
        cell: (info) => (
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center overflow-hidden">
              <Coffee className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <Link
                href={`/admin/toppings/${info.row.original.toppingId}`}
                className="font-medium text-foreground hover:underline"
              >
                {info.getValue()}
              </Link>
            </div>
          </div>
        ),
      }),
      columnHelper.accessor("toppingCategoryId", {
        header: "Category",
        cell: (info) => {
          const category = categories.find(c => c.toppingCategoryId === info.getValue());
          return <Badge variant="secondary">{category?.categoryName || "Unknown"}</Badge>;
        },
      }),
      columnHelper.accessor((row) => row.toppingPrice ?? row.price, {
        id: "price",
        header: "Base Price",
        cell: (info) => (
          <span className="font-medium text-foreground">
            {formatCurrency(info.getValue() || 0)}
          </span>
        ),
      }),
      columnHelper.accessor("isActive", {
        header: "Status",
        cell: (info) => (
          <Badge variant={info.getValue() ? "success" : "secondary"}>
            {info.getValue() ? "Active" : "Archived"}
          </Badge>
        ),
      }),
      columnHelper.display({
        id: "actions",
        cell: (info) => {
          const row = info.row.original;
          const isSuper = isSuperAdmin(currentRole as UserRole);
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/admin/toppings/${row.toppingId}`}>
                    <TbEdit className="h-4 w-4 mr-2" />
                    {isSuper ? "Edit Topping" : "Branch Override"}
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      }),
    ],
    [currentRole, categories]
  );

  const table = useReactTable({
    data: filteredToppings,
    columns,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: toppingsData?.totalPages || 1,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Toppings"
        description="Manage your topping catalog and customizations"
        actions={
          canManageBaseCatalog(currentRole as UserRole) && (
            <div className="flex gap-2">
              <Link href="/admin/toppings/categories">
                <Button variant="outline">
                  Manage Categories
                </Button>
              </Link>
              <Link href="/admin/toppings/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Topping
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
              placeholder="Search toppings..."
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
                  <SelectItem key={cat.toppingCategoryId} value={cat.toppingCategoryId}>
                    {cat.categoryName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table / State Container */}
        <div className="overflow-hidden rounded-lg">
          {toppingsLoading ? (
            <div className="space-y-2 p-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredToppings.length === 0 ? (
            <div className="p-12">
              <EmptyState
                icon={Coffee}
                title="No toppings found"
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
        {!toppingsLoading && totalCount > 0 && (
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
              {" "}toppings
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
