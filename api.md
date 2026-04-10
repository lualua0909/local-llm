# API

## Compatibility Endpoints (`/v1*`, `/v1beta*`)

### Core Chat/LLM
- `POST /v1/chat/completions`
- Request: OpenAI Chat format.
- Response: SSE or JSON (OpenAI-compatible), routed by model/provider.
- `POST /v1/messages`
- Request: Claude Messages format (also accepted via format detection).
- Response: translated to caller-compatible format.
- `POST /v1/responses`
- Request: OpenAI Responses format.
- Response: OpenAI Responses-compatible stream/json.
- `POST /v1/api/chat`
- Request: chat payload.
- Response: Ollama-style transformed output.

### Models / Utility
- `GET /v1/models`: merged active models + combos.
- `POST /v1/messages/count_tokens`: approximate token count (mock/heuristic).
- `GET /v1`: static legacy model list.

### Embeddings / Audio
- `POST /v1/embeddings`: OpenAI-compatible embeddings.
- `POST /v1/audio/speech`: OpenAI-compatible TTS.

### Gemini Compatibility
- `GET /v1beta/models`: Gemini-formatted model listing.
- `POST /v1beta/models/[...path]`: Gemini `generateContent` / `streamGenerateContent` compatibility bridge.

## Management API Domains (`/api/*`)

### Auth & Settings
- `POST /api/auth/login`, `POST /api/auth/logout`.
- `GET/PATCH /api/settings`.
- `GET /api/settings/require-login`.
- `GET/POST /api/settings/database` (db export/import).

### Provider Management
- `GET/POST /api/providers`.
- `GET/PUT/DELETE /api/providers/[id]`.
- `POST /api/providers/[id]/test`.
- `POST /api/providers/test-batch`.
- `GET /api/providers/[id]/models`.
- `POST /api/providers/[id]/test-models`.
- `POST /api/providers/validate`.
- `GET /api/providers/client` (includes sensitive fields for sync).

### Provider Nodes (Compatible Providers)
- `GET/POST /api/provider-nodes`.
- `PUT/DELETE /api/provider-nodes/[id]`.
- `POST /api/provider-nodes/validate`.

### OAuth Flows
- `GET/POST /api/oauth/[provider]/[action]` (authorize/exchange/device-code/poll).
- Provider-specific helpers:
- `/api/oauth/cursor/*`
- `/api/oauth/kiro/*`
- `/api/oauth/iflow/cookie`
- `/api/oauth/gitlab/pat`

### Models, Aliases, Combos, Keys, Pricing
- `GET/PUT /api/models`.
- `GET/PUT/DELETE /api/models/alias`.
- `GET/POST /api/combos`, `GET/PUT/DELETE /api/combos/[id]`.
- `GET/POST /api/keys`, `GET/PUT/DELETE /api/keys/[id]`.
- `GET/PATCH/DELETE /api/pricing`.
- `GET_DEFAULTS /api/pricing` export exists in code but not exposed as HTTP method by Next.js.

### Usage / Observability
- `GET /api/usage/stats`, `/api/usage/chart`, `/api/usage/history`.
- `GET /api/usage/stream` (SSE).
- `GET /api/usage/request-details`.
- `GET /api/usage/request-logs` and `GET /api/usage/logs` (duplicated behavior).
- `GET /api/usage/providers`, `GET /api/usage/[connectionId]`.

### Tunnel / Proxy / CLI Tools / Misc
- Tunnel: `POST /api/tunnel/enable`, `POST /api/tunnel/disable`, `GET /api/tunnel/status`.
- Proxy pools: `GET/POST /api/proxy-pools`, `GET/PUT/DELETE /api/proxy-pools/[id]`, `POST /api/proxy-pools/[id]/test`.
- CLI tools config endpoints under `/api/cli-tools/*` (claude/codex/copilot/droid/openclaw/opencode/antigravity-mitm).
- Translator debug endpoints under `/api/translator/*`.
- `GET /api/version`, `GET /api/init`, `POST /api/shutdown`, `POST /api/locale`, `OPTIONS/GET /api/tags`.

## Full Route Inventory (Method Map)
- `/api/9remote/install` :: `POST`
- `/api/9remote/start` :: `POST`
- `/api/9remote/status` :: `GET`
- `/api/auth/login` :: `POST`
- `/api/auth/logout` :: `POST`
- `/api/cli-tools/antigravity-mitm/alias` :: `GET`, `PUT`
- `/api/cli-tools/antigravity-mitm` :: `GET`, `POST`, `DELETE`, `PATCH`
- `/api/cli-tools/claude-settings` :: `GET`, `POST`, `DELETE`
- `/api/cli-tools/codex-settings` :: `GET`, `POST`, `DELETE`
- `/api/cli-tools/copilot-settings` :: `GET`, `POST`, `DELETE`
- `/api/cli-tools/droid-settings` :: `GET`, `POST`, `DELETE`
- `/api/cli-tools/openclaw-settings` :: `GET`, `POST`, `DELETE`
- `/api/cli-tools/opencode-settings` :: `GET`, `POST`, `PATCH`, `DELETE`
- `/api/cloud/auth` :: `POST`
- `/api/cloud/credentials/update` :: `PUT`
- `/api/cloud/model/resolve` :: `POST`
- `/api/cloud/models/alias` :: `PUT`, `GET`
- `/api/combos/[id]` :: `GET`, `PUT`, `DELETE`
- `/api/combos` :: `GET`, `POST`
- `/api/init` :: `GET`
- `/api/keys/[id]` :: `GET`, `PUT`, `DELETE`
- `/api/keys` :: `GET`, `POST`
- `/api/locale` :: `POST`
- `/api/media-providers/tts/elevenlabs/voices` :: `GET`
- `/api/media-providers/tts/voices` :: `GET`
- `/api/models/alias` :: `GET`, `PUT`, `DELETE`
- `/api/models/availability` :: `GET`, `POST`
- `/api/models` :: `GET`, `PUT`
- `/api/models/test` :: `POST`
- `/api/oauth/[provider]/[action]` :: `GET`, `POST`
- `/api/oauth/cursor/auto-import` :: `GET`
- `/api/oauth/cursor/import` :: `POST`, `GET`
- `/api/oauth/gitlab/pat` :: `POST`
- `/api/oauth/iflow/cookie` :: `POST`
- `/api/oauth/kiro/auto-import` :: `GET`
- `/api/oauth/kiro/import` :: `POST`
- `/api/oauth/kiro/social-authorize` :: `GET`
- `/api/oauth/kiro/social-exchange` :: `POST`
- `/api/pricing` :: `GET`, `PATCH`, `DELETE`, `GET_DEFAULTS`
- `/api/provider-nodes/[id]` :: `PUT`, `DELETE`
- `/api/provider-nodes` :: `GET`, `POST`
- `/api/provider-nodes/validate` :: `POST`
- `/api/providers/[id]/models` :: `GET`
- `/api/providers/[id]` :: `GET`, `PUT`, `DELETE`
- `/api/providers/[id]/test-models` :: `POST`
- `/api/providers/[id]/test` :: `POST`
- `/api/providers/client` :: `GET`
- `/api/providers/kilo/free-models` :: `GET`
- `/api/providers` :: `GET`, `POST`
- `/api/providers/test-batch` :: `POST`
- `/api/providers/validate` :: `POST`
- `/api/proxy-pools/[id]` :: `GET`, `PUT`, `DELETE`
- `/api/proxy-pools/[id]/test` :: `POST`
- `/api/proxy-pools` :: `GET`, `POST`
- `/api/settings/database` :: `GET`, `POST`
- `/api/settings/proxy-test` :: `POST`
- `/api/settings/require-login` :: `GET`
- `/api/settings` :: `GET`, `PATCH`
- `/api/shutdown` :: `POST`
- `/api/tags` :: `OPTIONS`, `GET`
- `/api/translator/console-logs` :: `GET`, `DELETE`
- `/api/translator/console-logs/stream` :: `GET`
- `/api/translator/load` :: `GET`
- `/api/translator/save` :: `POST`
- `/api/translator/send` :: `POST`
- `/api/translator/translate` :: `POST`
- `/api/tunnel/disable` :: `POST`
- `/api/tunnel/enable` :: `POST`
- `/api/tunnel/status` :: `GET`
- `/api/usage/[connectionId]` :: `GET`
- `/api/usage/chart` :: `GET`
- `/api/usage/history` :: `GET`
- `/api/usage/logs` :: `GET`
- `/api/usage/providers` :: `GET`
- `/api/usage/request-details` :: `GET`
- `/api/usage/request-logs` :: `GET`
- `/api/usage/stats` :: `GET`
- `/api/usage/stream` :: `GET`
- `/api/v1/api/chat` :: `OPTIONS`, `POST`
- `/api/v1/audio/speech` :: `OPTIONS`, `POST`
- `/api/v1/chat/completions` :: `OPTIONS`, `POST`
- `/api/v1/embeddings` :: `OPTIONS`, `POST`
- `/api/v1/messages/count_tokens` :: `OPTIONS`, `POST`
- `/api/v1/messages` :: `OPTIONS`, `POST`
- `/api/v1/models` :: `OPTIONS`, `GET`
- `/api/v1/responses` :: `OPTIONS`, `POST`
- `/api/v1` :: `OPTIONS`, `GET`
- `/api/v1beta/models/[...path]` :: `OPTIONS`, `POST`
- `/api/v1beta/models` :: `OPTIONS`, `GET`
- `/api/version` :: `GET`

## Request/Response Schema Confidence
- Core `/v1/*` schemas: high confidence (inspected handlers).
- Many dashboard management endpoints: medium confidence unless explicitly inspected.
- Uninspected per-route body details: `UNKNOWN`.
