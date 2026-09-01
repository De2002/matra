import React, { useState, useEffect, useRef, useCallback } from 'react';
import JSZip from 'jszip';
import { 
  LoadedDocument, 
  ViewMode, 
  ThemeName, 
  ChatMessage, 
  Annotation, 
  Bookmark, 
  RecentDocument, 
  SearchMatch, 
  CommandItem,
  SuperTheme,
  ScruttinSettings,
  PDFFormField
} from './types';
import { Toolbar } from './components/Toolbar';
import { Sidebar } from './components/Sidebar';
import { DocumentViewer } from './components/DocumentViewer';
import { AIChatSidebar } from './components/AIChatSidebar';
import { PDFToolsModal } from './components/PDFToolsModal';
import { CommandPalette } from './components/CommandPalette';
import { TTSReader } from './components/TTSReader';
import { DocumentationModal } from './components/DocumentationModal';
import { WelcomeScreen } from './components/WelcomeScreen';
import { DictionaryModal } from './components/DictionaryModal';
import { OCRModal } from './components/OCRModal';
import { SettingsModal } from './components/SettingsModal';
import { SearchBar } from './components/SearchBar';
import { 
  loadPDFDocument, 
  extractPDFMetadata, 
  renderPageThumbnail, 
  extractAllTextFromPDF 
} from './lib/pdfEngine';
import { searchInTextPages, DocumentSearchSummary } from './lib/searchEngine';
import { parseEPUBFile } from './lib/epubEngine';
import { parseComicBookArchive } from './lib/comicEngine';
import { extractPDFFormFields, saveFilledPDF } from './lib/pdfFormEngine';
import { loadSavedSettings, saveSettings } from './lib/settingsManager';
import { 
  generateScruttinGuidePDF, 
  SAMPLE_MARKDOWN_DOC, 
  SAMPLE_TEXT_DOC 
} from './lib/sampleDocs';

export function App() {
  // Saved profile configuration
  const [settings, setSettings] = useState<ScruttinSettings>(() => loadSavedSettings());

  // Document state
  const [documents, setDocuments] = useState<LoadedDocument[]>([]);
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [pdfProxyMap, setPdfProxyMap] = useState<Record<string, any>>({});
  const [thumbnailsMap, setThumbnailsMap] = useState<Record<string, string[]>>({});
  const [formFieldsMap, setFormFieldsMap] = useState<Record<string, PDFFormField[]>>({});

  const activeDoc = documents.find((d) => d.id === activeDocId) || null;
  const currentThumbnails = (activeDoc && thumbnailsMap[activeDoc.id]) || [];
  const currentFormFields = (activeDoc && formFieldsMap[activeDoc.id]) || [];

  // Viewer controls
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [zoom, setZoom] = useState<number>(() => settings.defaultZoom || 1.0);
  const [rotation, setRotation] = useState<number>(0);
  const [viewMode, setViewMode] = useState<ViewMode>(() => settings.defaultViewMode || 'continuous');
  const [currentTheme, setCurrentTheme] = useState<ThemeName>(() => settings.theme || 'scruttin-classic');
  const [superTheme, setSuperTheme] = useState<SuperTheme>(() => settings.pageColorFilter || 'none');
  const [mangaMode, setMangaMode] = useState<boolean>(() => settings.mangaMode || false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Sidebar & Modals
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [aiChatOpen, setAiChatOpen] = useState<boolean>(false);
  const [pdfToolsOpen, setPdfToolsOpen] = useState<boolean>(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState<boolean>(false);
  const [docsModalOpen, setDocsModalOpen] = useState<boolean>(false);
  const [dictionaryOpen, setDictionaryOpen] = useState<boolean>(false);
  const [dictionaryWord, setDictionaryWord] = useState<string>('');
  const [ocrModalOpen, setOcrModalOpen] = useState<boolean>(false);
  const [ocrCanvas, setOcrCanvas] = useState<HTMLCanvasElement | null>(null);
  const [settingsModalOpen, setSettingsModalOpen] = useState<boolean>(false);

  // In-Document Search State
  const [searchOpen, setSearchOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchMatchCase, setSearchMatchCase] = useState<boolean>(false);
  const [activeSearchMatchIndexOnPage, setActiveSearchMatchIndexOnPage] = useState<number>(0);
  const [matchesOnCurrentPage, setMatchesOnCurrentPage] = useState<number>(0);
  const [docSearchSummary, setDocSearchSummary] = useState<DocumentSearchSummary>({
    totalMatches: 0,
    pageMatches: {},
    pagesWithMatches: [],
  });

  // Calculate full document search matches whenever query or active doc changes
  useEffect(() => {
    if (!searchQuery.trim() || !activeDoc) {
      setDocSearchSummary({ totalMatches: 0, pageMatches: {}, pagesWithMatches: [] });
      setMatchesOnCurrentPage(0);
      setActiveSearchMatchIndexOnPage(0);
      return;
    }

    const summary = searchInTextPages(
      activeDoc.textContent || [],
      searchQuery,
      searchMatchCase
    );
    setDocSearchSummary(summary);
  }, [searchQuery, searchMatchCase, activeDoc]);

  // Navigate to Next Search Match
  const handleNextSearchMatch = useCallback(() => {
    if (!searchQuery.trim() || !activeDoc) return;

    if (matchesOnCurrentPage > 0 && activeSearchMatchIndexOnPage < matchesOnCurrentPage - 1) {
      // Advance to next match on current page
      setActiveSearchMatchIndexOnPage((prev) => prev + 1);
    } else {
      // Find next page with matches
      const pages = docSearchSummary.pagesWithMatches;
      if (pages.length > 0) {
        const currentZeroIdx = currentPage - 1;
        const nextPages = pages.filter((p) => p > currentZeroIdx);
        const targetZeroIdx = nextPages.length > 0 ? nextPages[0] : pages[0];
        setCurrentPage(targetZeroIdx + 1);
        setActiveSearchMatchIndexOnPage(0);
      } else {
        setActiveSearchMatchIndexOnPage(0);
      }
    }
  }, [searchQuery, matchesOnCurrentPage, activeSearchMatchIndexOnPage, docSearchSummary, currentPage, activeDoc]);

  // Navigate to Previous Search Match
  const handlePrevSearchMatch = useCallback(() => {
    if (!searchQuery.trim() || !activeDoc) return;

    if (activeSearchMatchIndexOnPage > 0) {
      // Go back to previous match on current page
      setActiveSearchMatchIndexOnPage((prev) => prev - 1);
    } else {
      // Find previous page with matches
      const pages = docSearchSummary.pagesWithMatches;
      if (pages.length > 0) {
        const currentZeroIdx = currentPage - 1;
        const prevPages = pages.filter((p) => p < currentZeroIdx);
        const targetZeroIdx = prevPages.length > 0 ? prevPages[prevPages.length - 1] : pages[pages.length - 1];
        setCurrentPage(targetZeroIdx + 1);
        const matchCountOnTarget = docSearchSummary.pageMatches[targetZeroIdx] || 1;
        setActiveSearchMatchIndexOnPage(Math.max(0, matchCountOnTarget - 1));
      } else {
        setActiveSearchMatchIndexOnPage(Math.max(0, matchesOnCurrentPage - 1));
      }
    }
  }, [searchQuery, activeSearchMatchIndexOnPage, docSearchSummary, currentPage, matchesOnCurrentPage, activeDoc]);

  // Text to Speech
  const [ttsActive, setTtsActive] = useState<boolean>(false);
  const [ttsText, setTtsText] = useState<string>('');

  // AI Chat
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Recents & Storage
  const [recents, setRecents] = useState<RecentDocument[]>(() => {
    try {
      const saved = localStorage.getItem('scruttin_recents') || localStorage.getItem('sumatra_recents');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Apply settings changes
  const handleApplySettings = (newSettings: ScruttinSettings) => {
    setSettings(newSettings);
    setCurrentTheme(newSettings.theme);
    setSuperTheme(newSettings.pageColorFilter);
    setMangaMode(newSettings.mangaMode);
    setViewMode(newSettings.defaultViewMode);
    setZoom(newSettings.defaultZoom);
  };

  // Initialize with sample document on first load
  useEffect(() => {
    async function initSample() {
      try {
        const guideBytes = await generateScruttinGuidePDF();
        await loadDocumentFromData('Scruttin User Guide.pdf', guideBytes.buffer, 'pdf');
      } catch (err) {
        console.warn('Error loading initial sample PDF:', err);
      }
    }
    initSample();
  }, []);

  // Save Recents
  useEffect(() => {
    try {
      localStorage.setItem('scruttin_recents', JSON.stringify(recents.slice(0, 10)));
    } catch (e) {
      // Ignore localStorage quotas
    }
  }, [recents]);

  // Load Document Helper
  const loadDocumentFromData = async (
    name: string,
    data: ArrayBuffer | Uint8Array | string,
    type: LoadedDocument['type']
  ) => {
    const docId = `doc-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    let pageCount = 1;
    let metadata: any = { pageCount: 1, fileSize: typeof data === 'string' ? data.length : data.byteLength };
    let outline: any[] = [];
    let textContent: string[] = [];
    let images: string[] = [];
    let comicInfo: any = undefined;
    let epubChapters: any[] = [];

    if (type === 'pdf') {
      try {
        const buffer = data instanceof Uint8Array ? data.buffer : (data as ArrayBuffer);
        const proxy = await loadPDFDocument(buffer);
        pageCount = proxy.numPages;

        const metaResult = await extractPDFMetadata(proxy, buffer.byteLength);
        metadata = metaResult.metadata;
        outline = metaResult.outline;

        setPdfProxyMap((prev) => ({ ...prev, [docId]: proxy }));

        // Detect AcroForms Form Fields
        const detectedFields: PDFFormField[] = [];
        for (let p = 1; p <= Math.min(pageCount, 10); p++) {
          const fields = await extractPDFFormFields(proxy, p);
          detectedFields.push(...fields);
        }
        if (detectedFields.length > 0) {
          setFormFieldsMap((prev) => ({ ...prev, [docId]: detectedFields }));
        }

        // Extract text content asynchronously for search and AI
        extractAllTextFromPDF(proxy).then((extracted) => {
          setDocuments((prev) =>
            prev.map((d) => (d.id === docId ? { ...d, textContent: extracted } : d))
          );
        });

        // Generate thumbnails in background
        for (let p = 1; p <= Math.min(pageCount, 15); p++) {
          renderPageThumbnail(proxy, p, 140).then((thumbUrl) => {
            setThumbnailsMap((prev) => {
              const list = prev[docId] ? [...prev[docId]] : [];
              list[p - 1] = thumbUrl;
              return { ...prev, [docId]: list };
            });
          });
        }
      } catch (err) {
        console.error('Error parsing PDF document:', err);
        alert('Failed to load PDF document. It may be corrupted or invalid.');
        return;
      }
    } else if (type === 'epub') {
      try {
        const buffer = data instanceof Uint8Array ? data.buffer : (data as ArrayBuffer);
        const parsed = await parseEPUBFile(buffer);
        pageCount = parsed.chapters.length;
        metadata = parsed.metadata;
        outline = parsed.outline;
        epubChapters = parsed.chapters;
        textContent = parsed.chapters.map((c) => `${c.title}\n${c.content.replace(/<[^>]*>/g, ' ')}`);
      } catch (err) {
        console.error('Error parsing EPUB e-book:', err);
        alert('Failed to parse EPUB e-book.');
        return;
      }
    } else if (type === 'comic') {
      try {
        const buffer = data instanceof Uint8Array ? data.buffer : (data as ArrayBuffer);
        const parsed = await parseComicBookArchive(buffer);
        images = parsed.images;
        pageCount = parsed.images.length;
        comicInfo = parsed.comicInfo;
        metadata = {
          title: parsed.comicInfo?.series || name,
          author: parsed.comicInfo?.writer || 'Unknown Artist',
          creator: 'Scruttin Comic Engine',
          pageCount: parsed.images.length,
          fileSize: buffer.byteLength,
        };
        setThumbnailsMap((prev) => ({ ...prev, [docId]: images }));
      } catch (err) {
        console.error('Error extracting CBZ comic:', err);
      }
    } else if (type === 'markdown' || type === 'text') {
      const textStr = typeof data === 'string' ? data : new TextDecoder().decode(data as ArrayBuffer);
      pageCount = Math.max(1, Math.ceil(textStr.split('\n').length / 45));
      textContent = [textStr];
    }

    const newDoc: LoadedDocument = {
      id: docId,
      name,
      type,
      size: typeof data === 'string' ? data.length : data.byteLength,
      data,
      pageCount,
      currentPage: 1,
      metadata,
      outline,
      annotations: [],
      bookmarks: [],
      textContent,
      images,
      comicInfo,
      epubChapters,
    };

    setDocuments((prev) => [...prev, newDoc]);
    setActiveDocId(docId);
    setCurrentPage(1);

    // Add to recents
    setRecents((prev) => [
      {
        id: docId,
        name,
        type,
        size: newDoc.size,
        lastOpened: Date.now(),
        lastPage: 1,
        pageCount,
      },
      ...prev.filter((r) => r.name !== name),
    ]);
  };

  // Open File from computer
  const handleOpenFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const name = file.name;
      const ext = name.split('.').pop()?.toLowerCase();

      let type: LoadedDocument['type'] = 'pdf';
      if (ext === 'md' || ext === 'markdown') type = 'markdown';
      else if (ext === 'txt') type = 'text';
      else if (ext === 'epub') type = 'epub';
      else if (ext === 'cbz' || ext === 'cbr' || ext === 'zip') type = 'comic';
      else if (['png', 'jpg', 'jpeg', 'webp'].includes(ext || '')) type = 'image';

      const reader = new FileReader();
      if (type === 'markdown' || type === 'text') {
        reader.onload = () => {
          if (reader.result) loadDocumentFromData(name, reader.result as string, type);
        };
        reader.readAsText(file);
      } else {
        reader.onload = () => {
          if (reader.result) loadDocumentFromData(name, reader.result as ArrayBuffer, type);
        };
        reader.readAsArrayBuffer(file);
      }
    });

    e.target.value = '';
  };

  // Save / Export Active Document
  const handleSaveFile = () => {
    if (!activeDoc) return;
    const blob = new Blob([activeDoc.data as any], {
      type: activeDoc.type === 'pdf' ? 'application/pdf' : 'text/plain',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeDoc.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Form Field Change & Save Filled AcroForms
  const handleFormFieldChange = (fieldId: string, value: string | boolean) => {
    if (!activeDocId) return;
    setFormFieldsMap((prev) => {
      const existing = prev[activeDocId] || [];
      return {
        ...prev,
        [activeDocId]: existing.map((f) => (f.id === fieldId ? { ...f, value } : f)),
      };
    });
  };

  const handleSaveFilledPDF = async () => {
    if (!activeDoc || activeDoc.type !== 'pdf' || currentFormFields.length === 0) return;
    try {
      const savedBytes = await saveFilledPDF(activeDoc.data as ArrayBuffer, currentFormFields);
      const blob = new Blob([savedBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Filled-${activeDoc.name}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert(`Could not save filled form: ${e.message}`);
    }
  };

  // Print Document
  const handlePrint = () => {
    window.print();
  };

  // Tab Close
  const handleCloseDoc = (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    if (activeDocId === id) {
      const remaining = documents.filter((d) => d.id !== id);
      setActiveDocId(remaining.length > 0 ? remaining[remaining.length - 1].id : null);
    }
  };

  // Annotations & Bookmarks
  const handleAddAnnotation = (ann: Omit<Annotation, 'id' | 'createdAt'>) => {
    if (!activeDocId) return;
    const newAnn: Annotation = {
      ...ann,
      id: `ann-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: Date.now(),
    };
    setDocuments((prev) =>
      prev.map((d) => (d.id === activeDocId ? { ...d, annotations: [...d.annotations, newAnn] } : d))
    );
  };

  const handleDeleteAnnotation = (id: string) => {
    if (!activeDocId) return;
    setDocuments((prev) =>
      prev.map((d) =>
        d.id === activeDocId
          ? { ...d, annotations: d.annotations.filter((a) => a.id !== id) }
          : d
      )
    );
  };

  const handleAddBookmark = () => {
    if (!activeDocId || !activeDoc) return;
    const title = prompt(`Bookmark title for Page ${currentPage}:`, `Page ${currentPage}`);
    if (!title) return;

    const newBm: Bookmark = {
      id: `bm-${Date.now()}`,
      pageIndex: currentPage - 1,
      title,
      createdAt: Date.now(),
    };

    setDocuments((prev) =>
      prev.map((d) => (d.id === activeDocId ? { ...d, bookmarks: [...d.bookmarks, newBm] } : d))
    );
  };

  const handleDeleteBookmark = (id: string) => {
    if (!activeDocId) return;
    setDocuments((prev) =>
      prev.map((d) =>
        d.id === activeDocId
          ? { ...d, bookmarks: d.bookmarks.filter((b) => b.id !== id) }
          : d
      )
    );
  };

  // AI Chat with Document
  const handleSendAIChat = async (message: string, model: string) => {
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: Date.now(),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setAiLoading(true);

    let docContext = '';
    if (activeDoc) {
      if (activeDoc.textContent && activeDoc.textContent.length > 0) {
        const curPageText = activeDoc.textContent[currentPage - 1] || '';
        const allText = activeDoc.textContent.join('\n\n').slice(0, 15000);
        docContext = `Current Page (${currentPage}):\n${curPageText}\n\nDocument Summary & Content:\n${allText}`;
      } else if (typeof activeDoc.data === 'string') {
        docContext = activeDoc.data.slice(0, 15000);
      }
    }

    try {
      abortControllerRef.current = new AbortController();
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortControllerRef.current.signal,
        body: JSON.stringify({
          message,
          context: docContext,
          model,
          history: chatMessages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      let data: any;
      if (res.ok) {
        data = await res.json().catch(() => ({ reply: 'Failed to parse response' }));
      } else {
        data = await res.json().catch(() => ({ reply: `Server returned status ${res.status}` }));
      }

      const replyMsg: ChatMessage = {
        id: `reply-${Date.now()}`,
        role: 'assistant',
        content: data.reply || data.error || 'No reply received.',
        timestamp: Date.now(),
        isNotice: data.mockNotice,
      };

      setChatMessages((prev) => [...prev, replyMsg]);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setChatMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: 'assistant',
            content: `**Notice:** AI assistant is currently running in local mode (${err.message || 'Service unavailable'}).`,
            timestamp: Date.now(),
            isNotice: true,
          },
        ]);
      }
    } finally {
      setAiLoading(false);
    }
  };

  const handleStopAI = () => {
    abortControllerRef.current?.abort();
    setAiLoading(false);
  };

  // Read Aloud (TTS)
  const handleToggleTTS = () => {
    if (ttsActive) {
      setTtsActive(false);
    } else {
      let text = '';
      if (activeDoc) {
        if (activeDoc.textContent && activeDoc.textContent[currentPage - 1]) {
          text = activeDoc.textContent[currentPage - 1];
        } else if (typeof activeDoc.data === 'string') {
          text = activeDoc.data;
        }
      }
      setTtsText(text || 'No readable text on this page.');
      setTtsActive(true);
    }
  };

  const handleSpeakSelection = (text: string) => {
    setTtsText(text);
    setTtsActive(true);
  };

  const handleAskAIWithSelection = (text: string) => {
    setAiChatOpen(true);
    handleSendAIChat(`Regarding this passage: "${text}" — please explain it in detail.`, 'gemini-2.5-flash');
  };

  // Dictionary & OCR handlers
  const handleOpenDictionary = (initialText?: string) => {
    setDictionaryWord(initialText || 'Scruttin');
    setDictionaryOpen(true);
  };

  const handleOpenOCR = (canvas?: HTMLCanvasElement | null) => {
    if (canvas) setOcrCanvas(canvas);
    setOcrModalOpen(true);
  };

  // Fullscreen
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      } else if (e.key === 'F1') {
        e.preventDefault();
        setCommandPaletteOpen(true);
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
        e.preventDefault();
        handleOpenFile();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSaveFile();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        handlePrint();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      } else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        setAiChatOpen((prev) => !prev);
      } else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'T') {
        e.preventDefault();
        setPdfToolsOpen((prev) => !prev);
      } else if (e.key === '=' || e.key === '+') {
        e.preventDefault();
        setZoom((z) => Math.min(4.0, z + 0.25));
      } else if (e.key === '-') {
        e.preventDefault();
        setZoom((z) => Math.max(0.25, z - 0.25));
      } else if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault();
        setZoom(1.0);
      } else if (e.key === 'PageDown' || e.key === 'ArrowRight') {
        if (activeDoc) setCurrentPage((p) => Math.min(activeDoc.pageCount, p + 1));
      } else if (e.key === 'PageUp' || e.key === 'ArrowLeft') {
        if (activeDoc) setCurrentPage((p) => Math.max(1, p - 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeDoc]);

  // Command Palette Items
  const commands: CommandItem[] = [
    { id: 'open', title: 'Open Document...', category: 'File', shortcut: 'Ctrl+O', action: handleOpenFile },
    { id: 'save', title: 'Save / Download Document', category: 'File', shortcut: 'Ctrl+S', action: handleSaveFile },
    { id: 'print', title: 'Print Document', category: 'File', shortcut: 'Ctrl+P', action: handlePrint },
    { id: 'tools', title: 'PDF Tools Suite (Merge, Split, Rotate, Convert)', category: 'Tools', shortcut: 'Ctrl+Shift+T', action: () => setPdfToolsOpen(true) },
    { id: 'ocr', title: 'Optical Character Recognition (OCR Page)', category: 'Tools', action: () => setOcrModalOpen(true) },
    { id: 'dict', title: 'Dictionary & Multi-Language Translation', category: 'Tools', action: () => handleOpenDictionary() },
    { id: 'settings', title: 'Edit Scruttin-settings.txt', category: 'Tools', action: () => setSettingsModalOpen(true) },
    { id: 'manga', title: 'Toggle Manga Mode (RTL Dual Pages)', category: 'View', action: () => setMangaMode((m) => !m) },
    { id: 'supertheme-dark', title: 'Super-Theme: Smart Dark Invert', category: 'Theme', action: () => setSuperTheme('smart-invert') },
    { id: 'supertheme-amoled', title: 'Super-Theme: AMOLED Pure Black', category: 'Theme', action: () => setSuperTheme('amoled') },
    { id: 'supertheme-sepia', title: 'Super-Theme: Eye-Care Sepia Paper', category: 'Theme', action: () => setSuperTheme('sepia-paper') },
    { id: 'aichat', title: 'AI Chat with Document', category: 'AI & Search', shortcut: 'Ctrl+Shift+A', action: () => setAiChatOpen(true) },
    { id: 'find', title: 'Find in Document', category: 'AI & Search', shortcut: 'Ctrl+F', action: () => setSearchOpen(true) },
    { id: 'tts', title: 'Read Aloud (Text-to-Speech)', category: 'Tools', action: handleToggleTTS },
    { id: 'zoomin', title: 'Zoom In', category: 'View', shortcut: '+', action: () => setZoom((z) => Math.min(4.0, z + 0.25)) },
    { id: 'zoomout', title: 'Zoom Out', category: 'View', shortcut: '-', action: () => setZoom((z) => Math.max(0.25, z - 0.25)) },
    { id: 'fitpage', title: 'Fit Page to Window', category: 'View', shortcut: 'Ctrl+0', action: () => setZoom(1.0) },
    { id: 'fitwidth', title: 'Fit Page Width', category: 'View', action: () => setZoom(1.3) },
    { id: 'continuous', title: 'Continuous Scroll Mode', category: 'View', action: () => setViewMode('continuous') },
    { id: 'single', title: 'Single Page Mode', category: 'View', action: () => setViewMode('single') },
    { id: 'book', title: 'Facing Book Mode', category: 'View', action: () => setViewMode('book') },
    { id: 'rotcw', title: 'Rotate Clockwise (90°)', category: 'View', action: () => setRotation((r) => (r + 90) % 360) },
    { id: 'rotccw', title: 'Rotate Counter-Clockwise (90°)', category: 'View', action: () => setRotation((r) => (r + 270) % 360) },
    { id: 'theme-classic', title: 'Theme: Scruttin Classic', category: 'Theme', action: () => setCurrentTheme('scruttin-classic') },
    { id: 'theme-dark', title: 'Theme: Dark Mode', category: 'Theme', action: () => setCurrentTheme('dark') },
    { id: 'theme-sepia', title: 'Theme: Warm Sepia', category: 'Theme', action: () => setCurrentTheme('sepia') },
    { id: 'theme-nord', title: 'Theme: Nord Ice', category: 'Theme', action: () => setCurrentTheme('nord') },
    { id: 'docs', title: 'Scruttin User Manual & Help', category: 'Help', shortcut: 'F1', action: () => setDocsModalOpen(true) },
  ];

  return (
    <div className={`theme-${currentTheme} h-screen w-screen flex flex-col overflow-hidden bg-[var(--bg-app)] text-[var(--text-main)] font-sans`}>
      {/* Hidden File Input for Open Action */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.epub,.md,.markdown,.txt,.cbz,.cbr,.zip,.png,.jpg,.jpeg"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Primary Scruttin Top Toolbar */}
      <Toolbar
        documents={documents}
        activeDocId={activeDocId}
        onSelectDoc={(id) => {
          setActiveDocId(id);
          const doc = documents.find((d) => d.id === id);
          if (doc) setCurrentPage(doc.currentPage || 1);
        }}
        onCloseDoc={handleCloseDoc}
        onOpenFile={handleOpenFile}
        onSaveFile={handleSaveFile}
        onPrint={handlePrint}
        currentPage={currentPage}
        totalPages={activeDoc?.pageCount || 0}
        onPageChange={setCurrentPage}
        zoom={zoom}
        onZoomChange={setZoom}
        onZoomIn={() => setZoom((z) => Math.min(4.0, z + 0.25))}
        onZoomOut={() => setZoom((z) => Math.max(0.25, z - 0.25))}
        onFitWidth={() => setZoom(1.3)}
        onFitPage={() => setZoom(1.0)}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onRotateCW={() => setRotation((r) => (r + 90) % 360)}
        onRotateCCW={() => setRotation((r) => (r + 270) % 360)}
        searchOpen={searchOpen}
        onToggleSearch={() => setSearchOpen(!searchOpen)}
        aiChatOpen={aiChatOpen}
        onToggleAIChat={() => setAiChatOpen(!aiChatOpen)}
        onOpenPDFTools={() => setPdfToolsOpen(true)}
        ttsActive={ttsActive}
        onToggleTTS={handleToggleTTS}
        currentTheme={currentTheme}
        onThemeChange={setCurrentTheme}
        onOpenCommandPalette={() => setCommandPaletteOpen(true)}
        onOpenDocs={() => setDocsModalOpen(true)}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        isFullscreen={isFullscreen}
        onToggleFullscreen={handleToggleFullscreen}
        superTheme={superTheme}
        onSuperThemeChange={setSuperTheme}
        mangaMode={mangaMode}
        onToggleMangaMode={() => setMangaMode(!mangaMode)}
        onOpenOCR={() => handleOpenOCR(ocrCanvas)}
        onOpenDictionary={handleOpenDictionary}
        onOpenSettings={() => setSettingsModalOpen(true)}
        hasFormFields={currentFormFields.length > 0}
        onSaveFilledPDF={handleSaveFilledPDF}
      />

      {/* Main App Workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Collapsible Sidebar */}
        {sidebarOpen && activeDoc && (
          <Sidebar
            document={activeDoc}
            currentPage={currentPage}
            onPageSelect={setCurrentPage}
            thumbnails={currentThumbnails}
            annotations={activeDoc.annotations}
            onDeleteAnnotation={handleDeleteAnnotation}
            bookmarks={activeDoc.bookmarks}
            onAddBookmark={handleAddBookmark}
            onDeleteBookmark={handleDeleteBookmark}
            recents={recents}
            onOpenRecent={(rec) => {
              const existing = documents.find((d) => d.id === rec.id);
              if (existing) {
                setActiveDocId(existing.id);
                setCurrentPage(rec.lastPage);
              }
            }}
            onClose={() => setSidebarOpen(false)}
          />
        )}

        {/* Center Document Viewer or Welcome Screen */}
        {activeDoc ? (
          <DocumentViewer
            document={activeDoc}
            pdfDocProxy={pdfProxyMap[activeDoc.id] || null}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            zoom={zoom}
            rotation={rotation}
            viewMode={viewMode}
            searchQuery={searchOpen ? searchQuery : ''}
            matchCase={searchMatchCase}
            activeSearchMatchIndexOnPage={activeSearchMatchIndexOnPage}
            onSelectSearchMatch={(idx) => setActiveSearchMatchIndexOnPage(idx)}
            onMatchesFoundOnPage={(pageNum, count) => {
              if (pageNum === currentPage) {
                setMatchesOnCurrentPage(count);
              }
            }}
            annotations={activeDoc.annotations}
            onAddAnnotation={handleAddAnnotation}
            onAskAIWithSelection={handleAskAIWithSelection}
            onSpeakSelection={handleSpeakSelection}
            superTheme={superTheme}
            mangaMode={mangaMode}
            settings={settings}
            onOpenDictionary={handleOpenDictionary}
            onOpenOCR={(cv) => {
              setOcrCanvas(cv);
              setOcrModalOpen(true);
            }}
            formFields={currentFormFields}
            onFormFieldChange={handleFormFieldChange}
          />
        ) : (
          <WelcomeScreen
            onOpenFile={handleOpenFile}
            onOpenSamplePDF={async () => {
              const guideBytes = await generateScruttinGuidePDF();
              await loadDocumentFromData('Scruttin User Guide.pdf', guideBytes.buffer, 'pdf');
            }}
            onOpenSampleMarkdown={() => {
              loadDocumentFromData('Architecture Reference.md', SAMPLE_MARKDOWN_DOC, 'markdown');
            }}
            onOpenSampleText={() => {
              loadDocumentFromData('Scruttin Changelog.txt', SAMPLE_TEXT_DOC, 'text');
            }}
            onOpenPDFTools={() => setPdfToolsOpen(true)}
            onOpenDocs={() => setDocsModalOpen(true)}
            recents={recents}
            onOpenRecent={(rec) => {
              const existing = documents.find((d) => d.id === rec.id);
              if (existing) {
                setActiveDocId(existing.id);
                setCurrentPage(rec.lastPage);
              }
            }}
          />
        )}

        {/* Floating Search Bar */}
        {searchOpen && activeDoc && (
          <SearchBar
            isOpen={searchOpen}
            onClose={() => setSearchOpen(false)}
            query={searchQuery}
            onQueryChange={setSearchQuery}
            currentPage={currentPage}
            totalPages={activeDoc.pageCount}
            matchesOnCurrentPage={matchesOnCurrentPage}
            currentMatchIndexOnPage={activeSearchMatchIndexOnPage}
            totalMatchesInDocument={docSearchSummary.totalMatches}
            onNextMatch={handleNextSearchMatch}
            onPrevMatch={handlePrevSearchMatch}
            matchCase={searchMatchCase}
            onToggleMatchCase={() => setSearchMatchCase((c) => !c)}
          />
        )}

        {/* Right AI Chat Sidebar */}
        {aiChatOpen && (
          <AIChatSidebar
            document={activeDoc}
            currentPage={currentPage}
            messages={chatMessages}
            onSendMessage={handleSendAIChat}
            onClearMessages={() => setChatMessages([])}
            onClose={() => setAiChatOpen(false)}
            isLoading={aiLoading}
            onStop={handleStopAI}
          />
        )}
      </div>

      {/* Floating In-Document Search Bar */}
      {searchOpen && activeDoc && (
        <div className="absolute top-16 right-8 z-40 bg-stone-900 text-white px-3 py-2 rounded-xl shadow-2xl border border-stone-700 flex items-center gap-2 text-xs animate-in slide-in-from-top-2 duration-150">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search in document..."
            autoFocus
            className="bg-stone-800 text-white rounded-lg px-2.5 py-1 text-xs border border-stone-700 focus:outline-none focus:ring-1 focus:ring-blue-500 w-48 font-sans"
          />
          <button
            onClick={() => setSearchOpen(false)}
            className="p-1 hover:bg-stone-800 rounded text-stone-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* PDF Tools Suite Modal */}
      {pdfToolsOpen && (
        <PDFToolsModal
          activeDocument={activeDoc}
          onClose={() => setPdfToolsOpen(false)}
          onOpenGeneratedPDF={(name, data) => {
            loadDocumentFromData(name, data.buffer, 'pdf');
            setPdfToolsOpen(false);
          }}
        />
      )}

      {/* Dictionary & Translation Modal */}
      <DictionaryModal
        isOpen={dictionaryOpen}
        onClose={() => setDictionaryOpen(false)}
        selectedText={dictionaryWord}
        onAskAI={(prompt) => {
          setAiChatOpen(true);
          handleSendAIChat(prompt, 'gemini-2.5-flash');
        }}
      />

      {/* Optical Character Recognition (OCR) Modal */}
      <OCRModal
        isOpen={ocrModalOpen}
        onClose={() => setOcrModalOpen(false)}
        currentPageCanvas={ocrCanvas}
        pageNumber={currentPage}
        onAskAI={(prompt) => {
          setAiChatOpen(true);
          handleSendAIChat(prompt, 'gemini-2.5-flash');
        }}
      />

      {/* Scruttin-settings.txt Plaintext Configuration Editor */}
      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        currentSettings={settings}
        onApplySettings={handleApplySettings}
      />

      {/* Command Palette */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        commands={commands}
        onPageJump={setCurrentPage}
        totalPages={activeDoc?.pageCount || 1}
      />

      {/* Read Aloud TTS Floating Player */}
      <TTSReader
        isActive={ttsActive}
        onClose={() => setTtsActive(false)}
        textToRead={ttsText}
      />

      {/* Scruttin Documentation Modal */}
      <DocumentationModal
        isOpen={docsModalOpen}
        onClose={() => setDocsModalOpen(false)}
      />
    </div>
  );
}
export default App;
