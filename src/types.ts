export type DocumentType = 'pdf' | 'epub' | 'comic' | 'markdown' | 'text' | 'image';

export type ViewMode = 'continuous' | 'single' | 'book' | 'presentation';

export type ThemeName = 
  | 'scruttin-classic'
  | 'dark'
  | 'sepia'
  | 'nord'
  | 'solarized-dark'
  | 'high-contrast';

export type SuperTheme = 
  | 'none'
  | 'smart-invert'
  | 'amoled'
  | 'sepia-paper'
  | 'dracula'
  | 'solarized-dark'
  | 'matrix-green';

export interface ComicInfo {
  title?: string;
  series?: string;
  number?: string;
  volume?: string;
  summary?: string;
  writer?: string;
  penciller?: string;
  inker?: string;
  colorist?: string;
  letterer?: string;
  coverArtist?: string;
  publisher?: string;
  genre?: string;
  manga?: 'Yes' | 'YesAndRightToLeft' | 'No';
  pageCount?: number;
}

export interface EPUBChapter {
  id: string;
  title: string;
  href: string;
  content: string; // sanitized HTML
  order: number;
}

export interface PDFFormField {
  id: string;
  name: string;
  type: 'text' | 'checkbox' | 'radio' | 'select' | 'button';
  value: string | boolean;
  pageIndex: number;
  rect: { x: number; y: number; width: number; height: number };
  options?: string[];
  readOnly?: boolean;
  multiline?: boolean;
  required?: boolean;
}

export interface DocumentMetadata {
  title?: string;
  author?: string;
  subject?: string;
  creator?: string;
  producer?: string;
  creationDate?: string;
  modificationDate?: string;
  pdfVersion?: string;
  pageCount: number;
  fileSize: number;
  encrypted?: boolean;
  comicInfo?: ComicInfo;
}

export interface DocumentOutlineItem {
  title: string;
  pageIndex: number;
  items?: DocumentOutlineItem[];
}

export interface Annotation {
  id: string;
  pageIndex: number;
  type: 'highlight' | 'note' | 'draw' | 'stamp';
  rect?: { x: number; y: number; width: number; height: number };
  color: string;
  text?: string;
  author?: string;
  createdAt: number;
  path?: { x: number; y: number }[];
}

export interface Bookmark {
  id: string;
  pageIndex: number;
  title: string;
  createdAt: number;
}

export interface LoadedDocument {
  id: string;
  name: string;
  type: DocumentType;
  size: number;
  data: ArrayBuffer | Uint8Array | string;
  pageCount: number;
  currentPage: number;
  metadata: DocumentMetadata;
  outline: DocumentOutlineItem[];
  annotations: Annotation[];
  bookmarks: Bookmark[];
  textContent?: string[];
  images?: string[];
  epubChapters?: EPUBChapter[];
  formFields?: PDFFormField[];
}

export interface RecentDocument {
  id: string;
  name: string;
  type: DocumentType;
  size: number;
  lastOpened: number;
  lastPage: number;
  pageCount: number;
  thumbnail?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  citations?: { page: number; snippet: string }[];
  isNotice?: boolean;
}

export interface SearchMatch {
  pageIndex: number;
  matchIndex: number;
  text: string;
  rects?: { x: number; y: number; width: number; height: number }[];
}

export interface CommandItem {
  id: string;
  title: string;
  category: 'File' | 'View' | 'Navigation' | 'Tools' | 'AI & Search' | 'Theme' | 'Help';
  shortcut?: string;
  icon?: string;
  action: () => void;
}

export interface ScruttinSettings {
  theme: ThemeName;
  pageColorFilter: SuperTheme;
  defaultZoom: number;
  defaultViewMode: ViewMode;
  mangaMode: boolean;
  smoothScroll: boolean;
  highlightFormFields: boolean;
  ebookFontSize: number;
  ebookFontFamily: 'serif' | 'sans' | 'mono' | 'dyslexic';
  ebookLineSpacing: number;
  ocrLanguage: string;
  rawText?: string;
}
