"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Shield,
  Mail,
  Phone,
  Calendar,
  Clock,
  User as UserIcon,
  Copy,
  Check,
  UserX,
  MapPin,
  MoreVertical,
  HeartHandshake,
  Sparkles,
  ShoppingBag,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageHeader } from "@/components/shared/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ResetPasswordDialog } from "@/components/shared/reset-password-dialog";
import { useAppSelector } from "@/stores/store";
import { isSuperAdmin } from "@/lib/rbac";
import {
  useGetUserByIdQuery,
  useResetUserPasswordMutation,
  useDeleteUserMutation,
} from "@/stores/api/userApi";
import { getInitials, formatDate, formatDateTime } from "@/lib/utils";
import { UserRole } from "@/types";
import { toast } from "sonner";

interface CustomerDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function CustomerDetailPage({ params }: CustomerDetailPageProps) {
  const resolvedParams = use(params);
  const router = useRouter();

  const { currentRole: uiRole } = useAppSelector((state) => state.ui);
  const authRole = useAppSelector((state) => state.auth.user?.role) || UserRole.Cashier;
  const currentRole = uiRole || authRole;
  const isSuper = isSuperAdmin(currentRole);

  const { data: user, isLoading: isUserLoading, error: userError } = useGetUserByIdQuery(resolvedParams.id);
  const [resetUserPassword] = useResetUserPasswordMutation();
  const [deleteUser, { isLoading: isDeletingUser }] = useDeleteUserMutation();

  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success(`${field} copied to clipboard`);
    setTimeout(() => setCopiedField(null), 2000);
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
      toast.success("Customer deleted successfully");
      router.push("/admin/users/customers");
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to delete customer");
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
        <PageHeader title="Customer Not Found" />
        <Card className="border border-border shadow-none rounded-xl">
          <CardContent className="py-12 text-center">
            <UserX className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-foreground">Customer Not Found</h3>
            <p className="text-muted-foreground text-body mt-1">
              The customer profile you are looking for does not exist or you do not have permission to view it.
            </p>
            <Button onClick={() => router.push("/admin/users/customers")} className="mt-6">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Customers
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Unnamed Customer";
  const hasAddress = Boolean(user.addressLine1 || user.addressLine2 || user.city || user.postalCode);

  return (
    <div className="space-y-6 pb-20">
      {/* Top Header */}
      <div className="flex items-center gap-4 w-full">
        <Button variant="ghost" size="icon" onClick={() => router.push("/admin/users/customers")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader
          className="flex-1"
          title={fullName}
          description="Customer profile, contact details, and account summary"
          actions={
            isSuper && (
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
                    Delete Customer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )
          }
        />
      </div>

      {/* Customer Hero Overview Card */}
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
                  <Badge variant="outline">
                    Customer
                  </Badge>
                  <Badge variant={user.isActive ? "success" : "secondary"}>
                    {user.isActive ? "Active Account" : "Inactive"}
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
                  {user.city && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-muted-foreground/70" />
                      {user.city}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Metadata Chips */}
            <div className="flex flex-wrap md:flex-col gap-2 md:items-end justify-start text-caption text-muted-foreground border-t md:border-t-0 pt-4 md:pt-0">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                <span>Customer since {formatDate(user.createdAt)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                <span>Last updated {formatDateTime(user.updatedAt)}</span>
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
            <CardDescription>Customer contact details and demographics</CardDescription>
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

            <div className="space-y-1.5">
              <Label className="text-muted-foreground text-caption font-normal">Phone Number</Label>
              <div className="relative">
                <Input value={user.phoneNumber || "Not provided"} disabled className="bg-muted/30 text-foreground pr-10" />
                {user.phoneNumber && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
                    onClick={() => handleCopy(user.phoneNumber!, "Phone Number")}
                  >
                    {copiedField === "Phone Number" ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-muted-foreground text-caption font-normal">Birthday</Label>
                <Input value={user.birthday ? formatDate(user.birthday) : "Not provided"} disabled className="bg-muted/30 text-foreground" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-muted-foreground text-caption font-normal">Age</Label>
                <Input value={user.age ? `${user.age} years old` : "Not provided"} disabled className="bg-muted/30 text-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account & Engagement Card */}
        <Card className="border border-border shadow-none rounded-xl bg-white dark:bg-[#141414]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <HeartHandshake className="h-4 w-4 text-primary" />
              Account & Loyalty Status
            </CardTitle>
            <CardDescription>Customer account standing and loyalty rewards profile</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 rounded-lg border border-border/60 bg-muted/20 flex items-center justify-between">
              <div>
                <span className="font-medium text-foreground">Customer Account</span>
                <p className="text-caption text-muted-foreground mt-0.5">
                  Registered for online ordering, promotions, and loyalty rewards.
                </p>
              </div>
              <Badge variant="outline">Customer</Badge>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-muted-foreground text-caption font-normal">Account Status</Label>
                <div className="p-2.5 rounded-md border border-border/60 bg-muted/20 flex items-center gap-2">
                  <span className={user.isActive ? "h-2 w-2 rounded-full bg-success" : "h-2 w-2 rounded-full bg-muted-foreground"} />
                  <span className="text-body font-medium text-foreground">
                    {user.isActive ? "Active Account" : "Suspended / Inactive"}
                  </span>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-muted-foreground text-caption font-normal">Registration Date</Label>
                <div className="p-2.5 rounded-md border border-border/60 bg-muted/20 text-body text-foreground">
                  {formatDate(user.createdAt)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Delivery & Residential Address Card */}
        <Card className="border border-border shadow-none rounded-xl bg-white dark:bg-[#141414] lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-4 w-4 text-primary" />
              Delivery & Residential Address
            </CardTitle>
            <CardDescription>Default shipping or contact address for orders</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {hasAddress ? (
              <>
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
              </>
            ) : (
              <div className="py-6 text-center text-muted-foreground text-body border border-dashed rounded-lg">
                No delivery address registered for this customer yet.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Reset Password Dialog */}
      <ResetPasswordDialog
        open={resetPasswordOpen}
        onOpenChange={setResetPasswordOpen}
        userName={fullName}
        isLoading={isResetting}
        onReset={handleConfirmResetPassword}
      />

      {/* Delete Customer Confirm Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Customer Account"
        description={`Are you sure you want to delete ${fullName}? This will permanently remove their customer profile and authentication account. This action cannot be undone.`}
        confirmText="Delete Customer"
        variant="destructive"
        isLoading={isDeletingUser}
        onConfirm={handleConfirmDeleteUser}
      />
    </div>
  );
}
