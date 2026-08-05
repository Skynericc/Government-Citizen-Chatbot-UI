import React, { useState } from "react";
import { ChevronDown, ChevronUp, Loader2, CheckCircle2 } from "lucide-react";

/* ------------------------------------------------------------------ */
/* Tool / MCP execution progress panel.                                */
/*                                                                      */
/* citizen mode  -> single plain-language status line (`citizenLabel`)  */
/* detailed mode -> expandable list of individual tool calls (`tools`)  */
/*                                                                      */
/* `tools` is a flat array built live from tool_start/tool_end SSE      */
/* events (real backend) or synthesized from the demo steps (no         */
/* backend configured) — see CitizenAssistant.jsx. Both paths produce   */
/* the same shape: { callId, name, status: "running"|"done", output?,   */
/* startedAt?, endedAt? }, so this component doesn't need to know which */
/* mode produced them.                                                  */
/*                                                                      */
/* `tools` can legitimately be empty (a cache_hit answers in one shot,  */
/* per contrat §1.2, with no tool_start/tool_end at all) — in that case */
/* we fall back to the same single line as citizen mode instead of      */
/* showing an empty, confusing panel.                                   */
/* ------------------------------------------------------------------ */

function elapsedSeconds(tool) {
  if (!tool.startedAt) return null;
  const end = tool.endedAt || Date.now();
  return ((end - tool.startedAt) / 1000).toFixed(1);
}

function truncate(str, max) {
  return str.length > max ? `${str.slice(0, max)}…` : str;
}

export default function ToolPanel({ tools = [], citizenLabel, detailed, t }) {
  const [expanded, setExpanded] = useState(false);

  if (!detailed || tools.length === 0) {
    if (!citizenLabel) return null;
    return (
      <div className="tool-citizen">
        <Loader2 size={14} className="spin" />
        <span>{citizenLabel}</span>
      </div>
    );
  }

  return (
    <div className="tool-detailed">
      <button type="button" className="tool-detailed-toggle" onClick={() => setExpanded((e) => !e)}>
        <span>{t.toolPanelTitle}</span>
        {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
      </button>
      {expanded && (
        <div className="tool-detailed-list">
          {tools.map((tool) => (
            <div className="tool-row" key={tool.callId}>
              <div className="tool-row-head">
                {tool.status === "done" ? (
                  <CheckCircle2 size={14} className="tool-icon-done" />
                ) : (
                  <Loader2 size={14} className="spin tool-icon-running" />
                )}
                <span className="tool-name">{tool.name}</span>
                <span className={`tool-status tool-status-${tool.status}`}>
                  {t.status[tool.status] || t.status.running}
                </span>
                {tool.status === "done" && elapsedSeconds(tool) && (
                  <span className="tool-time">{elapsedSeconds(tool)}s</span>
                )}
              </div>
              {tool.status === "done" && tool.output && (
                <div className="tool-row-summary">{truncate(String(tool.output), 220)}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}