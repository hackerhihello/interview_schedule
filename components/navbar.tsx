"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { UserButton, useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Menu, X, Bell, Copy, Check, ExternalLink, UserCheck, Loader2 } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { SidebarNav } from "./sidebar-nav";
import { cn } from "@/lib/utils";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [copiedUserId, setCopiedUserId] = useState<string | null>(null);
  const [approvingUserId, setApprovingUserId] = useState<string | null>(null);

  // Queries & Mutations
  const currentUser = useQuery(
    api.users.currentUser,
    user ? { clerkId: user.id } : "skip"
  );
  
  const pendingUsers = useQuery(
    api.users.getPendingUsers,
    user && currentUser?.role === "admin" ? { clerkId: user.id } : "skip"
  );

  const updateStatus = useMutation(api.users.updateStatus);

  const isAdmin = currentUser?.role === "admin";
  const pendingCount = isAdmin ? (pendingUsers?.length || 0) : 0;

  // Filter pending users inside dropdown
  const filteredPending = pendingUsers;

  const handleCopyEmail = async (e: React.MouseEvent, email: string, userId: string) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(email);
      setCopiedUserId(userId);
      setTimeout(() => setCopiedUserId(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleApprove = async (e: React.MouseEvent, userId: any) => {
    e.stopPropagation();
    setApprovingUserId(userId);
    try {
      await updateStatus({
        userId,
        status: "approved",
        clerkId: user?.id,
      });
    } catch (err) {
      console.error("Failed to approve user:", err);
      alert("Failed to approve user");
    } finally {
      setApprovingUserId(null);
    }
  };

  const handleUserRedirect = (email: string) => {
    setIsNotifOpen(false);
    router.push(`/dashboard/users?search=${encodeURIComponent(email)}`);
  };


  // Format Page Name based on Pathname
  const getPageTitle = () => {
    if (pathname === "/dashboard") return "Overview Dashboard";
    if (pathname === "/dashboard/interviews") return "Interviews Schedule";
    if (pathname === "/dashboard/calendar") return "Interactive Calendar";
    if (pathname === "/dashboard/users") return "User Access Management";
    if (pathname === "/dashboard/activity") return "Activity Audit Trail";
    return "Ignited Minds Learning";
  };

  return (
    <>
      <header className="sticky top-0 h-20 px-6 md:px-8 flex items-center justify-between border-b border-border bg-background/50 backdrop-blur-md z-10 transition-all duration-300">
        {/* Left Side: Mobile Menu Button & Breadcrumb */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden p-2 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground border border-border transition-all active:scale-95"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          
          <div className="hidden sm:block">
            <h1 className="text-xl font-bold tracking-tight text-foreground transition-all duration-300">
              {getPageTitle()}
            </h1>
          </div>
          
          {/* Small visual accent for brand identification on extra small screens */}
          <div className="sm:hidden flex items-center gap-1.5 font-bold text-sm text-foreground">
            <img src="/logo.png" className="h-5 w-5 object-contain" alt="Ignited Minds Logo" />
            <span className="bg-gradient-to-tr from-primary to-indigo-500 text-transparent bg-clip-text">Ignited Minds</span>
          </div>
        </div>

        {/* Right Side: Notifications, Theme, Profile */}
        <div className="flex items-center gap-4">

          {/* Real-time Notifications Popover */}
          <div className="relative">
            <button
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="p-2.5 rounded-xl bg-secondary/80 hover:bg-secondary border border-border text-foreground transition-all relative hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center"
              aria-label="View notifications"
            >
              <Bell className="h-4.5 w-4.5" />
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-[9px] font-bold text-white flex items-center justify-center ring-2 ring-background animate-pulse">
                  {pendingCount}
                </span>
              )}
            </button>

            {isNotifOpen && (
              <>
                {/* Transparent overlay backdrop to close dropdown on click outside */}
                <div
                  className="fixed inset-0 z-40 bg-transparent"
                  onClick={() => setIsNotifOpen(false)}
                />
                
                {/* Dropdown Card */}
                <div className="absolute right-0 mt-3 w-80 sm:w-[380px] bg-card/95 backdrop-blur-md border border-border rounded-2xl shadow-xl z-50 overflow-hidden animate-fade-in origin-top-right transition-all">
                  {/* Header */}
                  <div className="p-4 border-b border-border bg-secondary/15 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-foreground">Access Requests</h3>
                      {pendingCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20 text-[10px] font-bold">
                          {pendingCount} Pending
                        </span>
                      )}
                    </div>
                    {pendingCount > 0 && (
                      <button
                        onClick={() => handleUserRedirect("")}
                        className="text-[10px] font-bold uppercase tracking-wider text-primary hover:underline flex items-center gap-1 cursor-pointer bg-transparent border-0"
                      >
                        <span>Manage All</span>
                        <ExternalLink className="h-3 w-3" />
                      </button>
                    )}
                  </div>


                  {/* List Content */}
                  <div className="max-h-[320px] overflow-y-auto divide-y divide-border/60">
                    {!isAdmin ? (
                      <div className="p-8 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
                        <Bell className="h-8 w-8 text-muted-foreground/45" />
                        <span>No pending user alerts for non-admin accounts.</span>
                      </div>
                    ) : !pendingUsers ? (
                      <div className="p-8 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        <span>Retrieving registrations...</span>
                      </div>
                    ) : filteredPending && filteredPending.length > 0 ? (
                      filteredPending.map((pUser) => (
                        <div
                          key={pUser._id}
                          onClick={() => handleUserRedirect(pUser.email)}
                          className="p-3.5 hover:bg-secondary/20 flex items-center justify-between gap-3 transition-all duration-200 cursor-pointer group"
                        >
                          {/* Left: Avatar & Name */}
                          <div className="flex items-center gap-2.5 min-w-0">
                            {pUser.imageUrl ? (
                              <img
                                src={pUser.imageUrl}
                                alt={pUser.name}
                                className="h-8 w-8 rounded-lg object-cover ring-2 ring-primary/5 shrink-0"
                              />
                            ) : (
                              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-primary text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                                {pUser.name.substring(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">
                                {pUser.name}
                              </h4>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[10px] text-muted-foreground truncate font-mono">
                                  {pUser.email}
                                </span>
                                <button
                                  onClick={(e) => handleCopyEmail(e, pUser.email, pUser._id)}
                                  className="p-1 rounded hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-all cursor-pointer bg-transparent border-0"
                                  title="Copy Email"
                                >
                                  {copiedUserId === pUser._id ? (
                                    <Check className="h-3 w-3 text-emerald-500" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Right: Approve Button */}
                          <button
                            onClick={(e) => handleApprove(e, pUser._id)}
                            disabled={approvingUserId === pUser._id}
                            className="h-8 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-bold text-[10px] uppercase tracking-wider shadow-sm flex items-center justify-center gap-1.5 shrink-0 transition-all cursor-pointer border-0"
                          >
                            {approvingUserId === pUser._id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <>
                                <UserCheck className="h-3.5 w-3.5" />
                                <span>Approve</span>
                              </>
                            )}
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2">
                        {/* Company logo or visual decoration */}
                        <img src="/logo.png" className="h-8 w-8 object-contain opacity-55 animate-pulse" alt="Logo" />
                        <span className="font-semibold text-foreground">All Caught Up!</span>
                        <span className="text-[10px] text-muted-foreground/80 leading-relaxed px-4">
                          All registered user accounts are currently approved and active.
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  {isAdmin && pendingCount > 0 && (
                    <div className="p-3 border-t border-border bg-secondary/10 text-center">
                      <button
                        onClick={() => handleUserRedirect("")}
                        className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-all flex items-center justify-center gap-1.5 w-full py-1 cursor-pointer bg-transparent border-0"
                      >
                        <span>Audit User Access Directory</span>
                        <ExternalLink className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Light/Dark Toggle */}
          <ThemeToggle />

          {/* Clerk Profile Avatar */}
          <div className="flex items-center gap-2 pl-2 border-l border-border h-8">
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "h-9 w-9 rounded-xl border border-border shadow-sm ring-primary/10",
                },
              }}
            />
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Overlay Drawer */}
      <div
        className={cn(
          "fixed inset-0 bg-background/80 backdrop-blur-sm z-50 transition-opacity duration-300 md:hidden",
          isMobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsMobileMenuOpen(false)}
      >
        <div
          className={cn(
            "fixed inset-y-0 left-0 w-72 bg-background border-r border-border shadow-2xl transition-transform duration-300 ease-out transform",
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Drawer Header with Close Button */}
          <div className="absolute top-5 right-5 z-50">
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground border border-border transition-all active:scale-95"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
          {/* Actual Sidebar Content */}
          <SidebarNav className="w-full border-r-0" />
        </div>
      </div>
    </>
  );
}
