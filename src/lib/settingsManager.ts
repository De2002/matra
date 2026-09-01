import { ScruttinSettings } from '../types';

export const DEFAULT_SCRUTTIN_SETTINGS: ScruttinSettings = {
  theme: 'scruttin-classic',
  pageColorFilter: 'none',
  defaultZoom: 1.0,
  defaultViewMode: 'continuous',
  mangaMode: false,
  smoothScroll: true,
  highlightFormFields: true,
  ebookFontSize: 16,
  ebookFontFamily: 'serif',
  ebookLineSpacing: 1.6,
  ocrLanguage: 'eng',
};

export function serializeSettingsToPlainText(settings: ScruttinSettings): string {
  return `# Scruttin-settings.txt
# Official Scruttin Advanced Configuration
# Changes take effect immediately upon saving.

MainWindow [
  # Visual application shell theme: scruttin-classic | dark | sepia | nord | solarized-dark | high-contrast
  Theme = ${settings.theme}

  # Document page color filter (Super-Themes):
  # none | smart-invert | amoled | sepia-paper | dracula | solarized-dark | matrix-green
  PageColorFilter = ${settings.pageColorFilter}

  # Default zoom level (1.0 = 100%, 1.25 = 125%, 0.75 = 75%)
  DefaultZoom = ${settings.defaultZoom}

  # Default view mode: continuous | single | book | presentation
  DefaultViewMode = ${settings.defaultViewMode}

  # Manga Mode (Right-to-Left dual page viewing for comics)
  MangaMode = ${settings.mangaMode}

  # Smooth page transition and scrolling
  SmoothScroll = ${settings.smoothScroll}

  # Highlight interactive AcroForms in blue tint
  HighlightFormFields = ${settings.highlightFormFields}
]

EbookUI [
  # E-Book & EPUB base font size (pt / px)
  FontSize = ${settings.ebookFontSize}

  # Font family: serif | sans | mono | dyslexic
  FontFamily = ${settings.ebookFontFamily}

  # Line height multiplier
  LineSpacing = ${settings.ebookLineSpacing}
]

OCR [
  # Primary language for Optical Character Recognition (eng, spa, fra, deu, jpn, chi_sim)
  DefaultLanguage = ${settings.ocrLanguage}
]
`;
}

export function parsePlainTextToSettings(rawText: string, fallback = DEFAULT_SCRUTTIN_SETTINGS): ScruttinSettings {
  const result: ScruttinSettings = { ...fallback, rawText };
  const lines = rawText.split('\n');

  for (const line of lines) {
    const clean = line.split('#')[0].trim();
    if (!clean || !clean.includes('=')) continue;

    const [keyPart, valPart] = clean.split('=').map((s) => s.trim());
    if (!keyPart || !valPart) continue;

    const key = keyPart.toLowerCase();
    const val = valPart.toLowerCase();

    if (key === 'theme') {
      if (['scruttin-classic', 'sumatra-classic', 'dark', 'sepia', 'nord', 'solarized-dark', 'high-contrast'].includes(val)) {
        result.theme = val === 'sumatra-classic' ? 'scruttin-classic' : (val as any);
      }
    } else if (key === 'pagecolorfilter') {
      if (['none', 'smart-invert', 'amoled', 'sepia-paper', 'dracula', 'solarized-dark', 'matrix-green'].includes(val)) {
        result.pageColorFilter = val as any;
      }
    } else if (key === 'defaultzoom') {
      const num = parseFloat(val);
      if (!isNaN(num) && num > 0.1 && num <= 5.0) result.defaultZoom = num;
    } else if (key === 'defaultviewmode') {
      if (['continuous', 'single', 'book', 'presentation'].includes(val)) {
        result.defaultViewMode = val as any;
      }
    } else if (key === 'mangamode') {
      result.mangaMode = val === 'true' || val === '1';
    } else if (key === 'smoothscroll') {
      result.smoothScroll = val === 'true' || val === '1';
    } else if (key === 'highlightformfields') {
      result.highlightFormFields = val === 'true' || val === '1';
    } else if (key === 'fontsize') {
      const num = parseInt(val, 10);
      if (!isNaN(num) && num >= 10 && num <= 40) result.ebookFontSize = num;
    } else if (key === 'fontfamily') {
      if (['serif', 'sans', 'mono', 'dyslexic'].includes(val)) {
        result.ebookFontFamily = val as any;
      }
    } else if (key === 'linespacing') {
      const num = parseFloat(val);
      if (!isNaN(num) && num >= 1.0 && num <= 3.0) result.ebookLineSpacing = num;
    } else if (key === 'defaultlanguage') {
      result.ocrLanguage = valPart;
    }
  }

  return result;
}

export function loadSavedSettings(): ScruttinSettings {
  try {
    const raw = localStorage.getItem('scruttin_settings_txt') || localStorage.getItem('sumatra_settings_txt');
    if (raw) {
      return parsePlainTextToSettings(raw);
    }
  } catch (e) {
    // fallback
  }
  return DEFAULT_SCRUTTIN_SETTINGS;
}

export function saveSettings(settings: ScruttinSettings): void {
  try {
    const text = serializeSettingsToPlainText(settings);
    localStorage.setItem('scruttin_settings_txt', text);
  } catch (e) {
    // ignore
  }
}
