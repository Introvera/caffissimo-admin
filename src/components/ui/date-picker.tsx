"use client";

import * as React from "react";
import {
  format,
  parseISO,
  isValid,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
} from "date-fns";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export interface DatePickerProps {
  value?: string | Date;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  minDate?: Date;
  maxDate?: Date;
  id?: string;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Select date",
  disabled = false,
  className,
  minDate,
  maxDate,
  id,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  const selectedDate = React.useMemo(() => {
    if (!value) return undefined;
    if (value instanceof Date) return isValid(value) ? value : undefined;
    if (typeof value === "string") {
      const parsed = parseISO(value);
      return isValid(parsed) ? parsed : undefined;
    }
    return undefined;
  }, [value]);

  const [currentMonth, setCurrentMonth] = React.useState<Date>(
    selectedDate || new Date()
  );

  React.useEffect(() => {
    if (selectedDate) {
      setCurrentMonth(selectedDate);
    }
  }, [selectedDate]);

  const handleSelectDate = (date: Date) => {
    const formatted = format(date, "yyyy-MM-dd");
    onChange?.(formatted);
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.("");
  };

  const handleToday = () => {
    const today = new Date();
    handleSelectDate(today);
  };

  const renderCalendar = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const rows = [];
    let days = [];
    let day = startDate;

    const daysHeader = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const cloneDay = day;
        const isCurrentMonth = isSameMonth(day, monthStart);
        const isSelected = selectedDate && isSameDay(day, selectedDate);
        const isToday = isSameDay(day, new Date());
        const isDisabled =
          (minDate && day < minDate) || (maxDate && day > maxDate);

        days.push(
          <button
            key={day.toString()}
            type="button"
            disabled={isDisabled}
            onClick={() => !isDisabled && handleSelectDate(cloneDay)}
            className={cn(
              "h-8 w-8 text-center text-caption p-0 font-medium transition-colors mx-auto flex items-center justify-center relative rounded-md",
              !isCurrentMonth && "text-muted-foreground opacity-30",
              isSelected &&
                "bg-primary text-primary-foreground font-semibold shadow-sm",
              !isSelected &&
                isToday &&
                "border border-primary/40 text-primary font-semibold",
              !isSelected &&
                !isToday &&
                isCurrentMonth &&
                "hover:bg-accent text-foreground",
              isDisabled && "opacity-20 cursor-not-allowed"
            )}
          >
            {format(day, "d")}
          </button>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div key={day.toString()} className="grid grid-cols-7 gap-y-1">
          {days}
        </div>
      );
      days = [];
    }

    return (
      <div className="w-[264px] p-3 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-3 px-1">
          <Button
            variant="outline"
            size="icon"
            type="button"
            className="h-7 w-7"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-body font-semibold text-foreground">
            {format(currentMonth, "MMMM yyyy")}
          </span>
          <Button
            variant="outline"
            size="icon"
            type="button"
            className="h-7 w-7"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 text-center mb-1">
          {daysHeader.map((d) => (
            <div
              key={d}
              className="text-caption text-muted-foreground font-medium py-1"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="space-y-1">{rows}</div>

        {/* Footer */}
        <div className="mt-3 pt-2.5 border-t flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            type="button"
            className="h-7 px-2 text-caption text-primary hover:text-primary hover:bg-primary/10"
            onClick={handleToday}
          >
            Today
          </Button>
          {selectedDate && (
            <Button
              variant="ghost"
              size="sm"
              type="button"
              className="h-7 px-2 text-caption text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={handleClear}
            >
              Clear
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          id={id}
          disabled={disabled}
          className={cn(
            "flex h-9 w-full items-center justify-between rounded-lg border border-border/80 bg-white px-3 py-2 text-caption text-foreground shadow-none transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#141414]",
            !selectedDate && "text-muted-foreground",
            className
          )}
        >
          <div className="flex items-center gap-2 truncate">
            <CalendarIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate">
              {selectedDate ? format(selectedDate, "MMM dd, yyyy") : placeholder}
            </span>
          </div>
          {selectedDate && (
            <span
              role="button"
              onClick={handleClear}
              className="p-0.5 text-muted-foreground hover:text-foreground rounded-sm transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0 shadow-lg border rounded-xl"
        align="start"
      >
        {renderCalendar()}
      </PopoverContent>
    </Popover>
  );
}
