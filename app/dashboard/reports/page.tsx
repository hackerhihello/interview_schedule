"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import {
  FileSpreadsheet, FileText, PieChartIcon, Loader2, Settings, Save, Mail, Phone
} from "lucide-react";
import { exportToExcel } from "@/lib/excel-export";
import { exportToPDF } from "@/lib/pdf-export";
import { toast } from "sonner";

export default function ReportsPage() {
  const { user } = useUser();
  const reportData = useQuery(
    api.reports.getReportData,
    user ? { clerkId: user.id } : "skip"
  );
  const settingsData = useQuery(api.reports.getSettings);
  const saveSettings = useMutation(api.reports.saveSettings);

  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  
  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [emailTo, setEmailTo] = useState("");
  const [whatsappTo, setWhatsappTo] = useState("");

  useEffect(() => {
    if (settingsData) {
      setEmailTo(settingsData.emailTo || "");
      setWhatsappTo(settingsData.whatsappTo || "");
    }
  }, [settingsData]);

  if (reportData === undefined || settingsData === undefined) {
    return (
      <div className="h-[60vh] w-full flex flex-col items-center justify-center space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary" />
        <p className="text-sm text-muted-foreground font-medium animate-pulse">Loading Reports & Settings...</p>
      </div>
    );
  }

  // Date Filtering
  const filteredInterviews = reportData?.interviews?.filter((i: any) => {
    const iDate = new Date(i.interviewDate).toISOString().split('T')[0];
    return iDate >= dateRange.start && iDate <= dateRange.end;
  }) || [];

  const total = filteredInterviews.length;
  const completed = filteredInterviews.filter((i: any) => i.status === "completed" || i.status === "passed" || i.status === "failed").length;
  const passed = filteredInterviews.filter((i: any) => i.status === "passed").length;
  const failed = filteredInterviews.filter((i: any) => i.status === "failed").length;
  const successRate = completed > 0 ? Math.round((passed / completed) * 100) : 0;

  const handleExport = async (type: 'excel' | 'pdf') => {
    setIsExporting(true);
    try {
      const exportData = {
        total, completed, passed, failed, successRate,
        interviews: filteredInterviews
      };

      if (type === 'excel') {
        await exportToExcel(exportData, {}, dateRange);
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

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await saveSettings({ emailTo, whatsappTo });
      toast.success("Automation settings saved successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto pb-12">
      
      {/* Header & Export Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-card/10 p-6 rounded-[24px] glass border-border/40 shadow-sm">
        <div className="space-y-1">
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
            <PieChartIcon className="h-8 w-8 text-primary" />
            Monthly Reports
          </h2>
          <p className="text-sm text-muted-foreground font-medium">
            Generate and download monthly interview reports.
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
              <FileText className="h-4 w-4 text-rose-500" /> Download PDF
            </button>
            <button onClick={() => handleExport('excel')} disabled={isExporting} className="flex-1 sm:flex-none justify-center px-5 py-2.5 rounded-xl bg-gradient-indigo text-white text-sm font-bold shadow-md hover:shadow-indigo-500/25 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50">
              {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
              Download Excel
            </button>
          </div>
        </div>
      </div>

      {/* Automation Settings */}
      <div className="bg-card/10 p-6 rounded-[24px] glass border-border/40 shadow-sm space-y-6">
        <div className="flex items-center gap-3 border-b border-border/40 pb-4">
          <Settings className="h-6 w-6 text-primary" />
          <h3 className="text-xl font-bold text-foreground">Automation Settings</h3>
        </div>
        
        <p className="text-sm text-muted-foreground font-medium">
          Configure where the automated monthly reports are sent. The report runs on the 1st of every month.
        </p>

        <div className="grid sm:grid-cols-2 gap-6 max-w-4xl">
          <div className="space-y-2">
            <label className="text-sm font-bold flex items-center gap-2 text-foreground">
              <Mail className="h-4 w-4 text-muted-foreground" />
              Target Email Address
            </label>
            <input 
              type="email" 
              placeholder="e.g. admin@ignitedminds.com"
              value={emailTo}
              onChange={(e) => setEmailTo(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-border/60 bg-background/50 text-sm focus:outline-none focus:border-primary/50"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold flex items-center gap-2 text-foreground">
              <Phone className="h-4 w-4 text-muted-foreground" />
              Target WhatsApp Number
            </label>
            <input 
              type="text" 
              placeholder="e.g. whatsapp:+1234567890"
              value={whatsappTo}
              onChange={(e) => setWhatsappTo(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-border/60 bg-background/50 text-sm focus:outline-none focus:border-primary/50"
            />
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button 
            onClick={handleSaveSettings} 
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-md hover:bg-primary/90 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Configuration
          </button>
        </div>
      </div>

    </div>
  );
}
