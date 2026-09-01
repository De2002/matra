import React from 'react';
import { PDFFormField } from '../types';

interface PDFFormOverlayProps {
  fields: PDFFormField[];
  pageIndex: number;
  onFieldChange: (fieldId: string, value: string | boolean) => void;
  highlightFields?: boolean;
}

export const PDFFormOverlay: React.FC<PDFFormOverlayProps> = ({
  fields,
  pageIndex,
  onFieldChange,
  highlightFields = true,
}) => {
  const pageFields = fields.filter((f) => f.pageIndex === pageIndex);

  if (pageFields.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-20">
      {pageFields.map((field) => {
        const { x, y, width, height } = field.rect;
        const style: React.CSSProperties = {
          left: `${x}%`,
          top: `${y}%`,
          width: `${width}%`,
          height: `${height}%`,
        };

        const highlightClass = highlightFields
          ? 'bg-blue-500/15 border border-blue-500/40 hover:bg-blue-500/25 focus:bg-blue-500/30'
          : 'bg-transparent border border-black/20';

        if (field.type === 'text') {
          return field.multiline ? (
            <textarea
              key={field.id}
              style={style}
              value={String(field.value || '')}
              readOnly={field.readOnly}
              onChange={(e) => onFieldChange(field.id, e.target.value)}
              placeholder={field.name}
              className={`absolute pointer-events-auto resize-none p-1 text-[10px] sm:text-xs font-sans rounded-xs focus:outline-none focus:ring-1 focus:ring-blue-600 transition-colors text-black dark:text-white ${highlightClass}`}
            />
          ) : (
            <input
              key={field.id}
              type="text"
              style={style}
              value={String(field.value || '')}
              readOnly={field.readOnly}
              onChange={(e) => onFieldChange(field.id, e.target.value)}
              placeholder={field.name}
              className={`absolute pointer-events-auto p-1 text-[10px] sm:text-xs font-sans rounded-xs focus:outline-none focus:ring-1 focus:ring-blue-600 transition-colors text-black dark:text-white ${highlightClass}`}
            />
          );
        }

        if (field.type === 'checkbox') {
          return (
            <div
              key={field.id}
              style={style}
              className="absolute pointer-events-auto flex items-center justify-center"
            >
              <input
                type="checkbox"
                checked={Boolean(field.value)}
                disabled={field.readOnly}
                onChange={(e) => onFieldChange(field.id, e.target.checked)}
                className="w-full h-full cursor-pointer accent-blue-600 rounded-xs"
              />
            </div>
          );
        }

        if (field.type === 'select') {
          return (
            <select
              key={field.id}
              style={style}
              value={String(field.value || '')}
              disabled={field.readOnly}
              onChange={(e) => onFieldChange(field.id, e.target.value)}
              className={`absolute pointer-events-auto p-0.5 text-[10px] sm:text-xs font-sans rounded-xs focus:outline-none focus:ring-1 focus:ring-blue-600 transition-colors text-black dark:text-white ${highlightClass}`}
            >
              <option value="">Select...</option>
              {field.options?.map((opt, i) => (
                <option key={i} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          );
        }

        return null;
      })}
    </div>
  );
};
