/* ------------------------------------------------------------------ */
/* Upload pipeline — CLIENT-SIDE PLACEHOLDER.                          */
/*                                                                      */
/* There is no backend yet. uploadFile() below simulates a real        */
/* network upload (progress events, latency, cancellation) so the UI   */
/* (progress rings, disabled send button while uploading, etc.) is     */
/* already wired the way it needs to be. When a backend exists, this   */
/* is the ONLY function that needs to change.                          */
/*                                                                      */
/* Expected real implementation, once an ingestion endpoint exists:    */
/*                                                                      */
/*   export function uploadFile(file, { onProgress, signal } = {}) {   */
/*     const form = new FormData();                                    */
/*     form.append("file", file, file.name);                           */
/*     return new Promise((resolve, reject) => {                       */
/*       const xhr = new XMLHttpRequest();                             */
/*       xhr.upload.onprogress = (e) => {                              */
/*         if (e.lengthComputable) onProgress?.((e.loaded/e.total)*100);*/
/*       };                                                             */
/*       xhr.onload = () => resolve(JSON.parse(xhr.responseText));     */
/*       // { remoteId, url, mimeType, ... } — whatever the LLM/ingest  */
/*       // endpoint returns so the attachment can later be referenced */
/*       // in a chat completion request (e.g. as a file/document part)*/
/*       xhr.onerror = () => reject(new Error("upload_failed"));       */
/*       signal?.addEventListener("abort", () => xhr.abort());         */
/*       xhr.open("POST", "/api/attachments");                         */
/*       xhr.send(form);                                               */
/*     });                                                              */
/*   }                                                                  */
/* ------------------------------------------------------------------ */

export function uploadFile(file, { onProgress, signal } = {}) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Upload cancelled", "AbortError"));
      return;
    }

    let loaded = 0;
    // Pretend larger files take a little longer, like a real upload would.
    const step = Math.max(6, 24 - Math.round(file.size / (512 * 1024)));

    const tick = () => {
      loaded = Math.min(100, loaded + step + Math.random() * 6);
      onProgress?.(Math.round(loaded));
      if (loaded >= 100) {
        cleanup();
        // TODO(backend): this mock payload stands in for whatever the
        // real ingestion endpoint returns (a durable file reference the
        // chat/completions call can later attach to a message so the
        // LLM can read this file or transcribe this recording).
        resolve({
          remoteId: `mock-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          uploadedAt: new Date().toISOString(),
        });
        return;
      }
      timeoutId = setTimeout(tick, 120);
    };

    let timeoutId = setTimeout(tick, 120);

    const onAbort = () => {
      cleanup();
      reject(new DOMException("Upload cancelled", "AbortError"));
    };
    const cleanup = () => {
      clearTimeout(timeoutId);
      signal?.removeEventListener("abort", onAbort);
    };

    signal?.addEventListener("abort", onAbort);
  });
}