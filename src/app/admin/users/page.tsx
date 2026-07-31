"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Plus,
  MoreVertical,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Edit,
  UserX,
  Shield,
  Users,
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
  Header,
} from "@tanstack/react-table";
import { Card, CardContent } from "@/components/ui/card";
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
  DialogTrigger,
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { useAppSelector } from "@/stores/store";
import { canManageUsers, canAccessAllBranches } from "@/lib/rbac";

import { getInitials, formatDate } from "@/lib/utils";
import { User, UserRole } from "@/types";
import {
  useGetUsersQuery,
  useCreateUserMutation,
  useUpdateUserRoleMutation,
  useResetUserPasswordMutation,
  useDeleteUserMutation,
} from "@/stores/api/userApi";
import { useGetBranchesQuery } from "@/stores/api/branchApi";
import { toast } from "sonner";

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

const columnHelper = createColumnHelper<User>();

function SortIcon({ header }: { header: Header<User, unknown> }) {
  if (!header.column.getCanSort()) return null;
  const sorted = header.column.getIsSorted();
  if (sorted === "asc") return <ArrowUp className="h-3.5 w-3.5 ml-1" />;
  if (sorted === "desc") return <ArrowDown className="h-3.5 w-3.5 ml-1" />;
  return <ArrowUpDown className="h-3.5 w-3.5 ml-1 opacity-40" />;
}

export default function UsersPage() {
  const { currentRole: uiRole, selectedBranchId, assignedBranchId } = useAppSelector((state) => state.ui);
  const authRole = useAppSelector((state) => state.auth.user?.role) || UserRole.Cashier;
  const currentRole = uiRole || authRole;
  const effectiveBranchId = (selectedBranchId || assignedBranchId) ?? undefined;
  const loggedInUser = useAppSelector((state) => state.auth.user);
  const loggedInUserRole = loggedInUser?.role;
  const isBranchOwnerOrAdmin =
    loggedInUserRole === UserRole.BranchOwner ||
    loggedInUserRole === UserRole.BranchAdmin ||
    currentRole === UserRole.BranchOwner ||
    currentRole === UserRole.BranchAdmin;

  const loggedInUserBranchId = loggedInUser?.branchId || assignedBranchId || selectedBranchId || "";
  const displayedBranchId = isBranchOwnerOrAdmin ? loggedInUserBranchId : effectiveBranchId;
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const [updateUserRole] = useUpdateUserRoleMutation();
  const [resetUserPassword] = useResetUserPasswordMutation();
  const [deleteUser] = useDeleteUserMutation();
  
  const { data: branchesData } = useGetBranchesQuery({ pageSize: 100 });
  const branches = branchesData?.items || [];
  
  const { data: usersData } = useGetUsersQuery({
    page: 1,
    pageSize: 100,
    branchId: canAccessAllBranches(currentRole) ? undefined : (effectiveBranchId || undefined),
  });
  const users: User[] = useMemo(() => {
    return (usersData?.items || []).map((u) => ({
      id: u.id,
      name: `${u.firstName} ${u.lastName}`.trim(),
      email: u.email,
      role: u.role,
      branchId: u.branchId,
      isActive: u.isActive,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    }));
  }, [usersData]);

  const canManage = canManageUsers(currentRole);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        !globalFilter ||
        user.name.toLowerCase().includes(globalFilter.toLowerCase()) ||
        user.email.toLowerCase().includes(globalFilter.toLowerCase());
      const matchesRole = roleFilter === "all" || user.role === (roleFilter as UserRole);
      const matchesBranch =
        canAccessAllBranches(currentRole) ||
        user.branchId === effectiveBranchId;
      return matchesSearch && matchesRole && matchesBranch;
    });
  }, [globalFilter, roleFilter, currentRole, effectiveBranchId, users]);

  const getBranchName = (branchId?: string) => {
    if (!branchId) return "All Branches";
    return branches.find((b) => b.branchId === branchId)?.branchName.replace("Caffissimo", "").trim() || "Unknown";
  };

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: UserRole.Cashier,
    branchId: "",
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!canAccessAllBranches(currentRole) && displayedBranchId) {
      setFormData((prev) => ({
        ...prev,
        branchId: displayedBranchId,
      }));
    }
  }, [currentRole, displayedBranchId]);

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

    if (!formData.role)
      errors.role = "Role is required.";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      role: UserRole.Cashier,
      branchId: canAccessAllBranches(currentRole) ? "" : displayedBranchId || "",
    });
    setFormErrors({});
  };

  const handleCreateUser = async () => {
    if (!validateForm()) return;
    try {
      await createUser({
        ...formData,
        role: formData.role.toString(),
        branchId: formData.branchId || undefined,
      }).unwrap();
      toast.success("User created successfully");
      setCreateDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to create user");
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      await updateUserRole({ id: userId, data: { role: newRole } }).unwrap();
      toast.success("User role updated");
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to update role");
    }
  };

  const handleResetPassword = async (userId: string) => {
    const newPassword = prompt("Enter new password:");
    if (!newPassword) return;

    try {
      await resetUserPassword({ id: userId, data: { newPassword } }).unwrap();
      toast.success("Password reset successfully");
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to reset password");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
      await deleteUser(userId).unwrap();
      toast.success("User deleted successfully");
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to delete user");
    }
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: "User",
        cell: (info) => {
          const user = info.row.original;
          return (
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-primary/10 text-primary">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-foreground">{user.name}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
          );
        },
      }),
      columnHelper.accessor("role", {
        header: "Role",
        enableSorting: false,
        cell: (info) => (
          <Badge variant={roleBadgeVariants[info.getValue()]}>
            <Shield className="h-3 w-3 mr-1" />
            {roleLabels[info.getValue()]}
          </Badge>
        ),
      }),
      columnHelper.accessor("branchId", {
        header: "Branch",
        enableSorting: false,
        cell: (info) => (
          <span className="text-sm text-foreground">
            {getBranchName(info.getValue())}
          </span>
        ),
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
        header: "Created",
        cell: (info) => (
          <span className="text-sm text-muted-foreground">
            {formatDate(info.getValue())}
          </span>
        ),
      }),
      columnHelper.display({
        id: "actions",
        cell: (info) => (
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
              <DropdownMenuItem onClick={() => handleResetPassword(info.row.original.id)}>
                <Shield className="h-4 w-4 mr-2" />
                Reset Password
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-destructive"
                onClick={() => handleDeleteUser(info.row.original.id)}
              >
                <UserX className="h-4 w-4 mr-2" />
                Delete User
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      }),
    ],
    []
  );

  const table = useReactTable({
    data: filteredUsers,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      pagination: { pageSize: 10 },
    },
  });

  const pageIndex = table.getState().pagination.pageIndex;
  const pageSize = table.getState().pagination.pageSize;
  const totalRows = table.getFilteredRowModel().rows.length;

  if (!canManage) {
    return (
      <div className="space-y-6">
        <PageHeader title="Users" />
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={Users}
              title="Access Denied"
              description="You don't have permission to manage users"
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users & Roles"
        description="Manage user accounts and permissions"
        actions={
          <Dialog open={createDialogOpen} onOpenChange={(open) => { setCreateDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
                <DialogDescription>
                  Add a new user to the system. They will receive an email to access their account.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input 
                      id="firstName" 
                      placeholder="John" 
                      value={formData.firstName}
                      className={formErrors.firstName ? "border-destructive focus-visible:ring-destructive" : ""}
                      onChange={(e) => {
                        setFormData({ ...formData, firstName: e.target.value });
                        if (formErrors.firstName) setFormErrors((prev) => ({ ...prev, firstName: "" }));
                      }}
                    />
                    {formErrors.firstName && (
                      <p className="text-xs text-destructive mt-1">{formErrors.firstName}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input 
                      id="lastName" 
                      placeholder="Doe" 
                      value={formData.lastName}
                      className={formErrors.lastName ? "border-destructive focus-visible:ring-destructive" : ""}
                      onChange={(e) => {
                        setFormData({ ...formData, lastName: e.target.value });
                        if (formErrors.lastName) setFormErrors((prev) => ({ ...prev, lastName: "" }));
                      }}
                    />
                    {formErrors.lastName && (
                      <p className="text-xs text-destructive mt-1">{formErrors.lastName}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="john@caffissimo.com" 
                    value={formData.email}
                    className={formErrors.email ? "border-destructive focus-visible:ring-destructive" : ""}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value });
                      if (formErrors.email) setFormErrors((prev) => ({ ...prev, email: "" }));
                    }}
                  />
                  {formErrors.email && (
                    <p className="text-xs text-destructive mt-1">{formErrors.email}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Temporary Password</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="••••••••" 
                    value={formData.password}
                    className={formErrors.password ? "border-destructive focus-visible:ring-destructive" : ""}
                    onChange={(e) => {
                      setFormData({ ...formData, password: e.target.value });
                      if (formErrors.password) setFormErrors((prev) => ({ ...prev, password: "" }));
                    }}
                  />
                  {formErrors.password && (
                    <p className="text-xs text-destructive mt-1">{formErrors.password}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select 
                    value={formData.role} 
                    onValueChange={(v) => {
                      const isGlobalRole = v === UserRole.SuperAdmin || v === UserRole.SuperAdminDeveloper;
                      setFormData({ ...formData, role: v as UserRole, branchId: isGlobalRole ? "" : formData.branchId });
                      if (formErrors.role) setFormErrors((prev) => ({ ...prev, role: "" }));
                    }}
                  >
                    <SelectTrigger id="role" className={formErrors.role ? "border-destructive" : ""}>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {canAccessAllBranches(currentRole) ? (
                        <>
                          <SelectItem value={UserRole.SuperAdmin}>Super Admin</SelectItem>
                          <SelectItem value={UserRole.SuperAdminDeveloper}>Developer</SelectItem>
                          <SelectItem value={UserRole.BranchOwner}>Branch Owner</SelectItem>
                          <SelectItem value={UserRole.BranchAdmin}>Branch Admin</SelectItem>
                          <SelectItem value={UserRole.Supervisor}>Supervisor</SelectItem>
                          <SelectItem value={UserRole.Cashier}>Cashier</SelectItem>
                          <SelectItem value={UserRole.Employee}>Employee</SelectItem>
                        </>
                      ) : (
                        <>
                          <SelectItem value={UserRole.BranchOwner}>Branch Owner</SelectItem>
                          <SelectItem value={UserRole.BranchAdmin}>Branch Admin</SelectItem>
                          <SelectItem value={UserRole.Supervisor}>Supervisor</SelectItem>
                          <SelectItem value={UserRole.Cashier}>Cashier</SelectItem>
                          <SelectItem value={UserRole.Employee}>Employee</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
{formData.role !== UserRole.SuperAdmin && formData.role !== UserRole.SuperAdminDeveloper && (
                  <div className="space-y-2">
                    <Label htmlFor="branch">Branch Assignment</Label>
                    {canAccessAllBranches(currentRole) ? (
                      <Select 
                        value={formData.branchId} 
                        onValueChange={(v) => setFormData({ ...formData, branchId: v })}
                      >
                        <SelectTrigger id="branch">
                          <SelectValue placeholder="Select branch" />
                        </SelectTrigger>
                        <SelectContent>
                          {branches.map((branch) => (
                            <SelectItem key={branch.branchId} value={branch.branchId}>
                              {branch.branchName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input 
                        id="branch" 
                        value={getBranchName(displayedBranchId)} 
                        disabled 
                        className="bg-muted text-muted-foreground"
                      />
                    )}
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateUser} disabled={isCreating}>
                  {isCreating ? "Creating..." : "Create User"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Filter Bar - same layout as Orders */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-auto h-9 gap-1.5 rounded-lg border-border/80 bg-background px-3.5 text-sm font-medium shadow-none">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {canAccessAllBranches(currentRole) ? (
                <>
                  <SelectItem value={UserRole.SuperAdmin}>Super Admin</SelectItem>
                  <SelectItem value={UserRole.SuperAdminDeveloper}>Developer</SelectItem>
                  <SelectItem value={UserRole.BranchOwner}>Branch Owner</SelectItem>
                  <SelectItem value={UserRole.BranchAdmin}>Branch Admin</SelectItem>
                  <SelectItem value={UserRole.Supervisor}>Supervisor</SelectItem>
                  <SelectItem value={UserRole.Cashier}>Cashier</SelectItem>
                  <SelectItem value={UserRole.Employee}>Employee</SelectItem>
                </>
              ) : (
                <>
                  <SelectItem value={UserRole.BranchOwner}>Branch Owner</SelectItem>
                  <SelectItem value={UserRole.BranchAdmin}>Branch Admin</SelectItem>
                  <SelectItem value={UserRole.Supervisor}>Supervisor</SelectItem>
                  <SelectItem value={UserRole.Cashier}>Cashier</SelectItem>
                  <SelectItem value={UserRole.Employee}>Employee</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-9 w-[220px] h-9 bg-background rounded-lg"
          />
        </div>
      </div>

      <div>
        <div className="p-0">
          {filteredUsers.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={Users}
                title="No users found"
                description="Try adjusting your search or filters"
              />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow
                      key={headerGroup.id}
                      className="hover:bg-transparent border-b border-border/60"
                    >
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

              {/* Pagination - same as Orders */}
              <div className="flex items-center justify-between border-t border-border/60 px-6 py-4">
                <p className="text-sm text-muted-foreground">
                  Showing{" "}
                  <span className="font-medium text-foreground">
                    {pageIndex * pageSize + 1}
                  </span>
                  {" "}to{" "}
                  <span className="font-medium text-foreground">
                    {Math.min((pageIndex + 1) * pageSize, totalRows)}
                  </span>
                  {" "}of{" "}
                  <span className="font-medium text-foreground">{totalRows}</span>
                  {" "}users
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
                    if (totalPages <= 5) {
                      pageNum = i;
                    } else if (pageIndex < 3) {
                      pageNum = i;
                    } else if (pageIndex > totalPages - 4) {
                      pageNum = totalPages - 5 + i;
                    } else {
                      pageNum = pageIndex - 2 + i;
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={pageIndex === pageNum ? "default" : "outline"}
                        size="sm"
                        className="h-8 w-8 p-0 text-xs"
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
