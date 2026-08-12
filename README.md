# Idarati frontend

The active Idarati UI is a React application built with Vite and served by
Nginx on port `8000`.

## Production request flow

```text
Browser
  -> /api/agent/chat     -> Nginx -> agent:8100
  -> /api/asr/transcribe -> Nginx -> asr:8005
  -> /api/tts/tts        -> Nginx -> tts:9991
```

The browser uses same-origin `/api/*` paths. It never resolves Docker service
names and never receives backend credentials.

Nginx uses an exact route allowlist. It also permits the documented health
and Agent readiness checks, while `/docs`, `/openapi.json`, `/metrics`, and
all other backend routes return `404` through the frontend.

## Request safety

- Voice recording is limited to 25 seconds in the browser. Reaching the limit
  cancels and discards the recording; the user must record again.
- Agent, ASR and TTS enforce their own server-side text, history and upload
  bounds. The browser limit is only the first layer.
- Nginx overwrites client-supplied forwarding headers so browsers cannot pick
  their own Agent rate-limit identity.
- File attachments remain disabled because no secure ingestion contract is
  implemented for them.

## Frontend environment

Both local Vite and the production Docker build read
[`./.env`](.env). The committed production-safe values are:

| Variable | Default | Purpose |
|---|---|---|
| `VITE_AGENT_URL` | `/api/agent` | Streaming chat API |
| `VITE_ASR_URL` | `/api/asr` | Voice transcription API |
| `VITE_TTS_URL` | `/api/tts` | Speech synthesis API |
| `VITE_DEMO_MODE` | `false` | Disables canned production answers |
| `VITE_FILE_ATTACHMENTS_ENABLED` | `false` | Hides unsupported file uploads |
| `VITE_TOOL_CALLS_ENABLED` | `true` | Shows persistent Agent/MCP tool calls |

Vite embeds these values into the JavaScript bundle at build time. They are
public configuration and must never contain secrets. Changing the file
requires rebuilding the frontend image.

Tool calls are shown in detailed mode by default and remain attached to the
answer while it streams and after it completes. Citizen mode replaces the
individual calls with a short processing status. Cached answers show no tool
panel because they execute no tools.

To hide tool calls and the display-mode setting without removing code, change
this line in `frontend_service/.env`:

```dotenv
VITE_TOOL_CALLS_ENABLED=false
```

Then rebuild and recreate the frontend:

```bash
docker compose build frontend
docker compose up -d --no-deps frontend
```

## Production build

From the repository root:

```bash
docker compose build frontend
docker compose up -d --no-deps frontend
curl -fsS http://127.0.0.1:8000/healthz
```

On a Vault-enabled VM, use the complete deployment command in
[`../docs/frontend_cutover_runbook.md`](../docs/frontend_cutover_runbook.md)
instead of a partial service update.

If `agent`, `asr`, or `tts` is recreated by itself, recreate `frontend` after
it so Nginx resolves the backend's current Docker address.

## Local development

```bash
cd frontend_service
npm ci
npm run dev
```

The committed `.env` uses same-origin `/api/*` paths and therefore expects a
compatible reverse proxy. For direct local backend ports, copy `.env.example`
to `.env.local`; Vite gives `.env.local` precedence over `.env`.

## File attachments

The supplied UI contains attachment presentation code, but the Agent contract
does not accept file contents and no supported upload/ingestion endpoint exists.
The control is therefore hidden in production.

After a secure backend upload flow is implemented, restore the control with:

```bash
docker compose build \
  --build-arg VITE_FILE_ATTACHMENTS_ENABLED=true \
  frontend
```

Enabling the button alone does not make attachments readable by the Agent.

## Verification

- Hard-refresh the browser after deployment.
- Confirm text tokens stream and finish with a `done` event.
- Test language, theme, reset and stop controls.
- Test microphone transcription and TTS playback.
- Leave a recording running and confirm it is cancelled at 25 seconds.
- Confirm the attachment button is hidden.
- Confirm `/api/agent/docs`, `/api/agent/openapi.json`, and
  `/api/agent/metrics` return `404`.
- Check the browser console and `docker compose logs frontend agent`.

The TTS upstream currently lacks a compatible `/health` route. A proxy health
response of `503` is not sufficient to declare synthesis broken; test a real
Listen action.
