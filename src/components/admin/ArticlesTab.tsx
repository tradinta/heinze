"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useToast } from "@/context/ToastContext";
import { 
  FileText, Plus, Search, Calendar, Clock, Trash2, 
  ArrowLeft, Loader2, Sparkles, Eye, Heading, 
  Quote, Image as ImageIcon, CheckCircle, Upload,
  ArrowUp, ArrowDown, Copy, Settings, RefreshCw,
  Archive, RotateCcw, Sparkle, Edit3, Bookmark, X, SlidersHorizontal, Maximize2, Minimize2, Link2
} from "lucide-react";

interface Article {
  id: string;
  title: string;
  category: string;
  publishedDate: string;
  readTime: string;
  description: string;
  content: string;
  summary: string;
  tags: string[];
  visits: number;
  bookmarksCount: number;
  status: "published" | "draft" | "archived";
  coverImage?: string | null;
  highlighted?: boolean;
}

interface ArticleBlock {
  id: string;
  type: "paragraph" | "h2" | "quote" | "image" | "link";
  value: string;
  attribution?: string; // used for image block and link block
}

interface ArticlesTabProps {
  searchQuery: string;
}

export default function ArticlesTab({ searchQuery }: ArticlesTabProps) {
  const toast = useToast();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "create">("list");
  
  // Pagination & Filters States
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [filterCategory, setFilterCategory] = useState<string>("All");
  const [filterStatus, setFilterStatus] = useState<string>("all"); // 'all', 'published', 'draft', 'archived'
  const [sortOrder, setSortOrder] = useState<string>("recently_added");
  const itemsPerPage = 6;

  // Form States (Create/Edit Builder)
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<"AI" | "Intelligence" | "Philosophy" | "General">("AI");
  const [description, setDescription] = useState("");
  const [summary, setSummary] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [status, setStatus] = useState<"published" | "draft" | "archived">("published");
  
  // Zen Mode & Advanced Drawer States
  const [zenMode, setZenMode] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [previewActive, setPreviewActive] = useState(false);
  const [highlighted, setHighlighted] = useState(false);

  // Blocks
  const [blocks, setBlocks] = useState<ArticleBlock[]>([
    { id: "1", type: "paragraph", value: "Start drafting..." }
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImageId, setUploadingImageId] = useState<string | null>(null);
  const [generatingSummary, setGeneratingSummary] = useState(false);

  // Cover image & localStorage backup states
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [clearBackupModalOpen, setClearBackupModalOpen] = useState(false);

  // Auto-save feedback state
  const [lastAutoSaved, setLastAutoSaved] = useState<string | null>(null);

  // Global search & replace
  const [findText, setFindText] = useState("");
  const [replaceText, setReplaceText] = useState("");

  // Markdown import
  const [showMarkdownImport, setShowMarkdownImport] = useState(false);
  const [markdownInput, setMarkdownInput] = useState("");

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        category: filterCategory === "All" ? "" : filterCategory,
        status: filterStatus,
        sort: sortOrder,
        search: searchQuery || ""
      });

      const res = await fetch(`/api/articles?${params.toString()}`);
      const data = await res.json();
      if (data.articles) {
        setArticles(data.articles);
        setTotalCount(data.totalCount || 0);
        setTotalPages(Math.ceil((data.totalCount || 0) / itemsPerPage));
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load essays database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, [currentPage, filterCategory, filterStatus, sortOrder, searchQuery]);

  // Auto-save buffer
  useEffect(() => {
    if (viewMode === "create") {
      const timer = setTimeout(() => {
        const payload = { title, category, description, summary, tags, blocks, status, coverImage };
        localStorage.setItem("heinze_draft_autosave", JSON.stringify(payload));
        const timeStr = new Date().toLocaleTimeString();
        setLastAutoSaved(timeStr);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [title, category, description, summary, tags, blocks, status, coverImage, viewMode]);

  // Auto-load local progress when opening editor for new article
  useEffect(() => {
    if (viewMode === "create" && !editingArticleId) {
      const saved = localStorage.getItem("heinze_draft_autosave");
      if (saved) {
        try {
          const payload = JSON.parse(saved);
          if (
            payload.title || 
            payload.description || 
            (payload.blocks && payload.blocks.length > 1) || 
            (payload.blocks?.[0]?.value && payload.blocks?.[0]?.value !== "Start drafting...") ||
            payload.coverImage
          ) {
            setTitle(payload.title || "");
            setCategory(payload.category || "AI");
            setDescription(payload.description || "");
            setSummary(payload.summary || "");
            setTags(payload.tags || []);
            setBlocks(payload.blocks || [{ id: "1", type: "paragraph", value: "Start drafting..." }]);
            setStatus(payload.status || "draft");
            setCoverImage(payload.coverImage || null);
            setHighlighted(payload.highlighted || false);
            toast.success("Restored unsaved progress from local backup.");
          }
        } catch (err) {
          console.error("Failed to parse local backup:", err);
        }
      }
    }
  }, [viewMode, editingArticleId]);

  const loadAutosavedDraft = () => {
    const saved = localStorage.getItem("heinze_draft_autosave");
    if (saved) {
      try {
        const payload = JSON.parse(saved);
        setTitle(payload.title || "");
        setCategory(payload.category || "AI");
        setDescription(payload.description || "");
        setSummary(payload.summary || "");
        setTags(payload.tags || []);
        setBlocks(payload.blocks || [{ id: "1", type: "paragraph", value: "" }]);
        setStatus(payload.status || "draft");
        toast.success("Autosaved draft restored.");
      } catch (err) {
        toast.error("Failed to restore buffer.");
      }
    } else {
      toast.info("No autosaved local buffer found.");
    }
  };

  const handleGenerateAiSummary = async () => {
    const textToSummarize = blocks
      .filter(b => b.type === "paragraph" || b.type === "h2" || b.type === "quote")
      .map(b => b.value)
      .join("\n\n");

    if (!textToSummarize.trim()) {
      toast.warning("Write some content paragraphs first before generating AI summary.");
      return;
    }

    setGeneratingSummary(true);
    toast.info("Contacting Gemini summary engine...");
    try {
      const res = await fetch("/api/ai/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: textToSummarize })
      });
      const data = await res.json();
      if (data.summary) {
        setSummary(data.summary);
        toast.success("AI summary generated.");
      } else {
        toast.error(data.error || "Failed to generate summary.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error communicating with AI Studio.");
    } finally {
      setGeneratingSummary(false);
    }
  };

  const addBlockAtIndex = (type: "paragraph" | "h2" | "quote" | "image" | "link", index: number) => {
    const newBlock: ArticleBlock = {
      id: Math.random().toString(36).substring(2, 9),
      type,
      value: "",
      attribution: type === "image" || type === "link" ? "" : undefined,
    };
    const updated = [...blocks];
    updated.splice(index + 1, 0, newBlock);
    setBlocks(updated);
  };

  const appendBlock = (type: "paragraph" | "h2" | "quote" | "image" | "link") => {
    addBlockAtIndex(type, blocks.length - 1);
  };

  const updateBlock = (id: string, value: string, attribution?: string) => {
    setBlocks(blocks.map(b => {
      if (b.id === id) {
        return { ...b, value, ...(attribution !== undefined ? { attribution } : {}) };
      }
      return b;
    }));
  };

  const changeBlockType = (id: string, newType: "paragraph" | "h2" | "quote" | "image" | "link") => {
    setBlocks(blocks.map(b => {
      if (b.id === id) {
        return {
          ...b,
          type: newType,
          attribution: newType === "image" || newType === "link" ? "" : undefined
        };
      }
      return b;
    }));
  };

  const moveBlock = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === blocks.length - 1) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const updated = [...blocks];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setBlocks(updated);
  };

  const duplicateBlock = (block: ArticleBlock, index: number) => {
    const copy: ArticleBlock = {
      id: Math.random().toString(36).substring(2, 9),
      type: block.type,
      value: block.value,
      attribution: block.attribution,
    };
    const updated = [...blocks];
    updated.splice(index + 1, 0, copy);
    setBlocks(updated);
    toast.success("Block duplicated.");
  };

  const removeBlock = (id: string) => {
    if (blocks.length === 1) {
      toast.warning("An essay must contain at least one content block.");
      return;
    }
    setBlocks(blocks.filter(b => b.id !== id));
  };

  const handleFindReplace = () => {
    if (!findText.trim()) return;
    let count = 0;
    const updated = blocks.map(b => {
      if (b.value.includes(findText)) {
        const regex = new RegExp(findText.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&"), "g");
        const replaced = b.value.replace(regex, replaceText);
        count++;
        return { ...b, value: replaced };
      }
      return b;
    });
    setBlocks(updated);
    toast.success(`Updated ${count} blocks.`);
    setFindText("");
    setReplaceText("");
  };

  const handleMarkdownImport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!markdownInput.trim()) return;

    const lines = markdownInput.split("\n");
    const parsedBlocks: ArticleBlock[] = [];
    let currentParagraph = "";

    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) {
        if (currentParagraph) {
          parsedBlocks.push({ id: Math.random().toString(36).substring(2, 9), type: "paragraph", value: currentParagraph });
          currentParagraph = "";
        }
        return;
      }

      if (trimmed.startsWith("## ")) {
        if (currentParagraph) {
          parsedBlocks.push({ id: Math.random().toString(36).substring(2, 9), type: "paragraph", value: currentParagraph });
          currentParagraph = "";
        }
        parsedBlocks.push({ id: Math.random().toString(36).substring(2, 9), type: "h2", value: trimmed.replace("## ", "") });
      } else if (trimmed.startsWith("> ")) {
        if (currentParagraph) {
          parsedBlocks.push({ id: Math.random().toString(36).substring(2, 9), type: "paragraph", value: currentParagraph });
          currentParagraph = "";
        }
        parsedBlocks.push({ id: Math.random().toString(36).substring(2, 9), type: "quote", value: trimmed.replace("> ", "") });
      } else if (trimmed.startsWith("![") && trimmed.includes("](") && trimmed.endsWith(")")) {
        if (currentParagraph) {
          parsedBlocks.push({ id: Math.random().toString(36).substring(2, 9), type: "paragraph", value: currentParagraph });
          currentParagraph = "";
        }
        const imgMatch = trimmed.match(/!\[(.*?)\]\((.*?)\)/);
        if (imgMatch) {
          parsedBlocks.push({ id: Math.random().toString(36).substring(2, 9), type: "image", value: imgMatch[2], attribution: imgMatch[1] });
        }
      } else {
        currentParagraph += (currentParagraph ? "\n" : "") + trimmed;
      }
    });

    if (currentParagraph) {
      parsedBlocks.push({ id: Math.random().toString(36).substring(2, 9), type: "paragraph", value: currentParagraph });
    }

    if (parsedBlocks.length > 0) {
      setBlocks(parsedBlocks);
      setShowMarkdownImport(false);
      setMarkdownInput("");
      toast.success(`Imported ${parsedBlocks.length} blocks.`);
    }
  };

  const getSeoDensityStats = () => {
    const plainText = blocks.map(b => b.value).join(" ").toLowerCase();
    const wordsCount = plainText.split(/\s+/).filter(Boolean).length;
    if (wordsCount < 50) return { rating: "Drafting", score: "—" };

    let keywordHits = 0;
    tags.forEach(t => {
      const match = plainText.split(t.toLowerCase()).length - 1;
      keywordHits += match;
    });

    const density = (keywordHits / wordsCount) * 100;
    let rating = "Good";
    if (density < 0.5) rating = "Needs Keywords";
    else if (density > 3.0) rating = "Overstuffed";
    else rating = "Optimized";

    return { rating, score: `${density.toFixed(1)}%` };
  };

  const handleBlockImageUpload = async (blockId: string, file: File) => {
    setUploadingImageId(blockId);
    const formData = new FormData();
    formData.append("file", file);

    try {
      toast.info("Uploading image...");
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      if (data.fileUrl) {
        updateBlock(blockId, data.fileUrl);
        toast.success("Image uploaded to R2.");
      } else {
        toast.error("R2 Upload failed.");
      }
    } catch (err: any) {
      toast.error("Failed to upload image.");
    } finally {
      setUploadingImageId(null);
    }
  };

  const insertLinkIntoBlock = (blockId: string, textareaElement: HTMLTextAreaElement) => {
    const start = textareaElement.selectionStart;
    const end = textareaElement.selectionEnd;
    const text = textareaElement.value;
    
    if (start === end) {
      toast.warning("Highlight one or more words in the paragraph first, then click Add Link.");
      return;
    }
    
    const selectedText = text.substring(start, end);
    const url = window.prompt(`Convert "${selectedText}" to inline link.\nEnter Destination URL:`, "https://");
    
    if (url === null) return; // cancelled
    if (!url.trim()) {
      toast.warning("URL destination cannot be empty.");
      return;
    }
    
    const linkMarkup = `<a href="${url.trim()}" target="_blank" rel="noopener noreferrer">${selectedText}</a>`;
    const newText = text.substring(0, start) + linkMarkup + text.substring(end);
    
    updateBlock(blockId, newText);
    toast.success("Text converted to inline link successfully.");
  };

  const compileBlocksToHtml = () => {
    return blocks.map(b => {
      if (b.type === "h2") return `<h2>${b.value}</h2>`;
      if (b.type === "quote") return `<blockquote>"${b.value}"</blockquote>`;
      if (b.type === "link") {
        return `<div class="article-link-block my-6" data-url="${b.attribution || ''}" data-label="${b.value || ''}"></div>`;
      }
      if (b.type === "image") {
        return `
          <figure class="my-8 select-none">
            <img src="${b.value || 'https://pub-d33c13728d81440088421e0298b11617.r2.dev/mock-book-1.pdf'}" alt="${b.attribution || 'Illustration'}" class="w-full border border-border" />
            ${b.attribution ? `<figcaption class="text-center font-mono text-[9px] text-zinc-500 mt-2">Illustration: ${b.attribution}</figcaption>` : ""}
          </figure>
        `.trim();
      }
      return `<p>${b.value.replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br />")}</p>`;
    }).join("\n");
  };

  const saveArticle = async (targetStatus: "draft" | "published" | "archived") => {
    if (!title.trim()) {
      toast.error("An essay title is required.");
      return;
    }

    setSubmitting(true);
    let finalSummary = summary;

    // Auto-generate AI summary on save if summary is currently empty
    if (!finalSummary.trim()) {
      const textToSummarize = blocks
        .filter(b => b.type === "paragraph" || b.type === "h2" || b.type === "quote")
        .map(b => b.value)
        .join("\n\n");

      if (textToSummarize.trim()) {
        toast.info("Auto-generating AI summary in the background...");
        try {
          const res = await fetch("/api/ai/summary", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: textToSummarize })
          });
          const data = await res.json();
          if (data.summary) {
            finalSummary = data.summary;
            setSummary(data.summary);
          }
        } catch (err) {
          console.warn("Background AI summary generation failed", err);
        }
      }
    }

    const compiledContent = compileBlocksToHtml();

    try {
      const isEditing = editingArticleId !== null;
      const url = "/api/articles";
      const method = isEditing ? "PATCH" : "POST";
      const body = {
        title,
        category,
        description,
        summary: finalSummary,
        tags: tags.length > 0 ? tags : [category],
        content: compiledContent,
        status: targetStatus,
        coverImage: coverImage || (isEditing ? 'REMOVE' : null),
        highlighted: highlighted,
        ...(isEditing ? { articleId: editingArticleId } : {})
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (data.success) {
        toast.success(
          targetStatus === "draft"
            ? "Draft saved successfully."
            : targetStatus === "archived"
            ? "Essay archived."
            : "Essay changes published live."
        );
        setTitle("");
        setDescription("");
        setSummary("");
        setTags([]);
        setBlocks([{ id: "1", type: "paragraph", value: "Start drafting..." }]);
        setCoverImage(null);
        setHighlighted(false);
        setEditingArticleId(null);
        setViewMode("list");
        setZenMode(false);
        fetchArticles();
        localStorage.removeItem("heinze_draft_autosave");
      } else {
        toast.error(data.error || "Failed to save essay.");
      }
    } catch (err: any) {
      toast.error("Network request failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const startEditingArticle = (art: Article) => {
    setEditingArticleId(art.id);
    setTitle(art.title);
    setCategory(art.category as any);
    setDescription(art.description);
    setSummary(art.summary);
    setTags(art.tags);
    setStatus(art.status);
    setCoverImage(art.coverImage || null);
    setHighlighted(art.highlighted || false);

    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = art.content;
    const parsedBlocks: ArticleBlock[] = [];
    
    Array.from(tempDiv.children).forEach((child) => {
      const tagName = child.tagName.toLowerCase();
      if (tagName === "h2") {
        parsedBlocks.push({
          id: Math.random().toString(36).substring(2, 9),
          type: "h2",
          value: (child as HTMLElement).innerText
        });
      } else if (tagName === "blockquote") {
        parsedBlocks.push({
          id: Math.random().toString(36).substring(2, 9),
          type: "quote",
          value: (child as HTMLElement).innerText.replace(/^"|"$/g, "")
        });
      } else if (tagName === "figure") {
        const img = child.querySelector("img");
        const caption = child.querySelector("figcaption");
        parsedBlocks.push({
          id: Math.random().toString(36).substring(2, 9),
          type: "image",
          value: img?.getAttribute("src") || "",
          attribution: caption?.innerText.replace(/^Illustration:\s*/, "") || ""
        });
      } else {
        parsedBlocks.push({
          id: Math.random().toString(36).substring(2, 9),
          type: "paragraph",
          value: (child as HTMLElement).innerText
        });
      }
    });

    if (parsedBlocks.length > 0) setBlocks(parsedBlocks);
    else setBlocks([{ id: "1", type: "paragraph", value: art.content }]);

    setViewMode("create");
    toast.info(`Editing details for "${art.title}"`);
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const editId = params.get("edit");
      if (editId) {
        const fetchAndEdit = async () => {
          try {
            const res = await fetch(`/api/articles?id=${editId}`);
            if (res.ok) {
              const data = await res.json();
              if (data.article) {
                startEditingArticle(data.article);
                const newUrl = window.location.pathname + "?tab=articles";
                window.history.replaceState({ ...window.history.state }, "", newUrl);
              }
            }
          } catch (err) {
            console.error("Failed to load article for editing:", err);
          }
        };
        fetchAndEdit();
      }
    }
  }, []);

  const handleToggleArchive = async (art: Article) => {
    const nextStatus = art.status === "archived" ? "published" : "archived";
    try {
      const res = await fetch("/api/articles", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          articleId: art.id,
          status: nextStatus
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(nextStatus === "archived" ? "Essay archived." : "Essay restored.");
        fetchArticles();
      } else {
        toast.error("Failed to archive publication.");
      }
    } catch (err: any) {
      toast.error("Failed to update status.");
    }
  };

  const handleDelete = async (id: string, articleTitle: string) => {
    const confirmed = await toast.confirm({
      title: "Delete Essay",
      message: `Are you sure you want to permanently delete "${articleTitle}"?`,
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "danger"
    });
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/articles?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success(`"${articleTitle}" deleted.`);
        fetchArticles();
      } else {
        toast.error(data.error || "Delete operation failed.");
      }
    } catch (err: any) {
      toast.error("An unexpected error occurred.");
    }
  };

  const getEstimatedReadTime = () => {
    const plainText = blocks.map(b => b.value).join(" ");
    const words = plainText.split(/\s+/).filter(Boolean).length;
    return `${Math.max(2, Math.ceil(words / 180))} min read`;
  };

  const getWordCount = () => {
    const plainText = blocks.map(b => b.value).join(" ");
    return plainText.split(/\s+/).filter(Boolean).length;
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && tagsInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagsInput.trim())) {
        setTags([...tags, tagsInput.trim()]);
      }
      setTagsInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  return (
    <div className="space-y-6">
      {viewMode === "list" ? (
        <div className="border border-border bg-card-bg/40 p-4 space-y-4 font-mono text-xs">
          {/* List filters */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <h2 className="font-bold text-zinc-400 uppercase tracking-wider text-[10px]">
                Essays & Opinions Directory ({totalCount})
              </h2>
            </div>

            <div className="flex flex-wrap gap-2 items-center w-full sm:w-auto">
              <div className="flex items-center gap-1.5 border border-border px-2 py-1 bg-background">
                <span className="text-zinc-500 text-[10px]">CATEGORY:</span>
                <select
                  value={filterCategory}
                  onChange={(e) => { setFilterCategory(e.target.value); setCurrentPage(1); }}
                  className="bg-transparent text-foreground border-0 p-0 text-[10px] outline-hidden focus:ring-0 cursor-pointer uppercase font-bold"
                >
                  <option value="All">All Categories</option>
                  <option value="AI">AI</option>
                  <option value="Intelligence">Intelligence</option>
                  <option value="Philosophy">Philosophy</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 border border-border px-2 py-1 bg-background">
                <span className="text-zinc-500 text-[10px]">STATUS:</span>
                <select
                  value={filterStatus}
                  onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                  className="bg-transparent text-foreground border-0 p-0 text-[10px] outline-hidden focus:ring-0 cursor-pointer uppercase font-bold"
                >
                  <option value="all">All Statuses</option>
                  <option value="published">Published</option>
                  <option value="draft">Drafts</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 border border-border px-2 py-1 bg-background">
                <span className="text-zinc-500 text-[10px]">SORT:</span>
                <select
                  value={sortOrder}
                  onChange={(e) => { setSortOrder(e.target.value); setCurrentPage(1); }}
                  className="bg-transparent text-foreground border-0 p-0 text-[10px] outline-hidden focus:ring-0 cursor-pointer uppercase font-bold"
                >
                  <option value="recently_added">Recently Added</option>
                  <option value="most_read">Most Read</option>
                  <option value="most_bookmarked">Most Bookmarked</option>
                </select>
              </div>

              <button
                onClick={() => {
                  setEditingArticleId(null);
                  setTitle("");
                  setDescription("");
                  setSummary("");
                  setTags([]);
                  setBlocks([{ id: "1", type: "paragraph", value: "" }]);
                  setStatus("published");
                  setCoverImage(null);
                  setHighlighted(false);
                  setViewMode("create");
                  setZenMode(true); // default to Zen Mode on write!
                }}
                className="flex items-center gap-1 bg-primary text-white text-[10px] uppercase tracking-wider px-3 py-1.5 transition-colors font-bold ml-auto sm:ml-0"
              >
                <Plus className="h-3.5 w-3.5" />
                Write Essay
              </button>
            </div>
          </div>

          {loading ? (
            <div className="space-y-2 py-10">
              <div className="h-10 bg-zinc-800/10 dark:bg-zinc-200/5 animate-pulse w-full" />
              <div className="h-10 bg-zinc-800/10 dark:bg-zinc-200/5 animate-pulse w-full" />
            </div>
          ) : articles.length > 0 ? (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead>
                    <tr className="border-b border-border text-zinc-500 text-[10px] uppercase tracking-wider select-none">
                      <th className="pb-2">Title</th>
                      <th className="pb-2">Category</th>
                      <th className="pb-2">Status</th>
                      <th className="pb-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {articles.map((art) => (
                      <tr key={art.id} className="hover:bg-card-bg/25">
                        <td className="py-3 pr-4 max-w-sm">
                          <div className="font-bold text-foreground truncate flex items-center gap-1.5">
                            {art.title}
                            {art.highlighted && (
                              <span className="text-[9px] bg-primary/20 text-primary border border-primary/30 px-1 py-0.2 select-none uppercase font-bold tracking-wider rounded-xs flex items-center gap-0.5">
                                <Sparkles className="h-2.5 w-2.5 animate-pulse" />
                                Highlighted
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-zinc-500 line-clamp-1 mt-0.5 leading-normal">
                            {art.description || "No abstract snippet provided."}
                          </div>
                        </td>
                        <td className="py-3">
                          <span className="border border-primary/20 bg-primary/5 text-primary px-1.5 py-0.2">
                            {art.category}
                          </span>
                        </td>
                        <td className="py-3">
                          {art.status === "archived" ? (
                            <span className="text-[9px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 border border-zinc-700 font-bold uppercase">Archived</span>
                          ) : art.status === "draft" ? (
                            <span className="text-[9px] bg-amber-950/20 text-amber-400 px-1.5 py-0.5 border border-amber-800/30 font-bold uppercase">Draft</span>
                          ) : (
                            <span className="text-[9px] bg-emerald-950/20 text-emerald-400 px-1.5 py-0.5 border border-emerald-800/30 font-bold uppercase">Published</span>
                          )}
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex justify-end items-center gap-1.5">
                            <Link
                              href={`/admin/articles/${art.id}/performance`}
                              className="px-2 py-1 border border-border bg-background hover:text-primary hover:border-primary transition-colors text-[9px] uppercase font-bold tracking-wider select-none inline-flex items-center"
                            >
                              Performance
                            </Link>
                            <button
                              onClick={() => startEditingArticle(art)}
                              title="Edit Content"
                              className="p-1.5 border border-border bg-background hover:text-primary transition-colors"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleToggleArchive(art)}
                              className="p-1.5 border border-border bg-background hover:text-amber-500 transition-colors"
                            >
                              {art.status === "archived" ? <RotateCcw className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
                            </button>
                            <button
                              onClick={() => handleDelete(art.id, art.title)}
                              className="p-1.5 border border-border bg-background hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Table pagination control */}
              {totalPages > 1 && (
                <div className="flex justify-between items-center pt-2 border-t border-border/40 font-mono text-[10px] uppercase text-zinc-500 select-none">
                  <span>Page {currentPage} of {totalPages} ({totalCount} total)</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-2.5 py-1 border border-border bg-background disabled:opacity-40 hover:bg-background/80"
                    >
                      Prev
                    </button>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="px-2.5 py-1 border border-border bg-background disabled:opacity-40 hover:bg-background/80"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center font-mono text-zinc-500 py-12 border border-dashed border-border">
              No essays found matching filters.
            </div>
          )}
        </div>
      ) : (
        /* 
           IMMERSIVE EDITORIAL WORKSPACE 
           If zenMode is active, it expands fixed to cover the screen for maximum writing focus.
        */
        <div className={`transition-all duration-300 font-sans ${
          zenMode 
            ? "fixed inset-0 bg-background z-50 overflow-y-auto px-4 py-8 lg:p-12 animate-fadeIn" 
            : "border border-border bg-card-bg/40 p-6 space-y-6 relative"
        }`}>
          
          {/* Header Controls */}
          <div className="max-w-3xl mx-auto flex items-center justify-between border-b border-border/40 pb-4 mb-8">
            <button
              onClick={() => {
                setViewMode("list");
                setZenMode(false);
              }}
              className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-foreground font-mono uppercase font-bold tracking-wider"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Directory
            </button>

            <div className="flex items-center gap-3">
              {lastAutoSaved && (
                <span className="text-[9px] text-zinc-500 font-mono select-none">
                  Saved {lastAutoSaved}
                </span>
              )}

              {/* Clear progress button */}
              <button
                type="button"
                onClick={() => setClearBackupModalOpen(true)}
                className="flex items-center gap-1.5 border border-red-500/20 bg-background hover:bg-red-950/20 text-red-500/80 hover:text-red-400 text-[10px] uppercase font-mono px-3 py-1 font-bold rounded-sm transition-all cursor-pointer"
                title="Discard unsaved local backup progress"
              >
                <Trash2 className="h-3 w-3" />
                Clear Progress
              </button>

              {/* Zen Mode toggle button in top right of workspace */}
              <button
                type="button"
                onClick={() => setZenMode(!zenMode)}
                className="flex items-center gap-1.5 border border-border bg-background hover:bg-zinc-800 text-zinc-400 hover:text-foreground text-[10px] uppercase font-mono px-3 py-1 font-bold rounded-sm transition-all"
                title="Toggle fullscreen distraction-free zen mode"
              >
                {zenMode ? <Minimize2 className="h-3 w-3 text-amber-500" /> : <Maximize2 className="h-3 w-3" />}
                {zenMode ? "Zen Focus" : "Zen Focus"}
              </button>

              {/* Sidebar toggle drawer */}
              <button
                type="button"
                onClick={() => setShowDrawer(true)}
                className="flex items-center gap-1 bg-zinc-800 hover:bg-zinc-700 text-foreground text-[10px] uppercase font-mono px-3 py-1 font-bold rounded-sm border border-border"
                title="Open advanced settings side panel"
              >
                <SlidersHorizontal className="h-3.5 w-3.5 text-zinc-300" />
                Configure
              </button>
            </div>
          </div>

          {/* Clean centered builder layout */}
          <div className="max-w-3xl mx-auto space-y-8 pb-32">
            
            {/* Top Category selector pills (Matches screenshot look) */}
            <div className="flex justify-center gap-4 text-[10px] font-mono tracking-widest uppercase select-none">
              {(["AI", "Intelligence", "Philosophy", "General"] as const).map(cat => {
                const isSelected = category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`px-3 py-1 border transition-all ${
                      isSelected 
                        ? "border-amber-500/30 text-amber-500 bg-amber-500/5 font-bold" 
                        : "border-transparent text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* Main Article Cover Image */}
            <div className="max-w-2xl mx-auto">
              {coverImage ? (
                <div className="relative group rounded-sm overflow-hidden border border-border bg-card-bg/25">
                  <img src={coverImage} alt="Main cover" className="w-full h-48 object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 select-none">
                    <button
                      type="button"
                      onClick={() => {
                        const fileInput = document.getElementById("main-cover-upload-input");
                        if (fileInput) fileInput.click();
                      }}
                      className="px-3 py-1.5 bg-background border border-border text-foreground font-mono text-[9px] font-bold uppercase hover:bg-zinc-800 transition-colors cursor-pointer"
                    >
                      Change Cover
                    </button>
                    <button
                      type="button"
                      onClick={() => setCoverImage(null)}
                      className="px-3 py-1.5 bg-red-950/80 border border-red-500/30 text-red-400 font-mono text-[9px] font-bold uppercase hover:bg-red-900 transition-colors cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border border-dashed border-border/80 bg-background/50 hover:bg-background/80 hover:border-amber-500/50 transition-all p-6 rounded-sm text-center relative flex flex-col justify-center items-center font-mono gap-1 select-none">
                  <input
                    id="main-cover-upload-input"
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setUploadingCover(true);
                        const formData = new FormData();
                        formData.append("file", file);
                        try {
                          toast.info("Uploading cover image...");
                          const res = await fetch("/api/upload", {
                            method: "POST",
                            body: formData
                          });
                          const data = await res.json();
                          if (data.fileUrl) {
                            setCoverImage(data.fileUrl);
                            toast.success("Cover image saved.");
                          } else {
                            toast.error("Upload failed.");
                          }
                        } catch (err) {
                          toast.error("Upload error.");
                        } finally {
                          setUploadingCover(false);
                        }
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={uploadingCover}
                  />
                  {uploadingCover ? (
                    <div className="flex items-center gap-1.5 text-primary text-[10px] font-bold uppercase tracking-wider">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Syncing bytes to R2...</span>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 text-zinc-500 mb-1" />
                      <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Upload Cover Image</span>
                      <span className="text-[8px] text-zinc-600">Visible at the top of the article</span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Headline and Metadata */}
            <div className="text-center space-y-4">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Editorial Headline"
                className="w-full text-center text-4xl lg:text-5xl font-serif text-foreground font-medium border-0 focus:ring-0 outline-hidden bg-transparent placeholder-zinc-700/30 dark:placeholder-zinc-300/10 tracking-tight leading-tight"
              />

              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A strong, argumentative subheading..."
                className="w-full text-center text-base italic text-zinc-500 border-0 focus:ring-0 outline-hidden bg-transparent placeholder-zinc-500/40"
              />

              <div className="text-[10px] text-zinc-500 font-mono tracking-wider pt-2 select-none">
                By: Robert Heinze &nbsp;•&nbsp; {new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'numeric', day: 'numeric' })}
              </div>
            </div>

            <hr className="border-border/40 w-full" />

            {/* Dynamic Editorial Blocks Pipeline */}
            <div className="space-y-6 min-h-[300px]">
              {blocks.map((block, idx) => {
                return (
                  <div key={block.id} className="relative group/block py-2">
                    
                    {/* Hover auxiliary toolbox (Fades out when not hovering for zero clutter!) */}
                    <div className="absolute right-0 top-0 -translate-y-6 flex items-center gap-1 opacity-0 group-hover/block:opacity-100 transition-opacity bg-background border border-border/80 px-1 py-0.5 rounded-sm z-20 select-none text-[8px] font-mono text-zinc-500">
                      <span className="pr-1 text-[8px] text-zinc-600 font-bold border-r border-border/40 mr-1 uppercase">Block #{idx + 1}</span>
                      
                      <button
                        type="button"
                        onClick={() => moveBlock(idx, "up")}
                        disabled={idx === 0}
                        className="p-1 hover:text-foreground disabled:opacity-20"
                        title="Move Up"
                      >
                        <ArrowUp className="h-2.5 w-2.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveBlock(idx, "down")}
                        disabled={idx === blocks.length - 1}
                        className="p-1 hover:text-foreground disabled:opacity-20"
                        title="Move Down"
                      >
                        <ArrowDown className="h-2.5 w-2.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => duplicateBlock(block, idx)}
                        className="p-1 hover:text-foreground"
                        title="Duplicate"
                      >
                        <Copy className="h-2.5 w-2.5" />
                      </button>
                      
                      <select
                        value={block.type}
                        onChange={(e) => changeBlockType(block.id, e.target.value as any)}
                        className="bg-transparent text-[8px] border-0 p-0 focus:ring-0 outline-hidden uppercase font-bold text-amber-500 cursor-pointer ml-1"
                      >
                        <option value="paragraph">Paragraph</option>
                        <option value="h2">Heading</option>
                        <option value="quote">Quote</option>
                        <option value="image">Image</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => removeBlock(block.id)}
                        className="p-1 text-red-500 hover:text-red-400 border-l border-border/40 ml-1 pl-1.5"
                        title="Remove"
                      >
                        <Trash2 className="h-2.5 w-2.5" />
                      </button>
                    </div>

                    {/* Block inputs styled minimally */}
                    {block.type === "h2" && (
                      <input
                        type="text"
                        value={block.value}
                        onChange={(e) => updateBlock(block.id, e.target.value)}
                        placeholder="Heading Block Section..."
                        className="w-full text-lg font-bold font-serif text-primary border-0 focus:ring-0 outline-hidden bg-transparent placeholder-zinc-700/40 tracking-wide pt-2"
                      />
                    )}

                    {block.type === "quote" && (
                      <div className="border-l-2 border-amber-500/80 pl-4 py-1 my-2">
                        <textarea
                          value={block.value}
                          onChange={(e) => updateBlock(block.id, e.target.value)}
                          rows={2}
                          placeholder="Insert pull quote highlight..."
                          className="w-full italic text-zinc-300 font-serif text-sm border-0 focus:ring-0 outline-hidden bg-transparent placeholder-zinc-600/40 resize-none leading-relaxed"
                        />
                      </div>
                    )}

                    {block.type === "paragraph" && (
                      <div className="relative group/para">
                        <textarea
                          id={`textarea-block-${block.id}`}
                          value={block.value}
                          onChange={(e) => updateBlock(block.id, e.target.value)}
                          rows={Math.max(2, Math.ceil(block.value.length / 80))}
                          placeholder="Start typing..."
                          className="w-full text-[13px] leading-relaxed text-foreground border-0 focus:ring-0 outline-hidden bg-transparent placeholder-zinc-700/50 resize-none font-sans"
                        />
                        <div className="absolute right-2 bottom-1 hidden group-focus-within/para:flex items-center bg-card-bg border border-border px-1.5 py-0.5 rounded-xs select-none">
                          <button
                            type="button"
                            onClick={() => {
                              const textarea = document.getElementById(`textarea-block-${block.id}`) as HTMLTextAreaElement | null;
                              if (textarea) insertLinkIntoBlock(block.id, textarea);
                            }}
                            className="text-[8px] font-bold text-zinc-400 hover:text-foreground inline-flex items-center gap-1 cursor-pointer uppercase font-mono tracking-wider"
                            title="Highlight text first, then click to link"
                          >
                            <Link2 className="h-2.5 w-2.5" />
                            Add Link
                          </button>
                        </div>
                      </div>
                    )}

                    {block.type === "image" && (
                      <div className="space-y-3 py-2 border border-dashed border-border/40 bg-zinc-950/10 p-4">
                        <div className="grid grid-cols-2 gap-3 font-mono text-[9px]">
                          <div className="space-y-1">
                            <label className="text-zinc-500 uppercase font-bold">Image Public Link</label>
                            <input
                              type="text"
                              value={block.value}
                              onChange={(e) => updateBlock(block.id, e.target.value, block.attribution)}
                              placeholder="https://pub-..."
                              className="w-full border border-border bg-background px-2 py-1 text-foreground focus:border-amber-500"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-zinc-500 uppercase font-bold">Caption/Attribution</label>
                            <input
                              type="text"
                              value={block.attribution || ""}
                              onChange={(e) => updateBlock(block.id, block.value, e.target.value)}
                              placeholder="Illustration attribution details"
                              className="w-full border border-border bg-background px-2 py-1 text-foreground focus:border-amber-500"
                            />
                          </div>
                        </div>

                        <div className="border border-dashed border-border/80 bg-background/50 hover:bg-background/80 transition-colors p-4 text-center relative flex justify-center items-center font-mono">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleBlockImageUpload(block.id, file);
                            }}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            disabled={uploadingImageId !== null}
                          />
                          {uploadingImageId === block.id ? (
                            <div className="flex items-center gap-1.5 text-primary text-[10px]">
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              <span>Syncing bytes to R2...</span>
                            </div>
                          ) : block.value ? (
                            <div className="flex flex-col items-center gap-1.5">
                              <img src={block.value} alt="R2 Upload" className="max-h-24 w-auto border border-border" />
                              <span className="text-emerald-500 text-[9px] font-bold">R2 Synced successfully</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-zinc-500 text-[9px] font-bold">
                              <ImageIcon className="h-3.5 w-3.5 text-zinc-400" />
                              <span>Upload illustration to Cloudflare R2</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {block.type === "link" && (
                      <div className="space-y-3 py-2 border border-dashed border-border/40 bg-zinc-950/10 p-4">
                        <div className="space-y-2 font-mono text-[9px]">
                          <div className="space-y-1">
                            <label className="text-zinc-500 uppercase font-bold">Link Text Description (anchor text)</label>
                            <input
                              type="text"
                              value={block.value}
                              onChange={(e) => updateBlock(block.id, e.target.value, block.attribution)}
                              placeholder="e.g. Access the original research paper"
                              className="w-full border border-border bg-background px-2.5 py-1.5 text-foreground focus:border-amber-500 font-sans text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-zinc-500 uppercase font-bold">Link Destination URL</label>
                            <input
                              type="text"
                              value={block.attribution || ""}
                              onChange={(e) => updateBlock(block.id, block.value, e.target.value)}
                              placeholder="e.g. https://nature.com/..."
                              className="w-full border border-border bg-background px-2.5 py-1.5 text-foreground focus:border-amber-500 font-mono text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Inline micro-insert split hover bar */}
                    <div className="absolute bottom-[-10px] left-0 right-0 h-2 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity z-10 select-none">
                      <div className="w-full h-px bg-amber-500/20 relative">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card-bg border border-amber-500/20 rounded-full flex gap-1 px-1.5 py-0.5 text-[8px] font-bold text-amber-500 shadow-sm font-mono">
                          <button type="button" onClick={() => addBlockAtIndex("paragraph", idx)} className="hover:text-white px-0.5">+ P</button>
                          <button type="button" onClick={() => addBlockAtIndex("h2", idx)} className="hover:text-white px-0.5 border-l border-border/50 pl-1">+ H2</button>
                          <button type="button" onClick={() => addBlockAtIndex("quote", idx)} className="hover:text-white px-0.5 border-l border-border/50 pl-1">+ Quote</button>
                          <button type="button" onClick={() => addBlockAtIndex("image", idx)} className="hover:text-white px-0.5 border-l border-border/50 pl-1">+ Img</button>
                          <button type="button" onClick={() => addBlockAtIndex("link", idx)} className="hover:text-white px-0.5 border-l border-border/50 pl-1">+ Link</button>
                        </div>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>

            {/* Save operations */}
            <div className="flex justify-between items-center pt-8 border-t border-border/40 font-mono">
              <button
                type="button"
                onClick={() => {
                  setViewMode("list");
                  setZenMode(false);
                }}
                className="border border-border px-4 py-2 hover:bg-card-bg text-zinc-400 transition-colors uppercase font-bold tracking-wider text-[10px]"
                disabled={submitting}
              >
                Exit
              </button>

              <div className="flex gap-2.5">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => saveArticle("draft")}
                  className="border border-amber-500/30 text-amber-500 bg-amber-500/5 px-4 py-2 hover:bg-amber-500/10 transition-colors disabled:opacity-50 flex items-center gap-1 font-bold uppercase tracking-wider text-[10px]"
                >
                  {submitting && <Loader2 className="h-3 w-3 animate-spin" />}
                  Save Draft
                </button>

                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => saveArticle("published")}
                  className="bg-primary text-white px-5 py-2 hover:bg-primary/95 transition-colors disabled:opacity-50 flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px]"
                >
                  {submitting && <Loader2 className="h-3 w-3 animate-spin" />}
                  Publish Essay
                </button>
              </div>
            </div>

          </div>

          {/* FLOATING PILL TOOLBAR (Matches image exactly at the bottom center of viewport) */}
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-background/80 dark:bg-zinc-900/90 backdrop-blur-md border border-border/80 px-6 py-2.5 rounded-full flex items-center gap-4.5 shadow-2xl z-40 select-none animate-fadeIn">
            
            <button
              type="button"
              onClick={() => appendBlock("paragraph")}
              className="text-zinc-500 hover:text-foreground font-serif text-sm font-bold w-6 h-6 flex items-center justify-center hover:bg-zinc-800/40 rounded-full transition-colors"
              title="Add Paragraph text block"
            >
              T
            </button>

            <button
              type="button"
              onClick={() => appendBlock("quote")}
              className="text-zinc-500 hover:text-foreground font-serif text-xs italic font-bold w-6 h-6 flex items-center justify-center hover:bg-zinc-800/40 rounded-full transition-colors"
              title="Add Quote block"
            >
              &ldquo;&rdquo;
            </button>

            <button
              type="button"
              onClick={() => appendBlock("h2")}
              className="text-zinc-500 hover:text-foreground font-serif text-xs font-bold w-6 h-6 flex items-center justify-center hover:bg-zinc-800/40 rounded-full transition-colors"
              title="Add Heading level 2 block"
            >
              H2
            </button>

            <button
              type="button"
              onClick={() => appendBlock("image")}
              className="text-zinc-500 hover:text-foreground w-6 h-6 flex items-center justify-center hover:bg-zinc-800/40 rounded-full transition-colors"
              title="Add Image block"
            >
              <ImageIcon className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              onClick={() => appendBlock("link")}
              className="text-zinc-500 hover:text-foreground w-6 h-6 flex items-center justify-center hover:bg-zinc-800/40 rounded-full transition-colors"
              title="Add Link block"
            >
              <Link2 className="h-3.5 w-3.5" />
            </button>

            <div className="w-px h-4 bg-border/80 mx-1" />

            {/* Sidebar toggle tools in toolbar */}
            <button
              type="button"
              onClick={() => setShowDrawer(true)}
              className="text-zinc-500 hover:text-amber-500 w-6 h-6 flex items-center justify-center hover:bg-zinc-800/40 rounded-full transition-colors"
              title="Open settings panel"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
            </button>

            {/* Toggle Preview mode overlay */}
            <button
              type="button"
              onClick={() => {
                setPreviewActive(!previewActive);
                if (!previewActive) {
                  toast.info("Switched to client reader preview mode.");
                }
              }}
              className={`w-6 h-6 flex items-center justify-center rounded-full transition-colors ${
                previewActive ? "text-primary bg-primary/10" : "text-zinc-500 hover:text-foreground hover:bg-zinc-800/40"
              }`}
              title="Toggle Reader Preview view mode"
            >
              <Eye className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* SLIDING SETTINGS DRAWER OVERLAY (Hidden by default, unhides when Configure/Sliders clicked) */}
          {showDrawer && (
            <div className="fixed inset-0 z-50 flex justify-end font-mono text-xs">
              
              {/* Backdrop */}
              <div 
                className="absolute inset-0 bg-black/40 backdrop-blur-xs" 
                onClick={() => setShowDrawer(false)}
              />

              {/* Drawer Container */}
              <div className="relative w-full max-w-sm bg-card-bg border-l border-border h-full p-6 shadow-2xl flex flex-col justify-between overflow-y-auto z-10">
                <div className="space-y-6">
                  
                  {/* Header */}
                  <div className="flex justify-between items-center border-b border-border pb-3">
                    <span className="font-bold text-zinc-400 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                      <Settings className="h-4 w-4 text-amber-500" />
                      Editorial Settings
                    </span>
                    <button
                      onClick={() => setShowDrawer(false)}
                      className="p-1 hover:text-red-400 text-zinc-500 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Settings content */}
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-zinc-400 block font-bold">Category</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value as any)}
                        className="w-full border border-border bg-background px-2.5 py-1.5 text-foreground outline-hidden focus:border-amber-500"
                      >
                        <option value="AI">AI</option>
                        <option value="Intelligence">Intelligence</option>
                        <option value="Philosophy">Philosophy</option>
                        <option value="General">General</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2 py-1 bg-background/20 border border-border/40 px-2.5 rounded-xs">
                      <input
                        type="checkbox"
                        id="highlighted"
                        checked={highlighted}
                        onChange={(e) => setHighlighted(e.target.checked)}
                        className="h-3.5 w-3.5 bg-background border-border text-primary rounded-xs focus:ring-offset-0 focus:ring-0 cursor-pointer"
                      />
                      <label htmlFor="highlighted" className="text-zinc-300 font-bold select-none cursor-pointer uppercase text-[9px] tracking-wider">
                        Highlight this Essay
                      </label>
                    </div>

                    <div className="space-y-1">
                      <label className="text-zinc-400 block font-bold">Snippet Description</label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={2}
                        placeholder="Brief summary description abstract..."
                        className="w-full border border-border bg-background p-2 text-foreground outline-hidden focus:border-amber-500 resize-none"
                      />
                    </div>

                    {/* AI summary preview config */}
                    <div className="space-y-1.5 border border-primary/20 bg-primary/5 p-3">
                      <div className="flex justify-between items-center">
                        <label className="text-primary block font-bold uppercase text-[9px] tracking-wider flex items-center gap-1">
                          <Sparkle className="h-3.5 w-3.5" />
                          AI Summary (Overrides)
                        </label>
                        <button
                          type="button"
                          disabled={generatingSummary}
                          onClick={handleGenerateAiSummary}
                          className="text-[8px] bg-primary text-white hover:bg-primary/95 px-2 py-0.5 font-bold uppercase tracking-wider flex items-center gap-1 transition-colors disabled:opacity-50"
                        >
                          {generatingSummary ? "..." : "Generate Now"}
                        </button>
                      </div>
                      <textarea
                        value={summary}
                        onChange={(e) => setSummary(e.target.value)}
                        rows={3}
                        placeholder="Autogenerated dynamically when publishing, or edit manually here..."
                        className="w-full border border-border/80 bg-background/60 p-2 text-foreground outline-hidden focus:border-primary resize-none text-[10px]"
                      />
                    </div>

                    {/* Tag input chips */}
                    <div className="space-y-1">
                      <label className="text-zinc-400 block font-bold">Tags (Press Enter)</label>
                      <div className="border border-border bg-background p-2 flex flex-wrap gap-1 items-center">
                        {tags.map(t => (
                          <span key={t} className="bg-primary/10 border border-primary/20 text-primary px-1.5 py-0.2 flex items-center gap-0.5 text-[10px]">
                            #{t}
                            <button type="button" onClick={() => handleRemoveTag(t)} className="font-bold hover:text-red-400 text-[8px]">✕</button>
                          </span>
                        ))}
                        <input
                          type="text"
                          value={tagsInput}
                          onChange={(e) => setTagsInput(e.target.value)}
                          onKeyDown={handleAddTag}
                          placeholder="Add tag..."
                          className="bg-transparent outline-hidden py-0.5 px-1 w-20 text-foreground"
                        />
                      </div>
                    </div>

                    {/* Markdown import toggle button */}
                    <div className="border border-border/80 bg-background/50 p-2 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-zinc-500 uppercase text-[9px]">Markdown importer</span>
                        <button
                          type="button"
                          onClick={() => setShowMarkdownImport(!showMarkdownImport)}
                          className="text-[9px] text-amber-500 font-bold uppercase hover:underline"
                        >
                          {showMarkdownImport ? "Hide" : "Import"}
                        </button>
                      </div>

                      {showMarkdownImport && (
                        <div className="space-y-2">
                          <textarea
                            placeholder="Paste markdown blocks..."
                            value={markdownInput}
                            onChange={(e) => setMarkdownInput(e.target.value)}
                            rows={3}
                            className="w-full border border-border bg-background p-2 text-[10px] text-zinc-300 resize-y"
                          />
                          <button
                            type="button"
                            onClick={handleMarkdownImport}
                            className="w-full bg-zinc-800 text-foreground py-1 border border-border hover:bg-zinc-700 uppercase text-[9px] font-bold"
                          >
                            Convert to Blocks
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Find & Replace Tools */}
                    <div className="border border-border/80 bg-background/50 p-2 space-y-2">
                      <span className="font-bold text-zinc-500 uppercase text-[9px] block">Find & Replace</span>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Find..."
                          value={findText}
                          onChange={(e) => setFindText(e.target.value)}
                          className="border border-border bg-background px-2 py-1 text-foreground"
                        />
                        <input
                          type="text"
                          placeholder="Replace..."
                          value={replaceText}
                          onChange={(e) => setReplaceText(e.target.value)}
                          className="border border-border bg-background px-2 py-1 text-foreground"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleFindReplace}
                        className="w-full bg-zinc-800 text-zinc-300 py-1 border border-border hover:bg-zinc-700 uppercase font-bold text-[9px]"
                      >
                        Execute
                      </button>
                    </div>

                    {/* SEO Counts */}
                    <div className="grid grid-cols-3 gap-2 bg-background/50 p-2 border border-border/80 text-[9px] text-zinc-500">
                      <div>
                        <span className="text-zinc-400 block uppercase text-[8px]">Words:</span>
                        <span className="text-foreground font-bold">{getWordCount()}</span>
                      </div>
                      <div>
                        <span className="text-zinc-400 block uppercase text-[8px]">Time:</span>
                        <span className="text-foreground font-bold">{getEstimatedReadTime()}</span>
                      </div>
                      <div>
                        <span className="text-zinc-400 block uppercase text-[8px]">SEO density:</span>
                        <span className="text-amber-500 font-bold">{getSeoDensityStats().rating}</span>
                      </div>
                    </div>

                  </div>
                </div>

                <div className="pt-4 border-t border-border/40 flex justify-between items-center text-[10px]">
                  <button
                    type="button"
                    onClick={loadAutosavedDraft}
                    className="text-amber-500 hover:underline uppercase font-bold flex items-center gap-1"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Restore Buffer
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDrawer(false)}
                    className="bg-zinc-800 text-foreground px-4 py-1.5 border border-border hover:bg-zinc-700 uppercase font-bold"
                  >
                    Done
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* READER PREVIEW POPUP OVERLAY (Triggered via toolbar Eye icon) */}
          {previewActive && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-background border border-border w-full max-w-2xl h-[85vh] flex flex-col shadow-2xl relative">
                
                {/* Header preview close */}
                <div className="flex justify-between items-center bg-card-bg/40 px-4 py-3 border-b border-border/40 font-mono text-xs select-none">
                  <span className="font-bold text-zinc-400 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                    <Eye className="h-4 w-4 text-emerald-500" />
                    Live Reader Preview Mode
                  </span>
                  <button
                    onClick={() => setPreviewActive(false)}
                    className="p-1 hover:text-red-400 text-zinc-500 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Render compiled preview */}
                <div className="flex-1 overflow-y-auto p-6 lg:p-8 select-text leading-relaxed">
                  <div className="border-b border-border/40 pb-4 mb-4 select-none font-mono">
                    <div className="flex items-center gap-2 text-[10px] text-zinc-500 mb-1.5">
                      <span className="bg-primary/10 border border-primary/20 text-primary px-1.5 py-0.2 uppercase font-bold text-[9px]">
                        {category}
                      </span>
                      <span>•</span>
                      <span>Today</span>
                      <span>•</span>
                      <span className="flex items-center gap-0.5">
                        <Clock className="h-3 w-3" />
                        {getEstimatedReadTime()}
                      </span>
                    </div>
                    <h1 className="text-2xl font-bold font-serif text-foreground leading-tight mt-1.5">
                      {title || "Untitled Essay"}
                    </h1>
                    <p className="text-xs text-zinc-400 font-sans mt-1.5 italic">
                      {description || "No abstract description provided."}
                    </p>
                  </div>

                  {summary && (
                    <div className="border border-primary/20 bg-primary/5 p-3 mb-4 font-mono text-[10px] select-none">
                      <div className="flex items-center gap-1 text-primary font-bold uppercase text-[8px] tracking-wider mb-1">
                        <Sparkle className="h-3 w-3" />
                        AI Summary
                      </div>
                      <p className="text-zinc-400 leading-normal">{summary}</p>
                    </div>
                  )}

                  <div className="space-y-4 text-sm font-sans text-foreground preview-body">
                    {blocks.map((block) => {
                      if (block.type === "h2") {
                        return (
                          <h2 key={block.id} className="text-base font-bold font-serif text-primary pt-2 border-b border-border/40 pb-1 uppercase tracking-wide">
                            {block.value || "Heading Section"}
                          </h2>
                        );
                      }
                      if (block.type === "quote") {
                        return (
                          <blockquote key={block.id} className="border-l-2 border-primary bg-primary/5 p-3 italic text-zinc-300 font-mono my-2 pl-4">
                            &ldquo;{block.value || "Pull quote text..."}&rdquo;
                          </blockquote>
                        );
                      }
                      if (block.type === "image") {
                        return (
                          <figure key={block.id} className="my-4 select-none">
                            <img
                              src={block.value || "https://pub-d33c13728d81440088421e0298b11617.r2.dev/mock-book-1.pdf"}
                              alt={block.attribution || "Illustration preview"}
                              className="w-full h-auto border border-border"
                            />
                            {block.attribution && (
                              <figcaption className="text-center font-mono text-[9px] text-zinc-500 mt-1">
                                Illustration: {block.attribution}
                              </figcaption>
                            )}
                          </figure>
                        );
                      }
                      return (
                        <p key={block.id} className="whitespace-pre-wrap leading-relaxed">
                          {block.value || "Paragraph content..."}
                        </p>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-card-bg/40 px-4 py-3 border-t border-border/40 flex justify-end font-mono">
                  <button
                    type="button"
                    onClick={() => setPreviewActive(false)}
                    className="bg-primary text-white px-4 py-1.5 text-[10px] uppercase font-bold"
                  >
                    Done
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* Discard Local Progress Confirmation Modal */}
          {clearBackupModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs select-none">
              <div className="w-full max-w-sm border border-border bg-card-bg p-6 shadow-2xl rounded-sm font-mono text-[11px] text-foreground">
                <div className="flex items-center gap-2 text-red-500 font-bold uppercase tracking-wider mb-3">
                  <Trash2 className="h-4.5 w-4.5" />
                  Discard Local Progress?
                </div>
                <p className="text-on-surface-variant leading-relaxed mb-6 font-sans">
                  You are about to discard all unsaved edits from your local backup. Would you rather save it as a draft first to avoid losing your changes?
                </p>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      setClearBackupModalOpen(false);
                      await saveArticle("draft");
                    }}
                    className="w-full px-3 py-2 border border-primary bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-bold uppercase tracking-wider text-[9px] cursor-pointer"
                  >
                    Save to Draft First
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setClearBackupModalOpen(false);
                      localStorage.removeItem("heinze_draft_autosave");
                      setTitle("");
                      setDescription("");
                      setSummary("");
                      setTags([]);
                      setBlocks([{ id: "1", type: "paragraph", value: "Start drafting..." }]);
                      setCoverImage(null);
                      setEditingArticleId(null);
                      setViewMode("list");
                      setZenMode(false);
                      toast.success("Local progress discarded.");
                    }}
                    className="w-full px-3 py-2 border border-red-500/20 bg-background hover:bg-red-950/20 text-red-500 hover:text-red-400 transition-colors font-bold uppercase tracking-wider text-[9px] cursor-pointer"
                  >
                    Discard Progress Entirely
                  </button>
                  <button
                    type="button"
                    onClick={() => setClearBackupModalOpen(false)}
                    className="w-full px-3 py-2 border border-border bg-background hover:text-foreground text-zinc-500 transition-colors uppercase tracking-wider text-[9px] font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
