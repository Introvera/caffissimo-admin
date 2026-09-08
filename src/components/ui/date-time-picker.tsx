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
  setHours,
  setMinutes,
} from "date-fns";
import {
  Calendar as CalendarIcon,
  Clock,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
} from "lucide-react";
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

export interface DateTimePickerProps {
  value?: string | Date;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  minDate?: Date;
  maxDate?: Date;
  id?: string;
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = "Select date & time",
  disabled = false,
  className,
  minDate,
  maxDate,
  id,
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false);

  // Parse initial or incoming date
  const parsedDate = React.useMemo(() => {
    if (!value) return undefined;
    if (value instanceof Date) return isValid(value) ? value : undefined;
    if (typeof value === "string") {
      const parsed = parseISO(value);
      return isValid(parsed) ? parsed : undefined;
    }
    return undefined;
  }, [value]);

  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(
    parsedDate
  );

  // Time state (12-hour format for easy user friendly selection)
  const [hour12, setHour12] = React.useState<number>(() => {
    if (parsedDate) {
      const h24 = parsedDate.getHours();
      return h24 % 12 === 0 ? 12 : h24 % 12;
    }
    return 9;
  });

  const [minute, setMinute] = React.useState<number>(() => {
    if (parsedDate) return parsedDate.getMinutes();
    return 0;
  });

  const [period, setPeriod] = React.useState<"AM" | "PM">(() => {
    if (parsedDate) return parsedDate.getHours() >= 12 ? "PM" : "AM";
    return "AM";
  });

  const [currentMonth, setCurrentMonth] = React.useState<Date>(
    parsedDate || new Date()
  );

  React.useEffect(() => {
    if (parsedDate) {
      setSelectedDate(parsedDate);
      setCurrentMonth(parsedDate);
      const h24 = parsedDate.getHours();
      setHour12(h24 % 12 === 0 ? 12 : h24 % 12);
      setMinute(parsedDate.getMinutes());
      setPeriod(h24 >= 12 ? "PM" : "AM");
    } else {
      setSelectedDate(undefined);
    }
  }, [parsedDate]);

  const emitDateTime = (
    dateObj: Date | undefined,
    h: number,
    m: number,
    p: "AM" | "PM"
  ) => {
    if (!dateObj) return;
    let h24 = h % 12;
    if (p === "PM") h24 += 12;
    const finalDate = setMinutes(setHours(dateObj, h24), m);
    // Format as YYYY-MM-DDTHH:mm
    const formatted = format(finalDate, "yyyy-MM-dd'T'HH:mm");
    onChange?.(formatted);
  };

  const handleSelectDate = (date: Date) => {
    setSelectedDate(date);
    emitDateTime(date, hour12, minute, period);
  };

  const handleHourChange = (newHour: number) => {
    setHour12(newHour);
    if (selectedDate) {
      emitDateTime(selectedDate, newHour, minute, period);
    }
  };

  const handleMinuteChange = (newMinute: number) => {
    setMinute(newMinute);
    if (selectedDate) {
      emitDateTime(selectedDate, hour12, newMinute, period);
    }
  };

  const handlePeriodChange = (newPeriod: "AM" | "PM") => {
    setPeriod(newPeriod);
    if (selectedDate) {
      emitDateTime(selectedDate, hour12, minute, newPeriod);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedDate(undefined);
    onChange?.("");
  };

  const handleNow = () => {
    const now = new Date();
    setSelectedDate(now);
    setCurrentMonth(now);
    const h24 = now.getHours();
    const h = h24 % 12 === 0 ? 12 : h24 % 12;
    const m = now.getMinutes();
    const p = h24 >= 12 ? "PM" : "AM";
    setHour12(h);
    setMinute(m);
    setPeriod(p);
    emitDateTime(now, h, m, p);
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
      <div className="w-[280px] p-3 flex flex-col">
        {/* Header Month / Year */}
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

        {/* Time Selector Section */}
        <div className="mt-3 pt-3 border-t">
          <div className="flex items-center justify-center gap-2">
            {/* Hour Custom Select */}
            <Select
              value={hour12.toString()}
              onValueChange={(val) => handleHourChange(parseInt(val, 10))}
            >
              <SelectTrigger className="h-8 w-[64px] px-2 text-caption font-semibold rounded-md border-border/80 bg-white dark:bg-[#141414] shadow-none">
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

            <span className="text-caption font-bold text-muted-foreground">:</span>

            {/* Minute Custom Select */}
            <Select
              value={minute.toString()}
              onValueChange={(val) => handleMinuteChange(parseInt(val, 10))}
            >
              <SelectTrigger className="h-8 w-[64px] px-2 text-caption font-semibold rounded-md border-border/80 bg-white dark:bg-[#141414] shadow-none">
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

            {/* AM / PM Toggle */}
            <div className="inline-flex rounded-md border border-border/80 p-0.5 bg-muted/40 shrink-0">
              {(["AM", "PM"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => handlePeriodChange(p)}
                  className={cn(
                    "px-2.5 py-1 text-detail font-bold rounded transition-colors",
                    period === p
                      ? "bg-primary text-white shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="mt-3 pt-2.5 border-t flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            type="button"
            className="h-7 px-2 text-caption text-primary hover:text-primary hover:bg-primary/10"
            onClick={handleNow}
          >
            Now
          </Button>

          <div className="flex items-center gap-1.5">
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
            <Button
              size="sm"
              type="button"
              className="h-7 px-3 text-caption font-medium rounded-md bg-primary hover:bg-primary/90 text-white dark:text-white"
              onClick={() => {
                if (!selectedDate) {
                  handleNow();
                }
                setOpen(false);
              }}
            >
              Done
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const displayString = React.useMemo(() => {
    if (!parsedDate) return "";
    try {
      return format(parsedDate, "MMM dd, yyyy 'at' hh:mm a");
    } catch {
      return "";
    }
  }, [parsedDate]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          id={id}
          disabled={disabled}
          className={cn(
            "flex h-9 w-full items-center justify-between rounded-lg border border-border/80 bg-white px-3 py-2 text-caption text-foreground shadow-none transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#141414]",
            !parsedDate && "text-muted-foreground",
            className
          )}
        >
          <div className="flex items-center gap-2 truncate">
            <CalendarIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate">
              {displayString || placeholder}
            </span>
          </div>
          {parsedDate && (
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
