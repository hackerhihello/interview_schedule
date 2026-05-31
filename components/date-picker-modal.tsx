"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface DatePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDate: (isoDate: string) => void;
  selectedDate?: string;
  title?: string;
}

export function DatePickerModal({
  isOpen,
  onClose,
  onSelectDate,
  selectedDate,
  title = "Select Date",
}: DatePickerModalProps) {
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  if (!isOpen) return null;

  const year = calendarMonth.getFullYear();
  const month = calendarMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const cells = [];

  // Previous month days
  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push(
      <button
        key={`prev-${i}`}
        className="text-xs p-2 text-muted-foreground opacity-40 cursor-default"
        disabled
      >
        {daysInPrevMonth - i}
      </button>
    );
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(year, month, i);
    const isoDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
    const isSelected = selectedDate === isoDate;

    cells.push(
      <button
        key={i}
        onClick={() => {
          onSelectDate(isoDate);
          onClose();
        }}
        className={cn(
          "text-xs p-2 rounded-lg font-semibold transition-colors",
          isSelected
            ? "bg-primary text-primary-foreground"
            : "hover:bg-secondary text-foreground"
        )}
      >
        {i}
      </button>
    );
  }

  // Next month days
  const remainingCells = 42 - cells.length;
  for (let i = 1; i <= remainingCells; i++) {
    cells.push(
      <button
        key={`next-${i}`}
        className="text-xs p-2 text-muted-foreground opacity-40 cursor-default"
        disabled
      >
        {i}
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card rounded-2xl border border-border p-6 w-full max-w-sm space-y-4">
        {/* Header */}
        <h3 className="text-sm font-bold text-foreground">{title}</h3>

        {/* Month navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() =>
              setCalendarMonth(new Date(year, month - 1, 1))
            }
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <ChevronDown className="h-4 w-4 rotate-90" />
          </button>
          <span className="text-sm font-bold">
            {calendarMonth.toLocaleString("default", {
              month: "long",
              year: "numeric",
            })}
          </span>
          <button
            onClick={() =>
              setCalendarMonth(new Date(year, month + 1, 1))
            }
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <ChevronDown className="h-4 w-4 -rotate-90" />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="space-y-2">
          {/* Day names */}
          <div className="grid grid-cols-7 gap-1">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div
                key={d}
                className="text-center text-[10px] font-bold text-muted-foreground py-1"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7 gap-1">{cells}</div>
        </div>

        {/* Buttons */}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-secondary hover:bg-secondary/80 text-foreground font-semibold text-xs transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
