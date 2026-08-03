import { cn } from "@/lib/utils";
import { OrderStatus } from "@/types";

interface StatusBadgeProps {
  status: OrderStatus;
  className?: string;
}

const statusConfig: Record<
  string,
  { label: string; containerClass: string; dotClass: string }
> = {
  Pending:   { label: "Pending",   containerClass: "status-warning", dotClass: "status-dot-warning" },
  Confirmed: { label: "Confirmed", containerClass: "status-info",    dotClass: "status-dot-info" },
  Preparing: { label: "Preparing", containerClass: "status-warning", dotClass: "status-dot-warning" },
  Ready:     { label: "Ready",     containerClass: "status-info",    dotClass: "status-dot-info" },
  Completed: { label: "Completed", containerClass: "status-success", dotClass: "status-dot-success" },
  Cancelled: { label: "Cancelled", containerClass: "status-error",   dotClass: "status-dot-error" },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const normalizedStatus = status
    ? (status.charAt(0).toUpperCase() + status.slice(1).toLowerCase())
    : "Pending";
  const config = statusConfig[normalizedStatus] || statusConfig.Pending;

  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium", config.containerClass, className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", config.dotClass)} />
      {config.label}
    </span>
  );
}

export function getStatusLabel(status: OrderStatus): string {
  const normalizedStatus = status
    ? (status.charAt(0).toUpperCase() + status.slice(1).toLowerCase())
    : "Pending";
  return (statusConfig[normalizedStatus] || statusConfig.Pending).label;
}
