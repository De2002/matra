import JSZip from 'jszip';
import { ComicInfo } from '../types';

export interface ComicBookData {
  images: string[];
  comicInfo?: ComicInfo;
  title: string;
}

export async function parseComicBookArchive(data: ArrayBuffer): Promise<ComicBookData> {
  const zip = await JSZip.loadAsync(data);
  const fileNames = Object.keys(zip.files);
  
  // Natural sorting for filenames like page1, page2, page10
  const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
  const sortedImageFiles = fileNames
    .filter((name) => /\.(png|jpe?g|webp|gif|bmp|avif)$/i.test(name) && !name.startsWith('__MACOSX') && !name.includes('/.'))
    .sort(collator.compare);

  const images: string[] = [];
  for (const fileName of sortedImageFiles) {
    const file = zip.file(fileName);
    if (file) {
      const base64 = await file.async('base64');
      const ext = fileName.split('.').pop()?.toLowerCase() || 'jpeg';
      const mime = ext === 'jpg' ? 'jpeg' : ext;
      images.push(`data:image/${mime};base64,${base64}`);
    }
  }

  // Look for ComicInfo.xml
  let comicInfo: ComicInfo | undefined;
  const comicInfoFile = Object.values(zip.files).find((f) => /comicinfo\.xml$/i.test(f.name));
  if (comicInfoFile) {
    try {
      const xmlStr = await comicInfoFile.async('text');
      comicInfo = parseComicInfoXML(xmlStr);
    } catch (e) {
      console.warn('Could not parse ComicInfo.xml:', e);
    }
  }

  const title = comicInfo?.title || comicInfo?.series || 'Comic Book';

  return {
    images,
    comicInfo,
    title,
  };
}

export function parseComicInfoXML(xmlText: string): ComicInfo {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

  const getText = (tag: string): string | undefined => {
    const el = xmlDoc.getElementsByTagName(tag)[0];
    return el?.textContent?.trim() || undefined;
  };

  const getNum = (tag: string): number | undefined => {
    const text = getText(tag);
    if (!text) return undefined;
    const n = parseInt(text, 10);
    return isNaN(n) ? undefined : n;
  };

  const mangaRaw = getText('Manga')?.toLowerCase();
  let manga: ComicInfo['manga'] = undefined;
  if (mangaRaw === 'yes' || mangaRaw === '1') manga = 'Yes';
  else if (mangaRaw === 'yesandrighttoleft' || mangaRaw === 'righttoleft') manga = 'YesAndRightToLeft';
  else if (mangaRaw === 'no' || mangaRaw === '0') manga = 'No';

  return {
    title: getText('Title'),
    series: getText('Series'),
    number: getText('Number'),
    volume: getText('Volume'),
    summary: getText('Summary'),
    writer: getText('Writer'),
    penciller: getText('Penciller'),
    inker: getText('Inker'),
    colorist: getText('Colorist'),
    letterer: getText('Letterer'),
    coverArtist: getText('CoverArtist'),
    publisher: getText('Publisher'),
    genre: getText('Genre'),
    manga,
    pageCount: getNum('PageCount'),
  };
}
