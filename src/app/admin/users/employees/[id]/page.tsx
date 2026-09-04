"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Shield,
  Mail,
  Phone,
  Calendar,
  Clock,
  Building2,
  User as UserIcon,
  Copy,
  Check,
  UserX,
  ExternalLink,
  MapPin,
  MoreVertical,
} from "lucide-react";
import { TbEdit } from "react-icons/tb";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageHeader } from "@/components/shared/page-header";
import { EditBar } from "@/components/shared/edit-bar";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ResetPasswordDialog } from "@/components/shared/reset-password-dialog";
import { useAppSelector } from "@/stores/store";
import { canManageUsers, isSuperAdmin, getAllowedTargetRoles } from "@/lib/rbac";
import {
  useGetUserByIdQuery,
  useUpdateUserRoleMutation,
  useResetUserPasswordMutation,
  useDeleteUserMutation,
} from "@/stores/api/userApi";
import { useGetBranchesQuery } from "@/stores/api/branchApi";
import { getInitials, formatDate, formatDateTime } from "@/lib/utils";
import { UserRole } from "@/types";
import { toast } from "sonner";

interface EmployeeDetailPageProps {
  params: Promise<{ id: string }>;
}

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

const roleDescriptions: Record<UserRole, string> = {
  [UserRole.SuperAdmin]: "Full administrative access to manage all branches, products, and system settings.",
  [UserRole.SuperAdminDeveloper]: "Full developer and administrative access across all system operations.",
  [UserRole.Customer]: "Customer account used for placing online orders and earning loyalty rewards.",
  [UserRole.BranchOwner]: "Full ownership and operational permissions for the assigned branch.",
  [UserRole.BranchAdmin]: "Administrative permissions for menu, pricing, and staff within the assigned branch.",
  [UserRole.Supervisor]: "Supervises branch shift operations, orders, and attendance.",
  [UserRole.Cashier]: "Handles point of sale (POS) transactions and counter orders.",
  [UserRole.Employee]: "Standard branch staff member with basic access.",
};

export default function EmployeeDetailPage({ params }: EmployeeDetailPageProps) {
  const resolvedParams = use(params);
  const router = useRouter();

  const { currentRole: uiRole } = useAppSelector((state) => state.ui);
  const authRole = useAppSelector((state) => state.auth.user?.role) || UserRole.Cashier;
  const currentRole = uiRole || authRole;
  const isSuper = isSuperAdmin(currentRole);
  const assignedBranchId = useAppSelector((state) => state.auth.user?.branchId);
  const canEdit = canManageUsers(currentRole);
  const allowedRoles = getAllowedTargetRoles(currentRole).filter((r) => r !== UserRole.Customer);

  const { data: user, isLoading: isUserLoading, error: userError } = useGetUserByIdQuery(resolvedParams.id);
  const { data: branchesData } = useGetBranchesQuery({ pageSize: 100 });
  const branches = branchesData?.items || [];

  const [updateUserRole, { isLoading: isUpdatingRole }] = useUpdateUserRoleMutation();
  const [resetUserPassword] = useResetUserPasswordMutation();
  const [deleteUser, { isLoading: isDeletingUser }] = useDeleteUserMutation();

  const [isEditing, setIsEditing] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole | "">("");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (user && !isSuper && assignedBranchId && user.branchId && user.branchId !== assignedBranchId) {
      toast.error("You are only authorized to view employees from your own branch.");
      router.push("/admin/users/employees");
    }
  }, [user, isSuper, assignedBranchId, router]);

  useEffect(() => {
    if (user) {
      setSelectedRole(user.role);
    }
  }, [user]);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success(`${field} copied to clipboard`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSaveChanges = async () => {
    if (!user) return;
    if (!selectedRole) {
      toast.error("Please select a valid role.");
      return;
    }

    try {
      if (selectedRole !== user.role) {
        await updateUserRole({
          id: user.id,
          data: { role: selectedRole.toString() },
        }).unwrap();
        toast.success("Employee role updated successfully");
      }
      setIsEditing(false);
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to update employee");
    }
  };

  const handleConfirmResetPassword = async (newPassword: string) => {
    if (!user) return;
    setIsResetting(true);
    try {
      await resetUserPassword({ id: user.id, data: { newPassword } }).unwrap();
      toast.success("Password reset successfully");
      setResetPasswordOpen(false);
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to reset password");
      throw error;
    } finally {
      setIsResetting(false);
    }
  };

  const handleConfirmDeleteUser = async () => {
    if (!user) return;
    try {
      await deleteUser(user.id).unwrap();
      toast.success("Employee deleted successfully");
      router.push("/admin/users/employees");
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to delete employee");
    }
  };

  if (isUserLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>
        </div>

        <Skeleton className="h-40 w-full rounded-xl" />

        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-80 w-full rounded-xl" />
          <Skeleton className="h-80 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (userError || !user) {
    return (
      <div className="space-y-6">
        <PageHeader title="Employee Not Found" />
        <Card className="border border-border shadow-none rounded-xl">
          <CardContent className="py-12 text-center">
            <UserX className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-foreground">Employee Not Found</h3>
            <p className="text-muted-foreground text-body mt-1">
              The employee profile you are looking for does not exist or you do not have permission to view it.
            </p>
            <Button onClick={() => router.push("/admin/users/employees")} className="mt-6">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Employees
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Unnamed Employee";
  const assignedBranch = branches.find((b) => b.branchId === user.branchId);
  const branchName = user.branchName || (assignedBranch ? assignedBranch.branchName.replace("Caffissimo", "").trim() : "None");

  const hasAddress = Boolean(user.addressLine1 || user.addressLine2 || user.city || user.postalCode);

  return (
    <div className="space-y-6 pb-20">
      {/* Top Header */}
      <div className="flex items-center gap-4 w-full">
        <Button variant="ghost" size="icon" onClick={() => router.push("/admin/users/employees")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader
          className="flex-1"
          title={fullName}
          description={isEditing ? "Edit employee role and branch assignment" : "Employee profile, role permissions, and branch affiliation"}
          actions={
            <div className="flex items-center gap-2">
              {canEdit && !isEditing && (
                <Button onClick={() => setIsEditing(true)}>
                  <TbEdit className="h-4 w-4 mr-2" />
                  Edit Employee
                </Button>
              )}
              {isSuper && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="h-9 w-9">
                      <MoreVertical className="h-4 w-4" />
                      <span className="sr-only">Actions</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setResetPasswordOpen(true)}>
                      <Shield className="h-4 w-4 mr-2" />
                      Reset Password
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => setDeleteDialogOpen(true)}
                    >
                      <UserX className="h-4 w-4 mr-2" />
                      Delete Employee
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          }
        />
      </div>

      {/* Employee Hero Overview Card */}
      <Card className="border border-border shadow-none rounded-xl bg-white dark:bg-[#141414] overflow-hidden">
        <div className="h-2 bg-primary/20 w-full" />
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <Avatar className="h-20 w-20 border-2 border-border/50 shadow-sm">
                {user.profilePictureUrl ? (
                  <AvatarImage src={user.profilePictureUrl} alt={fullName} className="object-cover" />
                ) : null}
                <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                  {getInitials(fullName)}
                </AvatarFallback>
              </Avatar>

              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h2 className="text-xl font-semibold text-foreground leading-tight">{fullName}</h2>
                  <Badge variant={roleBadgeVariants[user.role]}>
                    {roleLabels[user.role] || user.role}
                  </Badge>
                  <Badge variant={user.isActive ? "success" : "secondary"}>
                    {user.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-body text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Mail className="h-4 w-4 text-muted-foreground/70" />
                    {user.email}
                  </span>
                  {user.phoneNumber && (
                    <span className="flex items-center gap-1.5">
                      <Phone className="h-4 w-4 text-muted-foreground/70" />
                      {user.phoneNumber}
                    </span>
                  )}
                  {user.branchId && (
                    <span className="flex items-center gap-1.5">
                      <Building2 className="h-4 w-4 text-muted-foreground/70" />
                      {branchName}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Metadata Chips */}
            <div className="flex flex-wrap md:flex-col gap-2 md:items-end justify-start text-caption text-muted-foreground border-t md:border-t-0 pt-4 md:pt-0">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                <span>Joined {formatDate(user.createdAt)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                <span>Updated {formatDateTime(user.updatedAt)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detail Cards Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Personal & Contact Information Card */}
        <Card className="border border-border shadow-none rounded-xl bg-white dark:bg-[#141414]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UserIcon className="h-4 w-4 text-primary" />
              Personal Information
            </CardTitle>
            <CardDescription>Basic contact and profile information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-muted-foreground text-caption font-normal">First Name</Label>
                <Input value={user.firstName || "-"} disabled className="bg-muted/30 text-foreground" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-muted-foreground text-caption font-normal">Last Name</Label>
                <Input value={user.lastName || "-"} disabled className="bg-muted/30 text-foreground" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-muted-foreground text-caption font-normal">Email Address</Label>
              <div className="relative">
                <Input value={user.email} disabled className="bg-muted/30 text-foreground pr-10" />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={() => handleCopy(user.email, "Email")}
                >
                  {copiedField === "Email" ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-muted-foreground text-caption font-normal">Phone Number</Label>
                <Input value={user.phoneNumber || "Not provided"} disabled className="bg-muted/30 text-foreground" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-muted-foreground text-caption font-normal">Birthday</Label>
                <Input value={user.birthday ? formatDate(user.birthday) : "Not provided"} disabled className="bg-muted/30 text-foreground" />
              </div>
            </div>

            {user.age && (
              <div className="space-y-1.5">
                <Label className="text-muted-foreground text-caption font-normal">Age</Label>
                <Input value={user.age.toString()} disabled className="bg-muted/30 text-foreground" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Role & Access Management Card */}
        <Card className="border border-border shadow-none rounded-xl bg-white dark:bg-[#141414]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-4 w-4 text-primary" />
              Role & Branch Assignment
            </CardTitle>
            <CardDescription>Control permissions and branch affiliation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-muted-foreground text-caption font-normal">Assigned Role</Label>
              {isEditing && canEdit ? (
                <Select
                  value={selectedRole}
                  onValueChange={(val) => setSelectedRole(val as UserRole)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {allowedRoles.map((role) => (
                      <SelectItem key={role} value={role}>
                        {roleLabels[role] || role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="p-3 rounded-lg border border-border/60 bg-muted/20 flex items-center justify-between">
                  <div>
                    <span className="font-medium text-foreground">{roleLabels[user.role] || user.role}</span>
                    <p className="text-caption text-muted-foreground mt-0.5">
                      {roleDescriptions[user.role] || "Standard employee permissions"}
                    </p>
                  </div>
                  <Badge variant={roleBadgeVariants[user.role]}>
                    {roleLabels[user.role] || user.role}
                  </Badge>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-muted-foreground text-caption font-normal">Assigned Branch</Label>
              {user.branchId ? (
                <div className="p-3 rounded-lg border border-border/60 bg-muted/20 flex items-center justify-between gap-3">
                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    <Building2 className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground truncate">{branchName}</p>
                      {assignedBranch?.branchAddress && (
                        <p className="text-caption text-muted-foreground break-words leading-relaxed">{assignedBranch.branchAddress}</p>
                      )}
                    </div>
                  </div>
                  <Link
                    href={`/admin/branches/${user.branchId}`}
                    className="inline-flex items-center text-caption font-medium text-primary hover:underline shrink-0 whitespace-nowrap"
                  >
                    View Branch
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </Link>
                </div>
              ) : (
                <Input value="No branch assigned (Global / Head Office)" disabled className="bg-muted/30 text-muted-foreground" />
              )}
            </div>

            <div className="space-y-1.5 pt-2 border-t border-border/60">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-body font-medium text-foreground">Active Status</Label>
                  <p className="text-caption text-muted-foreground">Staff account access status</p>
                </div>
                <Badge variant={user.isActive ? "success" : "secondary"}>
                  {user.isActive ? "Active Account" : "Suspended / Inactive"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Address Information Card (if applicable) */}
        {hasAddress && (
          <Card className="border border-border shadow-none rounded-xl bg-white dark:bg-[#141414] lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="h-4 w-4 text-primary" />
                Address Details
              </CardTitle>
              <CardDescription>Residential or contact address</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-muted-foreground text-caption font-normal">Address Line 1</Label>
                <Input value={user.addressLine1 || "-"} disabled className="bg-muted/30 text-foreground" />
              </div>
              {user.addressLine2 && (
                <div className="space-y-1.5">
                  <Label className="text-muted-foreground text-caption font-normal">Address Line 2</Label>
                  <Input value={user.addressLine2} disabled className="bg-muted/30 text-foreground" />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-muted-foreground text-caption font-normal">City</Label>
                  <Input value={user.city || "-"} disabled className="bg-muted/30 text-foreground" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-muted-foreground text-caption font-normal">Postal Code</Label>
                  <Input value={user.postalCode || "-"} disabled className="bg-muted/30 text-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* EditBar when editing */}
      <EditBar
        isVisible={isEditing}
        onSave={handleSaveChanges}
        onCancel={() => {
          setSelectedRole(user.role);
          setIsEditing(false);
        }}
        isSaving={isUpdatingRole}
        label="Unsaved role changes"
        saveLabel="Save Changes"
        cancelLabel="Cancel"
      />

      {/* Reset Password Dialog */}
      <ResetPasswordDialog
        open={resetPasswordOpen}
        onOpenChange={setResetPasswordOpen}
        userName={fullName}
        isLoading={isResetting}
        onReset={handleConfirmResetPassword}
      />

      {/* Delete User Confirm Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Employee Account"
        description={`Are you sure you want to delete ${fullName}? This will permanently remove their staff user profile and authentication access. This action cannot be undone.`}
        confirmText="Delete Employee"
        variant="destructive"
        isLoading={isDeletingUser}
        onConfirm={handleConfirmDeleteUser}
      />
    </div>
  );
}
