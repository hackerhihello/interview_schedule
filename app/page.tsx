import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  Shield,
  Layers,
  ArrowRight,
  ChevronRight,
  TrendingUp,
  BarChart,
  Grid,
} from "lucide-react";

export default async function HomePage() {
  // Check if already authenticated on server, redirect to dashboard immediately if true
  const authSession = await auth();
  if (authSession?.userId) {
    redirect("/dashboard");
  }

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between overflow-hidden">
      {/* Visual background gradient accent glows */}
      <div className="absolute top-[-10%] left-[-20%] h-[600px] w-[600px] rounded-full bg-blue-500/10 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-violet-600/10 blur-[100px]" />

      {/* Header Navbar */}
      <header className="sticky top-0 w-full px-6 md:px-12 h-20 border-b border-white/5 bg-slate-950/45 backdrop-blur-md flex items-center justify-between z-50">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center h-10 w-10 rounded-xl overflow-hidden bg-white shadow-md">
            <img src="/logo.png" className="h-8 w-8 object-contain" alt="Ignited Minds Logo" />
          </div>
          <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
            Ignited Minds <span className="text-blue-500 font-medium text-sm">Learning</span>
          </span>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/sign-in"
            className="text-xs font-semibold text-slate-300 hover:text-white transition-all"
          >
            Sign In
          </Link>
          <Link
            href="/sign-up"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-slate-950 font-bold text-xs shadow-md transition-all hover:bg-slate-200 active:scale-95"
          >
            <span>Register Free</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 md:px-12 py-16 md:py-24 max-w-6xl mx-auto z-10 space-y-12">
        
        {/* Intro Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm text-xs text-blue-400 font-semibold animate-pulse">
          <img src="/logo.png" className="h-3.5 w-3.5 object-contain animate-spin" style={{ animationDuration: '3s' }} alt="Ignited Minds Logo" />
          <span>Next-Generation Interview Platforms</span>
        </div>

        {/* Catchy headline */}
        <div className="space-y-4 max-w-3xl">
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.1] bg-gradient-to-b from-slate-50 via-slate-100 to-slate-400 bg-clip-text text-transparent">
            Coordinate Interviews Without Friction
          </h1>
          <p className="text-sm sm:text-lg text-slate-400 max-w-xl mx-auto leading-relaxed">
            A secure full-stack platform built on Next.js 16, Convex database speed, and Clerk roles access to allocate and execute recruitment assessments seamlessly.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
          <Link
            href="/sign-up"
            className="flex items-center justify-center gap-2.5 w-full sm:w-56 py-3.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold text-sm shadow-lg shadow-blue-500/20 transition-all hover:shadow-blue-500/35 active:scale-98"
          >
            <span>Get Started Immediately</span>
            <ArrowRight className="h-4.5 w-4.5" />
          </Link>

          <Link
            href="/sign-in"
            className="flex items-center justify-center gap-2 w-full sm:w-56 py-3.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white font-semibold text-sm transition-all active:scale-98"
          >
            <span>Administrator Access</span>
          </Link>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full pt-12">
          <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-sm text-left space-y-3.5 hover:border-blue-500/20 transition-all">
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
              <Calendar className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-md text-slate-100">Interactive Schedulers</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Plan and allocate rounds in clean visual lists or monthly calendar grids with one-click status filters.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-sm text-left space-y-3.5 hover:border-violet-500/20 transition-all">
            <div className="h-10 w-10 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center border border-violet-500/20">
              <Shield className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-md text-slate-100">Role-Based Protection</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Administrators control all schedules, view audits, and promote users, while standard interviewers manage only their own.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-sm text-left space-y-3.5 hover:border-indigo-500/20 transition-all">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
              <Layers className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-md text-slate-100">Convex Execution Speed</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Real-time database queries, batch profile bindings, audit timelines, and CSV reports compile instantly.
            </p>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="w-full py-6 border-t border-white/5 text-center text-[10px] text-slate-500 bg-slate-950 z-10">
        <span>© 2026 Ignited Minds Learning. Designed for premium scheduling operations under strict ISO constraints.</span>
      </footer>
    </div>
  );
}
