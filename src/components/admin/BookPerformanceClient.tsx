"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft, Eye, Download, Clock,
  MapPin, Laptop, Globe, Activity,
  Archive, RotateCcw, ChevronLeft, ChevronRight, AlertCircle, RefreshCw
} from "lucide-react";
import { useToast } from "@/context/ToastContext";

interface BookPerformanceClientProps {
  bookId: string;
  initialBook: {
    id: string;
    title: string;
    description: string;
    published_date: string;
    pages: number;
    impressions: number;
    downloads: number;
    archived: boolean;
    cover_url: string;
  };
  initialStats: {
    totalViews: number;
    uniqueVisitors: number;
    avgDurationSeconds: number;
  };
  referrers: { name: string; count: number }[];
  countries: { name: string; count: number }[];
  devices: { name: string; count: number }[];
  recentActivity: any[];
  hourlyVisits: { hr: number; count: number }[];
  dailyVisits: { dy: string; count: number }[];
}

export default function BookPerformanceClient({
  bookId,
  initialBook,
  initialStats,
  referrers,
  countries,
  devices,
  recentActivity,
  hourlyVisits,
  dailyVisits
}: BookPerformanceClientProps) {
  const toast = useToast();
  const [book, setBook] = useState(initialBook);
  const [timeFilter, setTimeFilter] = useState<"hour" | "day">("hour");
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; label: string; value: number } | null>(null);
  const [archiveModalOpen, setArchiveModalOpen] = useState(false);
  const [submittingStatus, setSubmittingStatus] = useState(false);

  const topReferrers = referrers.slice(0, 5);
  const topCountries = countries.slice(0, 5);
  const topDevices = devices.slice(0, 5);
  const topRecentActivity = recentActivity.slice(0, 5);

  const maxReferrerCount = Math.max(...topReferrers.map(r => r.count), 1);
  const maxCountryCount = Math.max(...topCountries.map(c => c.count), 1);
  const totalDeviceCount = topDevices.reduce((sum, d) => sum + d.count, 0) || 1;

  const formatDuration = (seconds: number) => {
    if (seconds <= 0) return "0s";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const handleToggleArchive = async () => {
    setSubmittingStatus(true);
    const nextArchived = !book.archived;
    try {
      const response = await fetch("/api/books", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId: book.id, archived: nextArchived })
      });
      if (response.ok) {
        setBook(prev => ({ ...prev, archived: nextArchived }));
        toast.success(`Book ${nextArchived ? "archived and taken down" : "restored and re-listed"}!`);
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to update book state.");
      }
    } catch {
      toast.error("Network failure.");
    } finally {
      setSubmittingStatus(false);
      setArchiveModalOpen(false);
    }
  };

  // Donut chart helpers
  const getDonutSegments = (dataList: { name: string; count: number }[], total: number) => {
    let acc = 0;
    return dataList.map(item => {
      const percent = (item.count / total) * 100;
      const startAngle = (acc / 100) * 360;
      acc += percent;
      return { ...item, percent, startAngle, strokeDashoffset: 125.66 - (percent / 100) * 125.66 };
    });
  };

  const deviceSegments = getDonutSegments(topDevices, totalDeviceCount);
  const totalCountrySum = topCountries.reduce((s, c) => s + c.count, 0) || 1;
  const countrySegments = getDonutSegments(topCountries, totalCountrySum);

  const colorsPalette = [
    "stroke-primary text-primary",
    "stroke-secondary text-secondary",
    "stroke-amber-600 text-amber-600",
    "stroke-zinc-500 text-zinc-500",
    "stroke-indigo-500 text-indigo-500"
  ];
  const fillPalette = [
    "bg-primary border-primary",
    "bg-secondary border-secondary",
    "bg-amber-600 border-amber-600",
    "bg-zinc-500 border-zinc-500",
    "bg-indigo-500 border-indigo-500"
  ];

  // Line chart
  const generateLinePoints = () => {
    const data = timeFilter === "hour"
      ? hourlyVisits
      : dailyVisits.map((v, i) => ({ hr: i, count: v.count }));

    if (data.length === 0) return { pathD: "", points: [] };

    const width = 450, height = 150, padding = 20;
    const maxCount = Math.max(...data.map(d => d.count), 5);

    const points = data.map((d, index) => {
      const x = padding + (index / (data.length - 1 || 1)) * (width - padding * 2);
      const y = height - padding - (d.count / maxCount) * (height - padding * 2);
      const label = timeFilter === "hour"
        ? `${d.hr}:00`
        : new Date(dailyVisits[index]?.dy).toLocaleDateString(undefined, { month: "short", day: "numeric" });
      return { x, y, label, value: d.count };
    });

    let pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      pathD += ` L ${points[i].x} ${points[i].y}`;
    }

    return { pathD, points };
  };

  const { pathD, points } = generateLinePoints();

  return (
    <div className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 font-mono select-text">

      {/* Back */}
      <div className="mb-6 select-none">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-zinc-500 hover:text-foreground text-xs uppercase tracking-wider transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to books listing
        </Link>
      </div>

      {/* Header */}
      <div className="border-b border-border pb-5 mb-8">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex gap-4 items-start">
            {book.cover_url && (
              <img src={book.cover_url} alt={book.title} className="w-16 h-20 object-cover border border-border rounded-xs shrink-0 hidden sm:block" />
            )}
            <div>
              <div className="flex items-center gap-2 text-[10px] text-zinc-500 uppercase tracking-widest font-bold select-none">
                <span className="inline-block bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-sm">Book</span>
                <span>•</span>
                <span>Telemetry Dashboard</span>
                {book.archived && (
                  <span className="inline-block bg-red-500/10 text-red-500 border border-red-500/20 px-1.5 py-0.5 rounded-xs text-[8px] tracking-wide ml-2 uppercase font-bold">
                    Archived
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground mt-2 leading-tight">{book.title}</h1>
              <p className="text-xs text-zinc-500 max-w-2xl mt-1 leading-relaxed">{book.description || "No description."}</p>
              <div className="flex items-center gap-3 text-[9px] text-zinc-500 mt-2 font-mono">
                <span>{book.pages} pages</span>
                <span>•</span>
                <span>Published {new Date(book.published_date).toLocaleDateString(undefined, { year: "numeric", month: "long" })}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 select-none">
            <Link
              href={`/admin?tab=books`}
              className="px-3 py-1.5 border border-border bg-background hover:border-zinc-500 text-foreground transition-all uppercase tracking-wider text-[10px] inline-flex items-center gap-1.5"
            >
              Manage Books
            </Link>
            <button
              onClick={() => setArchiveModalOpen(true)}
              className={`px-3 py-1.5 border transition-all uppercase tracking-wider text-[10px] inline-flex items-center gap-1.5 cursor-pointer ${
                book.archived
                  ? "border-primary bg-primary/10 text-primary hover:bg-primary/20"
                  : "border-red-500/30 bg-red-500/5 text-red-400 hover:bg-red-500/10"
              }`}
            >
              <Archive className="h-3.5 w-3.5" />
              {book.archived ? "Re-list Book" : "Archive (Take Down)"}
            </button>
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8 select-none">
        <div className="border border-border bg-card-bg/15 p-4 relative overflow-hidden group">
          <div className="flex justify-between items-start text-zinc-500 mb-2">
            <span className="text-[10px] uppercase font-bold tracking-wider">Total Opens</span>
            <Eye className="h-4 w-4 text-zinc-400 group-hover:text-primary transition-colors" />
          </div>
          <div className="text-2xl font-bold text-foreground">{initialStats.totalViews}</div>
          <div className="text-[8px] text-zinc-500 mt-1">{initialStats.uniqueVisitors} Unique Readers</div>
        </div>

        <div className="border border-border bg-card-bg/15 p-4 relative overflow-hidden group">
          <div className="flex justify-between items-start text-zinc-500 mb-2">
            <span className="text-[10px] uppercase font-bold tracking-wider">Downloads</span>
            <Download className="h-4 w-4 text-zinc-400 group-hover:text-amber-500 transition-colors" />
          </div>
          <div className="text-2xl font-bold text-foreground">{book.downloads || 0}</div>
          <div className="text-[8px] text-zinc-500 mt-1">PDF saved locally</div>
        </div>

        <div className="border border-border bg-card-bg/15 p-4 relative overflow-hidden group">
          <div className="flex justify-between items-start text-zinc-500 mb-2">
            <span className="text-[10px] uppercase font-bold tracking-wider">Avg Read Time</span>
            <Clock className="h-4 w-4 text-zinc-400 group-hover:text-emerald-500 transition-colors" />
          </div>
          <div className="text-2xl font-bold text-foreground">{formatDuration(initialStats.avgDurationSeconds)}</div>
          <div className="text-[8px] text-zinc-500 mt-1">{book.pages} pages total</div>
        </div>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Line Chart */}
        <div className="lg:col-span-2 border border-border bg-card-bg/10 p-5 flex flex-col justify-between">
          <div className="flex justify-between items-center border-b border-border/40 pb-2 mb-4 select-none">
            <h3 className="text-xs uppercase font-bold text-primary flex items-center gap-1.5">
              <Activity className="h-4 w-4" />
              Open Traffic Spikes
            </h3>
            <div className="flex border border-border rounded-xs overflow-hidden text-[9px] uppercase font-bold">
              <button
                onClick={() => setTimeFilter("hour")}
                className={`px-2 py-0.5 ${timeFilter === "hour" ? "bg-primary text-white" : "bg-background text-zinc-500"}`}
              >
                Hourly
              </button>
              <button
                onClick={() => setTimeFilter("day")}
                className={`px-2 py-0.5 ${timeFilter === "day" ? "bg-primary text-white" : "bg-background text-zinc-500"}`}
              >
                Daily
              </button>
            </div>
          </div>

          <div className="relative w-full h-[155px]">
            {points.length > 0 ? (
              <svg viewBox="0 0 450 150" className="w-full h-full text-zinc-500 dark:text-zinc-600 font-sans">
                <line x1="20" y1="20" x2="430" y2="20" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 4" opacity="0.4" />
                <line x1="20" y1="75" x2="430" y2="75" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 4" opacity="0.4" />
                <line x1="20" y1="130" x2="430" y2="130" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 4" opacity="0.4" />
                <path d={pathD} fill="none" className="stroke-primary" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                {points.map((pt, idx) => (
                  <circle
                    key={idx}
                    cx={pt.x}
                    cy={pt.y}
                    r={hoveredPoint?.label === pt.label ? 5 : 3.5}
                    className={`${hoveredPoint?.label === pt.label ? "fill-primary stroke-white stroke-2" : "fill-background stroke-primary stroke-1.5"} cursor-pointer transition-all`}
                    onMouseEnter={() => setHoveredPoint(pt)}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                ))}
              </svg>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-zinc-500">
                Insufficient traffic data to render chart.
              </div>
            )}
            {hoveredPoint && (
              <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-background border border-border px-2 py-1 text-[9px] font-mono shadow-md rounded-xs select-none">
                <span className="text-zinc-500">{hoveredPoint.label}:</span>{" "}
                <span className="font-bold text-foreground">{hoveredPoint.value} opens</span>
              </div>
            )}
          </div>
        </div>

        {/* Device Donut */}
        <div className="border border-border bg-card-bg/10 p-5 flex flex-col justify-between">
          <div className="border-b border-border/40 pb-2 mb-4 select-none">
            <h3 className="text-xs uppercase font-bold text-primary flex items-center gap-1.5">
              <Laptop className="h-4 w-4" />
              Device Distribution
            </h3>
          </div>
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="relative w-28 h-28 select-none">
              <svg viewBox="0 0 100 100" className="w-full h-full rotate-270">
                {deviceSegments.map((seg, idx) => (
                  <circle
                    key={idx} cx="50" cy="50" r="20" fill="transparent"
                    className={colorsPalette[idx % colorsPalette.length]}
                    strokeWidth="10" strokeDasharray="125.66"
                    strokeDashoffset={seg.strokeDashoffset}
                    transform={`rotate(${seg.startAngle} 50 50)`}
                  />
                ))}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-[10px] font-bold text-zinc-500 dark:text-zinc-400 font-mono">
                Devices
              </div>
            </div>
            <div className="w-full space-y-1.5 font-mono text-[9px]">
              {deviceSegments.map((d, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${fillPalette[idx % fillPalette.length]}`} />
                  <span className="text-zinc-400 capitalize">{d.name}</span>
                  <span className="font-bold ml-auto">{Math.round(d.percent)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Referrers, Countries, Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="border border-border bg-card-bg/10 p-5">
          <h3 className="text-xs uppercase font-bold border-b border-border/60 pb-2 mb-4 text-primary flex items-center gap-1.5 select-none">
            <Globe className="h-4 w-4" />
            Referrals (Top 5)
          </h3>
          <div className="space-y-3.5">
            {topReferrers.map((ref, idx) => {
              const percent = Math.round((ref.count / maxReferrerCount) * 100);
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-zinc-400 truncate max-w-[140px] font-mono">{ref.name}</span>
                    <span className="text-foreground font-bold font-mono">{ref.count} opens</span>
                  </div>
                  <div className="w-full h-1 bg-zinc-800/10 dark:bg-zinc-200/5 overflow-hidden select-none">
                    <div className="h-full bg-primary transition-all duration-500" style={{ width: `${percent}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="border border-border bg-card-bg/10 p-5">
          <h3 className="text-xs uppercase font-bold border-b border-border/60 pb-2 mb-4 text-primary flex items-center gap-1.5 select-none">
            <MapPin className="h-4 w-4" />
            Countries (Top 5)
          </h3>
          <div className="space-y-3.5">
            {topCountries.map((c, idx) => {
              const percent = Math.round((c.count / maxCountryCount) * 100);
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-zinc-400 font-mono">{c.name}</span>
                    <span className="text-foreground font-bold font-mono">{c.count} opens</span>
                  </div>
                  <div className="w-full h-1 bg-zinc-800/10 dark:bg-zinc-200/5 overflow-hidden select-none">
                    <div className="h-full bg-secondary transition-all duration-500" style={{ width: `${percent}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="border border-border bg-card-bg/10 p-5">
          <h3 className="text-xs uppercase font-bold border-b border-border/60 pb-2 mb-4 text-primary flex items-center gap-1.5 select-none">
            <Activity className="h-4 w-4" />
            Sessions (Top 5)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-[9px]">
              <thead>
                <tr className="border-b border-border text-zinc-500 text-[8px] uppercase tracking-wider select-none">
                  <th className="pb-1.5">Origin</th>
                  <th className="pb-1.5">Device</th>
                  <th className="pb-1.5 text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {topRecentActivity.map((act, idx) => (
                  <tr key={idx} className="hover:bg-card-bg/15">
                    <td className="py-2 text-foreground truncate max-w-[110px] font-bold">{act.location}</td>
                    <td className="py-2 text-zinc-500 capitalize">{act.device.toLowerCase()}</td>
                    <td className="py-2 text-right text-foreground font-bold">{formatDuration(act.duration)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {archiveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs select-none">
          <div className="w-full max-w-sm border border-border bg-card-bg p-6 shadow-2xl rounded-sm font-mono">
            <div className="flex items-center gap-2 text-red-500 mb-3 text-xs font-bold uppercase tracking-wider">
              <AlertCircle className="h-4.5 w-4.5" />
              Confirm Status Change
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed mb-6">
              {book.archived
                ? <>Are you sure you want to <strong>RE-LIST</strong> this book? It will be immediately accessible to readers.</>
                : <>Are you sure you want to <strong>ARCHIVE</strong> this book? It will be removed from the public library listing.</>
              }
            </p>
            <div className="flex justify-end gap-2 text-xs">
              <button
                onClick={() => setArchiveModalOpen(false)}
                disabled={submittingStatus}
                className="px-3 py-1.5 border border-border bg-background hover:text-foreground text-zinc-400 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleToggleArchive}
                disabled={submittingStatus}
                className="px-3 py-1.5 border border-primary bg-primary/10 text-primary hover:bg-primary/25 transition-colors font-bold cursor-pointer"
              >
                {submittingStatus ? "Updating..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
