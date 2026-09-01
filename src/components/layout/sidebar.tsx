"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import {
  TbLayoutDashboard,
  TbMapPin,
  TbUser,
  TbLayersIntersect,
  TbBox,
  TbCoffee,
  TbTag,
  TbShoppingBag,
  TbCalendar,
  TbCurrencyDollar,
  TbShoppingCart,
  TbChartBar,
  TbPlug,
  TbToolsKitchen2,
  TbTruck,
  TbSpeakerphone,
  TbTerminal2,
  TbClock,
  TbFileText,
  TbSchool,
  TbBook2,
  TbChartLine,
  TbSettings,
  TbChevronDown,
  TbX,
  TbChevronLeft,
  TbChevronRight,
  TbChevronsLeft,
  TbChevronsRight,
} from "react-icons/tb";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAppDispatch, useAppSelector } from "@/stores/store";
import { setSidebarCollapsed, setMobileMenuOpen } from "@/stores/slices/uiSlice";
import { canAccessAdmin } from "@/lib/rbac";
import { UserRole } from "@/types";

interface NavChild {
  title: string;
  href: string;
  icon: React.ElementType;
}

interface NavGroup {
  title: string;
  icon: React.ElementType;
  permission?: (role: UserRole | undefined) => boolean;
  children: NavChild[];
}

interface NavSingle {
  title: string;
  href: string;
  icon: React.ElementType;
  permission?: (role: UserRole | undefined) => boolean;
}

type NavEntry =
  | (NavSingle & { type: "single" })
  | (NavGroup & { type: "group" });

const navEntries: NavEntry[] = [
  {
    type: "single",
    title: "Dashboard",
    href: "/admin/dashboard",
    icon: TbLayoutDashboard,
    permission: canAccessAdmin,
  },
  {
    type: "single",
    title: "Branches",
    href: "/admin/branches",
    icon: TbMapPin,
    permission: canAccessAdmin,
  },
  {
    type: "single",
    title: "Users",
    href: "/admin/users",
    icon: TbUser,
    permission: canAccessAdmin,
  },
  {
    type: "group",
    title: "Catalog",
    icon: TbLayersIntersect,
    permission: canAccessAdmin,
    children: [
      { title: "Products", href: "/admin/products", icon: TbBox },
      { title: "Toppings", href: "/admin/toppings", icon: TbCoffee },
      { title: "Offers", href: "/admin/offers", icon: TbTag },
    ],
  },
  {
    type: "group",
    title: "E-commerce",
    icon: TbShoppingBag,
    permission: canAccessAdmin,
    children: [
      { title: "Special Days", href: "/admin/special-days", icon: TbCalendar },
    ],
  },
  {
    type: "group",
    title: "Sales",
    icon: TbCurrencyDollar,
    permission: canAccessAdmin,
    children: [
      { title: "Orders", href: "/admin/orders", icon: TbShoppingCart },
      { title: "Sales Reports", href: "/admin/reports", icon: TbChartBar },
    ],
  },
  {
    type: "group",
    title: "Integrations",
    icon: TbPlug,
    permission: canAccessAdmin,
    children: [
      { title: "Uber Eats Menus", href: "/admin/uber-eats", icon: TbToolsKitchen2 },
      { title: "Uber Eats Orders", href: "/admin/uber-eats/orders", icon: TbTruck },
      { title: "Uber Promotions", href: "/admin/uber-eats/promotions", icon: TbSpeakerphone },
    ],
  },
  {
    type: "group",
    title: "System Logs",
    icon: TbTerminal2,
    permission: canAccessAdmin,
    children: [
      { title: "POS Login Logs", href: "/admin/attendance", icon: TbClock },
      { title: "Audit Logs", href: "/admin/audit-logs", icon: TbFileText },
    ],
  },
  {
    type: "group",
    title: "Academy",
    icon: TbSchool,
    permission: canAccessAdmin,
    children: [
      { title: "Modules", href: "/admin/academy/modules", icon: TbBook2 },
      { title: "Progress", href: "/admin/academy/progress", icon: TbChartLine },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const { sidebarCollapsed, mobileMenuOpen } = useAppSelector((state) => state.ui);
  const uiRole = useAppSelector((state) => state.ui.currentRole);
  const authRole = useAppSelector((state) => state.auth.user?.role);
  const currentRole = uiRole || authRole || UserRole.Cashier;
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const authUser = useAppSelector((state) => state.auth.user);
  const userName = authUser
    ? (authUser.name || `${authUser.firstName ?? ""} ${authUser.lastName ?? ""}`.trim() || "User")
    : "User";
  const userEmail = authUser?.email || "";

  const userWidget = (
    <div
      className={cn(
        "flex items-center transition-all duration-200 cursor-pointer",
        sidebarCollapsed
          ? "justify-center h-10 w-10"
          : "gap-3 px-3 py-2 hover:bg-accent/40 rounded-lg"
      )}
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-caption border border-primary/10 shadow-xs hover:bg-primary/20 transition-all">
        {userName ? userName.charAt(0).toUpperCase() : "U"}
      </div>
      {!sidebarCollapsed && (
        <div className="flex flex-col min-w-0 flex-1 text-left justify-center py-0.5">
          <span className="text-body font-semibold text-foreground truncate leading-tight">
            {userName}
          </span>
          {userEmail && (
            <span className="text-[11px] text-muted-foreground truncate leading-normal font-normal">
              {userEmail}
            </span>
          )}
        </div>
      )}
    </div>
  );

  const renderUserWidget = (collapsedState: boolean) => {
    const isActuallyCollapsed = collapsedState && sidebarCollapsed;
    
    if (isActuallyCollapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <div className="flex justify-center w-full">{userWidget}</div>
          </TooltipTrigger>
          <TooltipContent side="right" className="flex flex-col gap-0.5 p-2 bg-popover text-popover-foreground border shadow-md rounded-lg">
            <p className="text-body font-semibold text-foreground leading-tight">{userName}</p>
            {userEmail && <p className="text-[11px] text-muted-foreground leading-normal">{userEmail}</p>}
          </TooltipContent>
        </Tooltip>
      );
    }
    
    return (
      <div
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-body font-medium transition-all duration-200",
          "border border-border/60 bg-muted/30 shadow-xs hover:bg-accent/30 cursor-pointer"
        )}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-caption border border-primary/10 shadow-sm">
          {userName ? userName.charAt(0).toUpperCase() : "U"}
        </div>
        <div className="flex flex-col min-w-0 flex-1 text-left justify-center py-0.5">
          <span className="text-body font-semibold text-foreground truncate leading-tight">
            {userName}
          </span>
          {userEmail && (
            <span className="text-[11px] text-muted-foreground truncate leading-normal font-normal">
              {userEmail}
            </span>
          )}
        </div>
      </div>
    );
  };

  const settingsEntry = {
    title: "Settings",
    href: "/admin/settings",
    icon: TbSettings,
  };

  // Track which groups are open — auto-open the group containing the active route
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    navEntries.forEach((entry) => {
      if (entry.type === "group") {
        const hasActive = entry.children.some(
          (c) => pathname === c.href || pathname.startsWith(`${c.href}/`)
        );
        initial[entry.title] = hasActive;
      }
    });
    return initial;
  });

  const toggleGroup = (title: string) => {
    setOpenGroups((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const isBranchUser = currentRole === UserRole.BranchAdmin || currentRole === UserRole.BranchOwner;

  const filteredEntries = navEntries
    .filter((entry) => !entry.permission || entry.permission(currentRole))
    .map((entry) => {
      if (entry.type === "single" && entry.href === "/admin/branches") {
        return {
          ...entry,
          title: isBranchUser ? "Branch" : "Branches",
        };
      }
      return entry;
    });

  const isChildActive = (child: NavChild) =>
    pathname === child.href || pathname.startsWith(`${child.href}/`);

  const isGroupActive = (group: NavGroup) =>
    group.children.some((c) => isChildActive(c));

  // Single nav link (Dashboard)
  // Single nav link (Dashboard or nested group child)
  const NavLink = ({
    item,
    collapsed,
    indent = false,
  }: {
    item: NavChild;
    collapsed: boolean;
    indent?: boolean;
  }) => {
    const active = isChildActive(item);
    const Icon = item.icon;

    const linkContent = (
      <Link
        href={item.href}
        onClick={() => dispatch(setMobileMenuOpen(false))}
        className={cn(
          "flex items-center text-body font-medium transition-all hover:bg-accent rounded-lg",
          active
            ? indent
              ? "bg-primary/10 text-primary hover:bg-primary/15 font-semibold"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
            : "text-muted-foreground hover:text-foreground",
          collapsed
            ? "h-10 w-10 justify-center p-0 shrink-0"
            : "gap-3 px-3 py-2 w-full"
        )}
      >
        {!indent && <Icon className="h-5 w-5 shrink-0" />}
        {!collapsed && <span>{item.title}</span>}
      </Link>
    );

    if (collapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
          <TooltipContent side="right" className="flex items-center gap-4">
            {item.title}
          </TooltipContent>
        </Tooltip>
      );
    }

    return linkContent;
  };

  // Collapsible group
  const NavGroupSection = ({
    group,
    collapsed,
  }: {
    group: NavGroup;
    collapsed: boolean;
  }) => {
    const open = openGroups[group.title] ?? false;
    const active = isGroupActive(group);
    const Icon = group.icon;

    if (collapsed) {
      // When sidebar is collapsed, show the group icon — if a child is active, highlight it
      // Clicking opens a tooltip with child links
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <button
              className={cn(
                "flex items-center justify-center rounded-lg text-body font-medium transition-all hover:bg-accent",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground",
                collapsed ? "h-10 w-10 p-0 shrink-0" : "w-full gap-3 px-3 py-2"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
            </button>
          </TooltipTrigger>
          <TooltipContent
            side="right"
            className="flex flex-col gap-1 p-2"
            sideOffset={8}
          >
            <p className="text-caption font-semibold text-muted-foreground mb-1">
              {group.title}
            </p>
            {group.children.map((child) => {
              const ChildIcon = child.icon;
              const childActive = isChildActive(child);
              return (
                <Link
                  key={child.href}
                  href={child.href}
                  onClick={() => dispatch(setMobileMenuOpen(false))}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-2 py-1.5 text-body transition-colors hover:bg-accent",
                    childActive && "font-semibold text-primary"
                  )}
                >
                  <ChildIcon className="h-3.5 w-3.5" />
                  {child.title}
                </Link>
              );
            })}
          </TooltipContent>
        </Tooltip>
      );
    }

    return (
      <div>
        <button
          onClick={() => toggleGroup(group.title)}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-body font-medium transition-all hover:bg-accent",
            active
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Icon className="h-5 w-5 shrink-0" />
          <span className="flex-1 text-left">{group.title}</span>
          <TbChevronDown
            className={cn(
              "h-4 w-4 shrink-0 transition-transform duration-200",
              open && "rotate-180"
            )}
          />
        </button>
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="mt-1.5 flex flex-col gap-1 border-l border-border ml-[20px] pl-2">
                {group.children.map((child) => (
                  <NavLink
                    key={child.href}
                    item={child}
                    collapsed={false}
                    indent
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const [logoError, setLogoError] = useState(false);

  const sidebarContent = (collapsed: boolean) => (
    <div className="flex h-full flex-col">
      <div
        className={cn(
          "flex h-16 items-center justify-between bg-white dark:bg-[#141414] border-b border-border/30 relative",
          collapsed ? "justify-center px-0" : "pl-4 pr-0"
        )}
      >
        {!collapsed ? (
          <Link href="/admin/dashboard" className="flex items-center overflow-hidden hover:opacity-90 transition-opacity">
            <div className="relative flex h-12 min-w-[100px] shrink-0 items-center justify-start">
              {logoError ? (
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                  <TbCoffee className="h-5 w-5 text-primary-foreground" />
                </div>
              ) : (
                <div className="flex h-12 items-center rounded-lg px-2 dark:px-0">
                  {mounted ? (
                    <img
                      src={resolvedTheme === "dark" ? "/logo/logo-dark-theme.png" : "/logo/logo-light-theme.png"}
                      alt="Caffissimo"
                      className="h-10 w-32 object-contain object-left"
                      onError={() => setLogoError(true)}
                    />
                  ) : (
                    <div className="h-10 w-28" />
                  )}
                </div>
              )}
            </div>
          </Link>
        ) : (
          <Link href="/admin/dashboard" className="flex items-center justify-center hover:opacity-90 transition-opacity">
            <div className="flex h-12 items-center justify-center px-1">
              {logoError || !mounted ? (
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                  <TbCoffee className="h-4 w-4" />
                </div>
              ) : (
                <img
                  src={resolvedTheme === "dark" ? "/logo/logo-dark-theme.png" : "/logo/logo-light-theme.png"}
                  alt="Caffissimo"
                  className="h-7 max-w-[52px] object-contain"
                  onError={() => setLogoError(true)}
                />
              )}
            </div>
          </Link>
        )}

        {/* Desktop Overlapping Toggle Button on the Right Border */}
        {!collapsed ? (
          <Button
            variant="outline"
            size="icon"
            className="absolute -right-3.5 top-[18px] z-40 h-7 w-7 rounded-full bg-white dark:bg-[#141414] border border-border/60 shadow-sm hover:bg-accent text-muted-foreground hover:text-foreground hidden lg:flex items-center justify-center cursor-pointer"
            onClick={() => dispatch(setSidebarCollapsed(true))}
            title="Collapse Sidebar"
          >
            <TbChevronsLeft className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            variant="outline"
            size="icon"
            className="absolute -right-3.5 top-[18px] z-40 h-7 w-7 rounded-full bg-white dark:bg-[#141414] border border-border/60 shadow-sm hover:bg-accent text-muted-foreground hover:text-foreground hidden lg:flex items-center justify-center cursor-pointer"
            onClick={() => dispatch(setSidebarCollapsed(false))}
            title="Expand Sidebar"
          >
            <TbChevronsRight className="h-4 w-4" />
          </Button>
        )}
      </div>

      <ScrollArea className={cn("flex-1 py-4", collapsed ? "px-0" : "px-3")}>
        <nav className={cn("flex flex-col items-center", collapsed ? "gap-2" : "gap-1 items-stretch")}>
          {filteredEntries.map((entry) => {
            if (entry.type === "single") {
              return (
                <NavLink
                  key={entry.href}
                  item={entry}
                  collapsed={collapsed}
                />
              );
            }
            return (
              <NavGroupSection
                key={entry.title}
                group={entry}
                collapsed={collapsed}
              />
            );
          })}
        </nav>
      </ScrollArea>

      {/* Sidebar Footer with Settings and User Info */}
      <div className={cn("mt-auto py-4 flex flex-col items-center", collapsed ? "gap-2 px-0" : "gap-2.5 px-3 items-stretch")}>
        {canAccessAdmin(currentRole) && (
          <NavLink
            item={settingsEntry}
            collapsed={collapsed}
          />
        )}
        {renderUserWidget(collapsed)}
      </div>
    </div>
  );

  return (
    <TooltipProvider>
      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarCollapsed ? 72 : 256 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="hidden lg:flex h-screen flex-col bg-white dark:bg-[#141414] border-r border-border/40 fixed left-0 top-0 z-30"
      >
        {sidebarContent(sidebarCollapsed)}
      </motion.aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/50 lg:hidden"
              onClick={() => dispatch(setMobileMenuOpen(false))}
            />
            <motion.aside
              initial={{ x: -256 }}
              animate={{ x: 0 }}
              exit={{ x: -256 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="fixed left-0 top-0 z-50 h-screen w-64 border-r bg-white dark:bg-[#141414] lg:hidden"
            >
              <div className="absolute right-2 top-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => dispatch(setMobileMenuOpen(false))}
                >
                  <TbX className="h-5 w-5" />
                </Button>
              </div>
              {sidebarContent(false)}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </TooltipProvider>
  );
}
