"use client";

import React, { useState, useEffect } from "react";
import { useToast } from "@/context/ToastContext";
import { 
  Users, Eye, FileText, Book, Download, BookOpen, 
  Globe, Shield, RefreshCw, Layers, TrendingUp, History
} from "lucide-react";

export default function OverviewTab() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<any>(null);

  const fetchOverview = async (isRef = false) => {
    try {
      if (isRef) setRefreshing(true);
      else setLoading(true);

      const res = await fetch("/api/analytics?view=website_overview");
      if (!res.ok) {
        throw new Error("HTTP error " + res.status);
      }
      const apiData = await res.json();
      setData(apiData);
    } catch (err) {
      console.error("Overview query failed:", err);
      toast.error("Failed to load overview telemetry.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const handleRefresh = () => {
    fetchOverview(true);
    toast.success("Overview dashboard telemetry updated.");
  };

  if (loading) {
    return (
      <div className="space-y-6 font-mono text-xs select-none">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="border border-border/30 bg-zinc-950/20 p-4 space-y-3 animate-pulse">
              <div className="h-3 bg-zinc-800/10 dark:bg-zinc-200/5 w-2/3" />
              <div className="h-6 bg-zinc-800/10 dark:bg-zinc-200/5 w-1/2" />
            </div>
          ))}
        </div>
        <div className="h-48 border border-border/30 bg-zinc-950/10 animate-pulse w-full" />
      </div>
    );
  }

  const kpis = [
    {
      title: "Total Visits",
      value: data?.totalVisits || 0,
      sub: "Total page requests logged",
      icon: Eye,
      color: "text-indigo-400"
    },
    {
      title: "Unique Visitors",
      value: data?.uniqueVisitors || 0,
      sub: "Distinct client fingerprints",
      icon: Users,
      color: "text-primary"
    },
    {
      title: "Repeat Visitors",
      value: data?.repeatVisitors || 0,
      sub: "Visitors with multiple sessions",
      icon: History,
      color: "text-emerald-400"
    },
    {
      title: "Total Countries",
      value: data?.totalCountries || 0,
      sub: "Geographic reach",
      icon: Globe,
      color: "text-amber-400"
    },
    {
      title: "Profile Visits",
      value: data?.totalProfileVisits || 0,
      sub: "Views on /heinze profile",
      icon: Shield,
      color: "text-rose-400"
    },
    {
      title: "Total Essays",
      value: data?.totalArticles || 0,
      sub: "Published works & content",
      icon: FileText,
      color: "text-sky-400"
    },
    {
      title: "Essay Views",
      value: data?.totalArticleViews || 0,
      sub: "Total views across essays",
      icon: TrendingUp,
      color: "text-teal-400"
    },
    {
      title: "Total Books",
      value: data?.totalBooks || 0,
      sub: "Full-length library volumes",
      icon: Book,
      color: "text-amber-500"
    },
    {
      title: "PDF Downloads",
      value: data?.totalDownloads || 0,
      sub: "PDF documents acquired",
      icon: Download,
      color: "text-emerald-500"
    },
    {
      title: "Total Reads",
      value: data?.totalReads || 0,
      sub: "Online reader preview sessions",
      icon: BookOpen,
      color: "text-indigo-500"
    }
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-card-bg/30 p-3 border border-border font-mono text-[10px]">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-primary" />
          <h2 className="font-bold text-zinc-400 uppercase tracking-wider">
            General Website Telemetry & Overview
          </h2>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-1 border border-border bg-background hover:text-foreground text-zinc-400 px-3 py-1.5 transition-colors disabled:opacity-50 font-bold w-full sm:w-auto justify-center"
        >
          <RefreshCw className={`h-3 w-3 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 font-mono text-xs">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div 
              key={idx} 
              className="border border-border bg-card-bg/40 p-4 space-y-2 flex flex-col justify-between hover:border-zinc-700 transition-colors rounded-xs"
            >
              <div className="space-y-1">
                <span className="text-zinc-500 uppercase tracking-wider text-[8px] font-bold block">
                  {kpi.title}
                </span>
                <div className="text-xl font-bold text-foreground">
                  {kpi.value.toLocaleString()}
                </div>
              </div>
              <div className="flex justify-between items-center text-[8px] pt-2 border-t border-border/20 mt-1">
                <span className="text-zinc-500 truncate max-w-[80px]" title={kpi.sub}>
                  {kpi.sub}
                </span>
                <Icon className={`h-3.5 w-3.5 ${kpi.color} shrink-0`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Stream Telemetry - Limited to maximum 5 logs */}
      {data?.recentActivity && (
        <div className="border border-border bg-card-bg/40 p-4 font-mono text-xs space-y-3 rounded-xs">
          <div className="font-bold text-zinc-400 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
            <History className="h-3.5 w-3.5 text-primary" />
            Live Visitor Session Stream (Telemetry Feed - Limit 5)
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[10px] leading-relaxed">
              <thead>
                <tr className="border-b border-border text-zinc-500 uppercase tracking-wider text-[8px]">
                  <th className="pb-2">Time</th>
                  <th className="pb-2">Client IP</th>
                  <th className="pb-2">Location</th>
                  <th className="pb-2">Page path</th>
                  <th className="pb-2">Environment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30 text-zinc-400">
                {data.recentActivity.map((act: any, idx: number) => (
                  <tr key={idx} className="hover:bg-card-bg/25">
                    <td className="py-2 text-zinc-500 font-bold">[{act.time}]</td>
                    <td className="py-2 text-primary font-semibold">{act.ip}</td>
                    <td className="py-2 text-zinc-300">{act.location}</td>
                    <td className="py-2 truncate max-w-[200px]" title={act.page}>
                      {act.page}
                    </td>
                    <td className="py-2 text-zinc-500">
                      {act.browser} / {act.device}
                    </td>
                  </tr>
                ))}
                {data.recentActivity.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-zinc-600 italic">
                      No active visitor telemetry found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
