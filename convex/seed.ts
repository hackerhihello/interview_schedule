import { mutation } from "./_generated/server";

export const seedUsers = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if users already exist
    const existingUsers = await ctx.db.query("users").take(1);
    if (existingUsers.length > 0) {
      return "Users already exist in the database. Skipping seed.";
    }

    // Insert an initial Admin user
    const adminId = await ctx.db.insert("users", {
      clerkId: "seed_admin_123",
      name: "System Administrator",
      email: "rahulbalbatti032@gmail.com",
      role: "admin",
      status: "approved",
      createdAt: Date.now(),
    });

    // Insert a dummy Student/Candidate user
    const studentId = await ctx.db.insert("users", {
      clerkId: "seed_student_123",
      name: "Test Student",
      email: "student@example.com",
      role: "user",
      status: "approved",
      createdAt: Date.now(),
    });

    return `Successfully seeded Admin (${adminId}) and Student (${studentId})`;
  },
});
