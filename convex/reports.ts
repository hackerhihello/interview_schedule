import { query, internalQuery, mutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

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

    if (!user) {
      throw new Error("Unauthorized");
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

export const getMonthlyData = internalQuery({
  args: {},
  handler: async (ctx) => {
    // Get interviews from the last month
    const now = new Date();
    const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
    const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999).getTime();
    
    const interviews = await ctx.db.query("interviews").collect();
    
    const filtered = interviews.filter((i) => {
      const date = new Date(i.interviewDate).getTime();
      return date >= firstDayLastMonth && date <= lastDayLastMonth;
    });

    const total = filtered.length;
    const completed = filtered.filter(i => i.status === "completed" || i.status === "passed" || i.status === "failed").length;
    const passed = filtered.filter(i => i.status === "passed").length;
    const failed = filtered.filter(i => i.status === "failed").length;
    const successRate = completed > 0 ? Math.round((passed / completed) * 100) : 0;

    const monthName = new Date(firstDayLastMonth).toLocaleString('default', { month: 'long' });
    const year = new Date(firstDayLastMonth).getFullYear();

    return {
      total, completed, passed, failed, successRate,
      monthName,
      year
    };
  }
});

export const getSettings = query({
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.db.query("reportSettings").first();
    return settings || { emailTo: "", whatsappTo: "" };
  }
});

export const saveSettings = mutation({
  args: {
    emailTo: v.optional(v.string()),
    whatsappTo: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("reportSettings").first();
    if (existing) {
      await ctx.db.patch(existing._id, {
        emailTo: args.emailTo,
        whatsappTo: args.whatsappTo,
      });
    } else {
      await ctx.db.insert("reportSettings", {
        emailTo: args.emailTo,
        whatsappTo: args.whatsappTo,
      });
    }
  }
});


