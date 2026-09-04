"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGetUserByIdQuery } from "@/stores/api/userApi";
import { UserRole } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, UserX } from "lucide-react";

interface UserDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function UserDetailPage({ params }: UserDetailPageProps) {
  const resolvedParams = use(params);
  const router = useRouter();

  const { data: user, isLoading, error } = useGetUserByIdQuery(resolvedParams.id);

  useEffect(() => {
    if (user) {
      if (user.role === UserRole.Customer) {
        router.replace(`/admin/users/customers/${user.id}`);
      } else {
        router.replace(`/admin/users/employees/${user.id}`);
      }
    }
  }, [user, router]);

  if (isLoading) {
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
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="space-y-6">
        <PageHeader title="User Not Found" />
        <Card className="border border-border shadow-none rounded-xl">
          <CardContent className="py-12 text-center">
            <UserX className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-foreground">User Not Found</h3>
            <p className="text-muted-foreground text-body mt-1">
              The user profile you are looking for does not exist.
            </p>
            <Button onClick={() => router.push("/admin/users/employees")} className="mt-6">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Users
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
