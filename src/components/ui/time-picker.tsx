"use client";

import * as React from "react";
import { Clock, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface TimePickerProps {
  value?: string; // "HH:mm" in 24h
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export function TimePicker({
  value,
  onChange,
  placeholder = "Select time",
  disabled = false,
  className,
  id,
}: TimePickerProps) {
  const [open, setOpen] = React.useState(false);

  // Parse "HH:mm"
  const { hour12, minute, period } = React.useMemo(() => {
    if (!value || !value.includes(":")) {
      return { hour12: 9, minute: 0, period: "AM" as const };
    }
    const [hStr, mStr] = value.split(":");
    const h24 = parseInt(hStr, 10) || 0;
    const m = parseInt(mStr, 10) || 0;
    const p = h24 >= 12 ? ("PM" as const) : ("AM" as const);
    const h = h24 % 12 === 0 ? 12 : h24 % 12;
    return { hour12: h, minute: m, period: p };
  }, [value]);

  const [currentHour, setCurrentHour] = React.useState(hour12);
  const [currentMinute, setCurrentMinute] = React.useState(minute);
  const [currentPeriod, setCurrentPeriod] = React.useState<"AM" | "PM">(period);

  React.useEffect(() => {
    setCurrentHour(hour12);
    setCurrentMinute(minute);
    setCurrentPeriod(period);
  }, [hour12, minute, period]);

  const emitTime = (h: number, m: number, p: "AM" | "PM") => {
    let h24 = h % 12;
    if (p === "PM") h24 += 12;
    const formatted = `${h24.toString().padStart(2, "0")}:${m
      .toString()
      .padStart(2, "0")}`;
    onChange?.(formatted);
  };

  const handleHourChange = (h: number) => {
    setCurrentHour(h);
    emitTime(h, currentMinute, currentPeriod);
  };

  const handleMinuteChange = (m: number) => {
    setCurrentMinute(m);
    emitTime(currentHour, m, currentPeriod);
  };

  const handlePeriodChange = (p: "AM" | "PM") => {
    setCurrentPeriod(p);
    emitTime(currentHour, currentMinute, p);
  };

  const handlePreset = (presetH24: number, presetM: number) => {
    const p = presetH24 >= 12 ? "PM" : "AM";
    const h = presetH24 % 12 === 0 ? 12 : presetH24 % 12;
    setCurrentHour(h);
    setCurrentMinute(presetM);
    setCurrentPeriod(p);
    emitTime(h, presetM, p);
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.("");
  };

  const displayTime = React.useMemo(() => {
    if (!value) return "";
    const hStr = currentHour.toString().padStart(2, "0");
    const mStr = currentMinute.toString().padStart(2, "0");
    return `${hStr}:${mStr} ${currentPeriod}`;
  }, [value, currentHour, currentMinute, currentPeriod]);

  const presets = [
    { label: "08:00 AM", h: 8, m: 0 },
    { label: "09:00 AM", h: 9, m: 0 },
    { label: "12:00 PM", h: 12, m: 0 },
    { label: "02:00 PM", h: 14, m: 0 },
    { label: "05:00 PM", h: 17, m: 0 },
    { label: "09:00 PM", h: 21, m: 0 },
  ];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          id={id}
          disabled={disabled}
          className={cn(
            "flex h-8 items-center justify-between gap-1.5 rounded-lg border border-border/80 bg-white px-2.5 py-1 text-caption text-foreground shadow-none transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#141414]",
            !value && "text-muted-foreground",
            className
          )}
        >
          <div className="flex items-center gap-1.5 truncate">
            <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate font-medium">{displayTime || placeholder}</span>
          </div>
          {value ? (
            <span
              role="button"
              onClick={handleClear}
              className="p-0.5 text-muted-foreground hover:text-foreground rounded-sm transition-colors"
            >
              <X className="h-3 w-3" />
            </span>
          ) : (
            <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[260px] p-3 shadow-lg border rounded-xl" align="start">
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b pb-2">
            <span className="text-caption font-semibold text-foreground flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-primary" />
              Select Time
            </span>
            <span className="text-detail font-mono text-muted-foreground">
              {displayTime || "--:-- --"}
            </span>
          </div>

          {/* Selectors */}
          <div className="flex items-center justify-center gap-2 py-1">
            <div className="flex flex-col items-center">
              <span className="text-detail text-muted-foreground mb-1">Hour</span>
              <Select
                value={currentHour.toString()}
                onValueChange={(val) => handleHourChange(parseInt(val, 10))}
              >
                <SelectTrigger className="h-8 w-16 px-2 text-caption font-semibold rounded-md border-border/80 bg-white dark:bg-[#141414] shadow-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-48 min-w-[64px]">
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                    <SelectItem key={h} value={h.toString()} className="text-caption">
                      {h.toString().padStart(2, "0")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <span className="text-h3 font-bold text-muted-foreground pt-4">:</span>

            <div className="flex flex-col items-center">
              <span className="text-detail text-muted-foreground mb-1">Min</span>
              <Select
                value={currentMinute.toString()}
                onValueChange={(val) => handleMinuteChange(parseInt(val, 10))}
              >
                <SelectTrigger className="h-8 w-16 px-2 text-caption font-semibold rounded-md border-border/80 bg-white dark:bg-[#141414] shadow-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-48 min-w-[64px]">
                  {Array.from({ length: 60 }, (_, i) => i).map((m) => (
                    <SelectItem key={m} value={m.toString()} className="text-caption">
                      {m.toString().padStart(2, "0")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col items-center pl-1">
              <span className="text-detail text-muted-foreground mb-1">Period</span>
              <div className="flex flex-col gap-1">
                {(["AM", "PM"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handlePeriodChange(p)}
                    className={cn(
                      "h-4 px-2 text-detail font-bold rounded transition-colors",
                      currentPeriod === p
                        ? "bg-primary text-white shadow-xs"
                        : "bg-muted/50 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quick presets */}
          <div className="border-t pt-2">
            <p className="text-detail text-muted-foreground mb-1.5 font-medium">Quick Presets</p>
            <div className="grid grid-cols-3 gap-1">
              {presets.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => handlePreset(preset.h, preset.m)}
                  className="px-1.5 py-1 text-detail font-medium rounded-md border border-border/60 bg-muted/20 hover:bg-muted text-muted-foreground hover:text-foreground text-center transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t pt-2 flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              type="button"
              className="h-7 px-2 text-caption text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={handleClear}
            >
              Clear
            </Button>
            <Button
              size="sm"
              type="button"
              className="h-7 px-3 text-caption font-medium rounded-md bg-primary hover:bg-primary/90 text-white dark:text-white"
              onClick={() => {
                if (!value) {
                  emitTime(currentHour, currentMinute, currentPeriod);
                }
                setOpen(false);
              }}
            >
              Done
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
