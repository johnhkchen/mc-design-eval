// The shared bounded same-prompt re-ask over a BAML parse seam (T-130-01, story S-130,
// epic E-32) — the async-parse reply policy T-129's review anticipated for its third caller.
// Mirrors the T-114 judge-reply semantics WITHOUT touching that frozen module (its
// classifyReply is sync instrument surface; the bridge parse is async): every attempt is
// ledgered with usage, full raw texts are returned for committing, a parsed-AND-gated reply
// is final, transport throws are flagged, and the prompt is NEVER mutated between attempts
// (malformed ≠ verdict; the re-ask is same-prompt by contract).
//
// On top of bare parsing, `classify` lets the caller gate the PARSED object (the FX-D1
// leniency class: an all-array BAML class SAP-degrades any malformed reply to its empty
// union, so "parsed" alone is too weak — the consumer's gate decides what counts as a reply).
// A gate failure is MALFORMED and re-asks; it never throws.
//
// Transport happens HERE (the runner side of the E-32 Rule 2 split) — the bridge renders and
// parses but never transports. Both `transport` and `parse` are injectable so unit tests run
// spawn-free and spend-free.

import { MAX_REPLY_ATTEMPTS } from "../form/judge-reply.mjs";
import { requestText } from "../sdk-binding.mjs";
import { bamlParse } from "./bridge.mjs";

/** Raw-reply clip length for ledger entries (full texts travel separately in rawTexts). */
export const RAW_REPLY_CLIP = 400;

/**
 * Ask one rendered BAML prompt until a reply parses AND passes the caller's gate, within a
 * bounded same-prompt budget.
 * @param {{
 *   fn: string,                                   // BAML function name (for parse + messages)
 *   prompt: string,                               // the bridge-rendered prompt (never mutated)
 *   model: string,
 *   classify?: null | ((parsed: object) => {ok: true} | {ok: false, reason: string}),
 *   maxAttempts?: number,
 *   transport?: (p: {prompt: string, model: string}) => Promise<{text: string, raw: object}>,
 *   parse?: (p: {fn: string, text: string}) => Promise<object>,
 * }} p
 * @returns {Promise<{
 *   expected: object|null,                        // the accepted parsed reply, or null (refused)
 *   replies: Array<{attempt: number, parsed: boolean, rawReply: string|null, parseError?: string,
 *                   gateError?: string, transport?: true, usage: object|null, source: "live"}>,
 *   rawTexts: string[],                           // FULL raw texts, one per live ask (commit these)
 *   askCount: number,
 * }>}
 */
export async function askParsed({
  fn, prompt, model,
  classify = null,
  maxAttempts = MAX_REPLY_ATTEMPTS,
  transport = requestText,
  parse = bamlParse,
}) {
  const replies = [];
  const rawTexts = [];
  let expected = null;
  let askCount = 0;
  while (expected === null && replies.length < maxAttempts) {
    const attempt = replies.length + 1;
    askCount += 1;
    let text, raw;
    try {
      ({ text, raw } = await transport({ prompt, model }));
    } catch (e) {
      replies.push({ attempt, parsed: false, rawReply: null, parseError: `transport: ${e.message}`, transport: true, usage: null, source: "live" });
      continue;
    }
    rawTexts.push(text);
    const entry = { attempt, parsed: false, rawReply: text.slice(0, RAW_REPLY_CLIP), usage: raw?.usage ?? null, source: "live" };
    let parsed;
    try {
      parsed = await parse({ fn, text });
    } catch (e) {
      replies.push({ ...entry, parseError: e.message });
      continue;
    }
    const verdict = classify === null ? { ok: true } : classify(parsed);
    if (verdict.ok) {
      expected = parsed;
      replies.push({ ...entry, parsed: true });
    } else {
      replies.push({ ...entry, gateError: verdict.reason });
    }
  }
  return { expected, replies, rawTexts, askCount };
}
