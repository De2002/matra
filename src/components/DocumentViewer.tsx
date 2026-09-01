import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { 
  Highlighter, 
  Copy, 
  Bot, 
  Volume2, 
  Check, 
  Sparkles, 
  StickyNote, 
  Search,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  ZoomIn,
  ZoomOut,
  BookA,
  ScanText,
  Languages
} from 'lucide-react';
import { LoadedDocument, ViewMode, Annotation, SearchMatch, SuperTheme, PDFFormField, ScruttinSettings } from '../types';
import { renderPDFPageToCanvas } from '../lib/pdfEngine';
import { PDFFormOverlay } from './PDFFormOverlay';
import { PDFSearchOverlay } from './PDFSearchOverlay';
import { searchInPdfPage, SearchMatchItem } from '../lib/searchEngine';

interface DocumentViewerProps {
  document: LoadedDocument;
  pdfDocProxy: any; // pdfjsLib.PDFDocumentProxy | null
  currentPage: number;
  onPageChange: (page: number) => void;
  zoom: number;
  rotation: number;
  viewMode: ViewMode;
  searchQuery: string;
  searchResults?: SearchMatch[];
  currentSearchIndex?: number;
  matchCase?: boolean;
  activeSearchMatchIndexOnPage?: number | null;
  onSelectSearchMatch?: (matchIndexOnPage: number) => void;
  onMatchesFoundOnPage?: (pageNumber: number, count: number, matches: SearchMatchItem[]) => void;
  annotations: Annotation[];
  onAddAnnotation: (annotation: Omit<Annotation, 'id' | 'createdAt'>) => void;
  onAskAIWithSelection: (text: string) => void;
  onSpeakSelection: (text: string) => void;
  onZoomChange?: (newZoom: number) => void;
  superTheme?: SuperTheme;
  mangaMode?: boolean;
  settings?: ScruttinSettings;
  onOpenDictionary?: (text: string) => void;
  onOpenOCR?: (canvas: HTMLCanvasElement | null) => void;
  formFields?: PDFFormField[];
  onFormFieldChange?: (fieldId: string, value: string | boolean) => void;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  document,
  pdfDocProxy,
  currentPage,
  onPageChange,
  zoom,
  rotation,
  viewMode,
  searchQuery,
  searchResults = [],
  currentSearchIndex = 0,
  matchCase = false,
  activeSearchMatchIndexOnPage = null,
  onSelectSearchMatch,
  onMatchesFoundOnPage,
  annotations,
  onAddAnnotation,
  onAskAIWithSelection,
  onSpeakSelection,
  onZoomChange,
  superTheme = 'none',
  mangaMode = false,
  settings,
  onOpenDictionary,
  onOpenOCR,
  formFields = [],
  onFormFieldChange = () => {},
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selectedText, setSelectedText] = useState<string>('');
  const [selectionBox, setSelectionBox] = useState<{ x: number; y: number } | null>(null);
  const [copied, setCopied] = useState(false);

  // Touch gesture state (pinch to zoom & swipe)
  const touchStartDistRef = useRef<number | null>(null);
  const initialZoomRef = useRef<number>(zoom);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const lastTapRef = useRef<number>(0);

  // Hover and scrub state for interactive reading progress bar
  const [isProgressBarHovered, setIsProgressBarHovered] = useState<boolean>(false);
  const [hoveredProgressPage, setHoveredProgressPage] = useState<number | null>(null);
  const [hoveredProgressPercent, setHoveredProgressPercent] = useState<number>(0);
  const progressBarRef = useRef<HTMLDivElement>(null);

  // Direction tracking for smooth page slide and fade transitions
  const prevPageRef = useRef<number>(currentPage);
  const [direction, setDirection] = useState<number>(0);

  useEffect(() => {
    if (currentPage > prevPageRef.current) {
      setDirection(mangaMode ? -1 : 1);
    } else if (currentPage < prevPageRef.current) {
      setDirection(mangaMode ? 1 : -1);
    }
    prevPageRef.current = currentPage;
  }, [currentPage, mangaMode]);

  // Reset top scroll position on page change in single, book, or presentation modes
  useEffect(() => {
    if ((viewMode === 'single' || viewMode === 'presentation' || viewMode === 'book') && containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [currentPage, viewMode]);

  // Smooth scroll into target page in continuous mode when currentPage changes programmatically
  useEffect(() => {
    if (viewMode === 'continuous' && containerRef.current) {
      const pageEl = containerRef.current.querySelector(`[data-page-number="${currentPage}"]`) as HTMLElement | null;
      if (pageEl) {
        const container = containerRef.current;
        const currentScroll = container.scrollTop;
        const targetScroll = pageEl.offsetTop - 24;
        if (Math.abs(currentScroll - targetScroll) > 120) {
          container.scrollTo({ top: Math.max(0, targetScroll), behavior: 'smooth' });
        }
      }
    }
  }, [currentPage, viewMode]);

  // Animation variants for smooth page transitions (slide + fade + scale + subtle blur)
  const pageTransitionVariants = {
    enter: (dir: number) => ({
      opacity: 0,
      x: dir > 0 ? 36 : dir < 0 ? -36 : 0,
      scale: 0.992,
      filter: 'blur(2px)',
    }),
    center: {
      opacity: 1,
      x: 0,
      scale: 1,
      filter: 'blur(0px)',
      transition: {
        duration: 0.24,
        ease: [0.22, 1, 0.36, 1],
      },
    },
    exit: (dir: number) => ({
      opacity: 0,
      x: dir > 0 ? -36 : dir < 0 ? 36 : 0,
      scale: 0.992,
      filter: 'blur(2px)',
      transition: {
        duration: 0.18,
        ease: [0.4, 0, 1, 1],
      },
    }),
  };

  // Handle text selection
  const handleSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) {
      const text = selection.toString().trim();
      setSelectedText(text);
      try {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        // Calculate safe position inside viewport
        const viewportWidth = window.innerWidth;
        const boxWidth = Math.min(380, viewportWidth - 20);
        let posX = rect.left + rect.width / 2 - boxWidth / 2;
        posX = Math.max(10, Math.min(posX, viewportWidth - boxWidth - 10));
        
        let posY = rect.top - 54;
        if (posY < 60) {
          posY = rect.bottom + 10;
        }

        setSelectionBox({
          x: posX,
          y: posY,
        });
      } catch {
        setSelectionBox({ x: 20, y: 80 });
      }
    } else {
      setSelectedText('');
      setSelectionBox(null);
    }
  };

  const handleCopy = () => {
    if (selectedText) {
      navigator.clipboard.writeText(selectedText);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setSelectionBox(null);
      }, 1200);
    }
  };

  const handleHighlight = () => {
    if (selectedText) {
      onAddAnnotation({
        pageIndex: currentPage - 1,
        type: 'highlight',
        color: '#fde047',
        text: selectedText,
      });
      setSelectionBox(null);
    }
  };

  const handleAddNote = () => {
    const noteText = prompt('Add sticky note for selection:', selectedText);
    if (noteText) {
      onAddAnnotation({
        pageIndex: currentPage - 1,
        type: 'note',
        color: '#60a5fa',
        text: noteText,
      });
      setSelectionBox(null);
    }
  };

  // Scroll listener for continuous mode to update current page
  const handleScroll = useCallback(() => {
    if (viewMode !== 'continuous' || !containerRef.current) return;
    const container = containerRef.current;
    const pageElements = container.querySelectorAll('.pdf-page-container');
    
    let currentVisiblePage = currentPage;
    let minDistance = Infinity;
    const containerCenter = container.scrollTop + container.clientHeight / 3;

    pageElements.forEach((el) => {
      const pageIndex = parseInt(el.getAttribute('data-page-number') || '1', 10);
      const htmlEl = el as HTMLElement;
      const distance = Math.abs(htmlEl.offsetTop - containerCenter);
      if (distance < minDistance) {
        minDistance = distance;
        currentVisiblePage = pageIndex;
      }
    });

    if (currentVisiblePage !== currentPage) {
      onPageChange(currentVisiblePage);
    }
  }, [viewMode, currentPage, onPageChange]);

  // Touch Gesture Handlers (Pinch to Zoom & Swipe)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      touchStartDistRef.current = dist;
      initialZoomRef.current = zoom;
    } else if (e.touches.length === 1) {
      touchStartXRef.current = e.touches[0].clientX;
      touchStartYRef.current = e.touches[0].clientY;

      const now = Date.now();
      if (now - lastTapRef.current < 300) {
        if (onZoomChange) {
          onZoomChange(zoom >= 1.4 ? 1.0 : 1.5);
        }
      }
      lastTapRef.current = now;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchStartDistRef.current && onZoomChange) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const currentDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      const scaleDelta = currentDist / touchStartDistRef.current;
      const targetZoom = Math.min(3.5, Math.max(0.5, initialZoomRef.current * scaleDelta));
      onZoomChange(Math.round(targetZoom * 100) / 100);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length < 2) {
      touchStartDistRef.current = null;
    }

    if (
      (viewMode === 'single' || viewMode === 'presentation' || viewMode === 'book') &&
      touchStartXRef.current !== null &&
      touchStartYRef.current !== null &&
      e.changedTouches.length > 0
    ) {
      const deltaX = e.changedTouches[0].clientX - touchStartXRef.current;
      const deltaY = e.changedTouches[0].clientY - touchStartYRef.current;

      if (Math.abs(deltaX) > 60 && Math.abs(deltaY) < 50) {
        // In Manga RTL Mode, swiping right goes to next page, swiping left goes to prev page
        const isNext = mangaMode ? deltaX > 0 : deltaX < 0;
        if (isNext && currentPage < document.pageCount) {
          onPageChange(currentPage + (viewMode === 'book' ? 2 : 1));
        } else if (!isNext && currentPage > 1) {
          onPageChange(Math.max(1, currentPage - (viewMode === 'book' ? 2 : 1)));
        }
      }

      touchStartXRef.current = null;
      touchStartYRef.current = null;
    }

    handleSelection();
  };

  // Render PDF pages
  const renderPdfPages = () => {
    if (!pdfDocProxy) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm font-medium">Rendering PDF pages...</p>
        </div>
      );
    }

    const totalPages = document.pageCount;
    let pagesToDisplay: number[] = [];

    if (viewMode === 'continuous') {
      pagesToDisplay = Array.from({ length: totalPages }, (_, i) => i + 1);
      return (
        <div className="flex flex-col items-center gap-4 sm:gap-6 py-4 sm:py-6 px-2 sm:px-4 max-w-full overflow-x-auto">
          {pagesToDisplay.map((pageNum) => (
            <PDFPageCanvas
              key={`page-${pageNum}-${zoom}-${rotation}`}
              pdfDocProxy={pdfDocProxy}
              pageNumber={pageNum}
              zoom={zoom}
              rotation={rotation}
              searchQuery={searchQuery}
              matchCase={matchCase}
              activeMatchIndexOnPage={pageNum === currentPage ? activeSearchMatchIndexOnPage : null}
              onSelectMatch={onSelectSearchMatch}
              onMatchesFound={onMatchesFoundOnPage}
              pageAnnotations={annotations.filter((a) => a.pageIndex === pageNum - 1)}
              formFields={formFields}
              onFormFieldChange={onFormFieldChange}
              highlightFormFields={settings?.highlightFormFields ?? true}
              onRegisterCanvas={(cv) => {
                if (pageNum === currentPage) activeCanvasRef.current = cv;
              }}
            />
          ))}
        </div>
      );
    } else if (viewMode === 'single' || viewMode === 'presentation') {
      pagesToDisplay = [currentPage];
    } else if (viewMode === 'book') {
      // Facing pages: In standard mode: Left = P, Right = P+1.
      // In Manga Mode (RTL): Left = P+1, Right = P!
      const p1 = currentPage;
      const p2 = currentPage + 1 <= totalPages ? currentPage + 1 : null;
      if (mangaMode && p2) {
        pagesToDisplay = [p2, p1];
      } else {
        pagesToDisplay = p2 ? [p1, p2] : [p1];
      }
    }

    return (
      <div className="flex justify-center items-center py-4 sm:py-6 px-2 sm:px-4 min-h-full max-w-full overflow-x-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={`pdf-page-${viewMode}-${pagesToDisplay.join('-')}-${zoom}-${rotation}`}
            custom={direction}
            variants={pageTransitionVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className={`flex ${viewMode === 'book' ? 'flex-row justify-center gap-2 sm:gap-4 flex-wrap' : 'flex-col items-center gap-4 sm:gap-6'} max-w-full`}
          >
            {pagesToDisplay.map((pageNum) => (
              <PDFPageCanvas
                key={`page-${pageNum}-${zoom}-${rotation}`}
                pdfDocProxy={pdfDocProxy}
                pageNumber={pageNum}
                zoom={zoom}
                rotation={rotation}
                searchQuery={searchQuery}
                matchCase={matchCase}
                activeMatchIndexOnPage={pageNum === currentPage ? activeSearchMatchIndexOnPage : null}
                onSelectMatch={onSelectSearchMatch}
                onMatchesFound={onMatchesFoundOnPage}
                pageAnnotations={annotations.filter((a) => a.pageIndex === pageNum - 1)}
                formFields={formFields}
                onFormFieldChange={onFormFieldChange}
                highlightFormFields={settings?.highlightFormFields ?? true}
                onRegisterCanvas={(cv) => {
                  if (pageNum === currentPage) activeCanvasRef.current = cv;
                }}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    );
  };

  // Render EPUB E-Book
  const renderEPUB = () => {
    const chapters = document.epubChapters || [];
    const activeChapter = chapters[currentPage - 1] || chapters[0];

    const fontFamilyClass =
      settings?.ebookFontFamily === 'sans'
        ? 'font-ebook-sans'
        : settings?.ebookFontFamily === 'mono'
        ? 'font-ebook-mono'
        : settings?.ebookFontFamily === 'dyslexic'
        ? 'font-ebook-dyslexic'
        : 'font-ebook-serif';

    const fontSize = settings?.ebookFontSize || 16;
    const lineSpacing = settings?.ebookLineSpacing || 1.6;

    if (!activeChapter) {
      return (
        <div className="p-8 text-center text-gray-500">
          No readable EPUB chapters found.
        </div>
      );
    }

    return (
      <div className="overflow-x-hidden min-h-full py-4 sm:py-8 px-2 sm:px-4">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={`epub-chapter-${currentPage}`}
            custom={direction}
            variants={pageTransitionVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="max-w-3xl mx-auto p-6 sm:p-12 bg-white dark:bg-stone-900 shadow-xl rounded-2xl border border-black/10 text-stone-900 dark:text-stone-100 transition-colors"
          >
            {/* Chapter Title */}
            <div className="border-b border-black/10 pb-4 mb-6">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Chapter {currentPage} of {document.pageCount}
              </span>
              <h1 className="text-2xl font-bold font-serif mt-1">{activeChapter.title}</h1>
            </div>

            {/* Chapter HTML Content */}
            <div
              className={`epub-content prose dark:prose-invert max-w-none ${fontFamilyClass}`}
              style={{ fontSize: `${fontSize}px`, lineHeight: lineSpacing }}
              dangerouslySetInnerHTML={{ __html: activeChapter.content }}
            />

            {/* Chapter Navigation Buttons */}
            <div className="flex items-center justify-between mt-12 pt-6 border-t border-black/10 text-xs">
              <button
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage <= 1}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-black/5 hover:bg-black/10 disabled:opacity-30 font-bold transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous Chapter</span>
              </button>

              <span className="text-[var(--text-muted)] font-mono">
                {currentPage} / {document.pageCount}
              </span>

              <button
                onClick={() => onPageChange(Math.min(document.pageCount, currentPage + 1))}
                disabled={currentPage >= document.pageCount}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-30 font-bold shadow-xs transition-all"
              >
                <span>Next Chapter</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  };

  // Render Markdown Document
  const renderMarkdown = () => {
    const text =
      typeof document.data === 'string'
        ? document.data
        : new TextDecoder().decode(document.data as ArrayBuffer);

    return (
      <div className="max-w-4xl mx-auto my-4 sm:my-8 p-4 sm:p-8 bg-white dark:bg-stone-900 shadow-lg rounded-xl border border-black/10 text-stone-800 dark:text-stone-100 font-sans leading-relaxed">
        <div className="prose prose-sm sm:prose-base prose-stone dark:prose-invert max-w-none">
          <ReactMarkdown>{text}</ReactMarkdown>
        </div>
      </div>
    );
  };

  // Render Plain Text Document with search highlighting
  const renderPlainText = () => {
    const text =
      typeof document.data === 'string'
        ? document.data
        : new TextDecoder().decode(document.data as ArrayBuffer);

    if (!searchQuery || !searchQuery.trim()) {
      return (
        <div className="max-w-4xl mx-auto my-4 sm:my-8 p-4 sm:p-8 bg-white dark:bg-stone-900 shadow-lg rounded-xl border border-black/10 font-mono text-xs sm:text-sm whitespace-pre-wrap leading-relaxed overflow-x-auto">
          {text}
        </div>
      );
    }

    const escapedQuery = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedQuery})`, matchCase ? 'g' : 'gi');
    const parts = text.split(regex);
    let matchIdx = 0;

    return (
      <div className="max-w-4xl mx-auto my-4 sm:my-8 p-4 sm:p-8 bg-white dark:bg-stone-900 shadow-lg rounded-xl border border-black/10 font-mono text-xs sm:text-sm whitespace-pre-wrap leading-relaxed overflow-x-auto">
        {parts.map((part, i) => {
          const isMatch = matchCase ? part === searchQuery : part.toLowerCase() === searchQuery.toLowerCase();
          if (isMatch) {
            const currentIdx = matchIdx++;
            const isActive = currentIdx === activeSearchMatchIndexOnPage;
            return (
              <mark
                key={i}
                id={`text-match-${currentIdx}`}
                onClick={() => onSelectSearchMatch?.(currentIdx)}
                title={`Match ${currentIdx + 1}`}
                className={`cursor-pointer rounded-xs transition-all ${
                  isActive
                    ? 'bg-amber-500 text-black font-bold ring-2 ring-amber-400 px-0.5 shadow-xs'
                    : 'bg-yellow-300/80 hover:bg-yellow-400 text-black px-0.5'
                }`}
              >
                {part}
              </mark>
            );
          }
          return part;
        })}
      </div>
    );
  };

  // Render Comic / Image strip or Manga dual page
  const renderComicOrImages = () => {
    if (document.images && document.images.length > 0) {
      if (viewMode === 'book' || viewMode === 'single') {
        const p1Idx = currentPage - 1;
        const p2Idx = viewMode === 'book' && currentPage < document.images.length ? currentPage : null;

        return (
          <div className="flex items-center justify-center min-h-full py-6 px-2 overflow-x-hidden">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={`comic-${viewMode}-${currentPage}-${mangaMode}`}
                custom={direction}
                variants={pageTransitionVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="flex items-center justify-center gap-4 max-w-full"
              >
                {mangaMode && p2Idx !== null && (
                  <div className="shadow-2xl border border-black/10 rounded-sm overflow-hidden max-w-lg">
                    <img
                      src={document.images[p2Idx]}
                      alt={`Page ${p2Idx + 1}`}
                      className="comic-page-img w-full h-auto object-contain"
                    />
                  </div>
                )}

                <div className="shadow-2xl border border-black/10 rounded-sm overflow-hidden max-w-lg">
                  <img
                    src={document.images[p1Idx]}
                    alt={`Page ${p1Idx + 1}`}
                    className="comic-page-img w-full h-auto object-contain"
                  />
                </div>

                {!mangaMode && p2Idx !== null && (
                  <div className="shadow-2xl border border-black/10 rounded-sm overflow-hidden max-w-lg">
                    <img
                      src={document.images[p2Idx]}
                      alt={`Page ${p2Idx + 1}`}
                      className="comic-page-img w-full h-auto object-contain"
                    />
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        );
      }

      // Continuous strip mode
      return (
        <div className="flex flex-col items-center gap-3 sm:gap-4 py-4 sm:py-8 px-2">
          {document.images.map((imgSrc, idx) => (
            <div
              key={idx}
              className="shadow-lg border border-black/10 rounded-sm overflow-hidden max-w-3xl w-full"
            >
              <img
                src={imgSrc}
                alt={`Page ${idx + 1}`}
                className="comic-page-img w-full h-auto object-contain"
              />
            </div>
          ))}
        </div>
      );
    }
    return <div className="p-8 text-center text-gray-500">No images loaded</div>;
  };

  const superThemeClass = superTheme !== 'none' ? `supertheme-${superTheme}` : '';

  return (
    <main
      ref={containerRef}
      onMouseUp={handleSelection}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onScroll={handleScroll}
      className={`flex-1 h-full overflow-y-auto overflow-x-auto bg-[var(--bg-viewer)] relative select-text transition-colors duration-150 touch-pan-y ${superThemeClass} ${
        viewMode === 'presentation' ? 'bg-black text-white p-0' : ''
      }`}
    >
      {/* Floating Selection Toolbar */}
      {selectionBox && (
        <div
          className="fixed z-50 bg-stone-900/95 text-white px-2 py-1.5 rounded-xl shadow-2xl flex items-center gap-1 text-xs animate-in fade-in zoom-in-95 duration-150 border border-stone-700 select-none backdrop-blur-xs max-w-[calc(100vw-24px)] overflow-x-auto"
          style={{ left: `${selectionBox.x}px`, top: `${selectionBox.y}px` }}
        >
          {/* Dictionary & Translate Popover Trigger */}
          {onOpenDictionary && (
            <button
              onClick={() => {
                onOpenDictionary(selectedText);
                setSelectionBox(null);
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 hover:bg-amber-600/80 text-amber-300 rounded-lg font-bold shrink-0"
              title="Dictionary Definition & Translation"
            >
              <BookA className="w-3.5 h-3.5" />
              <span>Define</span>
            </button>
          )}

          <button
            onClick={handleHighlight}
            className="flex items-center gap-1 px-2 py-1.5 hover:bg-stone-800 rounded-lg text-yellow-400 font-medium shrink-0"
            title="Highlight Selection"
          >
            <Highlighter className="w-3.5 h-3.5" />
            <span>Highlight</span>
          </button>

          <button
            onClick={handleAddNote}
            className="flex items-center gap-1 px-2 py-1.5 hover:bg-stone-800 rounded-lg text-blue-400 font-medium shrink-0"
            title="Add Note to Selection"
          >
            <StickyNote className="w-3.5 h-3.5" />
            <span>Note</span>
          </button>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2 py-1.5 hover:bg-stone-800 rounded-lg text-stone-200 font-medium shrink-0"
            title="Copy Text"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <div className="w-px h-4 bg-stone-700 mx-0.5 shrink-0" />

          <button
            onClick={() => {
              onAskAIWithSelection(selectedText);
              setSelectionBox(null);
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 hover:bg-indigo-900/80 text-indigo-300 rounded-lg font-bold shrink-0"
            title="Ask Gemini AI about this text"
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Ask AI</span>
          </button>

          <button
            onClick={() => {
              onSpeakSelection(selectedText);
              setSelectionBox(null);
            }}
            className="flex items-center gap-1 px-2 py-1.5 hover:bg-emerald-900/80 text-emerald-300 rounded-lg font-medium shrink-0"
            title="Read Selection Aloud (TTS)"
          >
            <Volume2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Content by Type */}
      {document.type === 'pdf' && renderPdfPages()}
      {document.type === 'epub' && renderEPUB()}
      {document.type === 'markdown' && renderMarkdown()}
      {document.type === 'text' && renderPlainText()}
      {(document.type === 'comic' || document.type === 'image') && renderComicOrImages()}

      {/* Visual Reading Progress Bar at the Bottom of DocumentViewer */}
      {document.pageCount > 0 && (
        <div
          id="document-reading-progress-container"
          ref={progressBarRef}
          onMouseEnter={() => setIsProgressBarHovered(true)}
          onMouseLeave={() => {
            setIsProgressBarHovered(false);
            setHoveredProgressPage(null);
          }}
          onMouseMove={(e) => {
            if (!progressBarRef.current || document.pageCount <= 1) return;
            const rect = progressBarRef.current.getBoundingClientRect();
            const mouseX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
            const ratio = mouseX / rect.width;
            const targetPage = Math.min(
              document.pageCount,
              Math.max(1, Math.round(ratio * (document.pageCount - 1)) + 1)
            );
            setHoveredProgressPage(targetPage);
            setHoveredProgressPercent(Math.round(ratio * 100));
          }}
          onClick={(e) => {
            if (!progressBarRef.current || document.pageCount <= 1) return;
            const rect = progressBarRef.current.getBoundingClientRect();
            const mouseX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
            const ratio = mouseX / rect.width;
            const targetPage = Math.min(
              document.pageCount,
              Math.max(1, Math.round(ratio * (document.pageCount - 1)) + 1)
            );
            onPageChange(targetPage);
          }}
          className={`sticky bottom-0 left-0 right-0 z-40 w-full group cursor-pointer transition-all duration-200 select-none ${
            isProgressBarHovered ? 'h-4 bg-black/30 dark:bg-white/15' : 'h-1.5 bg-black/10 dark:bg-white/10'
          }`}
          title={`Page ${currentPage} of ${document.pageCount} (${Math.round(
            (currentPage / document.pageCount) * 100
          )}%) • Click anywhere on bar to jump`}
        >
          {/* Active Reading Progress Fill Track */}
          <div
            id="document-reading-progress-fill"
            className="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 relative transition-all duration-150 ease-out shadow-xs"
            style={{
              width: `${Math.min(100, Math.max(0, (currentPage / document.pageCount) * 100))}%`,
            }}
          >
            {/* Progress handle knob indicator on hover */}
            <div
              className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3 h-3 bg-amber-400 border-2 border-white dark:border-stone-900 rounded-full shadow-md transition-transform duration-150 ${
                isProgressBarHovered ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
              }`}
            />
          </div>

          {/* Hover Floating Tooltip with Page and Percentage */}
          {isProgressBarHovered && hoveredProgressPage !== null && (
            <div
              className="absolute bottom-5 -translate-x-1/2 bg-stone-900/95 text-stone-100 text-[11px] font-medium px-2.5 py-1 rounded-lg shadow-xl border border-stone-700/80 pointer-events-none whitespace-nowrap flex items-center gap-1.5 backdrop-blur-xs animate-in fade-in zoom-in-95 duration-100"
              style={{
                left: `${hoveredProgressPercent}%`,
              }}
            >
              <span className="font-bold text-amber-400">Page {hoveredProgressPage}</span>
              <span className="opacity-50">/</span>
              <span>{document.pageCount}</span>
              <span className="text-[10px] text-stone-400 font-mono">
                ({Math.round((hoveredProgressPage / document.pageCount) * 100)}%)
              </span>
            </div>
          )}
        </div>
      )}

      {/* Mobile Floating Bottom Bar for Page Navigation */}
      {document.pageCount > 1 && (
        <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-30 sm:hidden bg-stone-900/90 text-white rounded-full shadow-2xl border border-stone-700/80 px-3 py-1.5 flex items-center gap-2 text-xs backdrop-blur-xs select-none">
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
            className="p-1 rounded-full hover:bg-white/20 disabled:opacity-30 disabled:pointer-events-none"
            aria-label="Previous Page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="font-mono text-xs px-1 text-stone-200">
            {currentPage} / {document.pageCount}
          </span>

          <button
            onClick={() => onPageChange(Math.min(document.pageCount, currentPage + 1))}
            disabled={currentPage >= document.pageCount}
            className="p-1 rounded-full hover:bg-white/20 disabled:opacity-30 disabled:pointer-events-none"
            aria-label="Next Page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </main>
  );
};

interface PDFPageCanvasProps {
  pdfDocProxy: any;
  pageNumber: number;
  zoom: number;
  rotation: number;
  searchQuery: string;
  matchCase?: boolean;
  activeMatchIndexOnPage?: number | null;
  onSelectMatch?: (matchIndexOnPage: number) => void;
  onMatchesFound?: (pageNumber: number, count: number, matches: SearchMatchItem[]) => void;
  pageAnnotations: Annotation[];
  formFields?: PDFFormField[];
  onFormFieldChange?: (fieldId: string, value: string | boolean) => void;
  highlightFormFields?: boolean;
  onRegisterCanvas?: (canvas: HTMLCanvasElement) => void;
}

const PDFPageCanvas: React.FC<PDFPageCanvasProps> = ({
  pdfDocProxy,
  pageNumber,
  zoom,
  rotation,
  searchQuery,
  matchCase = false,
  activeMatchIndexOnPage = null,
  onSelectMatch,
  onMatchesFound,
  pageAnnotations,
  formFields = [],
  onFormFieldChange = () => {},
  highlightFormFields = true,
  onRegisterCanvas,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({ width: 600, height: 800 });
  const [pageText, setPageText] = useState<string>('');
  const [pageMatches, setPageMatches] = useState<SearchMatchItem[]>([]);

  // Render canvas
  useEffect(() => {
    let isCancelled = false;

    async function renderPage() {
      if (!canvasRef.current || !pdfDocProxy) return;

      try {
        const result = await renderPDFPageToCanvas(
          pdfDocProxy,
          pageNumber,
          canvasRef.current,
          zoom,
          rotation
        );

        if (!isCancelled) {
          setDimensions({ width: result.width, height: result.height });
          setPageText(result.textContent || '');
          if (onRegisterCanvas && canvasRef.current) {
            onRegisterCanvas(canvasRef.current);
          }
        }
      } catch (err) {
        console.warn(`Error rendering page ${pageNumber}:`, err);
      }
    }

    renderPage();

    return () => {
      isCancelled = true;
    };
  }, [pdfDocProxy, pageNumber, zoom, rotation]);

  // Extract search matches and precise bounding boxes for this page
  useEffect(() => {
    let isCancelled = false;

    async function computeSearchMatches() {
      if (!pdfDocProxy || !searchQuery || !searchQuery.trim()) {
        if (!isCancelled) {
          setPageMatches([]);
        }
        return;
      }

      try {
        const page = await pdfDocProxy.getPage(pageNumber);
        const results = await searchInPdfPage(
          page,
          searchQuery,
          zoom,
          rotation,
          pageNumber - 1,
          matchCase
        );
        if (!isCancelled) {
          setPageMatches(results);
          if (onMatchesFound) {
            onMatchesFound(pageNumber, results.length, results);
          }
        }
      } catch (err) {
        console.warn(`Error computing search highlights on page ${pageNumber}:`, err);
      }
    }

    computeSearchMatches();

    return () => {
      isCancelled = true;
    };
  }, [pdfDocProxy, pageNumber, searchQuery, zoom, rotation, matchCase]);

  return (
    <div
      data-page-number={pageNumber}
      className="pdf-page-container relative bg-white shadow-xl rounded-sm transition-all duration-150 flex flex-col items-center max-w-full"
      style={{
        width: `${dimensions.width}px`,
        height: `${dimensions.height}px`,
      }}
    >
      {/* HTML5 Canvas */}
      <canvas
        ref={canvasRef}
        className="pdf-page-canvas w-full h-full block rounded-sm bg-white"
      />

      {/* Visual Search Matches Overlay */}
      {pageMatches.length > 0 && (
        <PDFSearchOverlay
          matches={pageMatches}
          activeMatchIndexOnPage={activeMatchIndexOnPage}
          onSelectMatch={onSelectMatch}
          zoom={zoom}
        />
      )}

      {/* Interactive AcroForms Overlay Layer */}
      <PDFFormOverlay
        fields={formFields}
        pageIndex={pageNumber - 1}
        onFieldChange={onFormFieldChange}
        highlightFields={highlightFormFields}
      />

      {/* Page Annotations Overlay */}
      {pageAnnotations.map((ann) => {
        if (ann.type === 'highlight' && ann.rect) {
          return (
            <div
              key={ann.id}
              className="absolute pointer-events-none opacity-40 mix-blend-multiply rounded-xs"
              style={{
                left: `${ann.rect.x * zoom}px`,
                top: `${ann.rect.y * zoom}px`,
                width: `${ann.rect.width * zoom}px`,
                height: `${ann.rect.height * zoom}px`,
                backgroundColor: ann.color || '#fde047',
              }}
            />
          );
        }
        if (ann.type === 'note' && ann.text) {
          return (
            <div
              key={ann.id}
              className="absolute top-2 right-2 bg-blue-500 text-white p-1.5 rounded-full shadow-lg cursor-pointer group z-30"
              title={ann.text}
            >
              <StickyNote className="w-3.5 h-3.5" />
              <div className="absolute right-0 top-full mt-1 hidden group-hover:block bg-stone-900 text-white text-xs p-2 rounded shadow-xl min-w-[160px] z-30">
                {ann.text}
              </div>
            </div>
          );
        }
        return null;
      })}

      {/* In-Document Search Highlight Badge */}
      {pageMatches.length > 0 && (
        <div className="absolute top-2 left-2 bg-amber-400 text-black text-[10px] font-bold px-2 py-0.5 rounded shadow-sm flex items-center gap-1 opacity-90 z-20 pointer-events-none">
          <Search className="w-3 h-3" />
          <span>{pageMatches.length} match{pageMatches.length === 1 ? '' : 'es'} on Page {pageNumber}</span>
        </div>
      )}

      {/* Page Number Label in corner */}
      <div className="absolute bottom-1 right-2 text-[10px] font-mono text-gray-400 opacity-60 select-none pointer-events-none">
        {pageNumber}
      </div>
    </div>
  );
};
