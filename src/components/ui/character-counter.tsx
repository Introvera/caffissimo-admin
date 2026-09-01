"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface CharacterCounterProps {
  current: number;
  max: number;
  className?: string;
  warningThreshold?: number; // e.g. 0.9 (90%)
}

export function CharacterCounter({
  current,
  max,
  className,
  warningThreshold = 0.9,
}: CharacterCounterProps) {
  const isOver = current > max;
  const isWarning = !isOver && current >= max * warningThreshold;

  return (
    <span
      className={cn(
        "text-[11px] font-medium tracking-tight tabular-nums transition-colors",
        isOver
          ? "text-destructive font-semibold"
          : isWarning
          ? "text-amber-500 font-semibold"
          : "text-muted-foreground/70",
        className
      )}
    >
      {current}/{max}
    </span>
  );
}
