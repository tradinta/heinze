"use client";

import React, { useState, useEffect, useRef } from "react";
import { useReader, ThemeType, FontClassType, FontSizeClassType } from "@/context/ReaderContext";
import { useRouter, usePathname } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Search, Book, FileText, Settings, Eye, Volume2, VolumeX, Shield, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function CommandCenter() {
  const { 
    isSearchOpen, setIsSearchOpen, 
    focusMode, setFocusMode, 
    theme, setTheme, 
    fontClass, setFontClass, 
    fontSizeClass, setFontSizeClass,
    isPlayingSpeech, setIsPlayingSpeech,
    bookmarks
  } = useReader();

  const [query, setQuery] = useState("");
  const [articles, setArticles] = useState<any[]>([]);
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const router = useRouter();
  const pathname = usePathname();
  const inputRef = useRef<HTMLInputElement>(null);
  const activeItemRef = useRef<HTMLButtonElement>(null);

  // Check admin session and fetch content
  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      document.body.style.overflow = "hidden";
      
      const checkAdminAndFetch = async () => {
        setLoading(true);
        try {
          // 1. Session verification
          const sessionRes = await authClient.getSession();
          setIsAdmin(sessionRes?.data?.user?.role === "admin");

          // 2. Fetch content
          const [artRes, bksRes] = await Promise.all([
            fetch("/api/articles?limit=500&status=published").then(r => r.json()),
            fetch("/api/books?limit=500&archived=false").then(r => r.json())
          ]);
          
          if (artRes && artRes.articles) {
            setArticles(artRes.articles);
          }
          if (bksRes && bksRes.books) {
            setBooks(bksRes.books);
          }
        } catch (err) {
          console.error("Failed to load CommandCenter session/data:", err);
        } finally {
          setLoading(false);
        }
      };
      
      checkAdminAndFetch();
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isSearchOpen]);

  // Reset selected index when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Scroll active item into view
  useEffect(() => {
    if (activeItemRef.current) {
      activeItemRef.current.scrollIntoView({
        behavior: "auto",
        block: "nearest",
      });
    }
  }, [selectedIndex]);

  // Filter content - Supports hashtag categories like #AI or #Philosophy
  const isCategoryQuery = query.startsWith("#");
  const cleanQuery = isCategoryQuery ? query.substring(1).trim().toLowerCase() : query.toLowerCase();

  const filteredArticles = articles.filter((article) => {
    if (!query) return true;
    if (isCategoryQuery) {
      return (article.category || "").toLowerCase().includes(cleanQuery);
    }
    return (
      (article.title || "").toLowerCase().includes(cleanQuery) ||
      (article.description || "").toLowerCase().includes(cleanQuery) ||
      (article.category || "").toLowerCase().includes(cleanQuery)
    );
  });

  const filteredBooks = books.filter((book) => {
    if (isCategoryQuery) return false; // Books don't have categories in general index
    if (!query) return true;
    return (
      (book.title || "").toLowerCase().includes(cleanQuery) ||
      (book.description || "").toLowerCase().includes(cleanQuery)
    );
  });

  const handleNavigate = (path: string) => {
    setIsSearchOpen(false);
    setQuery("");
    router.push(path);
  };

  const handleCommand = (cmd: () => void) => {
    cmd();
    setIsSearchOpen(false);
  };

  // Resolve bookmarked items
  const bookmarkedArticles = articles.filter(art => bookmarks.includes(art.id));
  const bookmarkedBooks = books.filter(bk => bookmarks.includes(bk.id));

  // Build a single flat indexable list of elements for arrows & enter key navigation
  const allItems: any[] = [];

  if (query.trim() === "") {
    // 1. Actions group
    allItems.push({
      type: "action",
      id: "focus",
      label: `Toggle Focus Mode: ${focusMode ? "ON" : "OFF"}`,
      sub: "Hides sidebars for pure distraction-free reading",
      icon: Eye,
      run: () => handleCommand(() => setFocusMode(!focusMode))
    });
    allItems.push({
      type: "action",
      id: "theme",
      label: `Cycle Theme: ${theme.toUpperCase()}`,
      sub: "Toggles between Light, Sepia, and Dark interfaces",
      icon: Settings,
      run: () => handleCommand(() => {
        const themes: ThemeType[] = ["light", "sepia", "dark"];
        const nextIdx = (themes.indexOf(theme) + 1) % themes.length;
        setTheme(themes[nextIdx]);
      })
    });
    allItems.push({
      type: "action",
      id: "font",
      label: `Toggle Typography: ${fontClass.replace("font-", "").toUpperCase()}`,
      sub: "Switch styling between Sans, Serif, and Monospace",
      icon: FileText,
      run: () => handleCommand(() => {
        const fonts: FontClassType[] = ["font-sans", "font-serif", "font-mono"];
        const nextIdx = (fonts.indexOf(fontClass) + 1) % fonts.length;
        setFontClass(fonts[nextIdx]);
      })
    });
    allItems.push({
      type: "action",
      id: "size",
      label: `Toggle Font Size: ${fontSizeClass.replace("text-", "").toUpperCase()}`,
      sub: "Adjust character scale inside article readers",
      icon: Settings,
      run: () => handleCommand(() => {
        const sizes: FontSizeClassType[] = ["text-sm", "text-base", "text-lg", "text-xl"];
        const nextIdx = (sizes.indexOf(fontSizeClass) + 1) % sizes.length;
        setFontSizeClass(sizes[nextIdx]);
      })
    });

    if (pathname.includes("/articles/")) {
      allItems.push({
        type: "action",
        id: "speech",
        label: isPlayingSpeech ? "Stop Audio Narration" : "Listen to Essay (TTS)",
        sub: isPlayingSpeech ? "Speaking active" : "Read aloud current article page",
        icon: isPlayingSpeech ? VolumeX : Volume2,
        run: () => handleCommand(() => setIsPlayingSpeech(!isPlayingSpeech))
      });
    }

    if (isAdmin) {
      allItems.push({
        type: "action",
        id: "admin",
        label: "Admin Dashboard Console",
        sub: "Access administrative workspace, articles database and telemetry logs",
        icon: Shield,
        run: () => handleNavigate("/admin")
      });
    }

    // 2. Bookmarks group
    bookmarkedArticles.forEach(art => {
      allItems.push({
        type: "bookmark",
        id: art.id,
        label: art.title,
        sub: "Bookmarked Essay",
        icon: FileText,
        run: () => handleNavigate(`/articles/${art.id}`)
      });
    });

    bookmarkedBooks.forEach(bk => {
      allItems.push({
        type: "bookmark",
        id: bk.id,
        label: bk.title,
        sub: "Bookmarked Book",
        icon: Book,
        run: () => handleNavigate(`/books/${bk.id}`)
      });
    });
  } else {
    // Search results group
    filteredArticles.forEach(art => {
      allItems.push({
        type: "search_article",
        id: art.id,
        label: art.title,
        sub: `Essay • ${art.category || "General"}`,
        icon: FileText,
        run: () => handleNavigate(`/articles/${art.id}`)
      });
    });

    filteredBooks.forEach(bk => {
      allItems.push({
        type: "search_book",
        id: bk.id,
        label: bk.title,
        sub: "Book Library",
        icon: Book,
        run: () => handleNavigate(`/books/${bk.id}`)
      });
    });
  }

  // Keyboard navigation event handler
  useEffect(() => {
    if (!isSearchOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (allItems.length > 0 ? (prev + 1) % allItems.length : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (allItems.length > 0 ? (prev - 1 + allItems.length) % allItems.length : 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (allItems[selectedIndex]) {
          allItems[selectedIndex].run();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSearchOpen, allItems, selectedIndex]);

  return (
    <AnimatePresence>
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSearchOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-xs"
          />

          {/* Search Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -10 }}
            transition={{ duration: 0.15 }}
            className="relative w-full max-w-xl overflow-hidden border border-border bg-card-bg text-foreground shadow-2xl rounded-sm"
          >
            {/* Input Header */}
            <div className="flex items-center border-b border-border px-4 py-3">
              <Search className="h-4 w-4 text-zinc-400 mr-3 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search articles, books, settings or type # for category..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setIsSearchOpen(false);
                  }
                }}
                className="w-full bg-transparent text-sm text-foreground outline-hidden placeholder-zinc-500"
              />
              <kbd className="hidden sm:inline-block shrink-0 px-2 py-0.5 text-[10px] font-mono border border-border bg-background/50 rounded-xs text-zinc-400">
                ESC
              </kbd>
            </div>

            {/* Results Area */}
            <div className="max-h-[350px] overflow-y-auto p-2 scrollbar">
              {loading ? (
                <div className="py-8 flex flex-col items-center justify-center gap-2 text-xs text-zinc-500 font-mono">
                  <Loader2 className="h-4.5 w-4.5 animate-spin text-primary" />
                  Indexing database...
                </div>
              ) : allItems.length === 0 ? (
                <div className="py-8 text-center text-xs text-zinc-500 font-mono">
                  No results or active bookmarks found for &quot;{query}&quot;
                </div>
              ) : (
                <div className="space-y-0.5">
                  {allItems.map((item, index) => {
                    const isSelected = index === selectedIndex;
                    const showHeader = index === 0 || allItems[index - 1].type !== item.type;
                    const Icon = item.icon;

                    let groupTitle = "";
                    if (showHeader) {
                      if (item.type === "action") groupTitle = "Quick Actions";
                      else if (item.type === "bookmark") groupTitle = "Bookmarks";
                      else if (item.type === "search_article") groupTitle = "Articles Shelf";
                      else if (item.type === "search_book") groupTitle = "Books Library";
                    }

                    return (
                      <div key={`${item.type}-${item.id}`}>
                        {showHeader && (
                          <div className="px-3 py-1.5 text-[9px] font-mono tracking-wider text-zinc-500 uppercase mt-2 first:mt-0 select-none">
                            {groupTitle}
                          </div>
                        )}
                        <button
                          ref={isSelected ? activeItemRef : null}
                          onClick={item.run}
                          className={`flex w-full items-start px-3 py-2 text-xs text-left transition-all rounded-xs gap-3 ${
                            isSelected 
                              ? "bg-zinc-800 text-foreground border-l-2 border-primary" 
                              : "hover:bg-zinc-900 text-zinc-300 border-l-2 border-transparent"
                          }`}
                        >
                          <Icon className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${isSelected ? "text-primary" : "text-zinc-500"}`} />
                          <div className="flex-1 overflow-hidden">
                            <div className={`font-medium ${isSelected ? "text-foreground" : "text-zinc-200"}`}>{item.label}</div>
                            <div className="text-[10px] text-zinc-500 truncate mt-0.5">{item.sub}</div>
                          </div>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer controls guide */}
            <div className="flex items-center justify-between border-t border-border bg-background/50 px-4 py-2 text-[10px] text-zinc-500">
              <div className="flex gap-4">
                <span>
                  <kbd className="px-1 border border-border rounded-xs font-mono bg-card-bg">↑↓</kbd> to navigate
                </span>
                <span>
                  <kbd className="px-1 border border-border rounded-xs font-mono bg-card-bg">⏎</kbd> to select
                </span>
              </div>
              <span>Robert Heinze Portal</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
