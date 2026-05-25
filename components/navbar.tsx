"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { UserButton, useUser } from "@clerk/nextjs";
import { Menu, X, Bell, Search, Sparkles } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { SidebarNav } from "./sidebar-nav";
import { cn } from "@/lib/utils";

export function Navbar() {
  const pathname = usePathname();
  const { user } = useUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

        {/* Right Side: Global Search, Notifications, Theme, Profile */}
        <div className="flex items-center gap-4">
          {/* Quick-search bar mockup */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground hover:border-muted-foreground/30 transition-all text-xs w-60 cursor-not-allowed">
            <Search className="h-3.5 w-3.5" />
            <span>Search scheduled slots...</span>
            <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
              ⌘K
            </kbd>
          </div>

          {/* Notifications visual mock */}
          <button className="p-2.5 rounded-xl bg-secondary/80 hover:bg-secondary border border-border text-foreground transition-all relative hover:scale-105 active:scale-95">
            <Bell className="h-4.5 w-4.5" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary ring-2 ring-background animate-pulse" />
          </button>

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
