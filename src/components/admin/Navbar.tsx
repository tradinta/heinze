"use client";

import React, { useState, useEffect } from "react";
import { useReader } from "@/context/ReaderContext";
import { 
  Search, Bell, Sun, Moon, CheckCircle, ChevronRight, User, Menu
} from "lucide-react";

interface NavbarProps {
  activeTab: string;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onMenuToggle?: () => void;
  setActiveTab: (tab: any) => void;
}

export default function Navbar({ activeTab, searchQuery, setSearchQuery, onMenuToggle, setActiveTab }: NavbarProps) {
  const { theme, setTheme } = useReader();
  const [showNotifications, setShowNotifications] = useState(false);
  const [authorImage, setAuthorImage] = useState("");
  const [displayName, setDisplayName] = useState("R. Heinze");

  useEffect(() => {
    const fetchAuthor = async () => {
      try {
        const res = await fetch("/api/config");
        const data = await res.json();
        if (data.configs) {
          if (data.configs.author_image) setAuthorImage(data.configs.author_image);
          if (data.configs.author_name) {
            const fullName = data.configs.author_name;
            const parts = fullName.split(" ");
            if (parts.length > 1) {
              setDisplayName(`${parts[0][0]}. ${parts[parts.length - 1]}`);
            } else {
              setDisplayName(fullName);
            }
          }
        }
      } catch (e) {
        console.error("Failed to load author config in Navbar:", e);
      }
    };
    fetchAuthor();

    const handleProfileUpdate = () => {
      fetchAuthor();
    };
    window.addEventListener("profileUpdated", handleProfileUpdate);
    return () => window.removeEventListener("profileUpdated", handleProfileUpdate);
  }, []);

  const notifications = [
    { id: 1, text: "New subscriber joined: maria@domain.com", time: "5 mins ago" },
    { id: 2, text: "PDF Download: 'The Algorithmic Mind'", time: "1 hr ago" },
    { id: 3, text: "System migration completed successfully", time: "2 hrs ago" },
  ];

  return (
    <header className="h-14 border-b border-border bg-card-bg/60 backdrop-blur-md px-4 md:px-6 flex items-center justify-between select-none">
      {/* Left: Breadcrumbs & Toggle button */}
      <div className="flex items-center gap-2">
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            className="md:hidden p-1.5 border border-border bg-background text-zinc-400 hover:text-foreground transition-colors"
            title="Toggle Menu"
          >
            <Menu className="h-3.5 w-3.5" />
          </button>
        )}
        <div className="flex items-center gap-1.5 font-mono text-[10px] text-zinc-500 uppercase tracking-widest">
          <span>Console</span>
          <ChevronRight className="h-3 w-3 text-zinc-600" />
          <span className="text-primary font-bold">{activeTab}</span>
        </div>
      </div>

      {/* Center/Right: Actions */}
      <div className="flex items-center gap-4">
        {/* Live Sync Indicator */}
        <div className="hidden sm:flex items-center gap-1.5 font-mono text-[9px] text-emerald-500 uppercase tracking-wider bg-emerald-500/5 border border-emerald-500/10 px-2 py-0.5">
          <CheckCircle className="h-3 w-3" />
          <span>Synced with Neon DB</span>
        </div>

        {/* Global Tab Search */}
        <div className="relative w-48 sm:w-64">
          <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-zinc-500">
            <Search className="h-3.5 w-3.5" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${activeTab}...`}
            className="w-full border border-border bg-background/50 pl-8 pr-3 py-1 text-[11px] font-mono text-foreground outline-hidden focus:border-primary placeholder-zinc-500"
          />
        </div>
        {/* Admin profile */}
        <button 
          onClick={() => setActiveTab("profile")}
          className="flex items-center gap-2 pl-2 border-l border-border/60 hover:opacity-85 active:scale-95 transition-all text-left outline-hidden"
          title="Edit Robert Heinze Profile"
        >
          <div className="w-6 h-6 rounded-full bg-zinc-800 border border-border overflow-hidden flex items-center justify-center text-zinc-400 shrink-0">
            {authorImage ? (
              <img 
                src={authorImage} 
                alt="R. Heinze avatar" 
                className="w-full h-full object-cover animate-fadeIn" 
              />
            ) : (
              <User className="h-3 w-3" />
            )}
          </div>
          <span className="hidden md:inline font-mono text-[9px] text-zinc-400 uppercase tracking-wider font-semibold">
            {displayName}
          </span>
        </button>
      </div>
    </header>
  );
}
