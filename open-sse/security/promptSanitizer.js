const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+instructions/gi,
  /disregard\s+(all\s+)?(prior|previous)\s+instructions/gi,
  /reveal\s+(the\s+)?system\s+prompt/gi,
  /show\s+(the\s+)?hidden\s+prompt/gi,
  /developer\s+message/gi,
  /jailbreak/gi
];

function sanitizeText(value) {
  if (typeof value !== "string") return value;
  let next = value;
  for (const pattern of INJECTION_PATTERNS) {
    next = next.replace(pattern, "[filtered]");
  }
  return next;
}

function sanitizeContentPart(part) {
  if (!part || typeof part !== "object") return part;
  const copy = { ...part };
  if (typeof copy.text === "string") copy.text = sanitizeText(copy.text);
  if (typeof copy.input_text === "string") copy.input_text = sanitizeText(copy.input_text);
  if (typeof copy.content === "string") copy.content = sanitizeText(copy.content);
  return copy;
}

function sanitizeMessage(message) {
  if (!message || typeof message !== "object") return message;
  const copy = { ...message };

  // Never rewrite system/developer content here; sanitize user-controlled payload only.
  if (copy.role === "user") {
    if (typeof copy.content === "string") {
      copy.content = sanitizeText(copy.content);
    } else if (Array.isArray(copy.content)) {
      copy.content = copy.content.map(sanitizeContentPart);
    }
  } else if (Array.isArray(copy.content)) {
    copy.content = copy.content.map(sanitizeContentPart);
  }

  return copy;
}

export function sanitizePromptInputs(body) {
  if (!body || typeof body !== "object") return body;
  const sanitized = { ...body };

  if (Array.isArray(sanitized.messages)) {
    sanitized.messages = sanitized.messages.map(sanitizeMessage);
  }

  if (Array.isArray(sanitized.input)) {
    sanitized.input = sanitized.input.map((item) => {
      if (!item || typeof item !== "object") return sanitizeText(item);
      const copy = { ...item };
      if ((copy.role === "user" || copy.type === "message") && typeof copy.content === "string") {
        copy.content = sanitizeText(copy.content);
      }
      if (Array.isArray(copy.content)) {
        copy.content = copy.content.map(sanitizeContentPart);
      }
      if (typeof copy.text === "string") copy.text = sanitizeText(copy.text);
      return copy;
    });
  }

  if (Array.isArray(sanitized.contents)) {
    sanitized.contents = sanitized.contents.map((entry) => {
      if (!entry || typeof entry !== "object") return entry;
      const copy = { ...entry };
      if (Array.isArray(copy.parts)) {
        copy.parts = copy.parts.map(sanitizeContentPart);
      }
      return copy;
    });
  }

  return sanitized;
}
