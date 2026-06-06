// Robust JSON-object extraction for light-tier detector replies (T-082-01). The light tier sometimes
// wraps a valid object in a code fence AND then adds prose AFTER it ("```json\n{…}\n```\n\nLooking at…").
// `stripToJson` (sdk-binding) strips a LEADING fence and a TRAILING fence, but when the leftover starts
// with `{` it returns the whole tail unsliced — so trailing prose breaks JSON.parse. This helper adds a
// balanced-brace fallback: parse the stripped text, and on failure slice the FIRST balanced `{…}` (string-
// aware, so braces inside string values don't miscount) and parse that. PURE — unit-tested offline.

import { stripToJson } from "../sdk-binding.mjs";

/** First balanced top-level `{…}` substring (string/escape aware), or null. PURE. */
export function firstBalancedObject(s) {
  const str = String(s);
  const start = str.indexOf("{");
  if (start < 0) return null;
  let depth = 0, inStr = false, esc = false;
  for (let i = start; i < str.length; i++) {
    const ch = str[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === "\\") esc = true;
      else if (ch === '"') inStr = false;
    } else if (ch === '"') {
      inStr = true;
    } else if (ch === "{") {
      depth++;
    } else if (ch === "}") {
      depth--;
      if (depth === 0) return str.slice(start, i + 1);
    }
  }
  return null;
}

/**
 * Parse a model reply to a JSON value: `stripToJson` first (the repo convention), then a balanced-brace
 * fallback for fence-then-prose replies. Throws (message includes "not JSON") only when no object parses.
 * @param {string} text
 * @returns {*} the parsed value
 */
export function parseJsonReply(text) {
  const stripped = stripToJson(text);
  try {
    return JSON.parse(stripped);
  } catch (e) {
    for (const candidate of [firstBalancedObject(stripped), firstBalancedObject(text)]) {
      if (candidate != null) {
        try {
          return JSON.parse(candidate);
        } catch {
          /* try next */
        }
      }
    }
    throw new Error(`reply was not JSON (${e.message})`);
  }
}
