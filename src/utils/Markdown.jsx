import React from "react";
import { CitationMark } from "../components/Citations.jsx";

/* ------------------------------------------------------------------ */
/* Minimal markdown renderer (headers, bold, lists, links, tables,      */
/* and a `[[n]]` citation-marker token — see components/Citations.jsx). */
/* Swap for a full library (e.g. react-markdown) if richer content     */
/* support is needed later — kept dependency-free for this demo.       */
/* ------------------------------------------------------------------ */

export function renderInline(text, keyBase, citations) {
  const parts = [];
  const regex = /(\*\*([^*]+)\*\*)|(\[([^\]]+)\]\(([^)]+)\))|(\[\[(\d+)\]\])/g;
  const byId = citations ? Object.fromEntries(citations.map(c => [String(c.id), c])) : {};
  let last = 0, m, i = 0;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    if (m[1]) {
      parts.push(<strong key={`${keyBase}-b-${i++}`}>{m[2]}</strong>);
    } else if (m[3]) {
      parts.push(
        <a key={`${keyBase}-a-${i++}`} href={m[5]} target="_blank" rel="noreferrer" className="msg-link">
          {m[4]}
        </a>
      );
    } else if (m[6]) {
      const n = m[7];
      parts.push(<CitationMark key={`${keyBase}-c-${i++}`} keyBase={`${keyBase}-c-${i}`} n={n} citation={byId[n]} />);
    }
    last = regex.lastIndex;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

export function parseMarkdown(md, citations) {
  const lines = md.split("\n");
  const blocks = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === "") { i++; continue; }

    // table
    if (line.includes("|") && lines[i + 1] && /^\s*\|?\s*:?-{2,}/.test(lines[i + 1].replace(/\|/g, "|"))) {
      const headerCells = line.split("|").map(c => c.trim()).filter(Boolean);
      i += 2;
      const rows = [];
      while (i < lines.length && lines[i].includes("|") && lines[i].trim() !== "") {
        rows.push(lines[i].split("|").map(c => c.trim()).filter(Boolean));
        i++;
      }
      blocks.push(
        <div className="msg-table-wrap" key={`t-${key++}`}>
          <table className="msg-table">
            <thead>
              <tr>{headerCells.map((c, ci) => <th key={ci}>{renderInline(c, `th-${key}-${ci}`, citations)}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((r, ri) => (
                <tr key={ri}>{r.map((c, ci) => <td key={ci}>{renderInline(c, `td-${key}-${ri}-${ci}`, citations)}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    // headers
    if (/^#{1,3}\s/.test(line)) {
      const level = line.match(/^#+/)[0].length;
      const content = line.replace(/^#{1,3}\s/, "");
      const Tag = level === 1 ? "h3" : level === 2 ? "h4" : "h5";
      blocks.push(<Tag className="msg-heading" key={`h-${key++}`}>{renderInline(content, `h-${key}`, citations)}</Tag>);
      i++;
      continue;
    }

    // numbered list
    if (/^\d+\.\s/.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s/, ""));
        i++;
      }
      blocks.push(
        <ol className="msg-list" key={`ol-${key++}`}>
          {items.map((it, ii) => <li key={ii}>{renderInline(it, `oli-${key}-${ii}`, citations)}</li>)}
        </ol>
      );
      continue;
    }

    // bullet list
    if (/^[-*]\s/.test(line)) {
      const items = [];
      while (i < lines.length && /^[-*]\s/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*]\s/, ""));
        i++;
      }
      blocks.push(
        <ul className="msg-list" key={`ul-${key++}`}>
          {items.map((it, ii) => <li key={ii}>{renderInline(it, `uli-${key}-${ii}`, citations)}</li>)}
        </ul>
      );
      continue;
    }

    // paragraph
    blocks.push(<p className="msg-paragraph" key={`p-${key++}`}>{renderInline(line, `p-${key}`, citations)}</p>);
    i++;
  }

  return blocks;
}