"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Menu, Search, Filter, User, Settings, LogOut } from "lucide-react";
import { ThemeToggleSimple } from "@/components/theme-toggle";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DateRangeCalendar } from "@/components/ui/calendar";
import { useAppDispatch, useAppSelector } from "@/stores/store";
import { setSelectedBranchId, setDateRange, setDateRangePreset, setMobileMenuOpen, setRole } from "@/stores/slices/uiSlice";
import { logout, setUserRole } from "@/stores/slices/authSlice";
import { canAccessAllBranches } from "@/lib/rbac";
import { useGetBranchesQuery } from "@/stores/api/branchApi";
import { format } from "date-fns";
import { UserRole } from "@/types";
import { cn } from "@/lib/utils";

const roleLabels: Record<UserRole, string> = {
  [UserRole.SuperAdmin]: "Super Admin",
  [UserRole.SuperAdminDeveloper]: "Developer",
  [UserRole.BranchOwner]: "Branch Owner",
  [UserRole.BranchAdmin]: "Branch Admin",
  [UserRole.Supervisor]: "Supervisor",
  [UserRole.Cashier]: "Cashier",
  [UserRole.Employee]: "Employee",
};

const roleBadgeVariants: Record<UserRole, "default" | "secondary" | "outline"> = {
  [UserRole.SuperAdmin]: "default",
  [UserRole.SuperAdminDeveloper]: "default",
  [UserRole.BranchOwner]: "secondary",
  [UserRole.BranchAdmin]: "secondary",
  [UserRole.Supervisor]: "outline",
  [UserRole.Cashier]: "outline",
  [UserRole.Employee]: "outline",
};

export function Header() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") ?? "");
  const [popoverOpen, setPopoverOpen] = useState(false);
  const dispatch = useAppDispatch();
  const {
    selectedBranchId,
    dateRange,
    dateRangePreset,
    currentRole: uiRole,
  } = useAppSelector((state) => state.ui);
  
  const authRole = useAppSelector((state) => state.auth.user?.role);
  const currentRole = uiRole || authRole || UserRole.Cashier;
  
  const assignedBranchId = useAppSelector((state) => state.auth.user?.branchId) || null;
  const authUser = useAppSelector((state) => state.auth.user);
  const userName = authUser
    ? (authUser.name || `${authUser.firstName ?? ""} ${authUser.lastName ?? ""}`.trim() || "User")
    : "User";
  const userEmail = authUser?.email || "user@caffissimo.com";

  // Live branch list from API (only fetched when the user is a super admin)
  const { data: branchesData } = useGetBranchesQuery(
    { pageSize: 100 },
    { skip: !canAccessAllBranches(currentRole) }
  );
  const branches = branchesData?.items ?? [];

  const handleAdminSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) {
      router.push(`/admin/search?q=${encodeURIComponent(q)}`);
    }
  };



  const handleBranchChange = (branchId: string) => {
    dispatch(setSelectedBranchId(branchId === "all" ? null : branchId));
  };

  const handleRoleChange = (role: string) => {
    const newRole = role as UserRole;
    dispatch(setRole(newRole));
    dispatch(setUserRole(newRole));
  };

  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b bg-background px-4 lg:px-6 lg:rounded-t-2xl">
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={() => dispatch(setMobileMenuOpen(true))}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Left Side: Branch Selector */}
      <div className="flex flex-1 items-center gap-2">
        {/* Branch Selector (Super Admin only) */}
        {canAccessAllBranches(currentRole) && (
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold tracking-tight text-foreground mr-1">Store :</h2>
            <Select
              value={selectedBranchId || "all"}
              onValueChange={handleBranchChange}
            >
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue placeholder="All Branches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Branches</SelectItem>
                {branches.map((branch) => (
                  <SelectItem key={branch.branchId} value={branch.branchId}>
                    {branch.branchName.replace("Caffissimo", "").trim()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-2 md:gap-4">
        {/* Date Range Picker */}
        <div className="hidden sm:flex items-center gap-3">
          <div className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-muted/20 p-1 text-muted-foreground">
            {(["12m", "30d", "7d", "24h"] as const).map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => dispatch(setDateRangePreset(preset))}
                className={cn(
                  "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1 text-xs font-semibold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  dateRangePreset === preset
                    ? "bg-background text-foreground font-bold shadow-sm border border-border rounded-sm"
                    : "hover:text-foreground text-muted-foreground"
                )}
              >
                {preset === "12m" ? "12 months" : preset === "30d" ? "30 days" : preset === "7d" ? "7 days" : "24 hours"}
              </button>
            ))}
          </div>
          <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 text-xs font-bold rounded-md border border-input text-foreground px-3.5 hover:bg-muted/50 flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 shadow-sm bg-background">
                <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                <span>{format(dateRange.from, "MMM dd, yyyy")} – {format(dateRange.to, "MMM dd, yyyy")}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 border-none bg-transparent" align="end">
              <DateRangeCalendar
                from={dateRange.from}
                to={dateRange.to}
                onSelect={(range) => {
                  if (range.from && range.to) {
                    dispatch(setDateRange({ from: range.from, to: range.to }));
                    setPopoverOpen(false);
                  }
                }}
                onCancel={() => setPopoverOpen(false)}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Role Switcher (Temporary for development) 
        <div className="hidden lg:flex items-center gap-2 border-r pr-2 mr-2">
          <span className="text-[10px] uppercase font-bold text-muted-foreground whitespace-nowrap">Role Switch:</span>
          <Select
            value={currentRole}
            onValueChange={handleRoleChange}
          >
            <SelectTrigger className="w-[140px] h-8 text-xs bg-muted/50 border-none">
              <SelectValue placeholder="Change Role" />
            </SelectTrigger>
            <SelectContent>
              {Object.values(UserRole).map((role) => (
                <SelectItem key={role} value={role} className="text-xs">
                  {roleLabels[role]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        */}

        {/* Theme Toggle */}
        <ThemeToggleSimple />

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full hover:bg-muted focus-visible:ring-0 focus-visible:ring-offset-0">
              <Avatar className="h-9 w-9 border border-muted-foreground/10">
                <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                  {userName ? userName.charAt(0).toUpperCase() : "U"}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64 p-2 rounded-xl border bg-popover text-popover-foreground shadow-lg" align="end" forceMount>
            <div className="flex items-center gap-3 px-2 py-2.5">
              <Avatar className="h-10 w-10 border border-muted-foreground/10 shadow-sm">
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                  {userName ? userName.charAt(0).toUpperCase() : "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col space-y-0.5 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {userName}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {userEmail}
                </p>
              </div>
            </div>
            
            <DropdownMenuSeparator className="my-1.5" />
            
            <div className="px-2 py-1.5 flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium">Role</span>
                <Badge variant={roleBadgeVariants[currentRole]} className="text-[10px] px-2 py-0">
                  {roleLabels[currentRole]}
                </Badge>
              </div>
              {assignedBranchId && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground font-medium">Branch</span>
                  <span className="font-semibold text-foreground truncate max-w-[120px]">
                    {branches.find((b: any) => b.branchId === assignedBranchId)?.branchName.replace("Caffissimo", "").trim()}
                  </span>
                </div>
              )}
            </div>

            <DropdownMenuSeparator className="my-1.5" />

            <DropdownMenuItem 
              className="flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer transition-colors focus:bg-muted/50"
              onClick={() => router.push("/admin/settings")}
            >
              <Settings className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">Settings</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator className="my-1.5" />

            <DropdownMenuItem 
              className="flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive transition-colors" 
              onClick={() => {
                dispatch(logout());
                router.push("/auth/login");
              }}
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm">Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
