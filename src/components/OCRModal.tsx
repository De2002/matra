import React, { useState, useRef } from 'react';
import { ScanText, Copy, Check, Download, Sparkles, X, Loader2, RefreshCw, Globe, FileText } from 'lucide-react';
import { runOCR, OCRResult } from '../lib/ocrEngine';

interface OCRModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPageCanvas?: HTMLCanvasElement | null;
  pageNumber: number;
  onAskAI?: (prompt: string) => void;
}

const OCR_LANGUAGES = [
  { code: 'eng', label: 'English' },
  { code: 'spa', label: 'Spanish' },
  { code: 'fra', label: 'French' },
  { code: 'deu', label: 'German' },
  { code: 'ita', label: 'Italian' },
  { code: 'por', label: 'Portuguese' },
  { code: 'jpn', label: 'Japanese' },
  { code: 'chi_sim', label: 'Chinese (Simplified)' },
  { code: 'rus', label: 'Russian' },
  { code: 'hin', label: 'Hindi' },
];

export const OCRModal: React.FC<OCRModalProps> = ({
  isOpen,
  onClose,
  currentPageCanvas,
  pageNumber,
  onAskAI,
}) => {
  const [selectedLang, setSelectedLang] = useState<string>('eng');
  const [loading, setLoading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [statusText, setStatusText] = useState<string>('');
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [customImage, setCustomImage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleStartOCR = async (sourceOverride?: string) => {
    const src = sourceOverride || customImage || currentPageCanvas;
    if (!src) return;

    setLoading(true);
    setProgress(0);
    setStatusText('Initializing OCR Engine...');
    setOcrResult(null);

    try {
      const result = await runOCR(src, selectedLang, (prog, stat) => {
        setProgress(prog);
        setStatusText(stat);
      });
      setOcrResult(result);
    } catch (err: any) {
      console.error('OCR Error:', err);
      setStatusText(`Error recognizing text: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const b64 = reader.result as string;
      setCustomImage(b64);
      handleStartOCR(b64);
    };
    reader.readAsDataURL(file);
  };

  const handleCopy = () => {
    if (!ocrResult) return;
    navigator.clipboard.writeText(ocrResult.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    if (!ocrResult) return;
    const blob = new Blob([ocrResult.text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `OCR-Page-${pageNumber}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[var(--bg-toolbar)] text-[var(--text-main)] border border-[var(--border-toolbar)] shadow-2xl rounded-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border-toolbar)] bg-black/5">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-xl">
              <ScanText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Scruttin Optical Character Recognition (OCR)</h2>
              <p className="text-xs text-[var(--text-muted)]">
                Extract editable text from scanned documents, diagrams, and comic pages
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-black/10 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar & Config */}
        <div className="px-5 py-3 border-b border-[var(--border-toolbar)] flex flex-wrap items-center justify-between gap-3 text-xs bg-black/2">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-[var(--text-muted)]" />
            <span className="font-semibold">Language:</span>
            <select
              value={selectedLang}
              onChange={(e) => setSelectedLang(e.target.value)}
              className="bg-black/5 dark:bg-stone-800 border border-[var(--border-toolbar)] rounded-lg px-2.5 py-1 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              {OCR_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-lg border border-[var(--border-toolbar)] hover:bg-black/5 transition-colors font-medium"
            >
              Upload Image...
            </button>
            <button
              onClick={() => handleStartOCR()}
              disabled={loading}
              className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg font-bold shadow-xs transition-all flex items-center gap-1.5"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              <span>{ocrResult ? 'Re-scan' : `Run OCR (Page ${pageNumber})`}</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
              <div className="text-center space-y-1">
                <p className="font-bold text-sm text-[var(--text-main)]">
                  {statusText || 'Extracting Characters...'}
                </p>
                <div className="w-64 h-2 bg-black/10 rounded-full overflow-hidden mx-auto mt-2">
                  <div
                    className="h-full bg-amber-600 transition-all duration-300 rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-[11px] text-[var(--text-muted)] font-mono">{progress}% Complete</span>
              </div>
            </div>
          ) : ocrResult ? (
            <div className="space-y-3">
              {/* Stat Bar */}
              <div className="flex items-center justify-between px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-800 dark:text-emerald-300 font-medium">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>Text recognized with {ocrResult.confidence}% confidence</span>
                </div>
                <span>{ocrResult.lines.length} lines detected</span>
              </div>

              {/* Editable Recognized Text Area */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-bold uppercase text-[var(--text-muted)]">
                  <span>Recognized Text:</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1 hover:text-[var(--text-main)] transition-colors"
                    >
                      {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                    <span>•</span>
                    <button
                      onClick={handleDownloadTxt}
                      className="flex items-center gap-1 hover:text-[var(--text-main)] transition-colors"
                    >
                      <Download className="w-3 h-3" />
                      <span>Export .TXT</span>
                    </button>
                  </div>
                </div>

                <textarea
                  value={ocrResult.text}
                  onChange={(e) => setOcrResult({ ...ocrResult, text: e.target.value })}
                  rows={10}
                  className="w-full bg-black/5 dark:bg-stone-800/80 border border-[var(--border-toolbar)] rounded-xl p-3 font-mono text-xs leading-relaxed focus:outline-none focus:ring-1 focus:ring-amber-500 text-[var(--text-main)]"
                />
              </div>
            </div>
          ) : (
            <div className="py-12 text-center space-y-3 text-[var(--text-muted)]">
              <ScanText className="w-12 h-12 mx-auto text-amber-600/50" />
              <div className="space-y-1">
                <h3 className="font-bold text-sm text-[var(--text-main)]">
                  Ready to OCR Document Page {pageNumber}
                </h3>
                <p className="max-w-md mx-auto text-[11px]">
                  Click &ldquo;Run OCR&rdquo; to process this page with Tesseract machine learning, or upload an external screenshot to extract characters.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[var(--border-toolbar)] bg-black/5 flex items-center justify-between">
          {ocrResult && onAskAI ? (
            <button
              onClick={() => {
                onAskAI(`Summarize and analyze this OCR extracted text:\n\n${ocrResult.text}`);
                onClose();
              }}
              className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Analyze with AI</span>
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-black/10 hover:bg-black/20 text-xs font-bold rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
