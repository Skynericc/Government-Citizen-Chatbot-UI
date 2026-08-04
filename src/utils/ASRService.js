/* ------------------------------------------------------------------ */
/* Client for the `asr` transcription service. Mirrors the same env    */
/* toggle and graceful-fallback style used by the existing chat/TTS    */
/* services. Demo mode remains untouched when VITE_ASR_URL is absent.  */
/* ------------------------------------------------------------------ */

export const ASR_URL = import.meta.env.VITE_ASR_URL || "";

export function isASRConfigured() {
  return Boolean(ASR_URL);
}

const TRANSCRIPT_PRIORITY = ["whisper-large-v3-turbo", "whisper-darija"];

function pickTranscriptFromPayload(payload) {
  if (typeof payload?.text === "string" && payload.text.trim()) {
    return payload.text.trim();
  }

  const transcripts = payload?.transcripts;
  if (!transcripts || typeof transcripts !== "object") return "";

  for (const key of TRANSCRIPT_PRIORITY) {
    const candidate = transcripts[key];
    if (typeof candidate === "string" && candidate.trim()) return candidate.trim();
  }

  for (const value of Object.values(transcripts)) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }

  return "";
}

async function readJsonSafely(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    throw { kind: "invalid_response", raw: text };
  }
}

/**
 * Transcribes a WAV recording using the ASR service.
 *
 * @param {object} opts
 * @param {Blob} opts.blob
 * @param {AbortSignal} [opts.signal]
 * @returns {Promise<string>}
 * @throws {{kind: "empty"|"unavailable"|"invalid_response"|"network"|"http"|"aborted", status?: number, message?: string, raw?: any}}
 */
export async function transcribeSpeech({ blob, signal }) {
  const form = new FormData();
  form.append("file", blob, "recording.wav");

  let response;
  try {
    response = await fetch(`${ASR_URL}/transcribe`, {
      method: "POST",
      body: form,
      signal,
    });
  } catch (err) {
    if (err?.name === "AbortError") throw { kind: "aborted" };
    throw { kind: "network", raw: err };
  }

  if (response.status === 400) {
    let payload = null;
    try {
      payload = await readJsonSafely(response);
    } catch (err) {
      throw err;
    }
    throw {
      kind: "empty",
      status: 400,
      message: payload?.error_message || "No audio file uploaded.",
      raw: payload,
    };
  }

  if (response.status === 503) {
    let payload = null;
    try {
      payload = await readJsonSafely(response);
    } catch (err) {
      throw err;
    }
    throw {
      kind: "unavailable",
      status: 503,
      message: payload?.error_message || "ASR service unavailable.",
      raw: payload,
    };
  }

  if (!response.ok) {
    let payload = null;
    try {
      payload = await readJsonSafely(response);
    } catch (err) {
      throw err;
    }
    throw {
      kind: "http",
      status: response.status,
      message: payload?.error_message || `ASR request failed with HTTP ${response.status}`,
      raw: payload,
    };
  }

  const payload = await readJsonSafely(response);
  if (!payload || typeof payload !== "object") {
    throw { kind: "invalid_response", raw: payload };
  }

  const transcript = pickTranscriptFromPayload(payload);
  if (!transcript) {
    throw { kind: "empty", raw: payload };
  }

  return transcript;
}