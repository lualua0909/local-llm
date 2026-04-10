import { FORMATS } from "../translator/formats.js";

const DEFAULT_POLICY = {
  enabled: true,
  targetInputTokens: 20000,
  reserveOutputTokens: 4000,
  minMessagesToCompact: 12,
  keepRecentMessages: 8,
  stablePrefixMessages: 4,
};

const IMAGE_TOKEN_COST = 256;

function estimateTextTokens(text) {
  if (!text || typeof text !== "string") return 0;
  return Math.ceil(text.length / 4);
}

function estimateContentTokens(content) {
  if (typeof content === "string") return estimateTextTokens(content);
  if (!Array.isArray(content)) return estimateTextTokens(JSON.stringify(content || ""));

  let tokens = 0;
  for (const part of content) {
    if (!part || typeof part !== "object") continue;
    if (part.type === "text" || part.type === "input_text" || part.type === "output_text") {
      tokens += estimateTextTokens(part.text || "");
      continue;
    }
    if (part.type === "image" || part.type === "image_url" || part.type === "input_image") {
      tokens += IMAGE_TOKEN_COST;
      continue;
    }
    tokens += estimateTextTokens(JSON.stringify(part));
  }
  return tokens;
}

function estimateMessageTokens(message) {
  if (!message || typeof message !== "object") return 0;
  let tokens = 6;
  tokens += estimateContentTokens(message.content);
  if (message.tool_calls) tokens += estimateTextTokens(JSON.stringify(message.tool_calls));
  if (message.name) tokens += estimateTextTokens(message.name);
  if (message.tool_call_id) tokens += estimateTextTokens(message.tool_call_id);
  return tokens;
}

function estimateInputItemTokens(item) {
  if (!item || typeof item !== "object") return 0;
  if (item.type === "message") return 6 + estimateContentTokens(item.content);
  if (item.type === "function_call") {
    return 6 + estimateTextTokens(item.name || "") + estimateTextTokens(item.arguments || "");
  }
  if (item.type === "function_call_output") return 6 + estimateTextTokens(JSON.stringify(item.output || ""));
  return 6 + estimateTextTokens(JSON.stringify(item));
}

function ensureDistinctSortedIndices(indices) {
  return [...new Set(indices)].sort((a, b) => a - b);
}

function resolvePolicy(overrides = {}) {
  const safe = overrides && typeof overrides === "object" ? overrides : {};
  return {
    enabled: safe.enabled ?? DEFAULT_POLICY.enabled,
    targetInputTokens: safe.targetInputTokens ?? DEFAULT_POLICY.targetInputTokens,
    reserveOutputTokens: safe.reserveOutputTokens ?? DEFAULT_POLICY.reserveOutputTokens,
    minMessagesToCompact: safe.minMessagesToCompact ?? DEFAULT_POLICY.minMessagesToCompact,
    keepRecentMessages: safe.keepRecentMessages ?? DEFAULT_POLICY.keepRecentMessages,
    stablePrefixMessages: safe.stablePrefixMessages ?? DEFAULT_POLICY.stablePrefixMessages,
  };
}

function compactMessages(body, policy) {
  if (!Array.isArray(body.messages)) return { body, changed: false, stats: null };
  const messages = body.messages;
  if (messages.length < policy.minMessagesToCompact) return { body, changed: false, stats: null };

  const budget = Math.max(1024, Number(policy.targetInputTokens) - Number(policy.reserveOutputTokens));
  const keepRecent = Math.max(2, Number(policy.keepRecentMessages) || DEFAULT_POLICY.keepRecentMessages);
  const stablePrefix = Math.max(0, Number(policy.stablePrefixMessages) || 0);

  const selected = new Set();

  // Always keep system messages + first stablePrefix non-system messages to stabilize cache prefix.
  let prefixKept = 0;
  for (let i = 0; i < messages.length; i++) {
    const role = messages[i]?.role;
    if (role === "system") {
      selected.add(i);
      continue;
    }
    if (prefixKept < stablePrefix) {
      selected.add(i);
      prefixKept += 1;
    }
  }

  // Always keep latest messages for immediate context continuity.
  for (let i = Math.max(0, messages.length - keepRecent); i < messages.length; i++) {
    selected.add(i);
  }

  let selectedIndices = ensureDistinctSortedIndices([...selected]);
  let usedTokens = selectedIndices.reduce((sum, idx) => sum + estimateMessageTokens(messages[idx]), 0);

  // Fill from newest to oldest until token budget is reached.
  for (let i = messages.length - 1; i >= 0 && usedTokens < budget; i--) {
    if (selected.has(i)) continue;
    const t = estimateMessageTokens(messages[i]);
    if (usedTokens + t > budget) continue;
    selected.add(i);
    usedTokens += t;
  }

  selectedIndices = ensureDistinctSortedIndices([...selected]);
  const compactedMessages = selectedIndices.map((idx) => messages[idx]);
  if (compactedMessages.length === messages.length) return { body, changed: false, stats: null };

  const originalTokens = messages.reduce((sum, msg) => sum + estimateMessageTokens(msg), 0);
  const compactedTokens = compactedMessages.reduce((sum, msg) => sum + estimateMessageTokens(msg), 0);

  return {
    body: { ...body, messages: compactedMessages },
    changed: true,
    stats: {
      strategy: "messages",
      beforeMessages: messages.length,
      afterMessages: compactedMessages.length,
      droppedMessages: messages.length - compactedMessages.length,
      estimatedInputTokensBefore: originalTokens,
      estimatedInputTokensAfter: compactedTokens,
      estimatedSavedTokens: Math.max(0, originalTokens - compactedTokens),
      budget,
      keepRecent,
      stablePrefix,
    },
  };
}

function compactResponsesInput(body, policy) {
  if (!Array.isArray(body.input)) return { body, changed: false, stats: null };
  const items = body.input;
  if (items.length < policy.minMessagesToCompact) return { body, changed: false, stats: null };

  const budget = Math.max(1024, Number(policy.targetInputTokens) - Number(policy.reserveOutputTokens));
  const keepRecent = Math.max(2, Number(policy.keepRecentMessages) || DEFAULT_POLICY.keepRecentMessages);
  const stablePrefix = Math.max(0, Number(policy.stablePrefixMessages) || 0);
  const selected = new Set();

  for (let i = 0; i < Math.min(stablePrefix, items.length); i++) {
    selected.add(i);
  }
  for (let i = Math.max(0, items.length - keepRecent); i < items.length; i++) {
    selected.add(i);
  }

  let selectedIndices = ensureDistinctSortedIndices([...selected]);
  let usedTokens = selectedIndices.reduce((sum, idx) => sum + estimateInputItemTokens(items[idx]), 0);

  for (let i = items.length - 1; i >= 0 && usedTokens < budget; i--) {
    if (selected.has(i)) continue;
    const t = estimateInputItemTokens(items[i]);
    if (usedTokens + t > budget) continue;
    selected.add(i);
    usedTokens += t;
  }

  selectedIndices = ensureDistinctSortedIndices([...selected]);
  const compactedInput = selectedIndices.map((idx) => items[idx]);
  if (compactedInput.length === items.length) return { body, changed: false, stats: null };

  const originalTokens = items.reduce((sum, item) => sum + estimateInputItemTokens(item), 0);
  const compactedTokens = compactedInput.reduce((sum, item) => sum + estimateInputItemTokens(item), 0);

  return {
    body: { ...body, input: compactedInput },
    changed: true,
    stats: {
      strategy: "responses-input",
      beforeMessages: items.length,
      afterMessages: compactedInput.length,
      droppedMessages: items.length - compactedInput.length,
      estimatedInputTokensBefore: originalTokens,
      estimatedInputTokensAfter: compactedTokens,
      estimatedSavedTokens: Math.max(0, originalTokens - compactedTokens),
      budget,
      keepRecent,
      stablePrefix,
    },
  };
}

export function compactContext(body, sourceFormat, policyOverrides = {}) {
  const policy = resolvePolicy(policyOverrides);
  if (!policy.enabled || !body || typeof body !== "object") {
    return { body, changed: false, stats: null };
  }

  if (Array.isArray(body.messages)) {
    return compactMessages(body, policy);
  }

  if (sourceFormat === FORMATS.OPENAI_RESPONSES && Array.isArray(body.input)) {
    return compactResponsesInput(body, policy);
  }

  return { body, changed: false, stats: null };
}
