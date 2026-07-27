import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Send, Mic, Square, X, Check, Copy, Volume2, ThumbsUp, ThumbsDown,
  Flag, Share2, Settings, ChevronDown, ChevronUp, Loader2,
  CheckCircle2, Landmark, Paperclip
} from "lucide-react";
import CSS from "./utils/styles.css?inline"
import { STRINGS } from "./constants/Strings"
import { ANSWERS } from "./constants/Answers";
import Expandable from "./components/Expandable.jsx"
import MessageActions from "./components/MessageActions";
import ToolPanel from "./components/Toolpanel.jsx";
import { AttachmentBar, MessageAttachments } from "./components/Attachments.jsx";
import AudioPlayer from "./components/AudioPlayer.jsx";
import { useVoiceRecorder } from "./utils/useVoiceRecorder.js";
import { renderInline, parseMarkdown } from "./utils/Markdown.jsx";
import ministryLogo from "./assets/ministry-logo.svg";

const MAX_FILES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/* ------------------------------------------------------------------ */
/* Main component                                                      */
/* ------------------------------------------------------------------ */

export default function CitizenAssistant() {
  const [language, setLanguage] = useState("fr");
  const [primaryColor, setPrimaryColor] = useState("#1175BA");
  const [institutionName, setInstitutionName] = useState("Royaume du Maroc — Ministère de la Transition Numérique");
  const [customSubtitle, setCustomSubtitle] = useState("");
  const [detailedMode, setDetailedMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [attachError, setAttachError] = useState("");

  const recorder = useVoiceRecorder();

  const scrollRef = useRef(null);
  const genTimeoutsRef = useRef([]);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  const t = STRINGS[language];

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }, [input]);

  useEffect(() => {
    return () => {
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

  const sendMessage = (rawText, audio = null) => {
    const text = rawText.trim();
    if ((!text && attachments.length === 0 && !audio) || isGenerating) return;
    const userId = `u-${Date.now()}`;
    const assistantId = `a-${Date.now() + 1}`;

    setMessages(prev => [
      ...prev,
      { id: userId, role: "user", content: text, attachments, audio },
      { id: assistantId, role: "assistant", content: "", phase: "tools", toolStepIndex: 0, feedback: null },
    ]);
    setInput("");
    setAttachments([]);
    setAttachError("");
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

  const openFilePicker = () => fileInputRef.current?.click();

  const handleFilesSelected = (e) => {
    const picked = Array.from(e.target.files || []);
    e.target.value = ""; // allow re-picking the same file later
    if (!picked.length) return;

    let next = [...attachments];
    let error = "";
    for (const file of picked) {
      if (next.length >= MAX_FILES) { error = t.maxFiles; break; }
      if (file.size > MAX_FILE_SIZE) { error = t.maxFiles; continue; }
      next.push({
        id: `f-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: file.name,
        size: file.size,
        type: file.type,
        url: URL.createObjectURL(file),
      });
    }
    setAttachments(next);
    setAttachError(error);
  };

  const removeAttachment = (id) => {
    setAttachments(prev => {
      const target = prev.find(a => a.id === id);
      if (target?.url) URL.revokeObjectURL(target.url);
      return prev.filter(a => a.id !== id);
    });
    setAttachError("");
  };

  const startRecording = () => recorder.start();
  const cancelRecording = () => recorder.cancel();
  const sendRecording = async () => {
    const result = await recorder.finish();
    if (result) sendMessage("", result);
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
        <div className="header-accent-primary" />
        <div className="header-accent-gold" />
        <div className="app-header-inner">
          <div className="brand">
            <img src={ministryLogo} alt={institutionName} className="brand-logo-img" />
            <div className="brand-divider" />
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
              <img src={ministryLogo} alt="" className="welcome-logo-img" />
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
                      <div className="assistant-col" style={{ alignItems: "flex-end" }}>
                        <MessageAttachments attachments={m.attachments} />
                        {m.audio && <AudioPlayer url={m.audio.url} fallbackDuration={m.audio.duration} />}
                        {m.content && <div className="msg-bubble msg-bubble-user">{m.content}</div>}
                      </div>
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
          {recorder.isRecording ? (
            <div className="recorder-bar">
              <div className="recorder-indicator">
                <span className="recorder-dot" />
                <span>{t.recording}</span>
              </div>
              <div className="recorder-timer">{formatTimer(recorder.seconds)}</div>
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
              <AttachmentBar attachments={attachments} onRemove={removeAttachment} />
              {attachError && <div className="attach-error">{attachError}</div>}
              {recorder.error === "permission" && <div className="attach-error">{t.micPermissionError}</div>}
              {recorder.error === "unsupported" && <div className="attach-error">{t.micUnsupported}</div>}
              <div className="composer-row">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="file-input-hidden"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={handleFilesSelected}
                />
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
                  <button className="icon-btn" title={t.attach} onClick={openFilePicker} disabled={isGenerating}>
                    <Paperclip size={18} />
                  </button>
                  <button className="icon-btn" title={t.recordTooltip} onClick={startRecording} disabled={isGenerating}>
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
                      disabled={!input.trim() && attachments.length === 0}
                    >
                      <Send size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
          <div className="disclaimer">{t.disclaimer}</div>
        </div>
      </footer>
    </div>
  );
}
