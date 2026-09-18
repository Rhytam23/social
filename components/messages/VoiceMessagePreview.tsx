import React, { useState } from 'react';
import { IconPause, IconPlay } from '../ui/icons';

export interface VoiceMessagePreviewProps {
  duration?: string;
  isSelf?: boolean;
}

export const VoiceMessagePreview: React.FC<VoiceMessagePreviewProps> = ({
  duration = '0:14',
  isSelf = false,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const togglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      let p = progress;
      const interval = setInterval(() => {
        p += 10;
        setProgress(p);
        if (p >= 100) {
          clearInterval(interval);
          setIsPlaying(false);
          setProgress(0);
        }
      }, 300);
    }
  };

  return (
    <div
      className={`p-3 rounded-xl border flex items-center gap-3 w-64 ${
        isSelf ? 'bg-slate-950/40 border-slate-700/60' : 'bg-slate-950/50 border-slate-800'
      }`}
    >
      <button
        type="button"
        onClick={togglePlay}
        className="w-8 h-8 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center shrink-0 transition-colors shadow-xs"
        aria-label={isPlaying ? 'Pause voice message' : 'Play voice message'}
      >
        {isPlaying ? <IconPause className="w-3.5 h-3.5" /> : <IconPlay className="w-3.5 h-3.5 translate-x-[1px]" />}
      </button>

      <div className="flex-1 flex flex-col gap-1">
        {/* Animated Waveform Representation */}
        <div className="flex items-center gap-0.5 h-4">
          {[40, 70, 25, 90, 50, 80, 30, 60, 100, 45, 75, 35, 65, 85, 20].map((h, idx) => {
            const isActive = (idx / 15) * 100 <= progress;
            return (
              <div
                key={idx}
                className={`flex-1 rounded-full transition-colors ${
                  isActive ? 'bg-emerald-400' : 'bg-slate-700'
                }`}
                style={{ height: `${h}%` }}
              />
            );
          })}
        </div>

        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
          <span>{isPlaying ? `${Math.floor((progress / 100) * 14)}s` : 'Voice Note'}</span>
          <span>{duration}</span>
        </div>
      </div>
    </div>
  );
};
