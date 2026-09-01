import * as pdfjsLib from 'pdfjs-dist';
import { DocumentMetadata, DocumentOutlineItem } from '../types';

// Use verified unpkg / cdnjs worker compatible with the pdfjs-dist version or fallback
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

export interface RenderPageResult {
  width: number;
  height: number;
  textContent?: string;
}

export async function loadPDFDocument(data: ArrayBuffer | Uint8Array): Promise<pdfjsLib.PDFDocumentProxy> {
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(data),
    cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
    cMapPacked: true,
  });
  return await loadingTask.promise;
}

export async function extractPDFMetadata(pdfDoc: pdfjsLib.PDFDocumentProxy, fileSize: number): Promise<{ metadata: DocumentMetadata; outline: DocumentOutlineItem[] }> {
  let rawMeta: any = {};
  try {
    const metaData = await pdfDoc.getMetadata();
    rawMeta = metaData?.info || {};
  } catch (e) {
    console.warn('Could not read PDF metadata:', e);
  }

  const metadata: DocumentMetadata = {
    title: rawMeta.Title || 'Untitled Document',
    author: rawMeta.Author || 'Unknown Author',
    subject: rawMeta.Subject || '',
    creator: rawMeta.Creator || '',
    producer: rawMeta.Producer || '',
    creationDate: rawMeta.CreationDate || '',
    modificationDate: rawMeta.ModDate || '',
    pdfVersion: rawMeta.PDFFormatVersion || '1.7',
    pageCount: pdfDoc.numPages,
    fileSize: fileSize,
    encrypted: false
  };

  let outline: DocumentOutlineItem[] = [];
  try {
    const rawOutline = await pdfDoc.getOutline();
    if (rawOutline && rawOutline.length > 0) {
      outline = await parseOutlineTree(pdfDoc, rawOutline);
    }
  } catch (e) {
    console.warn('Could not read PDF outline:', e);
  }

  return { metadata, outline };
}

async function parseOutlineTree(pdfDoc: pdfjsLib.PDFDocumentProxy, items: any[]): Promise<DocumentOutlineItem[]> {
  const result: DocumentOutlineItem[] = [];
  for (const item of items) {
    let pageIndex = 0;
    try {
      if (item.dest) {
        let dest = item.dest;
        if (typeof dest === 'string') {
          dest = await pdfDoc.getDestination(dest);
        }
        if (Array.isArray(dest) && dest[0]) {
          pageIndex = await pdfDoc.getPageIndex(dest[0]);
        }
      }
    } catch (err) {
      console.warn('Error resolving outline dest:', err);
    }

    const node: DocumentOutlineItem = {
      title: item.title || 'Untitled Section',
      pageIndex,
      items: item.items && item.items.length > 0 ? await parseOutlineTree(pdfDoc, item.items) : undefined
    };
    result.push(node);
  }
  return result;
}

export async function renderPDFPageToCanvas(
  pdfDoc: pdfjsLib.PDFDocumentProxy,
  pageNumber: number,
  canvas: HTMLCanvasElement,
  scale: number = 1.0,
  rotation: number = 0
): Promise<RenderPageResult> {
  const page = await pdfDoc.getPage(pageNumber);
  const viewport = page.getViewport({ scale: scale * window.devicePixelRatio, rotation: (page.rotate + rotation) % 360 });

  const context = canvas.getContext('2d');
  if (!context) throw new Error('Cannot get 2D canvas context');

  canvas.width = viewport.width;
  canvas.height = viewport.height;
  canvas.style.width = `${viewport.width / window.devicePixelRatio}px`;
  canvas.style.height = `${viewport.height / window.devicePixelRatio}px`;

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';

  const renderContext = {
    canvasContext: context,
    viewport: viewport,
  };

  await page.render(renderContext).promise;

  let textContentStr = '';
  try {
    const textContent = await page.getTextContent();
    textContentStr = textContent.items.map((item: any) => item.str || '').join(' ');
  } catch (e) {
    // Ignore text extraction error
  }

  return {
    width: viewport.width / window.devicePixelRatio,
    height: viewport.height / window.devicePixelRatio,
    textContent: textContentStr
  };
}

export async function renderPageThumbnail(
  pdfDoc: pdfjsLib.PDFDocumentProxy,
  pageNumber: number,
  thumbWidth: number = 140
): Promise<string> {
  const page = await pdfDoc.getPage(pageNumber);
  const baseViewport = page.getViewport({ scale: 1.0 });
  const scale = thumbWidth / baseViewport.width;
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) return '';

  canvas.width = viewport.width;
  canvas.height = viewport.height;

  await page.render({
    canvasContext: context,
    viewport: viewport
  }).promise;

  return canvas.toDataURL('image/jpeg', 0.8);
}

export async function extractAllTextFromPDF(pdfDoc: pdfjsLib.PDFDocumentProxy): Promise<string[]> {
  const pagesText: string[] = [];
  for (let i = 1; i <= pdfDoc.numPages; i++) {
    try {
      const page = await pdfDoc.getPage(i);
      const textContent = await page.getTextContent();
      const text = textContent.items.map((item: any) => item.str || '').join(' ');
      pagesText.push(text);
    } catch (e) {
      pagesText.push('');
    }
  }
  return pagesText;
}
