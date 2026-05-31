"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useReader } from "@/context/ReaderContext";
import { authClient } from "@/lib/auth-client";
import { useToast } from "@/context/ToastContext";
import { 
  User, BookOpen, Clock, Bookmark, Download, Trash2, 
  LogOut, ArrowLeft, ShieldAlert, Sparkles, CheckCircle2 
} from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const toast = useToast();
  const { stats, bookmarks, resetStats } = useReader();

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [downloadedBookIds, setDownloadedBookIds] = useState<string[]>([]);
  const [completedDates, setCompletedDates] = useState<Record<string, number>>({});
  const [articlesList, setArticlesList] = useState<any[]>([]);
  const [booksList, setBooksList] = useState<any[]>([]);

  // Fetch session and local states
  useEffect(() => {
    const initPage = async () => {
      try {
        const res = await authClient.getSession();
        if (res?.data) {
          setUser(res.data.user);
        } else {
          // If no active session, redirect to login
          router.push("/login");
          return;
        }
      } catch (err) {
        console.error("Session error:", err);
      } finally {
        setLoading(false);
      }
    };
    initPage();

    // Load downloads
    try {
      const savedDownloads = localStorage.getItem('heinze_downloads');
      if (savedDownloads) {
        setDownloadedBookIds(JSON.parse(savedDownloads));
      }
    } catch (e) {
      console.error(e);
    }

    // Load completions with timestamps
    try {
      const savedDates = localStorage.getItem('heinze_completed_dates');
      if (savedDates) {
        setCompletedDates(JSON.parse(savedDates));
      }
    } catch (e) {
      console.error(e);
    }

    // Fetch all articles
    fetch('/api/articles?limit=100')
      .then(res => res.json())
      .then(data => {
        if (data.articles) setArticlesList(data.articles);
      })
      .catch(err => console.error("Error fetching articles list:", err));

    // Fetch all books
    fetch('/api/books?limit=100')
      .then(res => res.json())
      .then(data => {
        if (data.books) setBooksList(data.books);
      })
      .catch(err => console.error("Error fetching books list:", err));
  }, [router]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const hours = Math.floor(mins / 60);
    if (hours > 0) return `${hours}h ${mins % 60}m`;
    if (mins > 0) return `${mins}m ${secs % 60}s`;
    return `${secs}s`;
  };

  const handleSignOut = async () => {
    await authClient.signOut();
    toast.success("Signed out successfully!");
    router.push("/");
    router.refresh();
  };

  const handlePurgeData = async () => {
    const confirmed = await toast.confirm({
      title: "Purge Personal Telemetry",
      message: "WARNING: Irreversible Action. Are you absolutely sure you want to delete all bookmarks, highlights, notes, downloaded history, and reading statistics? All local reading data will be purged forever.",
      confirmText: "Purge Everything",
      cancelText: "Cancel",
      variant: "danger"
    });
    if (confirmed) {
      // Clear localStorage keys
      localStorage.removeItem('heinze_stats');
      localStorage.removeItem('heinze_bookmarks');
      localStorage.removeItem('heinze_highlights');
      localStorage.removeItem('heinze_notes');
      localStorage.removeItem('heinze_downloads');
      localStorage.removeItem('heinze_completed_dates');
      
      // Sign out session
      await authClient.signOut();
      toast.success("All personal telemetry purged and signed out successfully.");
      
      // Redirect home and reload
      router.push("/");
      setTimeout(() => {
        window.location.reload();
      }, 300);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 max-w-4xl w-full mx-auto px-4 py-12 space-y-6 font-mono text-xs select-none">
        <div className="h-6 bg-zinc-800/10 dark:bg-zinc-200/5 w-1/4 animate-pulse" />
        <div className="border border-border p-12 space-y-4">
          <div className="h-5 bg-zinc-800/10 dark:bg-zinc-200/5 w-2/3 animate-pulse" />
          <div className="h-3 bg-zinc-800/10 dark:bg-zinc-200/5 w-full animate-pulse" />
          <div className="h-3.5 bg-zinc-800/10 dark:bg-zinc-200/5 w-5/6 animate-pulse" />
          <div className="h-3 bg-zinc-800/10 dark:bg-zinc-200/5 w-full animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 font-mono select-text">
      
      {/* Back button */}
      <div className="mb-6">
        <Link 
          href="/" 
          className="inline-flex items-center gap-1.5 text-zinc-500 hover:text-foreground text-xs uppercase tracking-wider transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to home
        </Link>
      </div>

      {/* Main Container */}
      <div className="border border-zinc-800 bg-zinc-950/40 backdrop-blur-md p-6 md:p-8 space-y-8 shadow-2xl rounded-sm">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-zinc-800">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-sm bg-zinc-900 border border-zinc-800 flex items-center justify-center text-primary text-xl font-bold shadow-lg shadow-black/40 relative group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              {user?.name ? user.name.charAt(0).toUpperCase() : <User />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-foreground tracking-tight">{user?.name}</h1>
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              </div>
              <p className="text-[10px] text-zinc-500 mt-0.5">{user?.email}</p>
              {user?.role === "admin" ? (
                <div className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-500 text-[8px] uppercase tracking-wider font-bold px-2.5 py-0.5 mt-2 border border-amber-500/20">
                  <Sparkles className="h-2 w-2" />
                  System Administrator
                </div>
              ) : (
                <div className="inline-block bg-primary/10 text-primary text-[8px] uppercase tracking-wider font-bold px-2.5 py-0.5 mt-2 border border-primary/20">
                  Verified Reader
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {user?.role === "admin" && (
              <Link
                href="/admin"
                className="border border-amber-500/30 hover:border-amber-500 bg-amber-500/5 hover:bg-amber-500/10 text-amber-400 px-4 py-2 uppercase font-bold text-[10px] tracking-wider transition-all flex items-center gap-1.5 cursor-pointer rounded-xs"
              >
                Admin Panel
              </Link>
            )}
            <button
              onClick={handleSignOut}
              className="border border-zinc-800 hover:border-zinc-500 bg-zinc-900 hover:bg-zinc-850 px-4 py-2 uppercase font-bold text-[10px] tracking-wider transition-all flex items-center gap-1.5 cursor-pointer rounded-xs"
            >
              <LogOut className="h-3.5 w-3.5 text-zinc-500" />
              Sign Out
            </button>
          </div>
        </div>

        {/* Telemetry Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="border border-zinc-850 bg-zinc-900/40 p-4 relative overflow-hidden group hover:border-zinc-750 transition-colors rounded-xs">
            <Clock className="absolute right-3 top-3 h-10 w-10 text-zinc-500/5 group-hover:text-primary/10 transition-colors pointer-events-none" />
            <div className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider">Focus Telemetry</div>
            <div className="text-xl font-bold mt-1 text-primary tracking-tight">{formatTime(stats.timeSpentSeconds)}</div>
            <p className="text-[8px] text-zinc-500 mt-1">Accumulated cognitive reading duration</p>
          </div>

          <div className="border border-zinc-850 bg-zinc-900/40 p-4 relative overflow-hidden group hover:border-zinc-750 transition-colors rounded-xs">
            <BookOpen className="absolute right-3 top-3 h-10 w-10 text-zinc-500/5 group-hover:text-primary/10 transition-colors pointer-events-none" />
            <div className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider">Words Processed</div>
            <div className="text-xl font-bold mt-1 text-foreground tracking-tight">{stats.wordsRead.toLocaleString()}</div>
            <p className="text-[8px] text-zinc-500 mt-1">Total words processed across essays</p>
          </div>

          <div className="border border-zinc-850 bg-zinc-900/40 p-4 relative overflow-hidden group hover:border-zinc-750 transition-colors rounded-xs">
            <CheckCircle2 className="absolute right-3 top-3 h-10 w-10 text-zinc-500/5 group-hover:text-primary/10 transition-colors pointer-events-none" />
            <div className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider">Completed Works</div>
            <div className="text-xl font-bold mt-1 text-amber-500 tracking-tight">{stats.completedItems.length}</div>
            <p className="text-[8px] text-zinc-500 mt-1">Essays and volumes completely finished</p>
          </div>
        </div>

        {/* Main Section Content List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
          
          {/* Column 1: Reading & Completed History */}
          <div className="space-y-6">
            <div className="border border-zinc-850/60 bg-zinc-900/20 p-5 rounded-xs">
              <h2 className="text-[11px] uppercase font-bold tracking-wider text-primary border-b border-zinc-850 pb-2.5 mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Completions History ({stats.completedItems.length})
              </h2>
              {(() => {
                const completedArticles = articlesList.filter(a => stats.completedItems.includes(a.id));
                const completedBooks = booksList.filter(b => stats.completedItems.includes(b.id));

                if (completedArticles.length === 0 && completedBooks.length === 0) {
                  return <p className="text-zinc-500 italic text-[10px] py-4">No books or essays marked completed yet.</p>;
                }

                return (
                  <ul className="divide-y divide-zinc-900">
                    {completedArticles.map(art => {
                      const dateStr = completedDates[art.id] 
                        ? new Date(completedDates[art.id]).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) 
                        : 'Recently';
                      return (
                        <li key={art.id} className="py-3 flex flex-col gap-1 group">
                          <Link 
                            href={`/articles/${art.id}`} 
                            className="hover:text-primary text-[11px] text-foreground font-bold tracking-tight transition-colors"
                          >
                            [Essay] {art.title}
                          </Link>
                          <span className="text-zinc-500 text-[9px]">Completed: {dateStr}</span>
                        </li>
                      );
                    })}
                    {completedBooks.map(bk => {
                      const dateStr = completedDates[bk.id] 
                        ? new Date(completedDates[bk.id]).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) 
                        : 'Recently';
                      return (
                        <li key={bk.id} className="py-3 flex flex-col gap-1 group">
                          <Link 
                            href={`/books/${bk.id}`} 
                            className="hover:text-amber-500 text-[11px] text-amber-500/90 font-bold tracking-tight transition-colors"
                          >
                            [Volume] {bk.title}
                          </Link>
                          <span className="text-zinc-500 text-[9px]">Completed: {dateStr}</span>
                        </li>
                      );
                    })}
                  </ul>
                );
              })()}
            </div>
          </div>

          {/* Column 2: Bookmarks and Downloads */}
          <div className="space-y-6">
            
            {/* Bookmarks */}
            <div className="border border-zinc-850/60 bg-zinc-900/20 p-5 rounded-xs">
              <h2 className="text-[11px] uppercase font-bold tracking-wider text-primary border-b border-zinc-850 pb-2.5 mb-3 flex items-center gap-2">
                <Bookmark className="h-4 w-4 text-primary" />
                Bookmarked Works ({bookmarks.length})
              </h2>
              {(() => {
                const bookmarkedArticles = articlesList.filter(a => bookmarks.includes(a.id));
                const bookmarkedBooks = booksList.filter(b => bookmarks.includes(b.id));

                if (bookmarkedArticles.length === 0 && bookmarkedBooks.length === 0) {
                  return <p className="text-zinc-500 italic text-[10px] py-4">No bookmarked volumes or essays.</p>;
                }

                return (
                  <ul className="divide-y divide-zinc-900">
                    {bookmarkedArticles.map(art => (
                      <li key={art.id} className="py-3">
                        <Link 
                          href={`/articles/${art.id}`} 
                          className="hover:text-primary text-[11px] text-foreground font-bold tracking-tight block transition-colors"
                        >
                          [Essay] {art.title}
                        </Link>
                        <span className="text-[9px] text-zinc-500 uppercase mt-0.5 block">{art.category}</span>
                      </li>
                    ))}
                    {bookmarkedBooks.map(bk => (
                      <li key={bk.id} className="py-3">
                        <Link 
                          href={`/books/${bk.id}`} 
                          className="hover:text-amber-500 text-[11px] text-amber-500/90 font-bold tracking-tight block transition-colors"
                        >
                          [Volume] {bk.title}
                        </Link>
                        <span className="text-[9px] text-zinc-500 uppercase mt-0.5 block">{bk.pages} Pages</span>
                      </li>
                    ))}
                  </ul>
                );
              })()}
            </div>

            {/* Downloads */}
            <div className="border border-zinc-850/60 bg-zinc-900/20 p-5 rounded-xs">
              <h2 className="text-[11px] uppercase font-bold tracking-wider text-primary border-b border-zinc-850 pb-2.5 mb-3 flex items-center gap-2">
                <Download className="h-4 w-4 text-primary" />
                Downloaded Volumes ({downloadedBookIds.length})
              </h2>
              {(() => {
                const downloadedBooks = booksList.filter(b => downloadedBookIds.includes(b.id));

                if (downloadedBooks.length === 0) {
                  return <p className="text-zinc-500 italic text-[10px] py-4">No volumes downloaded yet.</p>;
                }

                return (
                  <ul className="divide-y divide-zinc-900">
                    {downloadedBooks.map(bk => (
                      <li key={bk.id} className="py-3 flex items-center justify-between gap-4">
                        <div className="overflow-hidden">
                          <Link 
                            href={`/books/${bk.id}`} 
                            className="hover:text-amber-500 text-[11px] text-amber-500/90 font-bold tracking-tight truncate block transition-colors"
                          >
                            {bk.title}
                          </Link>
                          <span className="text-[9px] text-zinc-500 uppercase block mt-0.5">{bk.pages} Pages</span>
                        </div>
                        {bk.pdfUrl && (
                          <a 
                            href={bk.pdfUrl} 
                            target="_blank" 
                            rel="noreferrer"
                            className="text-[9px] border border-zinc-800 bg-zinc-900 px-2.5 py-1 hover:text-primary transition-all font-bold uppercase tracking-wider cursor-pointer rounded-xs shrink-0"
                          >
                            Get PDF
                          </a>
                        )}
                      </li>
                    ))}
                  </ul>
                );
              })()}
            </div>

          </div>

        </div>

        {/* Danger Zone */}
        <div className="border border-red-950 bg-red-950/5 p-6 space-y-4 rounded-xs">
          <div className="flex items-center gap-2 text-red-400">
            <ShieldAlert className="h-4 w-4" />
            <h2 className="text-[11px] uppercase font-bold tracking-wider">Danger Zone</h2>
          </div>
          <p className="text-[10px] text-zinc-500 leading-relaxed max-w-2xl">
            Purging your telemetry data will permanently wipe all local reading session context. Bookmarks, completed items timestamps, notes, and local storage configurations will be deleted. This cannot be undone.
          </p>
          <div>
            <button
              onClick={handlePurgeData}
              className="border border-red-900 hover:border-red-600 text-red-400/90 hover:text-red-450 hover:bg-red-950/15 px-4 py-2 uppercase font-bold text-[10px] tracking-wider transition-all flex items-center gap-1.5 cursor-pointer rounded-xs"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Purge Telemetry Data & Logout
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
