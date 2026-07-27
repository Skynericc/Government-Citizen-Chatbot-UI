import React from "react";
import { Paperclip, X, FileText, File as FileIcon, ExternalLink, Loader2 } from "lucide-react";

/* ------------------------------------------------------------------ */
/* Renders the row of pending-attachment previews above the composer,  */
/* (with live upload-progress state) and the richer read-only previews */
/* shown inside a sent user message. Images get a real thumbnail;      */
/* PDFs get an inline first-page preview (native <object>, no extra    */
/* dependency); everything else falls back to a labelled file card.    */
/* ------------------------------------------------------------------ */

export function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function extensionOf(name = "") {
  const parts = name.split(".");
  return parts.length > 1 ? parts.pop().toUpperCase().slice(0, 4) : "";
}

function kindOf(type, name) {
  if (type?.startsWith("image/")) return "image";
  if (type === "application/pdf" || /\.pdf$/i.test(name || "")) return "pdf";
  return "file";
}

/* ---------- small preview builder shared by both bar and message ---- */
function Preview({ a, size }) {
  const kind = kindOf(a.type, a.name);
  const dim = { width: size, height: size };
  const uploading = a.status === "uploading";

  let content;
  if (kind === "image" && a.url) {
    content = <img src={a.url} alt={a.name} className="attachment-thumb" style={dim} />;
  } else if (kind === "pdf" && a.url) {
    content = (
      <div className="attachment-thumb attachment-thumb-pdf" style={dim}>
        <object data={`${a.url}#page=1&view=FitH`} type="application/pdf" className="attachment-pdf-object">
          <div className="attachment-fallback-icon"><FileText size={20} /></div>
        </object>
        <span className="attachment-ext-badge">PDF</span>
      </div>
    );
  } else {
    const ext = extensionOf(a.name);
    content = (
      <div className="attachment-thumb attachment-thumb-generic" style={dim}>
        <FileIcon size={20} className="attachment-fallback-icon" />
        {ext && <span className="attachment-ext-badge">{ext}</span>}
      </div>
    );
  }

  if (!uploading) return content;

  return (
    <div className="attachment-preview-wrap" style={dim}>
      {content}
      <div className="attachment-uploading-overlay">
        <Loader2 size={16} className="spin" />
      </div>
    </div>
  );
}

/* ---------- pending attachments, shown above the composer ----------- */
export function AttachmentBar({ attachments, onRemove, uploadingLabel }) {
  if (!attachments.length) return null;
  return (
    <div className="attachment-bar">
      {attachments.map((a) => (
        <div className={`attachment-card ${a.status === "uploading" ? "attachment-card-uploading" : ""}`} key={a.id}>
          <Preview a={a} size={52} />
          <div className="attachment-card-meta">
            <span className="attachment-chip-name">{a.name}</span>
            <span className="attachment-chip-size">
              {a.status === "uploading" ? `${uploadingLabel} ${Math.round(a.progress || 0)}%` : formatFileSize(a.size)}
            </span>
          </div>
          <button
            type="button"
            className="attachment-chip-remove"
            onClick={() => onRemove(a.id)}
            title="Retirer"
          >
            <X size={12} />
          </button>
        </div>
      ))}
    </div>
  );
}

/* ---------- attachments rendered inside a sent user message ---------- */
export function MessageAttachments({ attachments }) {
  if (!attachments || !attachments.length) return null;
  return (
    <div className="msg-attachments">
      {attachments.map((a) => (
        <a
          className="msg-attachment-card"
          key={a.id}
          href={a.url || undefined}
          target="_blank"
          rel="noreferrer"
          title={a.name}
        >
          <Preview a={a} size={88} />
          <div className="msg-attachment-meta">
            <span className="attachment-chip-name">{a.name}</span>
            <span className="attachment-chip-size">{formatFileSize(a.size)}</span>
          </div>
          {a.url && <ExternalLink size={12} className="msg-attachment-open" />}
        </a>
      ))}
    </div>
  );
}

export { Paperclip };