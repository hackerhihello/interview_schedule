"use client";

import { useEffect, useState } from "react";
import { useUser, SignOutButton } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { SidebarNav } from "@/components/sidebar-nav";
import { Navbar } from "@/components/navbar";
import { Loader2, Sparkles } from "lucide-react";
import { redirect } from "next/navigation";
import { cn } from "@/lib/utils";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoaded: isClerkLoaded, isSignedIn, user } = useUser();
  const syncUser = useMutation(api.users.syncUser);
  const currentUser = useQuery(
    api.users.currentUser,
    user ? { clerkId: user.id } : "skip"
  );
  const [hasSynced, setHasSynced] = useState(false);

  // Sync Clerk User profile to Convex
  useEffect(() => {
    if (!isClerkLoaded || !isSignedIn || !user || hasSynced) return;

    const runSync = async () => {
      try {
        await syncUser({
          clerkId: user.id,
          name: user.fullName || user.username || "Anonymous User",
          email: user.primaryEmailAddress?.emailAddress || "",
          imageUrl: user.imageUrl,
        });
        setHasSynced(true);
      } catch (err) {
        console.error("Failed to sync Clerk profile to Convex:", err);
      }
    };

    runSync();
  }, [isClerkLoaded, isSignedIn, user, syncUser, hasSynced]);

  // Redirect to sign-in if Clerk loaded but user is not signed in
  if (isClerkLoaded && !isSignedIn) {
    redirect("/sign-in");
  }

  // Loading state while Clerk loads OR while waiting for Convex sync and currentUser query response
  const isLoading = !isClerkLoaded || !currentUser;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground transition-all duration-300">
        <div className="relative flex flex-col items-center p-8 rounded-2xl glass shadow-xl border border-border/30 max-w-sm w-full mx-4 text-center animate-fade-in">
          {/* Pulsing branding icon */}
          <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-white shadow-lg mb-6 animate-pulse">
            <img src="/logo.png" className="h-12 w-12 object-contain" alt="Ignited Minds Logo" />
          </div>
          
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Ignited Minds Learning
          </h2>
          <p className="text-sm text-muted-foreground mt-2 mb-6">
            Synchronizing safe secure credentials...
          </p>

          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary/80 border border-border text-xs font-semibold text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span>Establishing session context...</span>
          </div>
        </div>
      </div>
    );
  }

  const isApproved = currentUser.status === "approved" || !currentUser.status;
  const isSuspended = currentUser.status === "suspended";

  // Gatekeeper for Pending / Suspended accounts
  if (!isApproved) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-100 overflow-hidden relative">
        {/* Glow effect background */}
        <div className="absolute top-[-20%] left-[-20%] h-[600px] w-[600px] rounded-full bg-blue-500/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-violet-600/5 blur-[100px]" />

        <div className="relative flex flex-col items-center p-8 rounded-3xl bg-white/[0.02] backdrop-blur-md shadow-2xl border border-white/5 max-w-md w-full mx-4 text-center animate-fade-in">
          <div className={cn(
            "flex items-center justify-center h-16 w-16 rounded-2xl bg-white shadow-lg mb-6",
            isSuspended ? "animate-bounce" : "animate-pulse"
          )}>
            <img src="/logo.png" className="h-12 w-12 object-contain" alt="Ignited Minds Logo" />
          </div>
          
          <h2 className="text-xl font-bold tracking-tight text-foreground bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
            {isSuspended ? "Access Suspended" : "Approval Pending"}
          </h2>
          
          <p className="text-sm text-slate-400 mt-3 mb-8 leading-relaxed">
            {isSuspended
              ? "Your account access has been suspended under ISO operational protocols. Please reach out to your administrator to restore access."
              : "Welcome to Ignited Minds Learning! Your account has been securely registered, but requires administrative approval before you can access the dashboard. Please contact your admin."}
          </p>

          <div className="flex flex-col gap-3 w-full">
            <div className="p-3.5 rounded-xl bg-secondary/35 border border-border text-left">
              <span className="text-[10px] font-bold text-muted-foreground block uppercase tracking-wider">Registered Identity</span>
              <span className="text-xs font-bold text-foreground block mt-0.5 truncate">{currentUser.name}</span>
              <span className="text-[10px] text-muted-foreground block truncate font-mono mt-0.5">{currentUser.email}</span>
            </div>

            <SignOutButton redirectUrl="/sign-in">
              <button className="w-full py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white font-semibold text-xs transition-all active:scale-98">
                Sign Out
              </button>
            </SignOutButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar - Collapsible desktop version */}
      <SidebarNav className="hidden md:flex" />

      {/* Main Panel Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Navbar */}
        <Navbar />

        {/* Dynamic page render layout container */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 bg-gradient-to-br from-background via-background to-secondary/15">
          {children}
        </main>
      </div>
    </div>
  );
}
