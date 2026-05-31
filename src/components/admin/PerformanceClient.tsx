"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ArrowLeft, Eye, Bookmark, Star, Clock, 
  MapPin, Laptop, Globe, Activity, HelpCircle, 
  Edit3, Archive, RotateCcw, MessageSquare, 
  ChevronLeft, ChevronRight, X, AlertCircle, RefreshCw
} from "lucide-react";
import { useToast } from "@/context/ToastContext";

interface PerformanceClientProps {
  articleId: string;
  initialArticle: {
    id: string;
    title: string;
    category: string;
    published_date: string;
    read_time: string;
    description: string;
    visits: number;
    bookmarks_count: number;
    status: "published" | "draft" | "archived";
  };
  initialStats: {
    averageRating: number;
    ratingsCount: number;
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
  totalNotes: number;
}

export default function PerformanceClient({
  articleId,
  initialArticle,
  initialStats,
  referrers,
  countries,
  devices,
  recentActivity,
  hourlyVisits,
  dailyVisits,
  totalNotes: initialTotalNotes
}: PerformanceClientProps) {
  const toast = useToast();
  
  // Article State
  const [article, setArticle] = useState(initialArticle);
  
  // Notes State
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState<any[]>([]);
  const [notesPage, setNotesPage] = useState(1);
  const [totalNotes, setTotalNotes] = useState(initialTotalNotes);
  const [loadingNotes, setLoadingNotes] = useState(false);

  // Line Chart Filter State
  const [timeFilter, setTimeFilter] = useState<"hour" | "day">("hour");
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; label: string; value: number } | null>(null);

  // Modals States
  const [archiveModalOpen, setArchiveModalOpen] = useState(false);
  const [submittingStatus, setSubmittingStatus] = useState(false);

  // Cap initial props lists to top 5 results for clean presentation
  const topReferrers = referrers.slice(0, 5);
  const topCountries = countries.slice(0, 5);
  const topDevices = devices.slice(0, 5);
  const topRecentActivity = recentActivity.slice(0, 5);

  const maxReferrerCount = Math.max(...topReferrers.map(r => r.count), 1);
  const maxCountryCount = Math.max(...topCountries.map(c => c.count), 1);
  const totalDeviceCount = topDevices.reduce((sum, d) => sum + d.count, 0) || 1;

  // Format avg duration helper
  const formatDuration = (seconds: number) => {
    if (seconds <= 0) return "0s";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  // Fetch paginated notes
  const fetchNotes = async () => {
    setLoadingNotes(true);
    try {
      const res = await fetch(`/api/notes?articleId=${articleId}&page=${notesPage}&limit=10`);
      if (res.ok) {
        const data = await res.json();
        setNotes(data.notes || []);
        setTotalNotes(data.totalCount || 0);
      }
    } catch (err) {
      console.error("Failed to load notes:", err);
      toast.error("Failed to retrieve annotations.");
    } finally {
      setLoadingNotes(false);
    }
  };

  useEffect(() => {
    if (showNotes) {
      fetchNotes();
    }
  }, [showNotes, notesPage]);

  // Handle Archive / Restore toggle
  const handleToggleArchive = async () => {
    setSubmittingStatus(true);
    const nextStatus = article.status === "archived" ? "published" : "archived";
    try {
      const response = await fetch("/api/articles", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          articleId: article.id,
          status: nextStatus
        })
      });

      if (response.ok) {
        setArticle(prev => ({ ...prev, status: nextStatus }));
        toast.success(`Essay successfully ${nextStatus === "archived" ? "taken down and archived" : "re-published"}!`);
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to update essay state.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network communication failure.");
    } finally {
      setSubmittingStatus(false);
      setArchiveModalOpen(false);
    }
  };

  // Math calculations for SVG Donut Charts
  const getDonutSegments = (dataList: { name: string; count: number }[], total: number) => {
    let accumulatedPercent = 0;
    return dataList.map((item, idx) => {
      const percent = (item.count / total) * 100;
      const startAngle = (accumulatedPercent / 100) * 360;
      accumulatedPercent += percent;
      return {
        ...item,
        percent,
        startAngle,
        strokeDashoffset: 125.66 - (percent / 100) * 125.66
      };
    });
  };

  const deviceSegments = getDonutSegments(topDevices, totalDeviceCount);
  const totalCountrySum = topCountries.reduce((sum, c) => sum + c.count, 0) || 1;
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

  // SVG Line Chart Coordinate Generator
  const generateLinePoints = () => {
    const data = timeFilter === "hour" 
      ? hourlyVisits 
      : dailyVisits.map((v, i) => ({ hr: i, count: v.count })); // treat index as coordinate index

    if (data.length === 0) return { pathD: "", points: [] };

    const width = 450;
    const height = 150;
    const padding = 20;

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
      
      {/* Back button */}
      <div className="mb-6 select-none">
        <Link 
          href="/admin"
          className="inline-flex items-center gap-1.5 text-zinc-500 hover:text-foreground text-xs uppercase tracking-wider transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to essays listing
        </Link>
      </div>

      {/* Main header block */}
      <div className="border-b border-border pb-5 mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[10px] text-zinc-500 uppercase tracking-widest font-bold select-none">
              <span className="inline-block bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-sm">
                {article.category}
              </span>
              <span>•</span>
              <span>Telemetry Dashboard</span>
              {article.status === "archived" && (
                <span className="inline-block bg-red-500/10 text-red-500 border border-red-500/20 px-1.5 py-0.5 rounded-xs text-[8px] tracking-wide ml-2 uppercase font-bold">
                  Archived / Off-Air
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground mt-2 leading-tight">
              {article.title}
            </h1>
            <p className="text-xs text-zinc-500 max-w-2xl mt-1 leading-relaxed">
              Abstract: {article.description || "No abstract details provided."}
            </p>
          </div>

          {/* Manage Actions */}
          <div className="flex items-center gap-2 shrink-0 select-none">
            <Link
              href={`/admin?tab=articles&edit=${article.id}`}
              className="px-3 py-1.5 border border-border bg-background hover:border-zinc-500 text-foreground transition-all uppercase tracking-wider text-[10px] inline-flex items-center gap-1.5"
            >
              <Edit3 className="h-3.5 w-3.5 text-zinc-400" />
              Edit Essay
            </Link>

            <button
              onClick={() => setArchiveModalOpen(true)}
              className={`px-3 py-1.5 border transition-all uppercase tracking-wider text-[10px] inline-flex items-center gap-1.5 cursor-pointer ${
                article.status === "archived"
                  ? "border-primary bg-primary/10 text-primary hover:bg-primary/20"
                  : "border-red-500/30 bg-red-500/5 text-red-400 hover:bg-red-500/10"
              }`}
            >
              <Archive className="h-3.5 w-3.5" />
              {article.status === "archived" ? "Publish Essay" : "Archive (Take Down)"}
            </button>
          </div>
        </div>
      </div>

      {/* Grid of 4 KPIs cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 select-none">
        {/* KPI 1: Views */}
        <div className="border border-border bg-card-bg/15 p-4 relative overflow-hidden group">
          <div className="flex justify-between items-start text-zinc-500 mb-2">
            <span className="text-[10px] uppercase font-bold tracking-wider">Total Views</span>
            <Eye className="h-4 w-4 text-zinc-400 group-hover:text-primary transition-colors" />
          </div>
          <div className="text-2xl font-bold text-foreground">{initialStats.totalViews}</div>
          <div className="text-[8px] text-zinc-500 mt-1">
            {initialStats.uniqueVisitors} Unique Readers
          </div>
        </div>

        {/* KPI 2: Bookmarks */}
        <div className="border border-border bg-card-bg/15 p-4 relative overflow-hidden group">
          <div className="flex justify-between items-start text-zinc-500 mb-2">
            <span className="text-[10px] uppercase font-bold tracking-wider">Bookmarks</span>
            <Bookmark className="h-4 w-4 text-zinc-400 group-hover:text-amber-500 transition-colors" />
          </div>
          <div className="text-2xl font-bold text-foreground">{article.bookmarks_count || 0}</div>
          <div className="text-[8px] text-zinc-500 mt-1">
            Saved to personal libraries
          </div>
        </div>

        {/* KPI 3: Duration */}
        <div className="border border-border bg-card-bg/15 p-4 relative overflow-hidden group">
          <div className="flex justify-between items-start text-zinc-500 mb-2">
            <span className="text-[10px] uppercase font-bold tracking-wider">Avg Attention Span</span>
            <Clock className="h-4 w-4 text-zinc-400 group-hover:text-emerald-500 transition-colors" />
          </div>
          <div className="text-2xl font-bold text-foreground">
            {formatDuration(initialStats.avgDurationSeconds)}
          </div>
          <div className="text-[8px] text-zinc-500 mt-1">
            Estimated read: {article.read_time || "2 min"}
          </div>
        </div>

        {/* KPI 4: Rating */}
        <div className="border border-border bg-card-bg/15 p-4 relative overflow-hidden group">
          <div className="flex justify-between items-start text-zinc-500 mb-2">
            <span className="text-[10px] uppercase font-bold tracking-wider">Average Rating</span>
            <Star className="h-4 w-4 text-zinc-400 group-hover:text-amber-400 fill-transparent transition-colors" />
          </div>
          <div className="text-2xl font-bold text-foreground">
            {initialStats.averageRating > 0 ? initialStats.averageRating.toFixed(1) : "0.0"}
          </div>
          <div className="text-[8px] text-zinc-500 mt-1">
            Based on {initialStats.ratingsCount} reviews
          </div>
        </div>
      </div>

      {/* Main Charts area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        
        {/* Line Chart Component (occupies 2/3 of grid) */}
        <div className="lg:col-span-2 border border-border bg-card-bg/10 p-5 flex flex-col justify-between">
          <div className="flex justify-between items-center border-b border-border/40 pb-2 mb-4 select-none">
            <h3 className="text-xs uppercase font-bold text-primary flex items-center gap-1.5">
              <Activity className="h-4 w-4" />
              Hourly & Daily Traffic Spikes
            </h3>
            
            {/* Hour / Day toggles */}
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

          {/* Interactive Line Chart SVG */}
          <div className="relative w-full h-[155px]">
            {points.length > 0 ? (
              <svg viewBox="0 0 450 150" className="w-full h-full text-zinc-500 dark:text-zinc-600 font-sans">
                {/* Horizontal grid lines */}
                <line x1="20" y1="20" x2="430" y2="20" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 4" opacity="0.4" />
                <line x1="20" y1="75" x2="430" y2="75" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 4" opacity="0.4" />
                <line x1="20" y1="130" x2="430" y2="130" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 4" opacity="0.4" />

                {/* SVG path line */}
                <path
                  d={pathD}
                  fill="none"
                  className="stroke-primary"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Interactive Points circles */}
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
                Insufficient traffic telemetry to draw spike vectors.
              </div>
            )}

            {/* Hover Tooltip display */}
            {hoveredPoint && (
              <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-background border border-border px-2 py-1 text-[9px] font-mono shadow-md rounded-xs select-none">
                <span className="text-zinc-500">{hoveredPoint.label}:</span> <span className="font-bold text-foreground">{hoveredPoint.value} views</span>
              </div>
            )}
          </div>
        </div>

        {/* Device breakdown card */}
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
                    key={idx}
                    cx="50"
                    cy="50"
                    r="20"
                    fill="transparent"
                    className={`${colorsPalette[idx % colorsPalette.length]}`}
                    strokeWidth="10"
                    strokeDasharray="125.66"
                    strokeDashoffset={seg.strokeDashoffset}
                    transform={`rotate(${seg.startAngle} 50 50)`}
                  />
                ))}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-[10px] font-bold text-zinc-500 dark:text-zinc-400 font-mono">
                Devices
              </div>
            </div>

            {/* Labels list */}
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

      {/* Referral, countries & geolocation lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* Referrers Card */}
        <div className="border border-border bg-card-bg/10 p-5">
          <h3 className="text-xs uppercase font-bold border-b border-border/60 pb-2 mb-4 text-primary flex items-center gap-1.5 select-none">
            <Globe className="h-4 w-4" />
            Referrals (Capped Top 5)
          </h3>
          
          <div className="space-y-3.5">
            {topReferrers.map((ref, idx) => {
              const percent = Math.round((ref.count / maxReferrerCount) * 100);
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-zinc-400 truncate max-w-[140px] font-mono">{ref.name}</span>
                    <span className="text-foreground font-bold font-mono">{ref.count} views</span>
                  </div>
                  <div className="w-full h-1 bg-zinc-800/10 dark:bg-zinc-200/5 overflow-hidden select-none">
                    <div 
                      className="h-full bg-primary transition-all duration-500" 
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Countries Card */}
        <div className="border border-border bg-card-bg/10 p-5">
          <h3 className="text-xs uppercase font-bold border-b border-border/60 pb-2 mb-4 text-primary flex items-center gap-1.5 select-none">
            <MapPin className="h-4 w-4" />
            Countries (Capped Top 5)
          </h3>

          <div className="space-y-3.5">
            {topCountries.map((c, idx) => {
              const percent = Math.round((c.count / maxCountryCount) * 100);
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-zinc-400 font-mono">{c.name}</span>
                    <span className="text-foreground font-bold font-mono">{c.count} views</span>
                  </div>
                  <div className="w-full h-1 bg-zinc-800/10 dark:bg-zinc-200/5 overflow-hidden select-none">
                    <div 
                      className="h-full bg-secondary transition-all duration-500" 
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent sessions activity table */}
        <div className="border border-border bg-card-bg/10 p-5">
          <h3 className="text-xs uppercase font-bold border-b border-border/60 pb-2 mb-4 text-primary flex items-center gap-1.5 select-none">
            <Activity className="h-4 w-4" />
            Sessions (Capped Top 5)
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-[9px]">
              <thead>
                <tr className="border-b border-border text-zinc-500 text-[8px] uppercase tracking-wider select-none">
                  <th className="pb-1.5">Origin</th>
                  <th className="pb-1.5">Device</th>
                  <th className="pb-1.5 text-right">Read</th>
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

      {/* Reader Annotations/Notes Accordion Section */}
      <div className="border border-border bg-card-bg/5 p-5 mb-8">
        <div className="flex justify-between items-center select-none">
          <div>
            <h3 className="text-xs uppercase font-bold text-zinc-400 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              Reader Reflections & Notes
            </h3>
            <p className="text-[10px] text-zinc-500 mt-0.5">
              Total Annotations logged: <span className="font-bold text-foreground">{totalNotes}</span>
            </p>
          </div>
          
          <button
            onClick={() => setShowNotes(!showNotes)}
            className="px-3 py-1 border border-border bg-background hover:text-foreground text-zinc-400 text-[10px] uppercase font-bold tracking-wider transition-colors cursor-pointer"
          >
            {showNotes ? "Hide Notes" : "View Notes"}
          </button>
        </div>

        {showNotes && (
          <div className="mt-5 border-t border-border/40 pt-4 space-y-4 animate-fadeIn">
            {loadingNotes ? (
              <div className="py-8 flex flex-col items-center justify-center gap-2 text-xs text-zinc-500 select-none">
                <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                Loading reader annotations...
              </div>
            ) : notes.length === 0 ? (
              <div className="py-8 text-center text-zinc-500 italic select-none">
                No reader notes recorded for this essay.
              </div>
            ) : (
              <div className="space-y-1">
                <div className="divide-y divide-border/30">
                  {notes.map((note) => {
                    const match = note.note_text.match(/^"([\s\S]+?)"\s*—\s*Note:\s*([\s\S]+)$/i);
                    return (
                      <div key={note.id} className="py-3 flex flex-col md:flex-row justify-between gap-3 text-xs">
                        <div className="space-y-2 max-w-2xl w-full">
                          {match ? (
                            <div className="space-y-1.5">
                              <div className="border-l-2 border-primary bg-primary/5 px-3 py-1.5 italic text-zinc-400 font-sans text-[11px] rounded-r-xs">
                                <span className="text-[9px] text-primary uppercase font-bold font-mono block not-italic select-none mb-0.5">Selected Line Context</span>
                                &ldquo;{match[1]}&rdquo;
                              </div>
                              <p className="text-foreground font-sans leading-relaxed break-words whitespace-pre-wrap pl-1 font-medium">
                                {match[2]}
                              </p>
                            </div>
                          ) : (
                            <p className="text-foreground font-sans leading-relaxed break-words whitespace-pre-wrap pl-1">
                              {note.note_text}
                            </p>
                          )}
                          <div className="flex items-center gap-2 text-[9px] text-zinc-500 select-none pl-1">
                            <span className="font-bold text-primary">{note.user_email}</span>
                            <span>•</span>
                            <span>{new Date(note.created_at).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Notes Pagination */}
                {totalNotes > 10 && (
                  <div className="flex justify-between items-center pt-3 border-t border-border/20 select-none">
                    <button
                      onClick={() => setNotesPage(p => Math.max(p - 1, 1))}
                      disabled={notesPage === 1}
                      className="px-2 py-0.5 border border-border bg-background text-zinc-500 hover:text-foreground disabled:opacity-30 cursor-pointer text-[10px]"
                    >
                      Prev
                    </button>
                    <span className="text-[10px] text-zinc-500">
                      Page {notesPage} of {Math.ceil(totalNotes / 10)}
                    </span>
                    <button
                      onClick={() => setNotesPage(p => Math.min(p + 1, Math.ceil(totalNotes / 10)))}
                      disabled={notesPage === Math.ceil(totalNotes / 10)}
                      className="px-2 py-0.5 border border-border bg-background text-zinc-500 hover:text-foreground disabled:opacity-30 cursor-pointer text-[10px]"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Confirmation Modal overlay (archive/unarchive) */}
      {archiveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs select-none">
          <div className="w-full max-w-sm border border-border bg-card-bg p-6 shadow-2xl rounded-sm animate-scaleIn font-mono">
            <div className="flex items-center gap-2 text-red-500 mb-3 text-xs font-bold uppercase tracking-wider">
              <AlertCircle className="h-4.5 w-4.5" />
              Confirm Status Override
            </div>

            <p className="text-[11px] text-zinc-400 leading-relaxed mb-6">
              {article.status === "archived" ? (
                <>
                  Are you absolutely sure you want to <strong>RE-PUBLISH</strong> this essay?
                  This action will make it live and immediately accessible to all readers.
                </>
              ) : (
                <>
                  Are you absolutely sure you want to <strong>ARCHIVE</strong> this essay?
                  This action will take it off the public reading feeds immediately.
                </>
              )}
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
