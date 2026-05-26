import { ConvexError, v } from "convex/values";
import { mutation, query, MutationCtx, QueryCtx } from "./_generated/server";
import { getCurrentUser, assertAdmin } from "./users";
import { paginationOptsValidator } from "convex/server";
import { Doc } from "./_generated/dataModel";

// Helper to batch fetch and attach user details to interviews
async function attachUsersToInterviews(ctx: QueryCtx, interviews: Doc<"interviews">[]) {
  if (interviews.length === 0) return [];

  // Extract unique clerkIds of creators and assignees
  const clerkIds = new Set<string>();
  interviews.forEach((interview) => {
    if (interview.createdBy) clerkIds.add(interview.createdBy);
    if (interview.assignedUserId) clerkIds.add(interview.assignedUserId);
  });

  // Batch fetch users
  const userPromises = Array.from(clerkIds).map((clerkId) =>
    ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .unique()
  );
  
  const users = await Promise.all(userPromises);
  const userMap = new Map<
    string,
    {
      id: string;
      name: string;
      email: string;
      imageUrl?: string;
      role: "admin" | "user";
    }
  >();
  users.forEach((user) => {
    if (user) {
      userMap.set(user.clerkId, {
        id: user._id,
        name: user.name,
        email: user.email,
        imageUrl: user.imageUrl,
        role: user.role,
      });
    }
  });

  return interviews.map((interview) => ({
    ...interview,
    creator: userMap.get(interview.createdBy) || null,
    assignedUser: interview.assignedUserId ? (userMap.get(interview.assignedUserId) || null) : null,
  }));
}

// Helper to parse time string (e.g. "10:30 AM") to minutes from midnight
function parseTimeToMinutes(timeStr: string): number {
  const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return 0;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3].toUpperCase();
  
  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;
  
  return hours * 60 + minutes;
}

// Create interview (Authenticated & Approved users)
export const create = mutation({
  args: {
    candidateName: v.string(),
    startTime: v.string(),
    endTime: v.string(),
    round: v.string(),
    interviewDate: v.number(), // Date timestamp (00:00:00 of that day)
    companyName: v.optional(v.string()),
    role: v.optional(v.string()),
    subject: v.optional(v.string()),
    email: v.optional(v.string()),
    assignedUserId: v.optional(v.string()), // clerkId of the assigned user
    clerkId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx, args.clerkId);
    if (!user) {
      throw new ConvexError("Unauthorized: Please sign in.");
    }

    const isApproved = user.status === "approved" || !user.status;
    if (!isApproved) {
      throw new ConvexError("Unauthorized: Your account access is pending approval.");
    }

    // Validate overlapping interviews on the same day
    const sameDayInterviews = await ctx.db
      .query("interviews")
      .withIndex("by_date", (q) => q.eq("interviewDate", args.interviewDate))
      .collect();

    const newStart = parseTimeToMinutes(args.startTime);
    const newEnd = parseTimeToMinutes(args.endTime);

    if (newStart >= newEnd) {
      return { success: false, error: "Timing Conflict: End time must be strictly after start time." };
    }

    for (const item of sameDayInterviews) {
      if (item.status === "cancelled") continue;

      const existingStart = parseTimeToMinutes(item.startTime);
      const existingEnd = parseTimeToMinutes(item.endTime);

      const overlap = Math.max(newStart, existingStart) < Math.min(newEnd, existingEnd);
      if (overlap) {
        return {
          success: false,
          error: `Timing Conflict: There is already an active interview scheduled for candidate "${item.candidateName}" on this date between ${item.startTime} and ${item.endTime}.`
        };
      }
    }

    const interviewId = await ctx.db.insert("interviews", {
      candidateName: args.candidateName,
      startTime: args.startTime,
      endTime: args.endTime,
      round: args.round,
      interviewDate: args.interviewDate,
      companyName: args.companyName,
      role: args.role,
      subject: args.subject,
      email: args.email,
      status: "scheduled",
      createdBy: user.clerkId,
      assignedUserId: args.assignedUserId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Write to Activity Logs
    await ctx.db.insert("activityLogs", {
      userId: user.clerkId,
      userName: user.name,
      action: "create",
      details: `Scheduled a "${args.round}" interview for candidate "${args.candidateName}" on ${new Date(args.interviewDate).toLocaleDateString()}`,
      timestamp: Date.now(),
    });

    return { success: true, id: interviewId };
  },
});

// Update interview (Admin can update all; Users can update ONLY their own assigned interviews)
export const update = mutation({
  args: {
    id: v.id("interviews"),
    candidateName: v.optional(v.string()),
    startTime: v.optional(v.string()),
    endTime: v.optional(v.string()),
    round: v.optional(v.string()),
    interviewDate: v.optional(v.number()),
    companyName: v.optional(v.string()),
    role: v.optional(v.string()),
    subject: v.optional(v.string()),
    email: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("scheduled"),
        v.literal("completed"),
        v.literal("cancelled"),
        v.literal("passed"),
        v.literal("failed")
      )
    ),
    assignedUserId: v.optional(v.string()),
    clerkId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx, args.clerkId);
    if (!user) {
      throw new ConvexError("Unauthorized: Please sign in.");
    }

    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new ConvexError("Interview not found.");
    }

    // Role-based Access Control (Admins, Creators, or Assignees can edit)
    const isAdmin = user.role === "admin";
    const isCreator = existing.createdBy === user.clerkId;
    const isAssignee = existing.assignedUserId === user.clerkId;

    if (!isAdmin && !isCreator && !isAssignee) {
      throw new ConvexError("Unauthorized: You can only edit interviews you scheduled or are assigned to.");
    }

    // Validate overlapping interviews on the same day if date or times change
    const finalDate = args.interviewDate !== undefined ? args.interviewDate : existing.interviewDate;
    const finalStart = args.startTime !== undefined ? args.startTime : existing.startTime;
    const finalEnd = args.endTime !== undefined ? args.endTime : existing.endTime;

    if (
      args.interviewDate !== undefined ||
      args.startTime !== undefined ||
      args.endTime !== undefined
    ) {
      const sameDayInterviews = await ctx.db
        .query("interviews")
        .withIndex("by_date", (q) => q.eq("interviewDate", finalDate))
        .collect();

      const newStart = parseTimeToMinutes(finalStart);
      const newEnd = parseTimeToMinutes(finalEnd);

      if (newStart >= newEnd) {
        return { success: false, error: "Timing Conflict: End time must be strictly after start time." };
      }

      for (const item of sameDayInterviews) {
        if (item._id === args.id) continue; // Skip self
        if (item.status === "cancelled") continue;

        const existingStart = parseTimeToMinutes(item.startTime);
        const existingEnd = parseTimeToMinutes(item.endTime);

        const overlap = Math.max(newStart, existingStart) < Math.min(newEnd, existingEnd);
        if (overlap) {
          return {
            success: false,
            error: `Timing Conflict: There is already an active interview scheduled for candidate "${item.candidateName}" on this date between ${item.startTime} and ${item.endTime}.`
          };
        }
      }
    }

    // Prepare update parameters
    const updates: {
      updatedAt: number;
      candidateName?: string;
      startTime?: string;
      endTime?: string;
      round?: string;
      interviewDate?: number;
      companyName?: string;
      role?: string;
      subject?: string;
      email?: string;
      status?: "scheduled" | "completed" | "cancelled" | "passed" | "failed";
      assignedUserId?: string;
    } = {
      updatedAt: Date.now(),
    };

    if (args.candidateName !== undefined) updates.candidateName = args.candidateName;
    if (args.startTime !== undefined) updates.startTime = args.startTime;
    if (args.endTime !== undefined) updates.endTime = args.endTime;
    if (args.round !== undefined) updates.round = args.round;
    if (args.interviewDate !== undefined) updates.interviewDate = args.interviewDate;
    if (args.companyName !== undefined) updates.companyName = args.companyName;
    if (args.role !== undefined) updates.role = args.role;
    if (args.subject !== undefined) updates.subject = args.subject;
    if (args.email !== undefined) updates.email = args.email;
    if (args.status !== undefined) updates.status = args.status;

    // Only Admin can change the assignee
    if (args.assignedUserId !== undefined) {
      if (!isAdmin) {
        throw new Error("Unauthorized: Only admins can re-assign interviewers.");
      }
      updates.assignedUserId = args.assignedUserId;
    }

    await ctx.db.patch(args.id, updates);

    // Write to Activity Logs
    await ctx.db.insert("activityLogs", {
      userId: user.clerkId,
      userName: user.name,
      action: "update",
      details: `Updated interview for candidate "${updates.candidateName || existing.candidateName}"`,
      timestamp: Date.now(),
    });

    return { success: true, id: args.id };
  },
});

// Delete interview (Admin or Creator)
export const deleteInterview = mutation({
  args: {
    id: v.id("interviews"),
    clerkId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx, args.clerkId);
    if (!user) {
      throw new Error("Unauthorized: Please sign in.");
    }

    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Interview not found.");
    }

    const isAdmin = user.role === "admin";
    const isCreator = existing.createdBy === user.clerkId;

    if (!isAdmin && !isCreator) {
      throw new Error("Unauthorized: You can only delete interviews you scheduled yourself.");
    }

    await ctx.db.delete(args.id);

    // Write to Activity Logs
    await ctx.db.insert("activityLogs", {
      userId: user.clerkId,
      userName: user.name,
      action: "delete",
      details: `Deleted interview scheduled for candidate "${existing.candidateName}"`,
      timestamp: Date.now(),
    });

    return { success: true };
  },
});

// Paginated interviews query (with search & filters)
export const getPaginated = query({
  args: {
    paginationOpts: paginationOptsValidator,
    search: v.optional(v.string()),
    round: v.optional(v.string()),
    status: v.optional(v.string()),
    assignedUserId: v.optional(v.string()),
    dateFilter: v.optional(v.number()), // date timestamp
    clerkId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx, args.clerkId);
    if (!user) {
      return {
        page: [],
        isDone: true,
        continueCursor: "",
      };
    }

    // Perform queries & filter in-memory/in-handler for rich search capabilities
    const results = await ctx.db
      .query("interviews")
      .order("desc")
      .paginate(args.paginationOpts);

    // Transform page content to attach creator & assignee
    const enrichedPage = await attachUsersToInterviews(ctx, results.page);

    // Apply filtering on the enriched and fetched page
    let filteredPage = enrichedPage;

    if (args.search) {
      const lowerSearch = args.search.toLowerCase();
      filteredPage = filteredPage.filter(
        (item) =>
          item.candidateName.toLowerCase().includes(lowerSearch) ||
          item.companyName?.toLowerCase().includes(lowerSearch) ||
          item.role?.toLowerCase().includes(lowerSearch) ||
          item.subject?.toLowerCase().includes(lowerSearch) ||
          item.email?.toLowerCase().includes(lowerSearch)
      );
    }

    if (args.round) {
      filteredPage = filteredPage.filter((item) => item.round === args.round);
    }

    if (args.status) {
      filteredPage = filteredPage.filter((item) => item.status === args.status);
    }

    if (args.assignedUserId) {
      filteredPage = filteredPage.filter((item) => item.assignedUserId === args.assignedUserId);
    }

    if (args.dateFilter !== undefined) {
      filteredPage = filteredPage.filter((item) => item.interviewDate === args.dateFilter);
    }

    return {
      ...results,
      page: filteredPage,
    };
  },
});

// Get all interviews (for Calendar and CSV export)
export const getAll = query({
  args: {
    assignedUserId: v.optional(v.string()),
    clerkId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx, args.clerkId);
    if (!user) {
      return [];
    }

    const q = ctx.db.query("interviews").order("desc");
    const interviews = await q.collect();

    let filtered = interviews;
    if (args.assignedUserId) {
      // Filter by a specific interviewer if provided
      filtered = interviews.filter((i) => i.assignedUserId === args.assignedUserId);
    }

    return await attachUsersToInterviews(ctx, filtered);
  },
});

// Fetch Dashboard statistics (Admin gets system stats, User gets personal stats)
export const getStats = query({
  args: {
    clerkId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx, args.clerkId);
    if (!user) {
      return {
        stats: { total: 0, upcoming: 0, completed: 0, cancelled: 0, passed: 0, failed: 0 },
        charts: { roundData: [], statusData: [], timelineData: [] },
      };
    }

    const isAdmin = user.role === "admin";
    
    // Fetch all interviews (we can filter in code safely for dashboard aggregates)
    const allInterviews = await ctx.db.query("interviews").collect();
    
    // Filter based on role (admins see everything, users see assigned interviews)
    const relevantInterviews = isAdmin
      ? allInterviews
      : allInterviews.filter((i) => i.assignedUserId === user.clerkId);

    const now = Date.now();
    // Normalize today to start of day
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayTimestamp = todayStart.getTime();

    // Key counts
    const total = relevantInterviews.length;
    const upcoming = relevantInterviews.filter(
      (i) => i.status === "scheduled" && i.interviewDate >= todayTimestamp
    ).length;
    const completed = relevantInterviews.filter((i) => i.status === "completed").length;
    const cancelled = relevantInterviews.filter((i) => i.status === "cancelled").length;
    const passed = relevantInterviews.filter((i) => i.status === "passed").length;
    const failed = relevantInterviews.filter((i) => i.status === "failed").length;

    // Round breakdown
    const rounds: Record<string, number> = {};
    relevantInterviews.forEach((i) => {
      rounds[i.round] = (rounds[i.round] || 0) + 1;
    });
    const roundData = Object.entries(rounds).map(([name, value]) => ({
      name,
      value,
    }));

    // Status breakdown
    const statusData = [
      { name: "Scheduled", value: relevantInterviews.filter((i) => i.status === "scheduled").length },
      { name: "Completed", value: completed },
      { name: "Cancelled", value: cancelled },
      { name: "Passed", value: passed },
      { name: "Failed", value: failed },
    ].filter((s) => s.value > 0);

    // Load breakdown: Interviews grouped by Date (for the last 7 days + next 7 days, or simple timeline)
    // Let's create an elegant weekly chart of interview load
    const dateGroups: Record<string, number> = {};
    relevantInterviews.forEach((i) => {
      const dateStr = new Date(i.interviewDate).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
      dateGroups[dateStr] = (dateGroups[dateStr] || 0) + 1;
    });

    // Take top 7 days with interviews
    const timelineData = Object.entries(dateGroups)
      .map(([date, count]) => ({ date, count }))
      .slice(-7);

    return {
      stats: {
        total,
        upcoming,
        completed,
        cancelled,
        passed,
        failed,
      },
      charts: {
        roundData,
        statusData,
        timelineData,
      },
    };
  },
});
