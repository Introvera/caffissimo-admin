"use client";
import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Store,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TbDotsVertical } from "react-icons/tb";
import { PageHeader } from "@/components/shared/page-header";
import { useAppSelector } from "@/stores/store";
import { useGetBranchesQuery, useUpdateBranchMutation } from "@/stores/api/branchApi";
import { canManageBranch, canAccessAllBranches, canCreateBranch } from "@/lib/rbac";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Branch, UserRole } from "@/types";
import { toast } from "sonner";

export default function BranchesPage() {
  const uiRole = useAppSelector((state) => state.ui.currentRole);
  const authRole = useAppSelector((state) => state.auth.user?.role);
  const currentRole = uiRole || authRole || UserRole.Cashier;
  const assignedBranchId = useAppSelector((state) => state.auth.user?.branchId) || null;
  
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const pageSize = 10;

  const { data, isLoading } = useGetBranchesQuery({
    page,
    pageSize,
    search: searchTerm || undefined,
  });

  const [updateBranch, { isLoading: isUpdating }] = useUpdateBranchMutation();

  const handleToggleOpen = async (branchId: string, currentOpenStatus: boolean) => {
    try {
      await updateBranch({
        id: branchId,
        data: { isOpen: !currentOpenStatus },
      }).unwrap();
      toast.success(`Branch ${!currentOpenStatus ? "opened" : "closed"} successfully`);
    } catch (error) {
      console.error("Failed to toggle branch status:", error);
      const message = (error as { data?: { message?: string } })?.data?.message || "Failed to update branch status";
      toast.error(message);
    }
  };

  const branches = data?.items || [];
  const totalPages = data?.totalPages || 1;

  const filteredBranches = canAccessAllBranches(currentRole)
    ? branches
    : branches.filter((b: Branch) => b.branchId === assignedBranchId);

  const canManage = canManageBranch(currentRole);

  const getTodayHours = (branch: Branch) => {
    if (!branch.openingHours || branch.openingHours.length === 0) return "Closed";
    
    // DayOfWeek enum: Sunday = 0, Monday = 1, ...
    const todayNum = new Date().getDay();
    const dayLabels = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const todayLabel = dayLabels[todayNum];
    
    const hours = branch.openingHours.find(h => {
      const hDay = h.dayOfWeek as any;
      if (typeof hDay === "string") {
        if (!isNaN(Number(hDay))) {
          return Number(hDay) === todayNum;
        }
        return hDay.toLowerCase() === todayLabel.toLowerCase();
      }
      return hDay === todayNum;
    });
    
    if (!hours || hours.isClosed || !hours.isActive) return "Closed";
    
    const formatTime = (t?: string) => {
      if (!t) return "";
      return t.split(":").slice(0, 2).join(":");
    };
    
    return `${formatTime(hours.openAt)} - ${formatTime(hours.closeAt)}`;
  };

  const isBranchUser = currentRole === UserRole.BranchAdmin || currentRole === UserRole.BranchOwner;

  return (
    <div className="space-y-6">
      <PageHeader
        title={isBranchUser ? "Branch" : "Branches"}
        description={isBranchUser ? "Manage your coffee shop location" : "Manage your coffee shop locations"}
        actions={
          canCreateBranch(currentRole) && (
            <Link href="/admin/branches/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Branch
              </Button>
            </Link>
          )
        }
      />

      {/* Filter Bar */}
      {!isBranchUser && (
        <div className="flex items-center justify-between gap-4">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search branches..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1); // Reset to first page on search
              }}
              className="pl-9"
            />
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
             <Skeleton key={i} className="h-[280px] w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredBranches.map((branch: Branch, index: number) => (
              <motion.div
                key={branch.branchId}
                className="h-full"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full flex flex-col overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Store className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-h3 leading-normal">
                              {branch.branchName}
                            </CardTitle>
                            <Badge variant={branch.isOpen ? "success" : "secondary"}>
                              {branch.isOpen ? "Open" : "Closed"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground focus-visible:ring-0 focus-visible:ring-offset-0">
                            <TbDotsVertical className="h-5 w-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 bg-white dark:bg-[#141414] border shadow-md rounded-lg">
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/branches/${branch.branchId}`} className="cursor-pointer">
                              View Branch
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            disabled={!branch.uberEatsUrl} 
                            onClick={() => branch.uberEatsUrl && window.open(branch.uberEatsUrl, "_blank")}
                            className="cursor-pointer"
                          >
                            Uber Eats
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            disabled={!branch.doorDashUrl} 
                            onClick={() => branch.doorDashUrl && window.open(branch.doorDashUrl, "_blank")}
                            className="cursor-pointer"
                          >
                            Door Dash
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col space-y-4">
                    <div className="flex-1 pt-2">
                      <div className="grid grid-cols-2 gap-x-4 gap-y-3.5">
                        {/* Address */}
                        <div className="space-y-1">
                          <span className="text-body text-slate-500 dark:text-slate-400">Address</span>
                          <p className="text-body text-foreground break-words leading-normal">{branch.branchAddress}</p>
                        </div>

                        {/* Phone */}
                        <div className="space-y-1">
                          <span className="text-body text-slate-500 dark:text-slate-400">Phone</span>
                          <p className="text-body text-foreground break-words leading-normal">{branch.branchPhoneNumber}</p>
                        </div>

                        {/* Email */}
                        <div className="space-y-1">
                          <span className="text-body text-slate-500 dark:text-slate-400">Email</span>
                          <p className="text-body text-foreground break-words leading-normal">{branch.branchEmail}</p>
                        </div>

                        {/* Hours */}
                        <div className="space-y-1">
                          <span className="text-body text-slate-500 dark:text-slate-400">Hours</span>
                          <p className="text-body text-foreground break-words leading-normal">Today: {getTodayHours(branch)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-auto">
                      {canManage && (
                        <div className="flex items-center justify-between border-t border-border/50 pt-3">
                          <span className="text-body font-semibold text-muted-foreground">Active Status</span>
                          <div className="flex items-center gap-2">
                            <span className="text-caption font-medium text-foreground">{branch.isOpen ? "Open" : "Closed"}</span>
                            <Switch
                              checked={branch.isOpen}
                              disabled={isUpdating}
                              onCheckedChange={() => handleToggleOpen(branch.branchId, branch.isOpen)}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <Button
                    key={p}
                    variant={p === page ? "default" : "outline"}
                    size="sm"
                    className={cn(
                      "w-9",
                      p === page && "bg-primary text-white hover:bg-primary/90 hover:text-white"
                    )}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
