"use client";

import { useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import {
  History,
  Lock,
  ArrowRight,
  Clock,
  User,
  PlusCircle,
  Edit,
  Trash2,
  Settings,
  Database,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function ActivityPage() {
  const { user } = useUser();
  const currentUser = useQuery(
    api.users.currentUser,
    user ? { clerkId: user.id } : "skip"
  );
  const logs = useQuery(
    api.activity.getLogs,
    user ? { clerkId: user.id } : "skip"
  );

  if (!currentUser) {
    return <ActivitySkeleton />;
  }

  const isAdmin = currentUser.role === "admin";

  // Role Gate
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
            The Activity Audit Panel contains secure system operation logs and is strictly locked to administrator roles.
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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">System Audit Activity Log</h2>
        <p className="text-sm text-muted-foreground">
          Track administrative actions, database mutations, and role changes chronologically
        </p>
      </div>

      {/* Audit Log Table */}
      <div className="overflow-x-auto rounded-2xl border border-border bg-card/25 backdrop-blur-sm shadow-md">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="border-b border-border bg-secondary/15 text-xs font-bold text-muted-foreground uppercase tracking-wider">
              <th className="p-4 pl-6">Timestamp</th>
              <th className="p-4">operator</th>
              <th className="p-4">Action</th>
              <th className="p-4 pr-6">Log details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60 text-xs font-medium text-foreground">
            {!logs ? (
              [1, 2, 3].map((i) => (
                <tr key={i} className="animate-pulse">
                  <td className="p-4 pl-6"><div className="h-4 w-32 bg-secondary rounded" /></td>
                  <td className="p-4"><div className="h-4 w-24 bg-secondary rounded" /></td>
                  <td className="p-4"><div className="h-6 w-16 bg-secondary rounded-full" /></td>
                  <td className="p-4 pr-6"><div className="h-4 w-60 bg-secondary rounded" /></td>
                </tr>
              ))
            ) : logs.length > 0 ? (
              logs.map((log) => {
                const date = new Date(log.timestamp);
                const isCreate = log.action === "create";
                const isUpdate = log.action === "update";
                const isDelete = log.action === "delete";
                const isRole = log.action === "role_change";
                const isRegister = log.action === "register";

                return (
                  <tr
                    key={log._id}
                    className="hover:bg-secondary/20 transition-all duration-200"
                  >
                    {/* Timestamp */}
                    <td className="p-4 pl-6 font-mono text-[10px] text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 shrink-0" />
                        <span>
                          {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                    </td>

                    {/* Operator */}
                    <td className="p-4 font-bold text-foreground">
                      <div className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span>{log.userName}</span>
                      </div>
                    </td>

                    {/* Action Badge */}
                    <td className="p-4">
                      <span className={cn(
                        "px-2.5 py-1 rounded-full font-bold text-[9px] uppercase tracking-wide inline-flex items-center gap-1.5",
                        isCreate && "bg-blue-500/10 text-blue-500 border border-blue-500/15",
                        isUpdate && "bg-amber-500/10 text-amber-500 border border-amber-500/15",
                        isDelete && "bg-rose-500/10 text-rose-500 border border-rose-500/15",
                        isRole && "bg-purple-500/10 text-purple-500 border border-purple-500/15",
                        isRegister && "bg-emerald-500/10 text-emerald-500 border border-emerald-500/15"
                      )}>
                        {isCreate && <PlusCircle className="h-3 w-3" />}
                        {isUpdate && <Edit className="h-3 w-3" />}
                        {isDelete && <Trash2 className="h-3 w-3" />}
                        {isRole && <Settings className="h-3 w-3" />}
                        {isRegister && <Database className="h-3 w-3" />}
                        <span>{log.action}</span>
                      </span>
                    </td>

                    {/* Log Details */}
                    <td className="p-4 pr-6 text-foreground leading-relaxed break-words font-sans text-xs">
                      {log.details}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={4} className="p-16 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center space-y-3.5 max-w-sm mx-auto">
                    <div className="h-12 w-12 rounded-2xl bg-secondary/40 border border-border flex items-center justify-center text-muted-foreground animate-pulse">
                      <History className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground text-sm">Audit log database clear</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                        No auditable scheduler transactions or role changes have occurred inside this workspace yet.
                      </p>
                    </div>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ActivitySkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-14 w-1/3 bg-secondary/40 rounded" />
      <div className="h-96 rounded-2xl bg-secondary/40 border border-border" />
    </div>
  );
}
