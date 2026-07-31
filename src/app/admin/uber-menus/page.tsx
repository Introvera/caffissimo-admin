"use client";

import { useState } from "react";
import {
  ExternalLink,
  RefreshCw,
  Plus,
  Search,
  Store,
  Clock,
  MoreVertical,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { useAppSelector } from "@/stores/store";
import {
  useGetUberMenusQuery,
  useSyncUberMenuMutation,
  useDeleteUberMenuMutation,
} from "@/stores/api/uberMenuApi";
import { useGetBranchesQuery } from "@/stores/api/branchApi";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { UserRole } from "@/types";

export default function UberMenusPage() {
  const currentRole = useAppSelector(
    (state) => state.ui.currentRole || state.auth.user?.role || UserRole.Cashier
  );
  const { selectedBranchId } = useAppSelector((state) => state.ui);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState<string>("all");

  const showBranchFilter = currentRole !== UserRole.BranchOwner && currentRole !== UserRole.BranchAdmin;

  const PAGE_SIZE = 10;

  const { data, isLoading, isFetching } = useGetUberMenusQuery({
    page,
    pageSize: PAGE_SIZE,
    branchId: branchFilter !== "all" ? branchFilter : (selectedBranchId || undefined),
  });

  const { data: branchesData } = useGetBranchesQuery();
  const [syncMenu, { isLoading: isSyncing }] = useSyncUberMenuMutation();
  const [deleteMenu, { isLoading: isDeleting }] = useDeleteUberMenuMutation();

  const menus = data?.items || [];
  const totalCount = data?.totalCount || 0;
  const totalPages = data?.totalPages || 1;

  const handleSync = async (menuId: string, branchId: string) => {
    try {
      const response = await syncMenu({ id: menuId, branchId }).unwrap();
      if (response.success) {
        toast.success("Menu sync triggered successfully");
      } else {
        toast.error(response.message || "Sync failed");
      }
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to trigger sync");
    }
  };

  const getBranchName = (branchId: string) => {
    return branchesData?.items.find((b) => b.branchId === branchId)?.branchName.replace("Caffissimo", "").trim() || "Unknown";
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Uber Menus"
        description="Unified management of Uber Eats menus across branches"
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          {showBranchFilter && (
            <Select value={branchFilter} onValueChange={(v) => { setBranchFilter(v); setPage(1); }}>
              <SelectTrigger className="w-auto h-9 gap-1.5 rounded-lg border-border/80 bg-background px-3.5 text-sm font-medium shadow-none">
                <SelectValue placeholder="Branch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Branches</SelectItem>
                {branchesData?.items.map((b) => (
                  <SelectItem key={b.branchId} value={b.branchId}>{b.branchName.replace("Caffissimo", "").trim()}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search menus..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 w-[220px] h-9 bg-background rounded-lg"
          />
        </div>
      </div>

      <div>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        ) : menus.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <EmptyState
                icon={ExternalLink}
                title="No Uber Menus found"
                description="Try adjusting your filters or create a new menu from a branch detail page."
              />
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="border rounded-lg bg-background overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Menu</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Sync</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {menus
                    .filter(m => (m.menuName || (m as any).title || "").toLowerCase().includes(search.toLowerCase()))
                    .map((menu) => (
                    <TableRow key={menu.uberMenuId}>
                      <TableCell>
                        <p className="font-medium">{menu.menuName || (menu as any).title || "Untitled Menu"}</p>
                        <p className="text-xs text-muted-foreground">ID: {(menu.uberMenuId || "").slice(0, 8)}</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Store className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-sm">{getBranchName(menu.branchId)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={menu.isActive ? "success" : "secondary"}>
                          {menu.isActive ? "Active" : "Draft"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          {menu.lastSyncedAt ? formatDate(menu.lastSyncedAt) : "Never"}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isSyncing}
                          onClick={() => handleSync(menu.uberMenuId, menu.branchId)}
                        >
                          {isSyncing ? (
                            <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                          ) : (
                            <RefreshCw className="h-3.5 w-3.5 mr-2" />
                          )}
                          Sync
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between border-t border-border/60 px-6 py-4">
              <p className="text-sm text-muted-foreground">
                Showing{" "}
                <span className="font-medium text-foreground">
                  {(page - 1) * PAGE_SIZE + 1}
                </span>
                {" "}to{" "}
                <span className="font-medium text-foreground">
                  {Math.min(page * PAGE_SIZE, totalCount)}
                </span>
                {" "}of{" "}
                <span className="font-medium text-foreground">{totalCount}</span>
                {" "}menus
              </p>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline" size="sm" className="h-8 w-8 p-0"
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline" size="sm" className="h-8 w-8 p-0"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
