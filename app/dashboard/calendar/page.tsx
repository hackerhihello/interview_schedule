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
  LayoutGrid,
  List
} from "lucide-react";
import { InterviewFormModal } from "@/components/interview-form-modal";
import { cn } from "@/lib/utils";
import { useUser } from "@clerk/nextjs";

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedInterviewId, setSelectedInterviewId] = useState<string | undefined>(undefined);
  const [isOpenForm, setIsOpenForm] = useState(false);
  const [viewType, setViewType] = useState<"month" | "week" | "day">("month");
  
  // Detailed Daily Summary Modal states
  const [selectedDateInterviews, setSelectedDateInterviews] = useState<any[] | null>(null);
  const [selectedDateLabel, setSelectedDateLabel] = useState<string | null>(null);
  const [selectedCellDate, setSelectedCellDate] = useState<Date | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [hoveredCellIndex, setHoveredCellIndex] = useState<number | null>(null);
  const hoverTimeoutRef = useRef<any>(null);

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

  const goToday = () => setCurrentDate(new Date());

  const goPrev = () => {
    if (viewType === "month") setCurrentDate(new Date(year, month - 1, 1));
    else if (viewType === "week") setCurrentDate(new Date(year, month, currentDate.getDate() - 7));
    else if (viewType === "day") setCurrentDate(new Date(year, month, currentDate.getDate() - 1));
  };
  
  const goNext = () => {
    if (viewType === "month") setCurrentDate(new Date(year, month + 1, 1));
    else if (viewType === "week") setCurrentDate(new Date(year, month, currentDate.getDate() + 7));
    else if (viewType === "day") setCurrentDate(new Date(year, month, currentDate.getDate() + 1));
  };

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const monthCells: Date[] = [];
  for (let i = firstDayOfMonth - 1; i >= 0; i--) monthCells.push(new Date(year, month - 1, daysInPrevMonth - i));
  for (let i = 1; i <= daysInMonth; i++) monthCells.push(new Date(year, month, i));
  const remainingCells = 42 - monthCells.length;
  for (let i = 1; i <= remainingCells; i++) monthCells.push(new Date(year, month + 1, i));

  const currentDayOfWeek = currentDate.getDay();
  const weekStart = new Date(year, month, currentDate.getDate() - currentDayOfWeek);
  const weekCells: Date[] = [];
  for (let i = 0; i < 7; i++) {
    weekCells.push(new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + i));
  }

  const dayCells = [currentDate];

  const activeCells = viewType === "month" ? monthCells : viewType === "week" ? weekCells : dayCells;
  
  const monthName = currentDate.toLocaleString("default", { month: "long" });

  let headerLabel = "";
  if (viewType === "month") {
    headerLabel = `${monthName} ${year}`;
  } else if (viewType === "week") {
    const weekEnd = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 6);
    if (weekStart.getMonth() === weekEnd.getMonth()) {
      headerLabel = `${monthName} ${weekStart.getDate()} - ${weekEnd.getDate()}, ${year}`;
    } else {
      headerLabel = `${weekStart.toLocaleString("default", { month: "short" })} ${weekStart.getDate()} - ${weekEnd.toLocaleString("default", { month: "short" })} ${weekEnd.getDate()}, ${year}`;
    }
  } else {
    headerLabel = `${monthName} ${currentDate.getDate()}, ${year}`;
  }

  const handleOpenEdit = (id: string) => {
    setSelectedInterviewId(id);
    setIsOpenForm(true);
  };

  const handleCellClick = (cellInterviews: any[], cell: Date) => {
    setSelectedCellDate(cell);
    setSelectedDateInterviews(cellInterviews);
    setSelectedDateLabel(
      cell.toLocaleDateString([], {
        weekday: "short", month: "long", day: "numeric", year: "numeric",
      })
    );
  };

  const handleMouseEnterCell = (index: number) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => setHoveredCellIndex(index), 250);
  };

  const handleMouseLeaveCell = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setHoveredCellIndex(null);
  };

  const getTooltipPositionClass = (cellIndex: number) => {
    const col = viewType === "day" ? 0 : cellIndex % 7;
    let xPosition = "left-1/2 -translate-x-1/2";
    if (col === 0 || col === 1) xPosition = "left-4 translate-x-0";
    else if (col === 5 || col === 6) xPosition = "right-4 left-auto translate-x-0";
    const yPosition = cellIndex < 14 ? "top-full mt-2" : "bottom-full mb-2";
    return `${xPosition} ${yPosition}`;
  };

  const getFormattedSelectedDate = () => {
    if (!selectedCellDate) return undefined;
    const y = selectedCellDate.getFullYear();
    const m = String(selectedCellDate.getMonth() + 1).padStart(2, "0");
    const d = String(selectedCellDate.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const baseDaysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const daysOfWeek = viewType === "day" ? [currentDate.toLocaleString("default", { weekday: "long" })] : baseDaysOfWeek;
  
  const isAdmin = currentUser?.role === "admin";

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto h-[calc(100vh-120px)] flex flex-col">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-card/10 p-6 rounded-[24px] glass border-border/40 shadow-sm shrink-0">
        <div className="space-y-1">
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground">Calendar</h2>
          <p className="text-sm text-muted-foreground font-medium">
            Manage your schedule and coordinate candidate interviews.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto">
          {/* View Toggles */}
          <div className="flex items-center p-1 rounded-xl bg-background/50 border border-border/50 shadow-inner">
            <button onClick={() => setViewType("month")} className={cn("px-4 py-1.5 rounded-lg text-sm font-semibold transition-all", viewType === "month" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>Month</button>
            <button onClick={() => setViewType("week")} className={cn("px-4 py-1.5 rounded-lg text-sm font-semibold transition-all", viewType === "week" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>Week</button>
            <button onClick={() => setViewType("day")} className={cn("px-4 py-1.5 rounded-lg text-sm font-semibold transition-all", viewType === "day" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>Day</button>
          </div>

          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border/60 bg-background/40 hover:bg-background/60 text-foreground text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all shadow-sm"
            />
          </div>
          
          {user && (
            <button
              onClick={() => {
                setSelectedCellDate(new Date());
                setSelectedInterviewId(undefined);
                setIsOpenForm(true);
              }}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-indigo text-white font-bold text-sm shadow-md hover:shadow-indigo-500/25 transition-all active:scale-98 shrink-0"
            >
              <Plus className="h-4.5 w-4.5" />
              <span>New Event</span>
            </button>
          )}
        </div>
      </div>

      {/* Calendar Body */}
      <div className="flex-1 rounded-[24px] border border-border/50 glass shadow-sm flex flex-col overflow-hidden bg-card/20">
        
        {/* Calendar Toolbar */}
        <div className="flex items-center justify-between p-4 border-b border-border/40 bg-background/30 backdrop-blur-md">
           <div className="flex items-center gap-4">
             <button onClick={goToday} className="px-4 py-2 rounded-xl border border-border/50 bg-card hover:bg-secondary/60 text-sm font-bold shadow-sm transition-all active:scale-95">
               Today
             </button>
             <div className="flex items-center gap-1 bg-background/50 rounded-xl border border-border/50 p-1 shadow-inner">
               <button onClick={goPrev} className="p-1.5 rounded-lg hover:bg-secondary text-foreground transition-all"><ChevronLeft className="h-5 w-5" /></button>
               <button onClick={goNext} className="p-1.5 rounded-lg hover:bg-secondary text-foreground transition-all"><ChevronRight className="h-5 w-5" /></button>
             </div>
             <h3 className="text-lg sm:text-xl font-bold text-foreground min-w-[200px]">{headerLabel}</h3>
           </div>
        </div>

        {/* Calendar Grid */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Days Header */}
          <div className={cn("grid border-b border-border/40 bg-secondary/10", viewType === "day" ? "grid-cols-1" : "grid-cols-7")}>
            {daysOfWeek.map((day) => (
              <div key={day} className="text-center py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                {day}
              </div>
            ))}
          </div>

          {/* Grid Cells */}
          <div className={cn("flex-1 grid divide-x divide-y divide-border/40 overflow-y-auto custom-scrollbar bg-background/20", viewType === "day" ? "grid-cols-1" : "grid-cols-7")}>
            {activeCells.map((cell, index) => {
              const isCurrentMonth = cell.getMonth() === month;
              const isToday = cell.getDate() === new Date().getDate() && cell.getMonth() === new Date().getMonth() && cell.getFullYear() === new Date().getFullYear();
              const startOfDay = new Date(cell.getFullYear(), cell.getMonth(), cell.getDate()).getTime();
              
              const cellInterviews = interviews.filter((i) => {
                const iDate = new Date(i.interviewDate);
                const iMidnight = new Date(iDate.getFullYear(), iDate.getMonth(), iDate.getDate()).getTime();
                if (iMidnight !== startOfDay) return false;
                if (searchTerm) {
                  const q = searchTerm.toLowerCase();
                  return i.candidateName.toLowerCase().includes(q) || i.role?.toLowerCase().includes(q);
                }
                return true;
              });

              const hasInterviews = cellInterviews.length > 0;

              return (
                <div
                  key={index}
                  onMouseEnter={() => handleMouseEnterCell(index)}
                  onMouseLeave={handleMouseLeaveCell}
                  onClick={() => { setSelectedCellDate(cell); handleCellClick(cellInterviews, cell); }}
                  className={cn(
                    "min-h-[120px] p-2 transition-all relative group cursor-pointer flex flex-col",
                    isCurrentMonth ? "bg-transparent" : "bg-secondary/5 opacity-50",
                    isToday && "bg-primary/5",
                    "hover:bg-background/80"
                  )}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={cn("text-xs font-bold h-7 w-7 rounded-full flex items-center justify-center transition-all", isToday ? "bg-primary text-white shadow-md" : "text-muted-foreground group-hover:text-foreground")}>
                      {cell.getDate()}
                    </span>
                  </div>

                  <div className="flex-1 space-y-1 overflow-y-auto custom-scrollbar pr-1">
                    {cellInterviews.slice(0, 3).map(item => (
                      <div key={item._id} className={cn("px-2 py-1.5 rounded-lg text-[10px] font-bold truncate transition-transform hover:-translate-y-px hover:shadow-sm", item.round.includes("Technical") ? "bg-indigo-500/10 text-indigo-500 border border-indigo-500/20" : "bg-primary/10 text-primary border border-primary/20")}>
                        {item.startTime} {item.candidateName}
                      </div>
                    ))}
                    {cellInterviews.length > 3 && (
                      <div className="text-[10px] font-bold text-muted-foreground px-2 py-1">
                        + {cellInterviews.length - 3} more
                      </div>
                    )}
                  </div>

                  <AnimatePresence>
                    {hoveredCellIndex === index && (hasInterviews || isAdmin) && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 5 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 5 }} transition={{ duration: 0.15 }}
                        className={cn("absolute w-72 p-5 rounded-[20px] border border-border/60 glass shadow-2xl z-50 pointer-events-auto text-left", getTooltipPositionClass(index))}
                        onClick={e => e.stopPropagation()}
                      >
                        <div className="pb-3 border-b border-border/40 flex justify-between items-center mb-3">
                          <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                            {cell.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
                          </span>
                        </div>
                        <div className="space-y-2.5 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                          {cellInterviews.map(item => (
                            <div key={item._id} className="flex flex-col gap-1 bg-background/50 p-2.5 rounded-xl border border-border/40">
                              <span className="font-bold text-xs text-foreground">{item.candidateName}</span>
                              <span className="text-[10px] text-muted-foreground font-mono">{item.startTime} — {item.round}</span>
                            </div>
                          ))}
                          {cellInterviews.length === 0 && <span className="text-[11px] text-muted-foreground italic text-center block py-2">No events</span>}
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

      <AnimatePresence>
        {selectedDateInterviews !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-background/80 backdrop-blur-sm cursor-pointer" onClick={() => setSelectedDateInterviews(null)} />
            
            <motion.div initial={{ y: 50, scale: 0.95, opacity: 0 }} animate={{ y: 0, scale: 1, opacity: 1 }} exit={{ y: 20, scale: 0.95, opacity: 0 }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className="relative w-full max-w-xl max-h-[85vh] bg-card border border-border/60 rounded-[24px] shadow-2xl flex flex-col overflow-hidden z-50 glass">
              <div className="flex items-center justify-between p-6 border-b border-border/40 bg-secondary/20">
                <div>
                  <h3 className="text-xl font-bold text-foreground">{selectedDateLabel}</h3>
                  <p className="text-xs font-medium text-muted-foreground mt-1">{selectedDateInterviews.length} event{selectedDateInterviews.length !== 1 ? 's' : ''}</p>
                </div>
                <button onClick={() => setSelectedDateInterviews(null)} className="p-2 rounded-full hover:bg-secondary/80 text-muted-foreground transition-all"><X className="h-5 w-5" /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                {selectedDateInterviews.length > 0 ? selectedDateInterviews.map((item) => (
                  <div key={item._id} className="p-5 rounded-2xl border border-border/50 bg-background/40 flex gap-4 hover:border-primary/30 transition-all shadow-sm">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-indigo text-white font-bold text-lg shadow-md">{item.candidateName.substring(0,2).toUpperCase()}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-sm text-foreground">{item.candidateName}</h4>
                        <span className={cn("px-2.5 py-1 rounded-full font-bold text-[9px] uppercase tracking-wider", item.status === "scheduled" ? "bg-blue-500/10 text-blue-500" : "bg-emerald-500/10 text-emerald-500")}>{item.status}</span>
                      </div>
                      <div className="mt-2 space-y-1.5">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground"><Clock className="h-3.5 w-3.5 text-primary" /> <span className="font-mono">{item.startTime} - {item.endTime}</span></div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground"><Layers className="h-3.5 w-3.5 text-indigo-500" /> <span>{item.round}</span></div>
                      </div>
                    </div>
                    {isAdmin && (
                      <button onClick={() => { setSelectedDateInterviews(null); handleOpenEdit(item._id); }} className="h-10 w-10 self-center rounded-xl border border-border/50 bg-card hover:bg-primary hover:text-white flex items-center justify-center transition-all shadow-sm"><Edit2 className="h-4 w-4" /></button>
                    )}
                  </div>
                )) : (
                  <div className="text-center py-12 text-muted-foreground flex flex-col items-center">
                    <CalendarIcon className="h-10 w-10 mb-4 opacity-50 animate-bounce" />
                    <p className="font-bold text-sm">No events scheduled</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <InterviewFormModal isOpen={isOpenForm} onClose={() => setIsOpenForm(false)} interviewId={selectedInterviewId} defaultDate={getFormattedSelectedDate()} />
    </div>
  );
}
