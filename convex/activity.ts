import { query } from "./_generated/server";
import { getCurrentUser } from "./users";
import { v } from "convex/values";

// Fetch all activity logs (Admin only)
export const getLogs = query({
  args: { clerkId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx, args.clerkId);
    if (!user || user.role !== "admin") {
      return [];
    }

    // Retrieve last 100 activity logs
    return await ctx.db
      .query("activityLogs")
      .order("desc")
      .take(100);
  },
});
