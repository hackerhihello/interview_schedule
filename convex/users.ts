import { v } from "convex/values";
import { mutation, query, MutationCtx, QueryCtx } from "./_generated/server";

// Helper function to get authenticated user based on Clerk ID
export async function getCurrentUser(ctx: QueryCtx | MutationCtx, clerkId?: string) {
  const identity = await ctx.auth.getUserIdentity();
  const actualClerkId = identity?.subject || clerkId;
  
  if (!actualClerkId) {
    return null;
  }
  
  const user = await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q) => q.eq("clerkId", actualClerkId))
    .unique();
    
  return user;
}

// Helper to assert that a user is an admin
export async function assertAdmin(ctx: QueryCtx | MutationCtx, clerkId?: string) {
  const user = await getCurrentUser(ctx, clerkId);
  if (!user || user.role !== "admin") {
    throw new Error("Unauthorized: Admin privileges required.");
  }
  return user;
}

// Synchronize Clerk user information with Convex
export const syncUser = mutation({
  args: {
    clerkId: v.string(),
    name: v.string(),
    email: v.string(),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (existingUser) {
      const isTargetAdmin = args.email.toLowerCase() === "rahulbalbatti032@gmail.com";
      // Update details to keep in sync
      await ctx.db.patch(existingUser._id, {
        name: args.name,
        email: args.email,
        imageUrl: args.imageUrl,
        ...(isTargetAdmin ? { role: "admin" as const, status: "approved" as const } : {}),
      });
      return await ctx.db.get(existingUser._id);
    }

    // Determine role: if first user or email matches rahulbalbatti032@gmail.com, make admin, else user
    const allUsers = await ctx.db.query("users").take(1);
    const role =
      allUsers.length === 0 || args.email.toLowerCase() === "rahulbalbatti032@gmail.com"
        ? ("admin" as const)
        : ("user" as const);

    // All newly authenticated users are automatically approved to access the dashboard
    const status = "approved" as const;

    const newUserId = await ctx.db.insert("users", {
      clerkId: args.clerkId,
      name: args.name,
      email: args.email,
      role: role,
      status: status,
      imageUrl: args.imageUrl,
      createdAt: Date.now(),
    });

    // Log the user registration
    await ctx.db.insert("activityLogs", {
      userId: args.clerkId,
      userName: args.name,
      action: "register",
      details: `User registered with role: ${role}`,
      timestamp: Date.now(),
    });

    return await ctx.db.get(newUserId);
  },
});

// Fetch current authenticated user's Convex entry
export const currentUser = query({
  args: { clerkId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    return await getCurrentUser(ctx, args.clerkId);
  },
});

// Fetch all registered users (Admin only)
export const getUsers = query({
  args: { clerkId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx, args.clerkId);
    if (!user || user.role !== "admin") {
      return [];
    }
    return await ctx.db.query("users").order("desc").collect();
  },
});

// Fetch users who are pending access approval (Admin only)
export const getPendingUsers = query({
  args: { clerkId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx, args.clerkId);
    if (!user || user.role !== "admin") {
      return [];
    }
    return await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();
  },
});


// Update a user's role (Admin only)
export const updateRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.union(v.literal("admin"), v.literal("user")),
    clerkId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const adminUser = await assertAdmin(ctx, args.clerkId);
    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser) {
      throw new Error("Target user not found");
    }

    // Prevent demoting oneself
    if (targetUser.clerkId === adminUser.clerkId) {
      throw new Error("You cannot change your own role!");
    }

    await ctx.db.patch(args.userId, {
      role: args.role,
    });

    // Log the change
    await ctx.db.insert("activityLogs", {
      userId: adminUser.clerkId,
      userName: adminUser.name,
      action: "role_change",
      details: `Changed role of user ${targetUser.name} to ${args.role}`,
      timestamp: Date.now(),
    });

    return { success: true };
  },
});

// Update a user's status (Admin only)
export const updateStatus = mutation({
  args: {
    userId: v.id("users"),
    status: v.union(v.literal("approved"), v.literal("pending"), v.literal("suspended")),
    clerkId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const adminUser = await assertAdmin(ctx, args.clerkId);
    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser) {
      throw new Error("Target user not found");
    }

    // Prevent changing own status
    if (targetUser.clerkId === adminUser.clerkId) {
      throw new Error("You cannot change your own status!");
    }

    await ctx.db.patch(args.userId, {
      status: args.status,
    });

    // Log the change
    await ctx.db.insert("activityLogs", {
      userId: adminUser.clerkId,
      userName: adminUser.name,
      action: "status_change",
      details: `Changed status of user ${targetUser.name} to ${args.status.toUpperCase()}`,
      timestamp: Date.now(),
    });

    return { success: true };
  },
});




