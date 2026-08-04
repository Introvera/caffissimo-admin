"use client";

import { useState } from "react";
import {
  ExternalLink,
  Plus,
  RefreshCw,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  MoreVertical,
  Loader2,
} from "lucide-react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { EmptyState } from "@/components/shared/empty-state";
import {
  useGetUberMenusQuery,
  useSyncUberMenuMutation,
  useDeleteUberMenuMutation,
} from "@/stores/api/uberMenuApi";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

interface UberMenusTabProps {
  branchId: string;
  canEdit: boolean;
}

export function UberMenusTab({ branchId, canEdit }: UberMenusTabProps) {
  const { data, isLoading, isFetching, refetch } = useGetUberMenusQuery({
    branchId,
    pageSize: 10,
  });

  const [syncMenu, { isLoading: isSyncing }] = useSyncUberMenuMutation();
  const [deleteMenu, { isLoading: isDeleting }] = useDeleteUberMenuMutation();

  const menus = data?.items || [];

  const handleSync = async (menuId: string) => {
    try {
      const response = await syncMenu({ id: menuId, branchId }).unwrap();
      if (response.syncStatus === "Success") {
        toast.success("Menu sync triggered successfully");
      } else {
        toast.error(response.message || "Sync failed");
      }
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to trigger sync");
    }
  };

  const handleDelete = async (menuId: string) => {
    if (!confirm("Are you sure you want to delete this Uber Menu?")) return;

    try {
      await deleteMenu({ id: menuId, branchId }).unwrap();
      toast.success("Uber Menu deleted");
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to delete menu");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Uber Eats Menus</h3>
        <div className="flex gap-2">
           <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          {canEdit && (
            <Button size="sm" onClick={() => toast.info("Full menu creation coming soon")}>
              <Plus className="h-4 w-4 mr-2" />
              New Menu
            </Button>
          )}
        </div>
      </div>

      {menus.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={ExternalLink}
              title="No Uber Menus found"
              description="Sync or create an Uber Eats menu for this branch to get started."
              action={
                canEdit ? (
                  <Button onClick={() => toast.info("Full menu creation coming soon")}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Menu
                  </Button>
                ) : undefined
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="border rounded-lg bg-background overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Menu Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Sync</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {menus.map((menu) => (
                <TableRow key={menu.uberMenuId}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{menu.menuName || (menu as any).title || "Untitled Menu"}</p>
                      <p className="text-xs text-muted-foreground">ID: {menu.uberMenuId.slice(0, 8)}</p>
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
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isSyncing}
                        onClick={() => handleSync(menu.uberMenuId)}
                      >
                        {isSyncing ? (
                          <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3.5 w-3.5 mr-2" />
                        )}
                        Sync to Uber
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            className="text-destructive"
                            disabled={!canEdit || isDeleting}
                            onClick={() => handleDelete(menu.uberMenuId)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Menu
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
