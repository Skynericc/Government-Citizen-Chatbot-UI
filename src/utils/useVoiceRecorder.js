import { useRef, useState, useCallback } from "react";

/* ------------------------------------------------------------------ */
/* Real microphone recording via the MediaRecorder API.                */
/* No backend: the recorded Blob is kept client-side as an object URL  */
/* so the citizen can play their own message back after sending it.   */
/*                                                                      */
/* When a backend ingestion endpoint exists, the caller (the main       */
/* component) should upload the Blob returned by finish() via the       */
/* uploadFile() utility, which would POST it to /api/attachments and    */
/* return a remoteId. That remoteId can then be stored alongside the    */
/* message for later referencing in chat completion requests.           */
/*                                                                      */
/* Expected real implementation, once a backend exists:                 */
/*                                                                      */
/*   // In CitizenAssistant.jsx, instead of directly appending the      */
/*   // local { url, blob } to the message, call uploadFile():          */
/*   //                                                                */
/*   //   import { uploadFile } from "./utils/Uploadservice.jsx";      */
/*   //   import { useVoiceRecorder } from "./utils/useVoiceRecorder"; */
/*   //                                                                */
/*   //   const sendRecording = async () => {                          */
/*   //     const result = await recorder.finish();                    */
/*   //     if (!result) return;                                       */
/*   //     const { url, blob, duration } = result;                    */
/*   //     try {                                                       */
/*   //       // 1. Upload the audio blob to the backend               */
/*   //       const serverResult = await uploadFile(                   */
/*   //         new File([blob], `recording-${Date.now()}.webm`, {     */
/*   //           type: blob.type || "audio/webm",                     */
/*   //         }),                                                     */
/*   //         { onProgress: (pct) => console.log("upload %", pct) }  */
/*   //       );                                                        */
/*   //       // 2. Pass the server response to sendMessage            */
/*   //       sendMessage("", {                                        */
/*   //         url,              // keep local URL for instant playback */
/*   //         remoteId: serverResult.remoteId, // backend reference   */
/*   //         duration,                                              */
/*   //       });                                                       */
/*   //     } catch (err) {                                             */
/*   //       console.error("Audio upload failed", err);               */
/*   //       // Optionally still send the message with local audio    */
/*   //       sendMessage("", { url, blob, duration });                */
/*   //     }                                                           */
/*   //   };                                                            */
/* ------------------------------------------------------------------ */

export function useVoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState("");

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const pendingActionRef = useRef(null); // "send" | "cancel"
  const resolveRef = useRef(null);

  const isSupported =
    typeof navigator !== "undefined" &&
    !!navigator.mediaDevices &&
    typeof window !== "undefined" &&
    !!window.MediaRecorder;

  const cleanupStream = () => {
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;
    clearInterval(timerRef.current);
  };

  const start = useCallback(async () => {
    setError("");
    if (!isSupported) {
      setError("unsupported");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const mimeCandidate = ["audio/webm", "audio/mp4", "audio/ogg"].find(
        (m) => window.MediaRecorder.isTypeSupported?.(m)
      );
      const recorder = new window.MediaRecorder(stream, mimeCandidate ? { mimeType: mimeCandidate } : undefined);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        cleanupStream();
        const action = pendingActionRef.current;
        pendingActionRef.current = null;
        if (action === "send" && chunksRef.current.length) {
          const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
          const url = URL.createObjectURL(blob);
          resolveRef.current?.({ url, blob, duration: seconds });
        } else {
          resolveRef.current?.(null);
        }
        resolveRef.current = null;
      };

      recorder.start();
      setIsRecording(true);
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch (err) {
      setError("permission");
    }
  }, [isSupported, seconds]);

  const stopWith = (action) =>
    new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      setIsRecording(false);
      if (!recorder || recorder.state === "inactive") {
        cleanupStream();
        resolve(null);
        return;
      }
      pendingActionRef.current = action;
      resolveRef.current = resolve;
      recorder.stop();
    });

  const cancel = useCallback(() => stopWith("cancel"), []);
  const finish = useCallback(() => stopWith("send"), []);

  return { isRecording, seconds, error, isSupported, start, cancel, finish };
}
