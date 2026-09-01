import React, { useState } from 'react';
import { 
  Wrench, 
  Files, 
  Scissors, 
  RotateCw, 
  Minimize, 
  FileUp, 
  FileText, 
  ShieldCheck, 
  Image as ImageIcon, 
  X, 
  Download, 
  Check, 
  Plus, 
  Trash2,
  Stamp
} from 'lucide-react';
import { LoadedDocument } from '../types';
import { 
  mergePDFs, 
  extractPagesPDF, 
  rotatePDFPages, 
  compressAndCleanPDF, 
  convertImagesToPDF, 
  convertTextToPDF,
  addWatermarkToPDF
} from '../lib/pdfToolsEngine';

interface PDFToolsModalProps {
  activeDocument: LoadedDocument | null;
  onClose: () => void;
  onOpenGeneratedPDF: (name: string, data: Uint8Array) => void;
}

type ToolTab = 'merge' | 'split' | 'rotate' | 'compress' | 'convert' | 'watermark' | 'extract';

export const PDFToolsModal: React.FC<PDFToolsModalProps> = ({
  activeDocument,
  onClose,
  onOpenGeneratedPDF
}) => {
  const [activeTab, setActiveTab] = useState<ToolTab>('merge');
  const [processing, setProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Merge State
  const [mergeFiles, setMergeFiles] = useState<{ name: string; data: ArrayBuffer }[]>(
    activeDocument && activeDocument.type === 'pdf'
      ? [{ name: activeDocument.name, data: activeDocument.data as ArrayBuffer }]
      : []
  );

  // Split / Extract State
  const [pageRanges, setPageRanges] = useState<string>('1');

  // Rotate State
  const [rotateDegrees, setRotateDegrees] = useState<number>(90);

  // Watermark State
  const [watermarkText, setWatermarkText] = useState<string>('CONFIDENTIAL');

  // Convert State
  const [convertType, setConvertType] = useState<'text' | 'image'>('text');
  const [convertTitle, setConvertTitle] = useState<string>('Converted Document');
  const [convertTextContent, setConvertTextContent] = useState<string>(
    '# Document Notes\n\nThis document was generated using Scruttin Web Tools.'
  );
  const [convertImages, setConvertImages] = useState<{ name: string; data: ArrayBuffer; mimeType: string }[]>([]);

  // Helper download function
  const triggerDownload = (data: Uint8Array, fileName: string) => {
    const blob = new Blob([data], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 1. Handle Merge
  const handleMergeSubmit = async () => {
    if (mergeFiles.length < 2) {
      alert('Please add at least 2 PDF files to merge.');
      return;
    }
    setProcessing(true);
    setStatusMessage('Merging PDF files...');
    try {
      const mergedBytes = await mergePDFs(mergeFiles);
      const fileName = `merged-${Date.now()}.pdf`;
      onOpenGeneratedPDF(fileName, mergedBytes);
      triggerDownload(mergedBytes, fileName);
      setStatusMessage('PDFs merged successfully!');
    } catch (err: any) {
      alert(`Merge error: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleAddMergeFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((f) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (reader.result) {
            setMergeFiles((prev) => [...prev, { name: f.name, data: reader.result as ArrayBuffer }]);
          }
        };
        reader.readAsArrayBuffer(f);
      });
    }
  };

  // 2. Handle Split / Extract
  const handleSplitSubmit = async () => {
    if (!activeDocument || activeDocument.type !== 'pdf') {
      alert('Open a PDF document first to extract pages.');
      return;
    }
    setProcessing(true);
    setStatusMessage('Extracting pages...');
    try {
      // Parse ranges like "1, 3-5, 8"
      const indices: number[] = [];
      const parts = pageRanges.split(',').map((p) => p.trim());
      for (const part of parts) {
        if (part.includes('-')) {
          const [start, end] = part.split('-').map((n) => parseInt(n.trim(), 10));
          if (!isNaN(start) && !isNaN(end)) {
            for (let i = start; i <= end; i++) {
              indices.push(i - 1);
            }
          }
        } else {
          const p = parseInt(part, 10);
          if (!isNaN(p)) indices.push(p - 1);
        }
      }

      const extractedBytes = await extractPagesPDF(activeDocument.data as ArrayBuffer, indices);
      const fileName = `${activeDocument.name.replace('.pdf', '')}-extracted.pdf`;
      onOpenGeneratedPDF(fileName, extractedBytes);
      triggerDownload(extractedBytes, fileName);
      setStatusMessage('Pages extracted successfully!');
    } catch (err: any) {
      alert(`Split error: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  // 3. Handle Rotate
  const handleRotateSubmit = async () => {
    if (!activeDocument || activeDocument.type !== 'pdf') {
      alert('Open a PDF document first to rotate.');
      return;
    }
    setProcessing(true);
    setStatusMessage('Rotating pages...');
    try {
      const pageRotations: Record<number, number> = {};
      for (let i = 0; i < activeDocument.pageCount; i++) {
        pageRotations[i] = rotateDegrees;
      }
      const rotatedBytes = await rotatePDFPages(activeDocument.data as ArrayBuffer, pageRotations);
      const fileName = `${activeDocument.name.replace('.pdf', '')}-rotated.pdf`;
      onOpenGeneratedPDF(fileName, rotatedBytes);
      triggerDownload(rotatedBytes, fileName);
      setStatusMessage('Pages rotated and saved!');
    } catch (err: any) {
      alert(`Rotate error: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  // 4. Handle Compress
  const handleCompressSubmit = async () => {
    if (!activeDocument || activeDocument.type !== 'pdf') {
      alert('Open a PDF document first to compress.');
      return;
    }
    setProcessing(true);
    setStatusMessage('Optimizing & compressing PDF...');
    try {
      const compressedBytes = await compressAndCleanPDF(activeDocument.data as ArrayBuffer);
      const fileName = `${activeDocument.name.replace('.pdf', '')}-optimized.pdf`;
      onOpenGeneratedPDF(fileName, compressedBytes);
      triggerDownload(compressedBytes, fileName);
      setStatusMessage('Document optimized successfully!');
    } catch (err: any) {
      alert(`Compress error: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  // 5. Handle Watermark
  const handleWatermarkSubmit = async () => {
    if (!activeDocument || activeDocument.type !== 'pdf') {
      alert('Open a PDF document first to add a watermark.');
      return;
    }
    setProcessing(true);
    setStatusMessage('Applying watermark...');
    try {
      const watermarkedBytes = await addWatermarkToPDF(
        activeDocument.data as ArrayBuffer,
        watermarkText
      );
      const fileName = `${activeDocument.name.replace('.pdf', '')}-watermarked.pdf`;
      onOpenGeneratedPDF(fileName, watermarkedBytes);
      triggerDownload(watermarkedBytes, fileName);
      setStatusMessage('Watermark applied successfully!');
    } catch (err: any) {
      alert(`Watermark error: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  // 6. Handle Convert to PDF
  const handleConvertSubmit = async () => {
    setProcessing(true);
    setStatusMessage('Generating PDF...');
    try {
      let pdfBytes: Uint8Array;
      let fileName = 'converted-document.pdf';

      if (convertType === 'text') {
        pdfBytes = await convertTextToPDF(convertTitle, convertTextContent);
        fileName = `${convertTitle.toLowerCase().replace(/\s+/g, '-')}.pdf`;
      } else {
        if (convertImages.length === 0) {
          alert('Please add at least one image to convert.');
          setProcessing(false);
          return;
        }
        pdfBytes = await convertImagesToPDF(convertImages);
        fileName = 'images-collection.pdf';
      }

      onOpenGeneratedPDF(fileName, pdfBytes);
      triggerDownload(pdfBytes, fileName);
      setStatusMessage('PDF generated and opened successfully!');
    } catch (err: any) {
      alert(`Convert error: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleAddConvertImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((f) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (reader.result) {
            setConvertImages((prev) => [
              ...prev,
              { name: f.name, data: reader.result as ArrayBuffer, mimeType: f.type }
            ]);
          }
        };
        reader.readAsArrayBuffer(f);
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 rounded-2xl shadow-2xl border border-black/10 w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[85vh] animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-black/10 bg-[var(--bg-toolbar)]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/20 text-amber-700 dark:text-amber-300 rounded-xl">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base">SumatraPDF Tools Suite</h3>
              <p className="text-[11px] sm:text-xs text-[var(--text-muted)]">
                Manipulate, convert, compress, and organize PDF documents
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-black/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Tabs & Content */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          {/* Side / Top Tabs */}
          <div className="w-full md:w-48 bg-stone-50 dark:bg-stone-950 border-b md:border-b-0 md:border-r border-black/10 p-2 flex md:flex-col gap-1 overflow-x-auto no-scrollbar shrink-0 text-xs">
            <button
              onClick={() => setActiveTab('merge')}
              className={`whitespace-nowrap px-3 py-2 rounded-xl flex items-center gap-2 font-medium transition-colors shrink-0 ${
                activeTab === 'merge'
                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 font-semibold shadow-xs'
                  : 'hover:bg-black/5 text-stone-600 dark:text-stone-400'
              }`}
            >
              <Files className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Merge PDFs</span>
            </button>

            <button
              onClick={() => setActiveTab('split')}
              className={`whitespace-nowrap px-3 py-2 rounded-xl flex items-center gap-2 font-medium transition-colors shrink-0 ${
                activeTab === 'split'
                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 font-semibold shadow-xs'
                  : 'hover:bg-black/5 text-stone-600 dark:text-stone-400'
              }`}
            >
              <Scissors className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Split / Extract</span>
            </button>

            <button
              onClick={() => setActiveTab('rotate')}
              className={`whitespace-nowrap px-3 py-2 rounded-xl flex items-center gap-2 font-medium transition-colors shrink-0 ${
                activeTab === 'rotate'
                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 font-semibold shadow-xs'
                  : 'hover:bg-black/5 text-stone-600 dark:text-stone-400'
              }`}
            >
              <RotateCw className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Rotate Pages</span>
            </button>

            <button
              onClick={() => setActiveTab('compress')}
              className={`whitespace-nowrap px-3 py-2 rounded-xl flex items-center gap-2 font-medium transition-colors shrink-0 ${
                activeTab === 'compress'
                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 font-semibold shadow-xs'
                  : 'hover:bg-black/5 text-stone-600 dark:text-stone-400'
              }`}
            >
              <Minimize className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Optimize / Clean</span>
            </button>

            <button
              onClick={() => setActiveTab('convert')}
              className={`whitespace-nowrap px-3 py-2 rounded-xl flex items-center gap-2 font-medium transition-colors shrink-0 ${
                activeTab === 'convert'
                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 font-semibold shadow-xs'
                  : 'hover:bg-black/5 text-stone-600 dark:text-stone-400'
              }`}
            >
              <FileUp className="w-4 h-4 text-purple-600 shrink-0" />
              <span>Convert to PDF</span>
            </button>

            <button
              onClick={() => setActiveTab('watermark')}
              className={`whitespace-nowrap px-3 py-2 rounded-xl flex items-center gap-2 font-medium transition-colors shrink-0 ${
                activeTab === 'watermark'
                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 font-semibold shadow-xs'
                  : 'hover:bg-black/5 text-stone-600 dark:text-stone-400'
              }`}
            >
              <Stamp className="w-4 h-4 text-orange-600 shrink-0" />
              <span>Watermark</span>
            </button>
          </div>

          {/* Tab Content Panel */}
          <div className="flex-1 p-3.5 sm:p-6 overflow-y-auto space-y-4 text-xs">
            {/* MERGE TAB */}
            {activeTab === 'merge' && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-bold mb-1">Merge Multiple PDF Files</h4>
                  <p className="text-stone-500">
                    Select and arrange multiple PDF documents to concatenate them into a single PDF file.
                  </p>
                </div>

                <div className="border border-dashed border-black/20 rounded-xl p-4 text-center bg-stone-50 dark:bg-stone-950/50">
                  <input
                    type="file"
                    accept="application/pdf"
                    multiple
                    onChange={handleAddMergeFile}
                    id="input-merge-files"
                    className="hidden"
                  />
                  <label
                    htmlFor="input-merge-files"
                    className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add PDF Files</span>
                  </label>
                  <p className="text-[11px] text-stone-400 mt-2">
                    {mergeFiles.length} file(s) selected
                  </p>
                </div>

                {mergeFiles.length > 0 && (
                  <div className="space-y-1.5">
                    {mergeFiles.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-stone-100 dark:bg-stone-800 border border-black/5"
                      >
                        <span className="font-mono text-xs truncate max-w-sm">
                          {idx + 1}. {file.name}
                        </span>
                        <button
                          onClick={() => setMergeFiles(mergeFiles.filter((_, i) => i !== idx))}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={handleMergeSubmit}
                  disabled={processing || mergeFiles.length < 2}
                  className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white font-bold rounded-lg shadow-sm flex items-center justify-center gap-2"
                >
                  <Files className="w-4 h-4" />
                  <span>{processing ? 'Merging...' : 'Merge and Download PDF'}</span>
                </button>
              </div>
            )}

            {/* SPLIT TAB */}
            {activeTab === 'split' && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-bold mb-1">Split & Extract Pages</h4>
                  <p className="text-stone-500">
                    Extract specific pages or page intervals from {activeDocument?.name || 'the active document'}.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="font-semibold block text-stone-700 dark:text-stone-300">
                    Page Numbers or Ranges (e.g. "1-2, 4, 6-8"):
                  </label>
                  <input
                    type="text"
                    value={pageRanges}
                    onChange={(e) => setPageRanges(e.target.value)}
                    placeholder="1-3, 5"
                    className="w-full p-2.5 bg-white dark:bg-stone-800 rounded-lg border border-black/20 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <p className="text-[11px] text-stone-400">
                    Total pages in document: {activeDocument?.pageCount || 0}
                  </p>
                </div>

                <button
                  onClick={handleSplitSubmit}
                  disabled={processing || !activeDocument}
                  className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white font-bold rounded-lg shadow-sm flex items-center justify-center gap-2"
                >
                  <Scissors className="w-4 h-4" />
                  <span>{processing ? 'Extracting...' : 'Extract Pages to New PDF'}</span>
                </button>
              </div>
            )}

            {/* ROTATE TAB */}
            {activeTab === 'rotate' && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-bold mb-1">Rotate Pages</h4>
                  <p className="text-stone-500">
                    Permanently rotate pages in {activeDocument?.name || 'the active document'}.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[90, 180, 270].map((deg) => (
                    <button
                      key={deg}
                      onClick={() => setRotateDegrees(deg)}
                      className={`p-4 rounded-xl border text-center font-bold text-sm transition-all ${
                        rotateDegrees === deg
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 ring-2 ring-blue-400'
                          : 'border-black/10 hover:bg-black/5'
                      }`}
                    >
                      <RotateCw className="w-6 h-6 mx-auto mb-2 opacity-80" />
                      <span>{deg}° Clockwise</span>
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleRotateSubmit}
                  disabled={processing || !activeDocument}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold rounded-lg shadow-sm flex items-center justify-center gap-2"
                >
                  <RotateCw className="w-4 h-4" />
                  <span>{processing ? 'Rotating...' : 'Apply Rotation & Download'}</span>
                </button>
              </div>
            )}

            {/* COMPRESS TAB */}
            {activeTab === 'compress' && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-bold mb-1">Optimize & Clean PDF</h4>
                  <p className="text-stone-500">
                    Re-encode internal streams, discard unreferenced objects, and sanitize metadata to optimize PDF file size.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-2">
                  <div className="font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Optimization Profile</span>
                  </div>
                  <ul className="list-disc list-inside text-emerald-700 dark:text-emerald-400 space-y-1 text-[11px]">
                    <li>Rebuild cross-reference object stream tables</li>
                    <li>Remove unused font streams and tracking tags</li>
                    <li>Clean document author / producer identifiers</li>
                  </ul>
                </div>

                <button
                  onClick={handleCompressSubmit}
                  disabled={processing || !activeDocument}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold rounded-lg shadow-sm flex items-center justify-center gap-2"
                >
                  <Minimize className="w-4 h-4" />
                  <span>{processing ? 'Optimizing...' : 'Optimize & Clean PDF'}</span>
                </button>
              </div>
            )}

            {/* CONVERT TAB */}
            {activeTab === 'convert' && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-bold mb-1">Convert Text or Images to PDF</h4>
                  <p className="text-stone-500">
                    Generate a high-resolution PDF document from notes, text, or multiple image files.
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setConvertType('text')}
                    className={`flex-1 py-1.5 rounded-lg border font-semibold text-xs ${
                      convertType === 'text'
                        ? 'bg-purple-100 dark:bg-purple-950/60 border-purple-400 text-purple-800 dark:text-purple-200'
                        : 'border-black/10 hover:bg-black/5'
                    }`}
                  >
                    Text / Markdown
                  </button>
                  <button
                    onClick={() => setConvertType('image')}
                    className={`flex-1 py-1.5 rounded-lg border font-semibold text-xs ${
                      convertType === 'image'
                        ? 'bg-purple-100 dark:bg-purple-950/60 border-purple-400 text-purple-800 dark:text-purple-200'
                        : 'border-black/10 hover:bg-black/5'
                    }`}
                  >
                    Image Collection
                  </button>
                </div>

                {convertType === 'text' ? (
                  <div className="space-y-3">
                    <div>
                      <label className="font-semibold block mb-1">Document Title:</label>
                      <input
                        type="text"
                        value={convertTitle}
                        onChange={(e) => setConvertTitle(e.target.value)}
                        className="w-full p-2 bg-white dark:bg-stone-800 rounded-lg border border-black/20 text-xs"
                      />
                    </div>
                    <div>
                      <label className="font-semibold block mb-1">Body Text Content:</label>
                      <textarea
                        rows={6}
                        value={convertTextContent}
                        onChange={(e) => setConvertTextContent(e.target.value)}
                        className="w-full p-2.5 bg-white dark:bg-stone-800 rounded-lg border border-black/20 text-xs font-mono"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="border border-dashed border-black/20 rounded-xl p-4 text-center bg-stone-50 dark:bg-stone-950/50">
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/webp"
                        multiple
                        onChange={handleAddConvertImages}
                        id="input-convert-images"
                        className="hidden"
                      />
                      <label
                        htmlFor="input-convert-images"
                        className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold shadow-xs"
                      >
                        <ImageIcon className="w-4 h-4" />
                        <span>Select Images</span>
                      </label>
                      <p className="text-[11px] text-stone-400 mt-2">
                        {convertImages.length} image(s) loaded
                      </p>
                    </div>

                    {convertImages.length > 0 && (
                      <div className="flex gap-2 overflow-x-auto py-2">
                        {convertImages.map((img, i) => (
                          <div key={i} className="w-16 h-16 bg-stone-200 rounded border border-black/10 flex items-center justify-center text-[10px] text-stone-500 font-mono truncate p-1">
                            {img.name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={handleConvertSubmit}
                  disabled={processing}
                  className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white font-bold rounded-lg shadow-sm flex items-center justify-center gap-2"
                >
                  <FileUp className="w-4 h-4" />
                  <span>{processing ? 'Converting...' : 'Convert to PDF'}</span>
                </button>
              </div>
            )}

            {/* WATERMARK TAB */}
            {activeTab === 'watermark' && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-bold mb-1">Add Stamp or Watermark</h4>
                  <p className="text-stone-500">
                    Apply diagonal security watermarks across every page of {activeDocument?.name || 'the active document'}.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="font-semibold block text-stone-700 dark:text-stone-300">
                    Watermark Text:
                  </label>
                  <input
                    type="text"
                    value={watermarkText}
                    onChange={(e) => setWatermarkText(e.target.value)}
                    placeholder="CONFIDENTIAL / DRAFT / DO NOT COPY"
                    className="w-full p-2.5 bg-white dark:bg-stone-800 rounded-lg border border-black/20 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-red-500 uppercase"
                  />
                </div>

                <button
                  onClick={handleWatermarkSubmit}
                  disabled={processing || !activeDocument}
                  className="w-full py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white font-bold rounded-lg shadow-sm flex items-center justify-center gap-2"
                >
                  <Stamp className="w-4 h-4" />
                  <span>{processing ? 'Applying...' : 'Apply Watermark & Download'}</span>
                </button>
              </div>
            )}

            {/* Status Feedback */}
            {statusMessage && (
              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200 text-xs font-medium flex items-center gap-2">
                <Check className="w-4 h-4 text-blue-600 shrink-0" />
                <span>{statusMessage}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
