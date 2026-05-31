"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useReader } from "@/context/ReaderContext";
import { useToast } from "@/context/ToastContext";
import { authClient } from "@/lib/auth-client";
import { 
  ArrowLeft, Volume2, VolumeX, Bookmark, 
  BookmarkCheck, Sparkles, Clock, HelpCircle, Edit3, 
  Trash2, Compass, EyeOff, User, Star, Globe
} from "lucide-react";

interface ArticleClientPageProps {
  initialArticle?: any;
  initialAuthorName: string;
  initialAuthorBio: string;
  initialAuthorImage: string;
}

export default function ArticleClientPage({
  initialArticle,
  initialAuthorName,
  initialAuthorBio,
  initialAuthorImage
}: ArticleClientPageProps) {
  const toast = useToast();
  const params = useParams();
  const articleId = params?.id as string;

  const [article, setArticle] = useState<any>(initialArticle || null);
  const [loading, setLoading] = useState(!initialArticle);

  const [authorName, setAuthorName] = useState(initialAuthorName);
  const [authorBio, setAuthorBio] = useState(initialAuthorBio);
  const [authorImage, setAuthorImage] = useState(initialAuthorImage);

  // Authentication & Ratings States
  const [user, setUser] = useState<any>(null);
  const [averageRating, setAverageRating] = useState(0);
  const [ratingsCount, setRatingsCount] = useState(0);
  const [userRating, setUserRating] = useState<number | null>(null);

  // Reflections, Notes & Rating Modal States
  const [isNoteRatingModalOpen, setIsNoteRatingModalOpen] = useState(false);
  const [modalQuoteText, setModalQuoteText] = useState("");
  const [modalNoteText, setModalNoteText] = useState("");
  const [modalRatingValue, setModalRatingValue] = useState(0);
  const [submittingRating, setSubmittingRating] = useState(false);

  // External link modal states
  const [isLeavingModalOpen, setIsLeavingModalOpen] = useState(false);
  const [leavingUrl, setLeavingUrl] = useState("");

  useEffect(() => {
    if (initialArticle) {
      setArticle(initialArticle);
      setLoading(false);
      return;
    }
    const fetchArticle = async () => {
      try {
        const res = await fetch(`/api/articles?id=${articleId}`);
        const data = await res.json();
        if (data.article) {
          setArticle(data.article);
        }
      } catch (err) {
        console.error("Error retrieving article:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchArticle();

    const fetchAuthorInfo = async () => {
      try {
        const res = await fetch("/api/config");
        const data = await res.json();
        if (data.configs) {
          if (data.configs.author_name) setAuthorName(data.configs.author_name);
          if (data.configs.author_bio) setAuthorBio(data.configs.author_bio);
          if (data.configs.author_image) setAuthorImage(data.configs.author_image);
        }
      } catch (err) {
        console.error("Failed to load author config:", err);
      }
    };
    fetchAuthorInfo();
  }, [articleId, initialArticle]);

  // Fetch session & ratings
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await authClient.getSession();
        if (res?.data) {
          setUser(res.data.user);
        }
      } catch (err) {
        console.error("Session fetch error:", err);
      }
    };
    fetchSession();
  }, []);

  const fetchRatings = async () => {
    try {
      const res = await fetch(`/api/ratings?articleId=${articleId}`);
      const data = await res.json();
      if (res.ok) {
        setAverageRating(data.average);
        setRatingsCount(data.count);
        setUserRating(data.userRating);
      }
    } catch (err) {
      console.error("Failed to load ratings:", err);
    }
  };

  useEffect(() => {
    if (articleId) {
      fetchRatings();
    }
  }, [articleId, user]);

  const { 
    theme, fontClass, setFontClass, fontSizeClass, setFontSizeClass,
    lineHeightClass, setLineHeightClass, zoom, setZoom,
    focusMode, setFocusMode, isPlayingSpeech, setIsPlayingSpeech,
    speechRate, setSpeechRate, toggleBookmark, isBookmarked,
    notes, addNote, removeNote, highlights, addHighlight, removeHighlight,
    lookupWord, dictionaryWord, dictionaryDefinition, clearDictionary,
    autoScrollSpeed, setAutoScrollSpeed, markCompleted
  } = useReader();

  const [showSummary, setShowSummary] = useState(false);
  const [showTocPanel, setShowTocPanel] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeSection, setActiveSection] = useState("");
  const [autoScrollActive, setAutoScrollActive] = useState(false);
  
  // Selection popup states
  const [selectionText, setSelectionText] = useState("");
  const [popupPosition, setPopupPosition] = useState<{ x: number; y: number } | null>(null);
  
  const articleRef = useRef<HTMLDivElement>(null);
  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Scroll Progress Tracker and Active Section Highlighter
  useEffect(() => {
    const handleScroll = () => {
      if (typeof window === "undefined") return;
      
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        setScrollProgress((window.scrollY / totalHeight) * 100);
      }

      const headings = articleRef.current?.querySelectorAll("h2") || [];
      let currentSection = "";
      headings.forEach((heading) => {
        const rect = heading.getBoundingClientRect();
        if (rect.top < 150) {
          currentSection = heading.innerText;
        }
      });
      if (currentSection) {
        setActiveSection(currentSection);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleTextSelection = (e: React.MouseEvent) => {
    const selection = window.getSelection();
    if (!selection) return;

    const selectedText = selection.toString().trim();
    if (selectedText.length > 2) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setSelectionText(selectedText);
      setPopupPosition({
        x: rect.left + window.scrollX + rect.width / 2,
        y: rect.top + window.scrollY - 40
      });
    } else {
      setSelectionText("");
      setPopupPosition(null);
    }
  };

  useEffect(() => {
    const closePopup = () => {
      setSelectionText("");
      setPopupPosition(null);
    };
    document.addEventListener("click", closePopup);
    return () => document.removeEventListener("click", closePopup);
  }, []);

  // Stop autoscroll when user manually scrolls (wheel, touch, or keyboard)
  useEffect(() => {
    if (autoScrollSpeed === 0) return;

    const stop = () => {
      setAutoScrollSpeed(0);
      setAutoScrollActive(false);
    };

    const SCROLL_KEYS = new Set(["ArrowUp", "ArrowDown", "PageUp", "PageDown", " "]);
    const onKey = (e: KeyboardEvent) => {
      if (SCROLL_KEYS.has(e.key)) stop();
    };

    window.addEventListener("wheel", stop, { passive: true });
    window.addEventListener("touchstart", stop, { passive: true });
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("wheel", stop);
      window.removeEventListener("touchstart", stop);
      window.removeEventListener("keydown", onKey);
    };
  }, [autoScrollSpeed]);

  // After content renders, scroll to shared-quote mark if ?quote= is in URL
  useEffect(() => {
    if (!article || loading) return;
    const quoteParam = new URLSearchParams(window.location.search).get("quote");
    if (!quoteParam) return;

    const timer = setTimeout(() => {
      const el = document.getElementById("shared-quote-highlight");
      if (el) {
        const y = el.getBoundingClientRect().top + window.scrollY - 120;
        window.scrollTo({ top: y, behavior: "smooth" });
        toast.success("Jumped to highlighted passage.");
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [article, loading]);

  const handleToggleSpeech = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      toast.warning("Text-to-speech is not supported in this browser.");
      return;
    }

    if (isPlayingSpeech) {
      window.speechSynthesis.cancel();
      setIsPlayingSpeech(false);
    } else {
      const container = articleRef.current;
      if (!container) return;
      const textToRead = article.title + ". " + container.innerText.replace(/<[^>]*>/g, "");
      
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.rate = speechRate;
      utterance.onend = () => setIsPlayingSpeech(false);
      utterance.onerror = () => setIsPlayingSpeech(false);
      
      speechUtteranceRef.current = utterance;
      setIsPlayingSpeech(true);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleDoubleClick = () => {
    const selection = window.getSelection();
    if (selection) {
      const selectedText = selection.toString().trim();
      if (selectedText && selectedText.split(/\s+/).length === 1) {
        lookupWord(selectedText);
      }
    }
  };

  // Trigger modal for selected quote
  const handleAddSelectionNote = () => {
    if (!selectionText) return;
    setModalQuoteText(selectionText);
    setModalNoteText("");
    setModalRatingValue(userRating || 0);
    setIsNoteRatingModalOpen(true);
  };

  const handleShareQuote = () => {
    if (!selectionText) return;
    const deepLink = `${window.location.origin}/articles/${article.id}?quote=${encodeURIComponent(selectionText)}`;
    const fullText = `"${selectionText}" - read more in Robert Heinze's article: ${deepLink}`;
    
    navigator.clipboard.writeText(fullText).then(() => {
      toast.success("Quote copied to clipboard with read link!");
    }).catch(err => {
      console.error("Failed to copy quote: ", err);
    });
  };

  // Modal Submit (Note & Rating)
  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Save Note if there is text
    if (modalNoteText.trim()) {
      const noteContent = modalQuoteText 
        ? `"${modalQuoteText}" — Note: ${modalNoteText}` 
        : modalNoteText;
      addNote(article.id, noteContent);
      
      try {
        await fetch('/api/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ articleId: article.id, noteText: noteContent })
        });
        toast.success("Note saved and synced successfully.");
      } catch (err) {
        console.error("Failed to sync note to backend database:", err);
        toast.success("Note saved locally.");
      }
    }

    // 2. Submit Rating if stars changed and logged in
    if (user && modalRatingValue > 0 && modalRatingValue !== userRating) {
      setSubmittingRating(true);
      try {
        const response = await fetch('/api/ratings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ articleId: article.id, rating: modalRatingValue })
        });
        const data = await response.json();
        if (response.ok) {
          setAverageRating(data.average);
          setRatingsCount(data.count);
          setUserRating(data.userRating);
          toast.success(`Rating of ${modalRatingValue} stars submitted!`);
        } else {
          toast.error(data.error || "Failed to submit rating.");
        }
      } catch (err) {
        console.error(err);
        toast.error("An error occurred submitting your rating.");
      } finally {
        setSubmittingRating(false);
      }
    }

    setIsNoteRatingModalOpen(false);
    setModalNoteText("");
    setModalQuoteText("");
  };

  if (loading) {
    return (
      <div className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 space-y-6 font-mono text-xs select-none">
        <div className="h-6 bg-zinc-800/10 dark:bg-zinc-200/5 w-1/4 animate-pulse" />
        <div className="border border-border p-12 space-y-4">
          <div className="h-5 bg-zinc-800/10 dark:bg-zinc-200/5 w-2/3 animate-pulse" />
          <div className="h-3 bg-zinc-800/10 dark:bg-zinc-200/5 w-full animate-pulse" />
          <div className="h-3.5 bg-zinc-800/10 dark:bg-zinc-200/5 w-5/6 animate-pulse" />
          <div className="h-3 bg-zinc-800/10 dark:bg-zinc-200/5 w-full animate-pulse" />
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 text-center font-mono">
        <p className="text-sm text-zinc-500">Article not found.</p>
        <Link href="/articles" className="text-xs text-accent underline mt-2">Back to Articles</Link>
      </div>
    );
  }

  const parseTocHeadings = () => {
    const headings = [{ title: "Introduction", target: "Intro" }];
    if (article?.content) {
      const regex = /<h2>([^<]+)<\/h2>/g;
      let match;
      while ((match = regex.exec(article.content)) !== null) {
        const text = match[1].trim();
        headings.push({ title: text, target: text });
      }
    }
    return headings;
  };

  const tocHeadings = parseTocHeadings();

  const bookmarked = isBookmarked(article.id);
  const articleNotes = notes.filter((n) => n.targetId === article.id);
  const articleHighlights = highlights.filter((h) => h.targetId === article.id);

  const toggleAutoScroll = () => {
    if (autoScrollActive) {
      setAutoScrollSpeed(0);
      setAutoScrollActive(false);
    } else {
      setAutoScrollSpeed(1);
      setAutoScrollActive(true);
    }
  };

  const handleArticleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const anchor = target.closest("a") as HTMLAnchorElement | null;
    
    if (anchor) {
      const url = anchor.getAttribute("href") || anchor.href;
      const isExternal = url.startsWith("http") && 
                         !url.includes(window.location.hostname) && 
                         !url.includes("localhost") && 
                         !url.includes("heinze-insights");
      
      if (isExternal) {
        e.preventDefault();
        e.stopPropagation();
        setLeavingUrl(url);
        setIsLeavingModalOpen(true);
      }
    }
  };

  // Convert * * syntax to bold, and inject inline highlights
  const getFormattedContent = () => {
    if (!article.content) return "";
    let content = article.content;

    // Replace markdown *text* with <strong>text</strong> (excluding html tag constructs)
    content = content.replace(/\*([^*<>\n]+)\*/g, "<strong>$1</strong>");

    // Inject shared-quote deep link highlight (from ?quote= URL param)
    const quoteParam = typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("quote")
      : null;
    if (quoteParam) {
      try {
        const escapedQ = quoteParam.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const qRegex = new RegExp(`(?![^<]*>)(${escapedQ})`, 'gi');
        content = content.replace(qRegex, `<mark id="shared-quote-highlight" class="bg-amber-400/25 border-b-2 border-amber-500 font-medium px-0.5 rounded-xs">$1</mark>`);
      } catch {}
    }

    // Embed highlighting spans
    articleHighlights.forEach((hl) => {
      try {
        const escaped = hl.text.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const colorClass = hl.color === "yellow"
          ? "bg-yellow-200/80 dark:bg-yellow-900/40 text-black dark:text-yellow-100"
          : hl.color === "green"
          ? "bg-green-200/80 dark:bg-green-900/40 text-black dark:text-green-100"
          : "bg-pink-200/80 dark:bg-pink-900/40 text-black dark:text-pink-100";

        const regex = new RegExp(`(?![^<]*>)(${escaped})`, "gi");
        content = content.replace(regex, `<span class="${colorClass} px-0.5 rounded-xs" title="Highlighted Quote">${hl.text}</span>`);
      } catch (err) {
        console.error(err);
      }
    });

    // Replace <div class="article-link-block my-6" data-url="URL" data-label="LABEL"></div>
    const linkRegex = /<div class="article-link-block my-6" data-url="([^"]*)" data-label="([^"]*)"><\/div>/g;
    content = content.replace(linkRegex, (match: string, url: string, label: string) => {
      const isExternal = url.startsWith("http") && !url.includes("localhost") && !url.includes("heinze-insights");
      return `<p class="my-4 font-mono text-xs select-none">
        Attachment: <a href="${url}" target="_blank" rel="noopener noreferrer" class="underline font-bold text-primary">${label}</a>
        ${isExternal ? '<span class="text-[8px] opacity-75 ml-1 select-none">↗ (Leaves site)</span>' : ""}
      </p>`;
    });

    return content;
  };

  return (
    <div className="flex-1 flex flex-col relative select-text">
      {/* Scroll Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-border z-50">
        <div className="h-full bg-primary transition-all duration-100" style={{ width: `${scrollProgress}%` }} />
      </div>

      {/* Exit Focus Mode Floating indicator */}
      {focusMode && (
        <button
          onClick={() => setFocusMode(false)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-1.5 border border-primary bg-background hover:bg-card-bg text-primary px-3 py-1.5 font-mono text-[10px] uppercase font-bold"
        >
          <EyeOff className="h-3.5 w-3.5" />
          Exit Focus Mode
        </button>
      )}

      {/* Reader Mode Toolbar */}
      {!focusMode && (
        <div className="border-b border-border bg-background/95 backdrop-blur-md px-4 py-2 flex items-center justify-between text-xs font-mono select-none">
          <div className="flex items-center space-x-3">
            <Link href="/articles" className="text-on-surface-variant hover:text-primary p-1 transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <span className="hidden md:inline text-zinc-400 font-bold truncate max-w-xs">{article.title}</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowSummary(!showSummary)}
              className={`p-1.5 border transition-colors hover:text-primary flex items-center gap-1 ${
                showSummary ? "text-primary border-primary bg-card-bg" : "text-on-surface-variant border-border bg-background"
              }`}
              title="Toggle Key Takeaways"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span className="hidden lg:inline text-[10px]">Takeaways</span>
            </button>

            <button
              onClick={handleToggleSpeech}
              className={`p-1.5 border transition-colors hover:text-primary flex items-center gap-1 ${
                isPlayingSpeech ? "text-primary border-primary bg-card-bg" : "text-on-surface-variant border-border bg-background"
              }`}
              title={isPlayingSpeech ? "Stop" : "Read aloud"}
            >
              {isPlayingSpeech ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
              <span className="hidden lg:inline text-[10px]">{isPlayingSpeech ? "Speaking" : "Listen"}</span>
            </button>

            <button
              onClick={toggleAutoScroll}
              className={`p-1.5 border transition-colors hover:text-primary flex items-center gap-1 ${
                autoScrollActive ? "text-primary border-primary bg-card-bg" : "text-on-surface-variant border-border bg-background"
              }`}
              title="Auto scroll"
            >
              <Compass className="h-3.5 w-3.5" />
              <span className="hidden lg:inline text-[10px]">Auto-Scroll</span>
            </button>

            {/* Typography control */}
            <div className="flex border border-border bg-background items-center">
              <button
                onClick={() => setFontClass("font-sans")}
                className={`px-2 py-1 text-[10px] border-r border-border hover:text-primary ${fontClass === "font-sans" ? "text-primary font-bold" : "text-on-surface-variant"}`}
              >
                Sans
              </button>
              <button
                onClick={() => setFontClass("font-serif")}
                className={`px-2 py-1 text-[10px] border-r border-border hover:text-primary ${fontClass === "font-serif" ? "text-primary font-bold" : "text-on-surface-variant"}`}
              >
                Serif
              </button>
              <button
                onClick={() => setFontClass("font-mono")}
                className={`px-2 py-1 text-[10px] hover:text-primary ${fontClass === "font-mono" ? "text-primary font-bold" : "text-on-surface-variant"}`}
              >
                Mono
              </button>
            </div>

            {/* Font Size control */}
            <div className="flex border border-border bg-background items-center font-bold">
              <button
                onClick={() => setFontSizeClass("text-sm")}
                className={`px-2 py-1 text-[10px] border-r border-border hover:text-primary ${fontSizeClass === "text-sm" ? "text-primary" : "text-on-surface-variant"}`}
              >
                A-
              </button>
              <button
                onClick={() => setFontSizeClass("text-base")}
                className={`px-2 py-1 text-[10px] border-r border-border hover:text-primary ${fontSizeClass === "text-base" ? "text-primary" : "text-on-surface-variant"}`}
              >
                A
              </button>
              <button
                onClick={() => setFontSizeClass("text-lg")}
                className={`px-2 py-1 text-[10px] border-r border-border hover:text-primary ${fontSizeClass === "text-lg" ? "text-primary" : "text-on-surface-variant"}`}
              >
                A+
              </button>
            </div>

            <button
              onClick={() => setFocusMode(true)}
              className="p-1.5 border border-border bg-background text-on-surface-variant hover:text-primary transition-colors"
              title="Focus Mode"
            >
              <EyeOff className="h-3.5 w-3.5" />
            </button>

            {(() => {
              const handleToggleBookmark = async () => {
                const willBeBookmarked = !bookmarked;
                toggleBookmark(article.id);
                try {
                  const params = new URLSearchParams({
                    action: "bookmark",
                    id: article.id,
                    undo: (!willBeBookmarked).toString()
                  });
                  await fetch(`/api/articles?${params.toString()}`, { method: "PUT" });
                } catch (err) {
                  console.error("Failed to update bookmark stats:", err);
                }
              };

              return (
                <button
                  onClick={handleToggleBookmark}
                  className={`p-1.5 border transition-colors hover:text-primary ${
                    bookmarked ? "text-primary border-primary bg-card-bg" : "text-on-surface-variant border-border bg-background"
                  }`}
                  title="Bookmark article"
                >
                  {bookmarked ? <BookmarkCheck className="h-3.5 w-3.5" /> : <Bookmark className="h-3.5 w-3.5" />}
                </button>
              );
            })()}
          </div>
        </div>
      )}

      {/* Main split grid layout */}
      <div className="flex-1 flex max-w-6xl w-full mx-auto px-4 py-8 items-start gap-12 lg:gap-16">
        
        {/* Left Column: Table of Contents */}
        {!focusMode && showTocPanel && (
          <aside className="w-48 shrink-0 sticky top-20 hidden md:block font-mono text-[11px] space-y-4 select-none">
            <div className="flex justify-between items-center pb-2 border-b border-border">
              <span className="font-bold tracking-wider text-zinc-500 uppercase">Contents</span>
              <button onClick={() => setShowTocPanel(false)} className="text-zinc-500 hover:text-foreground">✕</button>
            </div>
            <ul className="space-y-2">
              {tocHeadings.map((heading, idx) => (
                <li key={idx}>
                  <button
                    onClick={() => {
                      if (heading.target === "Intro") {
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      } else {
                        const headingEl = Array.from(document.querySelectorAll("h2")).find(
                          (h) => h.innerText.trim() === heading.target.trim()
                        );
                        if (headingEl) {
                          const yOffset = -90;
                          const y = headingEl.getBoundingClientRect().top + window.scrollY + yOffset;
                          window.scrollTo({ top: y, behavior: "smooth" });
                        }
                      }
                    }}
                    className={`text-left block w-full hover:text-primary transition-colors ${
                      activeSection === heading.target || (idx === 0 && !activeSection)
                        ? "text-primary font-bold pl-2 border-l border-primary"
                        : "text-on-surface-variant pl-2 border-l border-transparent"
                    }`}
                  >
                    {heading.title}
                  </button>
                </li>
              ))}
            </ul>

            <div className="border border-border bg-card-bg p-3 text-[10px] space-y-1.5 leading-relaxed text-on-surface-variant">
              <div className="font-bold uppercase text-[9px] text-primary">Highlights</div>
              {articleHighlights.length > 0 ? (
                <p>{articleHighlights.length} highlights saved in this essay.</p>
              ) : (
                <p>Select text in the essay to highlight quotes.</p>
              )}
            </div>
          </aside>
        )}

        {/* Core Article column */}
        <div 
          ref={articleRef}
          onMouseUp={handleTextSelection}
          onDoubleClick={handleDoubleClick}
          onClick={handleArticleClick}
          style={{ transform: `scale(${zoom})`, transformOrigin: "top left" }}
          className={`flex-1 min-w-0 select-text ${fontClass} ${fontSizeClass}`}
        >
          {/* Header info */}
          <div className="border-b border-border pb-6 mb-6 select-none font-mono">
            <div className="flex items-center gap-2 text-[10px] text-on-surface-variant mb-2">
              <span className="inline-block bg-secondary text-on-secondary font-mono text-[9px] px-2 py-0.5 rounded-none uppercase tracking-wider">
                {article.category}
              </span>
              <span>•</span>
              <span>{article.publishedDate}</span>
              <span>•</span>
              <span className="flex items-center gap-0.5">
                <Clock className="h-3 w-3" />
                {article.readTime}
              </span>
              <span>•</span>
              <button 
                onClick={() => {
                  setModalQuoteText("");
                  setModalNoteText("");
                  setModalRatingValue(userRating || 0);
                  setIsNoteRatingModalOpen(true);
                }}
                className="flex items-center gap-1 text-amber-500 font-bold hover:underline"
                title="Rate this article"
              >
                <Star className="h-3 w-3 fill-amber-500" />
                {averageRating > 0 ? `${averageRating.toFixed(1)} (${ratingsCount})` : "Rate Essay"}
              </button>
            </div>
            
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground font-serif leading-tight mt-3">
              {article.title}
            </h1>
            
            <p className="text-sm text-on-surface-variant font-sans leading-relaxed mt-3">
              {article.description}
            </p>

            {article.coverImage && (
              <div className="my-6 rounded-xs overflow-hidden border border-border bg-card-bg/20 select-none">
                <img src={article.coverImage} alt={article.title} className="w-full max-h-[420px] object-cover" />
              </div>
            )}
          </div>

          {/* AI Takeaways Card */}
          {showSummary && (
            <div className="border border-primary/20 bg-card-bg p-4 mb-6 font-mono text-xs leading-relaxed select-none">
              <div className="flex items-center gap-1.5 text-primary uppercase font-bold text-[9px] tracking-wider mb-2">
                <Sparkles className="h-3.5 w-3.5" />
                Key Themes & Takeaways
              </div>
              <p className="text-on-surface-variant leading-relaxed italic">{article.summary}</p>
            </div>
          )}

          {/* Article Main Text */}
          <div 
            className="space-y-6 prose dark:prose-invert max-w-none text-foreground article-content"
            dangerouslySetInnerHTML={{ __html: getFormattedContent() }}
          />

          {/* Dictionary Tooltip */}
          {dictionaryWord && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 max-w-sm w-full bg-card-bg border border-border p-4 shadow-2xl z-50 font-mono text-[11px] text-foreground">
              <div className="flex justify-between items-center border-b border-border pb-2 mb-2 font-bold">
                <span className="flex items-center gap-1.5 text-primary">
                  <HelpCircle className="h-3.5 w-3.5" />
                  Define: &quot;{dictionaryWord}&quot;
                </span>
                <button onClick={clearDictionary} className="text-zinc-500 hover:text-foreground">✕</button>
              </div>
              <p className="text-on-surface-variant leading-relaxed">{dictionaryDefinition}</p>
              <div className="text-[8px] text-zinc-500 text-right mt-2">
                Double-click another word in text to lookup
              </div>
            </div>
          )}

          {/* Article Footer Completion */}
          <div className="border-t border-border mt-12 pt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 font-mono text-xs select-none">
            <div>
              <span className="text-zinc-500 font-bold uppercase tracking-wider text-[10px]">Read State:</span>
              <button
                onClick={() => {
                  markCompleted(article.id);
                  toast.success("Essay marked as finished!");
                }}
                className="ml-3 border border-border hover:border-primary text-primary px-3 py-1 bg-card-bg transition-colors uppercase tracking-wider text-[10px]"
              >
                Mark Finished
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setModalQuoteText("");
                  setModalNoteText("");
                  setModalRatingValue(userRating || 0);
                  setIsNoteRatingModalOpen(true);
                }}
                className="border border-border text-on-surface-variant hover:text-primary px-3 py-1 bg-card-bg hover:bg-surface-container transition-colors flex items-center gap-1 uppercase tracking-wider text-[10px]"
              >
                <Edit3 className="h-3.5 w-3.5" />
                Notes & Ratings ({articleNotes.length})
              </button>
            </div>
          </div>

          {/* Dedicated Author Bio Box (Clickable, redirects to /heinze) */}
          <Link 
            href="/heinze" 
            className="block w-full mt-12 p-5 bg-card-bg border border-border hover:border-primary hover:bg-surface-container/30 transition-all select-none group"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-zinc-200 flex-shrink-0 overflow-hidden border border-border flex items-center justify-center text-zinc-400 group-hover:border-primary">
                {authorImage ? (
                  <img 
                    alt={`${authorName} portrait`}
                    className="w-full h-full object-cover" 
                    src={authorImage}
                  />
                ) : (
                  <User className="h-6 w-6" />
                )}
              </div>
              <div>
                <h4 className="font-serif text-sm font-semibold text-primary group-hover:underline">{authorName}</h4>
                <p className="font-sans text-xs text-on-surface-variant mt-1 leading-normal">
                  {authorBio}
                </p>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Selection Tooltip Popup */}
      {popupPosition && selectionText && (
        <div
          style={{
            position: "absolute",
            left: `${popupPosition.x}px`,
            top: `${popupPosition.y}px`,
            transform: "translateX(-50%)"
          }}
          onClick={(e) => e.stopPropagation()}
          className="bg-background border border-border shadow-xl p-1 flex items-center gap-1.5 z-40 font-mono text-[10px] select-none"
        >
          <button
            onClick={() => {
              addHighlight(article.id, selectionText, "yellow");
              toast.success("Highlighted yellow!");
              setSelectionText("");
            }}
            className="h-3.5 w-3.5 bg-yellow-300 border border-zinc-400/30 hover:scale-110 transition-transform"
            title="Yellow"
          />
          <button
            onClick={() => {
              addHighlight(article.id, selectionText, "green");
              toast.success("Highlighted green!");
              setSelectionText("");
            }}
            className="h-3.5 w-3.5 bg-emerald-300 border border-zinc-400/30 hover:scale-110 transition-transform"
            title="Green"
          />
          <button
            onClick={() => {
              addHighlight(article.id, selectionText, "pink");
              toast.success("Highlighted pink!");
              setSelectionText("");
            }}
            className="h-3.5 w-3.5 bg-pink-300 border border-zinc-400/30 hover:scale-110 transition-transform"
            title="Pink"
          />
          <div className="w-[1px] h-3 bg-border mx-0.5" />
          <button
            onClick={handleAddSelectionNote}
            className="hover:text-primary px-1 py-0.5"
          >
            Note
          </button>
          <button
            onClick={handleShareQuote}
            className="hover:text-primary px-1 py-0.5"
          >
            Share
          </button>
        </div>
      )}

      {/* Reflections & Rating Modal */}
      {isNoteRatingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-4">
          <div className="w-full max-w-3xl border border-border bg-background p-6 shadow-2xl relative font-mono text-xs text-foreground animate-fade-in">
            
            <button
              onClick={() => {
                setIsNoteRatingModalOpen(false);
                setModalQuoteText("");
              }}
              className="absolute top-4 right-4 text-zinc-500 hover:text-foreground font-bold"
            >
              ✕
            </button>

            <div className="border-b border-border pb-3 mb-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-primary">Reader Reflections & Notes</h3>
              <p className="text-[9px] text-zinc-500 mt-1">Annotate your reading session, save bookmarks, or rate this essay.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              
              {/* Left Column: Create Note & Rate */}
              <form onSubmit={handleModalSubmit} className="md:col-span-7 space-y-4">
                
                {/* Optional Quote Display */}
                {modalQuoteText && (
                  <div className="p-2.5 bg-card-bg border-l-2 border-primary text-[10px] text-zinc-400 leading-normal max-h-20 overflow-y-auto italic">
                    &quot;{modalQuoteText}&quot;
                  </div>
                )}

                {/* Note Text Field */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-zinc-500 uppercase font-bold">Write Annotation</label>
                  <textarea
                    placeholder="Enter notes, reflections, or critiques on this essay..."
                    value={modalNoteText}
                    onChange={(e) => setModalNoteText(e.target.value)}
                    rows={6}
                    className="w-full border border-border bg-background p-2.5 text-xs text-foreground outline-hidden focus:border-primary placeholder-zinc-600 resize-none font-sans"
                  />
                </div>

                {/* Rating Star selector */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-zinc-500 uppercase font-bold block">Rate Essay</label>
                  {user ? (
                    <div className="flex items-center gap-1.5 mt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setModalRatingValue(star)}
                          className="p-1 hover:scale-110 transition-transform"
                        >
                          <Star 
                            className={`h-5 w-5 transition-colors ${
                              star <= modalRatingValue 
                                ? "fill-amber-500 text-amber-500" 
                                : "text-zinc-500 hover:text-amber-400"
                            }`}
                          />
                        </button>
                      ))}
                      {modalRatingValue > 0 && (
                        <span className="text-[10px] text-zinc-400 ml-2 font-bold">{modalRatingValue} / 5 Stars</span>
                      )}
                    </div>
                  ) : (
                    <p className="text-[9px] text-zinc-500 italic mt-0.5">
                      Ratings are reserved for verified readers. Please <Link href="/login" className="underline text-primary">Sign In</Link> to rate.
                    </p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="border-t border-border pt-4 mt-6 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsNoteRatingModalOpen(false);
                      setModalQuoteText("");
                    }}
                    className="border border-border bg-card-bg hover:bg-surface-container px-4 py-2 uppercase font-bold text-[9px] tracking-wider transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingRating}
                    className="bg-primary text-white hover:bg-primary/95 px-5 py-2 uppercase font-bold text-[9px] tracking-wider transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {submittingRating ? "Saving..." : "Save Reflections"}
                  </button>
                </div>

              </form>

              {/* Right Column: Existing Notes List */}
              <div className="md:col-span-5 flex flex-col border-t md:border-t-0 md:border-l border-border pt-6 md:pt-0 md:pl-6">
                <span className="text-[10px] text-zinc-500 uppercase font-bold pb-2 border-b border-border/60 mb-3 block">Saved Annotations ({articleNotes.length})</span>
                
                <div className="space-y-3 overflow-y-auto max-h-[320px] pr-1 scrollbar flex-1">
                  {articleNotes.length > 0 ? (
                    articleNotes.map((note) => (
                      <div key={note.id} className="border border-border bg-card-bg/50 p-2.5 space-y-1 relative">
                        <button
                          onClick={() => removeNote(note.id)}
                          className="absolute top-2 right-2 text-zinc-500 hover:text-red-400 transition-colors"
                          title="Delete note"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                        <div className="text-[8px] text-zinc-500">{new Date(note.timestamp).toLocaleDateString()}</div>
                        <p className="text-on-surface-variant leading-normal break-words text-[11px]">{note.text}</p>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center h-48 text-center">
                      <p className="text-zinc-500 italic text-[10px]">No annotations logged.</p>
                      <p className="text-zinc-600 text-[8px] mt-1 leading-normal max-w-[150px]">Your thoughts and highlights will show up here.</p>
                    </div>
                  )}
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* External Link Warning Modal */}
      {isLeavingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs select-none">
          <div className="w-full max-w-sm border border-border bg-card-bg p-6 shadow-2xl rounded-sm font-mono text-[11px] animate-scaleIn text-foreground">
            <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-wider mb-3">
              <Globe className="h-4.5 w-4.5" />
              External Link Warning
            </div>
            <p className="text-on-surface-variant leading-relaxed mb-6 font-sans">
              You are opening an external link that will direct you outside Heinze Insights to:
              <span className="block mt-2 font-bold text-foreground break-all font-mono bg-zinc-800/10 dark:bg-zinc-200/5 p-2 border border-border/40 select-all">{leavingUrl}</span>
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsLeavingModalOpen(false)}
                className="px-3 py-1.5 border border-border bg-background hover:text-foreground text-zinc-500 transition-colors cursor-pointer uppercase tracking-wider text-[9px] font-bold"
              >
                Stay Here
              </button>
              <a
                href={leavingUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsLeavingModalOpen(false)}
                className="px-3 py-1.5 border border-primary bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-bold uppercase tracking-wider text-[9px] inline-flex items-center gap-1"
              >
                Proceed ↗
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
