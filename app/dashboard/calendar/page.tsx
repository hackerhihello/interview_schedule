"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  User,
  Sparkles,
} from "lucide-react";
import { InterviewFormModal } from "@/components/interview-form-modal";
import { cn } from "@/lib/utils";

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedInterviewId, setSelectedInterviewId] = useState<string | undefined>(undefined);
  const [isOpenForm, setIsOpenForm] = useState(false);

  // Queries
  const { user } = useUser();
  const currentUser = useQuery(
    api.users.currentUser,
    user ? { clerkId: user.id } : "skip"
  );
  const interviews = useQuery(
    api.interviews.getAll,
    user ? { clerkId: user.id } : "skip"
  ) || [];

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Month navigation
  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Calendar calculations
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sunday, ..., 6 = Saturday
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const totalCells = 42; // standard 6-row calendar grid
  const cells: Date[] = [];

  // Pad previous month days
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    cells.push(new Date(year, month - 1, daysInPrevMonth - i));
  }

  // Populate current month days
  for (let i = 1; i <= daysInMonth; i++) {
    cells.push(new Date(year, month, i));
  }

  // Pad next month days
  const remainingCells = totalCells - cells.length;
  for (let i = 1; i <= remainingCells; i++) {
    cells.push(new Date(year, month + 1, i));
  }

  // Format month name
  const monthName = currentDate.toLocaleString("default", { month: "long" });

  const handleOpenEdit = (id: string) => {
    setSelectedInterviewId(id);
    setIsOpenForm(true);
  };

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Interactive Grid Calendar</h2>
          <p className="text-sm text-muted-foreground">
            Visualize scheduled rounds, inspect overlap, and click slots to edit parameters
          </p>
        </div>

        {/* Navigation Month Controls */}
        <div className="flex items-center gap-3 bg-card p-1.5 rounded-xl border border-border self-start sm:self-auto">
          <button
            onClick={prevMonth}
            className="p-2 rounded-lg hover:bg-secondary text-foreground transition-all active:scale-95"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          
          <span className="text-xs font-bold text-foreground px-4 min-w-[120px] text-center uppercase tracking-wider">
            {monthName} {year}
          </span>

          <button
            onClick={nextMonth}
            className="p-2 rounded-lg hover:bg-secondary text-foreground transition-all active:scale-95"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Calendar Month Workspace */}
      <div className="rounded-2xl border border-border bg-card/25 backdrop-blur-sm overflow-hidden shadow-md">
        {/* Days of Week Header */}
        <div className="grid grid-cols-7 border-b border-border bg-secondary/15 text-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest py-3">
          {daysOfWeek.map((day) => (
            <div key={day}>{day}</div>
          ))}
        </div>

        {/* Grid Cells */}
        <div className="grid grid-cols-7 divide-x divide-y divide-border/60 bg-background/25">
          {cells.map((cell, index) => {
            const isCurrentMonth = cell.getMonth() === month;
            const isToday =
              cell.getDate() === new Date().getDate() &&
              cell.getMonth() === new Date().getMonth() &&
              cell.getFullYear() === new Date().getFullYear();

            // Set cell boundaries to filter interviews occurring on this day
            const startOfDay = new Date(cell.getFullYear(), cell.getMonth(), cell.getDate()).getTime();
            
            const cellInterviews = interviews.filter((i) => {
              const iDate = new Date(i.interviewDate);
              const iMidnight = new Date(iDate.getFullYear(), iDate.getMonth(), iDate.getDate()).getTime();
              return iMidnight === startOfDay;
            });

            return (
              <div
                key={index}
                className={cn(
                  "min-h-[110px] p-2 flex flex-col justify-between transition-all group",
                  isCurrentMonth ? "bg-card/45" : "bg-secondary/10 text-muted-foreground/45",
                  isToday && "bg-primary/5 ring-1 ring-primary/20 inset-0"
                )}
              >
                {/* Day Number Label */}
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      "text-xs font-bold font-mono h-6 w-6 rounded-full flex items-center justify-center transition-all",
                      isToday
                        ? "bg-primary text-white shadow-md shadow-primary/25"
                        : isCurrentMonth
                        ? "text-foreground group-hover:bg-secondary/60"
                        : "text-muted-foreground/50"
                    )}
                  >
                    {cell.getDate()}
                  </span>
                  
                  {cellInterviews.length > 0 && (
                    <span className="text-[9px] font-bold text-primary px-1.5 py-0.5 bg-primary/10 rounded">
                      {cellInterviews.length} Slot{cellInterviews.length > 1 ? "s" : ""}
                    </span>
                  )}
                </div>

                {/* Event lists */}
                <div className="mt-2 flex-1 space-y-1.5 overflow-y-auto max-h-[85px] pr-0.5 scrollbar-thin">
                  {cellInterviews.map((item) => {
                    const isPassed = item.status === "passed";
                    const isFailed = item.status === "failed";
                    const isCancelled = item.status === "cancelled";

                    return (
                      <button
                        key={item._id}
                        onClick={() => handleOpenEdit(item._id)}
                        className={cn(
                          "w-full text-left p-1.5 rounded-lg border text-[9px] font-bold transition-all hover:scale-102 active:scale-98 block truncate",
                          isPassed && "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
                          isFailed && "bg-rose-500/10 text-rose-500 border-rose-500/20",
                          isCancelled && "bg-slate-500/10 text-slate-500 border-slate-500/20",
                          !isPassed && !isFailed && !isCancelled && "bg-primary/10 text-primary border-primary/20"
                        )}
                        title={`${item.candidateName} - ${item.round} (${item.startTime})`}
                      >
                        <div className="truncate flex items-center gap-1">
                          <span className={cn(
                            "h-1 w-1 rounded-full shrink-0",
                            isPassed && "bg-emerald-500",
                            isFailed && "bg-rose-500",
                            isCancelled && "bg-slate-500",
                            !isPassed && !isFailed && !isCancelled && "bg-primary animate-pulse"
                          )} />
                          <span className="truncate">{item.candidateName}</span>
                        </div>
                        <div className="text-[8px] text-muted-foreground truncate font-mono font-medium mt-0.5">
                          {item.startTime} • {item.round.split(" ")[0]}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Form Slider Modal */}
      <InterviewFormModal
        isOpen={isOpenForm}
        onClose={() => setIsOpenForm(false)}
        interviewId={selectedInterviewId}
      />
    </div>
  );
}
