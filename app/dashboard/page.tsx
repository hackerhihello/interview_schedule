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
  Sparkles
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
const COLORS = ["#2563eb", "#4f46e5", "#7c3aed", "#e11d48", "#10b981", "#f59e0b"];

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
    setMounted(true);
  }, []);

  if (!currentUser || !statsData || !mounted) {
    return <DashboardSkeleton />;
  }

  const role = currentUser.role;
  const { stats, charts } = statsData;

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto">
      {/* Top Banner Welcome */}
      <div className="relative overflow-hidden p-8 rounded-[24px] border border-border/50 glass flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
        {/* Glow effect backgrounds */}
        <div className="absolute top-[-20%] right-[-10%] h-64 w-64 rounded-full bg-primary/10 blur-[80px]" />
        <div className="absolute bottom-[-20%] left-[-10%] h-48 w-48 rounded-full bg-secondary/10 blur-[60px]" />

        <div className="space-y-2.5 z-10">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest text-primary px-2.5 py-1 bg-primary/10 rounded-md">
              <Sparkles className="h-3 w-3" />
              Authenticated
            </span>
            <span className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
              Role: <span className="text-foreground capitalize">{role}</span>
            </span>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground mt-2">
            Welcome back, <span className="text-gradient-indigo">{currentUser.name}</span>
          </h2>
          <p className="text-sm text-muted-foreground max-w-xl leading-relaxed">
            {isAdmin
              ? "Access scheduling statistics, monitor candidate pipelines, and review organizational activity in real-time."
              : "Review your upcoming assigned candidate rounds, complete reports, and edit interview feedback logs."}
          </p>
        </div>

        <div className="flex items-center gap-4 shrink-0 z-10">
          <div className="px-5 py-3 rounded-2xl border border-border/40 bg-background/50 backdrop-blur-md flex flex-col items-start shadow-sm">
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-1">Session</span>
            <span className="text-sm font-bold text-foreground capitalize flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              {role}
            </span>
          </div>
          <div className="px-5 py-3 rounded-2xl border border-primary/20 bg-primary/5 backdrop-blur-md flex flex-col items-start shadow-sm">
            <span className="text-[10px] text-primary/70 uppercase font-bold tracking-widest mb-1">AI Insights</span>
            <span className="text-sm font-bold text-primary flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Active
            </span>
          </div>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Scheduled"
          value={stats.total}
          description={isAdmin ? "System-wide volume" : "Assigned slots"}
          icon={CalendarDays}
          color="indigo"
        />
        <StatsCard
          title="Upcoming Rounds"
          value={stats.upcoming}
          description="Awaiting execution"
          icon={Clock}
          color="primary"
        />
        <StatsCard
          title="Completed"
          value={stats.completed}
          description="Successfully processed"
          icon={CheckCircle}
          color="emerald"
        />
        <StatsCard
          title="Cancelled / Failed"
          value={stats.cancelled + stats.failed}
          description="Incomplete slots"
          icon={XCircle}
          color="rose"
        />
      </div>

      {/* Main Charts & Activity Content */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left Column: Visual Charts (Span 2) */}
        <div className="xl:col-span-2 space-y-8">
          
          <div className="p-7 rounded-[24px] border border-border/50 glass space-y-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-foreground tracking-tight">Interview Pipeline</h3>
                <p className="text-sm text-muted-foreground mt-1">Volume of interviews scheduled over time</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
            </div>

            <div className="h-80 w-full mt-4">
              {charts.timelineData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts.timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="date" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                    <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} dx={-10} />
                    <Tooltip
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                      contentStyle={{
                        background: "rgba(15, 23, 42, 0.95)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        borderRadius: "12px",
                        color: "#fff",
                        fontSize: "13px",
                        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                      }}
                    />
                    <Bar dataKey="count" fill="url(#colorBar)" radius={[6, 6, 0, 0]}>
                      <defs>
                        <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.9} />
                          <stop offset="95%" stopColor="#2563eb" stopOpacity={0.3} />
                        </linearGradient>
                      </defs>
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChartState text="No pipeline data available yet" />
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Rounds Distribution Pie Chart */}
            <div className="p-7 rounded-[24px] border border-border/50 glass space-y-6 flex flex-col justify-between shadow-sm">
              <div>
                <h3 className="text-lg font-bold text-foreground tracking-tight">Stage Distribution</h3>
                <p className="text-sm text-muted-foreground mt-1">Breakdown by assessment category</p>
              </div>
              
              <div className="h-64 w-full flex items-center justify-center relative">
                {charts.roundData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                         data={charts.roundData}
                         cx="50%"
                         cy="50%"
                         innerRadius={65}
                         outerRadius={90}
                         paddingAngle={4}
                         dataKey="value"
                         stroke="none"
                      >
                         {charts.roundData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                         ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: "rgba(15, 23, 42, 0.95)",
                          border: "1px solid rgba(255, 255, 255, 0.1)",
                          borderRadius: "12px",
                          color: "#fff",
                          fontSize: "13px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChartState text="No distribution data" />
                )}
                {/* Center Label */}
                {charts.roundData.length > 0 && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                     <span className="text-3xl font-extrabold text-foreground">{stats.total}</span>
                     <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Total</span>
                  </div>
                )}
              </div>

              {charts.roundData.length > 0 && (
                <div className="flex flex-wrap gap-3 justify-center mt-2">
                  {charts.roundData.map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                      <div
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span>{entry.name} <span className="text-foreground ml-1 font-semibold">{entry.value}</span></span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Performance Card */}
            <div className="p-7 rounded-[24px] border border-border/50 glass space-y-6 flex flex-col justify-between shadow-sm">
              <div>
                <h3 className="text-lg font-bold text-foreground tracking-tight">Success Metrics</h3>
                <p className="text-sm text-muted-foreground mt-1">Candidate progression rates</p>
              </div>

              <div className="space-y-6 py-2">
                <OutcomeProgress label="Passed / Promoted" count={stats.passed} total={stats.completed} color="bg-emerald-500" />
                <OutcomeProgress label="Failed / Rejected" count={stats.failed} total={stats.completed} color="bg-rose-500" />
                <OutcomeProgress label="Scheduled" count={stats.upcoming} total={stats.total} color="bg-indigo-500" />
              </div>

              <div className="p-4 rounded-xl bg-background/50 border border-border/40 text-sm text-muted-foreground flex items-start gap-3 mt-4 shadow-inner">
                <Award className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  {isAdmin
                    ? "Manage active pipelines, update roles, and review organizational metrics."
                    : "Update session statuses and review candidate records."}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Activity Audit Timeline */}
        <div className="p-7 rounded-[24px] border border-border/50 glass flex flex-col h-[calc(100vh-200px)] min-h-[700px] justify-between shadow-sm sticky top-24">
          <div className="space-y-6 flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-border/40">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                   <History className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-foreground tracking-tight">Activity Log</h3>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary px-2.5 py-1 bg-primary/10 border border-primary/20 rounded-md">
                Live
              </span>
            </div>

            {isAdmin ? (
              <div className="flex-1 overflow-y-auto space-y-5 pr-2 custom-scrollbar">
                {auditLogs && auditLogs.length > 0 ? (
                  auditLogs.map((log) => (
                    <div key={log._id} className="relative pl-7 pb-2 group animate-slide-up">
                      {/* Left timeline bar */}
                      <div className="absolute top-2 left-2 h-full w-[2px] bg-border/50 group-last:h-2" />
                      <div className="absolute top-1.5 left-[3px] h-3.5 w-3.5 rounded-full border-2 border-background bg-primary ring-4 ring-primary/10" />

                      <div className="space-y-1 bg-background/40 border border-border/40 p-3 rounded-xl hover:bg-background/80 transition-colors">
                        <span className="text-[10px] text-muted-foreground block font-mono font-medium tracking-wide">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(log.timestamp).toLocaleDateString()}
                        </span>
                        <h4 className="text-sm font-semibold text-foreground">
                          {log.userName}{" "}
                          <span className="text-primary/80 font-medium text-xs ml-1">({log.action})</span>
                        </h4>
                        <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                          {log.details}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <EmptyTimelineState text="No activity audits recorded yet" />
                )}
              </div>
            ) : (
              // Normal users view audit log description
              <div className="flex flex-col items-center justify-center text-center flex-1 space-y-4">
                <div className="h-16 w-16 rounded-2xl bg-secondary/50 border border-border flex items-center justify-center text-muted-foreground shadow-inner">
                  <XCircle className="h-8 w-8" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-lg font-bold text-foreground tracking-tight">Logs Restricted</h4>
                  <p className="text-sm text-muted-foreground max-w-[240px] leading-relaxed mx-auto">
                    Activity audit trails require administrator access. Contact support to request permissions.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="pt-5 mt-5 border-t border-border/40 text-center flex items-center justify-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest">
              Secure Audit Trail
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
    primary: "from-primary/10 to-primary/5 text-primary border-primary/20",
    indigo: "from-indigo-500/10 to-indigo-500/5 text-indigo-500 border-indigo-500/20",
    emerald: "from-emerald-500/10 to-emerald-500/5 text-emerald-500 border-emerald-500/20",
    rose: "from-rose-500/10 to-rose-500/5 text-rose-500 border-rose-500/20",
  };

  const iconColor = {
    primary: "bg-primary text-white shadow-primary/30",
    indigo: "bg-indigo-500 text-white shadow-indigo-500/30",
    emerald: "bg-emerald-500 text-white shadow-emerald-500/30",
    rose: "bg-rose-500 text-white shadow-rose-500/30",
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden p-6 rounded-[20px] border bg-gradient-to-tr glass flex items-center justify-between shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 group",
        colorMap[color]
      )}
    >
      <div className="space-y-2 relative z-10">
        <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground block">{title}</span>
        <h3 className="text-4xl font-black text-foreground tracking-tight">{value}</h3>
        <p className="text-[11px] text-muted-foreground font-medium">{description}</p>
      </div>

      <div className={cn("p-4 rounded-[16px] shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 relative z-10", iconColor[color])}>
        <Icon className="h-6 w-6" />
      </div>

      {/* Decorative background circle */}
      <div className={cn("absolute -bottom-8 -right-8 h-32 w-32 rounded-full opacity-10 transition-transform duration-500 group-hover:scale-150", iconColor[color])} />
    </div>
  );
}

function OutcomeProgress({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm font-bold">
        <span className="text-muted-foreground tracking-tight">{label}</span>
        <span className="text-foreground">{count} <span className="text-muted-foreground font-medium text-xs ml-1">({percentage}%)</span></span>
      </div>
      <div className="h-2.5 w-full bg-secondary/60 rounded-full overflow-hidden shadow-inner">
        <div className={cn("h-full rounded-full transition-all duration-1000 ease-out relative", color)} style={{ width: `${percentage}%` }}>
          <div className="absolute inset-0 bg-white/20 w-full h-full" />
        </div>
      </div>
    </div>
  );
}

function EmptyChartState({ text }: { text: string }) {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center text-center p-8 border border-dashed border-border/50 rounded-2xl bg-secondary/10">
      <div className="h-12 w-12 rounded-xl bg-background flex items-center justify-center mb-3 shadow-sm">
         <FileText className="h-6 w-6 text-muted-foreground animate-pulse" />
      </div>
      <span className="text-sm font-medium text-muted-foreground">{text}</span>
    </div>
  );
}

function EmptyTimelineState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 space-y-4">
      <div className="h-14 w-14 rounded-full bg-secondary/50 flex items-center justify-center shadow-inner">
         <History className="h-7 w-7 text-muted-foreground mb-1 animate-pulse" />
      </div>
      <div className="space-y-1">
        <h4 className="text-sm font-bold text-foreground">Log Clear</h4>
        <p className="text-[11px] text-muted-foreground max-w-[200px] leading-relaxed mx-auto">
          {text}
        </p>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse max-w-7xl mx-auto">
      <div className="h-44 w-full rounded-[24px] bg-secondary/30 border border-border/40" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 rounded-[20px] bg-secondary/30 border border-border/40" />
        ))}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-8">
          <div className="h-[400px] rounded-[24px] bg-secondary/30 border border-border/40" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="h-[380px] rounded-[24px] bg-secondary/30 border border-border/40" />
            <div className="h-[380px] rounded-[24px] bg-secondary/30 border border-border/40" />
          </div>
        </div>
        <div className="h-full min-h-[700px] rounded-[24px] bg-secondary/30 border border-border/40" />
      </div>
    </div>
  );
}
