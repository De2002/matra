import React, { useEffect, useRef } from 'react';
import { SearchMatchItem } from '../lib/searchEngine';

interface PDFSearchOverlayProps {
  matches: SearchMatchItem[];
  activeMatchIndexOnPage: number | null;
  onSelectMatch?: (matchIndexOnPage: number) => void;
  zoom: number;
}

export const PDFSearchOverlay: React.FC<PDFSearchOverlayProps> = ({
  matches,
  activeMatchIndexOnPage,
  onSelectMatch,
  zoom,
}) => {
  const activeElementRef = useRef<HTMLDivElement | null>(null);

  // Smoothly scroll active match into view if it changes
  useEffect(() => {
    if (activeElementRef.current && activeMatchIndexOnPage !== null) {
      activeElementRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest',
      });
    }
  }, [activeMatchIndexOnPage]);

  if (!matches || matches.length === 0) return null;

  return (
    <div className="pdf-search-overlay absolute inset-0 pointer-events-none z-25 overflow-hidden">
      {matches.map((match) => {
        const isActive = activeMatchIndexOnPage === match.matchIndexOnPage;
        const { x, y, width, height } = match.rect;

        return (
          <div
            key={match.id}
            ref={isActive ? activeElementRef : null}
            onClick={(e) => {
              e.stopPropagation();
              if (onSelectMatch) {
                onSelectMatch(match.matchIndexOnPage);
              }
            }}
            title={`Match ${match.matchIndexOnPage + 1} of ${matches.length} ("${match.text}")`}
            className={`absolute pointer-events-auto cursor-pointer rounded-xs transition-all duration-150 ${
              isActive
                ? 'bg-amber-500/75 border-2 border-amber-600 ring-2 ring-amber-300/90 shadow-lg z-30 scale-105 animate-pulse'
                : 'bg-yellow-300/45 hover:bg-yellow-400/70 border border-yellow-500/40 z-20 hover:scale-102'
            }`}
            style={{
              left: `${x}px`,
              top: `${y}px`,
              width: `${Math.max(width, 10)}px`,
              height: `${Math.max(height, 14)}px`,
            }}
          >
            {isActive && (
              <span className="absolute -top-5 left-1/2 -translate-x-1/2 bg-stone-900 text-amber-300 text-[9px] font-bold px-1.5 py-0.2 rounded-full shadow-md whitespace-nowrap pointer-events-none border border-amber-500/40">
                {match.matchIndexOnPage + 1}/{matches.length}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};
