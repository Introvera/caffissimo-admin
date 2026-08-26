"use client";

import { Suspense } from "react";
import { useAppSelector } from "@/stores/store";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { cn } from "@/lib/utils";

function HeaderFallback() {
  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b bg-background px-4 lg:px-6" />
  );
}

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { sidebarCollapsed } = useAppSelector((state) => state.ui);

  return (
    <div className="min-h-screen bg-sidebar">
      <Sidebar />
      <div
        className={cn(
          "flex flex-col transition-all duration-200 min-h-screen",
          sidebarCollapsed ? "lg:pl-[72px]" : "lg:pl-64"
        )}
      >
        <div className="flex-1 flex flex-col bg-background lg:max-h-screen lg:overflow-hidden">
          <Suspense fallback={<HeaderFallback />}>
            <Header />
          </Suspense>
          <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
