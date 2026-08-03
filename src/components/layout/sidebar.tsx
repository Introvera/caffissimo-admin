"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutGrid,
  MapPin,
  User,
  Layers,
  DollarSign,
  Terminal,
  Settings,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronDown,
  X,
  Package,
  Coffee,
  Tag,
  ShoppingBag,
  ShoppingCart,
  BarChart3,
  Clock,
  FileText,
  GraduationCap,
  BookOpen,
  Cable,
  Store,
  Truck,
  Megaphone,
  Calendar,
} from "lucide-react";
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
    icon: LayoutGrid,
    permission: canAccessAdmin,
  },
  {
    type: "single",
    title: "Branches",
    href: "/admin/branches",
    icon: MapPin,
    permission: canAccessAdmin,
  },
  {
    type: "single",
    title: "Users",
    href: "/admin/users",
    icon: User,
    permission: canAccessAdmin,
  },
  {
    type: "group",
    title: "Catalog",
    icon: Layers,
    permission: canAccessAdmin,
    children: [
      { title: "Products", href: "/admin/products", icon: Package },
      { title: "Toppings", href: "/admin/toppings", icon: Coffee },
      { title: "Offers", href: "/admin/offers", icon: Tag },
    ],
  },
  {
    type: "group",
    title: "E-commerce",
    icon: ShoppingBag,
    permission: canAccessAdmin,
    children: [
      { title: "Special Days", href: "/admin/special-days", icon: Calendar },
    ],
  },
  {
    type: "group",
    title: "Sales",
    icon: DollarSign,
    permission: canAccessAdmin,
    children: [
      { title: "Orders", href: "/admin/orders", icon: ShoppingCart },
      { title: "Sales Reports", href: "/admin/reports", icon: BarChart3 },
    ],
  },
  {
    type: "group",
    title: "Integrations",
    icon: Cable,
    permission: canAccessAdmin,
    children: [
      { title: "Uber Eats Menus", href: "/admin/uber-eats", icon: Store },
      { title: "Uber Eats Orders", href: "/admin/uber-eats/orders", icon: Truck },
      { title: "Uber Promotions", href: "/admin/uber-eats/promotions", icon: Megaphone },
    ],
  },
  {
    type: "group",
    title: "System Logs",
    icon: Terminal,
    permission: canAccessAdmin,
    children: [
      { title: "POS Login Logs", href: "/admin/attendance", icon: Clock },
      { title: "Audit Logs", href: "/admin/audit-logs", icon: FileText },
    ],
  },
  {
    type: "group",
    title: "Academy",
    icon: GraduationCap,
    permission: canAccessAdmin,
    children: [
      { title: "Modules", href: "/admin/academy/modules", icon: BookOpen },
      { title: "Progress", href: "/admin/academy/progress", icon: BarChart3 },
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

  const settingsEntry = {
    title: "Settings",
    href: "/admin/settings",
    icon: Settings,
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
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent",
          active
            ? indent
              ? "bg-primary/10 text-primary hover:bg-primary/15 font-semibold"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
            : "text-muted-foreground hover:text-foreground",
          collapsed && "justify-center px-2 py-2.5"
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
                "flex w-full items-center justify-center rounded-lg px-2 py-2.5 text-sm font-medium transition-all hover:bg-accent",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground"
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
            <p className="text-xs font-semibold text-muted-foreground mb-1">
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
                    "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent",
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
            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent",
            active
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Icon className="h-5 w-5 shrink-0" />
          <span className="flex-1 text-left">{group.title}</span>
          <ChevronDown
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
          "flex h-20 items-center justify-between pl-4 pr-0",
          collapsed && "justify-center pl-2 pr-0"
        )}
      >
        {!collapsed ? (
          <>
            <Link href="/admin/dashboard" className="flex items-center overflow-hidden">
              <div className="relative flex h-14 min-w-[100px] shrink-0 items-center justify-start">
                {logoError ? (
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                    <Coffee className="h-6 w-6 text-primary-foreground" />
                  </div>
                ) : (
                  <div className="flex h-14 items-center rounded-lg px-2 dark:px-0">
                    {mounted ? (
                      <img
                        src={resolvedTheme === "dark" ? "/logo/logo-dark-theme.png" : "/logo/logo-light-theme.png"}
                        alt="Caffissimo"
                        className="h-12 w-36 object-contain object-left"
                        onError={() => setLogoError(true)}
                      />
                    ) : (
                      <div className="h-12 w-32" />
                    )}
                  </div>
                )}
              </div>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
              onClick={() => dispatch(setSidebarCollapsed(true))}
              title="Collapse Sidebar"
            >
              <PanelLeftClose className="h-5 w-5" />
            </Button>
          </>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 text-muted-foreground hover:text-foreground animate-fadeIn"
            onClick={() => dispatch(setSidebarCollapsed(false))}
            title="Expand Sidebar"
          >
            <PanelLeftOpen className="h-5 w-5" />
          </Button>
        )}
      </div>

      <ScrollArea className={cn("flex-1 py-4", collapsed ? "pl-3 pr-0" : "px-3")}>
        <nav className={cn("flex flex-col", collapsed ? "gap-2.5" : "gap-2")}>
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

      {canAccessAdmin(currentRole) && (
        <div className={cn("py-4 mt-auto", collapsed ? "pl-3 pr-0" : "px-3")}>
          <NavLink
            item={settingsEntry}
            collapsed={collapsed}
          />
        </div>
      )}
    </div>
  );

  return (
    <TooltipProvider>
      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarCollapsed ? 72 : 256 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="hidden lg:flex h-screen flex-col bg-sidebar fixed left-0 top-0 z-30 pt-3"
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
              className="fixed left-0 top-0 z-50 h-screen w-64 border-r bg-sidebar lg:hidden"
            >
              <div className="absolute right-2 top-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => dispatch(setMobileMenuOpen(false))}
                >
                  <X className="h-5 w-5" />
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
