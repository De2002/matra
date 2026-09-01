import React, { useState } from 'react';
import { 
  FileText, 
  ListTree, 
  Highlighter, 
  Info, 
  Bookmark as BookmarkIcon, 
  Clock, 
  Trash2, 
  ChevronRight, 
  ChevronDown,
  X,
  ExternalLink,
  Plus,
  Pencil,
  Check
} from 'lucide-react';
import { LoadedDocument, DocumentOutlineItem, Annotation, Bookmark, RecentDocument } from '../types';

interface SidebarProps {
  document: LoadedDocument | null;
  currentPage: number;
  onPageSelect: (page: number) => void;
  thumbnails: string[];
  annotations: Annotation[];
  onDeleteAnnotation: (id: string) => void;
  bookmarks: Bookmark[];
  onAddBookmark: () => void;
  onDeleteBookmark: (id: string) => void;
  recents: RecentDocument[];
  onOpenRecent: (doc: RecentDocument) => void;
  onRenameDocument?: (id: string, newName: string) => void;
  onClose: () => void;
}

type TabType = 'thumbnails' | 'outline' | 'annotations' | 'info' | 'recents';

export const Sidebar: React.FC<SidebarProps> = ({
  document,
  currentPage,
  onPageSelect,
  thumbnails,
  annotations,
  onDeleteAnnotation,
  bookmarks,
  onAddBookmark,
  onDeleteBookmark,
  recents,
  onOpenRecent,
  onRenameDocument,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('thumbnails');
  const [isEditingSidebarName, setIsEditingSidebarName] = useState(false);
  const [editNameInput, setEditNameInput] = useState('');

  const handleStartRename = () => {
    if (!document) return;
    setEditNameInput(document.name);
    setIsEditingSidebarName(true);
  };

  const handleSaveSidebarName = () => {
    if (document && editNameInput.trim() && onRenameDocument) {
      onRenameDocument(document.id, editNameInput.trim());
    }
    setIsEditingSidebarName(false);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const renderOutlineItems = (items: DocumentOutlineItem[], level = 0) => {
    return items.map((item, idx) => (
      <OutlineNode
        key={`${item.title}-${idx}-${level}`}
        item={item}
        level={level}
        onSelect={(p) => {
          onPageSelect(p);
          // On mobile screens, could optionally keep or close
        }}
        currentPage={currentPage}
      />
    ));
  };

  const tabs: { id: TabType; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'thumbnails', label: 'Pages', icon: FileText },
    { id: 'outline', label: 'Outline', icon: ListTree },
    { id: 'annotations', label: 'Notes', icon: Highlighter },
    { id: 'info', label: 'Info', icon: Info },
    { id: 'recents', label: 'Recent', icon: Clock },
  ];

  return (
    <div className="fixed inset-0 z-40 md:static md:z-20 md:flex flex-row">
      {/* Mobile Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-xs md:hidden animate-in fade-in"
        onClick={onClose}
      />

      {/* Sidebar Container */}
      <aside className="fixed inset-y-0 left-0 z-50 w-[85vw] max-w-xs sm:w-80 md:static md:inset-auto md:w-72 lg:w-80 h-full border-r border-[var(--border-toolbar)] bg-[var(--bg-sidebar)] flex flex-col select-none shadow-2xl md:shadow-none transition-colors duration-150 animate-in slide-in-from-left md:animate-none">
        {/* Sidebar Header & Navigation Tabs */}
        <div className="flex flex-col border-b border-[var(--border-toolbar)] bg-black/5">
          {/* Top title on mobile */}
          <div className="flex items-center justify-between px-3 pt-2.5 pb-1 md:hidden">
            <div className="font-bold text-xs flex items-center gap-1.5 text-[var(--text-main)]">
              <ListTree className="w-4 h-4 text-amber-600" />
              <span>Document Navigation</span>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-black/10 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center px-1.5 py-1 justify-between gap-1 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-1 flex-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    id={`tab-btn-${tab.id}`}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all shrink-0 ${
                      isActive
                        ? 'bg-[var(--bg-sidebar)] text-[var(--text-main)] font-bold shadow-xs border border-black/5'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-black/5'
                    }`}
                    title={tab.label}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            <button
              id="btn-close-sidebar"
              onClick={onClose}
              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-black/10 transition-colors hidden md:block"
              title="Close Sidebar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Active Document Header with Rename Trigger */}
          {document && (
            <div className="px-2.5 py-1.5 border-t border-black/5 bg-black/5 flex items-center justify-between gap-1.5">
              {isEditingSidebarName ? (
                <div className="flex items-center gap-1 w-full animate-in fade-in">
                  <input
                    id="input-sidebar-quick-rename"
                    type="text"
                    value={editNameInput}
                    onChange={(e) => setEditNameInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSaveSidebarName();
                      } else if (e.key === 'Escape') {
                        e.preventDefault();
                        setIsEditingSidebarName(false);
                      }
                    }}
                    autoFocus
                    placeholder="Enter document name..."
                    className="flex-1 px-2 py-1 text-xs rounded border border-blue-500 bg-white dark:bg-stone-900 text-[var(--text-main)] focus:outline-none ring-1 ring-blue-500 min-w-0"
                  />
                  <button
                    id="btn-sidebar-save-rename"
                    onClick={handleSaveSidebarName}
                    className="p-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 shadow-xs"
                    title="Save (Enter)"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    id="btn-sidebar-cancel-rename"
                    onClick={() => setIsEditingSidebarName(false)}
                    className="p-1 rounded bg-stone-500 hover:bg-stone-600 text-white shrink-0"
                    title="Cancel (Esc)"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-1.5 truncate flex-1 min-w-0" title={document.name}>
                    <FileText className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span className="truncate font-semibold text-[11px] text-[var(--text-main)]">{document.name}</span>
                  </div>
                  <button
                    id="btn-sidebar-header-rename"
                    onClick={handleStartRename}
                    className="p-1 rounded hover:bg-black/10 text-[var(--text-muted)] hover:text-blue-600 dark:hover:text-blue-400 transition-colors shrink-0 flex items-center gap-1 text-[10px] font-medium"
                    title="Rename Document"
                  >
                    <Pencil className="w-3 h-3" />
                    <span>Rename</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Sidebar Tab Content */}
        <div className="flex-1 overflow-y-auto p-3 text-xs overscroll-contain">
          {/* Thumbnails View */}
          {activeTab === 'thumbnails' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                <span>Pages ({document?.pageCount || 0})</span>
                <span className="text-[10px] text-blue-600 font-mono">Current: p.{currentPage}</span>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {Array.from({ length: document?.pageCount || 0 }).map((_, index) => {
                  const pageNum = index + 1;
                  const isCurrent = pageNum === currentPage;
                  const thumb = thumbnails[index];

                  return (
                    <div
                      key={pageNum}
                      id={`thumb-page-${pageNum}`}
                      onClick={() => onPageSelect(pageNum)}
                      className={`flex flex-col items-center p-2 rounded-xl cursor-pointer transition-all border ${
                        isCurrent
                          ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 shadow-md ring-2 ring-blue-400'
                          : 'border-black/10 dark:border-white/10 hover:border-black/30 hover:bg-black/5'
                      }`}
                    >
                      <div className="w-full aspect-[1/1.35] bg-white rounded-lg flex items-center justify-center overflow-hidden shadow-xs border border-black/5">
                        {thumb ? (
                          <img
                            src={thumb}
                            alt={`Page ${pageNum}`}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <span className="text-gray-400 text-xs font-mono font-bold">{pageNum}</span>
                        )}
                      </div>
                      <span className={`mt-1.5 text-[11px] font-medium ${isCurrent ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-[var(--text-muted)]'}`}>
                        Page {pageNum}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Outline / Bookmarks View */}
          {activeTab === 'outline' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                  Table of Contents
                </span>
                <button
                  id="btn-add-bookmark"
                  onClick={onAddBookmark}
                  className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold p-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Bookmark p.{currentPage}</span>
                </button>
              </div>

              {/* Custom User Bookmarks */}
              {bookmarks.length > 0 && (
                <div className="mb-4 pb-3 border-b border-black/10 space-y-1">
                  <div className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400 px-1">
                    Saved Bookmarks
                  </div>
                  {bookmarks.map((bm) => (
                    <div
                      key={bm.id}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-black/5 group cursor-pointer"
                      onClick={() => onPageSelect(bm.pageIndex + 1)}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <BookmarkIcon className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                        <span className="truncate font-medium">{bm.title}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteBookmark(bm.id);
                        }}
                        className="opacity-70 group-hover:opacity-100 text-red-500 hover:text-red-700 p-1"
                        title="Delete Bookmark"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* PDF Embedded Outline */}
              {document?.outline && document.outline.length > 0 ? (
                <div className="space-y-0.5">
                  {renderOutlineItems(document.outline)}
                </div>
              ) : (
                <div className="text-center py-8 text-[var(--text-muted)]">
                  <ListTree className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p>No embedded table of contents found in this document.</p>
                </div>
              )}
            </div>
          )}

          {/* Annotations View */}
          {activeTab === 'annotations' && (
            <div className="space-y-3">
              <div className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                Document Annotations ({annotations.length})
              </div>

              {annotations.length > 0 ? (
                <div className="space-y-2">
                  {annotations.map((ann) => (
                    <div
                      key={ann.id}
                      onClick={() => onPageSelect(ann.pageIndex + 1)}
                      className="p-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 hover:border-black/20 cursor-pointer space-y-1 group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs flex items-center gap-1.5 capitalize">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: ann.color }}
                          />
                          {ann.type} on Page {ann.pageIndex + 1}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteAnnotation(ann.id);
                          }}
                          className="opacity-70 group-hover:opacity-100 text-red-500 hover:text-red-700 p-1"
                          title="Delete annotation"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {ann.text && (
                        <p className="text-[11px] text-[var(--text-main)] italic line-clamp-3">
                          "{ann.text}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-[var(--text-muted)]">
                  <Highlighter className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="font-medium">No annotations yet.</p>
                  <p className="text-[10px] mt-1">Select text on any page to highlight or add notes.</p>
                </div>
              )}
            </div>
          )}

          {/* Document Info / Metadata View */}
          {activeTab === 'info' && (
            <div className="space-y-4">
              <div className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                Document Properties
              </div>

              {document ? (
                <div className="space-y-2.5 bg-black/5 dark:bg-white/5 p-3 rounded-xl border border-black/5">
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="text-[10px] uppercase font-bold text-[var(--text-muted)]">File Name</div>
                      {!isEditingSidebarName && (
                        <button
                          id="btn-info-tab-rename"
                          onClick={handleStartRename}
                          className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold p-0.5"
                        >
                          <Pencil className="w-2.5 h-2.5" />
                          <span>Rename</span>
                        </button>
                      )}
                    </div>
                    {isEditingSidebarName ? (
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <input
                          id="input-info-doc-name"
                          type="text"
                          value={editNameInput}
                          onChange={(e) => setEditNameInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleSaveSidebarName();
                            } else if (e.key === 'Escape') {
                              e.preventDefault();
                              setIsEditingSidebarName(false);
                            }
                          }}
                          autoFocus
                          className="flex-1 px-2 py-1 text-xs rounded border border-blue-500 bg-white dark:bg-stone-900 text-[var(--text-main)] focus:outline-none ring-1 ring-blue-500"
                        />
                        <button
                          id="btn-info-save-rename"
                          onClick={handleSaveSidebarName}
                          className="p-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                          title="Save (Enter)"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          id="btn-info-cancel-rename"
                          onClick={() => setIsEditingSidebarName(false)}
                          className="p-1 rounded bg-stone-500 hover:bg-stone-600 text-white"
                          title="Cancel (Esc)"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="font-medium text-[var(--text-main)] break-all mt-0.5">{document.name}</div>
                    )}
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Title</div>
                    <div className="text-[var(--text-main)]">{document.metadata.title || '—'}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Author</div>
                    <div className="text-[var(--text-main)]">{document.metadata.author || '—'}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Pages</div>
                    <div className="text-[var(--text-main)] font-mono">{document.pageCount}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-[var(--text-muted)]">File Size</div>
                    <div className="text-[var(--text-main)] font-mono">{formatFileSize(document.size)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Document Type</div>
                    <div className="text-[var(--text-main)] font-bold uppercase text-[11px] text-amber-600">
                      {document.type}
                    </div>
                  </div>
                  {document.comicInfo && (
                    <div className="pt-2 border-t border-black/10 space-y-2">
                      <div className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400">
                        ComicBook Info (CBZ)
                      </div>
                      {document.comicInfo.series && (
                        <div>
                          <div className="text-[10px] font-bold text-[var(--text-muted)]">Series / Issue</div>
                          <div className="text-[var(--text-main)] font-medium">
                            {document.comicInfo.series} {document.comicInfo.number ? `#${document.comicInfo.number}` : ''}
                          </div>
                        </div>
                      )}
                      {document.comicInfo.writer && (
                        <div>
                          <div className="text-[10px] font-bold text-[var(--text-muted)]">Writer</div>
                          <div className="text-[var(--text-main)]">{document.comicInfo.writer}</div>
                        </div>
                      )}
                      {document.comicInfo.penciller && (
                        <div>
                          <div className="text-[10px] font-bold text-[var(--text-muted)]">Penciller / Artist</div>
                          <div className="text-[var(--text-main)]">{document.comicInfo.penciller}</div>
                        </div>
                      )}
                      {document.comicInfo.publisher && (
                        <div>
                          <div className="text-[10px] font-bold text-[var(--text-muted)]">Publisher</div>
                          <div className="text-[var(--text-main)]">{document.comicInfo.publisher}</div>
                        </div>
                      )}
                      {document.comicInfo.genre && (
                        <div>
                          <div className="text-[10px] font-bold text-[var(--text-muted)]">Genre</div>
                          <div className="text-[var(--text-main)]">{document.comicInfo.genre}</div>
                        </div>
                      )}
                      {document.comicInfo.summary && (
                        <div>
                          <div className="text-[10px] font-bold text-[var(--text-muted)]">Summary</div>
                          <div className="text-[11px] text-[var(--text-main)] leading-relaxed italic line-clamp-4">
                            {document.comicInfo.summary}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {document.metadata.producer && (
                    <div>
                      <div className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Producer</div>
                      <div className="text-[var(--text-main)] truncate">{document.metadata.producer}</div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-[var(--text-muted)]">No document loaded.</p>
              )}
            </div>
          )}

          {/* Recents View */}
          {activeTab === 'recents' && (
            <div className="space-y-3">
              <div className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                Recent Documents
              </div>

              {recents.length > 0 ? (
                <div className="space-y-1.5">
                  {recents.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => onOpenRecent(item)}
                      className="p-2.5 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 cursor-pointer flex items-center justify-between group transition-colors"
                    >
                      <div className="truncate pr-2">
                        <div className="font-semibold text-xs truncate">{item.name}</div>
                        <div className="text-[10px] text-[var(--text-muted)]">
                          Page {item.lastPage} of {item.pageCount} • {formatFileSize(item.size)}
                        </div>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 shrink-0" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-[var(--text-muted)]">
                  <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p>No recent documents.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
};

interface OutlineNodeProps {
  item: DocumentOutlineItem;
  level: number;
  onSelect: (page: number) => void;
  currentPage: number;
}

const OutlineNode: React.FC<OutlineNodeProps> = ({ item, level, onSelect, currentPage }) => {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = item.items && item.items.length > 0;
  const isCurrent = currentPage === item.pageIndex + 1;

  return (
    <div>
      <div
        onClick={() => onSelect(item.pageIndex + 1)}
        className={`flex items-center gap-1.5 py-1.5 px-2 rounded-lg cursor-pointer transition-colors ${
          isCurrent 
            ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 font-bold shadow-xs' 
            : 'hover:bg-black/5 text-[var(--text-main)]'
        }`}
        style={{ paddingLeft: `${level * 14 + 8}px` }}
      >
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            className="p-1 hover:bg-black/10 rounded-md"
          >
            {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
        ) : (
          <div className="w-3.5" />
        )}
        <span className="truncate text-xs flex-1">{item.title}</span>
        <span className="text-[10px] text-[var(--text-muted)] font-mono shrink-0">p.{item.pageIndex + 1}</span>
      </div>

      {hasChildren && expanded && (
        <div className="space-y-0.5">
          {item.items!.map((child, i) => (
            <OutlineNode
              key={`${child.title}-${i}`}
              item={child}
              level={level + 1}
              onSelect={onSelect}
              currentPage={currentPage}
            />
          ))}
        </div>
      )}
    </div>
  );
};
