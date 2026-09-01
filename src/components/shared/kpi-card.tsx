"use client";

import { motion } from "framer-motion";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
  };
  isCurrency?: boolean;
  isLoading?: boolean;
  featured?: boolean;
  sparkline?: number[];
  className?: string;
}

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const h = 40;
  const w = 80;
  const step = w / (data.length - 1);

  const points = data.map((v, i) => {
    const x = i * step;
    const y = h - ((v - min) / range) * h * 0.8 - h * 0.1;
    return `${x},${y}`;
  }).join(" ");

  const areaPoints = `0,${h} ${points} ${w},${h}`;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0">
      <polygon points={areaPoints} fill={color} opacity={0.15} />
      <polyline points={points} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  isCurrency = false,
  isLoading = false,
  featured = false,
  sparkline,
  className,
}: KPICardProps) {
  const displayValue = isCurrency && typeof value === "number" 
    ? formatCurrency(value) 
    : value;

  if (isLoading) {
    return (
      <div className={cn("rounded-xl border bg-card p-4", className)}>
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-6 w-28 mt-2" />
      </div>
    );
  }

  // Define professional color configurations based on title or trend
  const isCancelled = title.toLowerCase().includes("cancelled");
  const isAvgPrice = title.toLowerCase().includes("avg") || title.toLowerCase().includes("average") || title.toLowerCase().includes("price");
  const isRevenue = title.toLowerCase().includes("revenue") || title.toLowerCase().includes("sales") || title.toLowerCase().includes("earning");
  const isOrders = title.toLowerCase().includes("order") && !isCancelled && !isAvgPrice;
  const isCustomers = title.toLowerCase().includes("user") || title.toLowerCase().includes("customer");
  
  let cardBgClass = "bg-card border-border";
  let iconBgClass = "bg-secondary text-secondary-foreground";
  let sparklineColor = "hsl(var(--primary))";

  if (featured) {
    cardBgClass = "bg-gradient-to-br from-amber-500 to-amber-600 dark:from-amber-600 dark:to-amber-700 text-white border-transparent";
    iconBgClass = "bg-white/20 text-white border border-white/10";
    sparklineColor = "#ffffff";
  } else if (isCancelled) {
    // Soft red theme for cancelled
    iconBgClass = "bg-red-500/10 text-red-600 dark:text-red-400";
    sparklineColor = "#EF4444";
  } else if (isAvgPrice) {
    // Soft orange/amber theme for average price
    iconBgClass = "bg-orange-500/10 text-orange-600 dark:text-orange-400";
    sparklineColor = "#F97316";
  } else if (isRevenue) {
    // Beautiful subtle emerald theme
    iconBgClass = "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
    sparklineColor = "#10B981";
  } else if (isOrders) {
    // Elegant soft blue theme
    iconBgClass = "bg-blue-500/10 text-blue-600 dark:text-blue-400";
    sparklineColor = "#3B82F6";
  } else if (isCustomers) {
    // Regal purple/indigo theme
    iconBgClass = "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400";
    sparklineColor = "#6366F1";
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="h-full"
    >
      <div
        className={cn(
          "rounded-xl border px-4 py-3.5 relative overflow-hidden h-full flex flex-col justify-between",
          cardBgClass,
          className
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className={cn(
              "flex items-center gap-1.5",
              featured ? "text-white/80" : "text-muted-foreground"
            )}>
              <span className={cn("p-1.5 rounded-lg shrink-0", iconBgClass)}>
                <Icon className="h-3.5 w-3.5" />
              </span>
              <span className="text-caption font-medium tracking-normal">{title}</span>
            </div>
            
            <div className="flex items-baseline gap-2 mt-3">
              <p className="text-h2 font-bold tracking-tight">{displayValue}</p>
              {trend && (
                <span
                  className={cn(
                    "flex items-center text-detail font-bold px-1.5 py-0.5 rounded-full",
                    featured 
                      ? "bg-white/20 text-white" 
                      : trend.value >= 0
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "bg-red-500/10 text-red-600 dark:text-red-400"
                  )}
                >
                  {trend.value >= 0 ? (
                    <TrendingUp className="h-2.5 w-2.5 mr-0.5" />
                  ) : (
                    <TrendingDown className="h-2.5 w-2.5 mr-0.5" />
                  )}
                  {Math.abs(trend.value)}%
                </span>
              )}
            </div>
            
            {subtitle && (
              <p className={cn(
                "text-detail mt-1.5",
                featured ? "text-white/60" : "text-muted-foreground"
              )}>
                {subtitle}
              </p>
            )}
          </div>
          
          {sparkline && sparkline.length > 1 && (
            <div className="self-center">
              <MiniSparkline
                data={sparkline}
                color={sparklineColor}
              />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
