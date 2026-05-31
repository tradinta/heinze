import { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { ArrowLeft, Cookie } from "lucide-react";

export const metadata: Metadata = {
  title: "Cookie Policy | Robert Heinze",
  description: "Robert Heinze thoughts cookie usage policy.",
};

export const revalidate = 0; // ensure dynamic rendering

function renderMarkdown(md: string) {
  return md.split("\n\n").map((block, idx) => {
    block = block.trim();
    if (!block) return null;

    if (block.startsWith("# ")) {
      return (
        <h1 key={idx} className="text-3xl font-serif font-bold text-foreground border-b border-border pb-3 mb-6 mt-8">
          {block.replace("# ", "")}
        </h1>
      );
    }
    if (block.startsWith("## ")) {
      return (
        <h2 key={idx} className="text-xl font-serif font-semibold text-zinc-300 mt-8 mb-4">
          {block.replace("## ", "")}
        </h2>
      );
    }
    if (block.startsWith("### ")) {
      return (
        <h3 key={idx} className="text-base font-serif font-semibold text-zinc-400 mt-6 mb-2">
          {block.replace("### ", "")}
        </h3>
      );
    }
    if (block.startsWith("* ") || block.startsWith("- ")) {
      const items = block.split("\n").map(li => li.replace(/^[*-\s]+/, "").trim());
      return (
        <ul key={idx} className="list-disc pl-5 space-y-2 text-zinc-400 text-sm font-sans mb-4">
          {items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      );
    }
    
    return (
      <p key={idx} className="text-sm text-zinc-400 font-sans leading-relaxed mb-4">
        {block}
      </p>
    );
  });
}

export default async function CookiePage() {
  let content = "";
  try {
    const res = await db.query("SELECT value FROM system_configs WHERE key = 'page_cookie'");
    if (res.rows.length > 0) {
      content = res.rows[0].value;
    }
  } catch (err) {
    console.error("Failed to query cookie page:", err);
  }

  if (!content) {
    content = "# Cookie Policy\nContent is temporarily unavailable. Check back soon.";
  }

  return (
    <div className="flex-1 bg-background py-16 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Back Link */}
        <Link 
          href="/" 
          className="inline-flex items-center gap-1.5 text-xs font-mono text-zinc-500 hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          BACK TO SHELF
        </Link>

        {/* Content Box */}
        <div className="border border-border bg-card-bg/40 p-8 md:p-12 shadow-md">
          <div className="flex items-center gap-2 text-primary font-mono text-[10px] uppercase tracking-widest mb-6">
            <Cookie className="h-4 w-4" />
            Legal Document
          </div>
          <div className="prose prose-zinc dark:prose-invert max-w-none">
            {renderMarkdown(content)}
          </div>
        </div>

      </div>
    </div>
  );
}
