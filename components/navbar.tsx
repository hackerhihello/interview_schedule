"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { UserButton, useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Menu, X, Bell, Copy, Check, ExternalLink, UserCheck, Loader2, Search, Command } from "lucide-react";
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

  const prevRequestedCount = useRef(0);
  const usersWhoRequested = pendingUsers?.filter(u => u.hasRequestedAccess) || [];
  const currentRequestedCount = usersWhoRequested.length;

  useEffect(() => {
    if (isAdmin && currentRequestedCount > prevRequestedCount.current) {
      toast.info("New Access Request", {
        description: "A user has requested access to the platform.",
        action: {
          label: "Review",
          onClick: () => setIsNotifOpen(true)
        }
      });
    }
    prevRequestedCount.current = currentRequestedCount;
  }, [currentRequestedCount, isAdmin]);

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

  const handleApprove = async (e: React.MouseEvent, userId: string | any) => {
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
    if (pathname === "/dashboard") return "Overview";
    if (pathname === "/dashboard/interviews") return "Interviews";
    if (pathname === "/dashboard/calendar") return "Calendar";
    if (pathname === "/dashboard/users") return "User Management";
    if (pathname === "/dashboard/activity") return "Audit Logs";
    return "Ignited Minds";
  };

  return (
    <>
      <header className="sticky top-0 h-[72px] px-6 md:px-8 flex items-center justify-between border-b border-border/40 glass z-10 transition-all duration-300">
        {/* Left Side: Mobile Menu Button & Breadcrumb */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden p-2 rounded-xl bg-background/50 hover:bg-secondary border border-border/50 transition-all active:scale-95"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5 text-muted-foreground" />
          </button>
          
          <div className="hidden sm:block">
            <h1 className="text-xl font-bold tracking-tight text-foreground transition-all duration-300 capitalize">
              {getPageTitle()}
            </h1>
          </div>
          
          {/* Small visual accent for brand identification on extra small screens */}
          <div className="sm:hidden flex items-center gap-2 font-bold text-sm text-foreground">
            <div className="h-6 w-6 rounded flex items-center justify-center bg-gradient-indigo text-white shadow-sm">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M12 2L2 7l10 5 10-5-10-5Z"/></svg>
            </div>
            <span className="bg-gradient-to-tr from-primary to-secondary text-transparent bg-clip-text">Ignited Minds</span>
          </div>
        </div>

        {/* Center: Command Palette Placeholder (Desktop) */}
        <div className="hidden lg:flex flex-1 max-w-md mx-8">
          <div className="relative w-full group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Search anything..."
              className="w-full h-10 pl-10 pr-12 rounded-xl bg-background/50 border border-border/60 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all outline-none text-sm placeholder:text-muted-foreground/60 shadow-sm"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <kbd className="hidden xl:inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-border bg-muted/50 text-[10px] font-medium text-muted-foreground">
                <Command className="h-3 w-3" /> K
              </kbd>
            </div>
          </div>
        </div>

        {/* Right Side: Notifications, Theme, Profile */}
        <div className="flex items-center gap-3">
          
          <button className="lg:hidden p-2.5 rounded-full hover:bg-secondary/60 text-muted-foreground hover:text-foreground transition-all">
            <Search className="h-4.5 w-4.5" />
          </button>

          {/* Real-time Notifications Popover */}
          <div className="relative">
            <button
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="p-2.5 rounded-full hover:bg-secondary/60 text-muted-foreground hover:text-foreground transition-all relative active:scale-95 cursor-pointer flex items-center justify-center"
              aria-label="View notifications"
            >
              <Bell className="h-4.5 w-4.5" />
              {pendingCount > 0 && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive ring-2 ring-background animate-pulse" />
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
                <div className="fixed sm:absolute top-[72px] sm:top-auto left-4 right-4 sm:left-auto sm:right-0 mt-2 sm:mt-3 sm:w-[380px] bg-card/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-[0_8px_40px_-12px_rgba(0,0,0,0.1)] dark:shadow-[0_8px_40px_-12px_rgba(0,0,0,0.5)] z-50 overflow-hidden animate-slide-up sm:origin-top-right transition-all">
                  {/* Header */}
                  <div className="p-4 border-b border-border/40 bg-secondary/10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-foreground">Access Requests</h3>
                      {pendingCount > 0 && (
                        <span className="px-2 py-0.5 rounded-md bg-destructive/10 text-destructive text-[10px] font-bold">
                          {pendingCount} Pending
                        </span>
                      )}
                    </div>
                    {pendingCount > 0 && (
                      <button
                        onClick={() => handleUserRedirect("")}
                        className="text-[10px] font-bold uppercase tracking-wider text-primary hover:underline flex items-center gap-1 cursor-pointer bg-transparent border-0"
                      >
                        <span>Manage</span>
                      </button>
                    )}
                  </div>


                  {/* List Content */}
                  <div className="max-h-[320px] overflow-y-auto">
                    {!isAdmin ? (
                      <div className="p-8 text-center text-xs text-muted-foreground flex flex-col items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-secondary/50 flex items-center justify-center">
                          <Bell className="h-5 w-5 text-muted-foreground/60" />
                        </div>
                        <span>No pending alerts.</span>
                      </div>
                    ) : !pendingUsers ? (
                      <div className="p-8 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        <span>Loading...</span>
                      </div>
                    ) : filteredPending && filteredPending.length > 0 ? (
                      <div className="p-2 space-y-1">
                        {filteredPending.map((pUser) => (
                          <div
                            key={pUser._id}
                            onClick={() => handleUserRedirect(pUser.email)}
                            className="p-3 rounded-xl hover:bg-secondary/40 flex items-center justify-between gap-3 transition-all duration-200 cursor-pointer group"
                          >
                            {/* Left: Avatar & Name */}
                            <div className="flex items-center gap-3 min-w-0">
                              {pUser.imageUrl ? (
                                <img
                                  src={pUser.imageUrl}
                                  alt={pUser.name}
                                  className="h-9 w-9 rounded-full object-cover ring-1 ring-border shrink-0"
                                />
                              ) : (
                                <div className="h-9 w-9 rounded-full bg-gradient-indigo text-white font-bold text-xs flex items-center justify-center shrink-0">
                                  {pUser.name.substring(0, 2).toUpperCase()}
                                </div>
                              )}
                              <div className="min-w-0">
                                <h4 className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                                  {pUser.name}
                                </h4>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="text-[11px] text-muted-foreground truncate font-mono">
                                    {pUser.email}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Right: Approve Button */}
                            <button
                              onClick={(e) => handleApprove(e, pUser._id)}
                              disabled={approvingUserId === pUser._id}
                              className="h-8 px-3 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs shadow-sm flex items-center justify-center gap-1.5 shrink-0 transition-all cursor-pointer border-0"
                            >
                              {approvingUserId === pUser._id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <>Approve</>
                              )}
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                          <Check className="h-5 w-5 text-emerald-500" />
                        </div>
                        <span className="font-semibold text-foreground">All Caught Up!</span>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Light/Dark Toggle */}
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>

          {/* Clerk Profile Avatar */}
          <div className="flex items-center gap-2 pl-3 border-l border-border/40">
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "h-9 w-9 rounded-full border border-border shadow-sm ring-2 ring-transparent hover:ring-primary/20 transition-all",
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
            "fixed inset-y-0 left-0 w-72 bg-card border-r border-border shadow-2xl transition-transform duration-300 ease-out transform",
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Drawer Header with Close Button */}
          <div className="absolute top-5 right-5 z-50">
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 rounded-full hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-all"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          {/* Actual Sidebar Content */}
          <SidebarNav 
            className="w-full border-r-0" 
            onNavigate={() => setIsMobileMenuOpen(false)} 
          />
        </div>
      </div>
    </>
  );
}
