"use client";

import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import {
  CalendarDays,
  CheckCircle,
  XCircle,
  FileText,
  Clock,
  User,
  History,
  TrendingUp,
  Award,
  Video,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { cn } from "@/lib/utils";

// Custom palette colors for charts
const COLORS = ["#3b82f6", "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#10b981"];

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const { user } = useUser();
  const currentUser = useQuery(
    api.users.currentUser,
    user ? { clerkId: user.id } : "skip"
  );
  const statsData = useQuery(
    api.interviews.getStats,
    user ? { clerkId: user.id } : "skip"
  );

  const isAdmin = currentUser?.role === "admin";
  const auditLogs = useQuery(
    api.activity.getLogs,
    currentUser && isAdmin ? { clerkId: user?.id } : "skip"
  );

  // Prevent Recharts hydration mismatch
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!currentUser || !statsData || !mounted) {
    return <DashboardSkeleton />;
  }

  const role = currentUser.role;
  const { stats, charts } = statsData;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Banner Welcome */}
      <div className="relative overflow-hidden p-6 md:p-8 rounded-2xl border border-border/40 bg-card/40 backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Glow effect backgrounds */}
        <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-24 w-24 rounded-full bg-indigo-500/10 blur-2xl" />

        <div className="space-y-1 z-10">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary px-2 py-0.5 bg-primary/10 rounded-full">
              Authentication Active
            </span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              • Role: <span className="font-semibold text-foreground capitalize">{role}</span>
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Welcome back, <span className="bg-gradient-to-r from-primary to-indigo-500 bg-clip-text text-transparent">{currentUser.name}</span>!
          </h2>
          <p className="text-sm text-muted-foreground max-w-xl">
            {isAdmin
              ? "Access scheduling statistics, candidate lists, assign interviewers, and review audit records."
              : "Review your upcoming assigned candidate rounds, complete reports, and edit interview feedback logs."}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 z-10">
          <div className="px-4 py-2.5 rounded-xl border border-border bg-secondary/20 backdrop-blur-sm text-center">
            <span className="text-xs text-muted-foreground block">Session Role</span>
            <span className="text-sm font-bold text-foreground uppercase tracking-wide">{role}</span>
          </div>
          <div className="px-4 py-2.5 rounded-xl border border-border bg-secondary/20 backdrop-blur-sm text-center">
            <span className="text-xs text-muted-foreground block">Next Candidate</span>
            <span className="text-sm font-bold text-primary flex items-center gap-1.5 justify-center">
              <img src="/logo.png" className="h-3.5 w-3.5 object-contain" alt="Ignited Minds Logo" />
              Active
            </span>
          </div>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatsCard
          title="Total Scheduled"
          value={stats.total}
          description={isAdmin ? "Total entries system-wide" : "Total slots assigned to you"}
          icon={CalendarDays}
          color="primary"
        />
        <StatsCard
          title="Upcoming Rounds"
          value={stats.upcoming}
          description="Awaiting session execution"
          icon={Clock}
          color="indigo"
        />
        <StatsCard
          title="Completed Assessments"
          value={stats.completed}
          description="Successfully processed rounds"
          icon={CheckCircle}
          color="emerald"
        />
        <StatsCard
          title="Cancelled / Failed"
          value={stats.cancelled + stats.failed}
          description="Incomplete or missed slots"
          icon={XCircle}
          color="rose"
        />
      </div>

      {/* Main Charts & Activity Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Visual Charts (Span 2) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl border border-border bg-card/30 backdrop-blur-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-md font-bold text-foreground">Weekly Scheduling Loads</h3>
                <p className="text-xs text-muted-foreground">Volume of interviews scheduled per calendar date</p>
              </div>
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>

            <div className="h-80 w-full">
              {charts.timelineData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts.timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="date" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        background: "rgba(30, 41, 59, 0.9)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        borderRadius: "12px",
                        color: "#fff",
                        fontSize: "12px",
                      }}
                    />
                    <Bar dataKey="count" fill="url(#colorBar)" radius={[6, 6, 0, 0]}>
                      <defs>
                        <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.3} />
                        </linearGradient>
                      </defs>
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChartState text="No scheduler date load information compiled yet" />
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Rounds Distribution Pie Chart */}
            <div className="p-6 rounded-2xl border border-border bg-card/30 backdrop-blur-sm space-y-6 flex flex-col justify-between">
              <div>
                <h3 className="text-md font-bold text-foreground">Round Distribution</h3>
                <p className="text-xs text-muted-foreground">Breakdown by interview round category</p>
              </div>
              
              <div className="h-60 w-full flex items-center justify-center">
                {charts.roundData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={charts.roundData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {charts.roundData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: "rgba(30, 41, 59, 0.9)",
                          border: "1px solid rgba(255, 255, 255, 0.1)",
                          borderRadius: "8px",
                          color: "#fff",
                          fontSize: "11px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChartState text="No interview round category breakdowns" />
                )}
              </div>

              {charts.roundData.length > 0 && (
                <div className="flex flex-wrap gap-2.5 justify-center mt-2">
                  {charts.roundData.map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span>{entry.name} ({entry.value})</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Performance Card */}
            <div className="p-6 rounded-2xl border border-border bg-card/30 backdrop-blur-sm space-y-5 flex flex-col justify-between">
              <div>
                <h3 className="text-md font-bold text-foreground">Candidate Outcome Ratios</h3>
                <p className="text-xs text-muted-foreground">Breakdown of grading assessments</p>
              </div>

              <div className="space-y-4 py-2">
                <OutcomeProgress label="Passed / Promoted" count={stats.passed} total={stats.completed} color="bg-emerald-500" />
                <OutcomeProgress label="Failed / Rejected" count={stats.failed} total={stats.completed} color="bg-rose-500" />
                <OutcomeProgress label="Scheduled" count={stats.upcoming} total={stats.total} color="bg-indigo-500" />
              </div>

              <div className="p-3.5 rounded-xl bg-secondary/30 border border-border text-xs text-muted-foreground flex items-start gap-2.5">
                <Award className="h-4.5 w-4.5 text-indigo-500 shrink-0 mt-0.5" />
                <span>
                  {isAdmin
                    ? "As administrator, manage active pipelines, add roles, and oversee organizational interviews."
                    : "Update details on upcoming rounds. Review candidate specs prior to sessions."}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Activity Audit Timeline */}
        <div className="p-6 rounded-2xl border border-border bg-card/30 backdrop-blur-sm flex flex-col h-full justify-between">
          <div className="space-y-5 flex-1">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <div className="flex items-center gap-2">
                <History className="h-4.5 w-4.5 text-primary" />
                <h3 className="text-md font-bold text-foreground">Activity Timeline</h3>
              </div>
              <span className="text-[10px] font-semibold text-muted-foreground px-2 py-0.5 bg-secondary/80 border border-border rounded-lg">
                Audits Enabled
              </span>
            </div>

            {isAdmin ? (
              <div className="space-y-4 overflow-y-auto max-h-[520px] pr-1">
                {auditLogs && auditLogs.length > 0 ? (
                  auditLogs.map((log) => (
                    <div key={log._id} className="relative pl-6 pb-2 group">
                      {/* Left timeline bar */}
                      <div className="absolute top-1.5 left-1.5 h-full w-[1.5px] bg-border group-last:h-2" />
                      <div className="absolute top-1.5 left-0.5 h-3 w-3 rounded-full border-2 border-background bg-primary ring-2 ring-primary/10" />

                      <div className="space-y-0.5">
                        <span className="text-[10px] text-muted-foreground block font-mono">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(log.timestamp).toLocaleDateString()}
                        </span>
                        <h4 className="text-xs font-bold text-foreground">
                          {log.userName}{" "}
                          <span className="text-muted-foreground font-normal">({log.action})</span>
                        </h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {log.details}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <EmptyTimelineState text="No activity audits recorded in DB yet" />
                )}
              </div>
            ) : (
              // Normal users view audit log description
              <div className="flex flex-col items-center justify-center text-center py-16 space-y-4">
                <div className="h-12 w-12 rounded-xl bg-secondary/40 border border-border flex items-center justify-center text-muted-foreground">
                  <XCircle className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-foreground">Logs Unavailable</h4>
                  <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
                    Activity audit trails are locked to administrator roles. Contact support for system-wide access.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 mt-4 border-t border-border/60 text-center">
            <span className="text-[10px] text-muted-foreground">
              Scheduler logs operate under ISO 27001 audit controls.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Sub-components
interface StatsCardProps {
  title: string;
  value: number;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: "primary" | "indigo" | "emerald" | "rose";
}

function StatsCard({ title, value, description, icon: Icon, color }: StatsCardProps) {
  const colorMap = {
    primary: "from-primary/10 to-blue-500/5 text-primary border-primary/20",
    indigo: "from-indigo-500/10 to-purple-500/5 text-indigo-500 border-indigo-500/20",
    emerald: "from-emerald-500/10 to-teal-500/5 text-emerald-500 border-emerald-500/20",
    rose: "from-rose-500/10 to-red-500/5 text-rose-500 border-rose-500/20",
  };

  const iconColor = {
    primary: "bg-primary text-white",
    indigo: "bg-indigo-500 text-white",
    emerald: "bg-emerald-500 text-white",
    rose: "bg-rose-500 text-white",
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden p-6 rounded-2xl border bg-gradient-to-tr bg-card/40 backdrop-blur-sm flex items-center justify-between shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all duration-300",
        colorMap[color]
      )}
    >
      <div className="space-y-1.5">
        <span className="text-xs font-semibold text-muted-foreground block">{title}</span>
        <h3 className="text-3xl font-extrabold text-foreground tracking-tight">{value}</h3>
        <p className="text-[10px] text-muted-foreground">{description}</p>
      </div>

      <div className={cn("p-3 rounded-xl shadow-md", iconColor[color])}>
        <Icon className="h-5 w-5" />
      </div>
    </div>
  );
}

function OutcomeProgress({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs font-semibold">
        <span className="text-muted-foreground">{label}</span>
        <span className="text-foreground">{count} ({percentage}%)</span>
      </div>
      <div className="h-2 w-full bg-secondary/80 rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full transition-all duration-500", color)} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

function EmptyChartState({ text }: { text: string }) {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center text-center p-8 border border-dashed border-border rounded-xl bg-secondary/15">
      <FileText className="h-8 w-8 text-muted-foreground mb-2 animate-bounce" />
      <span className="text-xs text-muted-foreground">{text}</span>
    </div>
  );
}

function EmptyTimelineState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 space-y-3">
      <History className="h-8 w-8 text-muted-foreground mb-1 animate-pulse" />
      <h4 className="text-xs font-bold text-foreground">Audit Log Clear</h4>
      <p className="text-[10px] text-muted-foreground max-w-xs leading-relaxed">
        {text}
      </p>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Banner skeleton */}
      <div className="h-40 w-full rounded-2xl bg-secondary/40 border border-border" />
      
      {/* Grid Cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 rounded-2xl bg-secondary/40 border border-border" />
        ))}
      </div>

      {/* Columns Skeletons */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="h-96 rounded-2xl bg-secondary/40 border border-border" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-80 rounded-2xl bg-secondary/40 border border-border" />
            <div className="h-80 rounded-2xl bg-secondary/40 border border-border" />
          </div>
        </div>
        <div className="h-full min-h-[500px] rounded-2xl bg-secondary/40 border border-border" />
      </div>
    </div>
  );
}
