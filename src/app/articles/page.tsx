"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useReader } from "@/context/ReaderContext";
import { Search, Clock, ArrowRight, Bookmark, BookmarkCheck, FileText, Eye, Sparkles, Tag, X } from "lucide-react";
import { useToast } from "@/context/ToastContext";

interface Article {
  id: string;
  title: string;
  category: string;
  publishedDate: string;
  readTime: string;
  description: string;
  tags: string[];
  visits: number;
  bookmarksCount: number;
  coverImage?: string | null;
  highlighted?: boolean;
}

export default function ArticlesPage() {
  const { toggleBookmark, isBookmarked } = useReader();
  const toast = useToast();
  
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<string>("recently_added");

  const categories = ["All", "AI", "Intelligence", "Philosophy", "General"];

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        status: "published",
        search: searchQuery || "",
        category: selectedCategory === "All" ? "" : selectedCategory,
        sort: sortOrder
      });

      const res = await fetch(`/api/articles?${params.toString()}`);
      const data = await res.json();
      if (data.articles) {
        setArticles(data.articles);
      }
    } catch (err) {
      console.error("Error retrieving articles:", err);
      toast.error("Failed to load articles.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch articles on state updates
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchArticles();
    }, 200);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, selectedCategory, sortOrder]);

  const handleToggleBookmark = async (e: React.MouseEvent, artId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const currentlyBookmarked = isBookmarked(artId);
    toggleBookmark(artId);

    try {
      const params = new URLSearchParams({
        action: "bookmark",
        id: artId,
        undo: currentlyBookmarked.toString()
      });
      await fetch(`/api/articles?${params.toString()}`, { method: "PUT" });
      
      // Update local state
      setArticles(prev => prev.map(art => {
        if (art.id === artId) {
          return {
            ...art,
            bookmarksCount: Math.max(0, art.bookmarksCount + (currentlyBookmarked ? -1 : 1))
          };
        }
        return art;
      }));
    } catch (err) {
      console.error("Failed to sync bookmark update:", err);
    }
  };

  // Get all unique tags from active articles to show a tag cloud/filter
  const allTags = Array.from(
    new Set(articles.flatMap(art => art.tags || []))
  ).slice(0, 12);

  // Client-side filter by selected tag
  const filteredArticles = selectedTag
    ? articles.filter(art => art.tags?.includes(selectedTag))
    : articles;

  // Split highlighted articles and normal articles
  const highlightedArticles = filteredArticles.filter(art => art.highlighted);
  const regularArticles = filteredArticles.filter(art => !art.highlighted);

  return (
    <div className="flex-1 max-w-5xl w-full mx-auto px-4 py-10 font-sans">
      
      {/* Editorial Header */}
      <div className="border-b border-border pb-6 mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 border border-primary/20 bg-primary/5 text-primary text-[9px] font-mono uppercase tracking-wider">
            Critical Essays
          </div>
          <h1 className="text-3xl font-extrabold font-mono tracking-tight text-foreground mt-2 flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            Essays & Articles
          </h1>
          <p className="text-xs text-zinc-400 max-w-xl">
            Reflections, analyses and studies on cognitive theory, computational intelligence, cybernetics, and human-centric design.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search publications..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setSelectedTag(null); }}
            className="w-full pl-9 pr-4 py-2 border border-border bg-card-bg text-xs text-foreground outline-hidden focus:border-primary placeholder-zinc-500 transition-colors"
          />
        </div>
      </div>

      {/* Interactive Toolbar: Category Selection & Sort */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center mb-8 border-b border-border/40 pb-4">
        {/* Category Filter */}
        <div className="flex flex-wrap gap-1">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => { setSelectedCategory(category); setSelectedTag(null); }}
              className={`px-3 py-1 text-xs font-mono transition-all border ${
                selectedCategory === category
                  ? "bg-primary border-primary text-white font-bold"
                  : "border-border bg-card-bg/30 text-zinc-400 hover:text-foreground hover:bg-card-bg/60"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Sorting */}
          <div className="flex items-center gap-1.5 border border-border px-2.5 py-1 bg-background text-[11px] font-mono shrink-0">
            <span className="text-zinc-500 uppercase">Sort:</span>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="bg-transparent text-foreground border-0 p-0 text-[11px] outline-hidden focus:ring-0 cursor-pointer uppercase font-bold"
            >
              <option value="recently_added">Recently Published</option>
              <option value="most_read">Most Visited</option>
              <option value="most_bookmarked">Most Bookmarked</option>
            </select>
          </div>

          {/* Quick Tag cloud filter */}
          {allTags.length > 0 && (
            <div className="flex items-center gap-1.5 border border-border px-2.5 py-1 bg-background text-[11px] font-mono">
              <span className="text-zinc-500 uppercase">Tags:</span>
              <select
                value={selectedTag || ""}
                onChange={(e) => setSelectedTag(e.target.value || null)}
                className="bg-transparent text-foreground border-0 p-0 text-[11px] outline-hidden focus:ring-0 cursor-pointer uppercase font-bold"
              >
                <option value="">All Tags</option>
                {allTags.map(tag => (
                  <option key={tag} value={tag}>#{tag}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Active filters summary */}
      {selectedTag && (
        <div className="flex items-center gap-2 mb-6 text-xs font-mono">
          <span className="text-zinc-500">Active Tag Filter:</span>
          <span className="bg-primary/10 border border-primary/20 text-primary px-2 py-0.5 font-bold flex items-center gap-1">
            #{selectedTag}
            <button onClick={() => setSelectedTag(null)} className="hover:text-red-400">
              <X className="h-3 w-3" />
            </button>
          </span>
        </div>
      )}

      {loading ? (
        // Shimmering Skeletons
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="border border-border bg-card-bg/20 p-5 flex flex-col md:flex-row gap-6 animate-pulse">
              <div className="md:w-48 w-full h-36 bg-zinc-800/10 dark:bg-zinc-200/5 shrink-0" />
              <div className="flex-1 space-y-3 py-1">
                <div className="h-4 bg-zinc-800/10 dark:bg-zinc-200/5 w-1/4" />
                <div className="h-6 bg-zinc-800/10 dark:bg-zinc-200/5 w-3/4" />
                <div className="h-4 bg-zinc-800/10 dark:bg-zinc-200/5 w-full" />
                <div className="h-4 bg-zinc-800/10 dark:bg-zinc-200/5 w-5/6" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredArticles.length > 0 ? (
        <div className="space-y-10">
          
          {/* FEATURED / HIGHLIGHTED SECTION */}
          {highlightedArticles.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-[10px] font-mono font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                Featured Editorial Highlights
              </h2>
              <div className="grid grid-cols-1 gap-6">
                {highlightedArticles.map((article) => {
                  const bookmarked = isBookmarked(article.id);
                  return (
                    <div
                      key={article.id}
                      className="group border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-all duration-300 relative flex flex-col md:flex-row gap-6 p-6 shadow-lg shadow-primary/5 hover:border-primary/50"
                    >
                      {/* Decorative glowing corner */}
                      <div className="absolute top-0 right-0 w-8 h-8 bg-gradient-to-bl from-primary/20 to-transparent pointer-events-none" />
                      
                      {/* Cover Image Block */}
                      {article.coverImage ? (
                        <div className="md:w-56 w-full md:h-40 h-48 shrink-0 overflow-hidden border border-primary/20 relative shadow-inner">
                          <img 
                            src={article.coverImage} 
                            alt={article.title} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                          />
                        </div>
                      ) : (
                        <div className="md:w-56 w-full md:h-40 h-48 shrink-0 bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800/80 flex flex-col justify-between p-4 select-none">
                          <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">{article.category}</span>
                          <Sparkles className="h-7 w-7 text-primary/30" />
                          <span className="text-[8px] font-mono text-zinc-700">HEINZE SELECTION</span>
                        </div>
                      )}

                      {/* Content details */}
                      <div className="flex-1 flex flex-col justify-between min-w-0 space-y-3">
                        <div className="space-y-2">
                          <div className="flex items-center flex-wrap gap-2 text-[10px] font-mono text-zinc-500">
                            <span className="text-primary bg-primary/10 px-1.5 py-0.5 border border-primary/20 uppercase font-bold">
                              {article.category}
                            </span>
                            <span>•</span>
                            <span>{article.publishedDate}</span>
                            <span>•</span>
                            <span className="flex items-center gap-0.5">
                              <Clock className="h-3 w-3" />
                              {article.readTime}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-0.5">
                              <Eye className="h-3 w-3" />
                              {article.visits}
                            </span>
                          </div>

                          <h3 className="text-xl font-bold font-mono group-hover:text-primary transition-colors leading-tight text-foreground">
                            <Link href={`/articles/${article.id}`}>
                              {article.title}
                            </Link>
                          </h3>

                          <p className="text-xs text-zinc-300 leading-relaxed line-clamp-3">
                            {article.description}
                          </p>
                        </div>

                        <div className="flex items-center justify-between gap-4 pt-2 border-t border-primary/10">
                          <div className="flex flex-wrap gap-1">
                            {article.tags?.map((tag) => (
                              <button 
                                key={tag} 
                                onClick={() => setSelectedTag(tag)}
                                className="bg-background/80 hover:bg-background px-2 py-0.5 border border-border text-[9px] font-mono text-zinc-400 hover:text-foreground transition-colors"
                              >
                                #{tag}
                              </button>
                            ))}
                          </div>

                          <div className="flex items-center gap-3">
                            <button
                              onClick={(e) => handleToggleBookmark(e, article.id)}
                              className={`p-1.5 border transition-all ${
                                bookmarked 
                                  ? "text-primary border-primary/30 bg-primary/5" 
                                  : "text-zinc-500 border-border hover:border-zinc-700 hover:text-foreground bg-background"
                              }`}
                              title={bookmarked ? "Bookmarked" : "Bookmark article"}
                            >
                              {bookmarked ? <BookmarkCheck className="h-3.5 w-3.5" /> : <Bookmark className="h-3.5 w-3.5" />}
                            </button>
                            
                            <Link
                              href={`/articles/${article.id}`}
                              className="text-[10px] text-foreground group-hover:text-primary font-bold uppercase font-mono tracking-wider flex items-center gap-1 border border-border px-3 py-1 bg-background hover:border-primary transition-colors"
                            >
                              Open Essay
                              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* REGULAR ARTICLES LIST */}
          <div className="space-y-4">
            {highlightedArticles.length > 0 && regularArticles.length > 0 && (
              <h2 className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider border-b border-border pb-1">
                More Essays
              </h2>
            )}
            
            {regularArticles.map((article) => {
              const bookmarked = isBookmarked(article.id);
              return (
                <div
                  key={article.id}
                  className="group border border-border bg-card-bg/30 hover:bg-card-bg/70 hover:border-zinc-700 transition-all duration-200 p-5 flex flex-col md:flex-row gap-5"
                >
                  {/* Cover Image Block */}
                  {article.coverImage ? (
                    <div className="md:w-48 w-full md:h-32 h-44 shrink-0 overflow-hidden border border-border/40 relative">
                      <img 
                        src={article.coverImage} 
                        alt={article.title} 
                        className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500" 
                      />
                    </div>
                  ) : (
                    <div className="md:w-48 w-full md:h-32 h-44 shrink-0 bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 flex flex-col justify-between p-3 select-none">
                      <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-wider">{article.category}</span>
                      <FileText className="h-6 w-6 text-zinc-800" />
                      <span className="text-[8px] font-mono text-zinc-700">HEINZE COGNITION</span>
                    </div>
                  )}

                  {/* Content details */}
                  <div className="flex-1 flex flex-col justify-between min-w-0 space-y-2.5">
                    <div className="space-y-1.5">
                      <div className="flex items-center flex-wrap gap-2 text-[10px] font-mono text-zinc-500">
                        <span className="text-zinc-400 bg-background px-1.5 py-0.2 border border-border uppercase font-semibold">
                          {article.category}
                        </span>
                        <span>•</span>
                        <span>{article.publishedDate}</span>
                        <span>•</span>
                        <span className="flex items-center gap-0.5">
                          <Clock className="h-3 w-3" />
                          {article.readTime}
                        </span>
                        <span>•</span>
                        <span>{article.visits} views</span>
                      </div>

                      <h3 className="text-base font-semibold group-hover:text-primary transition-colors font-mono leading-snug">
                        <Link href={`/articles/${article.id}`}>
                          {article.title}
                        </Link>
                      </h3>

                      <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">
                        {article.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-4 pt-2 border-t border-border/40">
                      <div className="flex flex-wrap gap-1">
                        {article.tags?.map((tag) => (
                          <button 
                            key={tag} 
                            onClick={() => setSelectedTag(tag)}
                            className="bg-background/50 hover:bg-background px-1.5 py-0.5 border border-border text-[9px] font-mono text-zinc-500 hover:text-foreground transition-colors"
                          >
                            #{tag}
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        <button
                          onClick={(e) => handleToggleBookmark(e, article.id)}
                          className={`p-1.5 border transition-all ${
                            bookmarked 
                              ? "text-primary border-primary/20 bg-primary/5" 
                              : "text-zinc-500 border-border hover:border-zinc-700 hover:text-foreground bg-background"
                          }`}
                          title={bookmarked ? "Bookmarked" : "Bookmark article"}
                        >
                          {bookmarked ? <BookmarkCheck className="h-3.5 w-3.5" /> : <Bookmark className="h-3.5 w-3.5" />}
                        </button>
                        
                        <Link
                          href={`/articles/${article.id}`}
                          className="text-[10px] text-foreground hover:text-primary font-bold uppercase font-mono tracking-wider flex items-center gap-0.5"
                        >
                          Read
                          <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      ) : (
        <div className="text-center font-mono text-zinc-500 py-16 border border-dashed border-border text-xs">
          No essays found matching current filter options.
        </div>
      )}
    </div>
  );
}
