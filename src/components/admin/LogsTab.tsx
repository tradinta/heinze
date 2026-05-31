"use client";

import React, { useState, useEffect } from "react";
import { Terminal, RefreshCw } from "lucide-react";
import { useToast } from "@/context/ToastContext";

interface LogsTabProps {
  searchQuery: string;
}

interface LogEntry {
  id: string | number;
  timestamp: string;
  event: string;
  meta: string;
  type: string;
}

export default function LogsTab({ searchQuery }: LogsTabProps) {
  const toast = useToast();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 10;

  const fetchLogs = async (isSilent = false, page = currentPage) => {
    if (!isSilent) setLoading(true);
    try {
      const params = new URLSearchParams({
        search: searchQuery || "",
        page: page.toString(),
        limit: limit.toString()
      });
      const res = await fetch(`/api/logs?${params.toString()}`);
      const data = await res.json();
      if (data.logs) {
        setLogs(data.logs);
      }
      if (data.pagination) {
        setCurrentPage(data.pagination.page);
        setTotalPages(data.pagination.totalPages);
        setTotalCount(data.pagination.totalCount);
      }
    } catch (err) {
      console.error("Error fetching logs:", err);
      toast.error("Failed to load audit logs.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogs(false, 1);
  }, [searchQuery]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchLogs(true, currentPage);
    toast.success("Audit log stream refreshed.");
  };

  return (
    <div className="border border-border bg-card-bg/40 p-4 space-y-4 font-mono text-xs">
      <div className="flex justify-between items-center border-b border-border pb-2">
        <h2 className="font-bold text-zinc-400 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
          <Terminal className="h-4 w-4 text-primary" />
          Audit Logs Telemetry Stream
        </h2>
        <button
          onClick={handleRefresh}
          disabled={refreshing || loading}
          className="flex items-center gap-1 border border-border bg-background hover:text-foreground text-zinc-400 text-[10px] uppercase tracking-wider px-2.5 py-1 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="space-y-2.5 py-4">
          <div className="h-12 bg-zinc-800/10 dark:bg-zinc-200/5 animate-pulse w-full border border-border/30" />
          <div className="h-12 bg-zinc-800/10 dark:bg-zinc-200/5 animate-pulse w-full border border-border/30" />
          <div className="h-12 bg-zinc-800/10 dark:bg-zinc-200/5 animate-pulse w-full border border-border/30" />
          <div className="h-12 bg-zinc-800/10 dark:bg-zinc-200/5 animate-pulse w-full border border-border/30" />
        </div>
      ) : logs.length > 0 ? (
        <>
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1 scrollbar">
            {logs.map((log) => {
              let badgeColor = "bg-zinc-800 border-zinc-700 text-zinc-400";
              if (log.type === "auth") badgeColor = "bg-indigo-500/10 border-indigo-500/20 text-indigo-400";
              if (log.type === "system") badgeColor = "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
              if (log.type === "action") badgeColor = "bg-amber-500/10 border-amber-500/20 text-amber-400";
              if (log.type === "reader") badgeColor = "bg-blue-500/10 border-blue-500/20 text-blue-400";

              return (
                <div key={log.id} className="border border-border bg-background/30 p-2.5 flex flex-col md:flex-row justify-between md:items-center gap-2 hover:bg-background/50 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-zinc-500 font-bold">[{log.timestamp}]</span>
                      <span className={`border px-1 text-[8px] uppercase tracking-wide font-bold ${badgeColor}`}>
                        {log.type}
                      </span>
                    </div>
                    <p className="text-foreground font-sans text-[11px] leading-tight">{log.event}</p>
                  </div>
                  <div className="text-[10px] text-zinc-500 text-left md:text-right shrink-0 font-mono">
                    {log.meta}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border pt-3 mt-4 text-[10px]">
              <span className="text-zinc-500 font-mono">
                SHOWING {(currentPage - 1) * limit + 1} - {Math.min(currentPage * limit, totalCount)} OF {totalCount} RECORDS
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => fetchLogs(false, currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-2.5 py-1 border border-border bg-background hover:text-foreground text-zinc-400 transition-colors disabled:opacity-30 disabled:pointer-events-none uppercase font-bold"
                >
                  Previous
                </button>
                <span className="px-2.5 py-1 border border-border bg-background text-foreground font-bold font-mono">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => fetchLogs(false, currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-2.5 py-1 border border-border bg-background hover:text-foreground text-zinc-400 transition-colors disabled:opacity-30 disabled:pointer-events-none uppercase font-bold"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-zinc-500 italic py-8 text-center border border-dashed border-border">No logs matching search criteria.</div>
      )}
    </div>
  );
}
