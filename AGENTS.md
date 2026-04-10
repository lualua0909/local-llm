# AGENTS.md

## 1) Project Overview
- localllm is a local AI gateway + dashboard.
- It exposes OpenAI-compatible endpoints (`/v1/*`) and routes requests to many providers.
- Stack:
- Next.js App Router (React UI + API routes).
- `open-sse` shared routing/translation core.
- LowDB JSON persistence (`db.json`, `usage.json`, `request-details.json`).
- Optional Cloudflare Worker (`cloud/*`) for cloud sync/routing by machine ID.

## 2) Architecture Rules
- Keep `/v1/*` compatibility paths thin; business logic belongs in `src/sse/*` and `open-sse/*`.
- Use `src/lib/localDb.js` as single source of truth for app config/state.
- Preserve request translation path:
- detect source format -> translate -> execute provider call -> translate response.
- Account fallback/lock logic must stay centralized in auth + accountFallback services.
- Do not put provider-specific network logic in UI components.
- Do not bypass `open-sse/executors/*` for upstream provider calls unless adding a new core pattern.

## 3) Coding Conventions
- Language: JavaScript ESM.
- Import aliases: use `@/` for app modules, `open-sse/*` for shared core.
- Route handlers: export HTTP methods (`GET`, `POST`, etc.) from `route.js`.
- Response style: mostly `NextResponse.json(...)` in management routes.
- Naming:
- Providers as `provider/model` strings.
- Compatible providers use node IDs + prefixes.
- Keep new modules focused; avoid extending already huge files when possible.

## 4) Key Entry Points
- App init: `src/app/layout.js`.
- Dashboard root: `src/app/(dashboard)/dashboard/page.js`.
- Route guard: `src/proxy.js`, `src/dashboardGuard.js`.
- Main chat API: `src/app/api/v1/chat/completions/route.js`.
- Main chat handler: `src/sse/handlers/chat.js`.
- Core engine: `open-sse/handlers/chatCore.js`.
- Persistence: `src/lib/localDb.js`, `src/lib/usageDb.js`.
- Cloud worker entry: `cloud/src/index.js`.

## 5) How To Add New Features
- New provider support:
- Add provider metadata in `open-sse/config/providers.js` and model mapping files.
- Add specialized executor in `open-sse/executors/*` only if default executor is insufficient.
- Wire auth/token refresh in `open-sse/services/tokenRefresh.js` and local wrappers if needed.

- New management API:
- Add route under `src/app/api/.../route.js`.
- Reuse `localDb` CRUD helpers instead of direct file logic.
- Add client usage in dashboard page/components.

- New UI feature:
- Place reusable UI in `src/shared/components`.
- Keep API calls in page client/components, not in low-level design primitives.

- Avoid editing unless required:
- `open-sse/utils/cursorProtobuf.js` (specialized protocol implementation).
- Large legacy test/probe utility without adding tests (`providers/[id]/test/testUtils.js`).

## 6) API & Data Flow
- Main request flow:
- client -> `/v1/*` -> `src/sse/handlers/*` -> `open-sse/handlers/*Core` -> executor -> upstream.
- Persistence flow:
- config/state -> `db.json` via `localDb`.
- usage -> `usage.json` + `log.txt` via `usageDb`.
- request observability -> `request-details.json` via `requestDetailsDb`.
- Cloud sync flow:
- local `/api/sync/cloud` scheduler or manual calls -> `cloud/src/handlers/sync.js` -> D1 `machines` row.

## 7) Testing Guidelines
- Existing tests are under `tests/unit` and currently emphasize embeddings/cloud embeddings.
- Run tests:
- `cd tests && npm test`
- Environment note from repo docs: vitest path may rely on `/tmp/node_modules` setup.
- For risky core changes (translator/fallback/executors), add targeted unit tests before refactor.

## 8) Common Pitfalls
- Object key duplication risk in provider config (already present for `opencode`).
- Adding non-standard exports in route files (e.g., `GET_DEFAULTS`) does not create HTTP routes.
- Duplicated endpoints can drift (`/api/usage/logs` vs `/api/usage/request-logs`).
- Combo and alias resolution order is important; do not bypass `getModelInfo` / `getComboModels` flow.
- Sensitive fields are intentionally hidden in most provider APIs but exposed in `/api/providers/client` for sync.

## 9) Suggested Improvements
- Remove stale files: `page.new.js`, `.old.js`, and unused imports.
- Split oversized files into feature modules:
- `src/app/(dashboard)/dashboard/providers/page.js`.
- `src/app/api/providers/[id]/models/route.js`.
- `src/app/api/providers/[id]/test/testUtils.js`.
- Add lint rules/test checks for duplicate object keys and unused exports.
- Expand integration tests for chat fallback, token refresh, and translator compatibility endpoints.

## Additional Notes For AI Agents
- If a detail is not explicit in code, mark as `UNKNOWN` instead of inferring.
- Prioritize reading in this order when debugging:
- route entry (`src/app/api/.../route.js`)
- `src/sse/handlers/chat.js`
- `open-sse/handlers/chatCore.js`
- related executor + translator module
- persistence layer (`localDb`, `usageDb`)
