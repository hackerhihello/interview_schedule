"use client";

import { useState, useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  User,
  X,
  Mail,
  Briefcase,
  Layers,
  Edit2,
  Plus,
  Search,
} from "lucide-react";
import { InterviewFormModal } from "@/components/interview-form-modal";
import { cn } from "@/lib/utils";
import { useUser } from "@clerk/nextjs";

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedInterviewId, setSelectedInterviewId] = useState<string | undefined>(undefined);
  const [isOpenForm, setIsOpenForm] = useState(false);
  
  // Detailed Daily Summary Modal states (triggered on click/tap)
  const [selectedDateInterviews, setSelectedDateInterviews] = useState<any[] | null>(null);
  const [selectedDateLabel, setSelectedDateLabel] = useState<string | null>(null);
  const [selectedCellDate, setSelectedCellDate] = useState<Date | null>(null);

  // Search filter query
  const [searchTerm, setSearchTerm] = useState("");

  // Hover Tooltip States
  const [hoveredCellIndex, setHoveredCellIndex] = useState<number | null>(null);
  const hoverTimeoutRef = useRef<any>(null);

  // Queries (Convex stubs handle optional args beautifully)
  const { user } = useUser();
  const currentUser = useQuery(
    api.users.currentUser,
    user ? { clerkId: user.id } : "skip"
  );
  const interviews = useQuery(
    api.interviews.getAll,
    user ? { clerkId: user.id } : "skip"
  ) || [];

  if (!currentUser || !user) {
    return (
      <div className="h-[60vh] w-full flex flex-col items-center justify-center space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary" />
        <p className="text-xs text-muted-foreground animate-pulse">Loading calendar schedules...</p>
      </div>
    );
  }

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

  const handleCellClick = (cellInterviews: any[], cell: Date) => {
    setSelectedCellDate(cell);
    setSelectedDateInterviews(cellInterviews);
    setSelectedDateLabel(
      cell.toLocaleDateString([], {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    );
  };

  // Hover Delay Controls (200ms timing delay)
  const handleMouseEnterCell = (index: number) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredCellIndex(index);
    }, 200);
  };

  const handleMouseLeaveCell = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setHoveredCellIndex(null);
  };

  // Smart Tooltip positioning logic to avoid boundary overflow clipping
  const getTooltipPositionClass = (cellIndex: number) => {
    const col = cellIndex % 7;
    
    let xPosition = "left-1/2 -translate-x-1/2";
    if (col === 0) xPosition = "left-0 translate-x-0";
    else if (col === 1) xPosition = "left-2 translate-x-0";
    else if (col === 5) xPosition = "right-2 left-auto translate-x-0";
    else if (col === 6) xPosition = "right-0 left-auto translate-x-0";

    const yPosition = cellIndex < 14 ? "top-[95%] mt-1.5" : "bottom-[95%] mb-1.5";

    return `${xPosition} ${yPosition}`;
  };

  // Format Date to YYYY-MM-DD for form default value
  const getFormattedSelectedDate = () => {
    if (!selectedCellDate) return undefined;
    const y = selectedCellDate.getFullYear();
    const m = String(selectedCellDate.getMonth() + 1).padStart(2, "0");
    const d = String(selectedCellDate.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const isAdmin = currentUser?.role === "admin";

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Interactive Calendar</h2>
          <p className="text-sm text-muted-foreground">
            Search, preview, and coordinate upcoming candidate sessions
          </p>
        </div>

        {/* Navigation & Search Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          {/* Quick Real-Time Search Bar */}
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search scheduled slots..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-12 py-2.5 rounded-xl border border-border bg-card text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3.5 top-3.5 text-[9px] font-bold text-muted-foreground hover:text-foreground uppercase tracking-wider cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Navigation Month Controls */}
          <div className="flex items-center gap-3 bg-card p-1.5 rounded-xl border border-border shadow-sm justify-between sm:justify-start">
            <button
              onClick={prevMonth}
              className="p-2 rounded-lg hover:bg-secondary text-foreground transition-all active:scale-95 cursor-pointer"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            
            <span className="text-xs font-bold text-foreground px-4 min-w-[120px] text-center uppercase tracking-wider select-none">
              {monthName} {year}
            </span>

            <button
              onClick={nextMonth}
              className="p-2 rounded-lg hover:bg-secondary text-foreground transition-all active:scale-95 cursor-pointer"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid Container Card */}
      <div className="p-6 rounded-3xl border border-border bg-card/25 backdrop-blur-sm shadow-md space-y-4 overflow-visible">
        {/* Interactive Grid Calendar Section Title & Subtitle */}
        <div className="flex flex-col gap-1 pb-1">
          <h3 className="text-base font-bold text-foreground">Interactive Grid Calendar</h3>
          <p className="text-xs text-muted-foreground">
            A clean minimal summary grid showing interview loads. Click cells to view list.
          </p>
        </div>

        {/* Calendar Month Workspace */}
        <div className="rounded-2xl border border-border bg-card/25 backdrop-blur-sm overflow-visible shadow-sm">
          {/* Days of Week Header */}
          <div className="grid grid-cols-7 border-b border-border bg-secondary/15 text-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest py-3 rounded-t-2xl">
            {daysOfWeek.map((day) => (
              <div key={day}>{day}</div>
            ))}
          </div>

          {/* Grid Cells */}
          <div className="grid grid-cols-7 divide-x divide-y divide-border/60 bg-background/25 rounded-b-2xl overflow-visible">
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
                const matchesDate = iMidnight === startOfDay;

                if (!matchesDate) return false;

                // Apply client-side search query match
                if (searchTerm) {
                  const query = searchTerm.toLowerCase();
                  return (
                    i.candidateName.toLowerCase().includes(query) ||
                    i.companyName?.toLowerCase().includes(query) ||
                    i.role?.toLowerCase().includes(query) ||
                    i.round.toLowerCase().includes(query) ||
                    i.subject?.toLowerCase().includes(query) ||
                    i.email?.toLowerCase().includes(query)
                  );
                }

                return true;
              });

              const hasInterviews = cellInterviews.length > 0;

              return (
                <div
                  key={index}
                  onMouseEnter={() => handleMouseEnterCell(index)}
                  onMouseLeave={handleMouseLeaveCell}
                  onClick={() => {
                    setSelectedCellDate(cell);
                    handleCellClick(cellInterviews, cell);
                  }}
                  className={cn(
                    "min-h-[85px] sm:min-h-[105px] p-2 flex flex-col justify-between transition-all group relative",
                    isCurrentMonth ? "bg-card/45" : "bg-secondary/10 text-muted-foreground/45",
                    isToday && "bg-primary/5 ring-1 ring-primary/20",
                    isToday && hasInterviews && "bg-primary/8 ring-2 ring-primary/40 shadow-[0_0_15px_rgba(59,130,246,0.15)]",
                    "cursor-pointer hover:bg-blue-500/5 dark:hover:bg-blue-500/10 hover:border-blue-500/30 hover:scale-[1.01] hover:shadow-[0_4px_20px_rgba(59,130,246,0.08)] active:scale-[0.99] transition-all",
                    index === 0 && "rounded-tl-2xl",
                    index === 6 && "rounded-tr-2xl",
                    index === 35 && "rounded-bl-2xl",
                    index === 41 && "rounded-br-2xl"
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
                          : "text-muted-foreground/30"
                      )}
                    >
                      {cell.getDate()}
                    </span>
                    
                    {/* Subtle addition prompt for Admins hovering empty grid cells */}
                    {!hasInterviews && isAdmin && isCurrentMonth && (
                      <Plus className="h-3.5 w-3.5 text-primary/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>

                  {/* SLOTS COUNT PILL & COLORED DOTS (Unified minimal UI for BOTH Desktop & Mobile) */}
                  {hasInterviews && (
                    <div className="flex flex-col items-center justify-center flex-1 py-2">
                      <span className="text-[9px] sm:text-xs font-extrabold text-primary px-2.5 py-0.5 bg-primary/10 rounded-full block text-center truncate max-w-full shadow-sm">
                        {cellInterviews.length} Slot{cellInterviews.length > 1 ? "s" : ""}
                      </span>
                      {cellInterviews.length > 1 && (
                        <span className="text-[8px] sm:text-[10px] font-bold text-muted-foreground mt-1 block text-center truncate max-w-full">
                          {cellInterviews.length} Interviews
                        </span>
                      )}
                      
                      {/* Colored dots indicating rounds */}
                      <div className="flex gap-1 justify-center mt-2 flex-wrap max-w-full">
                        {cellInterviews.map((i) => (
                          <div
                            key={i._id}
                            className={cn(
                              "h-1.5 w-1.5 rounded-full shrink-0 shadow-sm",
                              i.round.includes("Technical") && "bg-indigo-500",
                              i.round.includes("Design") && "bg-purple-500",
                              i.round.includes("HR") && "bg-pink-500",
                              i.round.includes("Client") && "bg-amber-500",
                              !i.round.includes("Technical") && !i.round.includes("Design") && !i.round.includes("HR") && !i.round.includes("Client") && "bg-cyan-500"
                            )}
                            title={i.round}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ADVANCED FLOATING HOVER CARD TOOLTIP (Desktop Hover Action) */}
                  <AnimatePresence>
                    {hoveredCellIndex === index && (hasInterviews || isAdmin) && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: index < 14 ? -8 : 8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: index < 14 ? -8 : 8 }}
                        transition={{ duration: 0.15 }}
                        className={cn(
                          "absolute w-64 p-4 rounded-2xl border border-border/80 glass shadow-2xl z-30 pointer-events-auto text-left flex flex-col justify-between space-y-3 cursor-default",
                          getTooltipPositionClass(index)
                        )}
                        onClick={(e) => e.stopPropagation()} // Stop cell click when clicking tooltip
                      >
                        {/* Tooltip Header */}
                        <div className="pb-1.5 border-b border-border/40 flex justify-between items-center">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                            {cell.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
                          </span>
                          <span className="text-[9px] font-bold text-muted-foreground bg-secondary/60 px-1.5 py-0.5 rounded-md">
                            {cellInterviews.length} Slot{cellInterviews.length !== 1 ? "s" : ""}
                          </span>
                        </div>

                        {/* Tooltip Body: Scrollable daily list */}
                        <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                          {hasInterviews && (
                            <div className="text-[11px] font-semibold text-foreground/80 mb-2">
                              {cellInterviews.length} Interview{cellInterviews.length > 1 ? "s" : ""} Scheduled
                            </div>
                          )}

                          {cellInterviews.slice(0, 5).map((item) => {
                            const isPassed = item.status === "passed";
                            const isFailed = item.status === "failed";
                            const isCancelled = item.status === "cancelled";
                            const isScheduled = item.status === "scheduled";
                            const isCompleted = item.status === "completed";

                            const initials = item.candidateName
                              .split(" ")
                              .map((n: string) => n[0])
                              .join("")
                              .substring(0, 2)
                              .toUpperCase();

                            return (
                              <div key={item._id} className="flex items-start gap-2.5 text-[11px] bg-secondary/20 p-2 rounded-xl border border-border/40">
                                {/* Candidate Avatar with initials */}
                                <div className="h-6 w-6 rounded-full bg-gradient-to-br from-primary/80 to-indigo-600/80 text-white font-bold text-[9px] flex items-center justify-center shrink-0 shadow-sm">
                                  {initials}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="font-bold text-foreground truncate max-w-[100px]">
                                      {item.candidateName}
                                    </span>
                                    {/* Status dot */}
                                    <span className={cn(
                                      "h-1.5 w-1.5 rounded-full shrink-0 shadow-sm",
                                      isPassed && "bg-emerald-500",
                                      isFailed && "bg-rose-500",
                                      isCancelled && "bg-slate-500",
                                      isScheduled && "bg-blue-500 animate-pulse",
                                      isCompleted && "bg-emerald-500"
                                    )} />
                                  </div>
                                  <span className="text-[9px] text-muted-foreground block font-mono mt-0.5">
                                    {item.startTime} — {item.round.split(" ")[0]}
                                  </span>
                                </div>
                              </div>
                            );
                          })}

                          {cellInterviews.length > 5 && (
                            <div className="text-[10px] text-primary font-bold text-center py-1 bg-primary/5 rounded-lg border border-primary/10">
                              + {cellInterviews.length - 5} more interview{cellInterviews.length - 5 > 1 ? "s" : ""}
                            </div>
                          )}

                          {cellInterviews.length === 0 && (
                            <span className="text-[10px] text-muted-foreground italic block py-2 text-center">
                              No scheduled slots today.
                            </span>
                          )}
                        </div>

                        {/* Tooltip Footer Actions */}
                        <div className="pt-2 border-t border-border/40 flex flex-col gap-2">
                          <div className="text-[9px] text-muted-foreground text-center italic select-none">
                            Click to view full details
                          </div>
                          {isAdmin && (
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedCellDate(cell);
                                setSelectedInterviewId(undefined);
                                setIsOpenForm(true);
                                setHoveredCellIndex(null); // Close tooltip immediately
                              }}
                              className="flex items-center justify-center gap-1.5 py-1.5 bg-primary/10 hover:bg-primary/25 border border-primary/20 text-primary rounded-xl text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer select-none active:scale-95"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              <span>Schedule Round</span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* UNIFIED DAILY EVENTS SUMMARY POPUP / DRAWER WITH SPRING ENTRY/EXIT ANIMATIONS */}
      <AnimatePresence>
        {selectedDateInterviews !== null && (
          <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center">
            {/* Backdrop Dismiss */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm cursor-pointer"
              onClick={() => setSelectedDateInterviews(null)}
            />

            {/* Dialog Container */}
            <motion.div
              initial={{ y: 80, scale: 0.97, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 80, scale: 0.97, opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
              className="relative w-full sm:max-w-lg max-h-[85vh] sm:max-h-[75vh] bg-card border-t sm:border border-border rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col justify-between overflow-hidden z-50"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-border bg-secondary/15">
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-primary px-2.5 py-0.5 bg-primary/10 rounded-full inline-flex items-center gap-1.5 shadow-sm">
                    <img src="/logo.png" className="h-3 w-3 object-contain" alt="Ignited Minds Logo" />
                    <span>Daily Summary Sheet</span>
                  </span>
                  <h3 className="text-base font-bold text-foreground mt-2 font-sans text-left">
                    {selectedDateLabel}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5 text-left">
                    {selectedDateInterviews.length} round{selectedDateInterviews.length > 1 ? "s" : ""} scheduled
                  </p>
                </div>
                <button
                  onClick={() => setSelectedDateInterviews(null)}
                  className="p-2 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-foreground transition-all hover:rotate-90 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Scrollable list */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 max-h-[50vh] scrollbar-thin">
                {selectedDateInterviews.length > 0 ? (
                  selectedDateInterviews.map((item) => {
                    const initials = item.candidateName
                      .split(" ")
                      .map((n: string) => n[0])
                      .join("")
                      .substring(0, 2)
                      .toUpperCase();

                    const isPassed = item.status === "passed";
                    const isFailed = item.status === "failed";
                    const isCancelled = item.status === "cancelled";
                    const isScheduled = item.status === "scheduled";
                    const isCompleted = item.status === "completed";

                    const canEdit =
                      currentUser?.role === "admin" ||
                      item.createdBy === currentUser?.clerkId ||
                      item.assignedUserId === currentUser?.clerkId;

                    return (
                      <div
                        key={item._id}
                        className="p-4.5 rounded-2xl border border-border bg-card/65 dark:bg-card/25 flex gap-4 hover:border-primary/25 transition-all duration-300"
                      >
                        {/* Initials Avatar */}
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-indigo-600 text-white font-bold text-sm shadow-md">
                          {initials}
                        </div>

                        {/* Details Container */}
                        <div className="flex-1 min-w-0 space-y-2 text-left">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="font-bold text-sm text-foreground truncate">
                                {item.candidateName}
                              </h4>
                              {item.email && (
                                <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-muted-foreground font-mono truncate">
                                  <Mail className="h-3 w-3 shrink-0" />
                                  <span>{item.email}</span>
                                </div>
                              )}
                            </div>
                            
                            {/* Status Badge */}
                            <span className={cn(
                              "px-2 py-0.5 rounded-full font-bold text-[8px] uppercase tracking-wider inline-flex items-center gap-1 shrink-0 border",
                              isScheduled && "bg-blue-500/10 text-blue-500 border-blue-500/15",
                              isCompleted && "bg-emerald-500/10 text-emerald-500 border-emerald-500/15",
                              isCancelled && "bg-slate-500/10 text-slate-500 border-slate-500/15",
                              isPassed && "bg-green-500/10 text-green-500 border-green-500/15",
                              isFailed && "bg-rose-500/10 text-rose-500 border-rose-500/15"
                            )}>
                              <span>{item.status}</span>
                            </span>
                          </div>

                          {/* Timings & Category details */}
                          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/40">
                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                              <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
                              <span className="font-mono truncate">{item.startTime} - {item.endTime}</span>
                            </div>

                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground truncate">
                              <Layers className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                              <span className="truncate">{item.round}</span>
                            </div>
                          </div>

                          {/* Company & Role details */}
                          {(item.companyName || item.role) && (
                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground bg-secondary/30 p-2 rounded-lg border border-border/40 mt-1">
                              <Briefcase className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              <span className="truncate font-semibold text-[9px]">
                                {item.companyName || "N/A"} • {item.role || "N/A"}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Edit action button */}
                        {canEdit && (
                          <button
                            onClick={() => {
                              setSelectedDateInterviews(null); // Dismiss summary popover
                              handleOpenEdit(item._id); // Open form dialog
                            }}
                            className="p-2.5 rounded-xl border border-border bg-card hover:bg-secondary text-primary transition-all self-center shrink-0 active:scale-95 shadow-sm cursor-pointer"
                            title="Edit Slot Parameters"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center space-y-3 bg-secondary/5 border border-dashed border-border rounded-2xl">
                    <div className="h-10 w-10 rounded-xl bg-secondary/40 border border-border flex items-center justify-center text-muted-foreground animate-pulse">
                      <CalendarIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground text-xs">No interviews scheduled</h4>
                      <p className="text-[10px] text-muted-foreground mt-1 max-w-[200px] mx-auto leading-normal">
                        Click "Add Interview" below to schedule a session for this day.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-border bg-secondary/10 flex items-center justify-between gap-3">
                {user && (
                  <button
                    onClick={() => {
                      setSelectedDateInterviews(null); // Close summary popup
                      setSelectedInterviewId(undefined); // Set to creation mode
                      setIsOpenForm(true); // Open creation modal
                    }}
                    className="flex-1 py-2.5 rounded-xl border border-border bg-card hover:bg-secondary text-primary font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 active:scale-98 cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Interview</span>
                  </button>
                )}
                
                <button
                  onClick={() => setSelectedDateInterviews(null)}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-primary to-indigo-600 text-white font-bold text-xs shadow-md transition-all active:scale-98 cursor-pointer text-center"
                >
                  Close Summary
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Form Slider Modal */}
      <InterviewFormModal
        isOpen={isOpenForm}
        onClose={() => setIsOpenForm(false)}
        interviewId={selectedInterviewId}
        defaultDate={getFormattedSelectedDate()}
      />
    </div>
  );
}
