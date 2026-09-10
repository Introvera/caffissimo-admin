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
  Pending:        { label: "Pending",         containerClass: "status-warning", dotClass: "status-dot-warning" },
  PendingPayment: { label: "Pending Payment", containerClass: "status-warning", dotClass: "status-dot-warning" },
  Confirmed:      { label: "Confirmed",       containerClass: "status-info",    dotClass: "status-dot-info" },
  Preparing:      { label: "Preparing",       containerClass: "status-warning", dotClass: "status-dot-warning" },
  Completed:      { label: "Completed",       containerClass: "status-success", dotClass: "status-dot-success" },
  Cancelled:      { label: "Cancelled",       containerClass: "status-error",   dotClass: "status-dot-error" },
};

function normalizeStatusKey(status: string): string {
  if (!status) return "Pending";
  const clean = status.replace(/[-_\s]/g, "").toLowerCase();
  if (clean === "pendingpayment") return "PendingPayment";
  if (clean === "pending") return "Pending";
  if (clean === "confirmed") return "Confirmed";
  if (clean === "preparing") return "Preparing";
  if (clean === "completed") return "Completed";
  if (clean === "cancelled") return "Cancelled";
  return "Pending";
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const key = normalizeStatusKey(status);
  const config = statusConfig[key] || statusConfig.Pending;

  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-chip text-[13px] leading-[1.4] font-medium shrink-0", config.containerClass, className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", config.dotClass)} />
      {config.label}
    </span>
  );
}

export function getStatusLabel(status: OrderStatus): string {
  const key = normalizeStatusKey(status);
  return (statusConfig[key] || statusConfig.Pending).label;
}
