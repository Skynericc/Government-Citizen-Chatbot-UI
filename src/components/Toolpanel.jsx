import React, { useState } from "react";
import { ChevronDown, ChevronUp, Loader2, CheckCircle2 } from "lucide-react";

/* ------------------------------------------------------------------ */
/* Tool / MCP execution progress panel.                                */
/* citizen mode  -> single plain-language status line                  */
/* detailed mode -> expandable panel with per-step name/status/summary */
/* ------------------------------------------------------------------ */

export default function ToolPanel({ steps, activeIndex, detailed, t }) {
  const [expanded, setExpanded] = useState(false);

  if (!detailed) {
    const current = steps[Math.min(activeIndex, steps.length - 1)];
    const finished = activeIndex >= steps.length;
    if (finished) return null;
    return (
      <div className="tool-citizen">
        <Loader2 size={14} className="spin" />
        <span>{current.label}</span>
      </div>
    );
  }

  return (
    <div className="tool-detailed">
      <button className="tool-detailed-toggle" onClick={() => setExpanded(e => !e)}>
        <span>{t.toolPanelTitle}</span>
        {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
      </button>
      {expanded && (
        <div className="tool-detailed-list">
          {steps.map((s, idx) => {
            const state = idx < activeIndex ? "done" : idx === activeIndex ? "running" : "pending";
            if (state === "pending") return null;
            return (
              <div className="tool-row" key={s.name}>
                <div className="tool-row-head">
                  {state === "done" ? (
                    <CheckCircle2 size={14} className="tool-icon-done" />
                  ) : (
                    <Loader2 size={14} className="spin tool-icon-running" />
                  )}
                  <span className="tool-name">{s.name}</span>
                  <span className={`tool-status tool-status-${state}`}>{t.status[state] || t.status.running}</span>
                  {state === "done" && <span className="tool-time">0.{4 + idx}s</span>}
                </div>
                {state === "done" && (
                  <div className="tool-row-summary">{s.summary}</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}