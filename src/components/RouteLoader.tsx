"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function RouteLoader() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // When pathname changes, we stop loading
    setLoading(false);
  }, [pathname]);

  useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      // Find the closest anchor tag
      let target = e.target as HTMLElement | null;
      while (target && target.tagName !== "A") {
        target = target.parentElement;
      }

      if (!target) return;

      const href = target.getAttribute("href");
      const isTargetBlank = target.getAttribute("target") === "_blank";
      const isDownload = target.hasAttribute("download");

      // Check if it's a valid local link transition
      if (
        href &&
        href.startsWith("/") &&
        !href.startsWith("/#") &&
        !isTargetBlank &&
        !isDownload &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.shiftKey &&
        !e.altKey
      ) {
        // If the path is exactly the same, we don't trigger loading
        if (window.location.pathname === href) return;
        setLoading(true);
      }
    };

    document.addEventListener("click", handleLinkClick);
    return () => {
      document.removeEventListener("click", handleLinkClick);
    };
  }, []);

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/70 backdrop-blur-md font-mono select-none"
        >
          {/* Shimmering Skeleton Elements inside Overlay */}
          <div className="w-full max-w-xl px-6 space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 bg-primary animate-ping rounded-full" />
              <span className="text-[10px] uppercase tracking-widest text-primary font-bold">
                Retrieving Editorial Context...
              </span>
            </div>
            
            {/* Shimmering Blocks */}
            <div className="space-y-3">
              <div className="h-6 bg-zinc-800/20 dark:bg-zinc-200/10 rounded-xs animate-pulse w-3/4" />
              <div className="h-3 bg-zinc-800/20 dark:bg-zinc-200/10 rounded-xs animate-pulse w-full" />
              <div className="h-3 bg-zinc-800/20 dark:bg-zinc-200/10 rounded-xs animate-pulse w-5/6" />
              <div className="h-3 bg-zinc-800/20 dark:bg-zinc-200/10 rounded-xs animate-pulse w-2/3" />
            </div>

            <div className="border-t border-border pt-4 flex justify-between text-[9px] text-zinc-500">
              <span>Robert Heinze Portal</span>
              <span>Please stand by</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
