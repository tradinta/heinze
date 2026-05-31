import React from "react";

export default function Loading() {
  return (
    <div className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 space-y-8 select-none font-mono">
      {/* Shimmering Header */}
      <div className="border-b border-border pb-4 space-y-3">
        <div className="h-5 bg-zinc-800/15 dark:bg-zinc-200/10 w-1/4 animate-pulse" />
        <div className="h-3 bg-zinc-800/15 dark:bg-zinc-200/10 w-1/3 animate-pulse" />
      </div>

      {/* Shimmering content block */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-4">
          <div className="h-48 bg-zinc-800/15 dark:bg-zinc-200/10 w-full animate-pulse" />
          <div className="h-4 bg-zinc-800/15 dark:bg-zinc-200/10 w-5/6 animate-pulse" />
          <div className="h-4 bg-zinc-800/15 dark:bg-zinc-200/10 w-full animate-pulse" />
          <div className="h-4 bg-zinc-800/15 dark:bg-zinc-200/10 w-2/3 animate-pulse" />
        </div>

        <div className="space-y-4">
          <div className="h-32 bg-zinc-800/15 dark:bg-zinc-200/10 w-full animate-pulse" />
          <div className="h-24 bg-zinc-800/15 dark:bg-zinc-200/10 w-full animate-pulse" />
        </div>
      </div>
    </div>
  );
}
