# Structure

## Top-Level Directories
- `src/`: Main Next.js app source (UI, API routes, server services).
- `open-sse/`: Shared routing/translator/executor core used by local app and cloud worker.
- `cloud/`: Cloudflare Worker implementation for machine-id based cloud routing/sync.
- `tests/`: Vitest unit tests (currently focused on embeddings + cloud embeddings handler).
- `docs/`: architecture documentation (`ARCHITECTURE.md`).
- `public/`: static assets, provider icons, i18n literals.
- `scripts/`: utility scripts (e.g. README translation script).
- `tester/`: ad-hoc tester scripts.

## `src/` Breakdown
- `src/app/`: Next.js App Router pages and API routes.
- `src/app/(dashboard)/`: dashboard UI pages.
- `src/app/api/`: management APIs and compatibility APIs (`/v1*`, `/v1beta*`).
- `src/shared/components/`: reusable UI components + layouts.
- `src/shared/services/`: startup/sync scheduler services.
- `src/shared/utils/`: shared helpers (API client, machineId, API key helpers, etc.).
- `src/sse/`: app-side SSE handlers/services wrapping `open-sse` core.
- `src/lib/`: local DB, usage DB, OAuth helpers, tunnel/proxy/mitm integrations.
- `src/store/`: Zustand stores.
- `src/mitm/`: MITM server/certificate/runtime utilities.

## `open-sse/` Breakdown
- `config/`: provider metadata, model mappings, runtime constants.
- `executors/`: provider-specific upstream execution adapters.
- `handlers/`: core request handling (`chatCore`, `embeddingsCore`, `ttsCore`).
- `services/`: model parsing, provider format logic, fallback, token refresh, combo logic.
- `translator/`: request/response format converters.
- `utils/`: stream handling, logging, error handling, proxy-aware fetch.

## `cloud/` Breakdown
- `cloud/src/index.js`: Worker fetch router entry.
- `cloud/src/handlers/`: route handlers (`chat`, `embeddings`, `sync`, etc.).
- `cloud/src/services/storage.js`: D1 persistence for machine payload.
- `cloud/migrations/0001_init.sql`: D1 schema (`machines` table).

## Key Entry Points
- App runtime init: `src/app/layout.js` imports `@/lib/initCloudSync` and proxy init.
- Root redirect: `src/app/page.js` -> `/dashboard`.
- Auth/middleware-like guard: `src/proxy.js` + `src/dashboardGuard.js`.
- OpenAI-compatible API: `src/app/api/v1/*`.
- Gemini-compatible API: `src/app/api/v1beta/*`.
- Routing core entry: `src/sse/handlers/chat.js` -> `open-sse/handlers/chatCore.js`.
- Cloud worker entry: `cloud/src/index.js`.

## Notable Generated/Runtime Data Locations
- Main state DB: `${DATA_DIR}/db.json` (default `~/.localllm/db.json`).
- Usage DB/log: `${DATA_DIR}/usage.json`, `${DATA_DIR}/log.txt` (from current code path logic).
- Request details DB: `${DATA_DIR}/request-details.json`.
- Translator debug files: `logs/translator/*`.
