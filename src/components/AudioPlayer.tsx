import { useState, useRef, useEffect } from "react";

interface AudioPlayerProps {
  src: string;
  duration?: number;
}

export default function AudioPlayer({ src, duration }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(duration || 0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    audioRef.current = new Audio(src);

    audioRef.current.onloadedmetadata = () => {
      setAudioDuration(audioRef.current?.duration || 0);
    };

    audioRef.current.ended = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [src]);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    } else {
      audioRef.current.play();
      updateProgress();
    }
    setIsPlaying(!isPlaying);
  };

  const updateProgress = () => {
    if (!audioRef.current) return;
    setCurrentTime(audioRef.current.currentTime);
    if (!audioRef.current.ended) {
      animationRef.current = requestAnimationFrame(updateProgress);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const time = parseFloat(e.target.value);
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progress = audioDuration > 0 ? (currentTime / audioDuration) * 100 : 0;

  return (
    <div className="audio-player">
      <button
        className="audio-play-btn"
        onClick={togglePlay}
        title={isPlaying ? "Пауза" : "Воспроизвести"}
      >
        {isPlaying ? "⏸️" : "▶️"}
      </button>
      <div className="audio-progress-container">
        <input
          type="range"
          className="audio-progress"
          min="0"
          max={audioDuration || 100}
          value={currentTime}
          onChange={handleSeek}
          step="0.1"
          style={{
            background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${progress}%, #e5e7eb ${progress}%, #e5e7eb 100%)`,
          }}
        />
        <span className="audio-duration">{formatTime(audioDuration)}</span>
      </div>
    </div>
  );
}
