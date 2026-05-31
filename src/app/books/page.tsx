"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useReader } from "@/context/ReaderContext";
import { 
  BookOpen, Calendar, Layers, Download, Bookmark, BookmarkCheck, ArrowRight,
  Brain, Shield, Terminal, Book, HelpCircle, FileText, Search, Sparkles
} from "lucide-react";
import { useToast } from "@/context/ToastContext";

interface Book {
  id: string;
  title: string;
  publishedDate: string;
  pages: number;
  description: string;
  summary: string;
  pdfUrl: string;
  coverUrl?: string;
  iconName?: string;
}

export default function BooksPage() {
  const { toggleBookmark, isBookmarked } = useReader();
  const toast = useToast();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<string>("recently_added");

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const res = await fetch("/api/books?archived=false");
        const data = await res.json();
        if (data.books) {
          setBooks(data.books);
        }
      } catch (err) {
        console.error("Error retrieving book list:", err);
        toast.error("Failed to load publications.");
      } finally {
        setLoading(false);
      }
    };
    fetchBooks();
  }, []);

  const handleDownload = async (e: React.MouseEvent, book: Book) => {
    e.preventDefault();
    e.stopPropagation();
    toast.info(`Downloading PDF copy of "${book.title}"...`);
    
    // Trigger R2 download statistics increment
    try {
      await fetch(`/api/books?action=download&id=${book.id}`, { method: "PUT" });
    } catch (err) {
      console.error("Failed to increment download statistics:", err);
    }
    
    window.open(book.pdfUrl, "_blank");
  };

  const renderCover = (book: Book) => {
    const getIconComponent = (name: string) => {
      switch (name) {
        case "brain": return <Brain className="h-7 w-7 text-amber-500" />;
        case "shield": return <Shield className="h-7 w-7 text-emerald-500" />;
        case "terminal": return <Terminal className="h-7 w-7 text-indigo-500" />;
        case "bookOpen": return <BookOpen className="h-7 w-7 text-rose-500" />;
        case "book": return <Book className="h-7 w-7 text-blue-500" />;
        default: return <FileText className="h-7 w-7 text-zinc-500" />;
      }
    };

    return (
      <div className="relative group/cover shrink-0 select-none cursor-pointer">
        {/* Physical 3D book spine shadow effect */}
        <div className="relative w-28 h-40 overflow-hidden border border-zinc-800/80 shadow-[6px_6px_16px_rgba(0,0,0,0.6),-1px_0_1px_rgba(255,255,255,0.08)] bg-zinc-950 transition-all duration-300 group-hover/cover:translate-y-[-2px] group-hover/cover:shadow-[8px_8px_20px_rgba(0,0,0,0.7)] flex flex-col justify-between">
          
          {book.coverUrl ? (
            <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover absolute inset-0 z-0" />
          ) : book.iconName ? (
            <div className="w-full h-full flex flex-col items-center justify-between p-3 text-center bg-gradient-to-br from-zinc-900 to-zinc-950 z-10 relative">
              <span className="text-[6px] font-mono text-zinc-500 uppercase tracking-widest">Heinze Edition</span>
              <div className="my-auto py-2 flex justify-center">
                {getIconComponent(book.iconName)}
              </div>
              <span className="text-[7px] font-mono text-zinc-400 uppercase tracking-wider line-clamp-2 leading-tight">
                {book.title}
              </span>
            </div>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-950 flex flex-col justify-between p-3 text-white z-10 relative">
              <span className="text-[7px] font-mono text-zinc-500 uppercase tracking-widest truncate">R. Heinze</span>
              <span className="text-[9px] font-mono font-bold leading-tight line-clamp-4 text-zinc-200 mt-1 uppercase tracking-wide">
                {book.title}
              </span>
              <span className="text-[7px] font-mono text-primary mt-auto border-t border-zinc-800/80 pt-1 uppercase">
                PDF Edition
              </span>
            </div>
          )}
          
          {/* 3D Spine crease overlay */}
          <div className="absolute top-0 left-0 w-2.5 h-full bg-gradient-to-r from-black/40 via-white/5 to-transparent border-r border-black/20 z-20" />
          {/* Page stack edge overlay on the right */}
          <div className="absolute top-0 right-0 w-0.5 h-full bg-white/5 pointer-events-none z-20" />
        </div>
      </div>
    );
  };

  // Client-side filtering & sorting
  const processedBooks = books
    .filter(book => {
      const query = searchQuery.toLowerCase().trim();
      if (!query) return true;
      return (
        book.title.toLowerCase().includes(query) ||
        book.description.toLowerCase().includes(query) ||
        (book.summary && book.summary.toLowerCase().includes(query))
      );
    })
    .sort((a, b) => {
      if (sortOrder === "largest") {
        return b.pages - a.pages;
      }
      if (sortOrder === "recently_added") {
        return new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime();
      }
      return 0;
    });

  return (
    <div className="flex-1 max-w-5xl w-full mx-auto px-4 py-10 font-sans">
      
      {/* Page Header */}
      <div className="border-b border-border pb-6 mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 border border-amber-500/20 bg-amber-500/5 text-amber-500 text-[9px] font-mono uppercase tracking-wider">
            Publications Catalog
          </div>
          <h1 className="text-3xl font-extrabold font-mono tracking-tight text-foreground mt-2 flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-amber-500" />
            Books & Publications
          </h1>
          <p className="text-xs text-zinc-400 max-w-xl">
            Full-length books and monographs written and released by Robert Heinze. Available to read online or download as PDF copies.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search books & themes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-border bg-card-bg text-xs text-foreground outline-hidden focus:border-amber-500 placeholder-zinc-500 transition-colors"
          />
        </div>
      </div>

      {/* Grid Filters Panel */}
      <div className="flex justify-between items-center mb-8 border-b border-border/40 pb-4">
        <span className="text-xs font-mono text-zinc-400">
          Showing {processedBooks.length} of {books.length} publications
        </span>

        {/* Sort Select */}
        <div className="flex items-center gap-1.5 border border-border px-2.5 py-1 bg-background text-[11px] font-mono">
          <span className="text-zinc-500 uppercase">Sort:</span>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="bg-transparent text-foreground border-0 p-0 text-[11px] outline-hidden focus:ring-0 cursor-pointer uppercase font-bold"
          >
            <option value="recently_added">Recently Released</option>
            <option value="largest">Largest (Pages)</option>
          </select>
        </div>
      </div>

      {/* Books Grid */}
      {loading ? (
        // Shimmering Skeletons
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="border border-border bg-card-bg/20 p-5 space-y-4 animate-pulse">
              <div className="flex gap-4">
                <div className="w-24 h-36 bg-zinc-800/10 dark:bg-zinc-200/5 shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-zinc-800/10 dark:bg-zinc-200/5 w-3/4" />
                  <div className="h-3 bg-zinc-800/10 dark:bg-zinc-200/5 w-1/2" />
                  <div className="h-3 bg-zinc-800/10 dark:bg-zinc-200/5 w-full" />
                </div>
              </div>
              <div className="h-10 bg-zinc-800/10 dark:bg-zinc-200/5 w-full" />
            </div>
          ))}
        </div>
      ) : processedBooks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {processedBooks.map((book) => {
            const bookmarked = isBookmarked(book.id);
            return (
              <div
                key={book.id}
                className="group border border-border bg-card-bg/30 hover:bg-card-bg/70 hover:border-zinc-700 transition-all duration-200 p-5 rounded-none flex flex-col justify-between"
              >
                <div>
                  <div className="flex gap-5">
                    {renderCover(book)}

                    <div className="space-y-2 min-w-0">
                      <h2 className="text-sm font-bold font-mono text-foreground group-hover:text-primary transition-colors leading-snug">
                        <Link href={`/books/${book.id}`}>{book.title}</Link>
                      </h2>
                      
                      <div className="flex flex-col gap-1 text-[10px] font-mono text-zinc-500">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-zinc-600" />
                          <span>Released: {book.publishedDate}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Layers className="h-3.5 w-3.5 text-zinc-600" />
                          <span>Length: {book.pages} pages</span>
                        </div>
                      </div>

                      <p className="text-xs text-zinc-400 leading-relaxed line-clamp-3">
                        {book.description}
                      </p>
                    </div>
                  </div>

                  {/* Themes section */}
                  {book.summary && (
                    <div className="mt-4 p-3 bg-background/50 border border-border/80 text-[11px] leading-relaxed">
                      <div className="font-mono text-[9px] text-zinc-500 uppercase tracking-wider mb-1 font-bold flex items-center gap-1">
                        <Sparkles className="h-3 w-3 text-primary" />
                        Key Themes:
                      </div>
                      <p className="text-zinc-400 line-clamp-2">{book.summary}</p>
                    </div>
                  )}
                </div>

                {/* Footer buttons */}
                <div className="mt-5 pt-4 border-t border-border/50 flex justify-between items-center gap-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleBookmark(book.id)}
                      title={bookmarked ? "Bookmarked" : "Add Bookmark"}
                      className={`p-1.5 border border-border bg-background transition-colors hover:text-primary ${
                        bookmarked ? "text-primary border-primary/20 bg-primary/5" : "text-zinc-500"
                      }`}
                    >
                      {bookmarked ? <BookmarkCheck className="h-3.5 w-3.5" /> : <Bookmark className="h-3.5 w-3.5" />}
                    </button>

                    <button
                      onClick={(e) => handleDownload(e, book)}
                      title="Download PDF Copy"
                      className="p-1.5 border border-border bg-background text-zinc-500 hover:text-primary hover:border-primary/35 transition-colors"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <Link
                    href={`/books/${book.id}`}
                    className="text-xs font-mono text-foreground hover:text-primary font-bold flex items-center gap-1 border border-border px-3 py-1 bg-background hover:border-primary transition-colors"
                  >
                    Open PDF Reader
                    <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center font-mono text-zinc-500 py-16 border border-dashed border-border text-xs">
          No books found matching search query.
        </div>
      )}
    </div>
  );
}
