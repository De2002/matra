import React, { useState } from 'react';
import { 
  FolderOpen, 
  Download, 
  Printer, 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  RotateCcw, 
  Search, 
  Bot, 
  Wrench, 
  Volume2, 
  Palette, 
  HelpCircle, 
  LayoutGrid, 
  BookOpen, 
  Columns2, 
  Maximize2, 
  Minimize2,
  FileText,
  X,
  Plus,
  Compass,
  Menu,
  Sliders,
  MoreVertical,
  Layers,
  Sparkles,
  ArrowRight,
  ScanText,
  BookA,
  FileCode,
  CheckSquare,
  Moon,
  Sun
} from 'lucide-react';
import { LoadedDocument, ViewMode, ThemeName, SuperTheme, ScruttinSettings } from '../types';

interface ToolbarProps {
  documents: LoadedDocument[];
  activeDocId: string | null;
  onSelectDoc: (id: string) => void;
  onCloseDoc: (id: string) => void;
  onOpenFile: () => void;
  onSaveFile: () => void;
  onPrint: () => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitWidth: () => void;
  onFitPage: () => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onRotateCW: () => void;
  onRotateCCW: () => void;
  searchOpen: boolean;
  onToggleSearch: () => void;
  aiChatOpen: boolean;
  onToggleAIChat: () => void;
  onOpenPDFTools: () => void;
  ttsActive: boolean;
  onToggleTTS: () => void;
  currentTheme: ThemeName;
  onThemeChange: (theme: ThemeName) => void;
  onOpenCommandPalette: () => void;
  onOpenDocs: () => void;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  // Enhanced desktop features
  superTheme: SuperTheme;
  onSuperThemeChange: (st: SuperTheme) => void;
  mangaMode: boolean;
  onToggleMangaMode: () => void;
  onOpenOCR: () => void;
  onOpenDictionary: (initialWord?: string) => void;
  onOpenSettings: () => void;
  hasFormFields?: boolean;
  onSaveFilledPDF?: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  documents,
  activeDocId,
  onSelectDoc,
  onCloseDoc,
  onOpenFile,
  onSaveFile,
  onPrint,
  currentPage,
  totalPages,
  onPageChange,
  zoom,
  onZoomChange,
  onZoomIn,
  onZoomOut,
  onFitWidth,
  onFitPage,
  viewMode,
  onViewModeChange,
  onRotateCW,
  onRotateCCW,
  searchOpen,
  onToggleSearch,
  aiChatOpen,
  onToggleAIChat,
  onOpenPDFTools,
  ttsActive,
  onToggleTTS,
  currentTheme,
  onThemeChange,
  onOpenCommandPalette,
  onOpenDocs,
  sidebarOpen,
  onToggleSidebar,
  isFullscreen,
  onToggleFullscreen,
  superTheme,
  onSuperThemeChange,
  mangaMode,
  onToggleMangaMode,
  onOpenOCR,
  onOpenDictionary,
  onOpenSettings,
  hasFormFields = false,
  onSaveFilledPDF,
}) => {
  const [pageInput, setPageInput] = useState<string>(currentPage.toString());
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);
  const [superThemeDropdownOpen, setSuperThemeDropdownOpen] = useState(false);
  const [zoomDropdownOpen, setZoomDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Sync page input when page changes externally
  React.useEffect(() => {
    setPageInput(currentPage.toString());
  }, [currentPage]);

  const handlePageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseInt(pageInput, 10);
    if (!isNaN(p) && p >= 1 && p <= totalPages) {
      onPageChange(p);
    } else {
      setPageInput(currentPage.toString());
    }
  };

  const themes: { id: ThemeName; label: string; color: string }[] = [
    { id: 'scruttin-classic', label: 'Scruttin Classic', color: '#fcf9db' },
    { id: 'dark', label: 'Dark Mode', color: '#18181b' },
    { id: 'sepia', label: 'Warm Sepia', color: '#f4ecd8' },
    { id: 'nord', label: 'Nord Ice', color: '#2e3440' },
    { id: 'solarized-dark', label: 'Solarized Dark', color: '#002b36' },
    { id: 'high-contrast', label: 'High Contrast', color: '#000000' },
  ];

  const superThemes: { id: SuperTheme; label: string; desc: string }[] = [
    { id: 'none', label: 'Original Page Color', desc: 'Standard white / author colors' },
    { id: 'smart-invert', label: 'Smart Dark Invert', desc: 'Inverts light pages to dark' },
    { id: 'amoled', label: 'AMOLED Pure Black', desc: 'Deep black for OLED displays' },
    { id: 'sepia-paper', label: 'Eye-Care Sepia Paper', desc: 'Warm vintage reading hue' },
    { id: 'dracula', label: 'Dracula Super-Theme', desc: 'Vibrant purple-tinted dark' },
    { id: 'solarized-dark', label: 'Solarized Teal Dark', desc: 'Cyan-tinted dark filter' },
    { id: 'matrix-green', label: 'Matrix Hacker Green', desc: 'Phosphor green terminal' },
  ];

  const activeDoc = documents.find((d) => d.id === activeDocId);

  return (
    <header className="flex flex-col border-b border-[var(--border-toolbar)] bg-[var(--bg-toolbar)] select-none z-30 transition-colors duration-150 relative">
      {/* Top Document Tabs Bar */}
      {documents.length > 0 && (
        <div className="flex items-center px-2 pt-1 gap-1 overflow-x-auto no-scrollbar border-b border-black/5 bg-black/5">
          {documents.map((doc) => {
            const isActive = doc.id === activeDocId;
            return (
              <div
                key={doc.id}
                id={`tab-${doc.id}`}
                onClick={() => onSelectDoc(doc.id)}
                className={`group flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-t-md transition-all cursor-pointer max-w-[160px] sm:max-w-[220px] shrink-0 ${
                  isActive
                    ? 'bg-[var(--bg-toolbar)] text-[var(--text-main)] shadow-xs border-t border-x border-[var(--border-toolbar)]'
                    : 'text-[var(--text-muted)] hover:bg-white/40 hover:text-[var(--text-main)]'
                }`}
              >
                <FileText className="w-3.5 h-3.5 shrink-0 opacity-70" />
                <span className="truncate flex-1 text-[11px] sm:text-xs">{doc.name}</span>
                <button
                  id={`close-tab-${doc.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseDoc(doc.id);
                  }}
                  className="p-0.5 rounded hover:bg-black/10 transition-opacity opacity-70 hover:opacity-100"
                  title="Close Tab"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
          <button
            id="btn-new-tab"
            onClick={onOpenFile}
            className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-black/10 rounded transition-colors shrink-0"
            title="Open Document (Ctrl+O)"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Sumatra Action Toolbar */}
      <div className="flex items-center justify-between px-2 sm:px-3 py-1 sm:py-1.5 text-sm gap-1 sm:gap-2">
        {/* Left Section: File Operations & Sidebar Toggle */}
        <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
          <button
            id="btn-toggle-sidebar"
            onClick={onToggleSidebar}
            className={`p-2 sm:p-1.5 rounded-lg sm:rounded hover:bg-[var(--bg-toolbar-hover)] transition-colors ${
              sidebarOpen ? 'bg-black/10 font-bold' : ''
            }`}
            title="Toggle Sidebar (Thumbnails & Outline)"
            aria-label="Toggle Sidebar"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-[var(--border-toolbar)] mx-0.5" />

          <button
            id="btn-open-file"
            onClick={onOpenFile}
            className="p-2 sm:p-1.5 rounded-lg sm:rounded hover:bg-[var(--bg-toolbar-hover)] transition-colors flex items-center gap-1.5 text-xs font-semibold"
            title="Open File (Ctrl+O)"
          >
            <FolderOpen className="w-4 h-4 text-amber-600" />
            <span className="hidden sm:inline">Open</span>
          </button>

          {activeDocId && (
            <div className="hidden sm:flex items-center gap-0.5">
              <button
                id="btn-save-file"
                onClick={onSaveFile}
                className="p-1.5 rounded hover:bg-[var(--bg-toolbar-hover)] transition-colors"
                title="Save / Export Document (Ctrl+S)"
              >
                <Download className="w-4 h-4 text-emerald-600" />
              </button>
              {hasFormFields && onSaveFilledPDF && (
                <button
                  id="btn-save-forms"
                  onClick={onSaveFilledPDF}
                  className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold flex items-center gap-1 shadow-xs transition-colors"
                  title="Save Filled AcroForms to PDF"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>Save Form</span>
                </button>
              )}
              <button
                id="btn-print"
                onClick={onPrint}
                className="p-1.5 rounded hover:bg-[var(--bg-toolbar-hover)] transition-colors"
                title="Print Document (Ctrl+P)"
              >
                <Printer className="w-4 h-4 text-blue-600" />
              </button>
            </div>
          )}
        </div>

        {/* Center Section: Navigation & Zoom */}
        {activeDocId && totalPages > 0 && (
          <div className="flex items-center gap-1 sm:gap-1.5">
            {/* Page Navigation */}
            <div className="flex items-center bg-black/5 rounded-lg sm:rounded px-1 py-0.5 border border-[var(--border-toolbar)]">
              <button
                id="btn-prev-page"
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage <= 1}
                className="p-1.5 sm:p-1 rounded hover:bg-[var(--bg-toolbar-hover)] disabled:opacity-30 disabled:pointer-events-none transition-colors"
                title="Previous Page (PageUp / Left Arrow)"
                aria-label="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <form onSubmit={handlePageSubmit} className="flex items-center mx-0.5 sm:mx-1">
                <input
                  id="input-page-number"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={pageInput}
                  onChange={(e) => setPageInput(e.target.value)}
                  onBlur={handlePageSubmit}
                  className="w-9 sm:w-10 text-center text-xs py-0.5 px-0.5 sm:px-1 bg-white/80 dark:bg-stone-800 rounded border border-black/10 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                />
                <span className="text-[11px] sm:text-xs text-[var(--text-muted)] ml-1 mr-0.5 whitespace-nowrap">
                  / {totalPages}
                </span>
              </form>

              <button
                id="btn-next-page"
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage >= totalPages}
                className="p-1.5 sm:p-1 rounded hover:bg-[var(--bg-toolbar-hover)] disabled:opacity-30 disabled:pointer-events-none transition-colors"
                title="Next Page (PageDown / Right Arrow)"
                aria-label="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="h-4 w-px bg-[var(--border-toolbar)] mx-0.5 hidden md:block" />

            {/* Desktop Zoom Controls */}
            <div className="flex items-center gap-0.5 hidden md:flex">
              <button
                id="btn-zoom-out"
                onClick={onZoomOut}
                className="p-1.5 rounded hover:bg-[var(--bg-toolbar-hover)] transition-colors"
                title="Zoom Out (-)"
              >
                <ZoomOut className="w-4 h-4" />
              </button>

              <div className="relative">
                <button
                  id="btn-zoom-dropdown"
                  onClick={() => setZoomDropdownOpen(!zoomDropdownOpen)}
                  className="px-2 py-1 text-xs font-mono rounded hover:bg-[var(--bg-toolbar-hover)] border border-[var(--border-toolbar)] min-w-[58px] text-center"
                  title="Zoom Level"
                >
                  {Math.round(zoom * 100)}%
                </button>

                {zoomDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 bg-[var(--bg-toolbar)] border border-[var(--border-toolbar)] shadow-lg rounded-md py-1 z-50 min-w-[120px] text-xs">
                    <button
                      onClick={() => { onFitPage(); setZoomDropdownOpen(false); }}
                      className="w-full text-left px-3 py-1.5 hover:bg-[var(--bg-toolbar-hover)]"
                    >
                      Fit Page
                    </button>
                    <button
                      onClick={() => { onFitWidth(); setZoomDropdownOpen(false); }}
                      className="w-full text-left px-3 py-1.5 hover:bg-[var(--bg-toolbar-hover)]"
                    >
                      Fit Width
                    </button>
                    <div className="h-px bg-[var(--border-toolbar)] my-1" />
                    {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 3.0].map((z) => (
                      <button
                        key={z}
                        onClick={() => { onZoomChange(z); setZoomDropdownOpen(false); }}
                        className={`w-full text-left px-3 py-1 hover:bg-[var(--bg-toolbar-hover)] font-mono ${
                          Math.abs(zoom - z) < 0.05 ? 'font-bold text-blue-600' : ''
                        }`}
                      >
                        {Math.round(z * 100)}%
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                id="btn-zoom-in"
                onClick={onZoomIn}
                className="p-1.5 rounded hover:bg-[var(--bg-toolbar-hover)] transition-colors"
                title="Zoom In (+)"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            <div className="h-4 w-px bg-[var(--border-toolbar)] mx-0.5 hidden lg:block" />

            {/* Desktop View Mode & Rotation */}
            <div className="flex items-center gap-0.5 hidden lg:flex">
              <button
                id="btn-view-continuous"
                onClick={() => onViewModeChange('continuous')}
                className={`p-1.5 rounded hover:bg-[var(--bg-toolbar-hover)] ${
                  viewMode === 'continuous' ? 'bg-black/10 font-semibold' : ''
                }`}
                title="Continuous Vertical Scroll"
              >
                <BookOpen className="w-4 h-4" />
              </button>
              <button
                id="btn-view-single"
                onClick={() => onViewModeChange('single')}
                className={`p-1.5 rounded hover:bg-[var(--bg-toolbar-hover)] ${
                  viewMode === 'single' ? 'bg-black/10 font-semibold' : ''
                }`}
                title="Single Page Mode"
              >
                <FileText className="w-4 h-4" />
              </button>
              <button
                id="btn-view-book"
                onClick={() => onViewModeChange('book')}
                className={`p-1.5 rounded hover:bg-[var(--bg-toolbar-hover)] ${
                  viewMode === 'book' ? 'bg-black/10 font-semibold' : ''
                }`}
                title="Facing Pages (Book Mode)"
              >
                <Columns2 className="w-4 h-4" />
              </button>

              {/* Manga Mode RTL dual page toggle */}
              <button
                id="btn-toggle-manga"
                onClick={onToggleMangaMode}
                className={`px-2 py-1 rounded text-xs font-bold transition-all ml-0.5 ${
                  mangaMode
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'bg-black/5 hover:bg-black/10 text-[var(--text-muted)]'
                }`}
                title="Toggle Manga Mode (Right-to-Left Dual Page Flip)"
              >
                RTL
              </button>

              <button
                id="btn-rotate-ccw"
                onClick={onRotateCCW}
                className="p-1.5 rounded hover:bg-[var(--bg-toolbar-hover)] transition-colors ml-1"
                title="Rotate Counter-Clockwise"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                id="btn-rotate-cw"
                onClick={onRotateCW}
                className="p-1.5 rounded hover:bg-[var(--bg-toolbar-hover)] transition-colors"
                title="Rotate Clockwise"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Right Section: Super-Themes, Tools, OCR, Dict, Settings & AI */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Super-Themes / Document Invert Dropdown - Desktop */}
          <div className="relative hidden md:block">
            <button
              id="btn-supertheme"
              onClick={() => setSuperThemeDropdownOpen(!superThemeDropdownOpen)}
              className={`p-1.5 rounded hover:bg-[var(--bg-toolbar-hover)] transition-colors flex items-center gap-1 text-xs font-medium ${
                superTheme !== 'none' ? 'bg-amber-500/20 text-amber-800 dark:text-amber-300 font-bold' : ''
              }`}
              title="Super-Themes: Smart Dark & Page Color Filter"
            >
              <Moon className="w-4 h-4 text-amber-700 dark:text-amber-400" />
              <span className="hidden xl:inline">Super-Themes</span>
            </button>

            {superThemeDropdownOpen && (
              <div className="absolute right-0 top-full mt-1 bg-[var(--bg-toolbar)] border border-[var(--border-toolbar)] shadow-2xl rounded-xl py-1.5 z-50 min-w-[240px] text-xs">
                <div className="px-3 py-1 text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">
                  Page Contrast & Super-Themes
                </div>
                {superThemes.map((st) => (
                  <button
                    key={st.id}
                    onClick={() => {
                      onSuperThemeChange(st.id);
                      setSuperThemeDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 flex flex-col hover:bg-[var(--bg-toolbar-hover)] ${
                      superTheme === st.id ? 'bg-black/10 font-bold text-amber-700 dark:text-amber-300' : ''
                    }`}
                  >
                    <span className="font-semibold">{st.label}</span>
                    <span className="text-[10px] text-[var(--text-muted)]">{st.desc}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Optical Character Recognition (OCR) Trigger */}
          {activeDocId && (
            <button
              id="btn-ocr"
              onClick={onOpenOCR}
              className="p-1.5 rounded hover:bg-[var(--bg-toolbar-hover)] transition-colors hidden sm:flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-400"
              title="Optical Character Recognition (OCR)"
            >
              <ScanText className="w-4 h-4" />
              <span className="hidden 2xl:inline">OCR</span>
            </button>
          )}

          {/* Dictionary & Translation Trigger */}
          <button
            id="btn-dict"
            onClick={() => onOpenDictionary()}
            className="p-1.5 rounded hover:bg-[var(--bg-toolbar-hover)] transition-colors hidden sm:flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-400"
            title="Dictionary & Multi-Language Translator"
          >
            <BookA className="w-4 h-4" />
          </button>

          {/* Scruttin Plaintext Settings Editor */}
          <button
            id="btn-settings-txt"
            onClick={onOpenSettings}
            className="p-1.5 rounded hover:bg-[var(--bg-toolbar-hover)] transition-colors hidden lg:flex items-center gap-1 text-xs font-medium text-stone-700 dark:text-stone-300"
            title="Scruttin-settings.txt Plaintext Config"
          >
            <FileCode className="w-4 h-4 text-amber-600" />
            <span className="hidden 2xl:inline">Settings.txt</span>
          </button>

          {/* In-Document Search Toggle */}
          {activeDocId && (
            <button
              id="btn-toggle-search"
              onClick={onToggleSearch}
              className={`p-2 sm:p-1.5 rounded-lg sm:rounded hover:bg-[var(--bg-toolbar-hover)] transition-colors ${
                searchOpen ? 'bg-black/10 text-blue-600' : ''
              }`}
              title="Find in Document (Ctrl+F)"
              aria-label="Search document"
            >
              <Search className="w-4 h-4" />
            </button>
          )}

          {/* AI Chat Sidebar Toggle */}
          <button
            id="btn-toggle-aichat"
            onClick={onToggleAIChat}
            className={`p-2 sm:p-1.5 rounded-lg sm:rounded hover:bg-[var(--bg-toolbar-hover)] transition-colors flex items-center gap-1.5 text-xs font-semibold ${
              aiChatOpen ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-400' : 'text-indigo-600 dark:text-indigo-400'
            }`}
            title="AI Chat with Document (Ctrl+Shift+A)"
            aria-label="AI Assistant"
          >
            <Bot className="w-4 h-4" />
            <span className="hidden md:inline">AI Chat</span>
          </button>

          {/* Read Aloud TTS - Desktop */}
          {activeDocId && (
            <button
              id="btn-toggle-tts"
              onClick={onToggleTTS}
              className={`p-1.5 rounded hover:bg-[var(--bg-toolbar-hover)] transition-colors hidden md:block ${
                ttsActive ? 'bg-emerald-100 text-emerald-700 animate-pulse' : ''
              }`}
              title="Read Aloud (Text-to-Speech)"
            >
              <Volume2 className="w-4 h-4 text-emerald-600" />
            </button>
          )}

          {/* PDF Tools Suite Modal Trigger - Desktop */}
          <button
            id="btn-pdf-tools"
            onClick={onOpenPDFTools}
            className="p-1.5 rounded hover:bg-[var(--bg-toolbar-hover)] transition-colors hidden xl:flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400"
            title="Scruttin PDF Tools Suite (Merge, Split, Rotate, Compress, Convert)"
          >
            <Wrench className="w-4 h-4" />
            <span>PDF Tools</span>
          </button>

          <div className="h-4 w-px bg-[var(--border-toolbar)] mx-0.5 hidden sm:block" />

          {/* Theme Selector - Desktop */}
          <div className="relative hidden sm:block">
            <button
              id="btn-theme-selector"
              onClick={() => setThemeDropdownOpen(!themeDropdownOpen)}
              className="p-1.5 rounded hover:bg-[var(--bg-toolbar-hover)] transition-colors"
              title="Change Theme & Appearance"
            >
              <Palette className="w-4 h-4 text-purple-600" />
            </button>

            {themeDropdownOpen && (
              <div className="absolute right-0 top-full mt-1 bg-[var(--bg-toolbar)] border border-[var(--border-toolbar)] shadow-xl rounded-md py-1.5 z-50 min-w-[170px] text-xs">
                <div className="px-3 py-1 text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">
                  Themes
                </div>
                {themes.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      onThemeChange(t.id);
                      setThemeDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-[var(--bg-toolbar-hover)] ${
                      currentTheme === t.id ? 'font-bold text-blue-600' : ''
                    }`}
                  >
                    <span>{t.label}</span>
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-black/20"
                      style={{ backgroundColor: t.color }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Command Palette Trigger - Desktop */}
          <button
            id="btn-open-command-palette"
            onClick={onOpenCommandPalette}
            className="p-1.5 rounded hover:bg-[var(--bg-toolbar-hover)] transition-colors hidden lg:flex items-center gap-1 text-xs text-[var(--text-muted)] border border-[var(--border-toolbar)] px-2 bg-black/5"
            title="Command Palette (Ctrl+K or F1)"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Ctrl+K</span>
          </button>

          {/* Fullscreen - Desktop */}
          <button
            id="btn-toggle-fullscreen"
            onClick={onToggleFullscreen}
            className="p-1.5 rounded hover:bg-[var(--bg-toolbar-hover)] transition-colors hidden md:block"
            title="Toggle Fullscreen (F11)"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Help & Manual - Desktop */}
          <button
            id="btn-help-docs"
            onClick={onOpenDocs}
            className="p-1.5 rounded hover:bg-[var(--bg-toolbar-hover)] transition-colors hidden sm:block"
            title="Scruttin Documentation & Manual (F1)"
          >
            <HelpCircle className="w-4 h-4 text-cyan-600" />
          </button>

          {/* Mobile / Compact Menu Drawer Trigger */}
          <button
            id="btn-mobile-menu"
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-lg hover:bg-[var(--bg-toolbar-hover)] transition-colors sm:hidden text-[var(--text-main)]"
            title="More Options & Tools"
            aria-label="More Options"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile Drawer / Bottom Action Sheet */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 sm:hidden">
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setMobileMenuOpen(false)}
          />

          <div className="fixed bottom-0 inset-x-0 bg-[var(--bg-sidebar)] border-t border-[var(--border-toolbar)] rounded-t-2xl shadow-2xl z-50 p-4 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-200 text-sm">
            <div className="w-10 h-1 bg-black/20 dark:bg-white/20 rounded-full mx-auto mb-3" />

            <div className="flex items-center justify-between pb-3 border-b border-black/10 mb-3">
              <div className="font-bold text-base flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-600" />
                <span>Scruttin Menu</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-full hover:bg-black/10 text-stone-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Actions */}
            <div className="space-y-1.5 mb-4">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] px-1">
                Scruttin Super-Features
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => { onOpenOCR(); setMobileMenuOpen(false); }}
                  className="p-3 rounded-xl bg-black/5 flex items-center gap-2 font-medium text-amber-700 dark:text-amber-400"
                >
                  <ScanText className="w-4 h-4" />
                  <span>OCR Page</span>
                </button>
                <button
                  onClick={() => { onOpenDictionary(); setMobileMenuOpen(false); }}
                  className="p-3 rounded-xl bg-black/5 flex items-center gap-2 font-medium text-amber-700 dark:text-amber-400"
                >
                  <BookA className="w-4 h-4" />
                  <span>Dictionary</span>
                </button>
                <button
                  onClick={() => { onToggleMangaMode(); setMobileMenuOpen(false); }}
                  className={`p-3 rounded-xl flex items-center gap-2 font-medium ${
                    mangaMode ? 'bg-red-600 text-white' : 'bg-black/5'
                  }`}
                >
                  <span>Manga RTL Mode</span>
                </button>
                <button
                  onClick={() => { onOpenSettings(); setMobileMenuOpen(false); }}
                  className="p-3 rounded-xl bg-black/5 flex items-center gap-2 font-medium"
                >
                  <FileCode className="w-4 h-4 text-amber-600" />
                  <span>Settings.txt</span>
                </button>
              </div>
            </div>

            {/* File Operations */}
            <div className="space-y-1 mb-4">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] px-1">
                File Operations
              </div>
              <div className="grid grid-cols-3 gap-2 pt-1">
                <button
                  onClick={() => { onOpenFile(); setMobileMenuOpen(false); }}
                  className="flex flex-col items-center justify-center p-3 rounded-xl bg-black/5 hover:bg-black/10 transition-colors"
                >
                  <FolderOpen className="w-5 h-5 text-amber-600 mb-1" />
                  <span className="text-xs font-medium">Open</span>
                </button>
                {activeDoc && (
                  <>
                    <button
                      onClick={() => { onSaveFile(); setMobileMenuOpen(false); }}
                      className="flex flex-col items-center justify-center p-3 rounded-xl bg-black/5 hover:bg-black/10 transition-colors"
                    >
                      <Download className="w-5 h-5 text-emerald-600 mb-1" />
                      <span className="text-xs font-medium">Save</span>
                    </button>
                    <button
                      onClick={() => { onPrint(); setMobileMenuOpen(false); }}
                      className="flex flex-col items-center justify-center p-3 rounded-xl bg-black/5 hover:bg-black/10 transition-colors"
                    >
                      <Printer className="w-5 h-5 text-blue-600 mb-1" />
                      <span className="text-xs font-medium">Print</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* View & Zoom Controls */}
            {activeDoc && (
              <div className="space-y-2 mb-4">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] px-1">
                  View & Zoom
                </div>
                <div className="grid grid-cols-4 gap-1.5 text-xs">
                  <button
                    onClick={() => onZoomIn()}
                    className="p-2.5 rounded-lg bg-black/5 flex items-center justify-center gap-1 font-medium"
                  >
                    <ZoomIn className="w-4 h-4" />
                    <span>Zoom In</span>
                  </button>
                  <button
                    onClick={() => onZoomOut()}
                    className="p-2.5 rounded-lg bg-black/5 flex items-center justify-center gap-1 font-medium"
                  >
                    <ZoomOut className="w-4 h-4" />
                    <span>Zoom Out</span>
                  </button>
                  <button
                    onClick={() => onFitWidth()}
                    className="p-2.5 rounded-lg bg-black/5 flex items-center justify-center font-medium"
                  >
                    Fit Width
                  </button>
                  <button
                    onClick={() => onFitPage()}
                    className="p-2.5 rounded-lg bg-black/5 flex items-center justify-center font-medium"
                  >
                    Fit Page
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-1.5 text-xs pt-1">
                  <button
                    onClick={() => onViewModeChange('continuous')}
                    className={`p-2.5 rounded-lg flex items-center justify-center gap-1.5 font-medium ${
                      viewMode === 'continuous' ? 'bg-amber-600 text-white' : 'bg-black/5'
                    }`}
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Continuous</span>
                  </button>
                  <button
                    onClick={() => onViewModeChange('single')}
                    className={`p-2.5 rounded-lg flex items-center justify-center gap-1.5 font-medium ${
                      viewMode === 'single' ? 'bg-amber-600 text-white' : 'bg-black/5'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    <span>Single</span>
                  </button>
                  <button
                    onClick={() => onViewModeChange('book')}
                    className={`p-2.5 rounded-lg flex items-center justify-center gap-1.5 font-medium ${
                      viewMode === 'book' ? 'bg-amber-600 text-white' : 'bg-black/5'
                    }`}
                  >
                    <Columns2 className="w-4 h-4" />
                    <span>Facing</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <button
                    onClick={onRotateCCW}
                    className="p-2.5 rounded-lg bg-black/5 flex items-center justify-center gap-1.5 font-medium"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Rotate CCW</span>
                  </button>
                  <button
                    onClick={onRotateCW}
                    className="p-2.5 rounded-lg bg-black/5 flex items-center justify-center gap-1.5 font-medium"
                  >
                    <RotateCw className="w-4 h-4" />
                    <span>Rotate CW</span>
                  </button>
                </div>
              </div>
            )}

            {/* Tools & Features */}
            <div className="space-y-1.5 mb-4">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] px-1">
                Tools & AI
              </div>
              <div className="space-y-1">
                <button
                  onClick={() => { onOpenPDFTools(); setMobileMenuOpen(false); }}
                  className="w-full p-3 rounded-xl bg-black/5 hover:bg-black/10 flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-2.5 font-medium text-amber-700 dark:text-amber-400">
                    <Wrench className="w-4 h-4" />
                    <span>PDF Tools Suite (Merge, Split, Rotate)</span>
                  </div>
                  <ArrowRight className="w-4 h-4 opacity-50" />
                </button>

                {activeDoc && (
                  <button
                    onClick={() => { onToggleTTS(); setMobileMenuOpen(false); }}
                    className="w-full p-3 rounded-xl bg-black/5 hover:bg-black/10 flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-2.5 font-medium text-emerald-700 dark:text-emerald-400">
                      <Volume2 className="w-4 h-4" />
                      <span>Read Aloud (Text-to-Speech)</span>
                    </div>
                    <ArrowRight className="w-4 h-4 opacity-50" />
                  </button>
                )}

                <button
                  onClick={() => { onOpenCommandPalette(); setMobileMenuOpen(false); }}
                  className="w-full p-3 rounded-xl bg-black/5 hover:bg-black/10 flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-2.5 font-medium">
                    <Compass className="w-4 h-4 text-indigo-600" />
                    <span>Command Palette & Jump</span>
                  </div>
                  <ArrowRight className="w-4 h-4 opacity-50" />
                </button>

                <button
                  onClick={() => { onOpenDocs(); setMobileMenuOpen(false); }}
                  className="w-full p-3 rounded-xl bg-black/5 hover:bg-black/10 flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-2.5 font-medium text-cyan-700 dark:text-cyan-400">
                    <HelpCircle className="w-4 h-4" />
                    <span>Scruttin User Manual & Shortcuts</span>
                  </div>
                  <ArrowRight className="w-4 h-4 opacity-50" />
                </button>
              </div>
            </div>

            {/* Themes Grid */}
            <div className="space-y-1.5 mb-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] px-1">
                Themes & Colors
              </div>
              <div className="grid grid-cols-2 gap-2">
                {themes.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      onThemeChange(t.id);
                    }}
                    className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                      currentTheme === t.id
                        ? 'border-amber-600 bg-amber-500/10 font-bold'
                        : 'border-black/10 bg-black/5'
                    }`}
                  >
                    <span className="text-xs truncate">{t.label}</span>
                    <span
                      className="w-4 h-4 rounded-full border border-black/20 shrink-0 ml-2"
                      style={{ backgroundColor: t.color }}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
