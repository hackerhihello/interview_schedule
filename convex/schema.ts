import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    name: v.string(),
    email: v.string(),
    role: v.union(v.literal("admin"), v.literal("user")),
    status: v.optional(v.union(v.literal("approved"), v.literal("pending"), v.literal("suspended"))),
    imageUrl: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_clerkId", ["clerkId"]),

  interviews: defineTable({
    candidateName: v.string(),
    startTime: v.string(),
    endTime: v.string(),
    round: v.string(),
    interviewDate: v.number(), // timestamp representing the date (00:00:00 of that day)
    companyName: v.optional(v.string()),
    role: v.optional(v.string()),
    subject: v.optional(v.string()),
    email: v.optional(v.string()),
    status: v.union(
      v.literal("scheduled"),
      v.literal("completed"),
      v.literal("cancelled"),
      v.literal("passed"),
      v.literal("failed")
    ),
    createdBy: v.string(), // ClerkId of the creator
    assignedUserId: v.optional(v.string()), // ClerkId of the assigned user/interviewer
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_assignedUserId", ["assignedUserId"])
    .index("by_date", ["interviewDate"])
    .index("by_round", ["round"])
    .index("by_createdAt", ["createdAt"]),

  activityLogs: defineTable({
    userId: v.string(), // ClerkId
    userName: v.string(),
    action: v.string(), // "create" | "update" | "delete" | "role_change"
    details: v.string(),
    timestamp: v.number(),
  })
    .index("by_timestamp", ["timestamp"]),
});
