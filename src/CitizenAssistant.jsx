import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Send, Mic, Square, X, Check, Copy, Volume2, ThumbsUp, ThumbsDown,
  Flag, Share2, Settings, ChevronDown, ChevronUp, Loader2,
  CheckCircle2, Landmark, Paperclip, RotateCcw
} from "lucide-react";
import CSS from "./utils/styles.css?inline"
import { STRINGS } from "./constants/Strings"
import { ANSWERS, TOPIC_ORDER } from "./constants/Answers";
import Expandable from "./components/Expandable.jsx"
import MessageActions from "./components/MessageActions";
import ToolPanel from "./components/Toolpanel.jsx";
import { AttachmentBar, MessageAttachments } from "./components/Attachments.jsx";
import AudioPlayer from "./components/AudioPlayer.jsx";
import { useVoiceRecorder } from "./utils/useVoiceRecorder.js";
import { streamChat, isAgentConfigured } from "./utils/AgentService.js";
import { isASRConfigured, transcribeSpeech } from "./utils/ASRService.js";
import {
  addAssistantMessage,
  addUserMessage,
  resetSession,
} from "./utils/ConversationService.js";
/* ------------------------------------------------------------------ */
/* TODO(backend): Uncomment the import below once a backend           */
/* ingestion endpoint exists. uploadFile() POSTs files/audio to your   */
/* server, which should return a durable file reference (remoteId)     */
/* that can later be attached to chat completion requests so the LLM   */
/* can read/transcribe the uploaded content.                            */
/* ------------------------------------------------------------------ */
// import { uploadFile } from "./utils/Uploadservice.jsx";
import { renderInline, parseMarkdown } from "./utils/Markdown.jsx";
import { SourcesList } from "./components/Citations.jsx";
import ministryLogo from "./assets/ministry-logo.svg";

const MAX_FILES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/* ------------------------------------------------------------------ */
/* Main component                                                      */
/* ------------------------------------------------------------------ */

export default function CitizenAssistant() {
  const [language, setLanguage] = useState("fr");
  const [primaryColor, setPrimaryColor] = useState("#1175BA");
  const [institutionName, setInstitutionName] = useState("Royaume du Maroc — Ministère de la Transition Numérique et de la Réforme de l'Administration");
  const [customSubtitle, setCustomSubtitle] = useState("");
  const [detailedMode, setDetailedMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [attachError, setAttachError] = useState("");
  const [voiceError, setVoiceError] = useState("");

  const recorder = useVoiceRecorder();

  const scrollRef = useRef(null);
  const genTimeoutsRef = useRef([]);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  // Real-backend bookkeeping (contrat §1.2): a stable session_id, the
  // running conversation history the agent expects on every call, whether
  // this is the session's first question (drives its cache), and an
  // AbortController so "stop generating" can cancel an in-flight fetch too.
  // Actual values are set by resetConversation() on mount below — per the
  // UI spec the assistant must not retain history across sessions, so a
  // fresh session_id/history is generated on every page load, not restored.
  const sessionIdRef = useRef(null);
  const historyRef = useRef([]);
  const isFirstQuestionRef = useRef(true);
  const abortControllerRef = useRef(null);

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

  // Starts a brand-new conversation: cancels any in-flight generation,
  // clears the visible transcript, and gets a fresh session_id/history
  // from ConversationService. Used by the "New conversation" button and
  // once on mount, so a page refresh behaves identically — the UI spec
  // requires the assistant not retain a history of past conversations,
  // so this intentionally does NOT restore anything from a prior session.
  const resetConversation = useCallback(() => {
    clearGenTimeouts();
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsGenerating(false);
    setMessages([]);
    sessionIdRef.current = resetSession();
    historyRef.current = [];
    isFirstQuestionRef.current = true;
  }, []);

  useEffect(() => {
    resetConversation();
    // Intentionally run once on mount only — see resetConversation's comment.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Match a sent question against the suggested prompts to pick a topic-specific
  // canned answer; free-typed questions that don't match fall back to "default".
  const resolveTopic = useCallback((text) => {
    const idx = t.suggested.findIndex((q) => q === text);
    return idx >= 0 ? TOPIC_ORDER[idx] : "default";
  }, [t]);

  // Pushes the finished turn into the running history the real backend
  // expects on every call (contrat §1.2), and flips is_first_question off.
  // Called even when assistantText is empty (an agent-side failure) so the
  // question itself isn't silently dropped from context — only the
  // assistant turn is skipped in that case, not the user's.
  const finalizeHistory = (userText, assistantText) => {
    if (!userText) return;
    historyRef.current = addUserMessage(userText);
    if (assistantText) {
      historyRef.current = addAssistantMessage(assistantText);
    }
    isFirstQuestionRef.current = false;
  };

  const startDemoGeneration = useCallback((assistantId, topic, userText) => {
    const steps = t.steps;
    const answer = (ANSWERS[topic] && ANSWERS[topic][language]) || ANSWERS.default[language];

    setMessages(prev => prev.map(m => m.id === assistantId
      ? { ...m, phase: "tools", tools: [], citizenLabel: steps[0]?.label || "" }
      : m));

    steps.forEach((step, idx) => {
      const to = setTimeout(() => {
        setMessages(prev => prev.map(m => {
          if (m.id !== assistantId) return m;
          const now = Date.now();
          const tools = [...m.tools, {
            callId: `demo-${idx}`, name: step.name, status: "done",
            output: step.summary, startedAt: now - 450, endedAt: now,
          }];
          return { ...m, tools, citizenLabel: steps[idx + 1]?.label || step.label };
        }));

        if (idx === steps.length - 1) {
          // start streaming text
          const full = answer.text;
          let pos = 0;
          const chunkSize = 4;
          // citations are known up front, so inline [[n]] marks resolve to
          // real links as soon as they stream into view
          setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, citations: answer.citations } : m));
          const streamInterval = setInterval(() => {
            pos += chunkSize;
            const slice = full.slice(0, pos);
            setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: slice, phase: "streaming" } : m));
            if (pos >= full.length) {
              clearInterval(streamInterval);
              setMessages(prev => prev.map(m => m.id === assistantId ? {
                ...m, content: full, phase: "done", citations: answer.citations, expandable: {
                  title: answer.expandableTitle, body: answer.expandableBody,
                }
              } : m));
              finalizeHistory(userText, full);
              setIsGenerating(false);
            }
          }, 18);
          genTimeoutsRef.current.push(streamInterval);
        }
      }, 650 * (idx + 1));
      genTimeoutsRef.current.push(to);
    });
  }, [language, t]);

  /* ------------------------------------------------------------------ */
  /* Real integration (contrat_api_frontend.pdf §1) — POST {agent}/chat,  */
  /* streamed as SSE via utils/AgentService.js. Used whenever              */
  /* VITE_AGENT_URL is configured; otherwise sendMessage falls back to     */
  /* startDemoGeneration above so the local demo keeps working with no     */
  /* backend at all.                                                        */
  /* ------------------------------------------------------------------ */
  const startRealGeneration = useCallback((assistantId, userText, inputMode = "text") => {
    setMessages(prev => prev.map(m => m.id === assistantId
      ? { ...m, phase: "tools", tools: [], citizenLabel: t.citizenGenericLabel }
      : m));

    const controller = new AbortController();
    abortControllerRef.current = controller;
    let accumulated = "";

    streamChat({
      userText,
      sessionId: sessionIdRef.current,
      history: historyRef.current,
      isFirstQuestion: isFirstQuestionRef.current,
      inputMode,
      signal: controller.signal,

      onToken: (delta) => {
        accumulated += delta;
        setMessages(prev => prev.map(m => m.id === assistantId
          ? { ...m, content: accumulated, phase: "streaming" }
          : m));
      },

      onToolStart: ({ callId, name }) => {
        setMessages(prev => prev.map(m => m.id === assistantId
          ? { ...m, tools: [...m.tools, { callId, name, status: "running", startedAt: Date.now() }] }
          : m));
      },

      onToolEnd: ({ callId, output }) => {
        setMessages(prev => prev.map(m => m.id === assistantId
          ? {
              ...m,
              tools: m.tools.map(tool => tool.callId === callId
                ? { ...tool, status: "done", output, endedAt: Date.now() }
                : tool),
            }
          : m));
      },

      onDone: ({ text }) => {
        // The agent's own event carries the authoritative final text —
        // used as-is even if it differs slightly from the streamed tokens.
        const finalText = text || accumulated;
        setMessages(prev => prev.map(m => m.id === assistantId
          ? { ...m, content: finalText, phase: "done" }
          : m));
        finalizeHistory(userText, finalText);
        setIsGenerating(false);
        abortControllerRef.current = null;
      },

      onError: (err) => {
        console.error("Agent error:", err);
        const message = err.kind === "rate_limit" ? t.rateLimitedMessage : t.agentErrorGeneric;
        setMessages(prev => prev.map(m => m.id === assistantId
          ? { ...m, content: message, phase: "done", isError: true }
          : m));
        // Keep the user's turn in history even on failure (finalizeHistory
        // skips the empty assistant turn), so the next question retains
        // conversational context instead of the failed one vanishing.
        finalizeHistory(userText, "");
        setIsGenerating(false);
        abortControllerRef.current = null;
      },
    });
  }, [t]);

  /* ------------------------------------------------------------------ */
  /* TODO(backend): Replace the sendMessage function below with the     */
  /* async version that uploads files/audio before sending. Uncomment   */
  /* the import of uploadFile at the top of this file. This is the ONE  */
  /* place audio/file uploads should happen — see the note in           */
  /* useVoiceRecorder.js, which intentionally does not upload anything  */
  /* itself so there's a single upload code path to reason about.       */
  /*                                                                      */
  /* Note the new `isUploading` state: sendMessage becomes async and     */
  /* does network work *before* pushing the message, so the send/attach/ */
  /* mic buttons need a guard for that window too — `isGenerating` alone */
  /* only covers the streaming-answer phase, and without this a fast     */
  /* double-click on Send while uploads are in flight would fire         */
  /* sendMessage twice and duplicate the upload + message.                */
  /*                                                                      */
  /* Expected real implementation:                                        */
  /*                                                                      */
  /*   const [isUploading, setIsUploading] = useState(false);            */
  /*                                                                      */
  /*   const sendMessage = async (rawText, audio = null) => {            */
  /*     const text = rawText.trim();                                    */
  /*     if ((!text && attachments.length === 0 && !audio) || isGenerating || isUploading) return; */
  /*     const userId = `u-${Date.now()}`;                               */
  /*     const assistantId = `a-${Date.now() + 1}`;                      */
  /*     const topic = resolveTopic(text);                                */
  /*     setIsUploading(true);                                            */
  /*     let resolvedAudio = audio;                                       */
  /*                                                                      */
  /*     // 1. Upload pending file attachments (att.file is the original  */
  /*     //    File from handleFilesSelected — no blob-URL round-trip)    */
  /*     const uploadedAttachments = [];                                  */
  /*     for (const att of attachments) {                                 */
  /*       try {                                                          */
  /*         const serverResult = await uploadFile(att.file, {            */
  /*           onProgress: (pct) => {                                     */
  /*             setAttachments(prev => prev.map(a =>                     */
  /*               a.id === att.id ? { ...a, status: "uploading", progress: pct } : a */
  /*             ));                                                       */
  /*           },                                                          */
  /*         });                                                          */
  /*         uploadedAttachments.push({                                    */
  /*           ...att,                                                     */
  /*           remoteId: serverResult.remoteId,  // durable reference      */
  /*           uploadedAt: serverResult.uploadedAt,                        */
  /*         });                                                           */
  /*       } catch (err) {                                                 */
  /*         console.error("Upload failed for", att.name, err);            */
  /*         // Fall back to sending the attachment as local-only          */
  /*         uploadedAttachments.push(att);                                */
  /*       }                                                               */
  /*     }                                                                 */
  /*                                                                      */
  /*     // 2. Upload the voice recording, if any. Same shape either way: */
  /*     //    { url, blob, duration, remoteId? } — remoteId is only set  */
  /*     //    on success, so downstream code can branch on its presence  */
  /*     //    without worrying about missing fields.                     */
  /*     if (resolvedAudio?.blob) {                                       */
  /*       try {                                                          */
  /*         const audioFile = new File(                                   */
  /*           [resolvedAudio.blob],                                       */
  /*           `recording-${Date.now()}.webm`,                             */
  /*           { type: resolvedAudio.blob.type || "audio/webm" }           */
  /*         );                                                            */
  /*         const serverResult = await uploadFile(audioFile, {            */
  /*           onProgress: (pct) => console.log("audio upload %", pct),   */
  /*         });                                                           */
  /*         resolvedAudio = { ...resolvedAudio, remoteId: serverResult.remoteId }; */
  /*       } catch (err) {                                                 */
  /*         console.error("Audio upload failed", err);                    */
  /*         // Keep the local blob/url so the user can still play it      */
  /*         // back even though server persistence failed (no remoteId).  */
  /*       }                                                               */
  /*     }                                                                 */
  /*                                                                      */
  /*     setIsUploading(false);                                           */
  /*     setMessages(prev => [                                            */
  /*       ...prev,                                                       */
  /*       { id: userId, role: "user", content: text,                      */
  /*         attachments: uploadedAttachments, audio: resolvedAudio },     */
  /*       { id: assistantId, role: "assistant", content: "",             */
  /*         phase: "tools", tools: [], citizenLabel: "", feedback: null }, */
  /*     ]);                                                               */
  /*     setInput("");                                                     */
  /*     setAttachments([]);                                               */
  /*     setAttachError("");                                               */
  /*     setIsGenerating(true);                                            */
  /*     if (isAgentConfigured() && text) {                                */
  /*       startRealGeneration(assistantId, text);                         */
  /*     } else {                                                          */
  /*       startDemoGeneration(assistantId, topic, text);                  */
  /*     }                                                                 */
  /*   };                                                                  */
  /* ------------------------------------------------------------------ */

  const sendMessage = (rawText, audio = null, inputMode = "text") => {
    const text = rawText.trim();
    if ((!text && attachments.length === 0 && !audio) || isGenerating) return;
    const userId = `u-${Date.now()}`;
    const assistantId = `a-${Date.now() + 1}`;

    setMessages(prev => [
      ...prev,
      { id: userId, role: "user", content: text, attachments, audio },
      { id: assistantId, role: "assistant", content: "", phase: "tools", tools: [], citizenLabel: "", feedback: null },
    ]);
    setInput("");
    setAttachments([]);
    setAttachError("");
    setVoiceError("");
    setIsGenerating(true);

    // The real backend only has a plain-text chat contract for now (no ASR
    // or file-upload endpoints wired yet — see the integration roadmap), so
    // voice-only turns keep using the local demo simulation regardless of
    // VITE_AGENT_URL, and attachments are shown in the bubble but not sent.
    if (isAgentConfigured() && text) {
      startRealGeneration(assistantId, text, inputMode);
    } else {
      const topic = resolveTopic(text);
      startDemoGeneration(assistantId, topic, text);
    }
  };

  const stopGeneration = () => {
    clearGenTimeouts();
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
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
        file, // kept so a future upload step can send it directly (see uploadFile TODO below)
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
    setVoiceError("");
    const result = await recorder.finish();
    if (!result || result.kind === "cancelled") return;
    if (result.kind === "empty") {
      setVoiceError(t.emptyRecording || "No audio recorded.");
      return;
    }
    if (result.kind !== "audio") {
      setVoiceError(t.voicePrepError || "Could not prepare the recording.");
      return;
    }

    if (!isASRConfigured()) {
      sendMessage("", result, "voice");
      return;
    }

    try {
      const transcription = await transcribeSpeech({ blob: result.blob });
      sendMessage(transcription, result, "voice");
    } catch (err) {
      console.error("ASR error:", err);
      if (err.kind === "aborted") return;
      if (err.kind === "empty") {
        setVoiceError(err.message || t.emptyTranscription || "No transcription could be produced.");
      } else if (err.kind === "unavailable") {
        setVoiceError(err.message || t.asrUnavailable || "ASR service unavailable.");
      } else if (err.kind === "network") {
        setVoiceError(t.networkError || "Network error while transcribing audio.");
      } else if (err.kind === "invalid_response") {
        setVoiceError(t.invalidAsrResponse || "Invalid transcription response.");
      } else {
        setVoiceError(err.message || t.voicePrepError || "Could not transcribe the recording.");
      }
    }
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
          <div className="header-actions">
            {hasStarted && (
              <button type="button" className="settings-btn" onClick={resetConversation} title={t.newConversation} aria-label={t.newConversation}>
                <RotateCcw size={17} />
              </button>
            )}
            <button
              type="button"
              className="settings-btn"
              onClick={() => setShowSettings(s => !s)}
              title={t.settingsTitle}
              aria-label={t.settingsTitle}
              aria-expanded={showSettings}
              aria-controls="settings-panel"
            >
              <Settings size={18} />
            </button>
          </div>
        </div>

        {showSettings && (
          <div className="settings-panel" id="settings-panel">
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
                  type="button"
                  className={`mode-toggle-btn ${!detailedMode ? "active" : ""}`}
                  onClick={() => setDetailedMode(false)}
                >
                  {t.citizenMode}
                </button>
                <button
                  type="button"
                  className={`mode-toggle-btn ${detailedMode ? "active" : ""}`}
                  onClick={() => setDetailedMode(true)}
                >
                  {t.detailedMode}
                </button>
              </div>
            </div>

            <button type="button" className="settings-close" onClick={() => setShowSettings(false)}>{t.close}</button>
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
                  <button type="button" key={idx} className="suggested-chip" onClick={() => sendMessage(q)}>
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
                        {m.content && <div className="msg-bubble msg-bubble-user" dir="auto">{m.content}</div>}
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
                          tools={m.tools}
                          citizenLabel={m.citizenLabel}
                          detailed={detailedMode}
                          t={t}
                        />
                      )}
                      {m.phase !== "tools" && (
                        <div className={`msg-bubble msg-bubble-assistant${m.isError ? " msg-bubble-error" : ""}`} dir="auto">
                          {parseMarkdown(m.content, m.citations)}
                          {m.phase === "streaming" && <span className="caret" />}
                          {m.phase === "done" && m.expandable && (
                            <Expandable
                              title={m.expandable.title}
                              body={m.expandable.body}
                              seeMore={t.seeMore}
                              seeLess={t.seeLess}
                            />
                          )}
                          {m.phase === "done" && (
                            <SourcesList citations={m.citations} title={t.sourcesTitle} />
                          )}
                        </div>
                      )}
                      {m.phase === "done" && (
                        <MessageActions
                          t={t}
                          text={m.content}
                          language={language}
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
                <button type="button" className="icon-btn icon-btn-primary" title={t.sendRecording} onClick={sendRecording}>
                  <Check size={17} />
                </button>
              </div>
            </div>
          ) : (
            <div className="composer">
              <AttachmentBar attachments={attachments} onRemove={removeAttachment} uploadingLabel={t.uploading} />
              {attachError && <div className="attach-error">{attachError}</div>}
              {voiceError && <div className="attach-error">{voiceError}</div>}
              {recorder.error === "permission" && <div className="attach-error">{t.micPermissionError}</div>}
              {recorder.error === "unsupported" && <div className="attach-error">{t.micUnsupported}</div>}
              {recorder.error === "encode" && <div className="attach-error">{t.voicePrepError || "Could not prepare the recording."}</div>}
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
                  <button type="button" className="icon-btn" title={t.attach} onClick={openFilePicker} disabled={isGenerating}>
                    <Paperclip size={18} />
                  </button>
                  <button type="button" className="icon-btn" title={t.recordTooltip} onClick={startRecording} disabled={isGenerating}>
                    <Mic size={18} />
                  </button>
                  {isGenerating ? (
                    <button type="button" className="send-btn send-btn-stop" title={t.stop} onClick={stopGeneration}>
                      <Square size={15} fill="currentColor" />
                    </button>
                  ) : (
                    <button
                      type="button"
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
