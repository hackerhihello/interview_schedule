"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { SignOutButton, useUser } from "@clerk/nextjs";
import {
  LayoutDashboard,
  CalendarDays,
  Calendar,
  Users,
  History,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Search,
  Bell,
  Settings,
  PieChart
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarNavProps {
  className?: string;
  onNavigate?: () => void;
}

export function SidebarNav({ className, onNavigate }: SidebarNavProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user } = useUser();
  const currentUser = useQuery(
    api.users.currentUser,
    user ? { clerkId: user.id } : "skip"
  );

  const role = currentUser?.role || "user";
  const name = currentUser?.name || "Loading...";
  const email = currentUser?.email || "";
  const imageUrl = currentUser?.imageUrl;

  const links = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      href: "/dashboard",
      role: "all",
    },
    {
      label: "Interviews",
      icon: CalendarDays,
      href: "/dashboard/interviews",
      role: "all",
    },
    {
      label: "Calendar",
      icon: Calendar,
      href: "/dashboard/calendar",
      role: "all",
    },
    {
      label: "Manage Users",
      icon: Users,
      href: "/dashboard/users",
      role: "admin",
    },
    {
      label: "Audit Logs",
      icon: History,
      href: "/dashboard/activity",
      role: "admin",
    },
    {
      label: "Reports & Analytics",
      icon: PieChart,
      href: "/dashboard/reports",
      role: "admin",
    },
  ];

  const filteredLinks = links.filter(
    (link) => link.role === "all" || (link.role === "admin" && role === "admin")
  );

  return (
    <div
      className={cn(
        "relative flex flex-col h-screen glass border-r-0 transition-all duration-300 ease-in-out z-30 shadow-[4px_0_24px_rgba(0,0,0,0.02)] dark:shadow-[4px_0_24px_rgba(0,0,0,0.2)]",
        isCollapsed ? "w-20" : "w-64",
        className
      )}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between h-20 px-6 border-b border-border/40">
        <Link href="/dashboard" className="flex items-center gap-3 overflow-hidden">
          <div className="flex items-center justify-center h-9 w-9 shrink-0 rounded-xl overflow-hidden bg-gradient-indigo shadow-md shadow-indigo-500/20 text-white">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M12 2L2 7l10 5 10-5-10-5Z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
          </div>
          {!isCollapsed && (
            <span className="font-bold text-lg bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent truncate animate-fade-in tracking-tight">
              Ignited Minds
            </span>
          )}
        </Link>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="hidden md:flex absolute top-20 -right-3.5 h-7 w-7 items-center justify-center rounded-full border border-border/50 bg-card text-muted-foreground hover:text-foreground shadow-sm hover:shadow-md hover:scale-105 active:scale-95 transition-all z-40"
      >
        {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>

      {/* Nav Links */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        <div className={cn("text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider mb-4 px-2", isCollapsed ? "text-center" : "")}>
          {isCollapsed ? "•••" : "Menu"}
        </div>
        
        {filteredLinks.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;

          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3.5 px-3 py-2.5 rounded-[14px] font-medium text-sm transition-all duration-200 group relative",
                isActive
                  ? "bg-primary/10 text-primary dark:bg-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
              )}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
              )}
              <Icon
                className={cn(
                  "h-5 w-5 shrink-0 transition-transform duration-200",
                  isActive ? "text-primary" : "group-hover:scale-110 group-hover:text-foreground"
                )}
              />
              {!isCollapsed && <span className="animate-fade-in tracking-wide">{link.label}</span>}
              {isCollapsed && (
                <div className="absolute left-16 scale-0 rounded-lg px-3 py-1.5 bg-foreground text-background text-xs font-semibold shadow-xl transition-all group-hover:scale-100 whitespace-nowrap z-50">
                  {link.label}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer Profile Details */}
      <div className="p-4 border-t border-border/40">
        <div
          className={cn(
            "flex items-center gap-3 p-2 rounded-[16px] transition-all cursor-pointer hover:bg-secondary/50",
            isCollapsed ? "justify-center p-0 mb-3" : "mb-3"
          )}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={name}
              className="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-border hover:ring-primary/50 transition-all"
            />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-indigo text-white font-semibold text-sm shadow-md">
              {name.substring(0, 2).toUpperCase()}
            </div>
          )}

          {!isCollapsed && (
            <div className="flex-1 min-w-0 animate-fade-in">
              <h4 className="font-semibold text-sm text-foreground truncate">{name}</h4>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[9px] font-bold uppercase tracking-wider text-primary px-1.5 py-0.5 bg-primary/10 rounded-md">
                  {role}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className={cn("flex gap-2", isCollapsed ? "flex-col" : "flex-row")}>
          {!isCollapsed && (
            <button className="flex-1 flex items-center justify-center py-2.5 rounded-xl border border-border/50 bg-background/50 hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-all">
              <Settings className="h-4 w-4" />
            </button>
          )}
          <SignOutButton redirectUrl="/sign-in">
            <button
              className={cn(
                "flex items-center justify-center py-2.5 rounded-xl border border-border/50 bg-background/50 hover:bg-destructive/10 hover:border-destructive/30 text-muted-foreground hover:text-destructive transition-all",
                isCollapsed ? "w-10 h-10" : "flex-1"
              )}
            >
              <LogOut className="h-4 w-4 shrink-0" />
            </button>
          </SignOutButton>
        </div>
      </div>
    </div>
  );
}
