/* ------------------------------------------------------------------ */
/* Client for the `agent` chat service — see contrat_api_frontend.pdf   */
/* (§0-1). This is a REAL implementation, not a placeholder: when       */
/* VITE_AGENT_URL is set, CitizenAssistant.jsx uses this instead of     */
/* the local demo simulation.                                           */
/*                                                                        */
/* Scope note: only plain typed text is sent as user_text here. Voice    */
/* recordings (no ASR wired yet) and file attachments (no upload         */
/* endpoint in this contract — see §5 "hors périmètre") are NOT part     */
/* of this call. The caller (CitizenAssistant.jsx) only invokes          */
/* streamChat for text-bearing messages and keeps using the local        */
/* demo path for voice-only turns until the ASR step lands.              */
/* ------------------------------------------------------------------ */

export const AGENT_URL = import.meta.env.VITE_AGENT_URL || "";

export function isAgentConfigured() {
  return Boolean(AGENT_URL);
}

const SESSION_STORAGE_KEY = "citizen-assistant-session-id";

// One session_id per tab, kept stable across reloads via sessionStorage.
// The contract requires it to be generated and kept safe by the frontend —
// it doesn't mandate persistence across tabs/reloads, but keeping it makes
// refresh-during-testing less annoying without changing backend behaviour.
export function getOrCreateSessionId() {
  try {
    const existing = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (existing) return existing;
    const id = crypto.randomUUID();
    sessionStorage.setItem(SESSION_STORAGE_KEY, id);
    return id;
  } catch {
    // sessionStorage unavailable (privacy mode, etc.) — fall back to an
    // id that's at least stable for the lifetime of this page load.
    return crypto.randomUUID();
  }
}

/**
 * Streams one chat turn from the agent service (contrat §1).
 *
 * @param {object} opts
 * @param {string} opts.userText
 * @param {string} opts.sessionId
 * @param {{role: "user"|"assistant", content: string}[]} opts.history
 * @param {boolean} opts.isFirstQuestion
 * @param {"text"|"voice"} [opts.inputMode]
 * @param {string} [opts.ipHash] - the frontend cannot see the real client
 *   IP from the browser; "unknown" (the contract's own default) is sent
 *   unless a backend/edge layer is later added to compute it (see §1.2).
 * @param {AbortSignal} [opts.signal]
 * @param {(delta: string) => void} [opts.onToken]
 * @param {(evt: {callId: string, name: string, display?: string, args?: string}) => void} [opts.onToolStart]
 * @param {(evt: {callId: string, name?: string, output?: string}) => void} [opts.onToolEnd]
 * @param {(evt: {text: string, cacheHit: boolean}) => void} [opts.onDone]
 * @param {(err: {kind: "network"|"http"|"rate_limit"|"stream", status?: number, message?: string, raw?: any}) => void} [opts.onError]
 */
export async function streamChat({
  userText,
  sessionId,
  history,
  isFirstQuestion,
  inputMode = "text",
  ipHash = "unknown",
  signal,
  onToken,
  onToolStart,
  onToolEnd,
  onDone,
  onError,
}) {
  let response;
  try {
    response = await fetch(`${AGENT_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal,
      body: JSON.stringify({
        user_text: userText,
        session_id: sessionId,
        history,
        is_first_question: isFirstQuestion,
        input_mode: inputMode,
        ip_hash: ipHash,
      }),
    });
  } catch (err) {
    if (err.name === "AbortError") return; // user cancelled — not a real error
    onError?.({ kind: "network", raw: err });
    return;
  }

  // 429 is a plain HTTP error sent *before* the stream starts (§1.3) — not
  // an SSE event. Its body is currently Arabic-only and not meant to be
  // shown verbatim; the caller maps kind: "rate_limit" to its own string.
  if (response.status === 429) {
    onError?.({ kind: "rate_limit" });
    return;
  }
  if (!response.ok) {
    onError?.({ kind: "http", status: response.status });
    return;
  }
  if (!response.body) {
    onError?.({ kind: "network" });
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  // Resolves tool_end events sent with call_id: "_last" (the agent's
  // documented fallback when it has no real id for the call) to whichever
  // call_id was most recently opened by a tool_start.
  let lastCallId = null;

  const handleEvent = (evt) => {
    switch (evt.type) {
      case "token":
        onToken?.(evt.delta ?? "");
        break;
      case "tool_start": {
        const callId = evt.call_id || `auto-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        lastCallId = callId;
        onToolStart?.({ callId, name: evt.name, display: evt.display, args: evt.args });
        break;
      }
      case "tool_end": {
        const callId = !evt.call_id || evt.call_id === "_last" ? lastCallId : evt.call_id;
        if (callId) onToolEnd?.({ callId, name: evt.name, output: evt.output });
        break;
      }
      case "done":
        onDone?.({ text: evt.text, cacheHit: Boolean(evt.cache_hit) });
        break;
      case "error":
        onError?.({ kind: "stream", message: evt.message });
        break;
      default:
        // Unknown event type — ignore rather than break the stream, in case
        // the backend adds new event types later.
        break;
    }
  };

  try {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // Contract §1.3: "une ligne par événement… toute ligne ne commençant
      // pas par data: doit être ignorée" — simple line-based parsing is
      // sufficient here, no need for full multi-line SSE framing.
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? ""; // keep the last, possibly incomplete line
      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line.startsWith("data:")) continue;
        const jsonPart = line.slice(5).trim();
        if (!jsonPart) continue;
        try {
          handleEvent(JSON.parse(jsonPart));
        } catch (err) {
          console.error("Malformed SSE event from agent:", jsonPart, err);
        }
      }
    }
    // A flux that ends without an explicit `done` is treated as finished,
    // per §1.3's own "remarques d'implémentation".
  } catch (err) {
    if (err.name === "AbortError") return;
    onError?.({ kind: "network", raw: err });
  }
}
