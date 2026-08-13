/* ------------------------------------------------------------------ */
/* Client for the `agent` chat service — see contrat_api_frontend.pdf   */
/* (§0-1). This is a REAL implementation, not a placeholder: when       */
/* VITE_AGENT_URL is set, CitizenAssistant.jsx uses this instead of     */
/* the local demo simulation.                                           */
/*                                                                        */
/* Scope note: typed text and ASR-produced transcripts are sent as        */
/* user_text. File attachments are not part of the agent contract and     */
/* are therefore not sent by this client.                                 */
/* ------------------------------------------------------------------ */

export const AGENT_URL = import.meta.env.VITE_AGENT_URL || "";
const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === "true"
  || (import.meta.env.DEV && import.meta.env.VITE_DEMO_MODE !== "false");

export function isAgentConfigured() {
  return Boolean(AGENT_URL);
}

export function isDemoModeEnabled() {
  return DEMO_MODE;
}

async function readHttpErrorMessage(response) {
  let raw = "";
  try {
    raw = await response.text();
  } catch {
    return "";
  }
  if (!raw) return "";

  try {
    const payload = JSON.parse(raw);
    const message = payload?.detail || payload?.message || payload?.error_message;
    return typeof message === "string" ? message.slice(0, 500) : "";
  } catch {
    const contentType = response.headers.get("content-type") || "";
    return contentType.startsWith("text/plain") ? raw.trim().slice(0, 500) : "";
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
 * @param {string} [opts.ipHash] - legacy Chainlit-contract field. The new
 *   deployment sends "unknown" because the trusted proxy and agent derive
 *   the real hash server-side; browsers must not choose their rate-limit key.
 * @param {AbortSignal} [opts.signal]
 * @param {(delta: string) => void} [opts.onToken]
 * @param {(evt: {callId: string, name: string, display?: string, args?: string}) => void} [opts.onToolStart]
 * @param {(evt: {callId: string, name?: string, output?: string, status?: "done"|"error", summary?: string}) => void} [opts.onToolEnd]
 * @param {(evt: {text: string, cacheHit: boolean, endedWithoutDone: boolean}) => void} [opts.onDone]
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

  // 429 is a plain HTTP error sent *before* the stream starts (§1.3), not
  // an SSE event. Preserve its bounded API message for the caller, which
  // retains a localized fallback if the response has no usable detail.
  if (response.status === 429) {
    onError?.({ kind: "rate_limit", status: 429, message: await readHttpErrorMessage(response) });
    return;
  }
  if (!response.ok) {
    onError?.({
      kind: "http",
      status: response.status,
      message: await readHttpErrorMessage(response),
    });
    return;
  }
  if (!response.body) {
    onError?.({ kind: "network" });
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let streamedText = "";
  let terminalEventReceived = false;
  // Resolves tool_end events sent with call_id: "_last" (the agent's
  // documented fallback when it has no real id for the call) to whichever
  // call_id was most recently opened by a tool_start.
  let lastCallId = null;

  const handleEvent = (evt) => {
    if (terminalEventReceived) return;

    switch (evt.type) {
      case "token": {
        const delta = typeof evt.delta === "string" ? evt.delta : "";
        streamedText += delta;
        onToken?.(delta);
        break;
      }
      case "tool_start": {
        const callId = evt.call_id || `auto-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        lastCallId = callId;
        onToolStart?.({ callId, name: evt.name, display: evt.display, args: evt.args });
        break;
      }
      case "tool_end": {
        const callId = !evt.call_id || evt.call_id === "_last" ? lastCallId : evt.call_id;
        // The documented contract only guarantees call_id/name/output. If the
        // backend is later extended with a per-tool failure signal or a
        // short citizen-safe summary string, these are read defensively and
        // simply ignored when absent — never required, never assumed.
        const status = evt.status === "error" ? "error" : "done";
        const summary = typeof evt.summary === "string" ? evt.summary : undefined;
        if (callId) onToolEnd?.({ callId, name: evt.name, output: evt.output, status, summary });
        break;
      }
      case "done": {
        terminalEventReceived = true;
        const finalText = typeof evt.text === "string" ? evt.text : streamedText;
        onDone?.({ text: finalText, cacheHit: Boolean(evt.cache_hit), endedWithoutDone: false });
        break;
      }
      case "error": {
        terminalEventReceived = true;
        onError?.({
          kind: "stream",
          message: typeof evt.message === "string" ? evt.message.slice(0, 500) : "",
        });
        break;
      }
      default:
        // Unknown event type — ignore rather than break the stream, in case
        // the backend adds new event types later.
        break;
    }
  };

  const processLine = (rawLine) => {
    const line = rawLine.trim();
    if (!line.startsWith("data:")) return;
    const jsonPart = line.slice(5).trim();
    if (!jsonPart) return;
    try {
      handleEvent(JSON.parse(jsonPart));
    } catch (err) {
      console.error("Malformed SSE event from agent:", jsonPart, err);
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
        processLine(rawLine);
      }
      if (terminalEventReceived) {
        await reader.cancel();
        break;
      }
    }

    // Flush the decoder and parse a final event even when the server closes
    // without a trailing newline.
    buffer += decoder.decode();
    if (buffer.trim()) processLine(buffer);

    // The contract explicitly allows EOF without a `done` event. Finalize
    // from the accumulated tokens so the UI cannot remain stuck generating.
    if (!terminalEventReceived) {
      terminalEventReceived = true;
      if (streamedText) {
        onDone?.({ text: streamedText, cacheHit: false, endedWithoutDone: true });
      } else {
        onError?.({ kind: "stream", message: "" });
      }
    }
  } catch (err) {
    if (err.name === "AbortError") return;
    if (!terminalEventReceived) {
      terminalEventReceived = true;
      onError?.({ kind: "network", raw: err });
    }
  }
}
