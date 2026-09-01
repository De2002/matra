import * as pdfjsLib from 'pdfjs-dist';

export interface SearchMatchItem {
  id: string;
  pageIndex: number; // 0-based
  matchIndexOnPage: number; // 0-based
  text: string;
  rect: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface DocumentSearchSummary {
  totalMatches: number;
  pageMatches: { [pageIndex: number]: number };
  pagesWithMatches: number[];
}

/**
 * Searches for all occurrences of a query on a specific PDF page
 * and extracts their viewport-relative pixel bounding boxes.
 */
export async function searchInPdfPage(
  page: pdfjsLib.PDFPageProxy,
  query: string,
  scale: number,
  rotation: number,
  pageIndex: number,
  matchCase: boolean = false
): Promise<SearchMatchItem[]> {
  if (!query || !query.trim()) return [];

  const cleanQuery = matchCase ? query : query.toLowerCase();
  const matches: SearchMatchItem[] = [];

  try {
    const textContent = await page.getTextContent();
    const viewport = page.getViewport({
      scale,
      rotation: (page.rotate + rotation) % 360,
    });

    let matchCountOnPage = 0;

    for (let i = 0; i < textContent.items.length; i++) {
      const item: any = textContent.items[i];
      if (!item || !item.str) continue;

      const itemStr = matchCase ? item.str : item.str.toLowerCase();
      let searchPos = 0;

      while (searchPos < itemStr.length) {
        const foundIdx = itemStr.indexOf(cleanQuery, searchPos);
        if (foundIdx === -1) break;

        // Calculate item bounding box in viewport coordinates
        const fontHeight = Math.abs(item.height || item.transform[0] || item.transform[3] || 12);
        const itemWidth = Math.max(item.width || (item.str.length * 8), 10);

        const pdfRect = [
          item.transform[4],
          item.transform[5],
          item.transform[4] + itemWidth,
          item.transform[5] + fontHeight,
        ];

        const [vx1, vy1, vx2, vy2] = viewport.convertToViewportRectangle(pdfRect);

        const itemX = Math.min(vx1, vx2);
        const itemY = Math.min(vy1, vy2);
        const itemW = Math.abs(vx2 - vx1);
        const itemH = Math.abs(vy2 - vy1);

        // Substring offset calculation
        const strLen = Math.max(item.str.length, 1);
        const charWidth = itemW / strLen;
        const matchX = itemX + foundIdx * charWidth;
        const matchW = Math.max(cleanQuery.length * charWidth, 8);
        const matchY = itemY;
        const matchH = Math.max(itemH, 14);

        matches.push({
          id: `match-p${pageIndex}-${matchCountOnPage}`,
          pageIndex,
          matchIndexOnPage: matchCountOnPage,
          text: item.str.substr(foundIdx, cleanQuery.length),
          rect: {
            x: Math.round(matchX),
            y: Math.round(matchY),
            width: Math.round(matchW),
            height: Math.round(matchH),
          },
        });

        matchCountOnPage++;
        searchPos = foundIdx + cleanQuery.length;
      }
    }
  } catch (err) {
    console.warn(`Error searching in PDF page ${pageIndex + 1}:`, err);
  }

  return matches;
}

/**
 * Searches for all occurrences across all pages of text content
 */
export function searchInTextPages(
  pagesText: string[],
  query: string,
  matchCase: boolean = false
): DocumentSearchSummary {
  if (!query || !query.trim() || !pagesText || pagesText.length === 0) {
    return { totalMatches: 0, pageMatches: {}, pagesWithMatches: [] };
  }

  const cleanQuery = matchCase ? query : query.toLowerCase();
  const pageMatches: { [pageIndex: number]: number } = {};
  const pagesWithMatches: number[] = [];
  let totalMatches = 0;

  pagesText.forEach((text, pageIndex) => {
    if (!text) return;
    const targetText = matchCase ? text : text.toLowerCase();
    let count = 0;
    let pos = 0;

    while (pos < targetText.length) {
      const idx = targetText.indexOf(cleanQuery, pos);
      if (idx === -1) break;
      count++;
      pos = idx + cleanQuery.length;
    }

    if (count > 0) {
      pageMatches[pageIndex] = count;
      pagesWithMatches.push(pageIndex);
      totalMatches += count;
    }
  });

  return {
    totalMatches,
    pageMatches,
    pagesWithMatches,
  };
}
