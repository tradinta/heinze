"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ThemeType = 'light' | 'dark' | 'sepia';
export type FontClassType = 'font-sans' | 'font-serif' | 'font-mono';
export type FontSizeClassType = 'text-sm' | 'text-base' | 'text-lg' | 'text-xl';
export type LineHeightType = 'leading-snug' | 'leading-normal' | 'leading-relaxed' | 'leading-loose';

export interface Highlight {
  id: string;
  targetId: string; // article or book ID
  text: string;
  color: string; // hex or tailwind class
  timestamp: number;
}

export interface Note {
  id: string;
  targetId: string;
  text: string;
  timestamp: number;
}

export interface ReadingStats {
  wordsRead: number;
  timeSpentSeconds: number;
  completedItems: string[];
}

interface ReaderContextProps {
  // Appearance
  theme: ThemeType;
  setTheme: (t: ThemeType) => void;
  fontClass: FontClassType;
  setFontClass: (f: FontClassType) => void;
  fontSizeClass: FontSizeClassType;
  setFontSizeClass: (s: FontSizeClassType) => void;
  lineHeightClass: LineHeightType;
  setLineHeightClass: (l: LineHeightType) => void;
  zoom: number; // 0.8 to 1.5
  setZoom: (z: number) => void;
  
  // Reading States
  focusMode: boolean;
  setFocusMode: (f: boolean) => void;
  isFullscreen: boolean;
  toggleFullscreen: () => void;
  autoScrollSpeed: number; // 0 (off) to 5
  setAutoScrollSpeed: (s: number) => void;
  
  // Speech (Read out loud)
  isPlayingSpeech: boolean;
  setIsPlayingSpeech: (p: boolean) => void;
  speechRate: number;
  setSpeechRate: (r: number) => void;
  
  // Local storage lists
  bookmarks: string[];
  toggleBookmark: (id: string) => void;
  isBookmarked: (id: string) => boolean;
  
  highlights: Highlight[];
  addHighlight: (targetId: string, text: string, color: string) => void;
  removeHighlight: (id: string) => void;
  
  notes: Note[];
  addNote: (targetId: string, text: string) => void;
  removeNote: (id: string) => void;
  
  // Global search modal
  isSearchOpen: boolean;
  setIsSearchOpen: (o: boolean) => void;
  
  // Dictionary lookup
  dictionaryWord: string | null;
  dictionaryDefinition: string | null;
  lookupWord: (word: string) => void;
  clearDictionary: () => void;
  
  // User Reading Stats
  stats: ReadingStats;
  recordReadingTime: (seconds: number) => void;
  markCompleted: (id: string) => void;
  resetStats: () => void;
}

const mockDictionary: Record<string, string> = {
  ai: "Artificial Intelligence: The simulation of human intelligence processes by machines, especially computer systems.",
  syntax: "The arrangement of words and phrases to create well-formed sentences in a language. In computing, the format of commands.",
  semantics: "The branch of linguistics and logic concerned with meaning. In computing, the meaning of a program expression as opposed to its form.",
  qualia: "The internal and subjective component of sense perceptions, as of the taste of a food or the redness of a color.",
  intelligence: "The ability to acquire and apply knowledge and skills, synthesize information, and adapt to new environments.",
  epistemology: "The theory of knowledge, especially with regard to its methods, validity, and scope, and the distinction between justified belief and opinion.",
  neuroplasticity: "The ability of the brain to form and reorganize synaptic connections, especially in response to learning or experience.",
  philosophy: "The study of the fundamental nature of knowledge, reality, and existence, especially when considered as an academic discipline.",
  silicon: "A chemical element widely used in technology for semiconductors and microchips.",
  noise: "Irrelevant or meaningless data/information that obscures or distracts from the signal (useful information).",
  attention: "The cognitive process of selectively concentrating on one aspect of the environment while ignoring other things.",
  consciousness: "The state of being aware of and responsive to one's surroundings; subjective experience of existence.",
  transactive: "Referring to a shared memory system where individuals rely on external partners or databases to store and retrieve details."
};

const ReaderContext = createContext<ReaderContextProps | undefined>(undefined);

export function ReaderProvider({ children }: { children: ReactNode }) {
  // Global Reader States
  const [theme, setTheme] = useState<ThemeType>('dark');
  const [fontClass, setFontClass] = useState<FontClassType>('font-sans');
  const [fontSizeClass, setFontSizeClass] = useState<FontSizeClassType>('text-base');
  const [lineHeightClass, setLineHeightClass] = useState<LineHeightType>('leading-relaxed');
  const [zoom, setZoom] = useState<number>(1.0);
  const [focusMode, setFocusMode] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [autoScrollSpeed, setAutoScrollSpeed] = useState<number>(0);
  
  const [isPlayingSpeech, setIsPlayingSpeech] = useState<boolean>(false);
  const [speechRate, setSpeechRate] = useState<number>(1.0);
  
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  
  const [dictionaryWord, setDictionaryWord] = useState<string | null>(null);
  const [dictionaryDefinition, setDictionaryDefinition] = useState<string | null>(null);
  
  const [stats, setStats] = useState<ReadingStats>({
    wordsRead: 0,
    timeSpentSeconds: 0,
    completedItems: []
  });

  // Load from local storage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('heinze_theme') as ThemeType;
      if (savedTheme) {
        setTheme(savedTheme);
      } else {
        // Default to dark theme for premium developer feel
        setTheme('dark');
      }
      
      const savedFont = localStorage.getItem('heinze_font') as FontClassType;
      if (savedFont) setFontClass(savedFont);

      const savedFontSize = localStorage.getItem('heinze_fontSize') as FontSizeClassType;
      if (savedFontSize) setFontSizeClass(savedFontSize);

      const savedLineHeight = localStorage.getItem('heinze_lineHeight') as LineHeightType;
      if (savedLineHeight) setLineHeightClass(savedLineHeight);

      const savedZoom = localStorage.getItem('heinze_zoom');
      if (savedZoom) setZoom(parseFloat(savedZoom));

      const savedBookmarks = localStorage.getItem('heinze_bookmarks');
      if (savedBookmarks) setBookmarks(JSON.parse(savedBookmarks));

      const savedHighlights = localStorage.getItem('heinze_highlights');
      if (savedHighlights) setHighlights(JSON.parse(savedHighlights));

      const savedNotes = localStorage.getItem('heinze_notes');
      if (savedNotes) setNotes(JSON.parse(savedNotes));

      const savedStats = localStorage.getItem('heinze_stats');
      if (savedStats) setStats(JSON.parse(savedStats));
    }
  }, []);

  // Sync state to local storage when updated
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('heinze_theme', theme);
      // Update body classes for styling root page
      const root = document.documentElement;
      root.classList.remove('dark', 'sepia-mode', 'light-mode');
      if (theme === 'dark') {
        root.classList.add('dark');
      } else if (theme === 'sepia') {
        root.classList.add('sepia-mode');
      } else {
        root.classList.add('light-mode');
      }
    }
  }, [theme]);

  const saveAndSetBookmarks = (newBookmarks: string[]) => {
    setBookmarks(newBookmarks);
    localStorage.setItem('heinze_bookmarks', JSON.stringify(newBookmarks));
  };

  const toggleBookmark = (id: string) => {
    if (bookmarks.includes(id)) {
      saveAndSetBookmarks(bookmarks.filter(b => b !== id));
    } else {
      saveAndSetBookmarks([...bookmarks, id]);
    }
  };

  const isBookmarked = (id: string) => bookmarks.includes(id);

  const addHighlight = (targetId: string, text: string, color: string) => {
    const newHighlight: Highlight = {
      id: Math.random().toString(36).substring(2, 9),
      targetId,
      text,
      color,
      timestamp: Date.now()
    };
    const newHighlights = [...highlights, newHighlight];
    setHighlights(newHighlights);
    localStorage.setItem('heinze_highlights', JSON.stringify(newHighlights));
    
    // Add words to stats
    const wordsCount = text.split(/\s+/).length;
    setStats(prev => {
      const updated = { ...prev, wordsRead: prev.wordsRead + wordsCount };
      localStorage.setItem('heinze_stats', JSON.stringify(updated));
      return updated;
    });
  };

  const removeHighlight = (id: string) => {
    const newHighlights = highlights.filter(h => h.id !== id);
    setHighlights(newHighlights);
    localStorage.setItem('heinze_highlights', JSON.stringify(newHighlights));
  };

  const addNote = (targetId: string, text: string) => {
    const newNote: Note = {
      id: Math.random().toString(36).substring(2, 9),
      targetId,
      text,
      timestamp: Date.now()
    };
    const newNotes = [...notes, newNote];
    setNotes(newNotes);
    localStorage.setItem('heinze_notes', JSON.stringify(newNotes));
  };

  const removeNote = (id: string) => {
    const newNotes = notes.filter(n => n.id !== id);
    setNotes(newNotes);
    localStorage.setItem('heinze_notes', JSON.stringify(newNotes));
  };

  // Keyboard shortcut Ctrl + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Text-To-Speech Speech ended event handler
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const handleEnd = () => setIsPlayingSpeech(false);
      window.speechSynthesis.addEventListener('end', handleEnd);
      return () => {
        try {
          window.speechSynthesis.removeEventListener('end', handleEnd);
        } catch (e) {}
      };
    }
  }, []);

  // Auto-scroll handler
  useEffect(() => {
    if (autoScrollSpeed === 0) return;
    const interval = setInterval(() => {
      window.scrollBy({ top: autoScrollSpeed, behavior: 'auto' });
      // If we hit bottom, stop
      if ((window.innerHeight + window.scrollY) >= document.documentElement.scrollHeight - 2) {
        setAutoScrollSpeed(0);
      }
    }, 50);
    return () => clearInterval(interval);
  }, [autoScrollSpeed]);

  // Fullscreen support
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  // Listen for escape or window fullscreen changes to keep state synced
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Lookup word definitions (Dictionary feature)
  const lookupWord = (word: string) => {
    const cleanWord = word.toLowerCase().trim().replace(/[.,/#!$%^&*;:{}=\-_`~()?"']/g,"");
    if (!cleanWord) return;
    setDictionaryWord(word);
    const definition = mockDictionary[cleanWord] || `No local definition found for "${word}". Double-click to search another word (e.g. AI, Syntax, Qualia, Consciousness).`;
    setDictionaryDefinition(definition);
  };

  const clearDictionary = () => {
    setDictionaryWord(null);
    setDictionaryDefinition(null);
  };

  // Record reading stats
  const recordReadingTime = (seconds: number) => {
    setStats(prev => {
      const updated = { ...prev, timeSpentSeconds: prev.timeSpentSeconds + seconds };
      localStorage.setItem('heinze_stats', JSON.stringify(updated));
      return updated;
    });
  };

  const markCompleted = (id: string) => {
    setStats(prev => {
      if (prev.completedItems.includes(id)) return prev;
      const updated = {
        ...prev,
        completedItems: [...prev.completedItems, id]
      };
      localStorage.setItem('heinze_stats', JSON.stringify(updated));
      
      // Also store completion date/time
      try {
        const savedDatesStr = localStorage.getItem('heinze_completed_dates');
        const dates = savedDatesStr ? JSON.parse(savedDatesStr) : {};
        dates[id] = Date.now();
        localStorage.setItem('heinze_completed_dates', JSON.stringify(dates));
        window.dispatchEvent(new Event('completionsUpdated'));
      } catch (err) {
        console.error("Failed to store completion date:", err);
      }

      return updated;
    });
  };

  const resetStats = () => {
    const fresh = { wordsRead: 0, timeSpentSeconds: 0, completedItems: [] };
    setStats(fresh);
    localStorage.setItem('heinze_stats', JSON.stringify(fresh));
  };

  // Time tracker effect while tab is active
  useEffect(() => {
    let lastActive = Date.now();
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible' && !focusMode === false) {
        const delta = Math.floor((Date.now() - lastActive) / 1000);
        if (delta > 0 && delta < 10) { // skip if tab was suspended / hidden
          recordReadingTime(delta);
        }
      }
      lastActive = Date.now();
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <ReaderContext.Provider value={{
      theme, setTheme,
      fontClass, setFontClass,
      fontSizeClass, setFontSizeClass,
      lineHeightClass, setLineHeightClass,
      zoom, setZoom,
      focusMode, setFocusMode,
      isFullscreen, toggleFullscreen,
      autoScrollSpeed, setAutoScrollSpeed,
      isPlayingSpeech, setIsPlayingSpeech,
      speechRate, setSpeechRate,
      bookmarks, toggleBookmark, isBookmarked,
      highlights, addHighlight, removeHighlight,
      notes, addNote, removeNote,
      isSearchOpen, setIsSearchOpen,
      dictionaryWord, dictionaryDefinition, lookupWord, clearDictionary,
      stats, recordReadingTime, markCompleted, resetStats
    }}>
      {children}
    </ReaderContext.Provider>
  );
}

export function useReader() {
  const context = useContext(ReaderContext);
  if (context === undefined) {
    throw new Error('useReader must be used within a ReaderProvider');
  }
  return context;
}
