"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EditBarProps {
  /** Text label shown in the bar (e.g. "Unsaved changes" or "3 changes made") */
  label?: string;
  /** Called when the primary save/submit button is clicked (omit for type="submit" forms) */
  onSave?: () => void;
  /** Called when the cancel/discard button is clicked */
  onCancel?: () => void;
  /** Whether the save action is in-progress */
  isSaving?: boolean;
  /** Label for the primary action button */
  saveLabel?: string;
  /** Label for the secondary cancel/discard button */
  cancelLabel?: string;
  /** Controls whether the bar is rendered */
  isVisible: boolean;
  /**
   * Use "submit" when the EditBar is rendered inside a <form> and should
   * trigger native form submission (react-hook-form, etc.).
   * Use "button" when the save action is handled by onSave directly.
   */
  saveButtonType?: "button" | "submit";
  /** Whether to show the animated pulse dot */
  showDot?: boolean;
}

/**
 * Floating bottom action bar that appears when a page is in an editable state.
 * Mirrors the pattern used on the Branch detail page.
 */
export function EditBar({
  label = "Unsaved changes",
  onSave,
  onCancel,
  isSaving = false,
  saveLabel = "Save",
  cancelLabel = "Discard",
  isVisible,
  saveButtonType = "button",
  showDot = true,
}: EditBarProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-background/95 backdrop-blur border border-border shadow-2xl rounded-full px-6 py-3 flex items-center justify-between gap-8 max-w-xl w-[90%] animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center gap-2">
        {showDot && (
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
        )}
        <span className="text-body font-semibold text-foreground">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="rounded-full"
            disabled={isSaving}
          >
            {cancelLabel}
          </Button>
        )}
        <Button
          type={saveButtonType}
          variant="default"
          size="sm"
          onClick={saveButtonType === "button" ? onSave : undefined}
          disabled={isSaving}
          className="rounded-full px-4"
        >
          {isSaving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
          {saveLabel}
        </Button>
      </div>
    </div>
  );
}
