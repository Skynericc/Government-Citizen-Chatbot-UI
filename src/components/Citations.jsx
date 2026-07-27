import React from "react";
import { ExternalLink } from "lucide-react";

/* ------------------------------------------------------------------ */
/* Citations UI: a small numbered superscript marker inline in the      */
/* answer text (rendered by utils/Markdown.jsx from a `[[n]]` token),   */
/* plus the "Sources" block listing every citation under the message.  */
/* ------------------------------------------------------------------ */

export function CitationMark({ n, citation, keyBase }) {
  if (!citation) return <sup key={keyBase} className="citation-mark citation-mark-plain">[{n}]</sup>;
  return (
    <a
      key={keyBase}
      href={citation.url}
      target="_blank"
      rel="noreferrer"
      className="citation-mark"
      title={citation.label}
    >
      <sup>{n}</sup>
    </a>
  );
}

export function SourcesList({ citations, title }) {
  if (!citations || !citations.length) return null;
  return (
    <div className="sources-block">
      <div className="sources-title">{title}</div>
      <div className="sources-list">
        {citations.map((c) => (
          <a key={c.id} className="source-row" href={c.url} target="_blank" rel="noreferrer">
            <span className="source-number">{c.id}</span>
            <span className="source-label">{c.label}</span>
            <ExternalLink size={12} className="source-open" />
          </a>
        ))}
      </div>
    </div>
  );
}