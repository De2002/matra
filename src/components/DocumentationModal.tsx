import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { HelpCircle, Book, X, Search, Keyboard, Cpu, Palette, FileText } from 'lucide-react';

interface DocumentationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DOC_TOPICS = [
  {
    id: 'intro',
    title: 'Welcome & Overview',
    icon: Book,
    content: `# Welcome to Scruttin Web

Scruttin is a slim, free, multi-format document reader designed for fast performance, modern productivity, and simplicity.

## Supported Document Formats
- **PDF (.pdf)** — Full PDF 1.7 rendering engine, text layer, bookmarks, and forms.
- **Comic Books (.cbz, .cbr)** — High-res sequential comic and manga viewer.
- **Markdown (.md)** — Rich markdown reader with rendered typography, syntax highlighting, and headings.
- **Plain Text (.txt)** — Streamlined plain text viewer with instant search.
- **Images (.png, .jpg, .webp)** — Direct canvas rasterizer with zooming and rotation.

## Mission & Philosophy
Scruttin emphasizes instant startup, an ultra-clean interface without visual clutter, and keyboard-centric navigation.
`
  },
  {
    id: 'shortcuts',
    title: 'Keyboard Shortcuts',
    icon: Keyboard,
    content: `# Scruttin Keyboard Shortcuts

Master your document navigation using these built-in hotkeys:

### File Operations
| Shortcut | Action |
| :--- | :--- |
| **Ctrl + O** | Open file from local computer |
| **Ctrl + S** | Save / Download document |
| **Ctrl + P** | Print document |
| **Ctrl + W** | Close active tab |

### Navigation & Zoom
| Shortcut | Action |
| :--- | :--- |
| **PageDown / Space / ↓** | Next page |
| **PageUp / Shift+Space / ↑** | Previous page |
| **Home / End** | Go to first / last page |
| **Ctrl + G** | Jump to page number |
| **+ / =** | Zoom in |
| **-** | Zoom out |
| **Ctrl + 0** | Fit page to window |
| **Ctrl + 1** | Actual size (100% zoom) |

### Tools & AI
| Shortcut | Action |
| :--- | :--- |
| **Ctrl + K / F1** | Open Scruttin Command Palette |
| **Ctrl + F** | Find in document |
| **Ctrl + Shift + A** | Toggle AI Chat with document |
| **Ctrl + Shift + T** | Open PDF Tools Suite |
| **F11** | Fullscreen presentation mode |
`
  },
  {
    id: 'aichat',
    title: 'AI Chat with Document',
    icon: Cpu,
    content: `# AI Chat with Document (Scruttin 3.7+)

Scruttin features interactive AI document analysis powered by Google Gemini.

## Capabilities
1. **Document Summarization** — Ask the model to generate concise executive summaries or chapter takeaways.
2. **Deep Q&A** — Extract citations, figures, dates, and answers directly from complex text.
3. **Action Items** — Convert reports or agreements into actionable step-by-step checklists.
4. **Context-Aware** — Select any passage on a page and click **Ask AI** in the floating menu to query specific paragraphs.

## Privacy & Local Processing
Your document pages are analyzed on-demand through secure server-side API queries. You can configure your own \`GEMINI_API_KEY\` in your environment settings.
`
  },
  {
    id: 'tools',
    title: 'PDF Tools Suite',
    icon: FileText,
    content: `# Built-in PDF Manipulation Tools

Scruttin Web includes a full suite of client-side PDF utility commands:

- **Merge PDFs**: Join multiple files into one comprehensive PDF.
- **Split & Extract**: Extract specific page intervals (e.g. \`1-3, 5, 8-10\`) into a new file.
- **Rotate Pages**: Rotate scanned documents by 90°, 180°, or 270° and re-save.
- **Compress & Optimize**: Clean dead streams and rebuild font object tables to reduce PDF size.
- **Convert to PDF**: Convert images (PNG, JPG) or Markdown/Text files to standard PDF.
- **Watermark**: Stamp documents with customizable diagonal security watermarks.
`
  },
  {
    id: 'themes',
    title: 'Themes & Customization',
    icon: Palette,
    content: `# Themes & Appearance

Scruttin allows you to customize the visual appearance to suit reading in different lighting conditions:

- **Scruttin Classic** — The signature light yellow warm toolbar (\`#fcf9db\`).
- **Dark Mode** — Modern zinc dark theme tailored for night reading and OLED screens.
- **Warm Sepia** — Eye-friendly parchment reading background.
- **Nord Ice** — Arctic blue palette inspired by the Nord theme.
- **Solarized Dark** — Low-contrast developer palette.
- **High Contrast** — Pure black and yellow accessible theme.
`
  }
];

export const DocumentationModal: React.FC<DocumentationModalProps> = ({
  isOpen,
  onClose
}) => {
  const [activeTopic, setActiveTopic] = useState('intro');
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const currentDoc = DOC_TOPICS.find((t) => t.id === activeTopic) || DOC_TOPICS[0];

  const filteredTopics = DOC_TOPICS.filter((t) =>
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 rounded-2xl shadow-2xl border border-black/10 w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[85vh] animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-black/10 bg-[var(--bg-toolbar)]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-500/20 text-blue-700 dark:text-blue-300 rounded-xl">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base">Scruttin User Manual & Documentation</h3>
              <p className="text-[11px] sm:text-xs text-[var(--text-muted)]">
                Official guide, keyboard shortcuts, tools, and AI reference
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

        {/* Modal Body */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          {/* Side / Top Navigation */}
          <div className="w-full md:w-64 bg-stone-50 dark:bg-stone-950 border-b md:border-b-0 md:border-r border-black/10 p-2 sm:p-3 flex flex-col gap-2 shrink-0">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-stone-400" />
              <input
                type="text"
                placeholder="Search manual..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-xs py-1.5 pl-8 pr-2.5 bg-white dark:bg-stone-800 rounded-lg border border-black/15 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex md:flex-col gap-1 overflow-x-auto no-scrollbar md:overflow-y-auto mt-1 text-xs">
              {filteredTopics.map((topic) => {
                const Icon = topic.icon;
                const isActive = topic.id === activeTopic;
                return (
                  <button
                    key={topic.id}
                    onClick={() => setActiveTopic(topic.id)}
                    className={`whitespace-nowrap md:whitespace-normal px-3 py-2 rounded-xl flex items-center gap-2 font-medium transition-colors shrink-0 ${
                      isActive
                        ? 'bg-blue-600 text-white font-semibold shadow-xs'
                        : 'hover:bg-black/5 text-stone-700 dark:text-stone-300'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{topic.title}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Doc Content Area */}
          <div className="flex-1 p-4 sm:p-8 overflow-y-auto">
            <div className="prose prose-sm prose-stone dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed">
              <ReactMarkdown>{currentDoc.content}</ReactMarkdown>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
