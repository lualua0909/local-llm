# Overview

## System Summary
- Project: **localllm** (Next.js app + routing core + optional Cloudflare Worker).
- Purpose: expose one OpenAI-compatible endpoint (`/v1/*`) and route requests to many providers with translation, fallback, token refresh, usage tracking.

## Main Languages & Stack
- Primary language: JavaScript (ESM), Node.js runtime.
- Frontend: Next.js App Router + React + Tailwind CSS + Zustand.
- Backend API: Next.js Route Handlers under `src/app/api/*`.
- Core routing engine: `src/sse/*` + shared package `open-sse/*`.
- Local persistence: `lowdb` JSON files.
- Optional cloud sync/runtime: Cloudflare Worker in `cloud/*` (D1 + KV).

## Architecture Type
- Main app: **modular monolith** (single Next.js process).
- Internal layering:
- Presentation/UI: `src/app/(dashboard)` + `src/shared/components`.
- API layer: `src/app/api/*`.
- Domain/persistence services: `src/lib/*`, `src/sse/services/*`.
- Routing/translation core: `open-sse/*`.
- Optional edge worker: `cloud/*`.

## Core Runtime Flow
1. Client calls `/v1/chat/completions`, `/v1/messages`, `/v1/responses`, `/v1/embeddings`, `/v1/audio/speech`.
2. Next.js route delegates to `src/sse/handlers/*`.
3. Handler resolves model/provider (supports aliases and combos).
4. Credentials selected from `localDb` (account fallback + model lock/cooldown logic).
5. `open-sse/handlers/chatCore.js` detects source format and translates request.
6. Executor (`open-sse/executors/*`) calls upstream provider.
7. Response stream/non-stream translated back to client format.
8. Usage/log/request-detail persisted via `src/lib/usageDb.js` + `src/lib/requestDetailsDb.js`.

## Module Dependency Map (High-Level)
- `src/app/api/v1/*` -> `src/sse/handlers/*` -> `open-sse/handlers/chatCore.js` -> `open-sse/executors/*`.
- `chatCore` -> `open-sse/translator/*` + `open-sse/services/*` + `src/lib/usageDb.js`.
- `src/sse/services/auth.js` -> `src/lib/localDb.js` + `open-sse/services/accountFallback.js`.
- Dashboard pages/components -> `/api/*` -> `src/lib/localDb.js`, `src/lib/usageDb.js`.
- `cloud/*` reuses `open-sse` and persists machine payload in D1 (`machines` table).

## Detected Issues / Risks (From Code)
- Dead/unused imports: `callCloudWithMachineId` imported in `src/app/api/v1/chat/completions/route.js` but not used.
- Unused route export: `GET_DEFAULTS` in `src/app/api/pricing/route.js` is not a Next.js HTTP method.
- Duplicate provider key: `opencode` is defined twice in `open-sse/config/providers.js` (later definition overrides earlier one).
- Probable stale files: `src/app/(dashboard)/dashboard/providers/[id]/page.new.js`, `open-sse/translator/request/openai-to-kiro.old.js`.
- Duplicate API behavior: `/api/usage/logs` and `/api/usage/request-logs` both return recent logs.
- Legacy/static endpoint: `src/app/api/v1/route.js` returns hardcoded models, not runtime model inventory.

## Improvement Directions
- Remove/merge stale files and unreachable exports.
- Add automated dead-code detection/lint rules for unused imports/duplicate object keys.
- Consolidate duplicate usage-log endpoints.
- Split large route files (`providers/page.js`, `providers/[id]/models/route.js`, `testUtils.js`) into smaller domain modules.
- Expand automated tests beyond embeddings path to auth/fallback/translator and critical provider routes.
