# Database

## Local Storage Overview

### 1. Main DB (`db.json`) via `src/lib/localDb.js`
- Path: `${DATA_DIR}/db.json` (default `~/.localllm/db.json`).
- Engine: `lowdb` (`JSONFile` adapter) + file lock (`proper-lockfile`).

#### Top-Level Schema
- `providerConnections: []`
- `providerNodes: []`
- `proxyPools: []`
- `modelAliases: {}`
- `mitmAlias: {}`
- `combos: []`
- `apiKeys: []`
- `settings: { ... }`
- `pricing: {}`

#### Important Entities
- `providerConnections[]`
- Keys: `id`, `provider`, `authType`, `name`, `priority`, `isActive`, auth tokens/apiKey, `providerSpecificData`, status/error fields, timestamps.
- Relationship: many connections can belong to one provider; fallback logic uses priority + lock fields.

- `providerNodes[]`
- Keys: `id`, `type` (`openai-compatible`/`anthropic-compatible`), `name`, `prefix`, `apiType`, `baseUrl`.
- Relationship: compatible provider connections reference node ID as provider ID.

- `proxyPools[]`
- Keys: `id`, `name`, `proxyUrl`, `noProxy`, `isActive`, `strictProxy`, test status fields.
- Relationship: linked from `providerConnections[].providerSpecificData.proxyPoolId`.

- `combos[]`
- Keys: `id`, `name`, `models[]`.
- Relationship: `model` input can reference combo name; resolved by chat handler.

- `apiKeys[]`
- Keys: `id`, `name`, `key`, `machineId`, `isActive`, `createdAt`.
- Relationship: validated on `/v1/*` when `requireApiKey` is enabled.

- `settings`
- Includes: login/tunnel/cloud/proxy/observability/fallback strategy flags and related config.

- `pricing`
- User override map merged with defaults in `shared/constants/pricing.js`.

### 2. Usage DB (`usage.json`) via `src/lib/usageDb.js`
- Path: `${DATA_DIR}/usage.json` (as implemented by current code path logic).
- Schema:
- `history: [UsageEntry]`
- `totalRequestsLifetime: number`

#### `UsageEntry` (observed)
- `timestamp`
- `provider`
- `model`
- `tokens` object (`prompt_tokens`, `completion_tokens`, etc.)
- `connectionId` (optional)
- `apiKey` (optional)
- `endpoint` (optional)
- `status` (optional)
- `cost` (stored at write time)

### 3. Log File (`log.txt`)
- Path: `${DATA_DIR}/log.txt`.
- Line format: datetime | model | provider | account | tokens sent | tokens received | status.

### 4. Request Details DB (`request-details.json`) via `src/lib/requestDetailsDb.js`
- Path: `${DATA_DIR}/request-details.json`.
- Schema:
- `{ records: [ { id, provider, model, connectionId, timestamp, status, latency, tokens, request, providerRequest, providerResponse, response } ] }`
- Includes truncation and max-size guards.

## Cloud Worker Storage

### D1 Schema (`cloud/migrations/0001_init.sql`)
- Table: `machines(machineId TEXT PRIMARY KEY, data TEXT NOT NULL, updatedAt TEXT NOT NULL)`.
- Index: `idx_machines_updatedAt(updatedAt)`.

### Stored Cloud Payload Shape (from `cloud/src/handlers/sync.js`)
- `providers: { [connectionId]: ProviderRecord }`
- `modelAliases: {}`
- `combos: []`
- `apiKeys: []`
- `updatedAt`

## Data Relationships (Practical)
- `providerConnections.provider` -> logical provider ID (or compatible node ID).
- `providerNodes.id` <-> `providerConnections.provider` for compatible providers.
- `proxyPools.id` -> `providerConnections.providerSpecificData.proxyPoolId`.
- `combos.models[]` reference `provider/model` strings.
- `usage.history.connectionId` -> `providerConnections.id`.
- `usage.history.apiKey` -> `apiKeys.key`.

## Known Data Notes
- `localDb` has schema-migration/shape-repair logic.
- `usageDb` and `requestDetailsDb` are separate files from main `db.json`.
- Password is stored hashed in `settings.password`.
