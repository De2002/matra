import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, Volume2, FastForward, Rewind, X, Settings } from 'lucide-react';

interface TTSReaderProps {
  isActive: boolean;
  onClose: () => void;
  textToRead: string;
}

export const TTSReader: React.FC<TTSReaderProps> = ({
  isActive,
  onClose,
  textToRead
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [rate, setRate] = useState(1.0);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [currentSentence, setCurrentSentence] = useState<string>('');
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    const updateVoices = () => {
      const available = window.speechSynthesis.getVoices();
      setVoices(available);
      if (available.length > 0 && !selectedVoice) {
        const defaultVoice = available.find(v => v.lang.startsWith('en')) || available[0];
        setSelectedVoice(defaultVoice.name);
      }
    };

    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;

    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const handlePlay = () => {
    if (!textToRead) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.rate = rate;
    
    if (selectedVoice) {
      const v = voices.find(voice => voice.name === selectedVoice);
      if (v) utterance.voice = v;
    }

    utterance.onboundary = (e) => {
      if (e.name === 'sentence' || e.name === 'word') {
        const textSnippet = textToRead.slice(e.charIndex, e.charIndex + 60);
        setCurrentSentence(textSnippet);
      }
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setCurrentSentence('');
    };

    utterance.onerror = () => {
      setIsPlaying(false);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
  };

  const handlePauseResume = () => {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsPlaying(true);
    } else if (window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
      setIsPlaying(false);
    } else {
      handlePlay();
    }
  };

  const handleStop = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setCurrentSentence('');
  };

  if (!isActive) return null;

  return (
    <div className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 bg-stone-900/95 backdrop-blur-md text-white rounded-2xl shadow-2xl border border-stone-700 px-3.5 sm:px-5 py-2.5 sm:py-3 flex items-center gap-2.5 sm:gap-4 text-xs select-none w-[calc(100vw-24px)] max-w-xl animate-in slide-in-from-bottom-5 duration-200">
      <div className="p-2 bg-emerald-600 rounded-xl shrink-0">
        <Volume2 className="w-4 h-4 text-white" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="font-semibold text-emerald-400 flex items-center gap-1.5">
          <span>Read Aloud</span>
          {isPlaying && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />}
        </div>
        <p className="text-[11px] text-stone-300 truncate">
          {currentSentence || 'Press Play to start reading document text...'}
        </p>
      </div>

      {/* Play Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <button
          onClick={handlePauseResume}
          className="p-2 sm:p-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-white font-bold transition-transform active:scale-95 shadow-xs"
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
        </button>

        <button
          onClick={handleStop}
          className="p-2 sm:p-2.5 bg-stone-800 hover:bg-stone-700 rounded-xl text-stone-300 transition-colors"
          title="Stop"
        >
          <Square className="w-4 h-4" />
        </button>

        {/* Speed Selector */}
        <select
          value={rate}
          onChange={(e) => {
            const r = parseFloat(e.target.value);
            setRate(r);
            if (isPlaying) {
              handleStop();
              setTimeout(handlePlay, 100);
            }
          }}
          className="bg-stone-800 text-stone-200 rounded-lg px-1.5 sm:px-2 py-1 border border-stone-700 font-mono text-xs focus:outline-none"
        >
          <option value="0.75">0.75x</option>
          <option value="1.0">1.0x</option>
          <option value="1.25">1.25x</option>
          <option value="1.5">1.5x</option>
          <option value="2.0">2.0x</option>
        </select>

        <button
          onClick={() => {
            handleStop();
            onClose();
          }}
          className="p-1 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 ml-0.5 sm:ml-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
