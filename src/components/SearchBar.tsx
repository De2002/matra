import React, { useRef, useEffect } from 'react';
import { 
  Search, 
  ChevronUp, 
  ChevronDown, 
  X, 
  CaseSensitive,
  FileText
} from 'lucide-react';

interface SearchBarProps {
  isOpen: boolean;
  onClose: () => void;
  query: string;
  onQueryChange: (query: string) => void;
  currentPage: number;
  totalPages: number;
  matchesOnCurrentPage: number;
  currentMatchIndexOnPage: number;
  totalMatchesInDocument?: number;
  onNextMatch: () => void;
  onPrevMatch: () => void;
  matchCase: boolean;
  onToggleMatchCase: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  isOpen,
  onClose,
  query,
  onQueryChange,
  currentPage,
  totalPages,
  matchesOnCurrentPage,
  currentMatchIndexOnPage,
  totalMatchesInDocument = 0,
  onNextMatch,
  onPrevMatch,
  matchCase,
  onToggleMatchCase,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  }, [isOpen]);

  // Keyboard shortcut listener for Enter / Shift+Enter / Esc
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        onPrevMatch();
      } else {
        onNextMatch();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  const hasQuery = query.trim().length > 0;

  return (
    <div
      id="scruttin-find-bar"
      className="fixed top-14 sm:top-16 right-3 sm:right-6 z-50 bg-stone-900/95 text-white px-3 py-2 rounded-2xl shadow-2xl border border-stone-700/90 flex items-center gap-1.5 sm:gap-2 text-xs backdrop-blur-md animate-in slide-in-from-top-3 duration-200 select-none max-w-[calc(100vw-24px)]"
      role="search"
    >
      {/* Search Input Box */}
      <div className="relative flex items-center">
        <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 pointer-events-none" />
        <input
          ref={inputRef}
          id="input-find-query"
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Find in page & document..."
          className="bg-stone-800/90 text-white rounded-xl pl-8 pr-7 py-1.5 text-xs border border-stone-700 focus:outline-none focus:ring-1.5 focus:ring-amber-500 w-36 sm:w-56 font-sans placeholder:text-stone-500"
        />
        {hasQuery && (
          <button
            onClick={() => {
              onQueryChange('');
              inputRef.current?.focus();
            }}
            className="absolute right-2 p-0.5 text-stone-400 hover:text-white rounded-full hover:bg-stone-700 transition-colors"
            title="Clear search"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Match Counter Badge */}
      {hasQuery && (
        <div className="flex items-center gap-1 px-2 py-1 bg-stone-800 rounded-lg text-[11px] font-mono shrink-0 border border-stone-700/60">
          {matchesOnCurrentPage > 0 ? (
            <span className="text-amber-300 font-semibold">
              {currentMatchIndexOnPage + 1} of {matchesOnCurrentPage}
            </span>
          ) : totalMatchesInDocument > 0 ? (
            <span className="text-stone-400 text-[10px]">
              {totalMatchesInDocument} in doc
            </span>
          ) : (
            <span className="text-rose-400 text-[10px]">0 matches</span>
          )}
        </div>
      )}

      {/* Match Navigation Buttons */}
      <div className="flex items-center gap-0.5 shrink-0">
        <button
          id="btn-find-prev"
          onClick={onPrevMatch}
          disabled={!hasQuery || (matchesOnCurrentPage === 0 && totalMatchesInDocument === 0)}
          className="p-1.5 hover:bg-stone-800 active:bg-stone-700 disabled:opacity-30 disabled:pointer-events-none rounded-lg text-stone-300 hover:text-white transition-colors"
          title="Previous Match (Shift+Enter)"
          aria-label="Previous Match"
        >
          <ChevronUp className="w-4 h-4" />
        </button>

        <button
          id="btn-find-next"
          onClick={onNextMatch}
          disabled={!hasQuery || (matchesOnCurrentPage === 0 && totalMatchesInDocument === 0)}
          className="p-1.5 hover:bg-stone-800 active:bg-stone-700 disabled:opacity-30 disabled:pointer-events-none rounded-lg text-stone-300 hover:text-white transition-colors"
          title="Next Match (Enter)"
          aria-label="Next Match"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      {/* Case Sensitive Toggle */}
      <button
        id="btn-find-match-case"
        onClick={onToggleMatchCase}
        className={`p-1.5 rounded-lg transition-colors shrink-0 ${
          matchCase
            ? 'bg-amber-600 text-white font-bold shadow-xs'
            : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
        }`}
        title="Match Case (Case Sensitive)"
      >
        <CaseSensitive className="w-4 h-4" />
      </button>

      <div className="w-px h-4 bg-stone-700 mx-0.5 hidden sm:block" />

      {/* Close Find Bar */}
      <button
        id="btn-close-find"
        onClick={onClose}
        className="p-1.5 hover:bg-stone-800 rounded-lg text-stone-400 hover:text-white transition-colors shrink-0"
        title="Close Find (Escape)"
        aria-label="Close Find"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
