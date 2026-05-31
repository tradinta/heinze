import React from "react";
import Link from "next/link";
import { HelpCircle, ArrowLeft, Home, BookOpen } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[75vh] px-4 font-mono select-none">
      
      {/* 404 Visual Console Card */}
      <div className="max-w-md w-full border border-border bg-card-bg/20 p-8 shadow-xl text-center relative overflow-hidden">
        
        {/* Subtle decorative scanner bar line */}
        <div className="absolute top-0 left-0 w-full h-0.5 bg-primary/20 animate-pulse" />
        
        <div className="flex justify-center mb-6">
          <div className="p-3 bg-primary/10 text-primary border border-primary/20 rounded-full animate-bounce">
            <HelpCircle className="h-8 w-8" />
          </div>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">
          404: RESOURCE_NOT_FOUND
        </h1>
        
        <p className="text-xs text-zinc-500 uppercase tracking-widest mb-6">
          System Address Not Resolved
        </p>

        <div className="bg-background/80 border border-border p-4 rounded-sm mb-6 text-left text-[11px] leading-relaxed text-zinc-400">
          <div className="text-zinc-500 font-semibold mb-1">// Console Audit Event log</div>
          <div>&gt; Request: [GET] {typeof window !== "undefined" ? window.location.pathname : "unknown path"}</div>
          <div>&gt; Status: 404 File Mismatch Mapped</div>
          <div>&gt; Code: ERR_ROUTE_NOT_REGISTERED</div>
          <div>&gt; Trace: Routing resolved to null. Access denied.</div>
        </div>

        <p className="text-xs text-zinc-400 mb-8 leading-relaxed font-sans max-w-sm mx-auto">
          The requested essay, book, or dashboard console path does not exist or has been relocated to another address.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center text-xs">
          <Link 
            href="/"
            className="px-4 py-2 border border-primary bg-primary/10 text-primary hover:bg-primary/25 transition-all font-bold tracking-wider uppercase inline-flex items-center justify-center gap-1.5"
          >
            <Home className="h-3.5 w-3.5" />
            Home Console
          </Link>
          <Link 
            href="/articles"
            className="px-4 py-2 border border-border bg-background hover:border-zinc-500 text-foreground transition-all tracking-wider uppercase inline-flex items-center justify-center gap-1.5"
          >
            <BookOpen className="h-3.5 w-3.5" />
            Browse Essays
          </Link>
        </div>

      </div>

      {/* Decorative return link */}
      <div className="mt-8">
        <Link 
          href="javascript:history.back()" 
          className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Return to previous session
        </Link>
      </div>

    </div>
  );
}
