"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Plus,
  Search,
  Filter,
  Download,
  Calendar,
  Clock,
  Briefcase,
  Edit2,
  Trash2,
  UserCheck,
  UserX,
  ChevronDown,
  LayoutGrid,
  List,
  Mail,
  MoreVertical
} from "lucide-react";
import { toast } from "sonner";
import { InterviewFormModal } from "@/components/interview-form-modal";
import { DatePickerModal } from "@/components/date-picker-modal";
import { cn } from "@/lib/utils";

const ITEMS_PER_PAGE = 8;

export default function InterviewsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground animate-pulse">Loading scheduling data...</div>}>
      <InterviewsContent />
    </Suspense>
  );
}

function InterviewsContent() {
  const [isOpenForm, setIsOpenForm] = useState(false);
  const [selectedInterviewId, setSelectedInterviewId] = useState<string | undefined>(undefined);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  
  // Search & Filters State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRound, setSelectedRound] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedInterviewer, setSelectedInterviewer] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [mobileDateInput, setMobileDateInput] = useState("");
  const [showMobileCalendar, setShowMobileCalendar] = useState(false);

  // Pagination cursor state
  const [numResults, setNumResults] = useState(ITEMS_PER_PAGE);

  const searchParams = useSearchParams();

  useEffect(() => {
    const s = searchParams?.get("search");
    if (s) {
      setSearchTerm(s);
    }
  }, [searchParams]);

  // Queries & Mutations
  const { user } = useUser();
  const currentUser = useQuery(
    api.users.currentUser,
    user ? { clerkId: user.id } : "skip"
  );
  const isAdmin = currentUser?.role === "admin";
  const deleteInterview = useMutation(api.interviews.deleteInterview);
  const updateInterview = useMutation(api.interviews.update);
  const allUsers = useQuery(
    api.users.getUsers,
    currentUser && isAdmin ? { clerkId: user?.id } : "skip"
  ) || [];

  const dateTimestamp = selectedDate ? (() => {
    const [year, month, day] = selectedDate.split("-").map(Number);
    return new Date(year, month - 1, day).getTime();
  })() : undefined;

  const formatToDisplay = (iso?: string) => {
    if (!iso) return "";
    const [y, m, d] = iso.split("-");
    return `${d}-${m}-${y}`;
  };

  const parseDisplayToISO = (display: string) => {
    const m = display.match(/^(\d{2})-(\d{2})-(\d{4})$/);
    if (!m) return undefined;
    const [, dd, mm, yyyy] = m;
    return `${yyyy}-${mm}-${dd}`;
  };

  useEffect(() => {
    setMobileDateInput(formatToDisplay(selectedDate));
  }, [selectedDate]);

  const paginatedResult = useQuery(
    api.interviews.getPaginated,
    user
      ? {
          paginationOpts: {
            numItems: numResults,
            cursor: null,
          },
          search: searchTerm || undefined,
          round: selectedRound || undefined,
          status: selectedStatus || undefined,
          assignedUserId: selectedInterviewer || undefined,
          dateFilter: dateTimestamp,
          clerkId: user.id,
        }
      : "skip"
  );

  const allInterviews = useQuery(
    api.interviews.getAll,
    user ? { clerkId: user.id } : "skip"
  ) || [];

  const interviews = paginatedResult?.page || [];
  const hasMore = paginatedResult ? !paginatedResult.isDone : false;

  const handleOpenCreateModal = () => {
    setSelectedInterviewId(undefined);
    setIsOpenForm(true);
  };

  const handleOpenEditModal = (id: string) => {
    setSelectedInterviewId(id);
    setIsOpenForm(true);
  };

  const handleDelete = async (id: Id<"interviews">) => {
    if (!window.confirm("Are you absolutely sure you want to delete this interview schedule?")) return;
    try {
      await deleteInterview({ id, clerkId: user?.id });
      toast.success("Schedule deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete schedule");
    }
  };

  const handleUpdateStatus = async (id: Id<"interviews">, status: "scheduled" | "completed" | "cancelled" | "passed" | "failed") => {
    try {
      await updateInterview({ id, status, clerkId: user?.id });
      toast.success(`Status updated to ${status}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update status");
    }
  };

  const handleExportCSV = () => {
    if (allInterviews.length === 0) return;
    const headers = ["Candidate Name", "Email", "Round", "Date", "Start Time", "End Time", "Company", "Role", "Subject", "Status", "Assigned Interviewer"];
    const rows = allInterviews.map((i) => [
      i.candidateName, i.email || "", i.round, new Date(i.interviewDate).toLocaleDateString(),
      i.startTime, i.endTime, i.companyName || "", i.role || "", i.subject || "", i.status,
      i.assignedUser?.name || "Unassigned",
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.map(val => `"${val.replace(/"/g, '""')}"`).join(","))].join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = `interviews_export_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const roundsList = ["Technical Round", "System Design Round", "HR Round", "Client Round", "Managerial Round", "Coding Assessment"];

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 bg-card/10 p-6 rounded-[24px] glass border-border/40 shadow-sm">
        <div className="space-y-1">
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground">Interviews</h2>
          <p className="text-sm text-muted-foreground font-medium">
            Manage your candidate pipeline and assessment schedules.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => setViewMode(viewMode === "table" ? "grid" : "table")}
            className="hidden md:flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border/50 bg-background/50 hover:bg-secondary/60 text-muted-foreground hover:text-foreground transition-all shadow-sm"
            title="Toggle View"
          >
            {viewMode === "table" ? <LayoutGrid className="h-4.5 w-4.5" /> : <List className="h-4.5 w-4.5" />}
          </button>
          
          <button
            onClick={handleExportCSV}
            disabled={allInterviews.length === 0}
            className="flex flex-1 sm:flex-none items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border/50 bg-background/50 hover:bg-secondary/60 text-foreground font-semibold text-sm transition-all shadow-sm active:scale-98 disabled:opacity-50"
          >
            <Download className="h-4.5 w-4.5 text-muted-foreground" />
            <span>Export</span>
          </button>

          {user && (
            <button
              onClick={handleOpenCreateModal}
              className="flex flex-1 sm:flex-none items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-indigo text-white font-bold text-sm shadow-md hover:shadow-indigo-500/25 transition-all active:scale-98"
            >
              <Plus className="h-4.5 w-4.5" />
              <span>New Schedule</span>
            </button>
          )}
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="p-6 rounded-[24px] border border-border/50 glass shadow-sm space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-border/30">
          <Filter className="h-4.5 w-4.5 text-primary" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Active Filters</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="relative group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Search candidates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-border/60 bg-background/40 hover:bg-background/60 text-foreground text-sm focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all shadow-sm"
            />
          </div>

          <select
            value={selectedRound}
            onChange={(e) => setSelectedRound(e.target.value)}
            className="w-full px-3.5 py-3 rounded-xl border border-border/60 bg-background/40 hover:bg-background/60 text-foreground text-sm focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all shadow-sm appearance-none"
          >
            <option value="">All Stages</option>
            {roundsList.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-3.5 py-3 rounded-xl border border-border/60 bg-background/40 hover:bg-background/60 text-foreground text-sm focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all shadow-sm appearance-none"
          >
            <option value="">All Statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="passed">Passed</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={selectedInterviewer}
            onChange={(e) => setSelectedInterviewer(e.target.value)}
            className="w-full px-3.5 py-3 rounded-xl border border-border/60 bg-background/40 hover:bg-background/60 text-foreground text-sm focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all shadow-sm appearance-none"
          >
            <option value="">All Interviewers</option>
            {allUsers.map((u) => <option key={u.clerkId} value={u.clerkId}>{u.name}</option>)}
          </select>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-background/40 px-3.5 py-3 w-full md:hidden shadow-sm">
              <input
                type="text"
                placeholder="dd-mm-yyyy"
                value={mobileDateInput}
                onChange={(e) => {
                  const v = e.target.value;
                  setMobileDateInput(v);
                  const iso = parseDisplayToISO(v);
                  if (iso) setSelectedDate(iso);
                  if (!v) setSelectedDate("");
                }}
                className="flex-1 min-w-0 bg-transparent text-foreground text-sm outline-none"
              />
              <button onClick={() => setShowMobileCalendar(true)} className="p-1 text-muted-foreground hover:text-primary">
                <Calendar className="h-4.5 w-4.5" />
              </button>
            </div>

            <div className="hidden md:flex items-center gap-3 rounded-xl border border-border/60 bg-background/40 px-3.5 py-3 w-full shadow-sm hover:bg-background/60 focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/10 transition-all">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="flex-1 min-w-0 bg-transparent text-foreground text-sm outline-none"
              />
            </div>
          </div>
        </div>

        {(searchTerm || selectedRound || selectedStatus || selectedInterviewer || selectedDate) && (
          <div className="flex justify-end pt-2">
            <button
              onClick={() => {
                setSearchTerm(""); setSelectedRound(""); setSelectedStatus(""); setSelectedInterviewer(""); setSelectedDate("");
              }}
              className="text-[11px] font-bold tracking-widest uppercase text-destructive/80 hover:text-destructive hover:underline transition-all"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area (Table vs Grid) */}
      <div className="animate-slide-up">
        {!paginatedResult ? (
          <div className="h-64 rounded-[24px] bg-secondary/30 border border-border/40 animate-pulse" />
        ) : interviews.length === 0 ? (
          <div className="p-16 text-center text-muted-foreground border border-border/50 rounded-[24px] glass shadow-sm">
            <div className="flex flex-col items-center justify-center space-y-4 max-w-sm mx-auto">
              <div className="h-16 w-16 rounded-[20px] bg-background/60 shadow-inner flex items-center justify-center text-muted-foreground animate-bounce">
                <Calendar className="h-8 w-8" />
              </div>
              <div>
                <h4 className="font-bold text-foreground text-lg tracking-tight">No schedules found</h4>
                <p className="text-sm text-muted-foreground mt-2">Adjust your filters or create a new interview slot.</p>
              </div>
            </div>
          </div>
        ) : viewMode === "table" ? (
          <div className="overflow-x-auto rounded-[24px] border border-border/50 glass shadow-sm">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="border-b border-border/40 bg-secondary/20 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                  <th className="p-5 pl-8">Candidate</th>
                  <th className="p-5">Schedule</th>
                  <th className="p-5">Round</th>
                  <th className="p-5">Role</th>
                  <th className="p-5">Interviewer</th>
                  <th className="p-5">Status</th>
                  <th className="p-5 pr-8 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-sm font-medium text-foreground">
                {interviews.map((item) => {
                  const canEdit = isAdmin || item.createdBy === currentUser?.clerkId || item.assignedUserId === currentUser?.clerkId;
                  const canDelete = isAdmin || item.createdBy === currentUser?.clerkId;
                  return (
                    <tr key={item._id} className="hover:bg-background/40 transition-colors group">
                      <td className="p-5 pl-8">
                        <div className="font-bold text-foreground flex items-center gap-2">
                           <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs shrink-0">
                             {item.candidateName.substring(0,2).toUpperCase()}
                           </div>
                           <div>
                             <div className="group-hover:text-primary transition-colors">{item.candidateName}</div>
                             <div className="text-[11px] text-muted-foreground font-normal flex items-center gap-1 mt-0.5"><Mail className="h-3 w-3"/>{item.email || "No email"}</div>
                           </div>
                        </div>
                      </td>
                      <td className="p-5">
                        <div className="flex items-center gap-2 text-foreground font-semibold text-[13px]">
                          <Calendar className="h-4 w-4 text-primary shrink-0" />
                          <span>{new Date(item.interviewDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 text-[11px] text-muted-foreground font-mono">
                          <Clock className="h-3.5 w-3.5 shrink-0" />
                          <span>{item.startTime} - {item.endTime}</span>
                        </div>
                      </td>
                      <td className="p-5">
                        <span className={cn(
                          "px-3 py-1 rounded-md font-bold text-[10px] uppercase tracking-wider",
                          item.round.includes("Technical") && "bg-indigo-500/10 text-indigo-500",
                          item.round.includes("Design") && "bg-purple-500/10 text-purple-500",
                          item.round.includes("HR") && "bg-pink-500/10 text-pink-500",
                          !item.round.includes("Technical") && !item.round.includes("Design") && !item.round.includes("HR") && "bg-secondary text-foreground"
                        )}>
                          {item.round}
                        </span>
                      </td>
                      <td className="p-5">
                        <div className="font-semibold text-[13px]">{item.companyName || "N/A"}</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">{item.role || "Role unspecified"}</div>
                      </td>
                      <td className="p-5">
                        <div className="flex items-center gap-2.5">
                          {item.assignedUser?.imageUrl ? (
                            <img src={item.assignedUser.imageUrl} alt="interviewer" className="h-7 w-7 rounded-full object-cover shadow-sm" />
                          ) : (
                            <div className="h-7 w-7 rounded-full bg-secondary/80 flex items-center justify-center text-[10px] font-bold text-muted-foreground">UA</div>
                          )}
                          <span className="text-[13px]">{item.assignedUser?.name || "Unassigned"}</span>
                        </div>
                      </td>
                      <td className="p-5">
                        <span className={cn(
                          "px-3 py-1.5 rounded-full font-bold text-[10px] uppercase tracking-wider inline-flex items-center gap-1.5",
                          item.status === "scheduled" && "bg-blue-500/10 text-blue-500 border border-blue-500/20",
                          item.status === "completed" && "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20",
                          item.status === "cancelled" && "bg-slate-500/10 text-slate-500 border border-slate-500/20",
                          item.status === "passed" && "bg-green-500/10 text-green-500 border border-green-500/20 ring-2 ring-green-500/10",
                          item.status === "failed" && "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                        )}>
                          <span className={cn("h-1.5 w-1.5 rounded-full", item.status === "scheduled" ? "bg-blue-500 animate-pulse" : item.status === "completed" ? "bg-emerald-500" : item.status === "passed" ? "bg-green-500" : item.status === "failed" ? "bg-rose-500" : "bg-slate-500")} />
                          {item.status}
                        </span>
                      </td>
                      <td className="p-5 pr-8 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {canEdit && item.status !== "cancelled" && (
                            <div className="flex items-center gap-1 bg-background/50 border border-border/40 p-1 rounded-xl mr-2 shadow-sm">
                              <button onClick={() => handleUpdateStatus(item._id, "passed")} className="p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-500/10 transition-colors" title="Mark Passed"><UserCheck className="h-4 w-4" /></button>
                              <button onClick={() => handleUpdateStatus(item._id, "failed")} className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors" title="Mark Failed"><UserX className="h-4 w-4" /></button>
                            </div>
                          )}
                          {canEdit && (
                            <button onClick={() => handleOpenEditModal(item._id)} className="p-2.5 rounded-xl border border-border/50 bg-background/50 text-foreground hover:bg-secondary transition-all shadow-sm active:scale-95" title="Edit"><Edit2 className="h-4 w-4 text-primary" /></button>
                          )}
                          {canDelete && (
                            <button onClick={() => handleDelete(item._id)} className="p-2.5 rounded-xl border border-border/50 bg-background/50 text-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-all shadow-sm active:scale-95" title="Delete"><Trash2 className="h-4 w-4" /></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {interviews.map((item) => {
               const canEdit = isAdmin || item.createdBy === currentUser?.clerkId || item.assignedUserId === currentUser?.clerkId;
               return (
                 <div key={item._id} className="p-5 rounded-[20px] border border-border/50 glass hover:shadow-lg transition-all group relative flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                         <div className="flex items-center gap-3">
                           <div className="h-10 w-10 rounded-full bg-gradient-indigo text-white flex items-center justify-center font-bold text-sm shadow-md">{item.candidateName.substring(0,2).toUpperCase()}</div>
                           <div>
                             <h4 className="font-bold text-[15px] leading-tight text-foreground">{item.candidateName}</h4>
                             <span className="text-[11px] font-medium text-muted-foreground">{item.companyName || "No Company"}</span>
                           </div>
                         </div>
                         <button className="p-2 rounded-full hover:bg-secondary/80 text-muted-foreground transition-colors"><MoreVertical className="h-4 w-4" /></button>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-foreground bg-background/50 p-2 rounded-xl border border-border/40 shadow-inner">
                          <Calendar className="h-4 w-4 text-primary shrink-0" />
                          <span className="font-semibold">{new Date(item.interviewDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                          <span className="text-muted-foreground mx-1">•</span>
                          <span className="font-mono text-xs text-muted-foreground">{item.startTime}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                          <Briefcase className="h-3.5 w-3.5" />
                          {item.role || "Role unspecified"}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-5 pt-4 border-t border-border/40 flex items-center justify-between">
                       <span className={cn("px-3 py-1.5 rounded-full font-bold text-[10px] uppercase tracking-wider", item.status === "scheduled" && "bg-blue-500/10 text-blue-500", item.status === "passed" && "bg-emerald-500/10 text-emerald-500")}>
                         {item.status}
                       </span>
                       {canEdit && (
                          <button onClick={() => handleOpenEditModal(item._id)} className="h-8 w-8 rounded-full bg-secondary/80 hover:bg-primary hover:text-white flex items-center justify-center transition-colors shadow-sm">
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                       )}
                    </div>
                 </div>
               )
            })}
          </div>
        )}
      </div>

      {paginatedResult && interviews.length > 0 && (
        <div className="flex items-center justify-between p-5 rounded-[20px] border border-border/40 bg-card/40 glass shadow-sm mt-8">
          <span className="text-sm text-muted-foreground font-medium">
            Displaying <span className="font-bold text-foreground">{interviews.length}</span> results
          </span>
          {hasMore ? (
            <button
              onClick={() => setNumResults(numResults + ITEMS_PER_PAGE)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border/50 bg-background/50 hover:bg-secondary text-foreground text-sm font-bold transition-all shadow-sm active:scale-95"
            >
              <span>Load More</span>
              <ChevronDown className="h-4.5 w-4.5" />
            </button>
          ) : (
            <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">End of Results</span>
          )}
        </div>
      )}

      <InterviewFormModal isOpen={isOpenForm} onClose={() => setIsOpenForm(false)} interviewId={selectedInterviewId} />
      <DatePickerModal isOpen={showMobileCalendar} onClose={() => setShowMobileCalendar(false)} onSelectDate={(isoDate) => setSelectedDate(isoDate)} selectedDate={selectedDate} title="Select Date" />
    </div>
  );
}
