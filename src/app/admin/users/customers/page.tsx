"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Plus,
  MoreVertical,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  UserX,
  Shield,
  Eye,
  UserCheck,
} from "lucide-react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
  PaginationState,
  Header,
} from "@tanstack/react-table";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { useAppSelector } from "@/stores/store";
import { canManageUsers, isSuperAdmin } from "@/lib/rbac";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ResetPasswordDialog } from "@/components/shared/reset-password-dialog";

import { getInitials, formatDate, cn } from "@/lib/utils";
import { UserRole, AppUser } from "@/types";
import {
  useGetUsersQuery,
  useCreateUserMutation,
  useResetUserPasswordMutation,
  useDeleteUserMutation,
} from "@/stores/api/userApi";
import { toast } from "sonner";

const columnHelper = createColumnHelper<AppUser>();

function SortIcon({ header }: { header: Header<AppUser, unknown> }) {
  if (!header.column.getCanSort()) return null;
  const sorted = header.column.getIsSorted();
  if (sorted === "asc") return <ArrowUp className="h-3.5 w-3.5 ml-1" />;
  if (sorted === "desc") return <ArrowDown className="h-3.5 w-3.5 ml-1" />;
  return <ArrowUpDown className="h-3.5 w-3.5 ml-1 opacity-40" />;
}

export default function CustomersPage() {
  const router = useRouter();
  const { currentRole: uiRole } = useAppSelector((state) => state.ui);
  const authRole = useAppSelector((state) => state.auth.user?.role) || UserRole.Cashier;
  const currentRole = uiRole || authRole;

  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [resetPasswordTarget, setResetPasswordTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const [resetUserPassword] = useResetUserPasswordMutation();
  const [deleteUser] = useDeleteUserMutation();

  const { data: usersData, isLoading: isUsersLoading } = useGetUsersQuery({
    page: 1,
    pageSize: 100,
    role: UserRole.Customer,
  });

  const customers: AppUser[] = useMemo(() => {
    return (usersData?.items || []).filter((u) => u.role === UserRole.Customer);
  }, [usersData]);

  const canManage = canManageUsers(currentRole);
  const isSuper = isSuperAdmin(currentRole);

  const filteredCustomers = useMemo(() => {
    return customers.filter((cust) => {
      const name = `${cust.firstName || ""} ${cust.lastName || ""}`.toLowerCase();
      const email = (cust.email || "").toLowerCase();
      const phone = (cust.phoneNumber || "").toLowerCase();
      const city = (cust.city || "").toLowerCase();
      const search = globalFilter.toLowerCase();

      const matchesSearch =
        !search ||
        name.includes(search) ||
        email.includes(search) ||
        phone.includes(search) ||
        city.includes(search);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && cust.isActive) ||
        (statusFilter === "inactive" && !cust.isActive);

      return matchesSearch && matchesStatus;
    });
  }, [globalFilter, statusFilter, customers]);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phoneNumber: "",
    city: "",
    postalCode: "",
    addressLine1: "",
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.firstName.trim())
      errors.firstName = "First name is required.";
    else if (formData.firstName.length > 100)
      errors.firstName = "First name must not exceed 100 characters.";

    if (!formData.lastName.trim())
      errors.lastName = "Last name is required.";
    else if (formData.lastName.length > 100)
      errors.lastName = "Last name must not exceed 100 characters.";

    if (!formData.email.trim())
      errors.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      errors.email = "A valid email address is required.";
    else if (formData.email.length > 256)
      errors.email = "Email must not exceed 256 characters.";

    if (!formData.password)
      errors.password = "Password is required.";
    else if (formData.password.length < 6)
      errors.password = "Password must be at least 6 characters.";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      phoneNumber: "",
      city: "",
      postalCode: "",
      addressLine1: "",
    });
    setFormErrors({});
  };

  const handleCreateCustomer = async () => {
    if (!validateForm()) return;
    try {
      await createUser({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        role: UserRole.Customer,
      }).unwrap();
      toast.success("Customer created successfully");
      setCreateDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to create customer");
    }
  };

  const handleConfirmResetPassword = async (newPassword: string) => {
    if (!resetPasswordTarget) return;
    setIsResetting(true);
    try {
      await resetUserPassword({ id: resetPasswordTarget.id, data: { newPassword } }).unwrap();
      toast.success("Password reset successfully");
      setResetPasswordTarget(null);
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to reset password");
      throw error;
    } finally {
      setIsResetting(false);
    }
  };

  const handleConfirmDeleteCustomer = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteUser(deleteTarget.id).unwrap();
      toast.success("Customer deleted successfully");
      setDeleteTarget(null);
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to delete customer");
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = useMemo(
    () => {
      const cols: any[] = [
        columnHelper.accessor("firstName", {
          id: "customer",
          header: "Customer",
          cell: (info) => {
            const cust = info.row.original;
            const name = `${cust.firstName || ""} ${cust.lastName || ""}`.trim() || "Unnamed Customer";
            return (
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  {cust.profilePictureUrl && <AvatarImage src={cust.profilePictureUrl} alt={name} />}
                  <AvatarFallback className="bg-primary/10 text-primary font-medium">
                    {getInitials(name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Link
                    href={`/admin/users/customers/${cust.id}`}
                    className="font-medium text-foreground hover:underline"
                  >
                    {name}
                  </Link>
                  <p className="text-body text-muted-foreground">{cust.email}</p>
                </div>
              </div>
            );
          },
        }),
        columnHelper.accessor("phoneNumber", {
          header: "Phone",
          cell: (info) => (
            <span className="text-body text-muted-foreground">
              {info.getValue() || "—"}
            </span>
          ),
        }),
        columnHelper.accessor("city", {
          header: "City / Location",
          cell: (info) => {
            const cust = info.row.original;
            const location = [cust.city, cust.postalCode].filter(Boolean).join(", ");
            return (
              <span className="text-body text-muted-foreground">
                {location || "—"}
              </span>
            );
          },
        }),
        columnHelper.accessor("isActive", {
          header: "Status",
          enableSorting: false,
          cell: (info) => (
            <Badge variant={info.getValue() ? "success" : "secondary"}>
              {info.getValue() ? "Active" : "Inactive"}
            </Badge>
          ),
        }),
        columnHelper.accessor("createdAt", {
          header: "Joined",
          cell: (info) => (
            <span className="text-body text-muted-foreground">
              {formatDate(info.getValue())}
            </span>
          ),
        }),
        columnHelper.display({
          id: "actions",
          cell: (info) => {
            const cust = info.row.original;
            const name = `${cust.firstName || ""} ${cust.lastName || ""}`.trim() || "Customer";
            return (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/admin/users/customers/${cust.id}`}>
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Link>
                  </DropdownMenuItem>
                  {isSuper && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setResetPasswordTarget({ id: cust.id, name })}>
                        <Shield className="h-4 w-4 mr-2" />
                        Reset Password
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => setDeleteTarget({ id: cust.id, name })}
                      >
                        <UserX className="h-4 w-4 mr-2" />
                        Delete Customer
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            );
          },
        }),
      ];

      return cols;
    },
    [isSuper]
  );

  const table = useReactTable({
    data: filteredCustomers,
    columns,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const totalCount = filteredCustomers.length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        description="View and manage registered customers, online account profiles, and delivery details"
        actions={
          canManage && (
            <Button
              onClick={() => {
                resetForm();
                setCreateDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Customer
            </Button>
          )
        }
      />

      <Card className="p-6 space-y-4 bg-white dark:bg-[#141414] border border-border shadow-none rounded-xl">
        {/* Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search customers by name, email, phone, or city..."
              value={globalFilter}
              onChange={(e) => {
                setGlobalFilter(e.target.value);
                setPagination((prev) => ({ ...prev, pageIndex: 0 }));
              }}
              className="pl-9 w-[320px] h-9 bg-white dark:bg-[#141414] rounded-lg"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Select
              value={statusFilter}
              onValueChange={(val) => {
                setStatusFilter(val);
                setPagination((prev) => ({ ...prev, pageIndex: 0 }));
              }}
            >
              <SelectTrigger className="w-auto h-9 gap-1.5 rounded-lg border-border/80 bg-white dark:bg-[#141414] px-3.5 text-body font-medium shadow-none">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table / State Container */}
        <div className="overflow-hidden rounded-lg">
          {isUsersLoading ? (
            <div className="space-y-2 p-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="p-12">
              <EmptyState
                icon={UserCheck}
                title="No customers found"
                description="Try adjusting your search or status filters"
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

        {/* Pagination Footer */}
        {!isUsersLoading && totalCount > 0 && (
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
              {" "}customers
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

      {/* Add Customer Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
            <DialogDescription>
              Create a customer account for online ordering and loyalty.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="cust-firstName">First Name *</Label>
                <Input
                  id="cust-firstName"
                  placeholder="First name"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                  className={formErrors.firstName ? "border-destructive" : ""}
                />
                {formErrors.firstName && (
                  <p className="text-caption text-destructive">{formErrors.firstName}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cust-lastName">Last Name *</Label>
                <Input
                  id="cust-lastName"
                  placeholder="Last name"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                  className={formErrors.lastName ? "border-destructive" : ""}
                />
                {formErrors.lastName && (
                  <p className="text-caption text-destructive">{formErrors.lastName}</p>
                )}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cust-email">Email Address *</Label>
              <Input
                id="cust-email"
                type="email"
                placeholder="customer@example.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className={formErrors.email ? "border-destructive" : ""}
              />
              {formErrors.email && (
                <p className="text-caption text-destructive">{formErrors.email}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cust-password">Initial Password *</Label>
              <Input
                id="cust-password"
                type="password"
                placeholder="Min. 6 characters"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className={formErrors.password ? "border-destructive" : ""}
              />
              {formErrors.password && (
                <p className="text-caption text-destructive">{formErrors.password}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cust-phone">Phone Number (Optional)</Label>
              <Input
                id="cust-phone"
                type="tel"
                placeholder="+61 400 000 000"
                value={formData.phoneNumber}
                onChange={(e) =>
                  setFormData({ ...formData, phoneNumber: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateCustomer} disabled={isCreating}>
              {isCreating ? "Creating..." : "Create Customer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <ResetPasswordDialog
        open={Boolean(resetPasswordTarget)}
        onOpenChange={(open) => !open && setResetPasswordTarget(null)}
        userName={resetPasswordTarget?.name || "Customer"}
        isLoading={isResetting}
        onReset={handleConfirmResetPassword}
      />

      {/* Delete Customer Confirm Dialog */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Customer Account"
        description={`Are you sure you want to delete ${deleteTarget?.name}? This will permanently remove their customer profile and authentication account. This action cannot be undone.`}
        confirmText="Delete Customer"
        variant="destructive"
        isLoading={isDeleting}
        onConfirm={handleConfirmDeleteCustomer}
      />
    </div>
  );
}
