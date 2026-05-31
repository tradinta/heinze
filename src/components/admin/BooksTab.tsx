"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useToast } from "@/context/ToastContext";
import { 
  BookOpen, Plus, Search, Calendar, Layers, Download, Trash2, 
  Upload, ArrowLeft, Loader2, Link as LinkIcon, FileText, CheckCircle,
  Archive, RotateCcw, CheckSquare, Square, Edit2, Book, Brain, Shield, Terminal, BarChart2
} from "lucide-react";

interface BookItem {
  id: string;
  title: string;
  description: string;
  publishedDate: string;
  pages: number;
  pdfUrl: string;
  summary: string;
  archived: boolean;
  coverUrl?: string;
  iconName?: string;
  impressions: number;
  downloads: number;
}

interface BooksTabProps {
  searchQuery: string;
}

export default function BooksTab({ searchQuery }: BooksTabProps) {
  const toast = useToast();
  const [books, setBooks] = useState<BookItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "upload">("list");
  
  // Pagination & Filters States
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [sortOrder, setSortOrder] = useState<"recently_added" | "most_read" | "largest">("recently_added");
  const [archivedFilter, setArchivedFilter] = useState<"all" | "false" | "true">("all");
  const itemsPerPage = 6;

  // Form states (Upload Book)
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coverMode, setCoverMode] = useState<"none" | "image" | "icon">("none");
  const [coverUrl, setCoverUrl] = useState("");
  const [iconName, setIconName] = useState("book");
  
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState("");
  const [detectedPages, setDetectedPages] = useState<number>(0);
  
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Batch Select States
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Edit Mode States
  const [editingBook, setEditingBook] = useState<BookItem | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCoverMode, setEditCoverMode] = useState<"none" | "image" | "icon">("none");
  const [editCoverUrl, setEditCoverUrl] = useState("");
  const [editIconName, setEditIconName] = useState("book");
  const [editArchived, setEditArchived] = useState(false);
  const [updatingBookState, setUpdatingBookState] = useState(false);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      // Pass pagination, sorting, search query, and archived status
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        sort: sortOrder,
        archived: archivedFilter,
        search: searchQuery || ""
      });

      const res = await fetch(`/api/books?${params.toString()}`);
      const data = await res.json();
      if (data.books) {
        setBooks(data.books);
        setTotalCount(data.totalCount || 0);
        setTotalPages(Math.ceil((data.totalCount || 0) / itemsPerPage));
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load publications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
    // Deselect all on query/filter changes
    setSelectedIds(new Set());
  }, [currentPage, sortOrder, archivedFilter, searchQuery]);

  // PDF Page Counting Utility
  const countPdfPages = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const arr = new Uint8Array(e.target?.result as ArrayBuffer);
          const text = new TextDecoder("ascii").decode(arr.subarray(0, Math.min(arr.length, 1000000))); // read first 1MB
          const matches = text.match(/\/Count\s+(\d+)/g);
          if (matches) {
            let maxPages = 1;
            for (const match of matches) {
              const num = parseInt(match.match(/\d+/)?.[0] || "1");
              if (num > maxPages) maxPages = num;
            }
            resolve(maxPages);
          } else {
            const pageTypeMatches = text.match(/\/Type\s*\/Page\b/g);
            resolve(pageTypeMatches ? pageTypeMatches.length : 1);
          }
        } catch (err) {
          console.error("Error reading PDF pages:", err);
          resolve(1);
        }
      };
      reader.onerror = () => resolve(1);
      reader.readAsArrayBuffer(file);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error("Only PDF files are supported.");
      return;
    }

    setPdfFile(file);
    setUploadingPdf(true);
    toast.info("Analyzing PDF structural layers...");

    // Detect pages count client-side
    const pagesCount = await countPdfPages(file);
    setDetectedPages(pagesCount);
    toast.success(`Detected ${pagesCount} pages from PDF structure.`);

    const formData = new FormData();
    formData.append("file", file);

    try {
      toast.info("Uploading PDF to Cloudflare R2 bucket...");
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.fileUrl) {
        setPdfUrl(data.fileUrl);
        toast.success("PDF synced with Cloudflare R2 successfully.");
      } else {
        toast.error(data.error || "R2 PDF upload failed.");
      }
    } catch (err: any) {
      toast.error(err.message || "Network PDF upload failed.");
    } finally {
      setUploadingPdf(false);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEditMode = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are supported for covers.");
      return;
    }

    if (isEditMode) setUploadingCover(true);
    else setUploadingCover(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      toast.info("Uploading cover image to R2...");
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.fileUrl) {
        if (isEditMode) setEditCoverUrl(data.fileUrl);
        else setCoverUrl(data.fileUrl);
        toast.success("Cover image uploaded successfully!");
      } else {
        toast.error(data.error || "R2 Image upload failed.");
      }
    } catch (err: any) {
      toast.error(err.message || "Network cover upload failed.");
    } finally {
      setUploadingCover(false);
    }
  };

  const handleCreateBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !pdfUrl) {
      toast.error("Title and a PDF file attachment are required.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          pdfUrl,
          pages: detectedPages || 1,
          coverUrl: coverMode === "image" ? coverUrl : null,
          iconName: coverMode === "icon" ? iconName : null,
          summary: `Conceptual outline for the publication: ${title}`
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`"${title}" published in Heinze Library.`);
        setTitle("");
        setDescription("");
        setCoverMode("none");
        setCoverUrl("");
        setIconName("book");
        setPdfFile(null);
        setPdfUrl("");
        setDetectedPages(0);
        setViewMode("list");
        fetchBooks();
      } else {
        toast.error(data.error || "Failed to save publication.");
      }
    } catch (err: any) {
      toast.error(err.message || "Network request failed.");
    } finally {
      setSubmitting(false);
    }
  };

  // Single Item Edit Trigger
  const startEditBook = (book: BookItem) => {
    setEditingBook(book);
    setEditTitle(book.title);
    setEditDescription(book.description);
    setEditArchived(book.archived);
    if (book.coverUrl) {
      setEditCoverMode("image");
      setEditCoverUrl(book.coverUrl);
      setEditIconName("book");
    } else if (book.iconName) {
      setEditCoverMode("icon");
      setEditCoverUrl("");
      setEditIconName(book.iconName);
    } else {
      setEditCoverMode("none");
      setEditCoverUrl("");
      setEditIconName("book");
    }
  };

  const handleUpdateBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBook) return;

    setUpdatingBookState(true);
    try {
      const res = await fetch("/api/books", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookId: editingBook.id,
          title: editTitle,
          description: editDescription,
          coverUrl: editCoverMode === "image" ? editCoverUrl : null,
          iconName: editCoverMode === "icon" ? editIconName : null,
          archived: editArchived
        })
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Publication modified successfully.");
        setEditingBook(null);
        fetchBooks();
      } else {
        toast.error(data.error || "Failed to update publication.");
      }
    } catch (err: any) {
      toast.error(err.message || "Network edit request failed.");
    } finally {
      setUpdatingBookState(false);
    }
  };

  // Batch Selection Helpers
  const handleSelectToggle = (id: string) => {
    const updated = new Set(selectedIds);
    if (updated.has(id)) updated.delete(id);
    else updated.add(id);
    setSelectedIds(updated);
  };

  const handleSelectAllToggle = () => {
    if (selectedIds.size === books.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(books.map(b => b.id)));
    }
  };

  const handleBatchAction = async (action: "archive" | "unarchive" | "delete") => {
    if (selectedIds.size === 0) return;
    
    let confirmMsg = "";
    if (action === "archive") confirmMsg = `Archive ${selectedIds.size} selected books?`;
    else if (action === "unarchive") confirmMsg = `Unarchive ${selectedIds.size} selected books?`;
    else if (action === "delete") confirmMsg = `Permanently delete ${selectedIds.size} selected books? This action is irreversible!`;

    const confirmed = await toast.confirm({
      title: "Confirm Action",
      message: confirmMsg,
      confirmText: action === "delete" ? "Delete" : "Proceed",
      cancelText: "Cancel",
      variant: action === "delete" ? "danger" : "info"
    });
    if (!confirmed) return;

    try {
      const res = await fetch("/api/books", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          ids: Array.from(selectedIds)
        })
      });

      const data = await res.json();
      if (data.success) {
        toast.success(data.message || "Batch action completed successfully.");
        setSelectedIds(new Set());
        fetchBooks();
      } else {
        toast.error(data.error || "Batch action failed.");
      }
    } catch (err: any) {
      toast.error(err.message || "Batch request failed.");
    }
  };

  // Rendering cover preview helpers
  const renderListCover = (bk: BookItem) => {
    if (bk.coverUrl) {
      return (
        <div className="w-8 h-12 border border-zinc-700 shadow-xs relative overflow-hidden shrink-0">
          <img src={bk.coverUrl} alt={bk.title} className="w-full h-full object-cover" />
        </div>
      );
    }
    if (bk.iconName) {
      const getIcon = (name: string) => {
        switch (name) {
          case "brain": return <Brain className="h-4 w-4 text-amber-500" />;
          case "shield": return <Shield className="h-4 w-4 text-emerald-500" />;
          case "terminal": return <Terminal className="h-4 w-4 text-indigo-500" />;
          case "bookOpen": return <BookOpen className="h-4 w-4 text-rose-500" />;
          case "book": return <Book className="h-4 w-4 text-blue-500" />;
          default: return <FileText className="h-4 w-4 text-zinc-500" />;
        }
      };
      return (
        <div className="w-8 h-12 border border-zinc-800 bg-background/80 flex items-center justify-center shrink-0">
          {getIcon(bk.iconName)}
        </div>
      );
    }
    return (
      <div className="w-8 h-12 bg-gradient-to-br from-zinc-800 to-zinc-950 border border-zinc-700 flex flex-col justify-between p-0.5 text-white select-none shrink-0 text-[4px]">
        <span className="font-mono text-zinc-400 leading-none scale-75 block origin-left">PDF</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {viewMode === "list" ? (
        <div className="border border-border bg-card-bg/40 p-4 space-y-4 font-mono text-xs">
          
          {/* Top Panel Filters */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-border/60 pb-3">
            
            {/* Header info */}
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-amber-500" />
              <h2 className="font-bold text-zinc-400 uppercase tracking-wider text-[10px]">
                Book Publications Catalog ({totalCount})
              </h2>
            </div>

            {/* Filters selectors */}
            <div className="flex flex-wrap gap-2 items-center w-full sm:w-auto">
              {/* Sort selector */}
              <div className="flex items-center gap-1.5 border border-border px-2 py-1 bg-background">
                <span className="text-zinc-500 text-[10px]">SORT:</span>
                <select
                  value={sortOrder}
                  onChange={(e) => { setSortOrder(e.target.value as any); setCurrentPage(1); }}
                  className="bg-transparent text-foreground border-0 p-0 text-[10px] outline-hidden focus:ring-0 cursor-pointer uppercase font-bold"
                >
                  <option value="recently_added">Recently Added</option>
                  <option value="most_read">Most Read (Downloads)</option>
                  <option value="largest">Largest (Pages)</option>
                </select>
              </div>

              {/* Status filter */}
              <div className="flex items-center gap-1.5 border border-border px-2 py-1 bg-background">
                <span className="text-zinc-500 text-[10px]">FILTER:</span>
                <select
                  value={archivedFilter}
                  onChange={(e) => { setArchivedFilter(e.target.value as any); setCurrentPage(1); }}
                  className="bg-transparent text-foreground border-0 p-0 text-[10px] outline-hidden focus:ring-0 cursor-pointer uppercase font-bold"
                >
                  <option value="all">All Statuses</option>
                  <option value="false">Active Only</option>
                  <option value="true">Archived Only</option>
                </select>
              </div>

              <button
                onClick={() => setViewMode("upload")}
                className="flex items-center gap-1 bg-amber-600 hover:bg-amber-600/90 text-white text-[10px] uppercase tracking-wider px-3 py-1.5 transition-colors font-bold ml-auto sm:ml-0"
              >
                <Plus className="h-3.5 w-3.5" />
                Upload New Book
              </button>
            </div>
          </div>

          {/* Floating Batch Action Bar */}
          {selectedIds.size > 0 && (
            <div className="bg-amber-950/20 border border-amber-800/40 p-2.5 flex items-center justify-between gap-3 text-[11px] font-bold text-amber-500 select-none animate-fadeIn">
              <span className="flex items-center gap-1">
                <CheckSquare className="h-4 w-4 text-amber-500" />
                {selectedIds.size} publications selected
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleBatchAction("archive")}
                  className="px-2.5 py-1 border border-amber-700/50 bg-amber-950/50 hover:bg-amber-900/60 transition-colors flex items-center gap-1 uppercase text-[9px] tracking-wider"
                >
                  <Archive className="h-3 w-3" />
                  Archive
                </button>
                <button
                  onClick={() => handleBatchAction("unarchive")}
                  className="px-2.5 py-1 border border-amber-700/50 bg-amber-950/50 hover:bg-amber-900/60 transition-colors flex items-center gap-1 uppercase text-[9px] tracking-wider"
                >
                  <RotateCcw className="h-3 w-3" />
                  Unarchive
                </button>
                <button
                  onClick={() => handleBatchAction("delete")}
                  className="px-2.5 py-1 border border-red-900/50 bg-red-950/50 hover:bg-red-900/60 text-red-400 hover:text-red-300 transition-colors flex items-center gap-1 uppercase text-[9px] tracking-wider"
                >
                  <Trash2 className="h-3 w-3" />
                  Delete
                </button>
              </div>
            </div>
          )}

          {/* Catalog Table */}
          {loading ? (
            <div className="space-y-2 py-10">
              <div className="h-10 bg-zinc-800/10 dark:bg-zinc-200/5 animate-pulse w-full" />
              <div className="h-10 bg-zinc-800/10 dark:bg-zinc-200/5 animate-pulse w-full" />
              <div className="h-10 bg-zinc-800/10 dark:bg-zinc-200/5 animate-pulse w-full" />
            </div>
          ) : books.length > 0 ? (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead>
                    <tr className="border-b border-border text-zinc-500 text-[10px] uppercase tracking-wider select-none">
                      <th className="pb-2 w-8">
                        <button onClick={handleSelectAllToggle} className="p-0.5 text-zinc-500 hover:text-foreground">
                          {selectedIds.size === books.length ? <CheckSquare className="h-3.5 w-3.5" /> : <Square className="h-3.5 w-3.5" />}
                        </button>
                      </th>
                      <th className="pb-2">Preview</th>
                      <th className="pb-2">Title / Description</th>
                      <th className="pb-2">Uploaded</th>
                      <th className="pb-2">Status</th>
                      <th className="pb-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {books.map((bk) => {
                      const isSelected = selectedIds.has(bk.id);
                      return (
                        <tr key={bk.id} className={`hover:bg-card-bg/25 group ${isSelected ? "bg-amber-950/5 hover:bg-amber-950/10" : ""}`}>
                          <td className="py-3">
                            <button onClick={() => handleSelectToggle(bk.id)} className="p-0.5 text-zinc-500 hover:text-foreground">
                              {isSelected ? <CheckSquare className="h-3.5 w-3.5 text-amber-500" /> : <Square className="h-3.5 w-3.5" />}
                            </button>
                          </td>
                          <td className="py-3">
                            {renderListCover(bk)}
                          </td>
                          <td className="py-3 pr-4 max-w-xs">
                            <div className="font-bold text-foreground truncate">{bk.title}</div>
                            <div className="text-[10px] text-zinc-500 line-clamp-1 mt-0.5 leading-normal">
                              {bk.description || "No abstract details provided."}
                            </div>
                          </td>
                          <td className="py-3 text-zinc-400">{bk.publishedDate}</td>
                          <td className="py-3">
                            {bk.archived ? (
                              <span className="text-[9px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 border border-zinc-700 font-bold uppercase">Archived</span>
                            ) : (
                              <span className="text-[9px] bg-emerald-950/20 text-emerald-400 px-1.5 py-0.5 border border-emerald-800/30 font-bold uppercase">Active</span>
                            )}
                          </td>
                          <td className="py-3 text-right">
                            <div className="flex justify-end gap-1.5">
                              <Link
                                href={`/admin/books/${bk.id}/performance`}
                                title="View performance analytics"
                                className="px-2 py-1.5 border border-border bg-background hover:border-primary hover:text-primary transition-colors inline-flex items-center gap-1 text-[9px] font-mono font-bold uppercase tracking-wider text-zinc-400"
                              >
                                <BarChart2 className="h-3 w-3" />
                                Performance
                              </Link>
                              <button
                                onClick={() => startEditBook(bk)}
                                title="Edit publication details"
                                className="p-1.5 border border-border bg-background hover:text-amber-500 transition-colors"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <a
                                href={bk.pdfUrl}
                                target="_blank"
                                rel="noreferrer"
                                title="Download PDF copy"
                                className="p-1.5 border border-border bg-background hover:text-amber-500 transition-colors"
                              >
                                <Download className="h-3.5 w-3.5" />
                              </a>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
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
              No publications found matching your search.
            </div>
          )}
        </div>
      ) : (
        /* Simplified Upload Subview Form */
        <div className="border border-border bg-card-bg/40 p-4 space-y-4">
          <div className="flex items-center gap-3 border-b border-border pb-2">
            <button
              onClick={() => setViewMode("list")}
              className="p-1 text-zinc-400 hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <h2 className="font-mono font-bold text-zinc-400 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
              <Upload className="h-4 w-4 text-amber-500" />
              Upload PDF Book Publication
            </h2>
          </div>

          <form onSubmit={handleCreateBook} className="space-y-4 font-mono text-xs max-w-xl">
            <div className="space-y-1">
              <label className="text-zinc-400 block font-bold">Book Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="The Cognitive Paradigm Shift..."
                className="w-full border border-border bg-background px-2.5 py-1.5 text-foreground outline-hidden focus:border-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-zinc-400 block font-bold">Short Description (Summary Card)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="A high-level summary displayed on the card..."
                className="w-full border border-border bg-background p-2.5 text-foreground outline-hidden focus:border-amber-500 resize-none"
              />
            </div>

            {/* Optional Cover Mode selector */}
            <div className="space-y-2">
              <label className="text-zinc-400 block font-bold">Cover Presentation</label>
              <div className="flex gap-2">
                {(["none", "image", "icon"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setCoverMode(mode)}
                    className={`px-3 py-1.5 border transition-all uppercase text-[9px] font-bold ${
                      coverMode === mode
                        ? "bg-amber-600 border-amber-600 text-white"
                        : "border-border bg-background hover:bg-card-bg text-zinc-400"
                    }`}
                  >
                    {mode === "none" ? "Default PDF Cover" : mode === "image" ? "Upload Cover Image" : "Choose Icon"}
                  </button>
                ))}
              </div>

              {/* Upload image file mode */}
              {coverMode === "image" && (
                <div className="space-y-2 border border-border p-3 bg-background/50">
                  <div className="flex items-center gap-3">
                    <label className="border border-border bg-background hover:bg-card-bg text-zinc-300 font-bold px-3 py-1.5 cursor-pointer uppercase text-[9px]">
                      {uploadingCover ? "Uploading cover..." : "Choose Cover Image File"}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleCoverUpload(e, false)}
                        className="hidden"
                        disabled={uploadingCover}
                      />
                    </label>
                    {uploadingCover && <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-500" />}
                  </div>
                  {coverUrl && (
                    <div className="flex items-center gap-2 mt-1">
                      <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span className="text-[9px] text-zinc-400 truncate max-w-sm">{coverUrl}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Grid of Icons selection mode */}
              {coverMode === "icon" && (
                <div className="border border-border p-3 bg-background/50 space-y-2">
                  <div className="text-[9px] text-zinc-500 uppercase font-bold mb-1">Select presentation icon:</div>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { name: "book", icon: <Book className="h-4 w-4" /> },
                      { name: "brain", icon: <Brain className="h-4 w-4" /> },
                      { name: "shield", icon: <Shield className="h-4 w-4" /> },
                      { name: "terminal", icon: <Terminal className="h-4 w-4" /> },
                      { name: "bookOpen", icon: <BookOpen className="h-4 w-4" /> }
                    ].map((item) => (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => setIconName(item.name)}
                        className={`p-2 border transition-all ${
                          iconName === item.name
                            ? "border-amber-500 bg-amber-950/20 text-amber-500"
                            : "border-border bg-background hover:border-zinc-700 text-zinc-400"
                        }`}
                        title={item.name}
                      >
                        {item.icon}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Drag & Drop R2 File Zone */}
            <div className="space-y-2">
              <label className="text-zinc-400 block font-bold">PDF Document Upload *</label>
              <div className="border-2 border-dashed border-border bg-background/50 hover:bg-background/80 transition-colors p-6 text-center relative flex flex-col items-center justify-center">
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={uploadingPdf}
                />
                <div className="space-y-2 select-none">
                  {uploadingPdf ? (
                    <div className="flex flex-col items-center gap-1.5 text-amber-500">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span>Syncing bytes and scanning page structure...</span>
                    </div>
                  ) : pdfUrl ? (
                    <div className="flex flex-col items-center gap-1 text-emerald-500">
                      <CheckCircle className="h-6 w-6" />
                      <span className="font-bold">PDF Stored successfully!</span>
                      <span className="text-[10px] text-zinc-400 font-bold block">
                        Detected Length: {detectedPages} Pages
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-zinc-500">
                      <Upload className="h-6 w-6" />
                      <span>Drag and drop PDF here, or click to browse</span>
                      <span className="text-[9px] text-zinc-600 block">Maximum file size: 50MB</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Submit buttons */}
            <div className="flex gap-2 justify-end pt-4 border-t border-border/60">
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className="border border-border px-4 py-2 hover:bg-card-bg transition-colors"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !pdfUrl}
                className="bg-amber-600 text-white px-5 py-2 hover:bg-amber-600/90 transition-colors disabled:opacity-50 flex items-center gap-1.5 font-bold uppercase tracking-wider"
              >
                {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Publish Book
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Inline Edit Book Modal Dialog Overlay */}
      {editingBook && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn font-mono text-xs">
          <div className="border border-border bg-card-bg p-5 max-w-md w-full space-y-4 shadow-2xl relative">
            <div className="flex justify-between items-center border-b border-border/60 pb-2">
              <h3 className="font-bold text-amber-500 uppercase text-[10px]">Edit Publication Details</h3>
              <button onClick={() => setEditingBook(null)} className="text-zinc-500 hover:text-foreground text-sm">✕</button>
            </div>

            <form onSubmit={handleUpdateBook} className="space-y-3">
              <div className="space-y-1">
                <label className="text-zinc-400 font-bold block">Title *</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full border border-border bg-background px-2 py-1.5 text-foreground outline-hidden focus:border-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-zinc-400 font-bold block">Short Description</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={2}
                  className="w-full border border-border bg-background p-2 text-foreground outline-hidden focus:border-amber-500 resize-none"
                />
              </div>

              {/* Cover Mode selector */}
              <div className="space-y-1.5">
                <label className="text-zinc-400 font-bold block">Cover Presentation</label>
                <div className="flex gap-2">
                  {(["none", "image", "icon"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setEditCoverMode(mode)}
                      className={`px-2 py-1 border transition-all uppercase text-[8px] font-bold ${
                        editCoverMode === mode
                          ? "bg-amber-600 border-amber-600 text-white"
                          : "border-border bg-background hover:bg-card-bg text-zinc-400"
                      }`}
                    >
                      {mode === "none" ? "Default" : mode === "image" ? "Image" : "Icon"}
                    </button>
                  ))}
                </div>

                {/* Upload cover image */}
                {editCoverMode === "image" && (
                  <div className="space-y-1 border border-border p-2 bg-background/50">
                    <div className="flex items-center gap-3">
                      <label className="border border-border bg-background hover:bg-card-bg text-zinc-300 font-bold px-2 py-1 cursor-pointer uppercase text-[8px]">
                        {uploadingCover ? "Uploading cover..." : "Upload Cover File"}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleCoverUpload(e, true)}
                          className="hidden"
                          disabled={uploadingCover}
                        />
                      </label>
                    </div>
                    {editCoverUrl && (
                      <span className="text-[8px] text-zinc-500 truncate block mt-1">{editCoverUrl}</span>
                    )}
                  </div>
                )}

                {/* Select icon */}
                {editCoverMode === "icon" && (
                  <div className="border border-border p-2 bg-background/50 flex gap-2">
                    {[
                      { name: "book", icon: <Book className="h-3.5 w-3.5" /> },
                      { name: "brain", icon: <Brain className="h-3.5 w-3.5" /> },
                      { name: "shield", icon: <Shield className="h-3.5 w-3.5" /> },
                      { name: "terminal", icon: <Terminal className="h-3.5 w-3.5" /> },
                      { name: "bookOpen", icon: <BookOpen className="h-3.5 w-3.5" /> }
                    ].map((item) => (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => setEditIconName(item.name)}
                        className={`p-1.5 border transition-all ${
                          editIconName === item.name
                            ? "border-amber-500 bg-amber-950/20 text-amber-500"
                            : "border-border bg-background hover:border-zinc-700 text-zinc-400"
                        }`}
                      >
                        {item.icon}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Archive Toggle */}
              <div className="flex items-center gap-2 pt-1.5">
                <input
                  type="checkbox"
                  id="editArchived"
                  checked={editArchived}
                  onChange={(e) => setEditArchived(e.target.checked)}
                  className="rounded-none border-border bg-background text-amber-600 focus:ring-0"
                />
                <label htmlFor="editArchived" className="text-zinc-400 font-bold select-none cursor-pointer">
                  Archive this publication (hide from main visitor catalog)
                </label>
              </div>

              {/* Submit / Cancel Buttons */}
              <div className="flex gap-2 justify-end pt-3 border-t border-border/60">
                <button
                  type="button"
                  onClick={() => setEditingBook(null)}
                  className="border border-border px-3 py-1.5 hover:bg-card-bg transition-colors"
                  disabled={updatingBookState}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingBookState}
                  className="bg-amber-600 text-white px-4 py-1.5 hover:bg-amber-600/90 transition-colors flex items-center gap-1 font-bold uppercase tracking-wider"
                >
                  {updatingBookState && <Loader2 className="h-3 w-3 animate-spin" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
