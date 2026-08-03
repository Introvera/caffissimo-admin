import { cn } from "@/lib/utils";
import { OrderSource } from "@/types";

interface SourceBadgeProps {
  source: OrderSource;
  className?: string;
}

const sourceConfig: Record<
  OrderSource,
  { label: string; colors: string }
> = {
  pos: { label: "In Store", colors: "status-success" },
  ecommerce: { label: "E-Commerce", colors: "status-info" },
  uber_eats: { label: "Uber Eats", colors: "bg-muted text-muted-foreground" },
  doordash: { label: "DoorDash", colors: "status-warning" },
};

export function SourceBadge({ source, className }: SourceBadgeProps) {
  const config = sourceConfig[source];

  return (
    <span className={cn("inline-block rounded-md px-2.5 py-1 text-xs font-medium", config.colors, className)}>
      {config.label}
    </span>
  );
}

export function getSourceLabel(source: OrderSource): string {
  return sourceConfig[source].label;
}
