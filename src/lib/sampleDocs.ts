import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export async function generateScruttinGuidePDF(): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const titleFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

  // Page 1: Welcome & Overview
  const page1 = pdfDoc.addPage([595.28, 841.89]); // A4
  const { width, height } = page1.getSize();

  // Top header bar
  page1.drawRectangle({
    x: 0,
    y: height - 100,
    width: width,
    height: 100,
    color: rgb(0.98, 0.96, 0.82), // Scruttin yellow
  });

  page1.drawText('Scruttin User Guide & Reference', {
    x: 40,
    y: height - 60,
    size: 22,
    font: titleFont,
    color: rgb(0.15, 0.15, 0.15),
  });

  page1.drawText('Fast, Lightweight, Multi-Format Document Reader for Web', {
    x: 40,
    y: height - 85,
    size: 11,
    font: boldFont,
    color: rgb(0.35, 0.35, 0.35),
  });

  // Section 1: Introduction
  let y = height - 140;
  page1.drawText('1. Welcome to Scruttin Web', {
    x: 40,
    y,
    size: 14,
    font: boldFont,
    color: rgb(0.1, 0.35, 0.6),
  });
  y -= 22;

  const introText = [
    'Scruttin is a versatile document viewer designed for lightning speed, simplicity, and ease of use.',
    'Scruttin supports a wide array of document formats including',
    'PDF, Comic Books (CBZ/CBR), eBooks (EPUB, MOBI), DjVu, XPS, Markdown (.md), and plain text documents.',
    '',
    'This web edition brings legendary speed and an uncluttered interface directly to your modern browser,',
    'paired with a full suite of PDF editing tools and intelligent AI document assistance.'
  ];

  for (const line of introText) {
    if (line) {
      page1.drawText(line, { x: 40, y, size: 10, font, color: rgb(0.2, 0.2, 0.2) });
    }
    y -= 16;
  }

  y -= 10;
  // Section 2: Key Features
  page1.drawText('2. Key Features & Capabilities', {
    x: 40,
    y,
    size: 14,
    font: boldFont,
    color: rgb(0.1, 0.35, 0.6),
  });
  y -= 22;

  const features = [
    '• Multi-Format Support: PDF documents, Comic Books (CBZ), Markdown files, and TXT files.',
    '• Scruttin PDF Tools Suite: Merge PDFs, extract/split pages, rotate pages, compress, and convert formats.',
    '• AI Chat with Document: Chat directly with any open document using Gemini AI to summarize or query content.',
    '• Command Palette (Ctrl + K / F1): Instant fuzzy-search for every Scruttin command, page jump, and tool.',
    '• Document Annotations: Add highlights, sticky notes, and drawings directly onto document pages.',
    '• Read Aloud (TTS): Built-in text-to-speech audio reader with adjustable speed and sentence tracking.',
    '• Multiple Themes: Scruttin Classic, Dark Mode, Warm Sepia, Nord, Solarized Dark, and High Contrast.'
  ];

  for (const feat of features) {
    page1.drawText(feat, { x: 45, y, size: 9.5, font, color: rgb(0.2, 0.2, 0.2) });
    y -= 18;
  }

  y -= 10;
  // Section 3: Keyboard Shortcuts
  page1.drawText('3. Essential Keyboard Shortcuts', {
    x: 40,
    y,
    size: 14,
    font: boldFont,
    color: rgb(0.1, 0.35, 0.6),
  });
  y -= 22;

  const shortcuts = [
    ['Ctrl + O', 'Open a local file or drop onto window'],
    ['Ctrl + S', 'Save / Download current document'],
    ['Ctrl + P', 'Print document'],
    ['Ctrl + K / F1', 'Open Scruttin Command Palette'],
    ['Ctrl + F', 'Find / Search text within document'],
    ['+ / -', 'Zoom in / Zoom out'],
    ['Ctrl + 0', 'Fit page to window'],
    ['Ctrl + 1', 'Actual size (100% zoom)'],
    ['Ctrl + Shift + T', 'Open PDF Tools Suite modal'],
    ['Ctrl + Shift + A', 'Toggle AI Chat sidebar']
  ];

  for (const [key, desc] of shortcuts) {
    page1.drawRectangle({
      x: 45,
      y: y - 2,
      width: 100,
      height: 14,
      color: rgb(0.92, 0.92, 0.92),
    });
    page1.drawText(key, { x: 50, y, size: 8.5, font: boldFont, color: rgb(0.15, 0.15, 0.15) });
    page1.drawText(desc, { x: 155, y, size: 9, font, color: rgb(0.25, 0.25, 0.25) });
    y -= 17;
  }

  // Footer page 1
  page1.drawText('Page 1 of 2  •  Scruttin Web Documentation', {
    x: 40,
    y: 30,
    size: 8,
    font,
    color: rgb(0.5, 0.5, 0.5),
  });

  // Page 2: PDF Tools & AI Document Intelligence
  const page2 = pdfDoc.addPage([595.28, 841.89]);
  
  // Header bar page 2
  page2.drawRectangle({
    x: 0,
    y: height - 60,
    width: width,
    height: 60,
    color: rgb(0.98, 0.96, 0.82),
  });

  page2.drawText('Scruttin Tools & AI Document Analysis', {
    x: 40,
    y: height - 40,
    size: 16,
    font: boldFont,
    color: rgb(0.15, 0.15, 0.15),
  });

  let y2 = height - 90;

  page2.drawText('4. Built-in PDF Manipulation Tools', {
    x: 40,
    y: y2,
    size: 13,
    font: boldFont,
    color: rgb(0.1, 0.35, 0.6),
  });
  y2 -= 20;

  const toolsDesc = [
    '• Merge PDFs: Combine multiple PDF files into one structured document with customized page sequences.',
    '• Split / Extract Pages: Extract specific page intervals (e.g. "1-3, 5, 8") into a standalone new PDF.',
    '• Rotate Pages: Fix rotated scans by rotating specific pages or all pages by 90, 180, or 270 degrees.',
    '• Compress & Optimize: Clean out dead streams and optimize internal PDF objects to reduce file footprint.',
    '• Document Converter: Transform images (PNG/JPG), plain text notes, and Markdown files into PDF format.',
    '• Extract Text & Media: Batch export all extracted text lines or embedded images directly.',
    '• Watermarking & Security: Stamp documents with custom diagonal watermarks and annotations.'
  ];

  for (const t of toolsDesc) {
    page2.drawText(t, { x: 45, y: y2, size: 9, font, color: rgb(0.2, 0.2, 0.2) });
    y2 -= 18;
  }

  y2 -= 15;
  page2.drawText('5. AI Chat with Document (Scruttin 3.7+ Feature)', {
    x: 40,
    y: y2,
    size: 13,
    font: boldFont,
    color: rgb(0.1, 0.35, 0.6),
  });
  y2 -= 20;

  const aiDesc = [
    'Scruttin Web integrates with Google Gemini to allow interactive dialog with your open documents.',
    'You can ask the AI assistant to:',
    '  - Summarize long reports or executive summaries in seconds.',
    '  - Search for specific data, clauses, or figures across complex chapters.',
    '  - Explain complicated academic terminology, formulas, or legal terms.',
    '  - Extract actionable checklists and tables directly from text.',
    '',
    'Click the AI Chat button in the top toolbar or press Ctrl + Shift + A to open the conversation sidebar.'
  ];

  for (const a of aiDesc) {
    if (a) {
      page2.drawText(a, { x: 45, y: y2, size: 9, font, color: rgb(0.2, 0.2, 0.2) });
    }
    y2 -= 16;
  }

  y2 -= 20;
  page2.drawText('6. About Scruttin', {
    x: 40,
    y: y2,
    size: 13,
    font: boldFont,
    color: rgb(0.1, 0.35, 0.6),
  });
  y2 -= 20;

  const aboutText = [
    'Scruttin is a powerful, lightweight document reading and PDF manipulation suite.',
    'Built with modern web technologies, full client-side engines, and AI integration.',
    'Enjoy fast, clean reading and productivity.'
  ];

  for (const ab of aboutText) {
    page2.drawText(ab, { x: 45, y: y2, size: 9, font, color: rgb(0.3, 0.3, 0.3) });
    y2 -= 15;
  }

  // Footer page 2
  page2.drawText('Page 2 of 2  •  Scruttin Web Documentation', {
    x: 40,
    y: 30,
    size: 8,
    font,
    color: rgb(0.5, 0.5, 0.5),
  });

  return await pdfDoc.save();
}

export const SAMPLE_MARKDOWN_DOC = `# Scruttin Architecture & Command Reference

Welcome to the **Scruttin Markdown Document Viewer**.

## Overview
Scruttin is known for its minimalist interface and blazing performance. This viewer supports reading native Markdown documents alongside PDF files, complete with tables, code highlighting, and heading navigation.

### Supported Document Formats
| Format | Extension | Engine Support |
| :--- | :--- | :--- |
| Portable Document Format | \`.pdf\` | PDF.js + pdf-lib Engine |
| Comic Book Archive | \`.cbz\`, \`.cbr\` | JSZip Image Extractor |
| Markdown Document | \`.md\` | Markdown-It / React-Markdown |
| Plain Text File | \`.txt\` | Stream Text Parser |
| Images | \`.png\`, \`.jpg\`, \`.webp\` | Canvas Hardware Render |

## Command-Line Arguments & Settings
Scruttin supports powerful keyboard commands and advanced customization options:
- \`ZoomLevels\`: 50%, 100%, 150%, 200%, Fit Page, Fit Width
- \`ViewModes\`: Continuous Scroll, Single Page, Book / Facing Pages, Presentation
- \`Themes\`: Scruttin Classic (Yellow), Dark, Sepia, Nord, Solarized Dark

\`\`\`json
{
  "MainWindowBackground": "#fcf9db",
  "DefaultZoom": "fit-width",
  "EnableAIChat": true,
  "RememberOpenedFiles": true
}
\`\`\`

## Interactive AI Capabilities
You can ask the AI assistant questions about this document at any time by pressing **Ctrl + Shift + A** or clicking the **AI Chat** button in the upper toolbar!
`;

export const SAMPLE_TEXT_DOC = `========================================================================
SCRUTTIN RELEASE NOTES & CHANGELOG
========================================================================

Version 3.7.0 Web Edition:
------------------------------------------------------------------------
- Modern Web Architecture: Full client-side PDF.js and pdf-lib engine.
- AI Chat Integration: Ask questions and summarize documents via Gemini AI.
- PDF Tools Suite:
  * Merge multiple PDFs
  * Split / Extract selected pages
  * Rotate and reorder pages
  * Compress and optimize PDFs
  * Convert Images and Markdown to PDF
- Command Palette: Instant fuzzy command launcher (Ctrl + K / F1).
- In-document Full-Text Search with real-time highlighting.
- Text-to-Speech (TTS) Read Aloud with speed control.
- Annotation tools: Highlight text, sticky notes, and freehand drawing.
- Multi-format support: PDF, CBZ/CBR comic archives, Markdown, and TXT.
- Theming engine: Scruttin Classic, Dark Mode, Sepia, Nord, Solarized.

========================================================================
`;
