"use client";

import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import * as React from "react";

interface ScaleInputProps {
  label: string;
  /** Null means "not set" — a valid and common state, not a missing value to be defaulted. */
  value: number | null;
  onChange: (value: number | null) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  /** Short hint shown under the label, e.g. "1 dry · 5 sweet". */
  hint?: string;
}

/**
 * Segmented 1-5 (or 0-5) selector.
 *
 * A segmented control rather than a range slider on purpose: these are ordinal values with
 * five discrete steps, and a slider cannot represent "not set" without inventing a sentinel
 * position. Every profile field is nullable and leaving one blank is a legitimate choice, so
 * the control needs a first-class way to clear it.
 */
export function ScaleInput({
  label,
  value,
  onChange,
  min = 1,
  max = 5,
  disabled = false,
  hint,
}: ScaleInputProps) {
  const steps = React.useMemo(
    () => Array.from({ length: max - min + 1 }, (_, i) => min + i),
    [min, max],
  );

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium leading-none">{label}</span>
        {value !== null && !disabled && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-md px-1"
          >
            <X className="h-3 w-3" />
            Clear
          </button>
        )}
      </div>

      <div className="flex gap-1.5" role="group" aria-label={label}>
        {steps.map((step) => {
          const isSelected = value === step;
          return (
            <button
              key={step}
              type="button"
              disabled={disabled}
              aria-pressed={isSelected}
              onClick={() => onChange(isSelected ? null : step)}
              className={cn(
                "h-9 flex-1 rounded-md border text-sm font-semibold transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                "disabled:cursor-not-allowed disabled:opacity-50",
                isSelected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-input bg-background text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              {step}
            </button>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        {value === null ? "Not set — omitted from recommendations" : hint ?? " "}
      </p>
    </div>
  );
}
