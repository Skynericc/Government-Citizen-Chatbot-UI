import React, { useRef, useState, useEffect } from "react";
import { Play, Pause } from "lucide-react";

/* ------------------------------------------------------------------ */
/* Minimal, on-brand audio player (no native browser control skin)     */
/* used to play back a citizen's own voice message after sending it.   */
/* ------------------------------------------------------------------ */

function formatTime(s) {
  if (!isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const ss = Math.floor(s % 60);
  return `${m}:${String(ss).padStart(2, "0")}`;
}

export default function AudioPlayer({ url, fallbackDuration = 0 }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(fallbackDuration);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onTime = () => setCurrent(el.currentTime);
    const onLoaded = () => {
      if (isFinite(el.duration) && el.duration > 0) setDuration(el.duration);
    };
    const onEnded = () => { setPlaying(false); setCurrent(0); };
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("loadedmetadata", onLoaded);
    el.addEventListener("durationchange", onLoaded);
    el.addEventListener("ended", onEnded);
    return () => {
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("loadedmetadata", onLoaded);
      el.removeEventListener("durationchange", onLoaded);
      el.removeEventListener("ended", onEnded);
    };
  }, []);

  const toggle = () => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) {
      el.pause();
      setPlaying(false);
    } else {
      el.play();
      setPlaying(true);
    }
  };

  const seek = (e) => {
    const el = audioRef.current;
    if (!el || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    el.currentTime = ratio * duration;
    setCurrent(el.currentTime);
  };

  const progress = duration ? Math.min(100, (current / duration) * 100) : 0;

  return (
    <div className="audio-player">
      <audio ref={audioRef} src={url} preload="metadata" />
      <button type="button" className="audio-player-toggle" onClick={toggle} title={playing ? "Pause" : "Écouter"}>
        {playing ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
      </button>
      <div className="audio-player-track" onClick={seek}>
        <div className="audio-player-progress" style={{ width: `${progress}%` }} />
      </div>
      <span className="audio-player-time">{formatTime(playing || current ? current : duration)}</span>
    </div>
  );
}
