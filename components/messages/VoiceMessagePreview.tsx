import React, { useEffect, useRef, useState } from 'react';
import { IconPause, IconPlay } from '../ui/icons';

export interface VoiceMessagePreviewProps {
  duration?: string;
  isSelf?: boolean;
  url?: string;
  isDownloading?: boolean;
  downloadError?: string;
  onRequestDownload?: () => void;
}

export const VoiceMessagePreview: React.FC<VoiceMessagePreviewProps> = ({
  duration = '0:00',
  isSelf = false,
  url,
  isDownloading = false,
  downloadError,
  onRequestDownload,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0-100
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    // Reset playback state whenever the decrypted URL changes (e.g. after download).
    setIsPlaying(false);
    setProgress(0);
    setElapsedSeconds(0);
  }, [url]);

  const togglePlay = () => {
    if (!url) {
      onRequestDownload?.();
      return;
    }
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      void audio.play();
    }
  };

  return (
    <div
      className={`p-3 rounded-xl border flex items-center gap-3 w-64 ${
        isSelf ? 'bg-slate-950/40 border-slate-700/60' : 'bg-slate-950/50 border-slate-800'
      }`}
    >
      {url && (
        <audio
          ref={audioRef}
          src={url}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => {
            setIsPlaying(false);
            setProgress(0);
            setElapsedSeconds(0);
          }}
          onTimeUpdate={(e) => {
            const el = e.currentTarget;
            if (el.duration > 0) setProgress((el.currentTime / el.duration) * 100);
            setElapsedSeconds(Math.floor(el.currentTime));
          }}
        />
      )}

      <button
        type="button"
        onClick={togglePlay}
        disabled={isDownloading}
        className="w-8 h-8 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center shrink-0 transition-colors shadow-xs disabled:opacity-50"
        aria-label={isPlaying ? 'Pause voice message' : url ? 'Play voice message' : 'Decrypt and play voice message'}
      >
        {isDownloading ? (
          <span className="w-3 h-3 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
        ) : isPlaying ? (
          <IconPause className="w-3.5 h-3.5" />
        ) : (
          <IconPlay className="w-3.5 h-3.5 translate-x-[1px]" />
        )}
      </button>

      <div className="flex-1 flex flex-col gap-1">
        <div className="flex items-center gap-0.5 h-4">
          {[40, 70, 25, 90, 50, 80, 30, 60, 100, 45, 75, 35, 65, 85, 20].map((h, idx) => {
            const isActive = (idx / 15) * 100 <= progress;
            return (
              <div key={idx} className={`flex-1 rounded-full transition-colors ${isActive ? 'bg-emerald-400' : 'bg-slate-700'}`} style={{ height: `${h}%` }} />
            );
          })}
        </div>

        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
          <span>{downloadError ? 'Tap to retry' : isDownloading ? 'Decrypting...' : !url ? 'Tap to decrypt' : isPlaying ? `${elapsedSeconds}s` : 'Voice note'}</span>
          <span>{duration}</span>
        </div>
      </div>
    </div>
  );
};
