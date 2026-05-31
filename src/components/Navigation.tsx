"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useReader } from "@/context/ReaderContext";
import { authClient } from "@/lib/auth-client";
import { Search, Sun, Moon, Coffee, User } from "lucide-react";

export default function Navigation() {
  const pathname = usePathname();
  const { theme, setTheme, setIsSearchOpen, focusMode } = useReader();

  const [user, setUser] = useState<any>(null);

  // Fetch session safely
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await authClient.getSession();
        if (res?.data) {
          setUser(res.data.user);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error("Session error:", err);
      }
    };
    fetchSession();
  }, [pathname]);

  if (focusMode) {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-md transition-colors duration-250 select-none">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        {/* Brand */}
        <div className="flex items-center gap-8">
          <Link 
            href="/" 
            className="font-serif text-lg font-semibold tracking-tight text-primary hover:opacity-85 transition-opacity"
          >
            Robert Heinze
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center space-x-6 text-xs font-semibold uppercase tracking-wider">
            <Link
              href="/articles"
              className={`py-1 transition-colors ${
                pathname.startsWith("/articles") ? "text-primary border-b-2 border-primary" : "text-on-surface-variant hover:text-primary"
              }`}
            >
              Articles
            </Link>
            <Link
              href="/books"
              className={`py-1 transition-colors ${
                pathname.startsWith("/books") ? "text-primary border-b-2 border-primary" : "text-on-surface-variant hover:text-primary"
              }`}
            >
              Books
            </Link>
            {user && user.role === "admin" && (
              <Link
                href="/admin"
                className={`py-1 transition-colors ${
                  pathname.startsWith("/admin") ? "text-primary border-b-2 border-primary" : "text-on-surface-variant hover:text-primary"
                }`}
              >
                Admin
              </Link>
            )}
          </nav>
        </div>

        {/* Action Panel */}
        <div className="flex items-center space-x-3">
          {/* Quick Search */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center gap-2 border border-border bg-card-bg hover:bg-surface-container px-3 py-1.5 text-on-surface-variant hover:text-foreground transition-colors animate-fade-in"
          >
            <Search className="h-3 w-3 text-primary" />
            <span className="hidden sm:inline text-[10px] uppercase font-bold tracking-wider">Search</span>
            <kbd className="hidden sm:inline-block text-[9px] font-mono border border-border/60 bg-background px-1">
              Ctrl+K
            </kbd>
          </button>

          {/* Dynamic Theme selection */}
          <div className="flex items-center border border-border bg-card-bg">
            <button
              onClick={() => setTheme('light')}
              title="Light theme"
              className={`p-1.5 transition-colors ${theme === 'light' ? 'bg-primary text-white' : 'text-on-surface-variant hover:text-primary'}`}
            >
              <Sun className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setTheme('dark')}
              title="Dark theme"
              className={`p-1.5 transition-colors ${theme === 'dark' ? 'bg-primary text-white' : 'text-on-surface-variant hover:text-primary'}`}
            >
              <Moon className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setTheme('sepia')}
              title="Warm Sepia theme"
              className={`p-1.5 transition-colors ${theme === 'sepia' ? 'bg-primary text-white' : 'text-on-surface-variant hover:text-primary'}`}
            >
              <Coffee className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Authentication Panel */}
          {user ? (
            <Link
              href="/profile"
              className="flex items-center gap-2 border border-border bg-card-bg px-3 py-1.5 font-mono text-[10px] uppercase font-bold text-foreground hover:bg-surface-container active:scale-95 transition-all outline-hidden cursor-pointer"
              title="View my reader telemetry & profile"
            >
              <User className="h-3 w-3 text-primary animate-pulse" />
              <span className="max-w-[100px] truncate">{user.name.split(" ")[0]}</span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="hidden sm:inline-block bg-primary text-on-primary px-4 py-1.5 hover:bg-primary/95 text-[10px] uppercase font-bold tracking-widest transition-colors text-center animate-fade-in"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
