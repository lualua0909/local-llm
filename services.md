# Services

## Core Business Services

### `src/sse/handlers/chat.js`
- Purpose: top-level chat request orchestration for local app.
- Input: `Request` (+ optional raw request snapshot).
- Output: `Response` (stream or JSON).
- Responsibilities:
- parse JSON body, validate model.
- enforce API key requirement (`settings.requireApiKey`).
- resolve combo vs single model.
- perform account fallback loop via `getProviderCredentials` + `markAccountUnavailable`.
- delegate to `open-sse/handlers/chatCore.js`.

### `open-sse/handlers/chatCore.js`
- Purpose: shared core pipeline (local + cloud).
- Input: normalized `body`, `modelInfo`, provider `credentials`, callbacks.
- Output: `{ success, response, status?, error? }` style result.
- Responsibilities:
- detect source format and target format.
- optional passthrough for native tool/provider pair.
- request translation + executor call + refresh-on-401/403.
- stream/non-stream handling.
- usage/pending/log bookkeeping.

### `src/sse/services/auth.js`
- Purpose: credential selection and fallback state update.
- Input: `provider`, excluded IDs, optional `model`.
- Output: selected credentials or all-rate-limited descriptor.
- Responsibilities:
- provider account selection strategy (`fill-first` / `round-robin`).
- model-level lock/cooldown filtering.
- proxy settings resolution per connection.

### `open-sse/services/accountFallback.js`
- Purpose: fallback policy engine.
- Input: status/error/backoff level.
- Output: `{ shouldFallback, cooldownMs, newBackoffLevel? }`.
- Responsibilities: classify failures, compute cooldown, model-lock helpers.

## Persistence Services

### `src/lib/localDb.js`
- Purpose: primary app state store.
- Storage: `db.json`.
- Main entities:
- provider connections/nodes.
- proxy pools.
- model aliases.
- combos.
- API keys.
- settings.
- pricing overrides.
- Key I/O functions:
- `getProviderConnections(filter)` -> `Connection[]`.
- `createProviderConnection(data)` -> `Connection`.
- `getSettings()` / `updateSettings(updates)`.
- `getPricing()` / `updatePricing(data)` / resets.

### `src/lib/usageDb.js`
- Purpose: usage stats + request log persistence + SSE updates.
- Storage: `usage.json` + `log.txt`.
- Key I/O functions:
- `saveRequestUsage(entry)`.
- `getUsageStats(period)`.
- `getChartData(period)`.
- `appendRequestLog(...)`, `getRecentLogs(limit)`.
- `trackPendingRequest(...)`.

### `src/lib/requestDetailsDb.js`
- Purpose: request observability records with batching/truncation.
- Storage: `request-details.json`.
- Key I/O functions:
- `saveRequestDetail(detail)`.
- `getRequestDetails(filter)`.
- `getRequestDetailById(id)`.

## Startup/Runtime Services
- `src/shared/services/initializeApp.js`: app bootstrap, cleanup, tunnel watchdog/network monitor, MITM auto-start.
- `src/lib/initCloudSync.js`: one-time startup trigger wrapper for initializeApp.
- `src/lib/network/initOutboundProxy.js`: load persisted outbound proxy settings into process env.
- `src/shared/services/cloudSyncScheduler.js`: periodic `/api/sync/cloud` caller when enabled.

## Cloud Worker Services
- `cloud/src/handlers/chat.js`: cloud chat handling with machine-id/API-key auth + fallback.
- `cloud/src/handlers/embeddings.js`: cloud embeddings equivalent flow.
- `cloud/src/handlers/sync.js`: merge/sync machine data.
- `cloud/src/services/storage.js`: D1 read/write layer for `machines`.

## Service Quality Notes
- `open-sse/services/compact.js` appears unused vs `open-sse/services/combo.js`.
- Very large test helper `src/app/api/providers/[id]/test/testUtils.js` holds mixed concerns (provider probes + token refresh + proxy handling).
