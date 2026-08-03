/* ------------------------------------------------------------------ */
/* Client for the `tts` text-to-speech service — see                    */
/* contrat_api_frontend.pdf §3. Real implementation: when               */
/* VITE_TTS_URL is set, MessageActions.jsx uses this to synthesize      */
/* speech for the "Listen" button instead of the local no-op toggle.    */
/* ------------------------------------------------------------------ */

export const TTS_URL = import.meta.env.VITE_TTS_URL || "";

export function isTTSConfigured() {
  return Boolean(TTS_URL);
}

const MAX_TTS_CHARS = 3000; // matches the current frontend's own limit (§3.5)

/**
 * Strips Markdown down to plain, speakable text before sending it to the
 * TTS service (§3.5 — "bonne pratique, pas une exigence de l'API", but the
 * contract explicitly recommends it and notes the existing frontend also
 * truncates to 3000 chars, so we match that behaviour here).
 */
export function stripMarkdownForSpeech(markdown) {
  let text = markdown || "";

  text = text.replace(/```[\s\S]*?```/g, " ");          // fenced code blocks
  text = text.replace(/`([^`]+)`/g, "$1");                // inline code
  text = text.replace(/\[\[\d+\]\]/g, "");                // our own [[n]] citation markers
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");    // [text](url) -> text
  text = text.replace(/https?:\/\/\S+/g, "");             // bare URLs
  text = text.replace(/^#{1,6}\s+/gm, "");                // # headers
  text = text.replace(/^\s*-{3,}\s*$/gm, "");             // --- separators
  text = text.replace(/\*\*([^*]+)\*\*/g, "$1");          // **bold**
  text = text.replace(/\*([^*]+)\*/g, "$1");              // *italic*
  text = text.replace(/^\s*[-*]\s+/gm, "");               // bullet lists
  text = text.replace(/^\s*\d+\.\s+/gm, "");              // numbered lists
  text = text.replace(/^[ \t]*[|:\-]+[ \t]*$/gm, "");     // table separator rows (|---|---|)
  text = text.replace(/\|/g, " ");                        // remaining table pipes

  text = text.replace(/[ \t]+/g, " ").replace(/\n{2,}/g, "\n").trim();
  return text.slice(0, MAX_TTS_CHARS);
}

/**
 * Builds a short silent, mono, 16-bit PCM WAV Blob to send as speaker_wav
 * when no real user voice sample is available (contrat §3.2: "Envoyer un
 * WAV silencieux si aucune voix utilisateur n'est disponible").
 */
export function buildSilentWavBlob(durationSeconds = 1, sampleRate = 16000) {
  const numSamples = Math.floor(durationSeconds * sampleRate);
  const dataSize = numSamples * 2; // 16-bit mono = 2 bytes/sample
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeString = (offset, str) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);       // PCM chunk size
  view.setUint16(20, 1, true);        // format = PCM
  view.setUint16(22, 1, true);        // channels = mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // byte rate
  view.setUint16(32, 2, true);        // block align
  view.setUint16(34, 16, true);       // bits per sample
  writeString(36, "data");
  view.setUint32(40, dataSize, true);
  // Sample bytes are left at 0 = silence.

  return new Blob([buffer], { type: "audio/wav" });
}

/**
 * Synthesizes speech for a chat answer (contrat §3).
 *
 * @param {object} opts
 * @param {string} opts.text - raw Markdown; cleaned internally.
 * @param {string} [opts.language] - language code forwarded as-is; the
 *   contract only documents "ar" as the server default and doesn't
 *   enumerate accepted codes, so confirm fr/en/ar are all valid with the
 *   backend team before relying on this for non-Arabic answers.
 * @param {AbortSignal} [opts.signal]
 * @returns {Promise<{blob: Blob, url: string}>}
 * @throws {{kind: "empty"|"unavailable"|"inference"|"network"|"aborted", status?: number}}
 */
export async function synthesizeSpeech({ text, language = "fr", signal }) {
  const cleaned = stripMarkdownForSpeech(text);
  if (!cleaned) throw { kind: "empty" };

  const form = new FormData();
  form.append("text", cleaned);
  form.append("language", language);
  form.append("speaker_wav", buildSilentWavBlob(), "silence.wav");

  let response;
  try {
    response = await fetch(`${TTS_URL}/tts`, { method: "POST", body: form, signal });
  } catch (err) {
    if (err.name === "AbortError") throw { kind: "aborted" };
    throw { kind: "network", raw: err };
  }

  if (response.ok) {
    const blob = await response.blob();
    return { blob, url: URL.createObjectURL(blob) };
  }

  // Error mapping per contrat §3.4.
  if (response.status === 422) throw { kind: "empty", status: 422 };
  if ([503, 502, 504].includes(response.status)) throw { kind: "unavailable", status: response.status };
  throw { kind: "inference", status: response.status };
}
