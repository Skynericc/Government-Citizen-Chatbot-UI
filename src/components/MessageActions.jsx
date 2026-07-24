import React, { useState } from "react";
import { Copy, Check, Volume2, ThumbsUp, ThumbsDown, Flag, Share2 } from "lucide-react";

/* ------------------------------------------------------------------ */
/* Discreet icon-button row shown below each completed assistant reply */
/* ------------------------------------------------------------------ */

export default function MessageActions({ t, text, feedback, onFeedback }) {
  const [copied, setCopied] = useState(false);
  const [listening, setListening] = useState(false);

  const handleCopy = () => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="msg-actions">
      <button className="icon-btn" title={listening ? t.stopListening : t.listen} onClick={() => setListening(l => !l)}>
        <Volume2 size={15} color={listening ? "var(--primary)" : undefined} />
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
  );
}