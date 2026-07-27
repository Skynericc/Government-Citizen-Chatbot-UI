import React from "react";
import { Paperclip, X, FileText, Image as ImageIcon, File as FileIcon } from "lucide-react";

/* ------------------------------------------------------------------ */
/* Renders the row of pending-attachment chips above the composer,     */
/* and the read-only chips shown inside a sent user message.           */
/* ------------------------------------------------------------------ */

export function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function iconFor(type) {
  if (type?.startsWith("image/")) return ImageIcon;
  if (type === "application/pdf" || type?.includes("word")) return FileText;
  return FileIcon;
}

export function AttachmentBar({ attachments, onRemove }) {
  if (!attachments.length) return null;
  return (
    <div className="attachment-bar">
      {attachments.map((a) => {
        const Icon = iconFor(a.type);
        return (
          <div className="attachment-chip" key={a.id}>
            <Icon size={14} className="attachment-chip-icon" />
            <span className="attachment-chip-name">{a.name}</span>
            <span className="attachment-chip-size">{formatFileSize(a.size)}</span>
            <button
              type="button"
              className="attachment-chip-remove"
              onClick={() => onRemove(a.id)}
              title="Retirer"
            >
              <X size={12} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

export function MessageAttachments({ attachments }) {
  if (!attachments || !attachments.length) return null;
  return (
    <div className="msg-attachments">
      {attachments.map((a) => {
        const Icon = iconFor(a.type);
        return (
          <div className="msg-attachment-chip" key={a.id}>
            <Icon size={13} className="attachment-chip-icon" />
            <span className="attachment-chip-name">{a.name}</span>
            <span className="attachment-chip-size">{formatFileSize(a.size)}</span>
          </div>
        );
      })}
    </div>
  );
}

export { Paperclip };
