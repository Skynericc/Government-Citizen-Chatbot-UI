import React, { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Database,
  Layers3,
  Loader2,
  Search,
  Sparkles,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* This component only ever reads: callId, name (used solely as an     */
/* icon/label LOOKUP KEY, never printed), display, status, startedAt,  */
/* endedAt, and a pre-vetted plain-text `summary`. It never reads or   */
/* renders tool.args or tool.output — those are intentionally not      */
/* even present in message state (see CitizenAssistant.jsx).           */
/* ------------------------------------------------------------------ */

function roundedSeconds(tool) {
  if (!tool.startedAt) return null;
  const end = tool.endedAt || Date.now();
  const seconds = Math.round((end - tool.startedAt) / 1000);
  return seconds > 0 ? seconds : null;
}

// Decorative icon only, chosen from the technical name — never displayed
// as text. Unknown/unmapped tools get a neutral generic icon.
function toolIcon(name) {
  if (name === "super_hybrid_search") return Search;
  if (name === "get_items_by_indices") return Database;
  if (name === "let_us_deepdive_chunkwise") return Layers3;
  return Sparkles;
}

function friendlyLabel(tool, t) {
  return tool.display || t.toolNames?.[tool.name] || t.toolNameFallback;
}

function TimelineStep({ tool, t }) {
  const Icon = toolIcon(tool.name);
  const label = friendlyLabel(tool, t);
  const seconds = roundedSeconds(tool);

  return (
    <div className={`tool-step tool-step-${tool.status}`}>
      <span className="tool-step-marker" aria-hidden="true">
        {tool.status === "running" && <Icon size={12} />}
        {tool.status === "done" && <CheckCircle2 size={12} />}
        {tool.status === "error" && <AlertTriangle size={12} />}
      </span>
      <div className="tool-step-body">
        <div className="tool-step-title-row">
          <span className="tool-step-label" dir="auto">{label}</span>
          {seconds && <span className="tool-step-time"><Clock3 size={10} />{seconds}s</span>}
        </div>
        {tool.status === "error" && (
          <p className="tool-step-summary">{t.toolStepFailedLabel}</p>
        )}
        {tool.status === "done" && tool.summary && (
          <p className="tool-step-summary" dir="auto">{tool.summary}</p>
        )}
      </div>
    </div>
  );
}

function ThinkingStep({ t }) {
  return (
    <div className="tool-step tool-step-thinking">
      <span className="tool-step-marker" aria-hidden="true">
        <span className="tool-pulse-dot" />
      </span>
      <div className="tool-step-body">
        <div className="tool-step-title-row">
          <span className="tool-step-label">{t.thinkingLabel}</span>
        </div>
      </div>
    </div>
  );
}

export default function ToolPanel({ tools = [], citizenLabel, thinking, detailed, active, t }) {
  const [expanded, setExpanded] = useState(true);
  const userToggledRef = useRef(false);
  const wasActiveRef = useRef(active);

  // Auto-collapse into a compact summary once processing finishes, unless
  // the citizen already interacted with the toggle themselves.
  useEffect(() => {
    if (wasActiveRef.current && !active && !userToggledRef.current) {
      setExpanded(false);
    }
    wasActiveRef.current = active;
  }, [active]);

  const toggle = () => {
    userToggledRef.current = true;
    setExpanded((v) => !v);
  };

  const completedCount = tools.filter((tool) => tool.status !== "running").length;
  const totalSeconds = tools.reduce((total, tool) => {
    if (!tool.startedAt || !tool.endedAt) return total;
    return total + (tool.endedAt - tool.startedAt);
  }, 0);
  const roundedTotal = Math.round(totalSeconds / 1000);

  // A screen-reader-only live region announces progress in every display
  // mode, since the visual timeline alone isn't announced automatically.
  const liveLabel = thinking ? t.thinkingLabel : citizenLabel;
  const liveRegion = liveLabel ? <span className="sr-only" role="status" aria-live="polite">{liveLabel}</span> : null;

  if (!detailed || tools.length === 0) {
    if (!citizenLabel && !thinking) return null;
    return (
      <div className={`tool-citizen${thinking ? " tool-citizen-thinking" : ""}`}>
        {liveRegion}
        {active
          ? (thinking ? <span className="tool-pulse-dot" aria-hidden="true" /> : <Loader2 size={14} className="spin" aria-hidden="true" />)
          : <CheckCircle2 size={14} className="tool-icon-done" aria-hidden="true" />}
        <span>{active ? (thinking ? t.thinkingLabel : citizenLabel) : (t.processingComplete || citizenLabel)}</span>
      </div>
    );
  }

  return (
    <section className="tool-panel">
      {liveRegion}
      <button
        type="button"
        className="tool-panel-toggle"
        aria-expanded={expanded}
        onClick={toggle}
      >
        <span className="tool-panel-heading">
          <span className={`tool-panel-icon${active ? " tool-panel-icon-active" : ""}`} aria-hidden="true">
            {active ? <Loader2 size={15} className="spin" /> : <CheckCircle2 size={15} />}
          </span>
          <span>
            <strong>{active ? (thinking ? t.thinkingLabel : citizenLabel) : t.toolPanelTitle}</strong>
            <small>{completedCount} {t.toolCallsLabel}</small>
          </span>
        </span>
        <span className="tool-panel-meta">
          {roundedTotal > 0 && <span><Clock3 size={12} />{roundedTotal}s</span>}
        </span>
      </button>
      {expanded && (
        <div className="tool-timeline">
          {tools.map((tool) => <TimelineStep tool={tool} t={t} key={tool.callId} />)}
          {thinking && <ThinkingStep t={t} />}
        </div>
      )}
    </section>
  );
}
