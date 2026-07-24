import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Send, Mic, Square, X, Check, Copy, Volume2, ThumbsUp, ThumbsDown,
  Flag, Share2, Settings, ChevronDown, ChevronUp, Loader2, ShieldCheck,
  CheckCircle2, Circle, Landmark
} from "lucide-react";
import CSS from "./utils/styles.css?inline"
import { STRINGS } from "./constants/Strings"
import { ANSWERS } from "./constants/Answers";
import Expandable from "./components/Expandable.jsx"
import MessageActions from "./components/MessageActions";
import ToolPanel from "./components/Toolpanel.jsx";
import { renderInline, parseMarkdown } from "./utils/Markdown.jsx";

/* ------------------------------------------------------------------ */
/* Main component                                                      */
/* ------------------------------------------------------------------ */

export default function CitizenAssistant() {
  const [language, setLanguage] = useState("fr");
  const [primaryColor, setPrimaryColor] = useState("#1B4F72");
  const [institutionName, setInstitutionName] = useState("Royaume du Maroc — Portail Citoyen");
  const [customSubtitle, setCustomSubtitle] = useState("");
  const [detailedMode, setDetailedMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const scrollRef = useRef(null);
  const recordTimerRef = useRef(null);
  const genTimeoutsRef = useRef([]);
  const textareaRef = useRef(null);

  const t = STRINGS[language];

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    return () => {
      clearInterval(recordTimerRef.current);
      genTimeoutsRef.current.forEach(clearTimeout);
    };
  }, []);

  const clearGenTimeouts = () => {
    genTimeoutsRef.current.forEach(clearTimeout);
    genTimeoutsRef.current = [];
  };

  const startGeneration = useCallback((assistantId) => {
    const steps = t.steps;
    const answer = ANSWERS[language];

    // advance tool step index
    let stepIdx = 0;
    setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, toolStepIndex: 0, phase: "tools" } : m));

    steps.forEach((_, idx) => {
      const to = setTimeout(() => {
        stepIdx = idx + 1;
        setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, toolStepIndex: stepIdx } : m));
        if (stepIdx === steps.length) {
          // start streaming text
          const full = answer.text;
          let pos = 0;
          const chunkSize = 4;
          const streamInterval = setInterval(() => {
            pos += chunkSize;
            const slice = full.slice(0, pos);
            setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: slice, phase: "streaming" } : m));
            if (pos >= full.length) {
              clearInterval(streamInterval);
              setMessages(prev => prev.map(m => m.id === assistantId ? {
                ...m, content: full, phase: "done", expandable: {
                  title: answer.expandableTitle, body: answer.expandableBody,
                }
              } : m));
              setIsGenerating(false);
            }
          }, 18);
          genTimeoutsRef.current.push(streamInterval);
        }
      }, 650 * (idx + 1));
      genTimeoutsRef.current.push(to);
    });
  }, [language, t]);

  const sendMessage = (rawText) => {
    const text = rawText.trim();
    if (!text || isGenerating) return;
    const userId = `u-${Date.now()}`;
    const assistantId = `a-${Date.now() + 1}`;

    setMessages(prev => [
      ...prev,
      { id: userId, role: "user", content: text },
      { id: assistantId, role: "assistant", content: "", phase: "tools", toolStepIndex: 0, feedback: null },
    ]);
    setInput("");
    setIsGenerating(true);
    startGeneration(assistantId);
  };

  const stopGeneration = () => {
    clearGenTimeouts();
    setIsGenerating(false);
    setMessages(prev => prev.map(m =>
      m.phase && m.phase !== "done" ? { ...m, phase: "done" } : m
    ));
  };

  const handleFeedback = (id, value) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, feedback: value } : m));
  };

  const startRecording = () => {
    setIsRecording(true);
    setRecordingSeconds(0);
    recordTimerRef.current = setInterval(() => setRecordingSeconds(s => s + 1), 1000);
  };
  const cancelRecording = () => {
    clearInterval(recordTimerRef.current);
    setIsRecording(false);
    setRecordingSeconds(0);
  };
  const sendRecording = () => {
    clearInterval(recordTimerRef.current);
    setIsRecording(false);
    const mm = String(Math.floor(recordingSeconds / 60)).padStart(2, "0");
    const ss = String(recordingSeconds % 60).padStart(2, "0");
    setRecordingSeconds(0);
    sendMessage(language === "ar" ? `رسالة صوتية (${mm}:${ss})` : `Message vocal (${mm}:${ss})`);
  };

  const formatTimer = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const onTextareaKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const displaySubtitle = customSubtitle || t.subtitle;
  const hasStarted = messages.length > 0;

  return (
    <div
      className="app-root"
      dir={t.dir}
      style={{ "--primary": primaryColor }}
    >
      <style>{CSS}</style>

      <header className="app-header">
        <div className="app-header-inner">
          <div className="brand">
            <div className="brand-logo">
              <ShieldCheck size={20} />
            </div>
            <div className="brand-text">
              <div className="brand-name">{institutionName}</div>
              <div className="brand-subtitle">{displaySubtitle}</div>
            </div>
          </div>
          <button className="settings-btn" onClick={() => setShowSettings(s => !s)} title={t.settingsTitle}>
            <Settings size={18} />
          </button>
        </div>

        {showSettings && (
          <div className="settings-panel">
            <div className="settings-title">{t.settingsTitle}</div>

            <label className="settings-field">
              <span>{t.institutionLabel}</span>
              <input value={institutionName} onChange={e => setInstitutionName(e.target.value)} />
            </label>

            <label className="settings-field">
              <span>{t.subtitleLabel}</span>
              <input value={customSubtitle} placeholder={t.subtitle} onChange={e => setCustomSubtitle(e.target.value)} />
            </label>

            <label className="settings-field settings-field-row">
              <span>{t.colorLabel}</span>
              <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} />
            </label>

            <label className="settings-field settings-field-row">
              <span>{t.languageLabel}</span>
              <select value={language} onChange={e => setLanguage(e.target.value)}>
                <option value="fr">Français</option>
                <option value="en">English</option>
                <option value="ar">العربية</option>
              </select>
            </label>

            <div className="settings-field settings-field-row">
              <span>{t.displayMode}</span>
              <div className="mode-toggle">
                <button
                  className={`mode-toggle-btn ${!detailedMode ? "active" : ""}`}
                  onClick={() => setDetailedMode(false)}
                >
                  {t.citizenMode}
                </button>
                <button
                  className={`mode-toggle-btn ${detailedMode ? "active" : ""}`}
                  onClick={() => setDetailedMode(true)}
                >
                  {t.detailedMode}
                </button>
              </div>
            </div>

            <button className="settings-close" onClick={() => setShowSettings(false)}>{t.close}</button>
          </div>
        )}
      </header>

      <main className="app-main" ref={scrollRef}>
        <div className="app-main-inner">
          {!hasStarted && (
            <div className="welcome">
              <div className="welcome-logo">
                <ShieldCheck size={34} />
              </div>
              <h1 className="welcome-title">{t.welcomeTitle}</h1>
              <p className="welcome-message">{t.welcomeMessage}</p>
              <div className="suggested-grid">
                {t.suggested.map((q, idx) => (
                  <button key={idx} className="suggested-chip" onClick={() => sendMessage(q)}>
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {hasStarted && (
            <div className="messages">
              {messages.map((m) => {
                if (m.role === "user") {
                  return (
                    <div className="msg-row msg-row-user" key={m.id}>
                      <div className="msg-bubble msg-bubble-user">{m.content}</div>
                    </div>
                  );
                }
                const showTools = m.phase === "tools";
                return (
                  <div className="msg-row msg-row-assistant" key={m.id}>
                    <div className="assistant-avatar">
                      <Landmark size={14} />
                    </div>
                    <div className="assistant-col">
                      {showTools && (
                        <ToolPanel
                          steps={t.steps}
                          activeIndex={m.toolStepIndex}
                          detailed={detailedMode}
                          t={t}
                        />
                      )}
                      {m.phase !== "tools" && (
                        <div className="msg-bubble msg-bubble-assistant">
                          {parseMarkdown(m.content)}
                          {m.phase === "streaming" && <span className="caret" />}
                          {m.phase === "done" && m.expandable && (
                            <Expandable
                              title={m.expandable.title}
                              body={m.expandable.body}
                              seeMore={t.seeMore}
                              seeLess={t.seeLess}
                            />
                          )}
                        </div>
                      )}
                      {m.phase === "done" && (
                        <MessageActions
                          t={t}
                          text={m.content}
                          feedback={m.feedback}
                          onFeedback={(v) => handleFeedback(m.id, v)}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <footer className="app-footer">
        <div className="app-footer-inner">
          {isRecording ? (
            <div className="recorder-bar">
              <div className="recorder-indicator">
                <span className="recorder-dot" />
                <span>{t.recording}</span>
              </div>
              <div className="recorder-timer">{formatTimer(recordingSeconds)}</div>
              <div className="recorder-actions">
                <button className="icon-btn icon-btn-ghost" title={t.cancel} onClick={cancelRecording}>
                  <X size={17} />
                </button>
                <button className="icon-btn icon-btn-primary" title={t.sendRecording} onClick={sendRecording}>
                  <Check size={17} />
                </button>
              </div>
            </div>
          ) : (
            <div className="composer">
              <textarea
                ref={textareaRef}
                className="composer-input"
                placeholder={t.placeholder}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onTextareaKeyDown}
              />
              <div className="composer-actions">
                <button className="icon-btn" title="Mic" onClick={startRecording} disabled={isGenerating}>
                  <Mic size={18} />
                </button>
                {isGenerating ? (
                  <button className="send-btn send-btn-stop" title={t.stop} onClick={stopGeneration}>
                    <Square size={15} fill="currentColor" />
                  </button>
                ) : (
                  <button
                    className="send-btn"
                    title={t.send}
                    onClick={() => sendMessage(input)}
                    disabled={!input.trim()}
                  >
                    <Send size={16} />
                  </button>
                )}
              </div>
            </div>
          )}
          <div className="disclaimer">{t.disclaimer}</div>
        </div>
      </footer>
    </div>
  );
}
