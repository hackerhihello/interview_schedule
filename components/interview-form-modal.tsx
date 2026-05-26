"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  X,
  Loader2,
  Calendar,
  Clock,
  User,
  Mail,
  Briefcase,
  Layers,
  BookOpen,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Form Validation Schema using Zod
const interviewFormSchema = z.object({
  candidateName: z.string().min(2, "Candidate name must be at least 2 characters"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  round: z.string().min(1, "Interview round is required"),
  interviewDate: z.string().min(1, "Interview date is required"), // "YYYY-MM-DD"
  companyName: z.string().optional(),
  role: z.string().optional(),
  subject: z.string().optional(),
  email: z.string().email("Please enter a valid email address").optional().or(z.literal("")),
  assignedUserId: z.string().optional(),
});

type InterviewFormValues = z.infer<typeof interviewFormSchema>;

interface InterviewFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  interviewId?: string; // If provided, we are in Edit Mode
  onSuccess?: () => void;
  defaultDate?: string; // e.g. "YYYY-MM-DD"
}

export function InterviewFormModal({
  isOpen,
  onClose,
  interviewId,
  onSuccess,
  defaultDate,
}: InterviewFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Mutations & Queries
  const { user } = useUser();
  const createInterview = useMutation(api.interviews.create);
  const updateInterview = useMutation(api.interviews.update);
  const currentUser = useQuery(
    api.users.currentUser,
    user ? { clerkId: user.id } : "skip"
  );
  
  const isAdmin = currentUser?.role === "admin";
  const allUsers = useQuery(
    api.users.getUsers,
    currentUser && isAdmin ? { clerkId: user?.id } : "skip"
  ) || [];

  // If in edit mode, fetch the existing interview details
  const allInterviews = useQuery(
    api.interviews.getAll,
    user ? { clerkId: user.id } : "skip"
  ) || [];
  const existingInterview = interviewId
    ? allInterviews.find((i) => i._id === interviewId)
    : null;

  // Determine if the current user has permission to edit this interview slot
  const isCreator = existingInterview ? existingInterview.createdBy === currentUser?.clerkId : false;
  const isAssignee = existingInterview ? existingInterview.assignedUserId === currentUser?.clerkId : false;
  const canEdit = !interviewId || isAdmin || isCreator || isAssignee;

  // React Hook Form initialization
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InterviewFormValues>({
    resolver: zodResolver(interviewFormSchema),
    defaultValues: {
      candidateName: "",
      startTime: "",
      endTime: "",
      round: "",
      interviewDate: "",
      companyName: "",
      role: "",
      subject: "",
      email: "",
      assignedUserId: "",
    },
  });

  // Populate form if in edit mode
  useEffect(() => {
    if (existingInterview) {
      // Convert timestamp to YYYY-MM-DD
      const date = new Date(existingInterview.interviewDate);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const formattedDate = `${year}-${month}-${day}`;

      reset({
        candidateName: existingInterview.candidateName,
        startTime: existingInterview.startTime,
        endTime: existingInterview.endTime,
        round: existingInterview.round,
        interviewDate: formattedDate,
        companyName: existingInterview.companyName || "",
        role: existingInterview.role || "",
        subject: existingInterview.subject || "",
        email: existingInterview.email || "",
        assignedUserId: existingInterview.assignedUserId || "",
      });
    } else {
      // Clear form for creation
      reset({
        candidateName: "",
        startTime: "",
        endTime: "",
        round: "Technical Round",
        interviewDate: defaultDate || "",
        companyName: "",
        role: "",
        subject: "",
        email: "",
        assignedUserId: "",
      });
    }
  }, [existingInterview, reset, isOpen, defaultDate]);

  if (!isOpen) return null;

  const onSubmit = async (data: InterviewFormValues) => {
    if (!canEdit) return; // Prevent submission in read-only mode

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      // Convert date string YYYY-MM-DD to a timestamp at midnight
      const [year, month, day] = data.interviewDate.split("-").map(Number);
      const dateObj = new Date(year, month - 1, day);
      const timestamp = dateObj.getTime();

      const payload = {
        candidateName: data.candidateName,
        startTime: data.startTime,
        endTime: data.endTime,
        round: data.round,
        interviewDate: timestamp,
        companyName: data.companyName || undefined,
        role: data.role || undefined,
        subject: data.subject || undefined,
        email: data.email || undefined,
        assignedUserId: data.assignedUserId || undefined,
        clerkId: user?.id,
      };

      if (interviewId) {
        // Edit Mode
        await updateInterview({
          id: interviewId as Id<"interviews">,
          ...payload,
        });
      } else {
        // Creation Mode
        await createInterview(payload);
      }

      reset();
      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error(err);
      const message =
        err instanceof Error
          ? err.message
          : "Failed to save the interview slot. Please try again.";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const roundsOptions = [
    "Technical Round",
    "System Design Round",
    "HR Round",
    "Client Round",
    "Managerial Round",
    "Coding Assessment",
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-background/80 backdrop-blur-sm animate-fade-in">
      {/* Click outside to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Slideout Panel */}
      <div className="relative w-full max-w-md h-full bg-card border-l border-border shadow-2xl flex flex-col justify-between overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border bg-secondary/10">
          <div>
            <h3 className="text-lg font-bold text-foreground">
              {interviewId ? (canEdit ? "Modify Interview Details" : "View Interview Details") : "Schedule New Interview"}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {interviewId ? (canEdit ? "Update interview details and slot parameters" : "This interview slot is managed by another coordinator.") : "Create a new calendar listing for candidates"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-foreground transition-all hover:rotate-90"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form
          id="interview-form"
          onSubmit={handleSubmit(onSubmit)}
          className="flex-1 overflow-y-auto p-6 space-y-5"
        >
          {errorMessage && (
            <div className="p-3.5 rounded-xl border border-destructive/20 bg-destructive/10 text-destructive text-sm font-medium animate-pulse">
              {errorMessage}
            </div>
          )}

          {/* Candidate Name (Required) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" />
              Candidate Name <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Rahul Kumar"
              disabled={!canEdit}
              {...register("candidateName")}
              className={cn(
                "w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all",
                errors.candidateName && "border-destructive focus:ring-destructive/20"
              )}
            />
            {errors.candidateName && (
              <p className="text-xs text-destructive mt-0.5">{errors.candidateName.message}</p>
            )}
          </div>

          {/* Interview Date & Round */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Date <span className="text-destructive">*</span>
              </label>
              <input
                type="date"
                disabled={!canEdit}
                {...register("interviewDate")}
                className={cn(
                  "w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all",
                  errors.interviewDate && "border-destructive focus:ring-destructive/20"
                )}
              />
              {errors.interviewDate && (
                <p className="text-xs text-destructive mt-0.5">{errors.interviewDate.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5" />
                Round <span className="text-destructive">*</span>
              </label>
              <select
                disabled={!canEdit}
                {...register("round")}
                className={cn(
                  "w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all",
                  errors.round && "border-destructive focus:ring-destructive/20"
                )}
              >
                {roundsOptions.map((round) => (
                  <option key={round} value={round}>
                    {round}
                  </option>
                ))}
              </select>
              {errors.round && (
                <p className="text-xs text-destructive mt-0.5">{errors.round.message}</p>
              )}
            </div>
          </div>

          {/* Start Time & End Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                Start Time <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. 10:00 AM"
                disabled={!canEdit}
                {...register("startTime")}
                className={cn(
                  "w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all",
                  errors.startTime && "border-destructive focus:ring-destructive/20"
                )}
              />
              {errors.startTime && (
                <p className="text-xs text-destructive mt-0.5">{errors.startTime.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                End Time <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. 11:00 AM"
                disabled={!canEdit}
                {...register("endTime")}
                className={cn(
                  "w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all",
                  errors.endTime && "border-destructive focus:ring-destructive/20"
                )}
              />
              {errors.endTime && (
                <p className="text-xs text-destructive mt-0.5">{errors.endTime.message}</p>
              )}
            </div>
          </div>

          <div className="border-t border-border/60 my-4" />

          {/* Optional Fields Section Header */}
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
            Optional Metadata
          </span>

          {/* Company Name & Role */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <Briefcase className="h-3.5 w-3.5" />
                Company
              </label>
              <input
                type="text"
                placeholder="Google"
                disabled={!canEdit}
                {...register("companyName")}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <Briefcase className="h-3.5 w-3.5" />
                Role Profile
              </label>
              <input
                type="text"
                placeholder="React Engineer"
                disabled={!canEdit}
                {...register("role")}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
          </div>

          {/* Subject & Candidate Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5" />
              Interview Subject
            </label>
            <input
              type="text"
              placeholder="e.g. Frontend system architecture debate"
              disabled={!canEdit}
              {...register("subject")}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" />
              Candidate Email
            </label>
            <input
              type="email"
              placeholder="candidate@domain.com"
              disabled={!canEdit}
              {...register("email")}
              className={cn(
                "w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all",
                errors.email && "border-destructive focus:ring-destructive/20"
              )}
            />
            {errors.email && (
              <p className="text-xs text-destructive mt-0.5">{errors.email.message}</p>
            )}
          </div>

          {/* Assigned Interviewer (Admins Only) */}
          {isAdmin ? (
            <div className="space-y-1.5 animate-fade-in">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                Assign Interviewer (Interviewer)
              </label>
              <select
                {...register("assignedUserId")}
                disabled={!canEdit}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              >
                <option value="">-- Unassigned --</option>
                {allUsers.map((u) => (
                  <option key={u.clerkId} value={u.clerkId}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            // Hidden input to preserve assignedUserId for normal users editing their entry
            existingInterview?.assignedUserId && (
              <input type="hidden" {...register("assignedUserId")} />
            )
          )}
        </form>

        {/* Footer Actions */}
        <div className="p-6 border-t border-border bg-secondary/15 flex items-center gap-3">
          {!canEdit ? (
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-primary to-indigo-600 text-white font-semibold text-sm transition-all shadow-md shadow-primary/20 hover:shadow-primary/30 flex items-center justify-center gap-2 active:scale-98"
            >
              <span>Close Details (Read-only)</span>
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3.5 rounded-xl border border-border bg-card text-foreground font-semibold text-sm transition-all hover:bg-secondary/40 active:scale-98"
              >
                Cancel
              </button>
              
              <button
                type="submit"
                form="interview-form"
                disabled={isSubmitting}
                className="flex-[2] py-3.5 rounded-xl bg-gradient-to-r from-primary to-indigo-600 text-white font-semibold text-sm transition-all shadow-md shadow-primary/20 hover:shadow-primary/30 flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    <span>{interviewId ? "Save Changes" : "Create Schedule"}</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
