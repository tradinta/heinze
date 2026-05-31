"use client";

import React, { useState, useEffect } from "react";
import { 
  BarChart, BookOpen, FileText, Users, Terminal, Settings, 
  ChevronLeft, ChevronRight, Shield, ChevronDown, ChevronUp,
  LineChart, PieChart, Database, Bug, Layers
} from "lucide-react";

export type AdminTab = 
  | "overview"
  | "analytics_overview" 
  | "analytics_articles" 
  | "analytics_books" 
  | "books" 
  | "articles" 
  | "logs" 
  | "crashes"
  | "settings"
  | "profile";

interface SidebarProps {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  collapsed, 
  setCollapsed, 
  mobileOpen, 
  setMobileOpen 
}: SidebarProps) {
  // Keep track of whether the Analytics sub-menu is expanded in the sidebar
  const [analyticsExpanded, setAnalyticsExpanded] = useState(true);

  // Auto-expand analytics sub-menu if one of the sub-tabs is active
  useEffect(() => {
    if (activeTab.startsWith("analytics_")) {
      setAnalyticsExpanded(true);
    }
  }, [activeTab]);

  const handleAnalyticsParentClick = () => {
    if (collapsed) {
      // If collapsed, expand the sidebar first so the user can see the sub-tabs
      setCollapsed(false);
      setAnalyticsExpanded(true);
    } else {
      setAnalyticsExpanded(!analyticsExpanded);
    }
    // Default to overview when clicking the parent
    if (!activeTab.startsWith("analytics_")) {
      setActiveTab("analytics_overview");
    }
  };

  const isAnalyticsActive = activeTab.startsWith("analytics_");

  return (
    <aside 
      className={`fixed md:static inset-y-0 left-0 z-50 border-r border-border bg-card-bg/95 md:bg-card-bg/60 backdrop-blur-md transition-all duration-300 flex flex-col justify-between select-none ${
        collapsed ? "md:w-16" : "md:w-64"
      } w-64 ${
        mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      }`}
    >
      <div>
        {/* Logo block */}
        <div className="p-4 border-b border-border/80 flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-8 h-8 rounded-xs bg-primary flex items-center justify-center text-white shrink-0">
              <Shield className="h-4.5 w-4.5" />
            </div>
            {(!collapsed || mobileOpen) && (
              <span className="font-mono text-xs font-bold tracking-wider text-foreground uppercase truncate">
                Heinze Console
              </span>
            )}
          </div>
          <button 
            onClick={() => setMobileOpen(false)}
            className="md:hidden p-1 text-zinc-400 hover:text-foreground font-mono text-[9px] border border-border bg-background"
          >
            ✕
          </button>
        </div>

        {/* Navigation list */}
        <nav className="p-2 space-y-1">
          
          {/* Overview Tab */}
          <button
            onClick={() => {
              setActiveTab("overview");
              setMobileOpen(false);
            }}
            title={collapsed ? "Overview" : undefined}
            className={`w-full flex items-center gap-3 px-3 py-2.5 font-mono text-[11px] uppercase tracking-wider transition-colors rounded-none ${
              activeTab === "overview" 
                ? "bg-primary text-white font-bold" 
                : "text-zinc-400 hover:text-foreground hover:bg-background/40"
            }`}
          >
            <Layers className="h-4 w-4 shrink-0" />
            {(!collapsed || mobileOpen) && <span>Overview</span>}
          </button>
          
          {/* Analytics Dropdown Parent */}
          <div>
            <button
              onClick={handleAnalyticsParentClick}
              title={collapsed ? "Analytics" : undefined}
              className={`w-full flex items-center justify-between px-3 py-2.5 font-mono text-[11px] uppercase tracking-wider transition-colors rounded-none ${
                isAnalyticsActive && !analyticsExpanded
                  ? "bg-primary text-white font-bold" 
                  : "text-zinc-400 hover:text-foreground hover:bg-background/40"
              }`}
            >
              <div className="flex items-center gap-3">
                <BarChart className="h-4 w-4 shrink-0 text-primary" />
                {(!collapsed || mobileOpen) && <span>Analytics</span>}
              </div>
              {(!collapsed || mobileOpen) && (
                analyticsExpanded ? <ChevronUp className="h-3 w-3 text-zinc-500" /> : <ChevronDown className="h-3 w-3 text-zinc-500" />
              )}
            </button>

            {/* Sub-menu items (Overview, Articles, Books) */}
            {analyticsExpanded && (!collapsed || mobileOpen) && (
              <div className="mt-1 ml-4 border-l border-border/60 pl-2 space-y-0.5 font-mono text-[10px] uppercase">
                {/* subtab 1: Overview */}
                <button
                  onClick={() => {
                    setActiveTab("analytics_overview");
                    setMobileOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 transition-colors flex items-center gap-2 ${
                    activeTab === "analytics_overview"
                      ? "text-primary font-bold bg-primary/5"
                      : "text-zinc-500 hover:text-foreground"
                  }`}
                >
                  <span>├─ Overview</span>
                </button>

                {/* subtab 2: Articles */}
                <button
                  onClick={() => {
                    setActiveTab("analytics_articles");
                    setMobileOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 transition-colors flex items-center gap-2 ${
                    activeTab === "analytics_articles"
                      ? "text-primary font-bold bg-primary/5"
                      : "text-zinc-500 hover:text-foreground"
                  }`}
                >
                  <span>├─ Essays</span>
                </button>

                {/* subtab 3: Books */}
                <button
                  onClick={() => {
                    setActiveTab("analytics_books");
                    setMobileOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 transition-colors flex items-center gap-2 ${
                    activeTab === "analytics_books"
                      ? "text-primary font-bold bg-primary/5"
                      : "text-zinc-500 hover:text-foreground"
                  }`}
                >
                  <span>└─ Books</span>
                </button>
              </div>
            )}
          </div>

          {/* Manage Books Tab */}
          <button
            onClick={() => {
              setActiveTab("books");
              setMobileOpen(false);
            }}
            title={collapsed ? "Manage Books" : undefined}
            className={`w-full flex items-center gap-3 px-3 py-2.5 font-mono text-[11px] uppercase tracking-wider transition-colors rounded-none ${
              activeTab === "books" 
                ? "bg-primary text-white font-bold" 
                : "text-zinc-400 hover:text-foreground hover:bg-background/40"
            }`}
          >
            <BookOpen className="h-4 w-4 shrink-0" />
            {(!collapsed || mobileOpen) && <span>Manage Books</span>}
          </button>

          {/* Manage Articles Tab */}
          <button
            onClick={() => {
              setActiveTab("articles");
              setMobileOpen(false);
            }}
            title={collapsed ? "Manage Articles" : undefined}
            className={`w-full flex items-center gap-3 px-3 py-2.5 font-mono text-[11px] uppercase tracking-wider transition-colors rounded-none ${
              activeTab === "articles" 
                ? "bg-primary text-white font-bold" 
                : "text-zinc-400 hover:text-foreground hover:bg-background/40"
            }`}
          >
            <FileText className="h-4 w-4 shrink-0" />
            {(!collapsed || mobileOpen) && <span>Manage Articles</span>}
          </button>

          {/* Console Logs Tab */}
          <button
            onClick={() => {
              setActiveTab("logs");
              setMobileOpen(false);
            }}
            title={collapsed ? "Console Logs" : undefined}
            className={`w-full flex items-center gap-3 px-3 py-2.5 font-mono text-[11px] uppercase tracking-wider transition-colors rounded-none ${
              activeTab === "logs" 
                ? "bg-primary text-white font-bold" 
                : "text-zinc-400 hover:text-foreground hover:bg-background/40"
            }`}
          >
            <Terminal className="h-4 w-4 shrink-0" />
            {(!collapsed || mobileOpen) && <span>Console Logs</span>}
          </button>

          {/* Crashes & Errors Tab */}
          <button
            onClick={() => {
              setActiveTab("crashes");
              setMobileOpen(false);
            }}
            title={collapsed ? "Crashes & Errors" : undefined}
            className={`w-full flex items-center gap-3 px-3 py-2.5 font-mono text-[11px] uppercase tracking-wider transition-colors rounded-none ${
              activeTab === "crashes" 
                ? "bg-primary text-white font-bold" 
                : "text-zinc-400 hover:text-foreground hover:bg-background/40"
            }`}
          >
            <Bug className="h-4 w-4 shrink-0" />
            {(!collapsed || mobileOpen) && <span>Crashes & Errors</span>}
          </button>

          {/* Console Settings Tab */}
          <button
            onClick={() => {
              setActiveTab("settings");
              setMobileOpen(false);
            }}
            title={collapsed ? "Console Settings" : undefined}
            className={`w-full flex items-center gap-3 px-3 py-2.5 font-mono text-[11px] uppercase tracking-wider transition-colors rounded-none ${
              activeTab === "settings" 
                ? "bg-primary text-white font-bold" 
                : "text-zinc-400 hover:text-foreground hover:bg-background/40"
            }`}
          >
            <Settings className="h-4 w-4 shrink-0" />
            {(!collapsed || mobileOpen) && <span>Console Settings</span>}
          </button>

        </nav>
      </div>

      {/* Collapse button */}
      <div className="p-2 border-t border-border/80 hidden md:block">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center p-2 text-zinc-400 hover:text-foreground hover:bg-background/40 font-mono text-[10px] uppercase tracking-widest gap-2"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span>Collapse Sidebar</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
