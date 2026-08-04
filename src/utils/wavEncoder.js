/* ------------------------------------------------------------------ */
/* Browser audio helpers for ASR upload. Converts MediaRecorder output  */
/* into 16-bit PCM mono WAV with the original sample rate preserved.    */
/* ------------------------------------------------------------------ */

function getAudioContext() {
  const AudioContextImpl = window.AudioContext || window.webkitAudioContext;
  return AudioContextImpl ? new AudioContextImpl() : null;
}

async function decodeAudioBlob(blob) {
  const audioContext = getAudioContext();
  if (!audioContext) throw new Error("AudioContextUnavailable");

  try {
    const arrayBuffer = await blob.arrayBuffer();
    return await audioContext.decodeAudioData(arrayBuffer.slice(0));
  } finally {
    await audioContext.close().catch(() => {});
  }
}

function writeString(view, offset, value) {
  for (let index = 0; index < value.length; index += 1) {
    view.setUint8(offset + index, value.charCodeAt(index));
  }
}

export function audioBufferToWavBlob(audioBuffer) {
  const sampleRate = audioBuffer.sampleRate;
  const channelCount = audioBuffer.numberOfChannels;
  const frameCount = audioBuffer.length;
  const dataSize = frameCount * 2;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const channelData = Array.from({ length: channelCount }, (_, index) => audioBuffer.getChannelData(index));

  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, "data");
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let frame = 0; frame < frameCount; frame += 1) {
    let sample = 0;
    for (let channel = 0; channel < channelCount; channel += 1) {
      sample += channelData[channel][frame] || 0;
    }
    sample /= channelCount || 1;
    const clamped = Math.max(-1, Math.min(1, sample));
    view.setInt16(offset, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
    offset += 2;
  }

  return new Blob([buffer], { type: "audio/wav" });
}

export async function convertAudioBlobToWavBlob(blob) {
  const audioBuffer = await decodeAudioBlob(blob);
  return audioBufferToWavBlob(audioBuffer);
}