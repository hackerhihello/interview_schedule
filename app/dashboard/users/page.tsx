"use client";

import { useQuery, useMutation } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Shield,
  UserCheck,
  Calendar,
  Lock,
  ArrowRight,
  Ban,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function UsersPage() {
  // Queries & Mutations
  const { user } = useUser();
  const currentUser = useQuery(
    api.users.currentUser,
    user ? { clerkId: user.id } : "skip"
  );
  const users = useQuery(
    api.users.getUsers,
    user ? { clerkId: user.id } : "skip"
  );
  const updateRole = useMutation(api.users.updateRole);
  const updateStatus = useMutation(api.users.updateStatus);

  if (!currentUser) {
    return <UsersSkeleton />;
  }

  const isAdmin = currentUser.role === "admin";

  // Role Protection UI Warning for normal users
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
        <div className="relative flex flex-col items-center p-8 rounded-2xl glass border border-destructive/20 max-w-md w-full shadow-lg">
          <div className="h-16 w-16 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive flex items-center justify-center mb-6 animate-pulse">
            <Lock className="h-8 w-8" />
          </div>
          
          <h3 className="text-xl font-bold tracking-tight text-foreground">
            Access Restrained
          </h3>
          <p className="text-sm text-muted-foreground mt-2 mb-6 max-w-xs leading-relaxed">
            The User Access Control Panel contains sensitive credentials and is strictly locked to administrator roles.
          </p>

          <a
            href="/dashboard"
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-indigo-600 text-white font-semibold text-xs transition-all active:scale-98"
          >
            <span>Return to Overview</span>
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    );
  }

  const handleToggleRole = async (userId: Id<"users">, currentRole: "admin" | "user") => {
    const nextRole = currentRole === "admin" ? "user" : "admin";
    
    if (
      !window.confirm(
        `Are you sure you want to change this user's role to ${nextRole.toUpperCase()}?`
      )
    ) {
      return;
    }

    try {
      await updateRole({
        userId,
        role: nextRole,
        clerkId: user?.id,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update user role";
      alert(message);
    }
  };

  const handleToggleStatus = async (
    userId: Id<"users">,
    currentStatus: "approved" | "pending" | "suspended" | undefined
  ) => {
    let nextStatus: "approved" | "pending" | "suspended" = "approved";

    if (currentStatus === "approved" || !currentStatus) {
      if (!window.confirm("Are you sure you want to SUSPEND this user's access?")) {
        return;
      }
      nextStatus = "suspended";
    } else {
      if (!window.confirm("Are you sure you want to APPROVE/RESTORE this user's access?")) {
        return;
      }
      nextStatus = "approved";
    }

    try {
      await updateStatus({
        userId,
        status: nextStatus,
        clerkId: user?.id,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update user status";
      alert(message);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">User Directory & Access Control</h2>
        <p className="text-sm text-muted-foreground">
          View authenticated credentials, audit access parameters, and manage administration permissions
        </p>
      </div>

      {/* Directory Table */}
      <div className="overflow-x-auto rounded-2xl border border-border bg-card/25 backdrop-blur-sm shadow-md">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="border-b border-border bg-secondary/15 text-xs font-bold text-muted-foreground uppercase tracking-wider">
              <th className="p-4 pl-6">Profile Details</th>
              <th className="p-4">Clerk Authentication ID</th>
              <th className="p-4">Created Date</th>
              <th className="p-4">Access Level</th>
              <th className="p-4">Approval Status</th>
              <th className="p-4 pr-6 text-right">Access Controls</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60 text-xs font-medium text-foreground">
            {!users ? (
              [1, 2].map((i) => (
                <tr key={i} className="animate-pulse">
                  <td className="p-4 pl-6"><div className="h-6 w-24 bg-secondary rounded" /></td>
                  <td className="p-4"><div className="h-4 w-40 bg-secondary rounded" /></td>
                  <td className="p-4"><div className="h-4 w-28 bg-secondary rounded" /></td>
                  <td className="p-4"><div className="h-6 w-16 bg-secondary rounded-full" /></td>
                  <td className="p-4"><div className="h-6 w-16 bg-secondary rounded-full" /></td>
                  <td className="p-4 pr-6 text-right"><div className="h-8 w-24 bg-secondary rounded ml-auto" /></td>
                </tr>
              ))
            ) : users.length > 0 ? (
              users.map((userItem) => {
                const isSelf = userItem.clerkId === currentUser.clerkId;
                
                return (
                  <tr
                    key={userItem._id}
                    className="hover:bg-secondary/20 transition-all duration-200"
                  >
                    {/* User Details */}
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        {userItem.imageUrl ? (
                          <img
                            src={userItem.imageUrl}
                            alt={userItem.name}
                            className="h-9 w-9 rounded-xl object-cover ring-2 ring-primary/5"
                          />
                        ) : (
                          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-primary text-white font-bold text-xs flex items-center justify-center">
                            {userItem.name.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-sm text-foreground flex items-center gap-1.5">
                            <span>{userItem.name}</span>
                            {isSelf && (
                              <span className="text-[9px] font-bold text-primary px-1.5 py-0.5 bg-primary/10 rounded-full">
                                You
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-muted-foreground font-mono mt-0.5">{userItem.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Clerk ID */}
                    <td className="p-4 font-mono text-[10px] text-muted-foreground">
                      {userItem.clerkId}
                    </td>

                    {/* Created Date */}
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-muted-foreground font-mono">
                        <Calendar className="h-3.5 w-3.5 shrink-0" />
                        <span>{new Date(userItem.createdAt).toLocaleDateString()}</span>
                      </div>
                    </td>

                    {/* Role Badge */}
                    <td className="p-4">
                      <span className={cn(
                        "px-2.5 py-1 rounded-full font-bold text-[10px] uppercase tracking-wider inline-flex items-center gap-1.5",
                        userItem.role === "admin"
                          ? "bg-primary/10 text-primary border border-primary/20"
                          : "bg-secondary text-muted-foreground border border-border"
                      )}>
                        <Shield className="h-3.5 w-3.5" />
                        <span>{userItem.role}</span>
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="p-4">
                      <span className={cn(
                        "px-2.5 py-1 rounded-full font-bold text-[10px] uppercase tracking-wider inline-flex items-center gap-1.5",
                        userItem.status === "approved" && "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20",
                        userItem.status === "pending" && "bg-amber-500/10 text-amber-500 border border-amber-500/20",
                        userItem.status === "suspended" && "bg-rose-500/10 text-rose-500 border border-rose-500/20",
                        !userItem.status && "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                      )}>
                        <span className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          userItem.status === "approved" && "bg-emerald-500",
                          userItem.status === "pending" && "bg-amber-500 animate-pulse",
                          userItem.status === "suspended" && "bg-rose-500",
                          !userItem.status && "bg-emerald-500"
                        )} />
                        <span>{userItem.status || "approved"}</span>
                      </span>
                    </td>

                    {/* Change Role Button */}
                    <td className="p-4 pr-6 text-right">
                      {isSelf ? (
                        <span className="text-[10px] text-muted-foreground italic px-2.5 py-1.5 bg-secondary/30 rounded-lg">
                          Locked (Self-Safety)
                        </span>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleToggleRole(userItem._id, userItem.role)}
                            className={cn(
                              "inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border font-bold text-[9px] uppercase tracking-wide transition-all active:scale-98 hover:scale-102",
                              userItem.role === "admin"
                                ? "bg-card border-border hover:bg-destructive/10 hover:border-destructive/30 hover:text-destructive text-foreground"
                                : "bg-primary text-white border-primary shadow-sm hover:shadow-md hover:shadow-primary/20"
                            )}
                          >
                            <UserCheck className="h-3 w-3" />
                            <span>{userItem.role === "admin" ? "Demote" : "Promote"}</span>
                          </button>

                          <button
                            onClick={() => handleToggleStatus(userItem._id, userItem.status)}
                            className={cn(
                              "inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border font-bold text-[9px] uppercase tracking-wide transition-all active:scale-98 hover:scale-102",
                              (userItem.status === "approved" || !userItem.status)
                                ? "bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border-rose-500/20"
                                : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border-emerald-500/20"
                            )}
                          >
                            {(userItem.status === "approved" || !userItem.status) ? (
                              <>
                                <Ban className="h-3 w-3" />
                                <span>Suspend</span>
                              </>
                            ) : (
                              <>
                                <Check className="h-3 w-3" />
                                <span>Approve</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} className="p-12 text-center text-muted-foreground">
                  No registered accounts located.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function UsersSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-14 w-1/3 bg-secondary/40 rounded" />
      <div className="h-96 rounded-2xl bg-secondary/40 border border-border" />
    </div>
  );
}
