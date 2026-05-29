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
      label: "Activity Audit",
      icon: History,
      href: "/dashboard/activity",
      role: "admin",
    },
  ];

  const filteredLinks = links.filter(
    (link) => link.role === "all" || (link.role === "admin" && role === "admin")
  );

  return (
    <div
      className={cn(
        "relative flex flex-col h-screen bg-card/60 dark:bg-card/30 border-r border-border backdrop-blur-md transition-all duration-300 ease-in-out z-20",
        isCollapsed ? "w-20" : "w-64",
        className
      )}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between h-20 px-6 border-b border-border">
        <Link href="/dashboard" className="flex items-center gap-2.5 overflow-hidden">
          <div className="flex items-center justify-center h-10 w-10 shrink-0 rounded-xl overflow-hidden bg-white shadow-md">
            <img src="/logo.png" className="h-8 w-8 object-contain" alt="Ignited Minds Logo" />
          </div>
          {!isCollapsed && (
            <span className="font-bold text-lg bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent truncate animate-fade-in">
              Ignited Minds <span className="text-primary font-medium text-sm">Learning</span>
            </span>
          )}
        </Link>
      </div>

      {/* Collapse Toggle (Desktop only) */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="hidden md:flex absolute top-22 -right-3.5 h-7 w-7 items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:text-foreground shadow-sm hover:scale-105 active:scale-95 transition-all z-30"
      >
        {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>

      {/* Nav Links */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {filteredLinks.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;

          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3.5 px-3.5 py-3 rounded-xl font-medium text-sm transition-all duration-200 group relative",
                isActive
                  ? "bg-primary text-white shadow-md shadow-primary/25"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5 shrink-0 transition-transform duration-200",
                  !isActive && "group-hover:scale-110"
                )}
              />
              {!isCollapsed && <span className="animate-fade-in">{link.label}</span>}
              {isCollapsed && (
                <div className="absolute left-16 scale-0 rounded-lg px-2.5 py-1.5 bg-foreground text-background text-xs font-semibold shadow-md transition-all group-hover:scale-100 whitespace-nowrap z-50">
                  {link.label}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer Profile Details */}
      <div className="p-4 border-t border-border bg-secondary/20">
        <div
          className={cn(
            "flex items-center gap-3.5 p-2 rounded-xl border border-transparent transition-all",
            !isCollapsed && "hover:bg-secondary/40"
          )}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={name}
              className="h-9 w-9 shrink-0 rounded-lg object-cover ring-2 ring-primary/10"
            />
          ) : (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-primary text-white font-semibold text-sm">
              {name.substring(0, 2).toUpperCase()}
            </div>
          )}

          {!isCollapsed && (
            <div className="flex-1 min-w-0 animate-fade-in">
              <h4 className="font-semibold text-sm text-foreground truncate">{name}</h4>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary px-1.5 py-0.5 bg-primary/10 rounded">
                  {role}
                </span>
                <span className="text-[10px] text-muted-foreground truncate">{email}</span>
              </div>
            </div>
          )}
        </div>

        {/* Sign Out Button */}
        <div className="mt-3">
          <SignOutButton redirectUrl="/sign-in">
            <button
              className={cn(
                "flex items-center justify-center gap-3.5 w-full px-3.5 py-2.5 rounded-xl border border-border bg-card/50 hover:bg-destructive/10 hover:border-destructive/30 text-muted-foreground hover:text-destructive font-medium text-xs transition-all duration-200 active:scale-98",
                isCollapsed ? "px-0" : ""
              )}
            >
              <LogOut className="h-4 w-4 shrink-0" />
              {!isCollapsed && <span className="animate-fade-in">Sign Out</span>}
            </button>
          </SignOutButton>
        </div>
      </div>
    </div>
  );
}
