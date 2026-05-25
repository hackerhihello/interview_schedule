"use client";

import { useState } from "react";
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
} from "lucide-react";
import { InterviewFormModal } from "@/components/interview-form-modal";
import { cn } from "@/lib/utils";

const ITEMS_PER_PAGE = 8;

export default function InterviewsPage() {
  const [isOpenForm, setIsOpenForm] = useState(false);
  const [selectedInterviewId, setSelectedInterviewId] = useState<string | undefined>(undefined);
  
  // Search & Filters State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRound, setSelectedRound] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedInterviewer, setSelectedInterviewer] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  // Pagination cursor state
  const [numResults, setNumResults] = useState(ITEMS_PER_PAGE);

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

  // Date timestamp converter
  const dateTimestamp = selectedDate
    ? new Date(selectedDate).getTime()
    : undefined;

  // Fetch paginated results from Convex
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

  // Query ALL interviews (for CSV export backup)
  const allInterviews = useQuery(
    api.interviews.getAll,
    user ? { clerkId: user.id } : "skip"
  ) || [];

  const interviews = paginatedResult?.page || [];
  const hasMore = paginatedResult ? !paginatedResult.isDone : false;

  // Actions
  const handleOpenCreateModal = () => {
    setSelectedInterviewId(undefined);
    setIsOpenForm(true);
  };

  const handleOpenEditModal = (id: string) => {
    setSelectedInterviewId(id);
    setIsOpenForm(true);
  };

  const handleDelete = async (id: Id<"interviews">) => {
    if (!window.confirm("Are you absolutely sure you want to delete this interview schedule?")) {
      return;
    }
    try {
      await deleteInterview({ id, clerkId: user?.id });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete schedule";
      alert(message);
    }
  };

  const handleUpdateStatus = async (
    id: Id<"interviews">,
    status: "scheduled" | "completed" | "cancelled" | "passed" | "failed"
  ) => {
    try {
      await updateInterview({
        id,
        status,
        clerkId: user?.id,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update status";
      alert(message);
    }
  };

  // CSV Export utility
  const handleExportCSV = () => {
    if (allInterviews.length === 0) return;

    const headers = [
      "Candidate Name",
      "Email",
      "Round",
      "Date",
      "Start Time",
      "End Time",
      "Company",
      "Role",
      "Subject",
      "Status",
      "Assigned Interviewer",
    ];

    const rows = allInterviews.map((i) => [
      i.candidateName,
      i.email || "",
      i.round,
      new Date(i.interviewDate).toLocaleDateString(),
      i.startTime,
      i.endTime,
      i.companyName || "",
      i.role || "",
      i.subject || "",
      i.status,
      i.assignedUser?.name || "Unassigned",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.map(val => `"${val.replace(/"/g, '""')}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `interviews_export_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const roundsList = [
    "Technical Round",
    "System Design Round",
    "HR Round",
    "Client Round",
    "Managerial Round",
    "Coding Assessment",
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Interview Slots Registry</h2>
          <p className="text-sm text-muted-foreground">
            Search, sort, filter, and modify candidate assessment allocations
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            disabled={allInterviews.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card text-foreground font-semibold text-xs transition-all hover:bg-secondary/40 active:scale-98 disabled:opacity-50"
          >
            <Download className="h-4 w-4 text-muted-foreground" />
            <span>Export CSV</span>
          </button>

          {user && (
            <button
              onClick={handleOpenCreateModal}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-indigo-600 text-white font-semibold text-xs shadow-md shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-98"
            >
              <Plus className="h-4 w-4" />
              <span>Add Schedule</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters Dashboard Panel */}
      <div className="p-5 rounded-2xl border border-border bg-card/25 backdrop-blur-sm space-y-4">
        <div className="flex items-center gap-2 pb-1 border-b border-border/40">
          <Filter className="h-4 w-4 text-primary" />
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Search Filters</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* Candidate / Metadata Search */}
          <div className="relative">
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search candidate, role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          {/* Round Category */}
          <select
            value={selectedRound}
            onChange={(e) => setSelectedRound(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          >
            <option value="">-- All Rounds --</option>
            {roundsList.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          {/* Status Selection */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          >
            <option value="">-- All Statuses --</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="passed">Outcome: Passed</option>
            <option value="failed">Outcome: Failed</option>
          </select>

          {/* Interviewer Selector */}
          <select
            value={selectedInterviewer}
            onChange={(e) => setSelectedInterviewer(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          >
            <option value="">-- All Interviewers --</option>
            {allUsers.map((u) => (
              <option key={u.clerkId} value={u.clerkId}>
                {u.name}
              </option>
            ))}
          </select>

          {/* Date Picker */}
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>

        {/* Clear Filters indicator */}
        {(searchTerm || selectedRound || selectedStatus || selectedInterviewer || selectedDate) && (
          <div className="flex justify-end pt-1">
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedRound("");
                setSelectedStatus("");
                setSelectedInterviewer("");
                setSelectedDate("");
              }}
              className="text-[10px] font-bold tracking-wider uppercase text-destructive hover:underline"
            >
              Reset Search Parameters
            </button>
          </div>
        )}
      </div>

      {/* Main Table Interface */}
      <div className="overflow-x-auto rounded-2xl border border-border bg-card/25 backdrop-blur-sm shadow-md">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="border-b border-border bg-secondary/15 text-xs font-bold text-muted-foreground uppercase tracking-wider">
              <th className="p-4 pl-6">Candidate Details</th>
              <th className="p-4">Schedule Date & Timing</th>
              <th className="p-4">Round Profile</th>
              <th className="p-4">Company Details</th>
              <th className="p-4">Interviewer</th>
              <th className="p-4">Status</th>
              <th className="p-4 pr-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60 text-xs font-medium text-foreground">
            {!paginatedResult ? (
              // Loading Skeleton
              [1, 2, 3].map((i) => (
                <tr key={i} className="animate-pulse">
                  <td className="p-4 pl-6"><div className="h-8 w-24 bg-secondary rounded" /></td>
                  <td className="p-4"><div className="h-4 w-32 bg-secondary rounded" /></td>
                  <td className="p-4"><div className="h-6 w-20 bg-secondary rounded-full" /></td>
                  <td className="p-4"><div className="h-4 w-28 bg-secondary rounded" /></td>
                  <td className="p-4"><div className="h-6 w-24 bg-secondary rounded-lg" /></td>
                  <td className="p-4"><div className="h-6 w-16 bg-secondary rounded-full" /></td>
                  <td className="p-4 pr-6 text-right"><div className="h-8 w-12 bg-secondary rounded ml-auto" /></td>
                </tr>
              ))
            ) : interviews.length > 0 ? (
              interviews.map((item) => {
                const canEdit = isAdmin || item.createdBy === currentUser?.clerkId;
                const canDelete = isAdmin || item.createdBy === currentUser?.clerkId;
                
                return (
                  <tr
                    key={item._id}
                    className="hover:bg-secondary/20 transition-all duration-200"
                  >
                    {/* Candidate Name & Email */}
                    <td className="p-4 pl-6">
                      <div className="font-bold text-sm text-foreground">{item.candidateName}</div>
                      <div className="text-[10px] text-muted-foreground font-mono mt-0.5">{item.email || "No email provided"}</div>
                    </td>

                    {/* Date and Hours */}
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-foreground font-bold">
                        <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span>{new Date(item.interviewDate).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                      <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground font-mono">
                        <Clock className="h-3.5 w-3.5 shrink-0" />
                        <span>{item.startTime} - {item.endTime}</span>
                      </div>
                    </td>

                    {/* Round Badge */}
                    <td className="p-4">
                      <span className={cn(
                        "px-2.5 py-1 rounded-full font-bold text-[10px] uppercase tracking-wide",
                        item.round.includes("Technical") && "bg-indigo-500/10 text-indigo-500 border border-indigo-500/15",
                        item.round.includes("Design") && "bg-purple-500/10 text-purple-500 border border-purple-500/15",
                        item.round.includes("HR") && "bg-pink-500/10 text-pink-500 border border-pink-500/15",
                        item.round.includes("Client") && "bg-amber-500/10 text-amber-500 border border-amber-500/15",
                        !item.round.includes("Technical") && !item.round.includes("Design") && !item.round.includes("HR") && !item.round.includes("Client") && "bg-cyan-500/10 text-cyan-500 border border-cyan-500/15"
                      )}>
                        {item.round}
                      </span>
                    </td>

                    {/* Company and Job Title */}
                    <td className="p-4">
                      <div className="flex items-center gap-1.5">
                        <Briefcase className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="font-semibold">{item.companyName || "N/A"}</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{item.role || "Role unspecified"}</div>
                    </td>

                    {/* Interviewer Avatar */}
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {item.assignedUser?.imageUrl ? (
                          <img
                            src={item.assignedUser.imageUrl}
                            alt={item.assignedUser.name}
                            className="h-6 w-6 rounded-full object-cover ring-1 ring-primary/10"
                          />
                        ) : (
                          <div className="h-6 w-6 rounded-full bg-secondary/80 flex items-center justify-center text-[9px] font-bold text-muted-foreground">
                            UA
                          </div>
                        )}
                        <span className="text-xs truncate max-w-[100px]">{item.assignedUser?.name || "Unassigned"}</span>
                      </div>
                    </td>

                    {/* Outcome Status Badge */}
                    <td className="p-4">
                      <span className={cn(
                        "px-2.5 py-1 rounded-full font-bold text-[10px] uppercase tracking-wider inline-flex items-center gap-1",
                        item.status === "scheduled" && "bg-blue-500/10 text-blue-500 border border-blue-500/15",
                        item.status === "completed" && "bg-emerald-500/10 text-emerald-500 border border-emerald-500/15",
                        item.status === "cancelled" && "bg-slate-500/10 text-slate-500 border border-slate-500/15",
                        item.status === "passed" && "bg-green-500/10 text-green-500 border border-green-500/15 ring-1 ring-green-500/10",
                        item.status === "failed" && "bg-rose-500/10 text-rose-500 border border-rose-500/15"
                      )}>
                        <span className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          item.status === "scheduled" && "bg-blue-500 animate-pulse",
                          item.status === "completed" && "bg-emerald-500",
                          item.status === "cancelled" && "bg-slate-500",
                          item.status === "passed" && "bg-green-500",
                          item.status === "failed" && "bg-rose-500"
                        )} />
                        <span>{item.status}</span>
                      </span>
                    </td>

                    {/* Actions Menu */}
                    <td className="p-4 pr-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Quick Outcome Promoters (For editors) */}
                        {canEdit && item.status === "scheduled" && (
                          <div className="hidden lg:flex items-center gap-1 bg-secondary/35 border border-border p-0.5 rounded-lg mr-1.5">
                            <button
                              onClick={() => handleUpdateStatus(item._id, "passed")}
                              className="p-1 rounded text-emerald-500 hover:bg-emerald-500/15 transition-all"
                              title="Mark Passed"
                            >
                              <UserCheck className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(item._id, "failed")}
                              className="p-1 rounded text-rose-500 hover:bg-rose-500/15 transition-all"
                              title="Mark Failed"
                            >
                              <UserX className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}

                        {/* Classic Edit / Delete controls */}
                        {canEdit && (
                          <button
                            onClick={() => handleOpenEditModal(item._id)}
                            className="p-2.5 rounded-xl border border-border bg-card text-foreground hover:bg-secondary transition-all hover:scale-105 active:scale-95"
                            title="Edit Details"
                          >
                            <Edit2 className="h-3.5 w-3.5 text-primary" />
                          </button>
                        )}

                        {canDelete && (
                          <button
                            onClick={() => handleDelete(item._id)}
                            className="p-2.5 rounded-xl border border-border bg-card text-foreground hover:bg-destructive/10 hover:border-destructive/30 hover:text-destructive transition-all hover:scale-105 active:scale-95"
                            title="Delete Schedule"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}

                        {!canEdit && (
                          <span className="text-[10px] text-muted-foreground italic px-2 py-1 bg-secondary/20 rounded">
                            Locked
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              // Empty State
              <tr>
                <td colSpan={7} className="p-16 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center space-y-3.5 max-w-sm mx-auto">
                    <div className="h-12 w-12 rounded-2xl bg-secondary/40 border border-border flex items-center justify-center text-muted-foreground animate-bounce">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground text-sm">No scheduled slots discovered</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                        Try modifying search keyword parameters, selection scopes, or create new listings as an administrator.
                      </p>
                    </div>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination controls */}
      {paginatedResult && interviews.length > 0 && (
        <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card/25">
          <span className="text-xs text-muted-foreground">
            Displaying <span className="font-bold text-foreground">{interviews.length}</span> schedules
          </span>

          {hasMore && (
            <button
              onClick={() => setNumResults(numResults + ITEMS_PER_PAGE)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border bg-card hover:bg-secondary/40 text-foreground text-xs font-semibold transition-all active:scale-98"
            >
              <span>Load More Items</span>
              <ChevronDown className="h-4 w-4" />
            </button>
          )}

          {!hasMore && interviews.length >= ITEMS_PER_PAGE && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              End of schedule database
            </span>
          )}
        </div>
      )}

      {/* Form Slider Modal */}
      <InterviewFormModal
        isOpen={isOpenForm}
        onClose={() => setIsOpenForm(false)}
        interviewId={selectedInterviewId}
      />
    </div>
  );
}
