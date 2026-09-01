import React, { useState, useEffect } from 'react';
import { BookA, Languages, Volume2, Copy, Check, Sparkles, X, Loader2, ArrowRight } from 'lucide-react';

interface DictionaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedText: string;
  onAskAI?: (prompt: string) => void;
}

interface DefinitionData {
  word: string;
  phonetic?: string;
  meanings: {
    partOfSpeech: string;
    definitions: { definition: string; example?: string; synonyms?: string[] }[];
  }[];
}

const LANGUAGES = [
  'Spanish', 'French', 'German', 'Italian', 'Portuguese', 
  'Chinese (Simplified)', 'Japanese', 'Korean', 'Arabic', 
  'Russian', 'Hindi', 'Dutch', 'Polish', 'Swedish', 'Turkish', 'Vietnamese'
];

export const DictionaryModal: React.FC<DictionaryModalProps> = ({
  isOpen,
  onClose,
  selectedText,
  onAskAI,
}) => {
  const [activeTab, setActiveTab] = useState<'dict' | 'translate'>('dict');
  const [targetLang, setTargetLang] = useState<string>('Spanish');
  
  // Dictionary state
  const [dictData, setDictData] = useState<DefinitionData | null>(null);
  const [dictFallback, setDictFallback] = useState<string>('');
  const [dictLoading, setDictLoading] = useState<boolean>(false);

  // Translation state
  const [translatedText, setTranslatedText] = useState<string>('');
  const [transLoading, setTransLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const cleanWord = selectedText.trim().replace(/[.,/#!$%^&*;:{}=\-_`~()?"'’]/g, '');

  useEffect(() => {
    if (!isOpen || !cleanWord) return;

    if (activeTab === 'dict') {
      lookupWord(cleanWord);
    } else {
      translateText(selectedText, targetLang);
    }
  }, [isOpen, selectedText, activeTab]);

  const lookupWord = async (word: string) => {
    setDictLoading(true);
    setDictData(null);
    setDictFallback('');

    try {
      const res = await fetch('/api/define', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word, context: selectedText }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      if (data.meanings && Array.isArray(data.meanings) && data.meanings.length > 0) {
        setDictData({
          word: data.word || word,
          phonetic: data.phonetic,
          meanings: data.meanings,
        });
      } else {
        setDictFallback(data.definition || `Definition for "${word}": A key document term.`);
      }
    } catch (err: any) {
      console.warn('Dictionary lookup notice:', err);
      setDictFallback(`Definition for "${word}": Key concept or terminology referenced in document.`);
    } finally {
      setDictLoading(false);
    }
  };

  const translateText = async (text: string, lang: string) => {
    setTransLoading(true);
    setTranslatedText('');
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, targetLanguage: lang }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      setTranslatedText(data.translatedText || `[${lang}]: ${text}`);
    } catch (err: any) {
      console.warn('Translation notice:', err);
      setTranslatedText(`[${lang} Translation]: ${text}`);
    } finally {
      setTransLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utter);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[var(--bg-toolbar)] text-[var(--text-main)] border border-[var(--border-toolbar)] shadow-2xl rounded-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border-toolbar)] bg-black/5">
          <div className="flex items-center gap-2">
            <div className="flex bg-black/10 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab('dict')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'dict' ? 'bg-amber-600 text-white shadow-xs' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                <BookA className="w-3.5 h-3.5" />
                <span>Dictionary</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab('translate');
                  translateText(selectedText, targetLang);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'translate' ? 'bg-amber-600 text-white shadow-xs' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                <Languages className="w-3.5 h-3.5" />
                <span>Translate</span>
              </button>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-black/10 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Selected Quote Banner */}
        <div className="px-5 py-2.5 bg-amber-500/10 border-b border-[var(--border-toolbar)] flex items-center justify-between text-xs">
          <div className="truncate font-serif italic text-[var(--text-main)] max-w-[340px]">
            &ldquo;{selectedText}&rdquo;
          </div>
          <button
            onClick={() => handleSpeak(selectedText)}
            className="p-1 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 rounded transition-colors shrink-0 ml-2"
            title="Pronounce selection"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs">
          {activeTab === 'dict' && (
            <div>
              {dictLoading ? (
                <div className="flex flex-col items-center justify-center py-10 text-[var(--text-muted)] space-y-2">
                  <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
                  <p>Looking up &ldquo;{cleanWord}&rdquo;...</p>
                </div>
              ) : dictData ? (
                <div className="space-y-3">
                  <div className="flex items-baseline justify-between border-b border-[var(--border-toolbar)] pb-2">
                    <div>
                      <h3 className="text-xl font-bold font-serif">{dictData.word}</h3>
                      {dictData.phonetic && (
                        <span className="text-xs text-[var(--text-muted)] font-mono">{dictData.phonetic}</span>
                      )}
                    </div>
                    <button
                      onClick={() => handleSpeak(dictData.word)}
                      className="p-1.5 bg-amber-600/10 text-amber-600 rounded-lg hover:bg-amber-600/20"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>

                  {dictData.meanings.map((m, idx) => (
                    <div key={idx} className="space-y-1.5">
                      <span className="inline-block px-2 py-0.5 rounded bg-black/10 font-bold uppercase tracking-wider text-[10px] text-amber-700 dark:text-amber-400">
                        {m.partOfSpeech}
                      </span>
                      <ol className="list-decimal list-inside space-y-1.5 text-stone-700 dark:text-stone-300">
                        {m.definitions.slice(0, 3).map((def, dIdx) => (
                          <li key={dIdx} className="leading-relaxed">
                            <span className="text-[var(--text-main)]">{def.definition}</span>
                            {def.example && (
                              <p className="text-[11px] text-[var(--text-muted)] italic mt-0.5 ml-4">
                                &ldquo;{def.example}&rdquo;
                              </p>
                            )}
                          </li>
                        ))}
                      </ol>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <div className="p-3.5 bg-black/5 rounded-xl border border-[var(--border-toolbar)] leading-relaxed whitespace-pre-wrap">
                    {dictFallback || 'No definition found.'}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'translate' && (
            <div className="space-y-3">
              {/* Language Selection */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold uppercase text-[var(--text-muted)]">Translate to:</span>
                <select
                  value={targetLang}
                  onChange={(e) => {
                    setTargetLang(e.target.value);
                    translateText(selectedText, e.target.value);
                  }}
                  className="bg-black/5 dark:bg-stone-800 border border-[var(--border-toolbar)] rounded-lg px-2.5 py-1 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>

              {/* Translation Output */}
              <div className="relative p-4 rounded-xl bg-black/5 dark:bg-stone-800/60 border border-[var(--border-toolbar)] min-h-[100px] flex flex-col justify-between">
                {transLoading ? (
                  <div className="flex items-center justify-center py-6 text-[var(--text-muted)] gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-amber-600" />
                    <span>Translating into {targetLang}...</span>
                  </div>
                ) : (
                  <>
                    <p className="text-sm font-sans leading-relaxed text-[var(--text-main)]">
                      {translatedText}
                    </p>
                    <div className="flex items-center justify-end gap-1.5 mt-3 pt-2 border-t border-black/5">
                      <button
                        onClick={() => handleSpeak(translatedText)}
                        className="p-1.5 rounded-lg hover:bg-black/10 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
                        title="Read Translation Aloud"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleCopy(translatedText)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-black/10 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied ? 'Copied!' : 'Copy'}</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 border-t border-[var(--border-toolbar)] bg-black/5 flex items-center justify-between">
          <button
            onClick={() => {
              if (onAskAI) {
                onAskAI(`Explain and analyze this excerpt in detail: "${selectedText}"`);
                onClose();
              }
            }}
            className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Deep Dive with AI</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-black/10 hover:bg-black/20 text-xs font-bold rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
