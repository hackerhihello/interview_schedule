import { query } from "./_generated/server";
import { v } from "convex/values";

export const getReportData = query({
  args: { clerkId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const clerkId = args.clerkId;
    if (!clerkId) {
      throw new Error("Unauthorized");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();

    if (!user || user.role !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }

    const interviews = await ctx.db.query("interviews").collect();
    const users = await ctx.db.query("users").collect();

    // Attach interviewer details to each interview
    const detailedInterviews = interviews.map((interview) => {
      const interviewer = users.find(u => u.clerkId === interview.assignedUserId);
      return {
        ...interview,
        interviewerName: interviewer?.name || "Unassigned",
        interviewerEmail: interviewer?.email || "",
      };
    });

    return {
      interviews: detailedInterviews,
      users,
    };
  },
});
