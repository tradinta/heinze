"use client";

import React, { useState, useEffect } from "react";
import Sidebar, { AdminTab } from "@/components/admin/Sidebar";
import Navbar from "@/components/admin/Navbar";
import OverviewTab from "@/components/admin/OverviewTab";
import AnalyticsTab from "@/components/admin/AnalyticsTab";
import BooksTab from "@/components/admin/BooksTab";
import ArticlesTab from "@/components/admin/ArticlesTab";
import LogsTab from "@/components/admin/LogsTab";
import SettingsTab from "@/components/admin/SettingsTab";
import ProfileTab from "@/components/admin/ProfileTab";
import CrashesTab from "@/components/admin/CrashesTab";

export default function AdminPage() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [collapsed, setCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [tabChanging, setTabChanging] = useState(false);

  // Sync tab with URL search parameter
  useEffect(() => {
    setMounted(true);
    const getTabFromUrl = () => {
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const tab = params.get("tab") as AdminTab;
        if (tab) {
          // Verify tab is a valid AdminTab
          const validTabs: string[] = [
            "overview",
            "analytics_overview",
            "analytics_articles",
            "analytics_books",
            "books",
            "articles",
            "logs",
            "crashes",
            "settings",
            "profile"
          ];
          if (validTabs.includes(tab)) {
            setActiveTab(tab);
          }
        }
      }
    };

    getTabFromUrl();
    window.addEventListener("popstate", getTabFromUrl);
    return () => window.removeEventListener("popstate", getTabFromUrl);
  }, []);

  // Trigger loading skeleton on tab change
  useEffect(() => {
    if (!mounted) return;
    setTabChanging(true);
    const timer = setTimeout(() => {
      setTabChanging(false);
    }, 350);
    return () => clearTimeout(timer);
  }, [activeTab, mounted]);

  const handleTabChange = (newTab: AdminTab) => {
    if (newTab === activeTab) return;
    setActiveTab(newTab);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", newTab);
      window.history.pushState(null, "", url.pathname + url.search);
    }
  };

  const handleProfileUpdated = () => {
    // Notify Navbar and other views that the author metadata has changed
    window.dispatchEvent(new Event("profileUpdated"));
  };

  if (!mounted) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-background font-mono text-xs text-zinc-500">
        Authenticating Console...
      </div>
    );
  }

  // Render correct tab component
  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return <OverviewTab />;
      case "analytics_overview":
        return <AnalyticsTab searchQuery={searchQuery} activeView="overview" />;
      case "analytics_articles":
        return <AnalyticsTab searchQuery={searchQuery} activeView="articles" />;
      case "analytics_books":
        return <AnalyticsTab searchQuery={searchQuery} activeView="books" />;
      case "books":
        return <BooksTab searchQuery={searchQuery} />;
      case "articles":
        return <ArticlesTab searchQuery={searchQuery} />;
      case "logs":
        return <LogsTab searchQuery={searchQuery} />;
      case "crashes":
        return <CrashesTab searchQuery={searchQuery} />;
      case "settings":
        return <SettingsTab />;
      case "profile":
        return <ProfileTab onProfileUpdated={handleProfileUpdated} />;
      default:
        return <OverviewTab />;
    }
  };

  // Modern dashboard-style loading skeleton
  const renderSkeletonContent = () => {
    return (
      <div className="space-y-6 font-mono text-xs select-none">
        <div className="border border-border/80 bg-card-bg/30 p-6 space-y-6 animate-fadeIn">
          {/* Header skeleton */}
          <div className="flex justify-between items-center border-b border-border/40 pb-4">
            <div className="h-5 bg-zinc-800/10 dark:bg-zinc-200/5 animate-pulse w-1/4" />
            <div className="h-8 bg-zinc-800/10 dark:bg-zinc-200/5 animate-pulse w-24" />
          </div>

          {/* Cards skeleton grid */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="border border-border/30 p-4 space-y-3 bg-background/20">
                <div className="h-3 bg-zinc-800/10 dark:bg-zinc-200/5 animate-pulse w-1/2" />
                <div className="h-6 bg-zinc-800/10 dark:bg-zinc-200/5 animate-pulse w-2/3" />
              </div>
            ))}
          </div>

          {/* Graphic block skeleton */}
          <div className="h-64 border border-border/30 bg-background/10 animate-pulse flex items-center justify-center">
            <div className="text-zinc-500 font-bold uppercase tracking-widest text-[9px] animate-pulse">
              Buffering view telemetry...
            </div>
          </div>

          {/* Rows skeleton */}
          <div className="space-y-2.5">
            <div className="h-10 bg-zinc-800/10 dark:bg-zinc-200/5 animate-pulse w-full border border-border/30" />
            <div className="h-10 bg-zinc-800/10 dark:bg-zinc-200/5 animate-pulse w-full border border-border/30" />
            <div className="h-10 bg-zinc-800/10 dark:bg-zinc-200/5 animate-pulse w-full border border-border/30" />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 min-h-screen flex bg-background text-foreground transition-colors duration-200 relative overflow-hidden">
      {/* Mobile Drawer Backdrop overlay */}
      {mobileOpen && (
        <div 
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden"
        />
      )}

      {/* Collapsible Left Sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={(tab) => {
          handleTabChange(tab);
          setMobileOpen(false); // Auto close drawer on navigation selection
        }} 
        collapsed={collapsed} 
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Dynamic Navigation Top Bar */}
        <Navbar 
          activeTab={activeTab} 
          searchQuery={searchQuery} 
          setSearchQuery={setSearchQuery} 
          onMenuToggle={() => setMobileOpen(!mobileOpen)}
          setActiveTab={(tab) => {
            handleTabChange(tab);
            setMobileOpen(false);
          }}
        />

        {/* Tab workspace area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 max-w-7xl w-full mx-auto">
          {tabChanging ? renderSkeletonContent() : renderTabContent()}
        </main>
      </div>
    </div>
  );
}
