"use client";

import { useState, useEffect } from "react";
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
  Search,
  Users,
  ShieldAlert,
  ShieldCheck,
  Mail
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function UsersPage() {
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

  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const search = params.get("search");
      if (search) {
        setSearchTerm(search);
      }
    }
  }, []);

  if (!currentUser) {
    return <UsersSkeleton />;
  }

  const isAdmin = currentUser.role === "admin";

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6 animate-fade-in">
        <div className="relative flex flex-col items-center p-10 rounded-[24px] glass border border-destructive/20 max-w-md w-full shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-b from-destructive/5 to-transparent rounded-[24px] pointer-events-none" />
          <div className="h-20 w-20 rounded-full bg-destructive/10 border border-destructive/20 text-destructive flex items-center justify-center mb-6 shadow-inner animate-pulse">
            <Lock className="h-10 w-10" />
          </div>
          
          <h3 className="text-2xl font-extrabold tracking-tight text-foreground z-10">
            Access Restricted
          </h3>
          <p className="text-sm text-muted-foreground mt-3 mb-8 max-w-xs leading-relaxed z-10">
            The Access Control Panel contains sensitive credentials and requires administrator privileges.
          </p>

          <a
            href="/dashboard"
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-foreground text-background font-bold text-sm transition-all hover:scale-105 active:scale-95 shadow-md z-10"
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
    if (!window.confirm(`Change user role to ${nextRole.toUpperCase()}?`)) return;
    try {
      await updateRole({ userId, role: nextRole, clerkId: user?.id });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update role");
    }
  };

  const handleToggleStatus = async (userId: Id<"users">, currentStatus: "approved" | "pending" | "suspended" | undefined) => {
    let nextStatus: "approved" | "suspended" = (currentStatus === "approved" || !currentStatus) ? "suspended" : "approved";
    if (!window.confirm(`Are you sure you want to ${nextStatus === "suspended" ? "SUSPEND" : "APPROVE"} this user's access?`)) return;
    try {
      await updateStatus({ userId, status: nextStatus, clerkId: user?.id });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update status");
    }
  };

  const filteredUsers = users?.filter((u) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term) || u.clerkId.toLowerCase().includes(term);
  });

  const adminCount = users?.filter(u => u.role === "admin").length || 0;
  const userCount = users?.filter(u => u.role === "user").length || 0;

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-card/10 p-6 rounded-[24px] glass border-border/40 shadow-sm">
        <div className="space-y-1">
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            User Directory
          </h2>
          <p className="text-sm text-muted-foreground font-medium">
            Manage organization access, roles, and administrative permissions.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto">
          {/* Stats overview */}
          <div className="hidden lg:flex items-center gap-4 px-5 py-2.5 rounded-xl border border-border/50 bg-background/50 shadow-inner">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4.5 w-4.5 text-primary" />
              <span className="text-sm font-bold">{adminCount} <span className="text-muted-foreground font-medium text-xs">Admins</span></span>
            </div>
            <div className="h-4 w-px bg-border/80" />
            <div className="flex items-center gap-2">
              <Users className="h-4.5 w-4.5 text-muted-foreground" />
              <span className="text-sm font-bold">{userCount} <span className="text-muted-foreground font-medium text-xs">Users</span></span>
            </div>
          </div>

          <div className="relative flex-1 sm:w-72 group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-12 py-3 rounded-xl border border-border/60 bg-background/40 hover:bg-background/60 text-foreground text-sm focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all shadow-sm"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modern Directory Cards / Table List */}
      <div className="rounded-[24px] border border-border/50 glass shadow-sm overflow-hidden bg-card/20">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="border-b border-border/40 bg-secondary/15 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                <th className="p-5 pl-8">Profile Identity</th>
                <th className="p-5">Authentication ID</th>
                <th className="p-5">Joined Date</th>
                <th className="p-5">Access Level</th>
                <th className="p-5">Status</th>
                <th className="p-5 pr-8 text-right">Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 text-sm font-medium text-foreground">
              {!filteredUsers ? (
                [1, 2, 3].map((i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="p-5 pl-8"><div className="h-10 w-48 bg-secondary/40 rounded-xl" /></td>
                    <td className="p-5"><div className="h-5 w-32 bg-secondary/40 rounded-md" /></td>
                    <td className="p-5"><div className="h-5 w-24 bg-secondary/40 rounded-md" /></td>
                    <td className="p-5"><div className="h-6 w-20 bg-secondary/40 rounded-full" /></td>
                    <td className="p-5"><div className="h-6 w-20 bg-secondary/40 rounded-full" /></td>
                    <td className="p-5 pr-8 text-right"><div className="h-8 w-32 bg-secondary/40 rounded-xl ml-auto" /></td>
                  </tr>
                ))
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((userItem) => {
                  const isSelf = userItem.clerkId === currentUser.clerkId;
                  const isHighlighted = searchTerm && (userItem.email.toLowerCase() === searchTerm.toLowerCase() || userItem.name.toLowerCase() === searchTerm.toLowerCase());
                  const isAdminRole = userItem.role === "admin";
                  const isApproved = userItem.status === "approved" || !userItem.status;
                  
                  return (
                    <tr key={userItem._id} className={cn("hover:bg-background/40 transition-colors group", isHighlighted && "bg-primary/5")}>
                      <td className="p-5 pl-8">
                        <div className="flex items-center gap-4">
                          {userItem.imageUrl ? (
                            <img src={userItem.imageUrl} alt={userItem.name} className="h-11 w-11 rounded-[14px] object-cover shadow-sm ring-1 ring-border/50" />
                          ) : (
                            <div className="h-11 w-11 rounded-[14px] bg-gradient-indigo text-white font-bold text-sm flex items-center justify-center shadow-md">
                              {userItem.name.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-[14px] text-foreground flex items-center gap-2">
                              <span>{userItem.name}</span>
                              {isSelf && <span className="text-[9px] font-bold text-primary px-2 py-0.5 bg-primary/10 border border-primary/20 rounded-md uppercase tracking-wider">You</span>}
                            </div>
                            <div className="text-[11px] text-muted-foreground font-mono mt-0.5 flex items-center gap-1.5"><Mail className="h-3 w-3"/>{userItem.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-5">
                        <span className="font-mono text-[11px] text-muted-foreground bg-secondary/30 px-2 py-1 rounded-md border border-border/40 select-all">
                          {userItem.clerkId}
                        </span>
                      </td>
                      <td className="p-5">
                        <div className="flex items-center gap-1.5 text-muted-foreground font-semibold text-[13px]">
                          <Calendar className="h-4 w-4 text-foreground/50" />
                          <span>{new Date(userItem.createdAt).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric'})}</span>
                        </div>
                      </td>
                      <td className="p-5">
                        <span className={cn("px-3 py-1.5 rounded-md font-bold text-[10px] uppercase tracking-wider inline-flex items-center gap-1.5", isAdminRole ? "bg-indigo-500/10 text-indigo-500 border border-indigo-500/20" : "bg-secondary text-muted-foreground border border-border/50")}>
                          {isAdminRole ? <ShieldCheck className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
                          <span>{userItem.role}</span>
                        </span>
                      </td>
                      <td className="p-5">
                        <span className={cn("px-3 py-1.5 rounded-full font-bold text-[10px] uppercase tracking-wider inline-flex items-center gap-1.5", isApproved ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-rose-500/10 text-rose-500 border border-rose-500/20")}>
                          <span className={cn("h-1.5 w-1.5 rounded-full", isApproved ? "bg-emerald-500" : "bg-rose-500 animate-pulse")} />
                          <span>{userItem.status || "approved"}</span>
                        </span>
                      </td>
                      <td className="p-5 pr-8 text-right">
                        {isSelf ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-secondary/20 border border-border/30 rounded-xl text-[10px] font-bold text-muted-foreground italic uppercase tracking-wider cursor-not-allowed">
                            <Lock className="h-3 w-3" />
                            Admin Locked
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleToggleRole(userItem._id, userItem.role)}
                              className={cn("inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border font-bold text-[10px] uppercase tracking-wider transition-all active:scale-95 shadow-sm", isAdminRole ? "bg-card border-border hover:bg-secondary text-foreground" : "bg-gradient-indigo text-white border-transparent hover:shadow-indigo-500/25")}
                            >
                              {isAdminRole ? <ShieldAlert className="h-3.5 w-3.5 text-muted-foreground" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                              <span>{isAdminRole ? "Demote" : "Make Admin"}</span>
                            </button>

                            <button
                              onClick={() => handleToggleStatus(userItem._id, userItem.status)}
                              className={cn("inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border font-bold text-[10px] uppercase tracking-wider transition-all active:scale-95 shadow-sm", isApproved ? "bg-background border-border/50 hover:bg-rose-500/10 hover:text-rose-500 hover:border-rose-500/30 text-muted-foreground" : "bg-emerald-500/10 text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/20")}
                            >
                              {isApproved ? <Ban className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
                              <span>{isApproved ? "Suspend" : "Approve"}</span>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="p-16 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                       <div className="h-16 w-16 rounded-[20px] bg-secondary/50 shadow-inner flex items-center justify-center text-muted-foreground mb-2">
                          <Users className="h-8 w-8 opacity-50" />
                       </div>
                       <h4 className="font-bold text-foreground">No users found</h4>
                       <p className="text-sm text-muted-foreground">Modify your search parameters to find existing users.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function UsersSkeleton() {
  return (
    <div className="space-y-8 animate-pulse max-w-7xl mx-auto">
      <div className="h-28 rounded-[24px] bg-secondary/30 border border-border/40" />
      <div className="h-[600px] rounded-[24px] bg-secondary/30 border border-border/40" />
    </div>
  );
}
