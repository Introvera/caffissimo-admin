"use client";

import { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Menu, Search, Filter, Calendar, Store } from "lucide-react";
import { LuHouse } from "react-icons/lu";
import { TbChevronRight } from "react-icons/tb";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DateRangeCalendar } from "@/components/ui/calendar";
import { useAppDispatch, useAppSelector } from "@/stores/store";
import { setSelectedBranchId, setDateRange, setDateRangePreset, setMobileMenuOpen, setRole } from "@/stores/slices/uiSlice";
import { setUserRole } from "@/stores/slices/authSlice";
import { canAccessAllBranches } from "@/lib/rbac";
import { useGetBranchesQuery } from "@/stores/api/branchApi";
import { format } from "date-fns";
import { UserRole } from "@/types";
import { cn } from "@/lib/utils";

const roleLabels: Record<UserRole, string> = {
  [UserRole.SuperAdmin]: "Super Admin",
  [UserRole.SuperAdminDeveloper]: "Developer",
  [UserRole.Customer]: "Customer",
  [UserRole.BranchOwner]: "Branch Owner",
  [UserRole.BranchAdmin]: "Branch Admin",
  [UserRole.Supervisor]: "Supervisor",
  [UserRole.Cashier]: "Cashier",
  [UserRole.Employee]: "Employee",
};

const roleBadgeVariants: Record<UserRole, "default" | "secondary" | "outline"> = {
  [UserRole.SuperAdmin]: "default",
  [UserRole.SuperAdminDeveloper]: "default",
  [UserRole.Customer]: "outline",
  [UserRole.BranchOwner]: "secondary",
  [UserRole.BranchAdmin]: "secondary",
  [UserRole.Supervisor]: "outline",
  [UserRole.Cashier]: "outline",
  [UserRole.Employee]: "outline",
};

export function Header() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") ?? "");
  const [popoverOpen, setPopoverOpen] = useState(false);
  const dispatch = useAppDispatch();
  const {
    selectedBranchId,
    dateRange,
    dateRangePreset,
    currentRole: uiRole,
  } = useAppSelector((state) => state.ui);

  // Breadcrumb helper
  const getBreadcrumbs = (path: string) => {
    const cleanPath = path.replace(/\/$/, "");
    
    if (cleanPath === "/admin/dashboard") {
      return [
        { label: "Dashboard", active: true }
      ];
    }
    
    if (cleanPath === "/admin/branches") return [{ label: "Branches", active: true }];
    if (cleanPath.startsWith("/admin/branches/")) return [{ label: "Branches", href: "/admin/branches" }, { label: "Details", active: true }];
    if (cleanPath === "/admin/users") return [{ label: "Users", active: true }];
    
    // Catalog
    if (cleanPath === "/admin/products") return [{ label: "Catalog" }, { label: "Products", active: true }];
    if (cleanPath.startsWith("/admin/products/")) return [{ label: "Catalog" }, { label: "Products", href: "/admin/products" }, { label: "Details", active: true }];
    if (cleanPath === "/admin/toppings") return [{ label: "Catalog" }, { label: "Toppings", active: true }];
    if (cleanPath === "/admin/offers") return [{ label: "Catalog" }, { label: "Offers", active: true }];
    
    // E-commerce
    if (cleanPath === "/admin/special-days") return [{ label: "E-commerce" }, { label: "Special Days", active: true }];
    
    // Sales
    if (cleanPath === "/admin/orders") return [{ label: "Sales" }, { label: "Orders", active: true }];
    if (cleanPath === "/admin/reports") return [{ label: "Sales" }, { label: "Reports", active: true }];
    
    // Integrations
    if (cleanPath === "/admin/uber-eats") return [{ label: "Integrations" }, { label: "Uber Eats", active: true }];
    if (cleanPath === "/admin/uber-eats/orders") return [{ label: "Integrations" }, { label: "Uber Eats Orders", active: true }];
    if (cleanPath === "/admin/uber-eats/promotions") return [{ label: "Integrations" }, { label: "Uber Promotions", active: true }];
    
    // Logs
    if (cleanPath === "/admin/attendance") return [{ label: "System Logs" }, { label: "Attendance", active: true }];
    if (cleanPath === "/admin/audit-logs") return [{ label: "System Logs" }, { label: "Audit Logs", active: true }];
    
    // Academy
    if (cleanPath === "/admin/academy/modules") return [{ label: "Academy" }, { label: "Modules", active: true }];
    if (cleanPath === "/admin/academy/progress") return [{ label: "Academy" }, { label: "Progress", active: true }];
    
    // Settings
    if (cleanPath === "/admin/settings") return [{ label: "Settings", active: true }];
    
    // Default fallback based on path segments
    const segments = cleanPath.split("/").filter(Boolean);
    if (segments[0] === "admin") {
      return segments.slice(1).map((s, idx, arr) => ({
        label: s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, " "),
        active: idx === arr.length - 1
      }));
    }
    
    return [];
  };

  const breadcrumbs = getBreadcrumbs(pathname);
  
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
    <header className="flex h-16 shrink-0 items-center gap-4 border-b bg-white dark:bg-[#141414] px-4 lg:px-6">
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={() => dispatch(setMobileMenuOpen(true))}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Left Side: Breadcrumb UI */}
      <div className="flex flex-1 items-center gap-2 overflow-hidden select-none">
        <div className="hidden lg:flex items-center gap-2 text-muted-foreground">
          {/* Home Icon */}
          <LuHouse className="w-4 h-4 text-slate-400 shrink-0" />
          
          {breadcrumbs.map((crumb, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <TbChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
              {crumb.active ? (
                <span className="text-slate-800 dark:text-slate-200 font-semibold text-[13.5px] whitespace-nowrap">
                  {crumb.label}
                </span>
              ) : crumb.href ? (
                <a href={crumb.href} className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 font-semibold text-[13.5px] transition-colors whitespace-nowrap">
                  {crumb.label}
                </a>
              ) : (
                <span className="text-slate-500 dark:text-slate-400 font-semibold text-[13.5px] whitespace-nowrap">
                  {crumb.label}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 md:gap-4">
        {/* Branch Selector (Super Admin only) */}
        {canAccessAllBranches(currentRole) && (
          <div className="flex items-center">
            <Select
              value={selectedBranchId || "all"}
              onValueChange={handleBranchChange}
            >
              <SelectTrigger className="w-[160px] md:w-[180px] h-10 bg-white dark:bg-[#141414] border border-input shadow-none hover:bg-muted/50 cursor-pointer flex items-center gap-2 px-3 py-1.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                <Store className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="truncate text-[13px] font-semibold text-foreground flex-1 text-left">
                  {selectedBranchId 
                    ? branches.find(b => b.branchId === selectedBranchId)?.branchName.replace("Caffissimo", "").trim() || "Store"
                    : "All Stores"}
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-caption">All Stores</SelectItem>
                {branches.map((branch) => (
                  <SelectItem key={branch.branchId} value={branch.branchId} className="text-caption">
                    {branch.branchName.replace("Caffissimo", "").trim()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        {/* Date Range Picker */}
        <div className="hidden sm:flex items-center gap-3">
          <div className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-muted/20 p-1 text-muted-foreground">
            {(["12m", "30d", "7d", "24h"] as const).map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => dispatch(setDateRangePreset(preset))}
                className={cn(
                  "inline-flex items-center justify-center h-8 whitespace-nowrap rounded-sm px-4 text-caption font-normal ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer",
                  dateRangePreset === preset
                    ? "bg-white dark:bg-[#141414] text-foreground font-medium border border-border"
                    : "hover:text-foreground text-muted-foreground"
                )}
              >
                {preset === "12m" ? "12 months" : preset === "30d" ? "30 days" : preset === "7d" ? "7 days" : "24 hours"}
              </button>
            ))}
          </div>
          <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-10 text-caption font-medium rounded-md border border-input text-foreground px-4 hover:bg-muted/50 flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-white dark:bg-[#141414] shadow-none">
                <Calendar className="w-4 h-4 text-muted-foreground" />
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
          <span className="text-detail uppercase font-bold text-muted-foreground whitespace-nowrap">Role Switch:</span>
          <Select
            value={currentRole}
            onValueChange={handleRoleChange}
          >
            <SelectTrigger className="w-[140px] h-8 text-caption bg-muted/50 border-none">
              <SelectValue placeholder="Change Role" />
            </SelectTrigger>
            <SelectContent>
              {Object.values(UserRole).map((role) => (
                <SelectItem key={role} value={role} className="text-caption">
                  {roleLabels[role]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        */}

        {/* Theme Toggle */}
        <ThemeToggleSimple />
      </div>
    </header>
  );
}
