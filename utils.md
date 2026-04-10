# Utils

## Shared Utils (`src/shared/utils`)
- `api.js`: thin fetch wrappers (`get/post/put/del`) with JSON error handling.
- `apiKey.js`: API key generation/parsing/CRC verify (`sk-{machineId}-{keyId}-{crc}`).
- `machineId.js`: stable machine id derivation from `node-machine-id` + salt.
- `cloud.js`: cloud URL composition + request forwarding helper (partially legacy/no-op sync helper).
- `clineAuth.js`: Cline-specific auth/header construction.
- `providerModelsFetcher.js`: fetch/cached suggested models from public model endpoints.
- `index.js`: utility exports (`generateId`, `getErrorCode`, `getRelativeTime`, `cn`).

## App Runtime Utilities (`src/lib`)
- `consoleLogBuffer.js`: capture server console logs into buffer + emitter.
- `network/outboundProxy.js`: apply outbound proxy env vars at runtime.
- `network/connectionProxy.js`: per-connection proxy resolution.
- `network/proxyTest.js`: proxy health testing.
- `9remoteManager.js`: spawn/process handle helpers for 9remote integration.
- `tunnel/*`: cloudflared lifecycle + tunnel state management.

## Core Routing Utils (`open-sse/utils`)
- `proxyFetch.js`: global/proxy-aware fetch support.
- `stream.js`, `streamHandler.js`, `streamHelpers.js`: SSE transformation, disconnect handling.
- `error.js`: normalized error payloads + upstream error parsing.
- `usageTracking.js`: usage extraction/normalization/estimation.
- `requestLogger.js`: optional deep request/response logging.
- `clientDetector.js`: detect client tool type and passthrough conditions.
- `bypassHandler.js`: bypass special requests (warmup/filter naming).
- `claudeCloaking.js`: tool-name cloaking for Claude-specific anti-ban behavior.

## Utility Risks / Notes
- `src/shared/utils/cloud.js` exports functions currently not fully used in main request flow.
- `open-sse/utils/cursorProtobuf.js` is large and specialized; high regression risk if edited without tests.
- `open-sse/utils/proxyFetch.js` is foundational; changes affect all provider calls.
