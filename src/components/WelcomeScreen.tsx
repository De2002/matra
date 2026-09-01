import React from 'react';
import { 
  FolderOpen, 
  FileText, 
  Sparkles, 
  Wrench, 
  HelpCircle, 
  BookOpen, 
  Clock, 
  Layers, 
  Zap,
  Bot
} from 'lucide-react';
import { RecentDocument } from '../types';

interface WelcomeScreenProps {
  onOpenFile: () => void;
  onOpenSamplePDF: () => void;
  onOpenSampleMarkdown: () => void;
  onOpenSampleText: () => void;
  onOpenPDFTools: () => void;
  onOpenDocs: () => void;
  recents: RecentDocument[];
  onOpenRecent: (doc: RecentDocument) => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onOpenFile,
  onOpenSamplePDF,
  onOpenSampleMarkdown,
  onOpenSampleText,
  onOpenPDFTools,
  onOpenDocs,
  recents,
  onOpenRecent
}) => {
  return (
    <div className="flex-1 h-full overflow-y-auto bg-[var(--bg-viewer)] flex flex-col items-center justify-start sm:justify-center p-4 sm:p-6 select-none transition-colors duration-150">
      <div className="max-w-3xl w-full space-y-6 sm:space-y-8 animate-in fade-in zoom-in-95 duration-200 py-4">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-2.5 sm:p-3 bg-[var(--bg-toolbar)] border border-[var(--border-toolbar)] rounded-2xl shadow-sm mb-1">
            <BookOpen className="w-8 h-8 sm:w-10 sm:h-10 text-amber-700" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-main)] font-sans">
            Scruttin
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] max-w-md mx-auto">
            Fast, lightweight multi-format document reader and PDF suite with AI Chat assistance
          </p>
        </div>

        {/* Primary Drag & Drop Open Action */}
        <div
          id="dropzone-welcome"
          onClick={onOpenFile}
          className="border-2 border-dashed border-black/20 hover:border-amber-500 bg-[var(--bg-sidebar)] hover:bg-[var(--bg-toolbar-hover)]/30 rounded-2xl p-5 sm:p-8 text-center cursor-pointer transition-all duration-150 shadow-sm group"
        >
          <FolderOpen className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2.5 text-amber-600 group-hover:scale-110 transition-transform" />
          <h3 className="text-sm sm:text-base font-bold text-[var(--text-main)] mb-1">
            Open Document or Drop Files Here
          </h3>
          <p className="text-[11px] sm:text-xs text-[var(--text-muted)] mb-3 sm:mb-4">
            Supports PDF, Comic Books (CBZ), Markdown (.md), and TXT
          </p>
          <button className="px-4 sm:px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-sm group-hover:shadow-md transition-all">
            Browse Files (Ctrl + O)
          </button>
        </div>

        {/* Quick Sample Document Starters */}
        <div className="space-y-2.5">
          <div className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider px-1">
            Try Sample Documents
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              id="btn-sample-pdf"
              onClick={onOpenSamplePDF}
              className="p-4 rounded-xl bg-white dark:bg-stone-800 border border-black/10 hover:border-blue-500 hover:shadow-md transition-all text-left group"
            >
              <div className="p-2 bg-blue-50 dark:bg-blue-950 text-blue-600 rounded-lg w-fit mb-2 group-hover:scale-105 transition-transform">
                <FileText className="w-5 h-5" />
              </div>
              <div className="font-bold text-xs text-[var(--text-main)] mb-0.5">
                Scruttin User Guide
              </div>
              <div className="text-[11px] text-[var(--text-muted)]">
                2-page rich PDF guide with AI analysis & shortcuts
              </div>
            </button>

            <button
              id="btn-sample-md"
              onClick={onOpenSampleMarkdown}
              className="p-4 rounded-xl bg-white dark:bg-stone-800 border border-black/10 hover:border-purple-500 hover:shadow-md transition-all text-left group"
            >
              <div className="p-2 bg-purple-50 dark:bg-purple-950 text-purple-600 rounded-lg w-fit mb-2 group-hover:scale-105 transition-transform">
                <Layers className="w-5 h-5" />
              </div>
              <div className="font-bold text-xs text-[var(--text-main)] mb-0.5">
                Markdown Reference
              </div>
              <div className="text-[11px] text-[var(--text-muted)]">
                Formatted markdown with tables and code blocks
              </div>
            </button>

            <button
              id="btn-sample-txt"
              onClick={onOpenSampleText}
              className="p-4 rounded-xl bg-white dark:bg-stone-800 border border-black/10 hover:border-emerald-500 hover:shadow-md transition-all text-left group"
            >
              <div className="p-2 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 rounded-lg w-fit mb-2 group-hover:scale-105 transition-transform">
                <FileText className="w-5 h-5" />
              </div>
              <div className="font-bold text-xs text-[var(--text-main)] mb-0.5">
                Scruttin Changelog
              </div>
              <div className="text-[11px] text-[var(--text-muted)]">
                Release notes and plain text format testing
              </div>
            </button>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div
            onClick={onOpenPDFTools}
            className="p-3 bg-black/5 hover:bg-black/10 rounded-xl cursor-pointer transition-colors text-center"
          >
            <Wrench className="w-5 h-5 mx-auto mb-1 text-amber-600" />
            <div className="font-bold text-xs text-[var(--text-main)]">PDF Tools</div>
            <div className="text-[10px] text-[var(--text-muted)]">Merge, split, rotate</div>
          </div>

          <div
            onClick={onOpenSamplePDF}
            className="p-3 bg-black/5 hover:bg-black/10 rounded-xl cursor-pointer transition-colors text-center"
          >
            <Bot className="w-5 h-5 mx-auto mb-1 text-indigo-600" />
            <div className="font-bold text-xs text-[var(--text-main)]">AI Document Chat</div>
            <div className="text-[10px] text-[var(--text-muted)]">Gemini summarizer</div>
          </div>

          <div
            onClick={onOpenDocs}
            className="p-3 bg-black/5 hover:bg-black/10 rounded-xl cursor-pointer transition-colors text-center"
          >
            <Zap className="w-5 h-5 mx-auto mb-1 text-yellow-600" />
            <div className="font-bold text-xs text-[var(--text-main)]">Command Palette</div>
            <div className="text-[10px] text-[var(--text-muted)]">Ctrl + K / F1</div>
          </div>

          <div
            onClick={onOpenDocs}
            className="p-3 bg-black/5 hover:bg-black/10 rounded-xl cursor-pointer transition-colors text-center"
          >
            <HelpCircle className="w-5 h-5 mx-auto mb-1 text-cyan-600" />
            <div className="font-bold text-xs text-[var(--text-main)]">User Manual</div>
            <div className="text-[10px] text-[var(--text-muted)]">Shortcuts & docs</div>
          </div>
        </div>

        {/* Recent Documents Section */}
        {recents.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-black/10">
            <div className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>Recent Documents</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {recents.slice(0, 4).map((rec) => (
                <div
                  key={rec.id}
                  onClick={() => onOpenRecent(rec)}
                  className="p-2.5 rounded-lg bg-white dark:bg-stone-800 border border-black/10 hover:border-blue-400 hover:shadow-xs cursor-pointer flex items-center justify-between transition-all"
                >
                  <div className="truncate pr-2">
                    <div className="font-bold text-xs text-[var(--text-main)] truncate">
                      {rec.name}
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)]">
                      Page {rec.lastPage} of {rec.pageCount}
                    </div>
                  </div>
                  <span className="text-[10px] bg-black/5 px-2 py-0.5 rounded font-mono uppercase text-stone-500">
                    {rec.type}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
