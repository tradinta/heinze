"use client";

import React, { useState, useEffect } from "react";
import { Bug, RefreshCw, ChevronLeft, ChevronRight, Eye, Calendar, X, AlertTriangle } from "lucide-react";
import { useToast } from "@/context/ToastContext";

interface CrashesTabProps {
  searchQuery: string;
}

interface CrashEntry {
  id: number;
  error_message: string;
  error_stack: string | null;
  component_stack: string | null;
  url: string | null;
  device: string;
  browser: string;
  os: string;
  user_email: string | null;
  login_status: boolean;
  occurrence_count: number;
  first_seen: string;
  last_seen: string;
}

export default function CrashesTab({ searchQuery }: CrashesTabProps) {
  const toast = useToast();
  const [crashes, setCrashes] = useState<CrashEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filtering & Pagination State
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [searchFilter, setSearchFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 8;

  // Selected crash details drawer
  const [selectedCrash, setSelectedCrash] = useState<CrashEntry | null>(null);

  const fetchCrashes = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search: (searchFilter || searchQuery || "").trim(),
      });
      if (selectedDate) {
        params.append("date", selectedDate);
      }

      const res = await fetch(`/api/crashes?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Failed to query crashes API");
      }
      const data = await res.json();
      if (data.crashes) {
        setCrashes(data.crashes);
        setTotalCount(data.totalCount || 0);
        setTotalPages(Math.ceil((data.totalCount || 0) / limit) || 1);
      }
    } catch (err) {
      console.error("Error fetching crashes:", err);
      toast.error("Failed to load diagnostic logs.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Trigger load when page, date, or query search updates
  useEffect(() => {
    fetchCrashes();
  }, [page, selectedDate, searchFilter, searchQuery]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchCrashes(true);
    toast.success("Crash metrics stream refreshed.");
  };

  const handleClearFilters = () => {
    setSelectedDate("");
    setSearchFilter("");
    setPage(1);
  };

  const formatDateTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleString();
    } catch (_) {
      return isoString;
    }
  };

  return (
    <div className="border border-border bg-card-bg/40 p-4 space-y-4 font-mono text-xs select-text">
      
      {/* Header and Controls */}
      <div className="flex flex-wrap justify-between items-center border-b border-border pb-3 gap-2">
        <h2 className="font-bold text-zinc-400 uppercase tracking-wider text-[10px] flex items-center gap-1.5 select-none">
          <Bug className="h-4 w-4 text-red-500" />
          Critical Crash Diagnostics Console
        </h2>
        
        <div className="flex items-center gap-2 select-none">
          <button
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="flex items-center gap-1 border border-border bg-background hover:text-foreground text-zinc-400 text-[10px] uppercase tracking-wider px-2.5 py-1 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh stream
          </button>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-wrap gap-2.5 items-center justify-between border-b border-border/40 pb-3 select-none">
        
        <div className="flex flex-wrap items-center gap-2">
          {/* Custom Date Input */}
          <div className="flex items-center gap-1.5 border border-border bg-background/50 px-2 py-1 rounded-sm">
            <Calendar className="h-3.5 w-3.5 text-zinc-500" />
            <input 
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setPage(1);
              }}
              className="bg-transparent text-[10px] outline-hidden text-foreground uppercase border-none focus:ring-0 w-28"
            />
          </div>

          {/* Inline Search Filter override */}
          <div className="flex items-center border border-border bg-background/50 px-2 py-1 rounded-sm">
            <input 
              type="text"
              placeholder="Search error messages..."
              value={searchFilter}
              onChange={(e) => {
                setSearchFilter(e.target.value);
                setPage(1);
              }}
              className="bg-transparent text-[10px] outline-hidden text-foreground placeholder-zinc-500 border-none focus:ring-0 w-44"
            />
          </div>

          {(selectedDate || searchFilter || searchQuery) && (
            <button 
              onClick={handleClearFilters}
              className="px-2 py-1 border border-red-500/20 text-red-400 hover:text-red-500 hover:bg-red-500/5 transition-colors uppercase text-[9px] font-bold tracking-wider inline-flex items-center gap-1 rounded-sm cursor-pointer"
            >
              <X className="h-3 w-3" />
              Clear Filters
            </button>
          )}
        </div>

        <div className="text-[10px] text-zinc-500">
          Audited Errors: <span className="text-foreground font-bold">{totalCount}</span>
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="space-y-2.5 py-4 select-none">
          <div className="h-12 bg-zinc-800/10 dark:bg-zinc-200/5 animate-pulse w-full border border-border/30" />
          <div className="h-12 bg-zinc-800/10 dark:bg-zinc-200/5 animate-pulse w-full border border-border/30" />
          <div className="h-12 bg-zinc-800/10 dark:bg-zinc-200/5 animate-pulse w-full border border-border/30" />
        </div>
      ) : crashes.length === 0 ? (
        <div className="py-12 border border-border bg-background/10 text-center text-zinc-500 select-none">
          <AlertTriangle className="h-6 w-6 text-zinc-600 mx-auto mb-2" />
          No diagnostic crash logs recorded for the selected filter metrics.
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 items-start">
          
          {/* Main Logs Table Grid (takes 2/3 space on xl screen) */}
          <div className="xl:col-span-2 overflow-x-auto border border-border">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-background/50 text-[9px] uppercase tracking-wider text-zinc-500 select-none">
                  <th className="p-2 text-center w-12">Qty</th>
                  <th className="p-2">Error Message & Target Address</th>
                  <th className="p-2">Environment</th>
                  <th className="p-2">Diagnostics</th>
                  <th className="p-2 text-center w-16">Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {crashes.map((crash) => (
                  <tr 
                    key={crash.id} 
                    className={`hover:bg-background/40 transition-colors ${
                      selectedCrash?.id === crash.id ? "bg-primary/5" : ""
                    }`}
                  >
                    {/* Occurrences Counter */}
                    <td className="p-2 text-center">
                      <span className="inline-block px-1.5 py-0.5 font-bold bg-red-500/10 text-red-500 border border-red-500/15 rounded-sm">
                        {crash.occurrence_count}x
                      </span>
                    </td>
                    
                    {/* Error Content details */}
                    <td className="p-2 max-w-sm truncate">
                      <div className="font-bold text-foreground truncate" title={crash.error_message}>
                        {crash.error_message}
                      </div>
                      <div className="text-[9px] text-zinc-500 truncate" title={crash.url || "Unknown Route"}>
                        {crash.url ? new URL(crash.url).pathname : "/"}
                      </div>
                    </td>

                    {/* Env details */}
                    <td className="p-2 text-[10px] text-zinc-400 capitalize">
                      <div>{crash.device.toLowerCase()} • {crash.os}</div>
                      <div className="text-[9px] text-zinc-500">{crash.browser}</div>
                    </td>

                    {/* Auth diagnosis details */}
                    <td className="p-2 text-[10px]">
                      {crash.login_status ? (
                        <div className="text-zinc-400 truncate max-w-[120px]" title={crash.user_email || "Anonymous"}>
                          User: <span className="text-primary font-bold">{crash.user_email?.split("@")[0]}</span>
                        </div>
                      ) : (
                        <span className="text-zinc-500 italic">Guest Reader</span>
                      )}
                      <div className="text-[8px] text-zinc-500 mt-0.5">
                        Last: {formatDateTime(crash.last_seen)}
                      </div>
                    </td>

                    {/* Inspect CTA */}
                    <td className="p-2 text-center select-none">
                      <button
                        onClick={() => setSelectedCrash(crash)}
                        className="p-1 border border-border bg-background hover:border-primary hover:text-primary transition-colors rounded-sm cursor-pointer"
                        title="Expand Diagnostic Trace"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination bar */}
            <div className="flex justify-between items-center p-2.5 bg-background/30 border-t border-border select-none">
              <button
                onClick={() => setPage(p => Math.max(p - 1, 1))}
                disabled={page === 1 || loading}
                className="flex items-center gap-1 border border-border px-2 py-0.5 bg-background text-zinc-500 hover:text-foreground hover:border-zinc-500 transition-colors disabled:opacity-30 cursor-pointer"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Prev
              </button>
              <div className="text-[10px] text-zinc-500">
                Page <span className="text-foreground font-bold">{page}</span> of {totalPages}
              </div>
              <button
                onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                disabled={page === totalPages || loading}
                className="flex items-center gap-1 border border-border px-2 py-0.5 bg-background text-zinc-500 hover:text-foreground hover:border-zinc-500 transition-colors disabled:opacity-30 cursor-pointer"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Details Diagnostic panel (takes 1/3 space on xl screens) */}
          <div className="border border-border bg-card-bg/25 p-4 space-y-4">
            {selectedCrash ? (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex justify-between items-center border-b border-border/80 pb-2 select-none">
                  <h3 className="font-bold text-red-400 uppercase tracking-widest text-[9px]">
                    Trace Diagnostics
                  </h3>
                  <button 
                    onClick={() => setSelectedCrash(null)}
                    className="text-zinc-500 hover:text-foreground transition-colors p-0.5 cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Crash stats header */}
                <div className="grid grid-cols-2 gap-2 text-[10px] border-b border-border/30 pb-3 select-none">
                  <div>
                    <span className="text-zinc-500 block text-[9px] uppercase">Occurrences</span>
                    <span className="font-bold text-foreground text-xs">{selectedCrash.occurrence_count} times</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[9px] uppercase">First Detected</span>
                    <span className="text-foreground">{new Date(selectedCrash.first_seen).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Environment Info */}
                <div className="space-y-1.5 text-[10px] border-b border-border/30 pb-3">
                  <span className="text-zinc-500 block text-[9px] uppercase select-none">Execution Context</span>
                  <div><strong className="text-zinc-400">Device Target:</strong> {selectedCrash.device}</div>
                  <div><strong className="text-zinc-400">Operating System:</strong> {selectedCrash.os}</div>
                  <div><strong className="text-zinc-400">User Client Agent:</strong> {selectedCrash.browser}</div>
                  {selectedCrash.url && (
                    <div className="break-all">
                      <strong className="text-zinc-400">Source Path:</strong> {selectedCrash.url}
                    </div>
                  )}
                  {selectedCrash.login_status ? (
                    <div>
                      <strong className="text-zinc-400">Verified User:</strong>{" "}
                      <span className="text-primary underline">{selectedCrash.user_email}</span>
                    </div>
                  ) : (
                    <div><strong className="text-zinc-400">Session Authority:</strong> Guest Reader</div>
                  )}
                </div>

                {/* Stack Trace block */}
                <div className="space-y-1">
                  <span className="text-zinc-500 block text-[9px] uppercase select-none">Stack Trace Report</span>
                  <div className="max-h-[220px] overflow-y-auto bg-background border border-border p-2.5 rounded-sm select-text scrollbar text-[9px] leading-relaxed text-red-300 font-mono break-all whitespace-pre-wrap">
                    {selectedCrash.error_stack || "No JS stack trace captured."}
                    {selectedCrash.component_stack && (
                      <div className="mt-2 pt-2 border-t border-border/20 text-zinc-400">
                        <div className="font-bold text-[8px] uppercase tracking-wider text-zinc-500">// React Render Stack</div>
                        {selectedCrash.component_stack}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-zinc-500 select-none">
                <Bug className="h-5 w-5 mx-auto mb-2 text-zinc-600" />
                Select a console error log row from the table list to inspect crash trace reports.
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
