import React, { useState, useRef, useEffect } from "react";
import { Copy, Check, Volume2, Loader2, ThumbsUp, ThumbsDown, Flag, Share2 } from "lucide-react";
import { synthesizeSpeech, isTTSConfigured } from "../utils/TTSService.js";

/* ------------------------------------------------------------------ */
/* Discreet icon-button row shown below each completed assistant reply */
/*                                                                      */
/* "Listen" calls the real `tts` service (contrat §3) when              */
/* VITE_TTS_URL is configured. The synthesized audio is cached in       */
/* memory per message (ttsUrlRef) so replaying doesn't re-synthesize.   */
/* Falls back to a no-op toggle (old placeholder behaviour) when no     */
/* backend is configured, same pattern as chat and voice recording.     */
/* ------------------------------------------------------------------ */

export default function MessageActions({ t, text, language, feedback, onFeedback }) {
  const [copied, setCopied] = useState(false);
  const [ttsState, setTtsState] = useState("idle"); // idle | loading | playing | paused | error
  const [ttsError, setTtsError] = useState("");
  const [listening, setListening] = useState(false); // fallback-mode toggle only

  const audioRef = useRef(null);
  const ttsUrlRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (ttsUrlRef.current) URL.revokeObjectURL(ttsUrlRef.current);
    };
  }, []);

  const handleCopy = () => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const errorMessageFor = (kind) => {
    if (kind === "unavailable") return t.ttsUnavailable;
    if (kind === "empty") return t.ttsEmptyError;
    return t.ttsGenericError;
  };

  const handleListenReal = async () => {
    setTtsError("");

    if (ttsState === "playing") {
      audioRef.current?.pause();
      setTtsState("paused");
      return;
    }
    if (ttsState === "paused" && ttsUrlRef.current) {
      audioRef.current?.play();
      setTtsState("playing");
      return;
    }
    if (ttsState === "loading") return; // already in flight

    setTtsState("loading");
    try {
      const controller = new AbortController();
      abortRef.current = controller;
      const { url } = await synthesizeSpeech({ text, language, signal: controller.signal });
      ttsUrlRef.current = url;
      if (!audioRef.current) audioRef.current = new Audio();
      audioRef.current.src = url;
      audioRef.current.onended = () => setTtsState("idle");
      await audioRef.current.play();
      setTtsState("playing");
    } catch (err) {
      if (err?.kind === "aborted") return;
      console.error("TTS error:", err);
      setTtsError(errorMessageFor(err?.kind));
      setTtsState("error");
    }
  };

  const handleListenFallback = () => setListening((l) => !l);
  const handleListen = isTTSConfigured() ? handleListenReal : handleListenFallback;

  const listenActive = isTTSConfigured() ? ttsState === "playing" || ttsState === "paused" : listening;
  const listenTitle = isTTSConfigured()
    ? (ttsState === "playing" ? t.stopListening : t.listen)
    : (listening ? t.stopListening : t.listen);

  return (
    <div className="msg-actions-wrap">
      <div className="msg-actions">
        <button className="icon-btn" title={listenTitle} onClick={handleListen} disabled={ttsState === "loading"}>
          {ttsState === "loading" ? (
            <Loader2 size={15} className="spin" />
          ) : (
            <Volume2 size={15} color={listenActive ? "var(--primary)" : undefined} />
          )}
        </button>
        <button className="icon-btn" title={copied ? t.copied : t.copy} onClick={handleCopy}>
          {copied ? <Check size={15} /> : <Copy size={15} />}
        </button>
        <button
          className="icon-btn"
          title={t.helpful}
          onClick={() => onFeedback(feedback === "up" ? null : "up")}
        >
          <ThumbsUp size={15} fill={feedback === "up" ? "var(--primary)" : "none"} color={feedback === "up" ? "var(--primary)" : undefined} />
        </button>
        <button
          className="icon-btn"
          title={t.notHelpful}
          onClick={() => onFeedback(feedback === "down" ? null : "down")}
        >
          <ThumbsDown size={15} fill={feedback === "down" ? "var(--danger)" : "none"} color={feedback === "down" ? "var(--danger)" : undefined} />
        </button>
        <button className="icon-btn" title={t.report}>
          <Flag size={15} />
        </button>
        <button className="icon-btn" title={t.share}>
          <Share2 size={15} />
        </button>
      </div>
      {ttsError && <div className="tts-error">{ttsError}</div>}
    </div>
  );
}
