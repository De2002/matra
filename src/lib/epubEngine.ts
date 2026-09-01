import JSZip from 'jszip';
import { EPUBChapter, DocumentMetadata, DocumentOutlineItem } from '../types';

export interface ParsedEPUB {
  title: string;
  author: string;
  chapters: EPUBChapter[];
  outline: DocumentOutlineItem[];
  metadata: DocumentMetadata;
}

export async function parseEPUBFile(data: ArrayBuffer): Promise<ParsedEPUB> {
  const zip = await JSZip.loadAsync(data);

  // 1. Locate container.xml
  const containerFile = zip.file('META-INF/container.xml');
  if (!containerFile) {
    throw new Error('Invalid EPUB: META-INF/container.xml not found');
  }
  const containerXML = await containerFile.async('text');
  const domParser = new DOMParser();
  const containerDoc = domParser.parseFromString(containerXML, 'text/xml');
  const rootfileEl = containerDoc.querySelector('rootfile');
  const opfPath = rootfileEl?.getAttribute('full-path') || 'OEBPS/content.opf';

  // 2. Read OPF package document
  const opfFile = zip.file(opfPath);
  if (!opfFile) {
    throw new Error(`Invalid EPUB: OPF package not found at ${opfPath}`);
  }
  const opfDir = opfPath.includes('/') ? opfPath.substring(0, opfPath.lastIndexOf('/') + 1) : '';
  const opfXML = await opfFile.async('text');
  const opfDoc = domParser.parseFromString(opfXML, 'text/xml');

  // Metadata
  const title = opfDoc.querySelector('metadata > title, metadata > dc\\:title')?.textContent?.trim() || 'EPUB Document';
  const author = opfDoc.querySelector('metadata > creator, metadata > dc\\:creator')?.textContent?.trim() || 'Unknown Author';
  const description = opfDoc.querySelector('metadata > description, metadata > dc\\:description')?.textContent?.trim() || '';
  const language = opfDoc.querySelector('metadata > language, metadata > dc\\:language')?.textContent?.trim() || 'en';

  // Manifest (id -> href)
  const manifestItems: Record<string, string> = {};
  const manifestElements = opfDoc.querySelectorAll('manifest > item');
  manifestElements.forEach((el) => {
    const id = el.getAttribute('id');
    const href = el.getAttribute('href');
    if (id && href) {
      manifestItems[id] = href;
    }
  });

  // Spine (order of reading)
  const spineElements = opfDoc.querySelectorAll('spine > itemref');
  const spineHrefs: { id: string; href: string }[] = [];
  spineElements.forEach((el) => {
    const idref = el.getAttribute('idref');
    if (idref && manifestItems[idref]) {
      spineHrefs.push({ id: idref, href: manifestItems[idref] });
    }
  });

  // Load and sanitize chapters
  const chapters: EPUBChapter[] = [];
  const outline: DocumentOutlineItem[] = [];

  for (let i = 0; i < spineHrefs.length; i++) {
    const item = spineHrefs[i];
    const fullHref = opfDir + item.href;
    const file = zip.file(fullHref);
    if (!file) continue;

    try {
      const rawHtml = await file.async('text');
      const doc = domParser.parseFromString(rawHtml, 'text/html');

      // Extract chapter heading
      const h1 = doc.querySelector('h1, h2, h3, title');
      const chapterTitle = h1?.textContent?.trim() || `Chapter ${i + 1}`;

      // Fix image paths inside HTML to inline base64
      const imgElements = doc.querySelectorAll('img, image');
      for (const img of Array.from(imgElements)) {
        const src = img.getAttribute('src') || img.getAttribute('xlink:href');
        if (src && !src.startsWith('data:') && !src.startsWith('http')) {
          const cleanSrc = src.replace(/^\.\.\//, '').replace(/^\.\//, '');
          const imgPath = opfDir + cleanSrc;
          const imgZipFile = zip.file(imgPath) || Object.values(zip.files).find((f) => f.name.endsWith(cleanSrc));
          if (imgZipFile) {
            const b64 = await imgZipFile.async('base64');
            const ext = cleanSrc.split('.').pop()?.toLowerCase() || 'png';
            img.setAttribute('src', `data:image/${ext === 'jpg' ? 'jpeg' : ext};base64,${b64}`);
          }
        }
      }

      // Extract body content
      const body = doc.body ? doc.body.innerHTML : rawHtml;

      chapters.push({
        id: `chap-${i}`,
        title: chapterTitle,
        href: item.href,
        content: body,
        order: i + 1,
      });

      outline.push({
        title: chapterTitle,
        pageIndex: i,
      });
    } catch (e) {
      console.warn(`Could not parse chapter ${item.href}:`, e);
    }
  }

  const metadata: DocumentMetadata = {
    title,
    author,
    subject: description,
    creator: 'Scruttin EPUB Engine',
    pageCount: Math.max(1, chapters.length),
    fileSize: data.byteLength,
  };

  return {
    title,
    author,
    chapters,
    outline,
    metadata,
  };
}
