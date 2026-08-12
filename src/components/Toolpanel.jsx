import React, { useMemo, useState } from "react";
import {
  Braces,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  Database,
  Layers3,
  Loader2,
  Search,
  Sparkles,
} from "lucide-react";

const MAX_TECHNICAL_DETAIL_CHARS = 6000;

function elapsedSeconds(tool) {
  if (!tool.startedAt) return null;
  const end = tool.endedAt || Date.now();
  return ((end - tool.startedAt) / 1000).toFixed(1);
}

function parseJson(value) {
  if (value && typeof value === "object") return value;
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function technicalText(value) {
  const parsed = parseJson(value);
  let text;
  if (parsed && typeof parsed.result === "string" && Object.keys(parsed).length === 1) {
    text = parsed.result.trim();
  } else if (parsed) {
    text = JSON.stringify(parsed, null, 2);
  } else {
    text = String(value || "").trim();
  }

  return {
    text: text.slice(0, MAX_TECHNICAL_DETAIL_CHARS),
    truncated: text.length > MAX_TECHNICAL_DETAIL_CHARS,
  };
}

function summarizeTool(tool, t) {
  const args = parseJson(tool.args);
  const output = parseJson(tool.output);
  const outputText = typeof output?.result === "string"
    ? output.result
    : typeof tool.output === "string" ? tool.output : "";
  const resultMarkers = outputText.match(/^=== .*?Result \d+ ===$/gm) || [];
  const procedureTitles = [...outputText.matchAll(/^proc_title:\s*(.+)$/gm)]
    .map((match) => match[1].trim())
    .filter(Boolean);

  const stats = [];
  if (resultMarkers.length) stats.push({ value: resultMarkers.length, label: t.resultsLabel });
  if (Array.isArray(args?.first_or)) stats.push({ value: args.first_or.length, label: t.keywordsLabel });
  if (Array.isArray(args?.semantic_queries)) stats.push({ value: args.semantic_queries.length, label: t.queriesLabel });

  return {
    args,
    stats,
    firstProcedureTitle: procedureTitles[0] || "",
    inputDetail: technicalText(tool.args),
    outputDetail: technicalText(tool.output),
  };
}

function toolIcon(name) {
  if (name === "super_hybrid_search") return Search;
  if (name === "get_items_by_indices") return Database;
  if (name === "let_us_deepdive_chunkwise") return Layers3;
  return Braces;
}

function ToolRow({ tool, t }) {
  const [showDetails, setShowDetails] = useState(false);
  const summary = useMemo(() => summarizeTool(tool, t), [tool, t]);
  const Icon = toolIcon(tool.name);
  const friendlyName = t.toolNames?.[tool.name] || tool.display || tool.name;
  const duration = elapsedSeconds(tool);
  const hasDetails = Boolean(summary.inputDetail.text || summary.outputDetail.text);

  return (
    <article className={`tool-card tool-card-${tool.status}`}>
      <div className="tool-card-main">
        <span className="tool-card-icon" aria-hidden="true">
          <Icon size={17} />
        </span>
        <div className="tool-card-content">
          <div className="tool-card-title-row">
            <span className="tool-name">{friendlyName}</span>
            <span className={`tool-status tool-status-${tool.status}`}>
              {tool.status === "done" ? <CheckCircle2 size={12} /> : <Loader2 size={12} className="spin" />}
              {t.status[tool.status] || t.status.running}
            </span>
            {duration && (
              <span className="tool-time"><Clock3 size={12} />{duration}s</span>
            )}
          </div>

          {summary.stats.length > 0 && (
            <div className="tool-stats">
              {summary.stats.map((stat) => (
                <span className="tool-stat" key={stat.label}>
                  <strong>{stat.value}</strong> {stat.label}
                </span>
              ))}
            </div>
          )}

          {summary.firstProcedureTitle && (
            <p className="tool-result-preview" dir="auto">{summary.firstProcedureTitle}</p>
          )}

          {hasDetails && (
            <button
              type="button"
              className="tool-technical-toggle"
              aria-expanded={showDetails}
              onClick={() => setShowDetails((current) => !current)}
            >
              <Braces size={13} />
              {showDetails ? t.hideTechnicalDetails : t.inputsOutputs}
              {showDetails ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          )}
        </div>
      </div>

      {showDetails && hasDetails && (
        <div className="tool-technical-grid">
          {summary.inputDetail.text && (
            <section className="tool-technical-section">
              <div className="tool-technical-label">{t.toolInput}</div>
              <pre dir="auto">{summary.inputDetail.text}</pre>
              {summary.inputDetail.truncated && <span className="tool-truncated">{t.outputTruncated}</span>}
            </section>
          )}
          {summary.outputDetail.text && (
            <section className="tool-technical-section">
              <div className="tool-technical-label">{t.toolOutput}</div>
              <pre dir="auto">{summary.outputDetail.text}</pre>
              {summary.outputDetail.truncated && <span className="tool-truncated">{t.outputTruncated}</span>}
            </section>
          )}
        </div>
      )}
    </article>
  );
}

export default function ToolPanel({ tools = [], citizenLabel, detailed, active, t }) {
  const [expanded, setExpanded] = useState(true);
  const completedCount = tools.filter((tool) => tool.status === "done").length;
  const totalDuration = tools.reduce((total, tool) => {
    if (!tool.startedAt || !tool.endedAt) return total;
    return total + (tool.endedAt - tool.startedAt);
  }, 0);

  if (!detailed || tools.length === 0) {
    if (!citizenLabel) return null;
    return (
      <div className="tool-citizen">
        {active ? <Loader2 size={14} className="spin" /> : <CheckCircle2 size={14} className="tool-icon-done" />}
        <span>{active ? citizenLabel : (t.processingComplete || citizenLabel)}</span>
      </div>
    );
  }

  return (
    <section className="tool-detailed">
      <button
        type="button"
        className="tool-detailed-toggle"
        aria-expanded={expanded}
        onClick={() => setExpanded((current) => !current)}
      >
        <span className="tool-panel-heading">
          <span className="tool-panel-icon"><Sparkles size={16} /></span>
          <span>
            <strong>{t.toolPanelTitle}</strong>
            <small>{completedCount}/{tools.length} {t.toolCallsLabel}</small>
          </span>
        </span>
        <span className="tool-panel-meta">
          {totalDuration > 0 && <span><Clock3 size={12} />{(totalDuration / 1000).toFixed(1)}s</span>}
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>
      {expanded && (
        <div className="tool-detailed-list">
          {tools.map((tool) => <ToolRow tool={tool} t={t} key={tool.callId} />)}
        </div>
      )}
    </section>
  );
}
