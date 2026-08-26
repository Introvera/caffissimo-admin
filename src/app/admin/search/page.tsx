"use client";

import { useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Search,
  ShoppingCart,
  Package,
  Users,
  Store,
  FileSearch,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { orders, products, users, branches, auditLogs } from "@/data/seed";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { AuditAction } from "@/types";

const actionLabels: Record<AuditAction, string> = {
  price_change: "Price Changed",
  offer_change: "Offer Modified",
  order_cancelled: "Order Cancelled",
  user_created: "User Created",
  user_updated: "User Updated",
  branch_updated: "Branch Updated",
  product_created: "Product Created",
  product_updated: "Product Updated",
  stock_report: "Stock Report",
  attendance_updated: "Attendance Updated",
  settings_updated: "Settings Updated",
};

function SearchResultsContent() {
  const searchParams = useSearchParams();
  const q = (searchParams.get("q") ?? "").trim().toLowerCase();

  const results = useMemo(() => {
    if (!q) {
      return { orders: [], products: [], users: [], branches: [], auditLogs: [] };
    }
    const matchOrders = orders.filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(q) ||
        o.id.toLowerCase().includes(q)
    );
    const matchProducts = products.filter(
      (p) =>
        p.productName.toLowerCase().includes(q) ||
        (p.productDescription && p.productDescription.toLowerCase().includes(q))
    );
    const matchUsers = users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
    );
    const matchBranches = branches.filter(
      (b) =>
        b.branchName.toLowerCase().includes(q) ||
        (b.branchAddress && b.branchAddress.toLowerCase().includes(q))
    );
    const matchLogs = auditLogs.filter(
      (l) =>
        l.userName.toLowerCase().includes(q) ||
        l.entityType.toLowerCase().includes(q) ||
        actionLabels[l.action]?.toLowerCase().includes(q)
    );
    return {
      orders: matchOrders.slice(0, 5),
      products: matchProducts.slice(0, 5),
      users: matchUsers.slice(0, 5),
      branches: matchBranches.slice(0, 5),
      auditLogs: matchLogs.slice(0, 5),
    };
  }, [q]);

  const totalCount =
    results.orders.length +
    results.products.length +
    results.users.length +
    results.branches.length +
    results.auditLogs.length;

  if (!q) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <Search className="h-10 w-10 mx-auto mb-3 opacity-50" />
          <p>Enter a search term in the top bar to search across orders, products, users, branches, and activity.</p>
        </CardContent>
      </Card>
    );
  }

  if (totalCount === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <Search className="h-10 w-10 mx-auto mb-3 opacity-50" />
          <p>No results found for &quot;{searchParams.get("q")}&quot;</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-body text-muted-foreground">
        {totalCount} result{totalCount !== 1 ? "s" : ""} for &quot;{searchParams.get("q")}&quot;
      </p>

      {results.orders.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-body flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {results.orders.map((order) => (
                <li key={order.id}>
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="flex items-center justify-between rounded-md py-2 px-2 -mx-2 hover:bg-muted text-body"
                  >
                    <span className="font-medium">{order.orderNumber}</span>
                    <span className="text-muted-foreground text-caption">
                      {formatCurrency(order.total)}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0 ml-2" />
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {results.products.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-body flex items-center gap-2">
              <Package className="h-4 w-4" />
              Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {results.products.map((product) => (
                <li key={product.productId}>
                  <Link
                    href="/admin/products"
                    className="flex items-center justify-between rounded-md py-2 px-2 -mx-2 hover:bg-muted text-body"
                  >
                    <span className="font-medium">{product.productName}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0 ml-2" />
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {results.users.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-body flex items-center gap-2">
              <Users className="h-4 w-4" />
              Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {results.users.map((user) => (
                <li key={user.id}>
                  <Link
                    href="/admin/users"
                    className="flex items-center justify-between rounded-md py-2 px-2 -mx-2 hover:bg-muted text-body"
                  >
                    <div>
                      <span className="font-medium">{user.name}</span>
                      <span className="text-muted-foreground text-caption block">
                        {user.email}
                      </span>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0 ml-2" />
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {results.branches.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-body flex items-center gap-2">
              <Store className="h-4 w-4" />
              Branches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {results.branches.map((branch) => (
                <li key={branch.branchId}>
                  <Link
                    href={`/admin/branches/${branch.branchId}`}
                    className="flex items-center justify-between rounded-md py-2 px-2 -mx-2 hover:bg-muted text-body"
                  >
                    <span className="font-medium">
                      {branch.branchName.replace("Caffissimo", "").trim()}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0 ml-2" />
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {results.auditLogs.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-body flex items-center gap-2">
              <FileSearch className="h-4 w-4" />
              Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {results.auditLogs.map((log) => (
                <li key={log.id}>
                  <Link
                    href="/admin/audit-logs"
                    className="flex items-center justify-between rounded-md py-2 px-2 -mx-2 hover:bg-muted text-body"
                  >
                    <div>
                      <span className="font-medium">{actionLabels[log.action]}</span>
                      <span className="text-muted-foreground text-caption block">
                        {log.userName} · {formatDateTime(log.createdAt)}
                      </span>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0 ml-2" />
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function AdminSearchPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Search"
        description="Results from across the admin"
      />
      <Suspense
        fallback={
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Loading...
            </CardContent>
          </Card>
        }
      >
        <SearchResultsContent />
      </Suspense>
    </div>
  );
}
