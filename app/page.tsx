"use client"

import { useMemo, useState } from "react"
import { BookOpen, ChevronDown, ChevronLeft, ChevronRight, Download, FileText, FolderOpen, Fullscreen, Grid2X2, List, Menu, Minus, MoreHorizontal, PanelLeft, Plus, Printer, RotateCw, Search, Share2, SlidersHorizontal, X } from "lucide-react"

const chapters = ["Cover", "Contents", "Introduction", "Getting started", "The document view", "Keyboard shortcuts", "About this guide"]

export default function ReaderPage() {
  const [page, setPage] = useState(1)
  const [zoom, setZoom] = useState(100)
  const [sidebar, setSidebar] = useState(true)
  const [searchOpen, setSearchOpen] = useState(false)
  const [mobileMenu, setMobileMenu] = useState(false)
  const [dark, setDark] = useState(false)
  const total = 12
  const percent = Math.round((page / total) * 100)
  const status = useMemo(() => page === 1 ? "Fit page" : `${zoom}%`, [page, zoom])

  return (
    <main className={dark ? "reader-app dark-reader" : "reader-app"}>
      <header className="topbar">
        <div className="brand"><BookOpen size={19} strokeWidth={2.5} /><span>sumatra</span><b>web</b></div>
        <nav className="file-nav" aria-label="Document menu"><button><FolderOpen size={16} /> Open</button><button><Download size={16} /> Save as</button><button><Printer size={16} /> Print</button></nav>
        <div className="top-actions"><button className="icon-button" onClick={() => setSearchOpen(!searchOpen)} aria-label="Search document"><Search size={17} /></button><button className="icon-button" onClick={() => setMobileMenu(!mobileMenu)} aria-label="More options"><MoreHorizontal size={18} /></button></div>
      </header>
      <div className="toolbar">
        <button className="mobile-only icon-button" onClick={() => setSidebar(!sidebar)} aria-label="Toggle sidebar"><Menu size={18} /></button>
        <div className="tool-group"><button className="tool-button" onClick={() => setSidebar(!sidebar)} aria-label="Toggle sidebar"><PanelLeft size={17} /></button><span className="divider" /><button className="tool-button" onClick={() => setPage(Math.max(1, page - 1))} aria-label="Previous page"><ChevronLeft size={18} /></button><div className="page-input"><input value={page} onChange={e => setPage(Math.min(total, Math.max(1, Number(e.target.value) || 1)))} aria-label="Current page" /><span>/ {total}</span></div><button className="tool-button" onClick={() => setPage(Math.min(total, page + 1))} aria-label="Next page"><ChevronRight size={18} /></button></div>
        <div className="toolbar-title"><FileText size={15} /> <span>Getting started with SumatraPDF</span></div>
        <div className="tool-group right-tools"><button className="tool-button" onClick={() => setZoom(Math.max(50, zoom - 10))} aria-label="Zoom out"><Minus size={17} /></button><button className="zoom-value" onClick={() => setZoom(100)}>{status}<ChevronDown size={13} /></button><button className="tool-button" onClick={() => setZoom(Math.min(200, zoom + 10))} aria-label="Zoom in"><Plus size={17} /></button><span className="divider" /><button className="tool-button" aria-label="Rotate page"><RotateCw size={16} /></button><button className="tool-button" aria-label="Fullscreen"><Fullscreen size={16} /></button></div>
      </div>
      {searchOpen && <div className="searchbar"><Search size={16} /><input autoFocus placeholder="Search in document" /><span>0 results</span><button onClick={() => setSearchOpen(false)} aria-label="Close search"><X size={16} /></button></div>}
      <div className="workspace">
        {sidebar && <aside className="sidebar"><div className="side-tabs"><button className="active"><List size={15} /> Outline</button><button><Grid2X2 size={15} /> Pages</button></div><div className="outline"><p className="eyebrow">DOCUMENT OUTLINE</p>{chapters.map((chapter, index) => <button key={chapter} className={index + 1 === page ? "outline-item active" : "outline-item"} onClick={() => setPage(Math.min(total, index + 1))}><span>{chapter}</span><small>{index + 1}</small></button>)}</div><div className="side-footer"><button onClick={() => setDark(!dark)}><SlidersHorizontal size={15} /> Preferences</button><span>v1.0 · Web reader</span></div></aside>}
        <section className="canvas" aria-label="Document reader"><div className="canvas-topline"><span>LOCAL DOCUMENT</span><span>{percent}% read</span></div><article className="paper" style={{ transform: `scale(${zoom / 100})` }}><div className="paper-kicker">SUMATRA WEB / QUICK GUIDE</div><h1>Getting started<br /><em>with SumatraPDF</em></h1><p className="lead">A fast, focused document reader for every screen.</p><div className="cover-rule" /><div className="cover-meta"><span>GUIDE 01</span><span>2026 EDITION</span></div><div className="paper-stamp">PDF<br /><b>READER</b></div></article><div className="canvas-footer"><span>Page {page} of {total}</span><div className="progress"><i style={{ width: `${percent}%` }} /></div><span>{zoom}%</span></div></section>
      </div>
      <footer className="statusbar"><span><span className="status-dot" /> Ready</span><span className="status-path">No file open · Open a PDF to begin reading</span><span className="status-right">UTF-8 <Share2 size={13} /></span></footer>
      {mobileMenu && <div className="mobile-popover"><button><Share2 size={15} /> Share document</button><button><Download size={15} /> Download copy</button><button><Printer size={15} /> Print</button></div>}
    </main>
  )
}
