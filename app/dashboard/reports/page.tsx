"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from "recharts";
import {
  Download, FileSpreadsheet, FileText, Calendar, Building2, Users, PieChart as PieChartIcon,
  TrendingUp, ArrowUpRight, Search, Filter, Loader2, Sparkles, UserCheck, CheckCircle2, XCircle
} from "lucide-react";
import html2canvas from "html2canvas";
import { exportToExcel } from "@/lib/excel-export";
import { exportToPDF } from "@/lib/pdf-export";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function ReportsPage() {
  const { user } = useUser();
  const reportData = useQuery(
    api.reports.getReportData,
    user ? { clerkId: user.id } : "skip"
  );

  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  
  const [isExporting, setIsExporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const trendChartRef = useRef<HTMLDivElement>(null);
  const pieChartRef = useRef<HTMLDivElement>(null);

  if (reportData === undefined) {
    return (
      <div className="h-[60vh] w-full flex flex-col items-center justify-center space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary" />
        <p className="text-sm text-muted-foreground font-medium animate-pulse">Aggregating Report Data...</p>
      </div>
    );
  }

  // Derived Analytics
  let filteredInterviews = reportData?.interviews || [];
  
  // Date Filtering
  filteredInterviews = filteredInterviews.filter((i) => {
    const iDate = new Date(i.interviewDate).toISOString().split('T')[0];
    return iDate >= dateRange.start && iDate <= dateRange.end;
  });

  // Status & Search Filtering
  filteredInterviews = filteredInterviews.filter((i) => {
    const matchesStatus = statusFilter === "All" || i.status.toLowerCase() === statusFilter.toLowerCase();
    const matchesSearch = searchTerm === "" || 
      i.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (i.companyName || "").toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const total = filteredInterviews.length;
  const completed = filteredInterviews.filter(i => i.status === "completed" || i.status === "passed" || i.status === "failed").length;
  const passed = filteredInterviews.filter(i => i.status === "passed").length;
  const failed = filteredInterviews.filter(i => i.status === "failed").length;
  const scheduled = filteredInterviews.filter(i => i.status === "scheduled").length;
  const successRate = completed > 0 ? Math.round((passed / completed) * 100) : 0;
  
  // Chart Data Processing
  const statusData = [
    { name: 'Passed', value: passed, color: '#10B981' }, // Emerald
    { name: 'Failed', value: failed, color: '#EF4444' }, // Rose
    { name: 'Scheduled', value: scheduled, color: '#3B82F6' }, // Blue
  ].filter(d => d.value > 0);

  // Group by Date for Trend
  const trendMap = new Map();
  filteredInterviews.forEach(i => {
    const d = new Date(i.interviewDate).toLocaleDateString([], { month: 'short', day: 'numeric' });
    trendMap.set(d, (trendMap.get(d) || 0) + 1);
  });
  const trendData = Array.from(trendMap.entries()).map(([date, count]) => ({ date, count }));

  // AI Summary Logic (Mock AI Insights)
  const topCompany = filteredInterviews.reduce((acc, curr) => {
    const name = curr.companyName || "Internal";
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {} as any);
  const bestCompany = Object.keys(topCompany).sort((a,b) => topCompany[b] - topCompany[a])[0] || "N/A";

  const handleExport = async (type: 'excel' | 'pdf') => {
    setIsExporting(true);
    try {
      const chartsBase64: any = {};
      
      // Capture charts for Excel
      if (type === 'excel') {
        if (trendChartRef.current) {
          const canvas = await html2canvas(trendChartRef.current, { backgroundColor: '#ffffff', scale: 2 });
          chartsBase64.trend = canvas.toDataURL("image/png");
        }
        if (pieChartRef.current) {
          const canvas = await html2canvas(pieChartRef.current, { backgroundColor: '#ffffff', scale: 2 });
          chartsBase64.pie = canvas.toDataURL("image/png");
        }
      }

      const exportData = {
        total, completed, passed, failed, successRate,
        interviews: filteredInterviews
      };

      if (type === 'excel') {
        await exportToExcel(exportData, chartsBase64, dateRange);
        toast.success("Excel report generated successfully");
      } else {
        exportToPDF(exportData, dateRange);
        toast.success("PDF report generated successfully");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate report");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto pb-12">
      
      {/* Header & Export Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-card/10 p-6 rounded-[24px] glass border-border/40 shadow-sm">
        <div className="space-y-1">
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
            <PieChartIcon className="h-8 w-8 text-primary" />
            Analytics & Reports
          </h2>
          <p className="text-sm text-muted-foreground font-medium">
            Generate detailed executive summaries and export comprehensive hiring data.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 w-full lg:w-auto">
          <div className="flex items-center justify-between sm:justify-start gap-2 bg-background/50 p-1.5 rounded-xl border border-border/50 shadow-inner overflow-hidden">
            <input type="date" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} className="bg-transparent text-xs sm:text-sm font-medium focus:outline-none px-1 sm:px-2 text-foreground w-full max-w-[130px]" />
            <span className="text-muted-foreground">-</span>
            <input type="date" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} className="bg-transparent text-xs sm:text-sm font-medium focus:outline-none px-1 sm:px-2 text-foreground w-full max-w-[130px]" />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button onClick={() => handleExport('pdf')} disabled={isExporting} className="flex-1 sm:flex-none justify-center px-4 py-2.5 rounded-xl border border-border/50 bg-background/50 hover:bg-secondary text-sm font-bold shadow-sm transition-all flex items-center gap-2 text-foreground active:scale-95 disabled:opacity-50">
              <FileText className="h-4 w-4 text-rose-500" /> PDF
            </button>
            <button onClick={() => handleExport('excel')} disabled={isExporting} className="flex-1 sm:flex-none justify-center px-5 py-2.5 rounded-xl bg-gradient-indigo text-white text-sm font-bold shadow-md hover:shadow-indigo-500/25 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50">
              {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
              Excel
            </button>
          </div>
        </div>
      </div>

      {/* AI Executive Summary */}
      <div className="rounded-[24px] bg-gradient-to-br from-indigo-500/10 via-primary/5 to-transparent border border-indigo-500/20 p-6 glass shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 bg-indigo-500/20 blur-2xl rounded-full" />
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-indigo-500" />
          <h3 className="font-bold text-lg text-foreground">Executive Insights</h3>
        </div>
        <p className="text-sm text-foreground/80 leading-relaxed font-medium">
          In this period, we conducted <span className="font-bold text-indigo-500">{total} total interviews</span> resulting in a <span className="font-bold text-emerald-500">{successRate}% selection rate</span>. The highest hiring volume is currently driven by <span className="font-bold">{bestCompany}</span>. Overall completion momentum is strong, showing solid pipeline throughput.
        </p>
      </div>

      {/* KPI Cards Stack */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Volume", value: total, icon: Users, color: "text-indigo-500", bg: "bg-indigo-500/10" },
          { label: "Selected", value: passed, icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
          { label: "Rejected", value: failed, icon: XCircle, color: "text-rose-500", bg: "bg-rose-500/10" },
          { label: "Success Rate", value: `${successRate}%`, icon: TrendingUp, color: "text-primary", bg: "bg-primary/10" }
        ].map((kpi, i) => (
          <div key={i} className="p-5 rounded-[24px] bg-card/20 border border-border/50 glass shadow-sm flex flex-col relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4">
              <div className={cn("p-2.5 rounded-[14px]", kpi.bg)}>
                <kpi.icon className={cn("h-5 w-5", kpi.color)} />
              </div>
            </div>
            <div className="space-y-1">
              <h4 className="text-3xl font-extrabold text-foreground">{kpi.value}</h4>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{kpi.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Trend Chart */}
        <div className="lg:col-span-2 p-6 rounded-[24px] bg-card/20 border border-border/50 glass shadow-sm flex flex-col">
          <h3 className="font-bold text-foreground mb-6">Volume Trend</h3>
          <div className="flex-1 min-h-[300px]" ref={trendChartRef}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                <RechartsTooltip contentStyle={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.8)' }} itemStyle={{ color: '#fff' }} />
                <Line type="monotone" dataKey="count" stroke="#4F46E5" strokeWidth={3} dot={{ r: 4, fill: '#4F46E5', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="p-6 rounded-[24px] bg-card/20 border border-border/50 glass shadow-sm flex flex-col">
          <h3 className="font-bold text-foreground mb-6">Status Distribution</h3>
          <div className="flex-1 min-h-[300px] flex items-center justify-center" ref={pieChartRef}>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.8)' }} itemStyle={{ color: '#fff' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <span className="text-sm text-muted-foreground">No data for selected period</span>
            )}
          </div>
        </div>
      </div>

      {/* Detailed Report Table */}
      <div className="rounded-[24px] border border-border/50 glass shadow-sm overflow-hidden bg-card/20 flex flex-col">
        <div className="p-5 border-b border-border/40 bg-secondary/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="font-bold text-foreground">Detailed Ledger</h3>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto mt-3 sm:mt-0">
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input type="text" placeholder="Search records..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2 rounded-xl border border-border/60 bg-background/50 text-sm focus:outline-none focus:border-primary/50" />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full sm:w-auto px-3 py-2 rounded-xl border border-border/60 bg-background/50 text-sm font-medium focus:outline-none">
              <option value="All">All Statuses</option>
              <option value="passed">Passed</option>
              <option value="failed">Failed</option>
              <option value="scheduled">Scheduled</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-secondary/5 text-[11px] font-bold text-muted-foreground uppercase tracking-widest border-b border-border/40">
                <th className="p-4 pl-6">Candidate</th>
                <th className="p-4">Company</th>
                <th className="p-4">Date</th>
                <th className="p-4">Interviewer</th>
                <th className="p-4 pr-6">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 text-sm font-medium text-foreground">
              {filteredInterviews.length > 0 ? (
                filteredInterviews.slice(0, 50).map((item) => (
                  <tr key={item._id} className="hover:bg-background/40 transition-colors">
                    <td className="p-4 pl-6">
                      <div className="font-bold text-[13px]">{item.candidateName}</div>
                      <div className="text-[11px] text-muted-foreground font-mono mt-0.5">{item.role || "N/A"}</div>
                    </td>
                    <td className="p-4 text-muted-foreground">{item.companyName || "N/A"}</td>
                    <td className="p-4">
                      <div className="text-[12px]">{new Date(item.interviewDate).toLocaleDateString()}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{item.startTime}</div>
                    </td>
                    <td className="p-4 text-muted-foreground text-[13px]">{(item as any).interviewerName}</td>
                    <td className="p-4 pr-6">
                      <span className={cn(
                        "px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider",
                        item.status === 'passed' ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" :
                        item.status === 'failed' ? "bg-rose-500/10 text-rose-500 border border-rose-500/20" :
                        "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                      )}>{item.status}</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-muted-foreground text-sm">No records found matching criteria.</td>
                </tr>
              )}
            </tbody>
          </table>
          {filteredInterviews.length > 50 && (
             <div className="p-4 text-center border-t border-border/40 bg-secondary/5 text-xs text-muted-foreground font-bold">
               Showing 50 of {filteredInterviews.length} records. Export to view all.
             </div>
          )}
        </div>
      </div>

    </div>
  );
}
