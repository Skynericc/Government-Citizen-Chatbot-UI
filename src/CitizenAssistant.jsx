import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Send, Mic, Square, X, Check, Copy, Volume2, ThumbsUp, ThumbsDown,
  Flag, Share2, Settings, ChevronDown, ChevronUp, Loader2,
  CheckCircle2, Landmark, Paperclip, RotateCcw,
  CreditCard, BookUser, Baby, Home, Car, Sun, Moon, Monitor
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
import { streamChat, isAgentConfigured, isDemoModeEnabled } from "./utils/AgentService.js";
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
import { getHeaderTextStyle } from "./utils/color.js";
import ministryLogo from "./assets/ministry-logo.svg";

const MAX_FILES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const VALID_THEME_PREFERENCES = new Set(["system", "light", "dark"]);
const FILE_ATTACHMENTS_ENABLED = import.meta.env.VITE_FILE_ATTACHMENTS_ENABLED === "true";
const TOOL_CALLS_ENABLED = import.meta.env.VITE_TOOL_CALLS_ENABLED !== "false";

// Index-aligned with TOPIC_ORDER (constants/Answers.js) and therefore with
// each language's t.suggested array — purely a visual pairing for the
// welcome screen's category cards.
const SUGGESTED_ICONS = [CreditCard, BookUser, Baby, Home, Car];

/* ------------------------------------------------------------------ */
/* Main component                                                      */
/* ------------------------------------------------------------------ */

export default function CitizenAssistant() {
  const [language, setLanguage] = useState("fr");
  const [themePref, setThemePref] = useState(() => {
    try {
      const storedTheme = localStorage.getItem("theme-pref");
      return VALID_THEME_PREFERENCES.has(storedTheme) ? storedTheme : "system";
    } catch {
      return "system";
    }
  });
  const [systemPrefersDark, setSystemPrefersDark] = useState(() =>
    typeof window !== "undefined" && window.matchMedia
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
      : false
  );
  const resolvedTheme = themePref === "system" ? (systemPrefersDark ? "dark" : "light") : themePref;

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e) => setSystemPrefersDark(e.matches);
    mq.addEventListener ? mq.addEventListener("change", onChange) : mq.addListener(onChange);
    return () => {
      mq.removeEventListener ? mq.removeEventListener("change", onChange) : mq.removeListener(onChange);
    };
  }, []);

  useEffect(() => {
    try { localStorage.setItem("theme-pref", themePref); } catch { /* ignore */ }
  }, [themePref]);

  const cycleTheme = () => {
    setThemePref(prev => (prev === "light" ? "dark" : "light"));
  };
  const THEME_ICONS = { system: Monitor, light: Sun, dark: Moon };
  const ThemeIcon = THEME_ICONS[themePref];

  const [primaryColor, setPrimaryColor] = useState("#0D5F96");
  const institutionName = "Royaume du Maroc — Ministère de la Transition Numérique et de la Réforme de l'Administration";
  const assistantIcon = "";
  const [assistantIconError, setAssistantIconError] = useState(false);
  const headerText = getHeaderTextStyle(primaryColor);
  const customSubtitle = "";
  const [detailedMode, setDetailedMode] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

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

  // Whether the welcome screen's content actually fits without scrolling.
  // Measured live (not assumed) so small/short screens — where the 5
  // suggestion cards genuinely don't all fit — keep normal scroll access,
  // while the common case (content comfortably fits) hides the scrollbar
  // entirely instead of showing a near-empty, purely cosmetic track.
  const [welcomeFits, setWelcomeFits] = useState(true);

  const stickToBottomRef = useRef(true);
  const scrollFrameRef = useRef(null);

  useEffect(() => {
    if (messages.length > 0) return;
    const el = scrollRef.current;
    if (!el) return;
    const check = () => setWelcomeFits(el.scrollHeight <= el.clientHeight + 1);
    check();
    // Re-check shortly after mount too: the ministry logo images can still
    // be loading on the first check, which would under-measure the height.
    const lateCheck = setTimeout(check, 200);
    window.addEventListener("resize", check);
    return () => {
      clearTimeout(lateCheck);
      window.removeEventListener("resize", check);
    };
  }, [language, institutionName, customSubtitle]);

  const syncStickToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const shouldStick = distanceFromBottom <= 80;
    stickToBottomRef.current = shouldStick;
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const handleWheel = (event) => {
      if (event.deltaY < 0) {
        stickToBottomRef.current = false;
        return;
      }

      if (event.deltaY > 0) {
        syncStickToBottom();
      }
    };

    el.addEventListener("wheel", handleWheel, { passive: true });

    return () => {
      el.removeEventListener("wheel", handleWheel);
    };
  }, [syncStickToBottom]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const handleScroll = () => {
      const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;

      if (distanceFromBottom > 80) {
        stickToBottomRef.current = false;
        return;
      }

      stickToBottomRef.current = true;
    };

    el.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      el.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !isGenerating || !stickToBottomRef.current) return;
    if (scrollFrameRef.current !== null) {
      cancelAnimationFrame(scrollFrameRef.current);
    }
    scrollFrameRef.current = requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
      scrollFrameRef.current = null;
    });
  }, [messages, isGenerating]);

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

  useEffect(() => {
    if (!showResetConfirm) return;
    const onKey = (e) => { if (e.key === "Escape") setShowResetConfirm(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showResetConfirm]);

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
  /* startDemoGeneration above only when explicit/local development demo   */
  /* mode is enabled. Production never falls back to canned answers.       */
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

      onToolStart: ({ callId, name, display, args }) => {
        setMessages(prev => prev.map(m => m.id === assistantId
          ? { ...m, tools: [...m.tools, { callId, name, display, args, status: "running", startedAt: Date.now() }] }
          : m));
      },

      onToolEnd: ({ callId, output, name }) => {
        setMessages(prev => prev.map(m => m.id === assistantId
          ? {
              ...m,
              tools: m.tools.map(tool => tool.callId === callId
                ? { ...tool, // preserve name/display/args from the start event, but accept name if provided
                    name: tool.name || name || tool.name,
                    status: "done", output, endedAt: Date.now() }
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
        const message = err.kind === "rate_limit"
          ? (err.message || t.rateLimitedMessage)
          : (err.kind === "stream" && err.message ? err.message : t.agentErrorGeneric);
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

    stickToBottomRef.current = true;

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

    if (isAgentConfigured() && text) {
      startRealGeneration(assistantId, text, inputMode);
    } else if (isDemoModeEnabled()) {
      const topic = resolveTopic(text);
      startDemoGeneration(assistantId, topic, text);
    } else {
      // Production must never disguise a missing backend or unsupported
      // attachment-only turn with a canned answer.
      setMessages(prev => prev.map(message => message.id === assistantId
        ? { ...message, content: t.agentErrorGeneric, phase: "done", isError: true }
        : message));
      finalizeHistory(text, "");
      setIsGenerating(false);
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
      if (isDemoModeEnabled()) {
        sendMessage("", result, "voice");
      } else {
        URL.revokeObjectURL(result.url);
        setVoiceError(t.asrUnavailable || "ASR service unavailable.");
      }
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
      data-theme={resolvedTheme}
      style={{
        "--primary": primaryColor,
        "--header-text": headerText.text,
        "--header-text-soft": headerText.textSoft,
        "--header-border": headerText.border,
        "--header-hover-bg": headerText.hoverBg,
        "--header-idle-bg": headerText.idleBg,
      }}
    >
      <style>{CSS}</style>

      <header className="app-header">
        <div className="app-header-inner">
          <div className="brand">
            <span className="brand-logo-badge">
              <img src={ministryLogo} alt={institutionName} className="brand-logo-img" />
            </span>
            <div className="brand-divider" />
            <div className="brand-text">
              <div className="brand-name">{institutionName}</div>
              <div className="brand-subtitle">{displaySubtitle}</div>
            </div>
          </div>
          <div className="header-actions">
            <button
              type="button"
              className="settings-btn icon-tooltip"
              onClick={cycleTheme}
              aria-label={`${t.themeLabel}: ${t[`theme${themePref[0].toUpperCase()}${themePref.slice(1)}`]}`}
              data-tooltip={t[`theme${themePref[0].toUpperCase()}${themePref.slice(1)}`]}
            >
              <ThemeIcon size={17} />
            </button>
            {hasStarted && (
              <button
                type="button"
                className="settings-btn icon-tooltip"
                onClick={() => setShowResetConfirm(true)}
                aria-label={t.newConversation}
                data-tooltip={t.newConversation}
              >
                <RotateCcw size={17} />
              </button>
            )}
            <button
              type="button"
              className="settings-btn icon-tooltip"
              onClick={() => setShowSettings(s => !s)}
              aria-label={t.settingsTitle}
              aria-expanded={showSettings}
              aria-controls="settings-panel"
              data-tooltip={t.settingsTitle}
            >
              <Settings size={18} />
            </button>
          </div>
        </div>

        <div className="header-accent-gold" />

        {showSettings && (
          <div className="settings-panel" id="settings-panel">
            <div className="settings-title">{t.settingsTitle}</div>

            <label className="settings-field settings-field-row">
              <span>{t.colorLabel}</span>
              <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} />
            </label>
            {headerText.lowContrast && (
              <div className="settings-warning">{t.contrastWarning}</div>
            )}

            <label className="settings-field settings-field-row">
              <span>{t.languageLabel}</span>
              <select value={language} onChange={e => setLanguage(e.target.value)}>
                <option value="fr">Français</option>
                <option value="en">English</option>
                <option value="ar">العربية</option>
              </select>
            </label>

            {TOOL_CALLS_ENABLED && (
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
            )}

            <button type="button" className="settings-close" onClick={() => setShowSettings(false)}>{t.close}</button>
          </div>
        )}
      </header>

      <main className={`app-main${!hasStarted && welcomeFits ? " app-main-welcome" : ""}`} ref={scrollRef}>
        <div className={`app-main-inner${!hasStarted ? " app-main-inner-welcome" : ""}`}>
          {!hasStarted && (
            <div className="welcome">
              <h1 className="welcome-title">{t.welcomeTitle}</h1>
              <p className="welcome-message">{t.welcomeMessage}</p>
              <div className="suggested-grid">
                {t.suggested.map((q, idx) => {
                  const Icon = SUGGESTED_ICONS[idx] || CreditCard;
                  return (
                    <button type="button" key={idx} className="suggested-chip" onClick={() => sendMessage(q)}>
                      <span className="suggested-chip-icon"><Icon size={20} /></span>
                      <span className="suggested-chip-label">{q}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {hasStarted && (
            <div className="messages">
              {messages.map((m) => {
                if (m.role === "user") {
                  return (
                    <div className="msg-row msg-row-user" key={m.id}>
                      <div className="assistant-col assistant-col-user" style={{ alignItems: "flex-end" }}>
                        <MessageAttachments attachments={m.attachments} />
                        {m.audio && <AudioPlayer url={m.audio.url} fallbackDuration={m.audio.duration} />}
                        {m.content && <div className="msg-bubble msg-bubble-user" dir="auto">{m.content}</div>}
                      </div>
                    </div>
                  );
                }
                const showTools = TOOL_CALLS_ENABLED && (
                  m.phase === "tools" || (m.tools?.length ?? 0) > 0
                );
                return (
                  <div className="msg-row msg-row-assistant" key={m.id}>
                    <div className="assistant-avatar">
                      {assistantIcon && !assistantIconError ? (
                        <img
                          src={assistantIcon}
                          alt=""
                          className="assistant-avatar-img"
                          onError={() => setAssistantIconError(true)}
                        />
                      ) : (
                        <Landmark size={14} />
                      )}
                    </div>
                    <div className="assistant-col">
                      {showTools && (
                        <ToolPanel
                          tools={m.tools}
                          citizenLabel={m.citizenLabel}
                          detailed={detailedMode}
                          active={m.phase === "tools" || m.tools?.some(tool => tool.status === "running")}
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
              {FILE_ATTACHMENTS_ENABLED && (
                <AttachmentBar attachments={attachments} onRemove={removeAttachment} uploadingLabel={t.uploading} />
              )}
              {FILE_ATTACHMENTS_ENABLED && attachError && <div className="attach-error">{attachError}</div>}
              {voiceError && <div className="attach-error">{voiceError}</div>}
              {recorder.error === "permission" && <div className="attach-error">{t.micPermissionError}</div>}
              {recorder.error === "unsupported" && <div className="attach-error">{t.micUnsupported}</div>}
              {recorder.error === "duration" && <div className="attach-error">{t.recordingTooLong}</div>}
              {recorder.error === "encode" && <div className="attach-error">{t.voicePrepError || "Could not prepare the recording."}</div>}
              <div className="composer-row">
                {FILE_ATTACHMENTS_ENABLED && (
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="file-input-hidden"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={handleFilesSelected}
                  />
                )}
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
                  {FILE_ATTACHMENTS_ENABLED && (
                    <button type="button" className="icon-btn" title={t.attach} onClick={openFilePicker} disabled={isGenerating}>
                      <Paperclip size={18} />
                    </button>
                  )}
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
                      disabled={!input.trim() && (!FILE_ATTACHMENTS_ENABLED || attachments.length === 0)}
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

      {showResetConfirm && (
        <div className="modal-overlay" onClick={() => setShowResetConfirm(false)}>
          <div
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reset-confirm-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="modal-close"
              onClick={() => setShowResetConfirm(false)}
              aria-label={t.close}
            >
              <X size={16} />
            </button>
            <h2 className="modal-title" id="reset-confirm-title">{t.confirmResetTitle}</h2>
            <p className="modal-body">{t.confirmResetBody}</p>
            <div className="modal-actions">
              <button
                type="button"
                className="modal-btn modal-btn-primary"
                onClick={() => { setShowResetConfirm(false); resetConversation(); }}
              >
                {t.confirmResetConfirm}
              </button>
              <button
                type="button"
                className="modal-btn modal-btn-secondary"
                onClick={() => setShowResetConfirm(false)}
              >
                {t.confirmResetCancel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
