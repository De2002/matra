import React, { useState } from 'react';
import { Sliders, Save, RotateCcw, Check, Sparkles, X, FileCode, CheckCircle2, AlertCircle } from 'lucide-react';
import { ScruttinSettings, SuperTheme } from '../types';
import { 
  DEFAULT_SCRUTTIN_SETTINGS, 
  serializeSettingsToPlainText, 
  parsePlainTextToSettings, 
  saveSettings 
} from '../lib/settingsManager';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSettings: ScruttinSettings;
  onApplySettings: (settings: ScruttinSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  currentSettings,
  onApplySettings,
}) => {
  const [editorText, setEditorText] = useState<string>(() =>
    serializeSettingsToPlainText(currentSettings)
  );
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'text' | 'presets'>('text');

  if (!isOpen) return null;

  const handleSave = () => {
    try {
      const parsed = parsePlainTextToSettings(editorText, currentSettings);
      saveSettings(parsed);
      onApplySettings(parsed);
      setSaveStatus('Settings successfully applied!');
      setTimeout(() => setSaveStatus(null), 2500);
    } catch (e: any) {
      setSaveStatus(`Parse error: ${e.message}`);
    }
  };

  const handleResetDefaults = () => {
    if (confirm('Reset all settings to default Scruttin configuration?')) {
      const defText = serializeSettingsToPlainText(DEFAULT_SCRUTTIN_SETTINGS);
      setEditorText(defText);
      saveSettings(DEFAULT_SCRUTTIN_SETTINGS);
      onApplySettings(DEFAULT_SCRUTTIN_SETTINGS);
      setSaveStatus('Reset to factory defaults.');
      setTimeout(() => setSaveStatus(null), 2000);
    }
  };

  const applyPreset = (superTheme: SuperTheme, manga: boolean, theme: any) => {
    const newSettings: ScruttinSettings = {
      ...currentSettings,
      pageColorFilter: superTheme,
      mangaMode: manga,
      theme,
    };
    const text = serializeSettingsToPlainText(newSettings);
    setEditorText(text);
    saveSettings(newSettings);
    onApplySettings(newSettings);
    setSaveStatus('Preset loaded and applied!');
    setTimeout(() => setSaveStatus(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[var(--bg-toolbar)] text-[var(--text-main)] border border-[var(--border-toolbar)] shadow-2xl rounded-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border-toolbar)] bg-black/5">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-xl">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold">Scruttin-settings.txt</h2>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-black/10 rounded font-bold">
                  Live Plaintext Config
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)]">
                Directly edit Scruttin advanced configurations and super-themes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-black/10 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls & Quick Presets */}
        <div className="px-5 py-2.5 border-b border-[var(--border-toolbar)] flex flex-wrap items-center justify-between gap-2 bg-black/2 text-xs">
          <div className="flex items-center gap-1.5 bg-black/10 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('text')}
              className={`px-3 py-1 font-bold rounded-lg transition-all ${
                activeTab === 'text' ? 'bg-amber-600 text-white shadow-xs' : 'text-[var(--text-muted)]'
              }`}
            >
              Plaintext Editor
            </button>
            <button
              onClick={() => setActiveTab('presets')}
              className={`px-3 py-1 font-bold rounded-lg transition-all ${
                activeTab === 'presets' ? 'bg-amber-600 text-white shadow-xs' : 'text-[var(--text-muted)]'
              }`}
            >
              Super-Theme Presets
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetDefaults}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[var(--border-toolbar)] hover:bg-black/5 font-medium transition-colors text-[var(--text-muted)]"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Defaults</span>
            </button>

            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shadow-xs transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save & Apply (Ctrl+S)</span>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1 text-xs">
          {saveStatus && (
            <div className="mb-3 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 rounded-xl flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4" />
              <span>{saveStatus}</span>
            </div>
          )}

          {activeTab === 'text' ? (
            <div className="space-y-2">
              <div className="text-[11px] text-[var(--text-muted)] flex items-center justify-between">
                <span>Edit configuration key-values below:</span>
                <span className="font-mono text-[10px]">UTF-8 • Unix / Win32 CR-LF</span>
              </div>
              <textarea
                value={editorText}
                onChange={(e) => setEditorText(e.target.value)}
                rows={18}
                spellCheck={false}
                className="w-full bg-stone-900 text-amber-200 border border-stone-700 rounded-xl p-4 font-mono text-xs leading-relaxed focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-[var(--text-muted)]">
                Select a signature Scruttin preset to instantly configure themes, reading directions, and page contrast filters:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Preset 1: Classic */}
                <div
                  onClick={() => applyPreset('none', false, 'scruttin-classic')}
                  className="p-4 rounded-xl border border-[var(--border-toolbar)] hover:border-amber-500 bg-black/5 hover:bg-amber-500/5 cursor-pointer transition-all space-y-1.5"
                >
                  <div className="font-bold text-sm flex items-center justify-between">
                    <span>Scruttin Classic Cream</span>
                    <span className="w-3.5 h-3.5 rounded-full bg-[#fcf9db] border border-black/20" />
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    The beloved classic light yellow toolbar with crisp white vector rendering.
                  </p>
                </div>

                {/* Preset 2: Smart Dark / Night */}
                <div
                  onClick={() => applyPreset('smart-invert', false, 'dark')}
                  className="p-4 rounded-xl border border-[var(--border-toolbar)] hover:border-amber-500 bg-black/5 hover:bg-amber-500/5 cursor-pointer transition-all space-y-1.5"
                >
                  <div className="font-bold text-sm flex items-center justify-between">
                    <span>Smart Dark Invert</span>
                    <span className="w-3.5 h-3.5 rounded-full bg-stone-900 border border-white/20" />
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    Inverts light document backgrounds to dark while preserving figures and images.
                  </p>
                </div>

                {/* Preset 3: AMOLED Pitch Black */}
                <div
                  onClick={() => applyPreset('amoled', false, 'dark')}
                  className="p-4 rounded-xl border border-[var(--border-toolbar)] hover:border-amber-500 bg-black/5 hover:bg-amber-500/5 cursor-pointer transition-all space-y-1.5"
                >
                  <div className="font-bold text-sm flex items-center justify-between">
                    <span>AMOLED Black Super-Theme</span>
                    <span className="w-3.5 h-3.5 rounded-full bg-black border border-white/40" />
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    Pure `#000000` pitch black background for maximum contrast and OLED battery saving.
                  </p>
                </div>

                {/* Preset 4: Paper Sepia */}
                <div
                  onClick={() => applyPreset('sepia-paper', false, 'sepia')}
                  className="p-4 rounded-xl border border-[var(--border-toolbar)] hover:border-amber-500 bg-black/5 hover:bg-amber-500/5 cursor-pointer transition-all space-y-1.5"
                >
                  <div className="font-bold text-sm flex items-center justify-between">
                    <span>Eye-Care Paper Sepia</span>
                    <span className="w-3.5 h-3.5 rounded-full bg-[#f4ecd8] border border-amber-900/20" />
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    Warm parchment paper filter with dark charcoal ink for comfortable multi-hour reading.
                  </p>
                </div>

                {/* Preset 5: Manga Mode RTL */}
                <div
                  onClick={() => applyPreset('none', true, 'dark')}
                  className="p-4 rounded-xl border border-[var(--border-toolbar)] hover:border-amber-500 bg-black/5 hover:bg-amber-500/5 cursor-pointer transition-all space-y-1.5"
                >
                  <div className="font-bold text-sm flex items-center justify-between">
                    <span>Japanese Manga Reader (RTL)</span>
                    <span className="text-xs font-mono font-bold text-red-500">RTL 漫画</span>
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    Right-to-Left dual page view with comic metadata parsing for manga and doujinshi.
                  </p>
                </div>

                {/* Preset 6: Dracula Dark */}
                <div
                  onClick={() => applyPreset('dracula', false, 'nord')}
                  className="p-4 rounded-xl border border-[var(--border-toolbar)] hover:border-amber-500 bg-black/5 hover:bg-amber-500/5 cursor-pointer transition-all space-y-1.5"
                >
                  <div className="font-bold text-sm flex items-center justify-between">
                    <span>Dracula Super-Theme</span>
                    <span className="w-3.5 h-3.5 rounded-full bg-[#282a36] border border-purple-400" />
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    Classic vampire palette with `#282a36` background and vibrant accents.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[var(--border-toolbar)] bg-black/5 flex items-center justify-between">
          <span className="text-[11px] text-[var(--text-muted)]">
            Saved to local profile persistence.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-black/10 hover:bg-black/20 text-xs font-bold rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
