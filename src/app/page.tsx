"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useReader } from "@/context/ReaderContext";
import { useToast } from "@/context/ToastContext";
import { ArrowRight, BookOpen, Clock, FileText, Sparkles, Flame, CheckCircle, Mail } from "lucide-react";

interface Article {
  id: string;
  title: string;
  category: string;
  publishedDate: string;
  readTime: string;
  description: string;
  tags: string[];
}

interface Book {
  id: string;
  title: string;
  pages: number;
  description: string;
}

export default function Home() {
  const { stats } = useReader();
  const toast = useToast();
  
  const [articles, setArticles] = useState<Article[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resArt, resBks] = await Promise.all([
          fetch("/api/articles"),
          fetch("/api/books")
        ]);
        const dataArt = await resArt.json();
        const dataBks = await resBks.json();
        
        if (dataArt.articles) setArticles(dataArt.articles);
        if (dataBks.books) setBooks(dataBks.books);
      } catch (err) {
        console.error("Error loading home page feed:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs % 60}s`;
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    
    setSubmitting(true);
    try {
      // Simulate/Trigger subscriber registration
      toast.success("Joined Heinze newsletter subscription feed!");
      setNewsletterEmail("");
    } catch (err) {
      toast.error("Failed to join newsletter.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Hero Section */}
      <section className="border-b border-border bg-card-bg/30 py-16 px-4">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-xl space-y-4">
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight font-serif text-foreground">
              Robert Heinze
            </h1>
            
            <p className="text-sm text-on-surface-variant font-sans leading-relaxed">
              Perspectives on carbon and silicon cognition, the semantics of machine learning, and the preservation of focus in a hyper-connected world.
            </p>
            
            <div className="flex items-center gap-3 pt-2 font-mono text-xs">
              <Link
                href="/articles"
                className="flex items-center gap-1.5 bg-primary text-white px-4 py-2 hover:bg-primary/95 transition-colors font-bold"
              >
                Read Essays
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/books"
                className="flex items-center gap-1.5 border border-border bg-background hover:bg-card-bg px-4 py-2 transition-colors text-foreground font-bold"
              >
                Browse Books
              </Link>
            </div>
          </div>

          {/* Author Portrait */}
          <div className="w-full md:w-auto shrink-0 flex flex-col items-center md:items-end">
            <div className="border border-border p-1 bg-card-bg/50 shadow-md">
              <div className="relative w-40 h-52 overflow-hidden border border-zinc-800 bg-zinc-950">
                <img 
                  src="/robert_heinze.png" 
                  alt="Robert Heinze Portrait" 
                  className="w-full h-full object-cover filter grayscale contrast-125 transition-transform duration-500 hover:scale-105" 
                />
              </div>
            </div>
            <div className="mt-2.5 text-[9px] font-mono text-zinc-500 select-none uppercase tracking-widest text-center md:text-right w-40">
              Robert Heinze
            </div>
          </div>
        </div>
      </section>

      {/* Main Grid Content */}
      <section className="max-w-4xl w-full mx-auto px-4 py-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Latest Essays Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <h2 className="text-xs font-mono tracking-wider text-zinc-500 uppercase font-bold flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-primary" />
              Featured Essays
            </h2>
            <Link href="/articles" className="text-xs font-mono text-zinc-500 hover:text-primary flex items-center gap-1 transition-colors">
              All Articles ({loading ? "..." : articles.length})
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="space-y-4">
            {loading ? (
              // Shimmering Skeletons
              Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="border border-border bg-card-bg/20 p-4 space-y-3 animate-pulse">
                  <div className="h-3.5 bg-zinc-800/10 dark:bg-zinc-200/5 w-1/4" />
                  <div className="h-5 bg-zinc-800/10 dark:bg-zinc-200/5 w-3/4" />
                  <div className="h-3 bg-zinc-800/10 dark:bg-zinc-200/5 w-full" />
                </div>
              ))
            ) : articles.length > 0 ? (
              articles.slice(0, 3).map((article) => (
                <article 
                  key={article.id}
                  className="group border border-border bg-card-bg/40 p-4 hover:bg-card-bg/80 transition-all hover:border-zinc-500 duration-200 rounded-none flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2 text-[10px] font-mono text-on-surface-variant mb-1.5">
                      <span className="inline-block bg-secondary text-on-secondary font-mono text-[8px] px-1.5 py-0.2 uppercase tracking-wider">
                        {article.category}
                      </span>
                      <span>•</span>
                      <span>{article.publishedDate}</span>
                      <span>•</span>
                      <span className="flex items-center gap-0.5">
                        <Clock className="h-2.5 w-2.5" />
                        {article.readTime}
                      </span>
                    </div>
                    
                    <h3 className="text-base font-semibold group-hover:text-primary transition-colors font-serif leading-tight mb-2">
                      <Link href={`/articles/${article.id}`}>
                        {article.title}
                      </Link>
                    </h3>
                    
                    <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed">
                      {article.description}
                    </p>
                  </div>
                  
                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-border/40 text-[10px] font-mono text-zinc-500">
                    <span className="flex gap-2">
                      {article.tags?.slice(0, 2).map(tag => (
                        <span key={tag}>#{tag.replace(/\s+/g, '')}</span>
                      ))}
                    </span>
                    <Link 
                      href={`/articles/${article.id}`} 
                      className="text-foreground font-semibold hover:text-primary flex items-center gap-0.5"
                    >
                      Read
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </article>
              ))
            ) : (
              <div className="text-center font-mono text-zinc-500 py-10 border border-dashed border-border text-xs">
                No publications found.
              </div>
            )}
          </div>
        </div>

        {/* Books column */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <h2 className="text-xs font-mono tracking-wider text-zinc-500 uppercase font-bold flex items-center gap-1.5">
              <BookOpen className="h-4 w-4 text-primary" />
              Books in PDF
            </h2>
            <Link href="/books" className="text-xs font-mono text-zinc-500 hover:text-primary transition-colors">
              Browse
            </Link>
          </div>

          <div className="space-y-4">
            {loading ? (
              // Shimmering Skeletons
              Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="border border-border bg-card-bg/20 p-4 flex gap-3 animate-pulse">
                  <div className="w-12 h-16 bg-zinc-800/10 dark:bg-zinc-200/5 shrink-0" />
                  <div className="space-y-2 flex-1">
                    <div className="h-3.5 bg-zinc-800/10 dark:bg-zinc-200/5 w-3/4" />
                    <div className="h-3 bg-zinc-800/10 dark:bg-zinc-200/5 w-1/2" />
                  </div>
                </div>
              ))
            ) : books.length > 0 ? (
              books.slice(0, 2).map((book) => (
                <div 
                  key={book.id}
                  className="border border-border bg-card-bg/40 p-4 hover:border-zinc-500 hover:bg-card-bg/85 transition-all duration-200 rounded-none flex flex-col justify-between"
                >
                  <div className="flex gap-4">
                    {/* Styled CSS Cover */}
                    <div className="w-14 h-20 shrink-0 bg-gradient-to-br from-indigo-900 to-zinc-900 border border-border shadow-sm relative overflow-hidden flex flex-col justify-between p-1.5 text-white">
                      <div className="absolute top-0 right-0 w-2.5 h-full bg-black/10 border-r border-white/5" />
                      <div className="text-[6px] font-mono text-zinc-300 uppercase tracking-widest truncate">
                        Heinze
                      </div>
                      <div className="text-[7px] font-mono font-bold leading-tight line-clamp-3 text-white mt-1 uppercase">
                        {book.title}
                      </div>
                      <div className="text-[5px] font-mono text-white/80 mt-auto border-t border-white/10 pt-0.5">
                        PDF EDITION
                      </div>
                    </div>

                    <div className="space-y-1 min-w-0">
                      <h3 className="text-xs font-bold font-serif text-foreground hover:text-primary transition-colors leading-snug line-clamp-1">
                        <Link href={`/books/${book.id}`}>
                          {book.title}
                        </Link>
                      </h3>
                      <div className="text-[9px] font-mono text-zinc-500">
                        Pages: {book.pages}
                      </div>
                      <p className="text-[11px] text-on-surface-variant line-clamp-2 leading-relaxed">
                        {book.description}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-border/40 flex justify-between items-center text-[10px] font-mono">
                    <span className="text-zinc-500">Free PDF Copy</span>
                    <Link 
                      href={`/books/${book.id}`}
                      className="text-primary font-semibold hover:underline flex items-center gap-1"
                    >
                      Open PDF
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center font-mono text-zinc-500 py-8 border border-dashed border-border text-xs">
                No catalogs available.
              </div>
            )}
          </div>

          {/* Newsletter Box */}
          <div className="border border-border bg-card-bg p-4 rounded-none font-mono">
            <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-zinc-500" />
              Subscribe
            </h3>
            <p className="text-[10px] text-on-surface-variant mb-3 leading-relaxed">
              Get notified of new studies and essays directly.
            </p>
            <form onSubmit={handleSubscribe} className="space-y-2">
              <input
                type="email"
                required
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="Email Address"
                className="w-full border border-border bg-background px-2.5 py-1.5 text-xs text-foreground outline-hidden focus:border-primary placeholder-zinc-500"
              />
              <button 
                type="submit"
                disabled={submitting}
                className="w-full bg-primary text-white py-1.5 text-[10px] font-bold hover:bg-primary/95 transition-colors uppercase tracking-wider disabled:opacity-50"
              >
                Join
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
