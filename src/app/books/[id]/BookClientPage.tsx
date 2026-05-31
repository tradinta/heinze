"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useReader } from "@/context/ReaderContext";
import { useToast } from "@/context/ToastContext";
import {
  ArrowLeft, ZoomIn, ZoomOut, Maximize2, Minimize2,
  Bookmark, BookmarkCheck, ChevronLeft,
  ChevronRight, List, FileText, Edit3, Trash2, Download,
  Loader2, ExternalLink
} from "lucide-react";

interface BookClientPageProps {
  initialBook?: any;
}

export default function BookClientPage({ initialBook }: BookClientPageProps) {
  const toast = useToast();
  const params = useParams();
  const bookId = params?.id as string;

  const [book, setBook] = useState<any>(initialBook || null);
  const [loading, setLoading] = useState(!initialBook);

  useEffect(() => {
    if (initialBook) { setBook(initialBook); setLoading(false); return; }
    const fetchBook = async () => {
      try {
        const res = await fetch(`/api/books?id=${bookId}`);
        const data = await res.json();
        if (data.book) {
          setBook(data.book);
          fetch(`/api/books?action=impression&id=${bookId}`, { method: "PUT" }).catch(() => {});
        }
      } catch (err) {
        console.error("Error retrieving book:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBook();
  }, [bookId, initialBook]);

  const {
    zoom, setZoom,
    isFullscreen, toggleFullscreen,
    toggleBookmark, isBookmarked,
    notes, addNote, removeNote,
  } = useReader();

  // PDF.js state
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [pdfPageCount, setPdfPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [pdfLibLoaded, setPdfLibLoaded] = useState(false);
  const renderTaskRef = useRef<any>(null);

  const [showToc, setShowToc] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [newNoteText, setNewNoteText] = useState("");

  // Load PDF.js from CDN once
  useEffect(() => {
    if ((window as any).pdfjsLib) {
      setPdfLibLoaded(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    script.onload = () => {
      (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      setPdfLibLoaded(true);
    };
    script.onerror = () => setPdfError("Failed to load PDF renderer.");
    document.head.appendChild(script);
  }, []);

  // Load PDF document once lib + book are ready
  useEffect(() => {
    if (!pdfLibLoaded || !book?.pdfUrl) return;
    const pdfjsLib = (window as any).pdfjsLib;
    setPdfLoading(true);
    setPdfError(null);

    pdfjsLib.getDocument({
      url: book.pdfUrl,
      withCredentials: false
    }).promise.then((doc: any) => {
      setPdfDoc(doc);
      setPdfPageCount(doc.numPages);
      setCurrentPage(1);
      setPdfLoading(false);
    }).catch((err: any) => {
      console.error("PDF load error:", err);
      setPdfError("Could not load the PDF. The file may be unavailable.");
      setPdfLoading(false);
    });
  }, [pdfLibLoaded, book?.pdfUrl]);

  // Render current page to canvas — fits container width for sharpness on all screen sizes
  const renderPage = useCallback(async (pageNum: number) => {
    if (!pdfDoc || !canvasRef.current) return;

    // Cancel any in-progress render
    if (renderTaskRef.current) {
      try { await renderTaskRef.current.cancel(); } catch {}
      renderTaskRef.current = null;
    }

    try {
      const page = await pdfDoc.getPage(pageNum);
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      if (!context) return;

      const dpr = window.devicePixelRatio || 1;

      // Get the available container width so the page fills it exactly (no downscale blur)
      const containerWidth = containerRef.current?.clientWidth || window.innerWidth;
      const availableWidth = Math.max(containerWidth - 48, 200); // subtract padding

      // Compute scale that fills the container width at zoom=1, then apply zoom on top
      const naturalViewport = page.getViewport({ scale: 1 });
      const fitScale = (availableWidth / naturalViewport.width) * zoom;

      // Render at physical pixel resolution for crisp display
      const viewport = page.getViewport({ scale: fitScale * dpr });

      canvas.width = viewport.width;
      canvas.height = viewport.height;
      // CSS size = logical pixels (physical / dpr)
      canvas.style.width = `${Math.floor(viewport.width / dpr)}px`;
      canvas.style.height = `${Math.floor(viewport.height / dpr)}px`;

      const renderTask = page.render({ canvasContext: context, viewport });
      renderTaskRef.current = renderTask;
      await renderTask.promise;
      renderTaskRef.current = null;
    } catch (err: any) {
      if (err?.name !== "RenderingCancelledException") {
        console.error("Page render error:", err);
      }
    }
  }, [pdfDoc, zoom]);

  useEffect(() => {
    if (pdfDoc) renderPage(currentPage);
  }, [pdfDoc, currentPage, zoom, renderPage]);

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    addNote(book.id, `Page ${currentPage}: ${newNoteText}`);
    setNewNoteText("");
    toast.success("Note saved.");
  };

  const handleDownload = () => {
    if (book?.pdfUrl) {
      fetch(`/api/books?action=download&id=${book.id}`, { method: "PUT" }).catch(() => {});
      const a = document.createElement("a");
      a.href = book.pdfUrl;
      a.download = `${book.title}.pdf`;
      a.target = "_blank";
      a.click();
    }
  };

  if (loading) {
    return (
      <div className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 space-y-6 font-mono text-xs select-none">
        <div className="h-6 bg-zinc-800/10 dark:bg-zinc-200/5 w-1/3 animate-pulse" />
        <div className="border border-border p-10 space-y-4">
          <div className="h-4 bg-zinc-800/10 dark:bg-zinc-200/5 w-full animate-pulse" />
          <div className="h-4 bg-zinc-800/10 dark:bg-zinc-200/5 w-5/6 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 text-center font-mono">
        <p className="text-sm text-zinc-500">Book not found.</p>
        <Link href="/books" className="text-xs text-accent underline mt-2">Back to Books</Link>
      </div>
    );
  }

  const bookmarked = isBookmarked(book.id);
  const bookNotes = notes.filter((note) => note.targetId === book.id);
  const hasPdf = !!book.pdfUrl;

  return (
    <div className="flex-1 flex flex-col">

      {/* Top Toolbar */}
      <div className="border-b border-border bg-card-bg/95 backdrop-blur-md px-4 py-2 flex items-center justify-between text-xs font-mono select-none z-10">
        <div className="flex items-center space-x-3">
          <Link href="/books" className="text-zinc-500 hover:text-foreground p-1 transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <span className="hidden sm:inline text-zinc-400 font-bold truncate max-w-xs">{book.title}</span>
        </div>

        {/* Page navigation */}
        {hasPdf && pdfPageCount > 0 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="p-1 border border-border bg-background hover:bg-card-bg/60 disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <span className="text-[10px] px-2 text-zinc-400">
              Page {currentPage} of {pdfPageCount}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(pdfPageCount, p + 1))}
              disabled={currentPage >= pdfPageCount}
              className="p-1 border border-border bg-background hover:bg-card-bg/60 disabled:opacity-30 transition-colors"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center space-x-1">
          {/* TOC */}
          <button
            onClick={() => setShowToc(!showToc)}
            className={`p-1.5 border transition-colors hover:text-accent ${showToc ? "text-accent border-accent/20 bg-accent/5" : "text-zinc-400 border-border bg-background"}`}
            title="Chapters"
          >
            <List className="h-3.5 w-3.5" />
          </button>

          {/* Notes */}
          <button
            onClick={() => setShowNotes(!showNotes)}
            className={`p-1.5 border transition-colors hover:text-accent relative ${showNotes ? "text-accent border-accent/20 bg-accent/5" : "text-zinc-400 border-border bg-background"}`}
            title="My Notes"
          >
            <Edit3 className="h-3.5 w-3.5" />
            {bookNotes.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-accent text-white text-[8px] h-3.5 w-3.5 flex items-center justify-center rounded-full font-bold">
                {bookNotes.length}
              </span>
            )}
          </button>

          {/* Zoom controls */}
          <button
            onClick={() => setZoom(Math.max(0.6, zoom - 0.15))}
            className="p-1.5 border border-border bg-background text-zinc-400 hover:text-foreground transition-colors"
            title="Zoom out"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setZoom(Math.min(2.5, zoom + 0.15))}
            className="p-1.5 border border-border bg-background text-zinc-400 hover:text-foreground transition-colors"
            title="Zoom in"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 border border-border bg-background text-zinc-400 hover:text-foreground transition-colors"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>

          {/* Bookmark */}
          <button
            onClick={() => toggleBookmark(book.id)}
            className={`p-1.5 border transition-colors hover:text-accent ${bookmarked ? "text-accent border-accent/20 bg-accent/5" : "text-zinc-400 border-border bg-background"}`}
            title={bookmarked ? "Remove bookmark" : "Bookmark"}
          >
            {bookmarked ? <BookmarkCheck className="h-3.5 w-3.5" /> : <Bookmark className="h-3.5 w-3.5" />}
          </button>

          {/* Download */}
          {hasPdf && (
            <button
              onClick={handleDownload}
              className="p-1.5 border border-border bg-background text-zinc-400 hover:text-foreground transition-colors"
              title="Download PDF"
            >
              <Download className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Reading Area */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* TOC Sidebar */}
        {showToc && (
          <aside className="w-56 shrink-0 border-r border-border bg-card-bg/60 p-4 font-mono text-xs overflow-y-auto z-10">
            <h3 className="text-[10px] tracking-wider text-zinc-500 uppercase pb-2 mb-3 border-b border-border font-bold">Chapters</h3>
            <ul className="space-y-1">
              {book.tableOfContents?.map((chapter: string, idx: number) => (
                <li key={idx}>
                  <button
                    onClick={() => {
                      // Jump to approximate PDF page based on TOC index
                      if (pdfPageCount > 0) {
                        const targetPage = Math.min(pdfPageCount, Math.round((idx / Math.max(book.tableOfContents.length - 1, 1)) * pdfPageCount) + 1);
                        setCurrentPage(targetPage);
                      }
                    }}
                    className="w-full text-left py-1.5 px-2 hover:bg-background/85 transition-colors block text-zinc-400 hover:text-foreground truncate"
                  >
                    {chapter}
                  </button>
                </li>
              ))}
            </ul>
          </aside>
        )}

        {/* PDF Canvas Viewport */}
        <div ref={containerRef} className="flex-1 flex flex-col items-center overflow-y-auto bg-zinc-100 dark:bg-zinc-900 p-6">
          {pdfLoading && (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-zinc-500 font-mono text-xs select-none">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span>Loading PDF...</span>
            </div>
          )}

          {pdfError && (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center font-mono">
              <FileText className="h-10 w-10 text-zinc-400" />
              <p className="text-sm text-zinc-500 max-w-xs">{pdfError}</p>
              {hasPdf && (
                <a
                  href={book.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 border border-primary bg-primary/10 text-primary text-[10px] uppercase font-bold tracking-wider hover:bg-primary/20 transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open PDF directly
                </a>
              )}
            </div>
          )}

          {!pdfLoading && !pdfError && hasPdf && (
            <div className="shadow-2xl rounded-xs overflow-hidden">
              <canvas ref={canvasRef} className="block" />
            </div>
          )}

          {!hasPdf && !pdfLoading && (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center font-mono select-none">
              <FileText className="h-10 w-10 text-zinc-400" />
              <p className="text-sm text-zinc-500">No PDF is attached to this book.</p>
            </div>
          )}

          {/* Bottom page navigation bar */}
          {pdfPageCount > 0 && (
            <div className="max-w-2xl w-full flex items-center justify-between mt-6 pt-4 border-t border-border/50 font-mono select-none">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-border bg-background text-zinc-400 hover:text-foreground hover:border-zinc-500 disabled:opacity-30 transition-colors text-[10px] uppercase font-bold tracking-wider cursor-pointer disabled:cursor-default"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Previous
              </button>

              <span className="text-[10px] text-zinc-500">
                {currentPage} / {pdfPageCount}
                <span className="text-zinc-600 ml-2">({Math.round((currentPage / pdfPageCount) * 100)}%)</span>
              </span>

              <button
                onClick={() => setCurrentPage(p => Math.min(pdfPageCount, p + 1))}
                disabled={currentPage >= pdfPageCount}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-border bg-background text-zinc-400 hover:text-foreground hover:border-zinc-500 disabled:opacity-30 transition-colors text-[10px] uppercase font-bold tracking-wider cursor-pointer disabled:cursor-default"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Notes Sidebar */}
        {showNotes && (
          <aside className="w-64 shrink-0 border-l border-border bg-card-bg/60 p-4 font-mono text-xs flex flex-col justify-between z-10">
            <div className="overflow-y-auto flex-1 space-y-4 pr-1">
              <h3 className="text-[10px] tracking-wider text-zinc-500 uppercase pb-2 border-b border-border font-bold">My Notes</h3>
              {bookNotes.length > 0 ? (
                <div className="space-y-3">
                  {bookNotes.map((note) => (
                    <div key={note.id} className="border border-border/80 bg-background/50 p-2.5 space-y-1">
                      <div className="flex justify-between items-center text-[9px] text-zinc-500">
                        <span>{new Date(note.timestamp).toLocaleDateString()}</span>
                        <button onClick={() => removeNote(note.id)} className="hover:text-red-400 p-0.5" title="Delete">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                      <p className="text-foreground leading-normal break-words text-[11px]">{note.text}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-zinc-500 text-center py-6 text-[10px] italic">No notes saved yet.</p>
              )}
            </div>

            <form onSubmit={handleAddNote} className="border-t border-border pt-4 mt-4 space-y-2">
              <textarea
                placeholder={`Note for page ${currentPage}...`}
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                rows={3}
                className="w-full border border-border bg-background p-2 text-xs text-foreground outline-hidden focus:border-accent placeholder-zinc-500 resize-none"
              />
              <button
                type="submit"
                className="w-full bg-accent text-white py-1.5 text-[10px] font-bold uppercase tracking-wider hover:bg-accent/90 transition-colors cursor-pointer"
              >
                Add Note
              </button>
            </form>
          </aside>
        )}
      </div>
    </div>
  );
}
