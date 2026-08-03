"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import {
  addMonths,
  subMonths,
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  isWithinInterval,
  subDays,
  startOfYear,
  endOfYear,
  startOfMonth as startOfMonthFn,
  endOfMonth as endOfMonthFn,
} from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "./button";

interface CalendarProps {
  selected?: Date;
  onSelect?: (date: Date) => void;
  className?: string;
  fromDate?: Date;
  toDate?: Date;
}

export function Calendar({
  selected,
  onSelect,
  className,
  fromDate,
  toDate,
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(selected || new Date());

  const renderHeader = () => {
    return (
      <div className="flex items-center justify-between px-2 py-2">
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-semibold text-foreground">
          {format(currentMonth, "MMMM yyyy")}
        </span>
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  const renderDays = () => {
    const days = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
    return (
      <div className="grid grid-cols-7 mb-1 text-center">
        {days.map((day) => (
          <div
            key={day}
            className="text-xs text-muted-foreground font-medium py-1.5"
          >
            {day}
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const cloneDay = day;
        const isCurrentMonth = isSameMonth(day, monthStart);
        const isSelected = selected && isSameDay(day, selected);
        const isDisabled =
          (fromDate && day < fromDate) || (toDate && day > toDate);

        days.push(
          <button
            key={day.toString()}
            className={cn(
              "h-8 w-8 text-center text-xs p-0 font-medium rounded-md transition-colors mx-auto flex items-center justify-center relative",
              !isCurrentMonth && "text-muted-foreground opacity-30",
              isSelected && "bg-primary text-primary-foreground font-bold shadow-sm",
              !isSelected && isCurrentMonth && "hover:bg-accent text-foreground",
              isDisabled && "opacity-20 cursor-not-allowed"
            )}
            onClick={() => !isDisabled && onSelect?.(cloneDay)}
            disabled={isDisabled}
            type="button"
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
    return <div className="space-y-1">{rows}</div>;
  };

  return (
    <div className={cn("p-3 bg-card border rounded-xl shadow-sm", className)}>
      {renderHeader()}
      {renderDays()}
      {renderCells()}
    </div>
  );
}

interface DateRangeCalendarProps {
  from?: Date;
  to?: Date;
  onSelect?: (range: { from?: Date; to?: Date }) => void;
  onCancel?: () => void;
  className?: string;
}

export function DateRangeCalendar({
  from,
  to,
  onSelect,
  onCancel,
  className,
}: DateRangeCalendarProps) {
  const [leftMonth, setLeftMonth] = React.useState(from || new Date());
  const [rightMonth, setRightMonth] = React.useState(addMonths(from || new Date(), 1));
  const [tempFrom, setTempFrom] = React.useState<Date | undefined>(from);
  const [tempTo, setTempTo] = React.useState<Date | undefined>(to);

  // Keep months consecutive
  React.useEffect(() => {
    if (leftMonth) {
      setRightMonth(addMonths(leftMonth, 1));
    }
  }, [leftMonth]);

  const handleSelect = (date: Date) => {
    if (!tempFrom || (tempFrom && tempTo)) {
      setTempFrom(date);
      setTempTo(undefined);
    } else {
      if (date < tempFrom) {
        setTempTo(tempFrom);
        setTempFrom(date);
      } else {
        setTempTo(date);
      }
    }
  };

  const handleApply = () => {
    if (tempFrom && tempTo) {
      onSelect?.({ from: tempFrom, to: tempTo });
    }
  };

  const handlePreset = (preset: string) => {
    const today = new Date();
    let start: Date = today;
    let end: Date = today;

    switch (preset) {
      case "Today":
        start = today;
        end = today;
        break;
      case "Yesterday":
        start = subDays(today, 1);
        end = subDays(today, 1);
        break;
      case "This week":
        start = startOfWeek(today, { weekStartsOn: 1 });
        end = today;
        break;
      case "Last week":
        start = startOfWeek(subDays(today, 7), { weekStartsOn: 1 });
        end = endOfWeek(subDays(today, 7), { weekStartsOn: 1 });
        break;
      case "This month":
        start = startOfMonthFn(today);
        end = today;
        break;
      case "Last month":
        start = startOfMonthFn(subMonths(today, 1));
        end = endOfMonthFn(subMonths(today, 1));
        break;
      case "This year":
        start = startOfYear(today);
        end = today;
        break;
      case "Last year":
        start = startOfYear(subMonths(today, 12));
        end = endOfYear(subMonths(today, 12));
        break;
      case "All time":
        start = new Date(2023, 0, 1);
        end = today;
        break;
    }
    setTempFrom(start);
    setTempTo(end);
    setLeftMonth(start);
  };

  const renderMonth = (currentMonth: Date, isLeft: boolean) => {
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
        const isFrom = tempFrom && isSameDay(day, tempFrom);
        const isTo = tempTo && isSameDay(day, tempTo);
        const isInRange =
          tempFrom && tempTo && isWithinInterval(day, { start: tempFrom, end: tempTo });

        days.push(
          <button
            key={day.toString()}
            type="button"
            className={cn(
              "h-8 w-8 text-center text-xs p-0 font-medium transition-colors mx-auto flex items-center justify-center relative rounded-md",
              !isCurrentMonth && "text-muted-foreground opacity-30",
              (isFrom || isTo) && "bg-primary text-primary-foreground font-bold shadow-sm rounded-md",
              isInRange && !isFrom && !isTo && "bg-primary/10 text-primary rounded-none",
              // Handle range edge styling
              isInRange && isFrom && "rounded-r-none rounded-l-md",
              isInRange && isTo && "rounded-l-none rounded-r-md",
              !isFrom && !isTo && isCurrentMonth && !isInRange && "hover:bg-accent text-foreground"
            )}
            onClick={() => handleSelect(cloneDay)}
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
      <div className="w-[260px] p-3 flex flex-col">
        <div className="flex items-center justify-between mb-3 px-1">
          {isLeft ? (
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => setLeftMonth(subMonths(leftMonth, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          ) : (
            <div className="w-7 h-7" />
          )}
          <span className="text-sm font-semibold text-foreground">
            {format(currentMonth, "MMMM yyyy")}
          </span>
          {!isLeft ? (
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => setLeftMonth(addMonths(leftMonth, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <div className="w-7 h-7" />
          )}
        </div>
        <div className="grid grid-cols-7 text-center mb-1">
          {daysHeader.map((d) => (
            <div key={d} className="text-xs text-muted-foreground font-medium py-1">
              {d}
            </div>
          ))}
        </div>
        <div className="space-y-1">{rows}</div>
      </div>
    );
  };

  const presets = [
    "Today",
    "Yesterday",
    "This week",
    "Last week",
    "This month",
    "Last month",
    "This year",
    "Last year",
    "All time",
  ];

  return (
    <div className={cn("flex flex-col md:flex-row bg-popover text-popover-foreground border rounded-xl shadow-xl overflow-hidden min-w-[680px]", className)}>
      <div className="w-[160px] border-r bg-muted/20 flex flex-col p-2 gap-0.5 shrink-0">
        {presets.map((preset) => {
          return (
            <button
              key={preset}
              type="button"
              onClick={() => handlePreset(preset)}
              className={cn(
                "w-full text-left px-3 py-1.5 text-xs font-semibold rounded-md transition-colors hover:bg-accent",
                "text-muted-foreground hover:text-foreground"
              )}
            >
              {preset}
            </button>
          );
        })}
      </div>

      {/* Main Dual Calendars Container */}
      <div className="flex flex-col flex-1">
        <div className="flex flex-1 divide-x border-b">
          {renderMonth(leftMonth, true)}
          {renderMonth(rightMonth, false)}
        </div>

        {/* Footer Area */}
        <div className="p-3 flex items-center justify-between bg-muted/10">
          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type="text"
                readOnly
                placeholder="Start Date"
                value={tempFrom ? format(tempFrom, "MMM dd, yyyy") : ""}
                className="flex h-9 w-[120px] rounded-md border border-input bg-background text-foreground px-3 py-1.5 text-xs font-semibold ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <span className="text-xs text-muted-foreground font-semibold">—</span>
            <div className="relative">
              <input
                type="text"
                readOnly
                placeholder="End Date"
                value={tempTo ? format(tempTo, "MMM dd, yyyy") : ""}
                className="flex h-9 w-[120px] rounded-md border border-input bg-background text-foreground px-3 py-1.5 text-xs font-semibold ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs font-semibold rounded-md"
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="h-8 text-xs font-semibold rounded-md bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={!tempFrom || !tempTo}
              onClick={handleApply}
            >
              Apply
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
