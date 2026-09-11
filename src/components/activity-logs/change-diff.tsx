"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ActivityFieldChange } from "@/types/activity-log";

/**
 * Before and after, side by side, with readable field names.
 *
 * The raw JSON is available behind a toggle rather than shown by default. An operations manager
 * asking "who dropped the price" needs the two numbers; a developer chasing a bug needs the whole
 * object. Showing the object to everyone serves the second at the expense of the first.
 */

interface ChangeDiffProps {
  changes?: Record<string, ActivityFieldChange> | null;
  className?: string;
}

/** Splits PascalCase and snake_case into words — "BranchProductVariantId" reads as a label. */
const fieldLabel = (field: string): string => {
  const spaced = field
    .replace(/[_-]/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .trim();

  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
};

const renderValue = (raw: unknown): string => {
  if (raw === null || raw === undefined) return "—";
  if (typeof raw === "boolean") return raw ? "Yes" : "No";
  if (typeof raw === "object") return JSON.stringify(raw);

  const text = String(raw);
  return text.length === 0 ? "—" : text;
};

export function ChangeDiff({ changes, className }: ChangeDiffProps) {
  const [showRaw, setShowRaw] = useState(false);

  const entries = Object.entries(changes ?? {});

  if (entries.length === 0) {
    return (
      <p className={cn("text-body text-muted-foreground", className)}>
        No field changes were recorded for this action.
      </p>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="rounded-lg border divide-y">
        {entries.map(([field, change]) => (
          <div key={field} className="px-4 py-3">
            <p className="text-caption font-medium text-muted-foreground">{fieldLabel(field)}</p>

            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              {/* Line-through on the old value so the direction of change is readable at a
                  glance, without needing to compare the two strings character by character. */}
              <span className="text-body text-muted-foreground line-through decoration-muted-foreground/50">
                {renderValue(change.before)}
              </span>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-body font-medium text-foreground">
                {renderValue(change.after)}
              </span>
            </div>
          </div>
        ))}
      </div>

      <Button
        variant="ghost"
        size="sm"
        className="h-8 gap-1.5 px-2 text-caption text-muted-foreground"
        onClick={() => setShowRaw((open) => !open)}
      >
        {showRaw ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        {showRaw ? "Hide raw data" : "Show raw data"}
      </Button>

      {showRaw && (
        <pre className="overflow-x-auto rounded-lg border bg-muted/40 p-3 text-detail">
          {JSON.stringify(changes, null, 2)}
        </pre>
      )}
    </div>
  );
}

/**
 * Metadata is arbitrary key/value detail rather than a diff, so it gets a plain list. Objects are
 * stringified rather than rendered recursively — nesting here is rare and usually a payload
 * fragment that belongs behind the raw toggle anyway.
 */
export function MetadataList({
  metadata,
  className,
}: {
  metadata?: Record<string, unknown> | null;
  className?: string;
}) {
  const entries = Object.entries(metadata ?? {});

  if (entries.length === 0) return null;

  return (
    <div className={cn("rounded-lg border divide-y", className)}>
      {entries.map(([key, value]) => (
        <div key={key} className="flex items-start justify-between gap-4 px-4 py-2.5">
          <span className="text-caption text-muted-foreground">{fieldLabel(key)}</span>
          <span className="text-body text-right break-all">{renderValue(value)}</span>
        </div>
      ))}
    </div>
  );
}
