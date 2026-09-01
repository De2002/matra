import React, { useState, useEffect, useRef } from 'react';
import { Search, Compass, CornerDownLeft, X } from 'lucide-react';
import { CommandItem } from '../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  commands: CommandItem[];
  onPageJump: (page: number) => void;
  totalPages: number;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  commands,
  onPageJump,
  totalPages
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Filter commands by query
  const filteredCommands = commands.filter((cmd) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      cmd.title.toLowerCase().includes(q) ||
      cmd.category.toLowerCase().includes(q) ||
      (cmd.shortcut && cmd.shortcut.toLowerCase().includes(q))
    );
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredCommands.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % Math.max(1, filteredCommands.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      // Check if user entered a page number like ":5" or "5"
      const pageMatch = query.match(/^:?(\d+)$/);
      if (pageMatch) {
        const pageNum = parseInt(pageMatch[1], 10);
        if (pageNum >= 1 && pageNum <= totalPages) {
          onPageJump(pageNum);
          onClose();
          return;
        }
      }

      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].action();
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-start justify-center pt-20 p-4">
      <div className="bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 rounded-xl shadow-2xl border border-black/15 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 flex flex-col max-h-[70vh]">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-black/10 bg-[var(--bg-toolbar)]">
          <Search className="w-4 h-4 text-stone-400 mr-2.5 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command, search setting, or enter page number (e.g. 5)..."
            className="w-full bg-transparent text-sm focus:outline-none placeholder:text-stone-400 font-sans"
          />
          <kbd className="hidden sm:inline-block text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-black/10 text-stone-500 border border-black/10">
            ESC
          </kbd>
        </div>

        {/* Command Results List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5 text-xs">
          {filteredCommands.length > 0 ? (
            filteredCommands.map((cmd, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={cmd.id}
                  id={`cmd-item-${cmd.id}`}
                  onClick={() => {
                    cmd.action();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-blue-600 text-white font-medium shadow-xs'
                      : 'hover:bg-black/5 text-stone-800 dark:text-stone-200'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded ${
                      isSelected ? 'bg-blue-700 text-blue-100' : 'bg-black/5 text-stone-500'
                    }`}>
                      {cmd.category}
                    </span>
                    <span className="truncate">{cmd.title}</span>
                  </div>

                  {cmd.shortcut && (
                    <kbd className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                      isSelected ? 'bg-blue-700 border-blue-500 text-white' : 'bg-stone-100 dark:bg-stone-800 border-stone-300 dark:border-stone-700 text-stone-500'
                    }`}>
                      {cmd.shortcut}
                    </kbd>
                  )}
                </div>
              );
            })
          ) : (
            <div className="py-8 text-center text-stone-400">
              <Compass className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p>No matching commands found</p>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 bg-stone-50 dark:bg-stone-950 border-t border-black/10 flex items-center justify-between text-[11px] text-stone-500">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
          </div>
          <span>Scruttin Command Palette</span>
        </div>
      </div>
    </div>
  );
};
